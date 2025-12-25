/**
 * Job Status Polling Endpoint
 *
 * Route: GET /api/jobs/:jobId
 *
 * Returns the current status of a background job including:
 * - Job status (pending, processing, completed, failed)
 * - Progress percentage (0-100)
 * - Output data (when completed)
 * - Error messages (when failed)
 * - Token usage and cost tracking
 */

import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getJob } from '~/lib/inngest/db';

export async function loader({ params }: LoaderFunctionArgs) {
  const { jobId } = params;

  if (!jobId) {
    return json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }

  try {
    const job = await getJob(jobId);

    if (!job) {
      return json(
        { error: 'Job not found', jobId },
        { status: 404 }
      );
    }

    // Return job data with computed fields
    return json({
      id: job.id,
      jobType: job.jobType,
      status: job.status,
      progress: job.progress,
      outputData: job.outputData,
      error: job.error,

      // Metadata
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      provider: job.provider,
      model: job.model,

      // Cost tracking
      tokenUsage: job.tokenUsage,
      estimatedCostUsd: job.estimatedCostUsd,

      // Timestamps
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      updatedAt: job.updatedAt,

      // Computed duration (if started)
      durationMs: job.startedAt
        ? new Date(job.completedAt || new Date()).getTime() - new Date(job.startedAt).getTime()
        : null,
    });
  } catch (error) {
    console.error('[Job API] Error fetching job:', error);
    return json(
      {
        error: 'Failed to fetch job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
