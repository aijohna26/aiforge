import type { ActionType, BoltAction, BoltActionData, FileAction, ShellAction, SupabaseAction } from '~/types/actions';
import type { BoltArtifactData } from '~/types/artifact';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

const ARTIFACT_TAG_OPEN = '<boltArtifact';
const ARTIFACT_TAG_CLOSE = '</boltArtifact>';
const ARTIFACT_ACTION_TAG_OPEN = '<boltAction';
const ARTIFACT_ACTION_TAG_CLOSE = '</boltAction>';
const BOLT_QUICK_ACTIONS_OPEN = '<bolt-quick-actions>';
const BOLT_QUICK_ACTIONS_CLOSE = '</bolt-quick-actions>';

const logger = createScopedLogger('MessageParser');

export interface ArtifactCallbackData extends BoltArtifactData {
  messageId: string;
  artifactId?: string;
}

export interface ActionCallbackData {
  artifactId: string;
  messageId: string;
  actionId: string;
  action: BoltAction;
}

export type ArtifactCallback = (data: ArtifactCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;

export interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionStream?: ActionCallback;
  onActionClose?: ActionCallback;
}

interface ElementFactoryProps {
  messageId: string;
  artifactId?: string;
}

type ElementFactory = (props: ElementFactoryProps) => string;

export interface StreamingMessageParserOptions {
  callbacks?: ParserCallbacks;
  artifactElement?: ElementFactory;
}

interface MessageState {
  position: number;
  insideArtifact: boolean;
  insideAction: boolean;
  artifactCounter: number;
  currentArtifact?: BoltArtifactData;
  currentAction: BoltActionData;
  actionId: number;
}

function cleanoutMarkdownSyntax(content: string) {
  const codeBlockRegex = /^\s*```\w*\n([\s\S]*?)\n\s*```\s*$/;
  const match = content.match(codeBlockRegex);

  // console.log('matching', !!match, content);

  if (match) {
    return match[1]; // Remove common leading 4-space indent
  } else {
    return content;
  }
}

