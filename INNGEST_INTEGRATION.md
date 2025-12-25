# Inngest Integration Guide for AppForge AI

## Overview

This document provides a complete guide for integrating Inngest into AppForge AI to scale LLM operations through background job processing. The integration converts synchronous LLM calls into resilient, scalable background jobs with full progress tracking and cost optimization.

## Table of Contents

1. [Why Inngest?](#why-inngest)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
5. [Phase 2: Inngest Functions](#phase-2-inngest-functions)
6. [Phase 3: API Routes](#phase-3-api-routes)
7. [Phase 4: Frontend Integration](#phase-4-frontend-integration)
8. [Phase 5: Deployment](#phase-5-deployment)
9. [Migration Strategy](#migration-strategy)
10. [Monitoring](#monitoring)
11. [Troubleshooting](#troubleshooting)

---

## Why Inngest?

### Current Problems

1. **No background job system** - All LLM calls run synchronously within HTTP handlers
2. **Timeout risks** - Screen generation (4-8s each) + screenshots (5s+) can exceed serverless limits
3. **No retry logic** - Failed operations lose all progress
4. **Poor UX** - Users wait with blocking UI during long operations
5. **No cost tracking** - Token usage not tracked across operations

### Benefits of Inngest

- ✅ **Automatic retries** with exponential backoff
- ✅ **Concurrency control** - limit concurrent LLM calls to avoid rate limits
- ✅ **Progress tracking** - real-time updates to users
- ✅ **Cost visibility** - track token usage and estimated costs
- ✅ **Scalability** - handle 10x more concurrent operations
- ✅ **Reliability** - jobs persist across deployments and restarts

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Client (React + React Query)            │
│                  - Polls job status every 2s             │
│                  - Shows progress bar                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ POST /api/studio/generate
                         ↓
┌─────────────────────────────────────────────────────────┐
│              API Route (Job Enqueuer)                    │
│              - Creates job in database                   │
│              - Returns jobId immediately                 │
│              - Sends event to Inngest                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ inngest.send()
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Inngest Platform (Cloud)                    │
│              - Queue management                          │
│              - Retry logic (3 attempts)                  │
│              - Rate limiting                             │
│              - Concurrency control (5 max)               │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Triggers function
                         ↓
┌─────────────────────────────────────────────────────────┐
│         Inngest Function (Background Worker)             │
│         - Calls StudioAgent.generateScreen()             │
│         - Updates database with progress                 │
│         - Tracks token usage and cost                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Updates job state
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    Database                              │
│                    - Job status                          │
│                    - Progress percentage                 │
│                    - Results/errors                      │
│                    - Token usage                         │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. Inngest Account

Sign up at [inngest.com](https://www.inngest.com/)

### 2. Database

You'll need a database (PostgreSQL, MySQL, or SQLite) to store job state. The plan includes a generic SQL schema that works with all three.

### 3. Environment Variables

```bash
# Inngest
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
INNGEST_APP_ID=appforge-ai

# Feature Flags
USE_INNGEST_SCREEN_GEN=false
USE_INNGEST_SCREENSHOT=false

# Database (if not already configured)
DATABASE_URL=your-database-url
```

---

## Phase 1: Core Infrastructure

### Step 1: Install Inngest

```bash
cd bolt.diy
pnpm add inngest@^3.32.0
```

### Step 2: Create Database Tables

Run this SQL in your database:

```sql
CREATE TABLE inngest_jobs (
  id VARCHAR(36) PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,

  user_id VARCHAR(255),
  input_data TEXT NOT NULL,
  output_data TEXT,
  error_message TEXT,

  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,

  provider VARCHAR(50),
  model VARCHAR(100),
  token_usage_prompt INTEGER,
  token_usage_completion INTEGER,
  token_usage_total INTEGER,
  estimated_cost_usd DECIMAL(10, 6),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_job_type (job_type)
);
```

### Step 3: Create TypeScript Types

Create `bolt.diy/app/types/inngest-jobs.ts`:

```typescript
export type JobType = 'screen-generation' | 'screenshot-export' | 'chat-context' | 'style-extraction';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface InngestJob {
  id: string;
  jobType: JobType;
  status: JobStatus;
  progress: number;
  inputData: any;
  outputData?: any;
  error?: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCostUsd?: number;
  createdAt: Date;
  completedAt?: Date;
}
```

### Step 4: Database Abstraction Layer

Create `bolt.diy/app/lib/inngest/db/index.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid';
import type { JobType, JobStatus, InngestJob } from '~/types/inngest-jobs';

// TODO: Replace with your actual database client
// This example uses a generic pattern - adapt to your database
import { db } from '~/lib/db'; // Your database client

export async function createJob(jobType: JobType, inputData: any): Promise<string> {
  const jobId = uuidv4();

  await db.query(
    `INSERT INTO inngest_jobs (id, job_type, status, progress, input_data, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [jobId, jobType, 'pending', 0, JSON.stringify(inputData)]
  );

  return jobId;
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  progress: number,
  outputData?: any
): Promise<void> {
  const fields: string[] = ['status = ?', 'progress = ?', 'updated_at = NOW()'];
  const values: any[] = [status, progress];

  if (status === 'processing' && progress === 0) {
    fields.push('started_at = NOW()');
  }

  if (status === 'completed' || status === 'failed') {
    fields.push('completed_at = NOW()');
  }

  if (outputData) {
    fields.push('output_data = ?');
    values.push(JSON.stringify(outputData));
  }

  values.push(jobId);

  await db.query(
    `UPDATE inngest_jobs SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function updateJobProgress(
  jobId: string,
  progress: number,
  message?: string
): Promise<void> {
  await db.query(
    `UPDATE inngest_jobs SET progress = ?, updated_at = NOW() WHERE id = ?`,
    [progress, jobId]
  );
}

export async function getJob(jobId: string): Promise<InngestJob | null> {
  const [row] = await db.query(
    `SELECT * FROM inngest_jobs WHERE id = ?`,
    [jobId]
  );

  if (!row) return null;

  return {
    id: row.id,
    jobType: row.job_type as JobType,
    status: row.status as JobStatus,
    progress: row.progress,
    inputData: JSON.parse(row.input_data),
    outputData: row.output_data ? JSON.parse(row.output_data) : undefined,
    error: row.error_message || undefined,
    tokenUsage: row.token_usage_total ? {
      prompt: row.token_usage_prompt,
      completion: row.token_usage_completion,
      total: row.token_usage_total,
    } : undefined,
    estimatedCostUsd: row.estimated_cost_usd || undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
  };
}

export async function markJobFailed(jobId: string, error: string): Promise<void> {
  await db.query(
    `UPDATE inngest_jobs
     SET status = 'failed', error_message = ?, completed_at = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [error, jobId]
  );
}
```

### Step 5: Initialize Inngest Client

Create `bolt.diy/app/lib/inngest/client.ts`:

```typescript
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'appforge-ai',
  eventKey: process.env.INNGEST_EVENT_KEY!,
});
```

---

## Phase 2: Inngest Functions

### Screen Generation Function

Create `bolt.diy/app/lib/inngest/functions/screen-generation.ts`:

```typescript
import { inngest } from '../client';
import { updateJobStatus, updateJobProgress } from '../db';
import { StudioAgent } from '~/lib/modules/studio/StudioAgent';

export const screenGeneration = inngest.createFunction(
  {
    id: 'screen-generation',
    retries: 3,
    concurrency: { limit: 5 }, // Max 5 concurrent screen generations
  },
  { event: 'studio/generate.screens' },
  async ({ event, step }) => {
    const { jobId, branding, screens, includeTheme } = event.data;

    // Step 1: Mark job as processing
    await step.run('mark-processing', async () => {
      await updateJobStatus(jobId, 'processing', 0);
    });

    // Step 2: Initialize agent
    const agent = new StudioAgent(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    // Step 3: Generate theme if requested
    let theme = null;
    if (includeTheme) {
      theme = await step.run('generate-theme', async () => {
        return await agent.generateTheme(branding);
      });
    }

    // Step 4: Generate screens (one step per screen for granular retry)
    const results = [];
    for (let i = 0; i < screens.length; i++) {
      const result = await step.run(`generate-screen-${i}`, async () => {
        const screen = await agent.generateScreen(branding, screens[i]);

        // Update progress after each screen
        const progress = Math.round(((i + 1) / screens.length) * 100);
        await updateJobProgress(jobId, progress);

        return screen;
      });
      results.push(result);
    }

    // Step 5: Complete job
    await step.run('complete-job', async () => {
      await updateJobStatus(jobId, 'completed', 100, {
        screens: results,
        theme: theme,
      });
    });

    return { success: true, jobId, screenCount: results.length };
  }
);
```

### Function Registry

Create `bolt.diy/app/lib/inngest/functions/index.ts`:

```typescript
import { screenGeneration } from './screen-generation';
// Import other functions as you create them

export const functions = [
  screenGeneration,
  // Add other functions here
];
```

---

## Phase 3: API Routes

### Inngest Serve Endpoint

Create `bolt.diy/app/routes/api.inngest.ts`:

```typescript
import { serve } from 'inngest/remix';
import { inngest } from '~/lib/inngest/client';
import { functions } from '~/lib/inngest/functions';

export const { GET, POST } = serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY!,
});
```

### Refactor Screen Generation Endpoint

Modify `bolt.diy/app/routes/api.studio.generate.ts`:

```typescript
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { StudioAgent } from '~/lib/modules/studio/StudioAgent';
import { inngest } from '~/lib/inngest/client';
import { createJob } from '~/lib/inngest/db';

// Feature flag
const USE_INNGEST = process.env.USE_INNGEST_SCREEN_GEN === 'true';

export async function action({ request }: ActionFunctionArgs) {
  const { branding, screens, includeTheme } = await request.json();

  if (USE_INNGEST) {
    // NEW PATH: Enqueue job
    const jobId = await createJob('screen-generation', {
      branding,
      screens,
      includeTheme,
    });

    await inngest.send({
      name: 'studio/generate.screens',
      data: { jobId, branding, screens, includeTheme },
    });

    return json({ jobId, status: 'pending' });
  } else {
    // OLD PATH: Synchronous execution (keep for backward compatibility)
    const agent = new StudioAgent(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    let theme = null;
    if (includeTheme) {
      theme = await agent.generateTheme(branding);
    }

    const generatedScreens = await Promise.all(
      screens.map((screen: any) => agent.generateScreen(branding, screen))
    );

    return json({
      screens: generatedScreens,
      theme: theme,
    });
  }
}
```

### Job Status Endpoint

Create `bolt.diy/app/routes/api.jobs.$jobId.ts`:

```typescript
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getJob } from '~/lib/inngest/db';

export async function loader({ params }: LoaderFunctionArgs) {
  const job = await getJob(params.jobId!);

  if (!job) {
    throw new Response('Job not found', { status: 404 });
  }

  return json(job);
}
```

---

## Phase 4: Frontend Integration

### Job Polling Hook

Create `bolt.diy/app/lib/hooks/useJobPolling.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export function useJobPolling(
  jobId: string | null,
  onComplete?: (result: any) => void
) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error('Failed to fetch job');
      return res.json();
    },
    enabled: !!jobId,
    refetchInterval: (data) => {
      if (!data) return 2000;

      if (data.status === 'completed') {
        onComplete?.(data.outputData);
        toast.success('Job completed successfully!');
        return false; // Stop polling
      }

      if (data.status === 'failed') {
        toast.error(`Job failed: ${data.error || 'Unknown error'}`);
        return false; // Stop polling
      }

      return 2000; // Poll every 2 seconds
    },
  });
}
```

### Update Step5Interactive Component

Modify `bolt.diy/app/components/workbench/design/Step5Interactive.tsx`:

```typescript
// Add these imports
import { useJobPolling } from '~/lib/hooks/useJobPolling';

// Inside the component, add state for jobId
const [jobId, setJobId] = useState<string | null>(null);

// Add polling hook
useJobPolling(jobId, (result) => {
  console.log('Job completed:', result);
  if (result.screens) {
    setFrames(result.screens.map((s: any, index: number) => ({
      id: s.id,
      title: s.title,
      html: s.html,
      x: 2300 + (index * 450),
      y: 2200,
    })));
  }
  if (result.theme) {
    setCustomTheme(result.theme);
  }
  setJobId(null);
  setStatus('preview');
});

// Modify handleInitialize to check for Inngest mode
const handleInitialize = useCallback(async () => {
  setIsFullscreen(true);
  setStatus('generating');

  // Check if Inngest is enabled
  const useInng est = process.env.USE_INNGEST_SCREEN_GEN === 'true';

  try {
    const response = await fetch('/api/studio/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branding, screens: finalScreens, includeTheme: true })
    });

    const data = await response.json();

    if (useInngest && data.jobId) {
      // Inngest mode: Set jobId to start polling
      setJobId(data.jobId);
    } else {
      // Synchronous mode: Process results immediately
      // ... existing code
    }
  } catch (error) {
    console.error('Generation failed:', error);
    toast.error('Failed to start generation');
    setStatus('idle');
  }
}, [/* dependencies */]);
```

---

## Phase 5: Deployment

### 1. Update Vercel Configuration

Create or update `vercel.json`:

```json
{
  "functions": {
    "app/routes/api.inngest.ts": {
      "maxDuration": 300
    }
  }
}
```

### 2. Deploy to Vercel

```bash
vercel deploy --prod
```

### 3. Register with Inngest

1. Go to [Inngest Dashboard](https://app.inngest.com/)
2. Navigate to your app
3. Add your production URL: `https://your-app.vercel.app/api/inngest`
4. Inngest will verify the endpoint

