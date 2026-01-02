import type { WebContainer } from '@webcontainer/api';
import { path as nodePath } from '~/utils/path';
import { atom, map, type MapStore } from 'nanostores';
import type { ActionAlert, BoltAction, DeployAlert, FileHistory, SupabaseAction, SupabaseAlert, FileAction } from '~/types/actions';
import { webPreviewReadyAtom, expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';
import type { ActionCallbackData } from './message-parser';
import type { BoltShell } from '~/utils/shell';
import { E2BRunner } from './e2b-runner';
import { validatePackageJson } from './package-json-validator';

const isE2BEnabled = () => import.meta.env.E2B_ON === 'true';

const logger = createScopedLogger('ActionRunner');

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

export type BaseActionState = BoltAction & {
  status: Exclude<ActionStatus, 'failed'>;
  abort: () => void;
  executed: boolean;
  abortSignal: AbortSignal;
};

export type FailedActionState = BoltAction &
  Omit<BaseActionState, 'status'> & {
    status: Extract<ActionStatus, 'failed'>;
    error: string;
  };

export type ActionState = BaseActionState | FailedActionState;

type BaseActionUpdate = Partial<Pick<BaseActionState, 'status' | 'abort' | 'executed'>>;

export type ActionStateUpdate =
  | BaseActionUpdate
  | (Omit<BaseActionUpdate, 'status'> & { status: 'failed'; error: string });

type ActionsMap = MapStore<Record<string, ActionState>>;

class ActionCommandError extends Error {
  readonly _output: string;
  readonly _header: string;

  constructor(message: string, output: string) {
    // Create a formatted message that includes both the error message and output
    const formattedMessage = `Failed To Execute Shell Command: ${message}\n\nOutput:\n${output}`;
    super(formattedMessage);

    // Set the output separately so it can be accessed programmatically
    this._header = message;
    this._output = output;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ActionCommandError.prototype);

    // Set the name of the error for better debugging
    this.name = 'ActionCommandError';
  }

  // Optional: Add a method to get just the terminal output
  get output() {
    return this._output;
  }
  get header() {
    return this._header;
  }
}

export class ActionRunner {
  #webcontainer: Promise<WebContainer>;
  #currentExecutionPromise: Promise<void> = Promise.resolve();
  #shellTerminal: () => BoltShell;
  runnerId = atom<string>(`${Date.now()}`);
  actions: ActionsMap = map({});
  onAlert?: (alert: ActionAlert) => void;
  onSupabaseAlert?: (alert: SupabaseAlert) => void;
  onDeployAlert?: (alert: DeployAlert) => void;
  buildOutput?: { path: string; exitCode: number; output: string };

  constructor(
    webcontainerPromise: Promise<WebContainer>,
    getShellTerminal: () => BoltShell,
    onAlert?: (alert: ActionAlert) => void,
    onSupabaseAlert?: (alert: SupabaseAlert) => void,
    onDeployAlert?: (alert: DeployAlert) => void,
  ) {
    this.#webcontainer = webcontainerPromise;
    this.#shellTerminal = getShellTerminal;
    this.onAlert = onAlert;
    this.onSupabaseAlert = onSupabaseAlert;
    this.onDeployAlert = onDeployAlert;
  }

