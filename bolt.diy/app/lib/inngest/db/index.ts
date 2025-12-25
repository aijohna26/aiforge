/**
 * Database Abstraction Layer for Inngest Jobs
 *
 * This module provides a generic interface for storing and retrieving Inngest job data.
 * Users must implement the actual database operations based on their database choice
 * (PostgreSQL, MySQL, SQLite, etc.).
 *
 * Database Schema (SQL):
 * ```sql
 * CREATE TABLE inngest_jobs (
 *   id VARCHAR(36) PRIMARY KEY,
 *   job_type VARCHAR(50) NOT NULL,
 *   status VARCHAR(20) NOT NULL DEFAULT 'pending',
 *   progress INTEGER NOT NULL DEFAULT 0,
 *   user_id VARCHAR(255),
 *   input_data TEXT NOT NULL,
 *   output_data TEXT,
 *   error_message TEXT,
 *   attempts INTEGER NOT NULL DEFAULT 0,
 *   max_attempts INTEGER NOT NULL DEFAULT 3,
 *   provider VARCHAR(50),
 *   model VARCHAR(100),
 *   token_usage_prompt INTEGER,
 *   token_usage_completion INTEGER,
 *   token_usage_total INTEGER,
 *   estimated_cost_usd DECIMAL(10, 6),
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   started_at TIMESTAMP,
 *   completed_at TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   INDEX idx_status (status),
 *   INDEX idx_job_type (job_type)
 * );
 * ```
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  InngestJob,
  JobType,
  JobStatus,
  CreateJobInput,
  UpdateJobStatusInput,
  UpdateJobProgressInput,
  TokenUsage,
} from '~/types/inngest-jobs';

/**
 * Creates a new job in the database
 */