### 4. Test the Integration

1. Enable the feature flag: `USE_INNGEST_SCREEN_GEN=true`
2. Generate screens in your app
3. Check Inngest dashboard for job execution
4. Monitor database for job records

---

## Migration Strategy

### Week 1: Setup & Testing
- ✅ Install Inngest package
- ✅ Create database tables
- ✅ Deploy Inngest serve endpoint
- ✅ Test with 0% traffic (flag off)

### Week 2: Screen Generation Pilot
- Enable for 10% of requests
- Monitor success rate, duration, errors
- Adjust concurrency/retry settings

### Week 3: Full Rollout
- Increase to 50% traffic
- Increase to 100% traffic
- Monitor for 3 days

### Week 4: Cleanup
- Remove old synchronous code
- Remove feature flag
- Document new flow

---

## Monitoring

### Key Metrics

Track these metrics in your database:

```sql
-- Success rate by job type
SELECT
  job_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM inngest_jobs
WHERE created_at >= NOW() - INTERVAL 7 DAY
GROUP BY job_type;

-- Average duration
SELECT
  job_type,
  AVG(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as avg_duration_seconds
FROM inngest_jobs
WHERE status = 'completed'
  AND created_at >= NOW() - INTERVAL 7 DAY
GROUP BY job_type;

-- Daily cost
SELECT
  DATE(created_at) as date,
  SUM(estimated_cost_usd) as total_cost,
  COUNT(*) as total_jobs
FROM inngest_jobs
WHERE created_at >= NOW() - INTERVAL 30 DAY
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Inngest Dashboard

Monitor in the Inngest dashboard:
- Function runs
- Success/failure rates
- Average execution time
- Retry attempts
- Concurrency usage

---

## Troubleshooting

### Job stuck in "processing"

**Cause**: Function crashed or timed out

**Solution**:
1. Check Inngest dashboard for error logs
2. Verify timeout settings (5 min default)
3. Implement cleanup cron job to mark stale jobs as failed

### High failure rate

**Cause**: LLM API errors or rate limits

**Solution**:
1. Review Inngest retry logs
2. Adjust concurrency limit (reduce from 5 to 3)
3. Check LLM provider API status

### Jobs not starting

**Cause**: Inngest endpoint not registered or signing key mismatch

**Solution**:
1. Verify `/api/inngest` is accessible: `curl https://your-app.vercel.app/api/inngest`
2. Check `INNGEST_SIGNING_KEY` matches dashboard
3. Re-sync endpoint in Inngest dashboard

### Database connection issues

**Cause**: Connection pool exhausted

**Solution**:
1. Implement connection pooling
2. Use singleton database client
3. Add connection retry logic

---

## Next Steps

1. **Implement Screenshot Export** - Follow same pattern as screen generation
2. **Add Chat Context Function** - Offload heavy summary operations
3. **Create Admin Dashboard** - View all jobs, retry failed ones
4. **Add Webhooks** - Notify users via email/SMS when jobs complete
5. **Implement Rate Limiting** - Per-user job limits

---

## Support

- **Inngest Docs**: https://www.inngest.com/docs
- **Inngest Discord**: https://www.inngest.com/discord
- **Plan File**: See `.claude/plans/twinkly-stargazing-lobster.md` for detailed implementation plan

---

## License

This integration guide is part of AppForge AI and follows the same license.