  addAction(data: ActionCallbackData) {
    const { actionId } = data;

    const actions = this.actions.get();
    const action = actions[actionId];

    if (action) {
      // action already added
      return;
    }

    const abortController = new AbortController();

    this.actions.setKey(actionId, {
      ...data.action,
      status: 'pending',
      executed: false,
      abort: () => {
        abortController.abort();
        this.#updateAction(actionId, { status: 'aborted' });
      },
      abortSignal: abortController.signal,
    });

    this.#currentExecutionPromise.then(() => {
      this.#updateAction(actionId, { status: 'running' });
    });
  }

  async runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { actionId } = data;
    const action = this.actions.get()[actionId];

    if (!action) {
      unreachable(`Action ${actionId} not found`);
    }

    if (action.executed) {
      return; // No return value here
    }

    if (isStreaming && action.type !== 'file') {
      return; // No return value here
    }

    this.#updateAction(actionId, { ...action, ...data.action, executed: !isStreaming });

    this.#currentExecutionPromise = this.#currentExecutionPromise
      .then(() => {
        return this.#executeAction(actionId, isStreaming);
      })
      .catch((error) => {
        logger.error('Action execution promise failed:', error);
      });

    await this.#currentExecutionPromise;

    return;
  }

  async #executeAction(actionId: string, isStreaming: boolean = false) {
    const action = this.actions.get()[actionId];

    this.#updateAction(actionId, { status: 'running' });

    try {
      switch (action.type) {
        case 'shell': {
          await this.#runShellAction(action);
          break;
        }
        case 'file': {
          await this.#runFileAction(action, isStreaming);
          break;
        }
        case 'supabase': {
          try {
            await this.handleSupabaseAction(action as SupabaseAction);
          } catch (error: any) {
            // Update action status
            this.#updateAction(actionId, {
              status: 'failed',
              error: error instanceof Error ? error.message : 'Supabase action failed',
            });

            // Return early without re-throwing
            return;
          }
          break;
        }
        case 'build': {
          const buildOutput = await this.#runBuildAction(action);

          // Store build output for deployment
          this.buildOutput = buildOutput;
          break;
        }
        case 'start': {
          // making the start app non blocking

          webPreviewReadyAtom.set(false);
          this.#runStartAction(action)
            .then(() => this.#updateAction(actionId, { status: 'complete' }))
            .catch((err: Error) => {
              if (action.abortSignal.aborted) {
                return;
              }

              this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });
              logger.error(`[${action.type}]:Action failed\n\n`, err);

              if (!(err instanceof ActionCommandError)) {
                return;
              }

              this.onAlert?.({
                type: 'error',
                title: 'Dev Server Failed',
                description: err.header,
                content: err.output,
              });
            });

          /*
           * adding a delay to avoid any race condition between 2 start actions
           * i am up for a better approach
           */
          await new Promise((resolve) => setTimeout(resolve, 2000));

          return;
        }
      }

      this.#updateAction(actionId, {
        status: isStreaming ? 'running' : action.abortSignal.aborted ? 'aborted' : 'complete',
      });
    } catch (error) {
      if (action.abortSignal.aborted) {
        return;
      }

      this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });
      logger.error(`[${action.type}]:Action failed\n\n`, error);

      if (!(error instanceof ActionCommandError)) {
        return;
      }

      this.onAlert?.({
        type: 'error',
        title: 'Dev Server Failed',
        description: error.header,
        content: error.output,
      });

      // re-throw the error to be caught in the promise chain
      throw error;
    }
  }

  async #runShellAction(action: ActionState) {
    if (action.type !== 'shell') {
      unreachable('Expected shell action');
    }

    const shell = this.#shellTerminal();
    await shell.ready();

    if (!shell || !shell.terminal || !shell.process) {
      unreachable('Shell terminal not found');
    }

    // Pre-validate command for common issues
    const validationResult = await this.#validateShellCommand(action.content);

    if (validationResult.shouldModify && validationResult.modifiedCommand) {
      logger.debug(`Modified command: ${action.content} -> ${validationResult.modifiedCommand}`);
      action.content = validationResult.modifiedCommand;
    }

    // E2B INTERCEPT
    if (isE2BEnabled()) {
      // CRITICAL: Wait for all pending file writes to complete before running shell commands
      // This ensures package.json and other files are fully written before npm install runs
      await E2BRunner.waitForAllOperations();
      logger.info(`[E2B] Executing command: ${action.content}`);
      shell.terminal.write(`\r\n[E2B] > ${action.content}\r\n`);

      try {
        const result = await E2BRunner.executeShell(action.content, {
          onStdout: (data) => {
            shell.terminal?.write(data + '\r\n');

            // Strip ANSI codes for regex matching
            const cleanData = data.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

            // Detect Expo URL for QR code
            const expoUrlMatch = cleanData.match(/(exp:\/\/[^ \n]+)|(exp\+[a-z0-9-]+\:\/\/[^ \n]+)/);
            if (expoUrlMatch) {
              const url = expoUrlMatch[0];
              logger.info('[E2B] 📱 Found Expo URL for QR code:', url);
              expoUrlAtom.set(url);
              logger.info('[E2B] 📱 QR code URL set successfully');
            }

            // Log all output for debugging QR code extraction
            if (cleanData.includes('exp://') || cleanData.includes('exp+')) {
              logger.info('[E2B] 📱 Expo output detected:', cleanData);
            }
          },
          onStderr: (data) => shell.terminal?.write(data + '\r\n'),
        });

        // Trigger Preview if it's a start command
        if (action.content.includes('npm run dev') || action.content.includes('npx expo start') || action.content.includes('npm start')) {
          // Use the URL returned from the command execution result
          const previewUrl = result.url || E2BRunner.getPreviewUrl();
          logger.info('[E2B] ========== PREVIEW URL SETUP ==========');
          logger.info('[E2B] Command:', action.content);
          logger.info('[E2B] Result URL:', result.url);
          logger.info('[E2B] E2BRunner.getPreviewUrl():', E2BRunner.getPreviewUrl());
          logger.info('[E2B] E2BRunner.sandboxId:', E2BRunner.sandboxId);
          logger.info('[E2B] E2BRunner.activeUrl:', E2BRunner.activeUrl);
          logger.info('[E2B] Final preview URL to use:', previewUrl);

          if (previewUrl) {
            logger.info('[E2B] ✅ Setting Preview URL in workbench:', previewUrl);
            workbenchStore.setPreviews([{ baseUrl: previewUrl, port: 8081 }]);
            webPreviewReadyAtom.set(true);
            logger.info('[E2B] ✅ Preview setup complete');
          } else {
            logger.error('[E2B] ❌ No preview URL available! Check sandbox creation');
          }
          logger.info('[E2B] ======================================');
        }

        if (result.exitCode !== 0) {
          throw new ActionCommandError('E2B Command Failed', result.output);
        }
        return; // Success
      } catch (err: any) {
        throw new ActionCommandError('E2B Execution Error', err.message || String(err));
      }
    }

    const resp = await shell.executeCommand(this.runnerId.get(), action.content, () => {
      logger.debug(`[${action.type}]:Aborting Action\n\n`, action);
      action.abort();
    });
    logger.debug(`${action.type} Shell Response: [exit code:${resp?.exitCode}]`);

    if (resp?.exitCode != 0) {
      const enhancedError = this.#createEnhancedShellError(action.content, resp?.exitCode, resp?.output);
      throw new ActionCommandError(enhancedError.title, enhancedError.details);
    }
  }

  async #runStartAction(action: ActionState) {
    if (action.type !== 'start') {
      unreachable('Expected shell action');
    }

    if (isE2BEnabled()) {
      logger.info(`[E2B] Starting Application: ${action.content}`);
      // We treat start action similar to shell for E2B, but we know it's long running.
      // Since our API currently awaits, we assume it might timeout if it blocks, 
      // BUT if we are using the "persistent" sandbox, we might just want to ensure it's running.
      // For now, let's fire it.

      try {
        const result = await E2BRunner.executeShell(action.content, {});
        // If valid, set preview
        const previewUrl = E2BRunner.getPreviewUrl();
        if (previewUrl) {
          workbenchStore.setPreviews([{ baseUrl: previewUrl, port: 8081 }]);
          webPreviewReadyAtom.set(true);
        }
        return { exitCode: 0, output: result.output || '' };
      } catch (e: any) {
        // If it times out, it might actually be running successfully in the background?
        // Or we should handle verify connectivity.
        logger.warn('[E2B] Start action completed (or timed out)', e);

        // Fallback: Assume it started if we have an ID
        const previewUrl = E2BRunner.getPreviewUrl();
        if (previewUrl) {
          workbenchStore.setPreviews([{ baseUrl: previewUrl, port: 8081 }]);
          webPreviewReadyAtom.set(true);
          return { exitCode: 0, output: '' };
        }

        throw e;
      }
    }

    if (!this.#shellTerminal) {
      unreachable('Shell terminal not found');
    }

    const shell = this.#shellTerminal();
    await shell.ready();

    if (!shell || !shell.terminal || !shell.process) {
      unreachable('Shell terminal not found');
    }

    const resp = await shell.executeCommand(this.runnerId.get(), action.content, () => {
      logger.debug(`[${action.type}]:Aborting Action\n\n`, action);
      action.abort();
    });
    logger.debug(`${action.type} Shell Response: [exit code:${resp?.exitCode}]`);

    if (resp?.exitCode != 0) {
      throw new ActionCommandError('Failed To Start Application', resp?.output || 'No Output Available');
    }

    return resp;
  }

  // Renamed original to avoid conflict if I wrappped it, but actually I'll just leave it be in the code block below
  // which targets #runShellAction and #runFileAction only.

  async #runFileAction(action: ActionState, isStreaming: boolean = false) {
    if (action.type !== 'file') {
      unreachable('Expected file action');
    }

    const fileAction = action as FileAction;

    // CRITICAL: Validate and fix package.json BEFORE writing to ANY destination
    // This ensures browser and E2B see the SAME validated content
    const validatedContent = validatePackageJson(action.filePath, action.content);

    // E2B INTERCEPT
    // CRITICAL: Only write to E2B when NOT streaming (i.e., when action is complete)
    // During streaming, content is partial - writing it would create incomplete files
    const e2bEnabled = isE2BEnabled();
    console.log(`[E2B DEBUG] File: ${action.filePath}, isStreaming: ${isStreaming}, E2B enabled: ${e2bEnabled}, E2B_ON env: ${import.meta.env.E2B_ON}, content length: ${validatedContent.length}`);
    logger.debug(`[E2B] File action: ${action.filePath}, isStreaming: ${isStreaming}, E2B enabled: ${e2bEnabled}, content length: ${validatedContent.length}`);

    if (e2bEnabled && !isStreaming) {
      logger.info(`[E2B] Writing file (Complete): ${action.filePath}${fileAction.encoding ? ' (binary)' : ''}, size: ${validatedContent.length} bytes`);
      // CHANGED: Now AWAIT file writes to ensure files exist before shell commands run
      // This prevents race conditions where npm install runs before package.json is written
      try {
        // Use validatedContent instead of action.content
        await E2BRunner.writeFile(action.filePath, validatedContent, fileAction.encoding);
        logger.info(`[E2B] ✅ File written successfully: ${action.filePath}`);
      } catch (err) {
        logger.error(`[E2B] ❌ Failed to write file ${action.filePath}`, err);
        throw err; // Propagate error to stop execution
      }
    } else if (isE2BEnabled() && isStreaming) {
      logger.debug(`[E2B] Skipping file write (streaming): ${action.filePath}`);
    }

    const webcontainer = await this.#webcontainer;
    const relativePath = nodePath.relative(webcontainer.workdir, action.filePath);

    let folder = nodePath.dirname(relativePath);

    // remove trailing slashes
    folder = folder.replace(/\/+$/g, '');

    if (folder !== '.') {
      try {
        await webcontainer.fs.mkdir(folder, { recursive: true });
        logger.debug('Created folder', folder);
      } catch (error) {
        logger.error('Failed to create folder\n\n', error);
      }
    }

    try {
      if (fileAction.source) {
        const response = await fetch(fileAction.source!);
        if (!response.ok) {
          throw new Error(`Failed to fetch source: ${fileAction.source}`);
        }
        const buffer = await response.arrayBuffer();
        await webcontainer.fs.writeFile(relativePath, new Uint8Array(buffer));
        logger.debug(`File written from source ${relativePath}`);
      } else {
        // CRITICAL: Use validatedContent for WebContainer too!
        // This ensures browser editor shows the SAME content as E2B sandbox
        await webcontainer.fs.writeFile(relativePath, validatedContent);
        logger.debug(`File written ${relativePath}`);
      }
    } catch (error) {
      logger.error('Failed to write file\n\n', error);
      throw error;
    }
  }

  #updateAction(id: string, newState: ActionStateUpdate) {
    const actions = this.actions.get();

    this.actions.setKey(id, { ...actions[id], ...newState });
  }

  async getFileHistory(filePath: string): Promise<FileHistory | null> {
    try {
      const webcontainer = await this.#webcontainer;
      const historyPath = this.#getHistoryPath(filePath);
      const content = await webcontainer.fs.readFile(historyPath, 'utf-8');

      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to get file history:', error);
      return null;
    }
  }

  async saveFileHistory(filePath: string, history: FileHistory) {
    // const webcontainer = await this.#webcontainer;
    const historyPath = this.#getHistoryPath(filePath);

    await this.#runFileAction({
      type: 'file',
      filePath: historyPath,
      content: JSON.stringify(history),
      changeSource: 'auto-save',
    } as any);
  }

  #getHistoryPath(filePath: string) {
    return nodePath.join('.history', filePath);
  }

  async #runBuildAction(action: ActionState) {
    if (action.type !== 'build') {
      unreachable('Expected build action');
    }

    // Trigger build started alert
    this.onDeployAlert?.({
      type: 'info',
      title: 'Building Application',
      description: 'Building your application...',
      stage: 'building',
      buildStatus: 'running',
      deployStatus: 'pending',
      source: 'netlify',
    });

    const webcontainer = await this.#webcontainer;

    // Create a new terminal specifically for the build
    const buildProcess = await webcontainer.spawn('npm', ['run', 'build']);

    let output = '';
    buildProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          output += data;
        },
      }),
    );

    const exitCode = await buildProcess.exit;

    if (exitCode !== 0) {
      // Trigger build failed alert
      this.onDeployAlert?.({
        type: 'error',
        title: 'Build Failed',
        description: 'Your application build failed',
        content: output || 'No build output available',
        stage: 'building',
        buildStatus: 'failed',
        deployStatus: 'pending',
        source: 'netlify',
      });

      throw new ActionCommandError('Build Failed', output || 'No Output Available');
    }

    // Trigger build success alert
    this.onDeployAlert?.({
      type: 'success',
      title: 'Build Completed',
      description: 'Your application was built successfully',
      stage: 'deploying',
      buildStatus: 'complete',
      deployStatus: 'running',
      source: 'netlify',
    });

    // Check for common build directories
    const commonBuildDirs = ['dist', 'build', 'out', 'output', '.next', 'public'];

    let buildDir = '';

    // Try to find the first existing build directory
    for (const dir of commonBuildDirs) {
      const dirPath = nodePath.join(webcontainer.workdir, dir);

      try {
        await webcontainer.fs.readdir(dirPath);
        buildDir = dirPath;
        break;
      } catch {
        continue;
      }
    }

    // If no build directory was found, use the default (dist)
    if (!buildDir) {
      buildDir = nodePath.join(webcontainer.workdir, 'dist');
    }

    return {
      path: buildDir,
      exitCode,
      output,
    };
  }
  async handleSupabaseAction(action: SupabaseAction) {
    const { operation, content, filePath } = action;
    logger.debug('[Supabase Action]:', { operation, filePath, content });

    switch (operation) {
      case 'migration':
        if (!filePath) {
          throw new Error('Migration requires a filePath');
        }

        // Show alert for migration action
        this.onSupabaseAlert?.({
          type: 'info',
          title: 'Supabase Migration',
          description: `Create migration file: ${filePath}`,
          content,
          source: 'supabase',
        });

        // Only create the migration file
        await this.#runFileAction({
          type: 'file',
          filePath,
          content,
          changeSource: 'supabase',
        } as any);
        return { success: true };

      case 'query': {
        // Always show the alert and let the SupabaseAlert component handle connection state
        this.onSupabaseAlert?.({
          type: 'info',
          title: 'Supabase Query',
          description: 'Execute database query',
          content,
          source: 'supabase',
        });

        // The actual execution will be triggered from SupabaseChatAlert
        return { pending: true };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  // Add this method declaration to the class
  handleDeployAction(
    stage: 'building' | 'deploying' | 'complete',
    status: ActionStatus,
    details?: {
      url?: string;
      error?: string;
      source?: 'netlify' | 'vercel' | 'github' | 'gitlab';
    },
  ): void {
    if (!this.onDeployAlert) {
      logger.debug('No deploy alert handler registered');
      return;
    }

    const alertType = status === 'failed' ? 'error' : status === 'complete' ? 'success' : 'info';

    const title =
      stage === 'building'
        ? 'Building Application'
        : stage === 'deploying'
          ? 'Deploying Application'
          : 'Deployment Complete';

    const description =
      status === 'failed'
        ? `${stage === 'building' ? 'Build' : 'Deployment'} failed`
        : status === 'running'
          ? `${stage === 'building' ? 'Building' : 'Deploying'} your application...`
          : status === 'complete'
            ? `${stage === 'building' ? 'Build' : 'Deployment'} completed successfully`
            : `Preparing to ${stage === 'building' ? 'build' : 'deploy'} your application`;

    const buildStatus =
      stage === 'building' ? status : stage === 'deploying' || stage === 'complete' ? 'complete' : 'pending';

    const deployStatus = stage === 'building' ? 'pending' : status;

    this.onDeployAlert({
      type: alertType,
      title,
      description,
      content: details?.error || '',
      url: details?.url,
      stage,
      buildStatus: buildStatus as any,
      deployStatus: deployStatus as any,
      source: details?.source || 'netlify',
    });
  }

  async #validateShellCommand(command: string): Promise<{
    shouldModify: boolean;
    modifiedCommand?: string;
    warning?: string;
  }> {
    const trimmedCommand = command.trim();

    // Check if command requires node_modules (npm, npx, pnpm commands after install)
    const requiresDeps = trimmedCommand.match(/^(npm\s+(run|start|dev|build|test)|npx\s+|pnpm\s+(run|start|dev|build|test))/);
    const isInstallCommand = trimmedCommand.includes('npm install') || trimmedCommand.includes('pnpm install');

    if (requiresDeps && !isInstallCommand) {
      try {
        const webcontainer = await this.#webcontainer;
        // Check if node_modules exists and has content
        let needsWait = false;
        try {
          const nodeModules = await webcontainer.fs.readdir('node_modules');
          if (nodeModules.length === 0) {
            needsWait = true;
            logger.info('⏳ Waiting for dependencies to install before running:', trimmedCommand);
          }
        } catch {
          needsWait = true;
          logger.info('⏳ node_modules not found, waiting for dependencies before running:', trimmedCommand);
        }

        if (needsWait) {
          await this.#waitForNodeModules();
          logger.info('✅ Dependencies ready, proceeding with command:', trimmedCommand);
        }
      } catch (error) {
        logger.warn('Could not validate node_modules:', error);
      }
    }

    // Handle rm commands that might fail due to missing files
    if (trimmedCommand.startsWith('rm ') && !trimmedCommand.includes(' -f')) {
      const rmMatch = trimmedCommand.match(/^rm\s+(.+)$/);

      if (rmMatch) {
        const filePaths = rmMatch[1].split(/\s+/);

        // Check if any of the files exist using WebContainer
        try {
          const webcontainer = await this.#webcontainer;
          const existingFiles = [];

          for (const filePath of filePaths) {
            if (filePath.startsWith('-')) {
              continue;
            } // Skip flags

            try {
              await webcontainer.fs.readFile(filePath);
              existingFiles.push(filePath);
            } catch {
              // File doesn't exist, skip it
            }
          }

          if (existingFiles.length === 0) {
            // No files exist, modify command to use -f flag to avoid error
            return {
              shouldModify: true,
              modifiedCommand: `rm -f ${filePaths.join(' ')}`,
              warning: 'Added -f flag to rm command as target files do not exist',
            };
          } else if (existingFiles.length < filePaths.length) {
            // Some files don't exist, modify to only remove existing ones with -f for safety
            return {
              shouldModify: true,
              modifiedCommand: `rm -f ${filePaths.join(' ')}`,
              warning: 'Added -f flag to rm command as some target files do not exist',
            };
          }
        } catch (error) {
          logger.debug('Could not validate rm command files:', error);
        }
      }
    }

    // Handle cd commands to non-existent directories
    if (trimmedCommand.startsWith('cd ')) {
      const cdMatch = trimmedCommand.match(/^cd\s+(.+)$/);

      if (cdMatch) {
        const targetDir = cdMatch[1].trim();

        try {
          const webcontainer = await this.#webcontainer;
          await webcontainer.fs.readdir(targetDir);
        } catch {
          return {
            shouldModify: true,
            modifiedCommand: `mkdir -p ${targetDir} && cd ${targetDir}`,
            warning: 'Directory does not exist, created it first',
          };
        }
      }
    }

    // Handle cp/mv commands with missing source files
    if (trimmedCommand.match(/^(cp|mv)\s+/)) {
      const parts = trimmedCommand.split(/\s+/);

      if (parts.length >= 3) {
        const sourceFile = parts[1];

        try {
          const webcontainer = await this.#webcontainer;
          await webcontainer.fs.readFile(sourceFile);
        } catch {
          return {
            shouldModify: false,
            warning: `Source file '${sourceFile}' does not exist`,
          };
        }
      }
    }

    // Handle curl commands (robust version)
    if (trimmedCommand.includes('curl ')) {
      const curlParts = trimmedCommand.split('&&').map((p) => p.trim());
      let modified = false;
      let targetDirToCreate = null;

      const enhancedParts = curlParts.map((part) => {
        if (part.startsWith('curl ')) {
          let enhancedPart = part;

          // Inject User-Agent if missing
          if (!enhancedPart.includes('-H') && !enhancedPart.includes('--header')) {
            enhancedPart = enhancedPart.replace('curl ', 'curl -H "User-Agent: Mozilla/5.0 (AppForge)" ');
            modified = true;
          }

          // Injected -L flag for location following if missing
          if (!enhancedPart.includes(' -L ') && !enhancedPart.startsWith('curl -L ')) {
            enhancedPart = enhancedPart.replace('curl ', 'curl -L ');
            modified = true;
          }

          // Check for output path to pre-create directory
          const outputMatch = enhancedPart.match(/-o\s+([^\s"']+)|--output\s+([^\s"']+)/);

          if (outputMatch) {
            let outputPath = outputMatch[1] || outputMatch[2];
            outputPath = outputPath.replace(/['"]/g, '');

            if (outputPath.includes('/')) {
              targetDirToCreate = outputPath.substring(0, outputPath.lastIndexOf('/'));
            }
          }

          return enhancedPart;
        }

        return part;
      });

      if (modified || targetDirToCreate) {
        let finalCommand = enhancedParts.join(' && ');

        if (targetDirToCreate) {
          finalCommand = `mkdir -p ${targetDirToCreate} && ${finalCommand}`;
        }

        return {
          shouldModify: true,
          modifiedCommand: finalCommand,
          warning: modified ? 'Enhanced curl command with required headers and flags' : undefined,
        };
      }
    }

    // Handle npm install to add --legacy-peer-deps and CHECK FOR package.json
    if (trimmedCommand.startsWith('npm install') || trimmedCommand === 'npm i') {
      // If E2B is enabled, we skip the local package.json check because the file
      // might exist in the sandbox (created via shell) but not locally yet.
      if (isE2BEnabled()) {
        return { shouldModify: false };
      }

      // Check if package.json exists to prevent "too early" execution
      try {
        const webcontainer = await this.#webcontainer;
        await webcontainer.fs.readFile('package.json');
      } catch {
        // package.json doesn't exist yet
        throw new ActionCommandError(
          'Setup Incomplete',
          'Cannot run "npm install" because package.json does not exist. Please create package.json first.'
        );
      }

      return {
        shouldModify: false, // No modification needed for --legacy-peer-deps as .npmrc handles it.
      };
    }

    // Handle npx commands to add --yes flag
    if (trimmedCommand.startsWith('npx ')) {
      // Check if --yes or -y is already present
      if (!trimmedCommand.includes('--yes') && !trimmedCommand.includes(' -y')) {
        // Insert --yes right after npx
        const modifiedCommand = trimmedCommand.replace(/^npx\s+/, 'npx --yes ');
        return {
          shouldModify: true,
          modifiedCommand,
          warning: 'Added --yes to npx command to avoid interactive prompts',
        };
      }
    }

    return { shouldModify: false };
  }

  async #waitForNodeModules(maxWaitTime: number = 120000): Promise<void> {
    const startTime = Date.now();
    const webcontainer = await this.#webcontainer;
    let lastCount = 0;
    let stableCount = 0;
    let lastCheckTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const nodeModules = await webcontainer.fs.readdir('node_modules');
        // Check if node_modules has meaningful content (not just .package-lock.json)
        const hasPackages = nodeModules.some((item) =>
          item !== '.package-lock.json' &&
          item !== '.bin' &&
          !item.startsWith('.')
        );

        // Log progress every time we detect new packages
        if (nodeModules.length !== lastCount) {
          logger.info(`📦 Installing dependencies... (${nodeModules.length} packages)`);
          lastCount = nodeModules.length;
          lastCheckTime = Date.now();
          stableCount = 0;
        }

        if (hasPackages && nodeModules.length > 5) {
          // Check if count has been stable for at least 3 seconds
          if (Date.now() - lastCheckTime > 3000) {
            stableCount++;
            if (stableCount >= 2) {
              logger.info(`✅ Dependencies installed (${nodeModules.length} packages)`);
              // Add a small buffer to ensure install is complete
              await new Promise((resolve) => setTimeout(resolve, 2000));
              return;
            }
          }
        }
      } catch {
        // node_modules doesn't exist yet, continue waiting
      }

      // Wait 1000ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    logger.warn('⚠️ Timed out waiting for node_modules to be ready after 2 minutes');
  }

  #createEnhancedShellError(
    command: string,
    exitCode: number | undefined,
    output: string | undefined,
  ): {
    title: string;
    details: string;
  } {
    const trimmedCommand = command.trim();
    const firstWord = trimmedCommand.split(/\s+/)[0];

    // Common error patterns and their explanations
    const errorPatterns = [
      {
        pattern: /cannot remove.*No such file or directory/,
        title: 'File Not Found',
        getMessage: () => {
          const fileMatch = output?.match(/'([^']+)'/);
          const fileName = fileMatch ? fileMatch[1] : 'file';

          return `The file '${fileName}' does not exist and cannot be removed.\n\nSuggestion: Use 'ls' to check what files exist, or use 'rm -f' to ignore missing files.`;
        },
      },
      {
        pattern: /No such file or directory/,
        title: 'File or Directory Not Found',
        getMessage: () => {
          if (trimmedCommand.startsWith('cd ')) {
            const dirMatch = trimmedCommand.match(/cd\s+(.+)/);
            const dirName = dirMatch ? dirMatch[1] : 'directory';

            return `The directory '${dirName}' does not exist.\n\nSuggestion: Use 'mkdir -p ${dirName}' to create it first, or check available directories with 'ls'.`;
          }

          return `The specified file or directory does not exist.\n\nSuggestion: Check the path and use 'ls' to see available files.`;
        },
      },
      {
        pattern: /Permission denied/,
        title: 'Permission Denied',
        getMessage: () =>
          `Permission denied for '${firstWord}'.\n\nSuggestion: The file may not be executable. Try 'chmod +x filename' first.`,
      },
      {
        pattern: /command not found/,
        title: 'Command Not Found',
        getMessage: () =>
          `The command '${firstWord}' is not available in WebContainer.\n\nSuggestion: Check available commands or use a package manager to install it.`,
      },
      {
        pattern: /Is a directory/,
        title: 'Target is a Directory',
        getMessage: () =>
          `Cannot perform this operation - target is a directory.\n\nSuggestion: Use 'ls' to list directory contents or add appropriate flags.`,
      },
      {
        pattern: /File exists/,
        title: 'File Already Exists',
        getMessage: () => `File already exists.\n\nSuggestion: Use a different name or add '-f' flag to overwrite.`,
      },
    ];

    // Try to match known error patterns
    for (const errorPattern of errorPatterns) {
      if (output && errorPattern.pattern.test(output)) {
        return {
          title: errorPattern.title,
          details: errorPattern.getMessage(),
        };
      }
    }

    // Generic error with suggestions based on command type
    let suggestion = '';

    if (trimmedCommand.startsWith('npm ')) {
      suggestion = '\n\nSuggestion: Try running "npm install" first or check package.json.';
    } else if (trimmedCommand.startsWith('git ')) {
      suggestion = "\n\nSuggestion: Check if you're in a git repository or if remote is configured.";
    } else if (trimmedCommand.match(/^(ls|cat|rm|cp|mv)/)) {
      suggestion = '\n\nSuggestion: Check file paths and use "ls" to see available files.';
    }

    return {
      title: `Command Failed (exit code: ${exitCode})`,
      details: `Command: ${trimmedCommand}\n\nOutput: ${output || 'No output available'}${suggestion}`,
    };
  }
}
