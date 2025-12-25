/**
 * Inngest Client
 *
 * Initializes the Inngest client for background job processing.
 * This client is used to:
 * - Send events to trigger background functions
 * - Serve function endpoints to Inngest platform
 * - Stream real-time progress updates to clients
 */

import { Inngest } from 'inngest';
import { realtimeMiddleware } from '@inngest/realtime/middleware';

if (!process.env.INNGEST_EVENT_KEY) {
  console.warn('[Inngest] INNGEST_EVENT_KEY not found in environment variables. Background jobs will not function.');
}

export const inngest = new Inngest({
  id: 'appforge-ai',
  eventKey: process.env.INNGEST_EVENT_KEY,
  middleware: [realtimeMiddleware()],
});

/**
 * Event payload types for type-safe event sending
 */
export type InngestEvents = {
  'studio/generate.screens': {
    data: {
      jobId: string;
      branding: any;
      screens: any[];
      includeTheme?: boolean;
    };
  };
  'studio/screenshot.export': {
    data: {
      jobId: string;
      html: string;
      clip?: { x: number; y: number; width: number; height: number };
      format?: 'png' | 'pdf';
      width?: number;
      height?: number;
    };
  };
  'chat/context.process': {
    data: {
      jobId: string;
      messages: any[];
      operation: 'summary' | 'selection';
    };
  };
  'style/extract': {
    data: {
      jobId: string;
      images: string[];
      extractionType: 'colors' | 'typography' | 'components' | 'full';
    };
  };
};
