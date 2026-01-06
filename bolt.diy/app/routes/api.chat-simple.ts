import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.chat-simple');

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const items = cookieHeader.split(';').map((cookie) => cookie.trim());
  items.forEach((item) => {
    const [name, ...rest] = item.split('=');
    if (name && rest) {
      cookies[decodeURIComponent(name.trim())] = decodeURIComponent(rest.join('=').trim());
    }
  });
  return cookies;
}

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    let { messages, chatMode, designScheme } = await request.json();

    logger.debug(`Received ${messages?.length || 0} messages, chatMode: ${chatMode}`);
    if (!Array.isArray(messages)) {
      logger.error('Messages is not an array:', typeof messages);
    } else {
      logger.debug('First message:', messages[0]);
    }

    // CRITICAL FIX: Clean up any messages with invalid parts property before processing
    // The AI SDK 6.0 can create messages with parts: undefined which breaks convertToModelMessages
    if (Array.isArray(messages)) {
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
    }

    const cookieHeader = request.headers.get('Cookie');
    const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
    const providerSettings = JSON.parse(parseCookies(cookieHeader || '').providers || '{}');

    logger.debug('Calling streamText...');
    try {
      // Use the existing streamText function which handles everything
      const result = await streamText({
        messages: messages || [],
        env: context.cloudflare?.env,
        apiKeys,
        providerSettings,
        chatMode: chatMode || 'build',
        designScheme,
      });

      // Return the UI message stream response
      return result.toUIMessageStreamResponse();
    } catch (innerError: any) {
      logger.error('Error inside streamText:', innerError);
      throw innerError; // Re-throw to be caught by outer block for consistent response
    }
  } catch (error: any) {
    logger.error('Chat error stack:', error.stack);
    logger.error('Chat error message:', error.message);

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || 'An error occurred',
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
