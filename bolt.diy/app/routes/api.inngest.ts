/**
 * Inngest Serve Endpoint
 *
 * This endpoint handles communication between Inngest platform and your functions.
 * It serves both GET (for function registration) and POST (for function execution).
 *
 * Route: /api/inngest
 *
 * IMPORTANT SETUP STEPS:
 * 1. Set INNGEST_EVENT_KEY in your .env file
 * 2. Set INNGEST_SIGNING_KEY in your .env file (for production)
 * 3. Deploy this endpoint to your Vercel project
 * 4. Register your app in Inngest dashboard: https://app.inngest.com/
 * 5. Point Inngest to: https://your-domain.vercel.app/api/inngest
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { serve } from 'inngest/remix';
import { inngest } from '~/lib/inngest/client';
import { functions } from '~/lib/inngest/functions';

// Check for required environment variables
if (!process.env.INNGEST_EVENT_KEY) {
  console.error('[Inngest] Missing INNGEST_EVENT_KEY environment variable');
}

if (process.env.NODE_ENV === 'production' && !process.env.INNGEST_SIGNING_KEY) {
  console.warn('[Inngest] Missing INNGEST_SIGNING_KEY - Required for production!');
}

console.log('[Inngest] Initializing serve handler with', functions.length, 'functions');

/**
 * Serve the Inngest functions via HTTP
 * The serve function returns a single handler that handles both GET and POST requests
 */
const handler = serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  servePath: '/api/inngest',
});

/**
 * Export named handlers for Remix
 * Both loader (GET) and action (POST) use the same handler
 */
export async function loader(args: LoaderFunctionArgs) {
  try {
    return await handler(args);
  } catch (error) {
    console.error('[Inngest] GET handler error:', error);
    throw error;
  }
}

export async function action(args: ActionFunctionArgs) {
  try {
    return await handler(args);
  } catch (error) {
    console.error('[Inngest] POST handler error:', error);
    throw error;
  }
}
