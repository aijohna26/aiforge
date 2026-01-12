import { json, type ActionFunctionArgs } from '@remix-run/node';
import { inngest } from '~/lib/inngest/client';
import { createJob } from '~/lib/inngest/db';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as {
      filePaths: string[];
      userId?: string;
    };

    if (!body.filePaths || !Array.isArray(body.filePaths)) {
      return json({ error: 'filePaths array is required' }, { status: 400 });
    }

    const jobId = await createJob({
      userId: body.userId,
      jobType: 'expo-boilerplate-check',
      inputData: {
        filePaths: body.filePaths,
      },
    });

    await inngest.send({
      name: 'expo/validate.boilerplate',
      data: {
        jobId,
        userId: body.userId,
        filePaths: body.filePaths,
      },
    });

    return json({
      success: true,
      jobId,
      status: 'pending',
    });
  } catch (error: any) {
    console.error('[Expo Validate API] Failed to start check:', error);
    return json(
      { error: 'Failed to start Expo validation', details: error.message },
      { status: 500 },
    );
  }
}
