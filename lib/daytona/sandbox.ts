import { daytonaClient } from './client';
import type { SandboxConfig, CodeExecutionResult, PreviewLink } from './types';
import type { Sandbox } from '@daytonaio/sdk';

/**
 * Create a new Daytona sandbox with optional configuration
 * @param config Sandbox configuration options
 * @returns Created sandbox instance
 */
export async function createSandbox(config: SandboxConfig = {}): Promise<Sandbox> {
    return await daytonaClient.create(config);
}

/**
 * Execute code in an existing sandbox
 * @param sandbox Sandbox instance to execute code in
 * @param code Code string to execute
 * @returns Execution result with stdout, stderr, exit code, and artifacts
 */
export async function executeCode(
    sandbox: Sandbox,
    code: string
): Promise<CodeExecutionResult> {
    const result = await sandbox.process.codeRun(code);

    return {
        stdout: result.result || '',
        exitCode: result.exitCode,
        stderr: '', // stderr is included in result on error
        artifacts: result.artifacts,
    };
}

/**
 * Get a preview link for a running web application in a sandbox
 * @param sandbox Sandbox instance
 * @param port Port number the application is running on (default: 3000)
 * @returns Preview link with URL and authentication token
 */
export async function getPreviewLink(
    sandbox: Sandbox,
    port: number = 3000
): Promise<PreviewLink> {
    return await sandbox.getPreviewLink(port);
}

/**
 * Delete a sandbox and free up resources
 * @param sandbox Sandbox instance to delete
 */
export async function cleanupSandbox(sandbox: Sandbox): Promise<void> {
    await sandbox.delete();
}

/**
 * Stop a running sandbox without deleting it
 * @param sandbox Sandbox instance to stop
 */
export async function stopSandbox(sandbox: Sandbox): Promise<void> {
    await sandbox.stop();
}

/**
 * Start a stopped sandbox
 * @param sandbox Sandbox instance to start
 */
export async function startSandbox(sandbox: Sandbox): Promise<void> {
    await sandbox.start();
}

/**
 * Upload a file to a sandbox
 * @param sandbox Sandbox instance
 * @param localPath Local file path to upload
 * @param remotePath Remote path in sandbox where file should be placed
 */
export async function uploadFile(
    sandbox: Sandbox,
    localPath: string,
    remotePath: string
): Promise<void> {
    await sandbox.fs.uploadFile(localPath, remotePath);
}

/**
 * Download a file from a sandbox
 * @param sandbox Sandbox instance
 * @param remotePath Remote path in sandbox of file to download
 * @param localPath Local path where downloaded file should be saved
 */
export async function downloadFile(
    sandbox: Sandbox,
    remotePath: string,
    localPath: string
): Promise<void> {
    await sandbox.fs.downloadFile(remotePath, localPath);
}
