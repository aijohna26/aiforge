import { Queue, JobsOptions } from "bullmq";
import Redis from "ioredis";

export interface AiCommandJob {
  projectId: string;
  userId: string;
  prompt: string;
  mode: "coder" | "reviewer";
  currentFilePath?: string;
  reservedCredits: number;
  metadata?: Record<string, unknown>;
}

const redisUrl =
  process.env.REDIS_URL ||
  process.env.KV_REST_API_URL ||
  "redis://127.0.0.1:6379";

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const aiCommandQueueName = "ai-command";

export const aiCommandQueue = new Queue<AiCommandJob>(aiCommandQueueName, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
  } satisfies JobsOptions,
});
