/**
 * Inngest Job Types
 *
 * Type definitions for background job processing with Inngest.
 * These types define the structure of jobs tracked in the database.
 */

export type JobType =
  | 'screen-generation'
  | 'screenshot-export'
  | 'chat-context'
  | 'style-extraction'
  | 'image-generation';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface InngestJob {
  id: string;
  jobType: JobType;
  status: JobStatus;
  progress: number;
  userId?: string;
  inputData: any;
  outputData?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  provider?: string;
  model?: string;
  tokenUsage?: TokenUsage;
  estimatedCostUsd?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface CreateJobInput {
  jobType: JobType;
  userId?: string;
  inputData: any;
  provider?: string;
  model?: string;
}

export interface UpdateJobStatusInput {
  jobId: string;
  status: JobStatus;
  progress: number;
  outputData?: any;
  error?: string;
  tokenUsage?: TokenUsage;
  estimatedCostUsd?: number;
}

export interface UpdateJobProgressInput {
  jobId: string;
  progress: number;
  message?: string;
}
