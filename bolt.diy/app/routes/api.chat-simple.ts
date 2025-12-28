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
    const { messages } = await request.json();

    logger.debug(`Received ${messages?.length || 0} messages`);

    const cookieHeader = request.headers.get('Cookie');
    const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
    const providerSettings = JSON.parse(parseCookies(cookieHeader || '').providers || '{}');

    // Use the existing streamText function which handles everything
    const result = await streamText({
      messages: messages || [],
      env: context.cloudflare?.env,
      apiKeys,
      providerSettings,
    });

    // Return the UI message stream response
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    logger.error('Chat error:', error);

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || 'An error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
