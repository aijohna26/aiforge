/**
 * Job Polling Hook
 *
 * React Query hook for polling Inngest job status with automatic:
 * - Status polling every 2 seconds
 * - Auto-stop on completion/failure
 * - Toast notifications
 * - Callback on completion
 */

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { InngestJob } from '~/types/inngest-jobs';

interface JobPollingOptions {
  /**
   * Callback fired when job completes successfully
   */
  onComplete?: (result: any) => void;

  /**
   * Callback fired when job fails
   */
  onError?: (error: string) => void;

  /**
   * Polling interval in milliseconds (default: 2000)
   */
  pollingInterval?: number;

  /**
   * Whether to show toast notifications (default: true)
   */
  showToasts?: boolean;

  /**
   * Custom success toast message
   */
  successMessage?: string;
}

export function useJobPolling(jobId: string | null, options: JobPollingOptions = {}) {
  const {
    onComplete,
    onError,
    pollingInterval = 1000,
    showToasts = true,
    successMessage = 'Job completed successfully!',
  } = options;

  return useQuery<InngestJob>({
    queryKey: ['inngest-job', jobId],
    queryFn: async () => {
      if (!jobId) {
        throw new Error('Job ID is required');
      }

      const response = await fetch(`/api/jobs/${jobId}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch job' }));
        throw new Error(error.error || 'Failed to fetch job status');
      }

      return response.json();
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;

      // Stop polling if no data yet
      if (!data) {
        return pollingInterval;
      }

      // Stop polling on completion
      if (data.status === 'completed') {
        if (showToasts) {
          toast.success(successMessage, { id: `job-${jobId}` });
        }

        if (onComplete) {
          onComplete(data.outputData);
        }

        return false;
      }

      // Stop polling on failure
      if (data.status === 'failed') {
        if (showToasts) {
          toast.error(`Job failed: ${data.error || 'Unknown error'}`, { id: `job-${jobId}` });
        }

        if (onError) {
          onError(data.error || 'Unknown error');
        }

        return false;
      }

      // Continue polling if pending or processing
      if (data.status === 'pending' || data.status === 'processing') {
        return pollingInterval;
      }

      // Default fallback (shouldn't be reached ideally but safe to keep polling)
      return pollingInterval;
    },
    retry: 3,
    retryDelay: 1000,
  });
}

/**
 * Utility hook for screen generation jobs
 */
export function useScreenGenerationPolling(
  jobId: string | null,
  onComplete?: (result: { screens: any[]; theme?: any }) => void,
) {
  return useJobPolling(jobId, {
    onComplete: (result) => {
      if (result?.screens) {
        onComplete?.(result);
      }
    },
    successMessage: '✨ Screens generated successfully!',
  });
}

/**
 * Utility hook for screenshot export jobs
 */
export function useScreenshotExportPolling(
  jobId: string | null,
  onComplete?: (exportData: { data: string; format: string }) => void,
) {
  return useJobPolling(jobId, {
    onComplete: (result) => {
      if (result?.data) {
        onComplete?.(result);
      }
    },
    successMessage: '📸 Export completed!',
  });
}
