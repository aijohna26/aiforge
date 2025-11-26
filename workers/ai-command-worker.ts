import { Worker, Job } from "bullmq";
import { randomUUID } from "crypto";
import {
  aiCommandQueueName,
  redisConnection,
  AiCommandJob,
} from "@/lib/ai-queue";
import { WorkspaceManager } from "@/lib/workspace-manager";
import { runAiCommand } from "@/lib/kilo-runner";
import { emitJobEvent } from "@/lib/job-events";
import { walletManager } from "@/lib/wallet";

const workspaceManager = new WorkspaceManager();

async function handleJob(job: Job<AiCommandJob>) {
  const { projectId, prompt, userId, reservedCredits } = job.data;
  const jobId = job.id?.toString() ?? randomUUID();

  emitJobEvent({
    jobId,
    type: "job:started",
    data: { projectId },
  });

  await workspaceManager.initProject(projectId);
  const branch = `ai/session-${jobId}`;
  await workspaceManager.checkoutBranch(projectId, branch);

  const { worktree } = workspaceManager.getProjectPaths(projectId);

  emitJobEvent({
    jobId,
    type: "job:log",
    data: { message: "Calling Claude via Kilo runner..." },
  });

  const aiResult = await runAiCommand({
    projectId,
    prompt,
    workspacePath: worktree,
  });

  emitJobEvent({
    jobId,
    type: "job:log",
    data: { message: aiResult.summary },
  });

  await workspaceManager.writeFiles(
    projectId,
    aiResult.files,
    `feat: apply AI command ${jobId}`
  );

  await workspaceManager.checkoutBranch(
    projectId,
    workspaceManager.getDefaultBranch()
  );

  const totalTokens =
    (aiResult.tokens?.input ?? 0) + (aiResult.tokens?.output ?? 0);
  const tokenCost = Math.max(Math.ceil(totalTokens / 1000), 1);
  await walletManager.settle(userId, reservedCredits, tokenCost);

  emitJobEvent({
    jobId,
    type: "job:completed",
    data: {
      filesCreated: aiResult.files.map((f) => f.path),
      tokens: aiResult.tokens,
      cost: tokenCost,
    },
  });

  return {
    filesCreated: aiResult.files.map((f) => f.path),
    summary: aiResult.summary,
    tokens: aiResult.tokens,
  };
}

export const aiCommandWorker = new Worker<AiCommandJob>(
  aiCommandQueueName,
  handleJob,
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

aiCommandWorker.on("completed", (job) => {
  console.log(`[AI Worker] Job ${job.id} completed.`);
});

aiCommandWorker.on("failed", (job, err) => {
  emitJobEvent({
    jobId: job?.id?.toString() ?? "unknown",
    type: "job:error",
    data: { message: err?.message ?? "Unknown error" },
  });
  console.error(`[AI Worker] Job ${job?.id} failed:`, err);
});