function cleanEscapedTags(content: string) {
  return content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
export class StreamingMessageParser {
  #messages = new Map<string, MessageState>();
  #artifactCounter = 0;

  constructor(private _options: StreamingMessageParserOptions = {}) { }

  parse(messageId: string, input: string) {
    // Debug: Log when we're parsing design-sync content
    if (input.includes('design-sync')) {
      logger.debug(`[MessageParser] Parsing input with design-sync, length: ${input.length}`);
      logger.debug(`[MessageParser] Input starts with: ${input.substring(0, 150)}`);
    }

    let state = this.#messages.get(messageId);

    if (!state) {
      state = {
        position: 0,
        insideAction: false,
        insideArtifact: false,
        artifactCounter: 0,
        currentAction: { content: '' },
        actionId: 0,
      };

      this.#messages.set(messageId, state);
    }

    // Debug: Check if input contains artifact tags
    if (input.includes('<boltArtifact') || input.includes('<boltartifact')) {
      logger.debug(`[Parser] Input contains boltArtifact tag. Length: ${input.length}`);
      logger.debug(`[Parser] State: insideArtifact=${state.insideArtifact}, position=${state.position}`);
      const artifactIndex = input.toLowerCase().indexOf('<boltartifact');
      if (artifactIndex >= 0) {
        logger.debug(`[Parser] Artifact tag at index ${artifactIndex}, preview: ${input.substring(artifactIndex, artifactIndex + 100)}`);
      }
    }

    let output = '';
    let i = state.position;
    let earlyBreak = false;

    while (i < input.length) {
      if (input.startsWith(BOLT_QUICK_ACTIONS_OPEN, i)) {
        const actionsBlockEnd = input.indexOf(BOLT_QUICK_ACTIONS_CLOSE, i);

        if (actionsBlockEnd !== -1) {
          const actionsBlockContent = input.slice(i + BOLT_QUICK_ACTIONS_OPEN.length, actionsBlockEnd);

          // Find all <bolt-quick-action ...>label</bolt-quick-action> inside
          const quickActionRegex = /<bolt-quick-action([^>]*)>([\s\S]*?)<\/bolt-quick-action>/g;
          let match;
          const buttons = [];

          while ((match = quickActionRegex.exec(actionsBlockContent)) !== null) {
            const tagAttrs = match[1];
            const label = match[2];
            const type = this.#extractAttribute(tagAttrs, 'type');
            const message = this.#extractAttribute(tagAttrs, 'message');
            const path = this.#extractAttribute(tagAttrs, 'path');
            const href = this.#extractAttribute(tagAttrs, 'href');
            buttons.push(
              createQuickActionElement(
                { type: type || '', message: message || '', path: path || '', href: href || '' },
                label,
              ),
            );
          }
          output += createQuickActionGroup(buttons);
          i = actionsBlockEnd + BOLT_QUICK_ACTIONS_CLOSE.length;
          continue;
        }
      }

      if (state.insideArtifact) {
        const currentArtifact = state.currentArtifact;

        if (currentArtifact === undefined) {
          unreachable('Artifact not initialized');
        }

        if (state.insideAction) {
          const closeRegex = new RegExp(ARTIFACT_ACTION_TAG_CLOSE, 'i');
          const closeMatch = input.slice(i).match(closeRegex);
          const closeIndex = closeMatch ? i + closeMatch.index! : -1;

          const currentAction = state.currentAction;

          // Debug for design-sync actions
          if ('type' in currentAction && currentAction.type === 'design-sync') {
            logger.debug('[MessageParser] Looking for closing tag from position:', i);
            logger.debug('[MessageParser] Found closing tag at index:', closeIndex);
            logger.debug('[MessageParser] Current accumulated content length:', currentAction.content.length);
          }

          if (closeIndex !== -1) {
            currentAction.content += input.slice(i, closeIndex);

            let content = currentAction.content.trim();

            if ('type' in currentAction) {
              if (currentAction.type === 'file') {
                // Remove markdown code block syntax if present and file is not markdown
                if (!currentAction.filePath.endsWith('.md')) {
                  content = cleanoutMarkdownSyntax(content);
                  content = cleanEscapedTags(content);
                }
                content += '\n';
              }
              // For all other action types (design-sync, shell, start, qa-pass), keep content as-is
            }

            currentAction.content = content;

            // Debug logging for design-sync actions
            if ('type' in currentAction && currentAction.type === 'design-sync') {
              logger.debug(`[MessageParser] design-sync action parsed with content length: ${content.length}`);
              logger.debug(`[MessageParser] design-sync content preview: ${content.substring(0, 100)}...`);
              logger.debug(`[MessageParser] Full content:`, content);
            }

            this._options.callbacks?.onActionClose?.({
              artifactId: currentArtifact.id,
              messageId,

              /**
               * We decrement the id because it's been incremented already
               * when `onActionOpen` was emitted to make sure the ids are
               * the same.
               */
              actionId: String(state.actionId - 1),

              action: currentAction as BoltAction,
            });

            state.insideAction = false;
            state.currentAction = { content: '' };

            i = closeIndex + ARTIFACT_ACTION_TAG_CLOSE.length;
          } else {
            if ('type' in currentAction && currentAction.type === 'file') {
              let content = input.slice(i);

              if (!currentAction.filePath.endsWith('.md')) {
                content = cleanoutMarkdownSyntax(content);
                content = cleanEscapedTags(content);
              }

              this._options.callbacks?.onActionStream?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId - 1),
                action: {
                  ...(currentAction as FileAction),
                  content,
                  filePath: currentAction.filePath,
                },
              });
            }

            break;
          }
        } else {
          const actionOpenRegex = new RegExp(ARTIFACT_ACTION_TAG_OPEN, 'i');
          const artifactCloseRegex = new RegExp(ARTIFACT_TAG_CLOSE, 'i');

          const actionMatch = input.slice(i).match(actionOpenRegex);
          const artifactCloseMatch = input.slice(i).match(artifactCloseRegex);

          const actionOpenIndex = actionMatch ? i + actionMatch.index! : -1;
          const artifactCloseIndex = artifactCloseMatch ? i + artifactCloseMatch.index! : -1;

          if (actionOpenIndex !== -1 && (artifactCloseIndex === -1 || actionOpenIndex < artifactCloseIndex)) {
            const actionEndIndex = input.indexOf('>', actionOpenIndex);

            if (actionEndIndex !== -1) {
              state.insideAction = true;

              state.currentAction = this.#parseActionTag(input, actionOpenIndex, actionEndIndex);

              // Debug for design-sync actions
              if ('type' in state.currentAction && state.currentAction.type === 'design-sync') {
                logger.debug('[MessageParser] Found design-sync action tag');
                logger.debug('[MessageParser] actionOpenIndex:', actionOpenIndex);
                logger.debug('[MessageParser] actionEndIndex:', actionEndIndex);
                logger.debug('[MessageParser] Next 200 chars after tag:', input.substring(actionEndIndex + 1, actionEndIndex + 201));
              }

              this._options.callbacks?.onActionOpen?.({
                artifactId: currentArtifact.id,
                messageId,
                actionId: String(state.actionId++),
                action: state.currentAction as BoltAction,
              });

              i = actionEndIndex + 1;
            } else {
              break;
            }
          } else if (artifactCloseIndex !== -1) {
            this._options.callbacks?.onArtifactClose?.({
              messageId,
              artifactId: currentArtifact.id,
              ...currentArtifact,
            });

            state.insideArtifact = false;
            state.currentArtifact = undefined;

            i = artifactCloseIndex + ARTIFACT_TAG_CLOSE.length;
          } else {
            break;
          }
        }
      } else if (input[i] === '<' && input[i + 1] !== '/') {
        let j = i;
        let potentialTag = '';

        while (j < input.length && potentialTag.length < ARTIFACT_TAG_OPEN.length) {
          potentialTag += input[j];

          if (potentialTag.toLowerCase() === ARTIFACT_TAG_OPEN.toLowerCase()) {
            const nextChar = input[j + 1];

            logger.debug(`[Parser] Found potential boltArtifact tag at position ${i}`);
            logger.debug(`[Parser] Next char after tag: "${nextChar}" (code: ${nextChar?.charCodeAt(0)})`);
            logger.debug(`[Parser] Next 20 chars: ${input.substring(j + 1, j + 21)}`);

            if (nextChar && nextChar !== '>' && !/^\s$/.test(nextChar)) {
              logger.debug(`[Parser] REJECTED: nextChar failed validation. Treating as text.`);
              output += input.slice(i, j + 1);
              i = j + 1;
              break;
            }

            logger.debug(`[Parser] ACCEPTED: Artifact tag validated, processing...`);

            const openTagEnd = input.indexOf('>', j);

            if (openTagEnd !== -1) {
              const artifactTag = input.slice(i, openTagEnd + 1);

              const artifactTitle = this.#extractAttribute(artifactTag, 'title') as string;
              const type = this.#extractAttribute(artifactTag, 'type') as string;

              // const artifactId = this.#extractAttribute(artifactTag, 'id') as string;
              const artifactId = `${messageId}-${state.artifactCounter++}`;

              if (!artifactTitle) {
                logger.warn('Artifact title missing');
              }

              if (!artifactId) {
                logger.warn('Artifact id missing');
              }

              state.insideArtifact = true;

              const currentArtifact = {
                id: artifactId,
                title: artifactTitle,
                type,
              } satisfies BoltArtifactData;

              state.currentArtifact = currentArtifact;

              this._options.callbacks?.onArtifactOpen?.({
                messageId,
                artifactId: currentArtifact.id,
                ...currentArtifact,
              });

              const artifactFactory = this._options.artifactElement ?? createArtifactElement;

              output += artifactFactory({ messageId, artifactId });

              i = openTagEnd + 1;
            } else {
              earlyBreak = true;
            }

            break;
          } else if (!ARTIFACT_TAG_OPEN.startsWith(potentialTag)) {
            output += input.slice(i, j + 1);
            i = j + 1;
            break;
          }

          j++;
        }

        if (j === input.length && ARTIFACT_TAG_OPEN.toLowerCase().startsWith(potentialTag.toLowerCase())) {
          break;
        }
      } else {
        /*
         * Note: Auto-file-creation from code blocks is now handled by EnhancedMessageParser
         * to avoid duplicate processing and provide better shell command detection
         */
        output += input[i];
        i++;
      }

      if (earlyBreak) {
        break;
      }
    }

    state.position = i;

    return output;
  }

  reset() {
    this.#messages.clear();
  }

  #parseActionTag(input: string, actionOpenIndex: number, actionEndIndex: number) {
    const actionTag = input.slice(actionOpenIndex, actionEndIndex + 1);

    const actionType = this.#extractAttribute(actionTag, 'type') as ActionType;

    const actionAttributes = {
      type: actionType,
      content: '',
    };

    if (actionType === 'supabase') {
      const operation = this.#extractAttribute(actionTag, 'operation');

      if (!operation || !['migration', 'query'].includes(operation)) {
        logger.warn(`Invalid or missing operation for Supabase action: ${operation}`);
        throw new Error(`Invalid Supabase operation: ${operation}`);
      }

      (actionAttributes as SupabaseAction).operation = operation as 'migration' | 'query';

      if (operation === 'migration') {
        const filePath = this.#extractAttribute(actionTag, 'filePath');

        if (!filePath) {
          logger.warn('Migration requires a filePath');
          throw new Error('Migration requires a filePath');
        }

        (actionAttributes as SupabaseAction).filePath = filePath;
      }
    } else if (actionType === 'file') {
      const filePath = this.#extractAttribute(actionTag, 'filePath') as string;

      if (!filePath) {
        logger.debug('File path not specified');
      }

      (actionAttributes as FileAction).filePath = filePath;
    } else if (!['shell', 'start', 'design-sync'].includes(actionType)) {
      logger.warn(`Unknown action type '${actionType}'`);
    }

    return actionAttributes as FileAction | ShellAction;
  }

  #extractAttribute(tag: string, attributeName: string): string | undefined {
    const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
    return match ? match[1] : undefined;
  }
}

const createArtifactElement: ElementFactory = (props) => {
  const elementProps = [
    'class="__boltArtifact__"',
    ...Object.entries(props).map(([key, value]) => {
      return `data-${camelToDashCase(key)}=${JSON.stringify(value)}`;
    }),
  ];

  return `<div ${elementProps.join(' ')}></div>`;
};

function camelToDashCase(input: string) {
  return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function createQuickActionElement(props: Record<string, string>, label: string) {
  const elementProps = [
    'class="__boltQuickAction__"',
    'data-bolt-quick-action="true"',
    ...Object.entries(props).map(([key, value]) => `data-${camelToDashCase(key)}=${JSON.stringify(value)}`),
  ];

  return `<button ${elementProps.join(' ')}>${label}</button>`;
}

function createQuickActionGroup(buttons: string[]) {
  return `<div class=\"__boltQuickAction__\" data-bolt-quick-action=\"true\">${buttons.join('')}</div>`;
}
