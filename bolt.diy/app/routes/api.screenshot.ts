import { json, type ActionFunctionArgs } from '@remix-run/node';
import { v4 as uuidv4 } from 'uuid';
import { inngest } from '~/lib/inngest/client';
import { createJob } from '~/lib/inngest/db';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as {
      html: string;
      styles?: string;
      clip?: { x: number; y: number; width: number; height: number };
      format?: 'png' | 'pdf';
      width?: number;
      height?: number;
      userId?: string;
    };

    const { html, styles, clip, format = 'png', width = 8000, height = 8000, userId } = body;

    if (!html) {
      return json({ error: 'HTML content is required' }, { status: 400 });
    }

    console.log('[Screenshot API] Starting Inngest job for screenshot export...');

    // Create job record
    const jobId = await createJob({
      userId,
      jobType: 'screenshot-export',
      inputData: {
        html,
        styles,
        clip,
        format,
        width,
        height,
      },
      // Optional: provider/model logic if relevant, but likely not for screenshot
    });

    console.log('[Screenshot API] Job created:', jobId);

    // Trigger Inngest event
    await inngest.send({
      name: 'studio/screenshot.export',
      data: {
        jobId,
        userId,
        html,
        styles,
        clip,
        format,
        width,
        height,
      },
    });

    return json({
      success: true,
      jobId,
      status: 'pending',
    });
  } catch (error: any) {
    console.error('[Screenshot API] Failed to start export job:', error);
    return json(
      {
        error: 'Failed to start export job',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
