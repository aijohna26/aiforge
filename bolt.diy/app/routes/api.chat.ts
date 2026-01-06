import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { generateId } from 'ai';
import { createDataStream } from '~/lib/.server/llm/create-data-stream';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS, type FileMap } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/common/prompts/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';
import { getFilePaths, selectContext } from '~/lib/.server/llm/select-context';
import type { ContextAnnotation, ProgressAnnotation } from '~/types/context';
import { WORK_DIR } from '~/utils/constants';
import { createSummary } from '~/lib/.server/llm/create-summary';
import { extractPropertiesFromMessage } from '~/lib/.server/llm/utils';
import type { DesignScheme } from '~/types/design-scheme';
import { MCPService } from '~/lib/services/mcpService';
import { StreamRecoveryManager } from '~/lib/.server/llm/stream-recovery';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

const logger = createScopedLogger('api.chat');

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest) {
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const streamRecovery = new StreamRecoveryManager({
    timeout: 45000,
    maxRetries: 2,
    onTimeout: () => {
      logger.warn('Stream timeout - attempting recovery');
    },
  });

  let { messages, files, promptId, contextOptimization, supabase, chatMode, designScheme, maxLLMSteps } =
    await request.json<{
      messages: Messages;
      files: any;
      promptId?: string;
      contextOptimization: boolean;
      chatMode: 'discuss' | 'build' | 'design';
      designScheme?: DesignScheme;
      supabase?: {
        isConnected: boolean;
        hasSelectedProject: boolean;
        credentials?: {
          anonKey?: string;
          supabaseUrl?: string;
        };
      };
      maxLLMSteps: number;
    }>().then(data => ({ ...data, messages: data.messages || [] }));

  // Validate messages array
  if (!Array.isArray(messages)) {
    logger.error('Messages is not an array:', messages);
    return new Response(JSON.stringify({ error: true, message: 'Invalid messages format - expected array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // CRITICAL FIX: Clean up any messages with invalid parts property before processing
  // The AI SDK 6.0 can create messages with parts: undefined which breaks convertToModelMessages
  messages = messages.map((msg: any) => {
    if (msg && typeof msg === 'object') {
      // If parts exists but is not a valid non-empty array, delete it
      if (msg.parts !== undefined && (!Array.isArray(msg.parts) || msg.parts.length === 0)) {
        const cleaned = { ...msg };
        delete cleaned.parts;
        logger.debug('Cleaned invalid parts from message:', { role: msg.role, hadParts: msg.parts });
        return cleaned;
      }
    }
    return msg;
  });

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
  const providerSettings: Record<string, IProviderSetting> = JSON.parse(
    parseCookies(cookieHeader || '').providers || '{}',
  );

  const cumulativeUsage = {
    completionTokens: 0,
    promptTokens: 0,
    totalTokens: 0,
  };
  let progressCounter: number = 1;

  try {
    const mcpService = MCPService.getInstance();

    // AI SDK 6.0: Extract text content from message parts
    const getMessageText = (message: any): string => {
      if (message.content) return message.content; // Backward compatibility
      if (message.parts) {
        return message.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('');
      }
      return '';
    };

    // AI SDK 6.0: Normalize usage object (inputTokens/outputTokens → promptTokens/completionTokens)
    const normalizeUsage = (usage: any) => {
      if (!usage) return usage;
      return {
        completionTokens: usage.outputTokens ?? usage.completionTokens ?? 0,
        promptTokens: usage.inputTokens ?? usage.promptTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
      };
    };

    const totalMessageContent = messages.reduce((acc, message) => acc + getMessageText(message), '');
    logger.debug(`Total message length: ${totalMessageContent.split(' ').length}, words`);

    // Bypass createDataStream for AI SDK 6.0 compatibility
    streamRecovery.startMonitoring();

    const filePaths = getFilePaths(files || {});
    let filteredFiles: FileMap | undefined = undefined;
    let summary: string | undefined = undefined;
    let messageSliceId = 0;

    const processedMessages = await mcpService.processToolInvocations(messages, undefined as any);

    if (processedMessages.length > 3) {
      messageSliceId = processedMessages.length - 3;
    }

        if (filePaths.length > 0 && contextOptimization) {
          logger.debug('Generating Chat Summary');
          dataStream.writeData({
            type: 'progress',
            label: 'summary',
            status: 'in-progress',
            order: progressCounter++,
            message: 'Analysing Request',
          } satisfies ProgressAnnotation);

          // Create a summary of the chat
          console.log(`Messages count: ${processedMessages.length}`);

          summary = await createSummary({
            messages: [...processedMessages],
            env: context.cloudflare?.env,
            apiKeys,
            providerSettings,
            promptId,
            contextOptimization,
            onFinish(resp) {
              if (resp.usage) {
                logger.debug('createSummary token usage', JSON.stringify(resp.usage));
                const normalized = normalizeUsage(resp.usage);
                cumulativeUsage.completionTokens += normalized.completionTokens;
                cumulativeUsage.promptTokens += normalized.promptTokens;
                cumulativeUsage.totalTokens += normalized.totalTokens;
              }
            },
          });
          dataStream.writeData({
            type: 'progress',
            label: 'summary',
            status: 'complete',
            order: progressCounter++,
            message: 'Analysis Complete',
          } satisfies ProgressAnnotation);

          dataStream.writeMessageAnnotation({
            type: 'chatSummary',
            summary,
            chatId: processedMessages.slice(-1)?.[0]?.id,
          } as ContextAnnotation);

          // Update context buffer
          logger.debug('Updating Context Buffer');
          dataStream.writeData({
            type: 'progress',
            label: 'context',
            status: 'in-progress',
            order: progressCounter++,
            message: 'Determining Files to Read',
          } satisfies ProgressAnnotation);

          // Select context files
          console.log(`Messages count: ${processedMessages.length}`);
          filteredFiles = await selectContext({
            messages: [...processedMessages],
            env: context.cloudflare?.env,
            apiKeys,
            files,
            providerSettings,
            promptId,
            contextOptimization,
            summary,
            onFinish(resp) {
              if (resp.usage) {
                logger.debug('selectContext token usage', JSON.stringify(resp.usage));
                const normalized = normalizeUsage(resp.usage);
                cumulativeUsage.completionTokens += normalized.completionTokens;
                cumulativeUsage.promptTokens += normalized.promptTokens;
                cumulativeUsage.totalTokens += normalized.totalTokens;
              }
            },
          });

          if (filteredFiles) {
            logger.debug(`files in context : ${JSON.stringify(Object.keys(filteredFiles))}`);
          }

          dataStream.writeMessageAnnotation({
            type: 'codeContext',
            files: Object.keys(filteredFiles).map((key) => {
              let path = key;

              if (path.startsWith(WORK_DIR)) {
                path = path.replace(WORK_DIR, '');
              }

              return path;
            }),
          } as ContextAnnotation);

          dataStream.writeData({
            type: 'progress',
            label: 'context',
            status: 'complete',
            order: progressCounter++,
            message: 'Code Files Selected',
          } satisfies ProgressAnnotation);

          // logger.debug('Code Files Selected');
        }

        const options: StreamingOptions = {
          supabaseConnection: supabase,
          toolChoice: 'auto',
          tools: mcpService.toolsWithoutExecute,
          maxSteps: maxLLMSteps,
          /*
          onStepFinish: ({ toolCalls }) => {
            // add tool call annotations for frontend processing
            toolCalls.forEach((toolCall) => {
              mcpService.processToolCall(toolCall as any, dataStream);
            });
          },
          onFinish: async ({ text: content, finishReason, usage }) => {
            logger.debug('usage', JSON.stringify(usage));
            // simplified for debugging
            if (usage) {
               console.log('[DEBUG] Usage received in onFinish');
            }
          },
          */
        };

        // DEBUG: Inspect the messages going to the LLM
        if (processedMessages.length > 0) {
          const lastMsg = processedMessages[processedMessages.length - 1];
          console.log('[api.chat] Last message role:', lastMsg.role);
          console.log('[api.chat] Last message content preview:', typeof lastMsg.content === 'string' ? lastMsg.content.substring(0, 50) : '[Complex Content]');
        }

        const result = await streamText({
          messages: [...processedMessages],
          env: context.cloudflare?.env,
          options,
          apiKeys,
          files,
          providerSettings,
          promptId,
          contextOptimization,
          contextFiles: filteredFiles,
          chatMode,
          designScheme,
          summary,
          messageSliceId,
        });

        console.log('[api.chat] streamText result keys:', Object.keys(result));
        if (result.fullStream) {
          console.log('[api.chat] result.fullStream is present');
        } else {
          console.error('[api.chat] result.fullStream is MISSING');
        }

        // Test if we can get text from the stream
        if (result.textStream) {
          console.log('[api.chat] result.textStream is present');
        }
        if (result.toUIMessageStreamResponse) {
          console.log('[api.chat] result.toUIMessageStreamResponse is available');
        }

    streamRecovery.stop();

    // Use AI SDK 6.0's built-in response formatter
    console.log('[api.chat] Returning toUIMessageStreamResponse()');
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    logger.error(error);

    const errorResponse = {
      error: true,
      message: error.message || 'An unexpected error occurred',
      statusCode: error.statusCode || 500,
      isRetryable: error.isRetryable !== false, // Default to retryable unless explicitly false
      provider: error.provider || 'unknown',
    };

    if (error.message?.includes('API key')) {
      return new Response(
        JSON.stringify({
          ...errorResponse,
          message: 'Invalid or missing API key',
          statusCode: 401,
          isRetryable: false,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          statusText: 'Unauthorized',
        },
      );
    }

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.statusCode,
      headers: { 'Content-Type': 'application/json' },
      statusText: 'Error',
    });
  }
}
