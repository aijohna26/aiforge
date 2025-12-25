/**
 * Job Progress Bar Component
 *
 * Displays real-time progress for Inngest background jobs with:
 * - Animated progress bar
 * - Status indicators
 * - Error messages
 * - Elapsed time
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useJobPolling } from '~/lib/hooks/useJobPolling';

interface JobProgressBarProps {
  jobId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  showDetails?: boolean;
}

export function JobProgressBar({
  jobId,
  onComplete,
  onError,
  className = '',
  showDetails = true,
}: JobProgressBarProps) {
  const { data: job, isLoading, error } = useJobPolling(jobId, {
    onComplete,
    onError,
    showToasts: false, // Handle toasts externally
  });

  if (isLoading || !job) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex-1 h-2 bg-white/[0.08] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: '0%' }}
            animate={{ width: '30%' }}
            transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          />
        </div>
        <span className="text-xs text-white/50 font-medium">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex-1 h-2 bg-red-500/20 rounded-full overflow-hidden">
          <div className="h-full w-full bg-red-500" />
        </div>
        <span className="text-xs text-red-400 font-medium">Error loading job</span>
      </div>
    );
  }

  const progress = Math.min(Math.max(job.progress || 0, 0), 100);
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isProcessing = job.status === 'processing';

  // Calculate elapsed time
  const elapsedMs = job.startedAt
    ? new Date(job.completedAt || new Date()).getTime() - new Date(job.startedAt).getTime()
    : 0;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/[0.08] rounded-full overflow-hidden relative">
          <motion.div
            className={`h-full ${isFailed
                ? 'bg-red-500'
                : isCompleted
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />

          {/* Animated shimmer for processing state */}
          {isProcessing && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>

        {/* Status Icon */}
        <div className="flex items-center gap-2">
          {isProcessing && (
            <div className="i-ph:circle-notch-bold animate-spin text-indigo-400 text-sm" />
          )}
          {isCompleted && (
            <div className="i-ph:check-circle-fill text-green-500 text-sm" />
          )}
          {isFailed && (
            <div className="i-ph:x-circle-fill text-red-500 text-sm" />
          )}
          <span className="text-xs font-bold text-white/80 tabular-nums min-w-[3ch]">
            {progress}%
          </span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <div className="flex items-center gap-2">
            <span className="capitalize font-medium">{job.status}</span>
            {job.jobType && (
              <>
                <span>•</span>
                <span className="text-white/30">{job.jobType}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {elapsedSeconds > 0 && (
              <>
                <span className="tabular-nums">{elapsedSeconds}s</span>
                <span>•</span>
              </>
            )}
            {job.attempts > 0 && job.attempts < job.maxAttempts && (
              <span className="text-yellow-400">Retry {job.attempts}/{job.maxAttempts}</span>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {isFailed && job.error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400 font-medium">{job.error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function JobProgressBadge({ jobId }: { jobId: string }) {
  const { data: job } = useJobPolling(jobId, { showToasts: false });

  if (!job) return null;

  const progress = Math.min(Math.max(job.progress || 0, 0), 100);
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] rounded-full border border-white/[0.08]">
      {job.status === 'processing' && (
        <div className="i-ph:circle-notch-bold animate-spin text-indigo-400 text-xs" />
      )}
      {isCompleted && (
        <div className="i-ph:check-circle-fill text-green-500 text-xs" />
      )}
      {isFailed && (
        <div className="i-ph:x-circle-fill text-red-500 text-xs" />
      )}
      <span className="text-[10px] font-bold text-white/70 tabular-nums">
        {progress}%
      </span>
    </div>
  );
}