export async function createJob(input: CreateJobInput): Promise<string> {
  const jobId = uuidv4();

  // TODO: Implement database insert
  // Example for PostgreSQL/MySQL:
  /*
  await db.query(`
    INSERT INTO inngest_jobs (
      id, job_type, status, progress, user_id, input_data, provider, model, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `, [
    jobId,
    input.jobType,
    'pending',
    0,
    input.userId || null,
    JSON.stringify(input.inputData),
    input.provider || null,
    input.model || null
  ]);
  */

  console.log('[Inngest DB] Created job:', {
    jobId,
    jobType: input.jobType,
    provider: input.provider,
    model: input.model,
  });

  // TEMPORARY: Store in memory (replace with actual DB)
  if (!globalThis.__INNGEST_JOBS__) {
    globalThis.__INNGEST_JOBS__ = new Map();
  }
  globalThis.__INNGEST_JOBS__.set(jobId, {
    id: jobId,
    jobType: input.jobType,
    status: 'pending' as JobStatus,
    progress: 0,
    userId: input.userId,
    inputData: input.inputData,
    attempts: 0,
    maxAttempts: 3,
    provider: input.provider,
    model: input.model,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return jobId;
}

/**
 * Updates job status and completion data
 */
export async function updateJobStatus(input: UpdateJobStatusInput): Promise<void> {
  const now = new Date();

  // TODO: Implement database update
  // Example for PostgreSQL/MySQL:
  /*
  await db.query(`
    UPDATE inngest_jobs SET
      status = ?,
      progress = ?,
      output_data = ?,
      error_message = ?,
      token_usage_prompt = ?,
      token_usage_completion = ?,
      token_usage_total = ?,
      estimated_cost_usd = ?,
      completed_at = ?,
      updated_at = NOW()
    WHERE id = ?
  `, [
    input.status,
    input.progress,
    input.outputData ? JSON.stringify(input.outputData) : null,
    input.error || null,
    input.tokenUsage?.prompt || null,
    input.tokenUsage?.completion || null,
    input.tokenUsage?.total || null,
    input.estimatedCostUsd || null,
    input.status === 'completed' || input.status === 'failed' ? now : null,
    input.jobId
  ]);
  */

  console.log('[Inngest DB] Updated job status:', {
    jobId: input.jobId,
    status: input.status,
    progress: input.progress,
    hasOutput: !!input.outputData,
    error: input.error,
  });

  // TEMPORARY: Update in memory
  if (globalThis.__INNGEST_JOBS__) {
    const job = globalThis.__INNGEST_JOBS__.get(input.jobId);
    if (job) {
      Object.assign(job, {
        status: input.status,
        progress: input.progress,
        outputData: input.outputData,
        error: input.error,
        tokenUsage: input.tokenUsage,
        estimatedCostUsd: input.estimatedCostUsd,
        completedAt: input.status === 'completed' || input.status === 'failed' ? now : job.completedAt,
        updatedAt: now,
      });
      if (input.status === 'processing' && !job.startedAt) {
        job.startedAt = now;
      }
    }
  }
}

/**
 * Updates only the progress of a job
 */
export async function updateJobProgress(input: UpdateJobProgressInput): Promise<void> {
  // TODO: Implement database update
  // Example for PostgreSQL/MySQL:
  /*
  await db.query(`
    UPDATE inngest_jobs SET
      progress = ?,
      updated_at = NOW()
    WHERE id = ?
  `, [input.progress, input.jobId]);
  */

  console.log('[Inngest DB] Updated job progress:', {
    jobId: input.jobId,
    progress: input.progress,
    message: input.message,
  });

  // TEMPORARY: Update in memory
  if (globalThis.__INNGEST_JOBS__) {
    const job = globalThis.__INNGEST_JOBS__.get(input.jobId);
    if (job) {
      job.progress = input.progress;
      job.updatedAt = new Date();
    }
  }
}

/**
 * Retrieves a job by ID
 */
export async function getJob(jobId: string): Promise<InngestJob | null> {
  // TODO: Implement database query
  // Example for PostgreSQL/MySQL:
  /*
  const result = await db.query(`
    SELECT
      id, job_type, status, progress, user_id, input_data, output_data,
      error_message, attempts, max_attempts, provider, model,
      token_usage_prompt, token_usage_completion, token_usage_total,
      estimated_cost_usd, created_at, started_at, completed_at, updated_at
    FROM inngest_jobs
    WHERE id = ?
  `, [jobId]);

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    jobType: row.job_type,
    status: row.status,
    progress: row.progress,
    userId: row.user_id,
    inputData: JSON.parse(row.input_data),
    outputData: row.output_data ? JSON.parse(row.output_data) : undefined,
    error: row.error_message,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    provider: row.provider,
    model: row.model,
    tokenUsage: row.token_usage_total ? {
      prompt: row.token_usage_prompt,
      completion: row.token_usage_completion,
      total: row.token_usage_total
    } : undefined,
    estimatedCostUsd: row.estimated_cost_usd,
    createdAt: new Date(row.created_at),
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    updatedAt: new Date(row.updated_at)
  };
  */

  // TEMPORARY: Retrieve from memory
  if (globalThis.__INNGEST_JOBS__) {
    const job = globalThis.__INNGEST_JOBS__.get(jobId);
    return job || null;
  }

  return null;
}

/**
 * Marks a job as failed with error message
 */
export async function markJobFailed(jobId: string, error: string): Promise<void> {
  await updateJobStatus({
    jobId,
    status: 'failed',
    progress: 0,
    error,
  });
}

/**
 * Increments the attempt counter for a job
 */
export async function incrementJobAttempts(jobId: string): Promise<void> {
  // TODO: Implement database update
  // Example for PostgreSQL/MySQL:
  /*
  await db.query(`
    UPDATE inngest_jobs SET
      attempts = attempts + 1,
      updated_at = NOW()
    WHERE id = ?
  `, [jobId]);
  */

  console.log('[Inngest DB] Incremented job attempts:', { jobId });

  // TEMPORARY: Update in memory
  if (globalThis.__INNGEST_JOBS__) {
    const job = globalThis.__INNGEST_JOBS__.get(jobId);
    if (job) {
      job.attempts++;
      job.updatedAt = new Date();
    }
  }
}

/**
 * Finds jobs stuck in processing state (for cleanup cron)
 */
export async function findStaleJobs(staleMinutes: number = 30): Promise<InngestJob[]> {
  // TODO: Implement database query
  // Example for PostgreSQL/MySQL:
  /*
  const cutoffTime = new Date(Date.now() - staleMinutes * 60 * 1000);
  const result = await db.query(`
    SELECT * FROM inngest_jobs
    WHERE status = 'processing'
      AND updated_at < ?
  `, [cutoffTime]);

  return result.rows.map(row => ({
    // ... map row to InngestJob
  }));
  */

  // TEMPORARY: Find from memory
  if (!globalThis.__INNGEST_JOBS__) return [];

  const cutoffTime = new Date(Date.now() - staleMinutes * 60 * 1000);
  const staleJobs: InngestJob[] = [];

  for (const job of globalThis.__INNGEST_JOBS__.values()) {
    if (job.status === 'processing' && job.updatedAt < cutoffTime) {
      staleJobs.push(job);
    }
  }

  return staleJobs;
}

// TypeScript global declaration for temporary in-memory storage
declare global {
  var __INNGEST_JOBS__: Map<string, InngestJob> | undefined;
}
