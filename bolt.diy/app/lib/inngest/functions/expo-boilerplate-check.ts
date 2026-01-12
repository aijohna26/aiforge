/**
 * Expo Boilerplate Check (Inngest)
 *
 * Lightweight validator to ensure a full Expo scaffold exists.
 * This can be triggered after code generation to detect missing core files.
 */

import { inngest } from '../client';
import { updateJobStatus, updateJobProgress } from '../db';
import { EXPO_BOILERPLATE_REQUIRED_FILES } from '../../expo/boilerplate';

interface ExpoBoilerplateCheckInput {
  jobId: string;
  userId?: string;
  filePaths: string[];
}

export const expoBoilerplateCheck = inngest.createFunction(
  {
    id: 'expo-boilerplate-check',
    name: 'Expo Boilerplate Check',
    retries: 1,
  },
  { event: 'expo/validate.boilerplate' },
  async ({ event, step, channel }) => {
    const { jobId, userId, filePaths } = event.data as ExpoBoilerplateCheckInput;

    await step.run('mark-processing', async () => {
      await updateJobStatus({ jobId, status: 'processing', progress: 10 });
    });

    const normalized = new Set(
      (filePaths || []).map((path) => (path.startsWith('/') ? path : `/${path}`)),
    );

    const missing = EXPO_BOILERPLATE_REQUIRED_FILES.filter(
      (path) => !normalized.has(path),
    );

    await step.run('finalize-check', async () => {
      await updateJobProgress({ jobId, progress: 100 });
      await updateJobStatus({
        jobId,
        status: missing.length === 0 ? 'completed' : 'failed',
        progress: 100,
        outputData: {
          required: EXPO_BOILERPLATE_REQUIRED_FILES,
          missing,
          ok: missing.length === 0,
        },
        error: missing.length === 0 ? undefined : `Missing Expo files: ${missing.join(', ')}`,
      });
    });

    if (userId && (channel as any)?.publish) {
      await (channel as any).publish(`user:${userId}`, {
        type: 'expo.check.complete',
        jobId,
        missing,
        ok: missing.length === 0,
        timestamp: new Date().toISOString(),
      });
    }

    return { missing, ok: missing.length === 0 };
  },
);
