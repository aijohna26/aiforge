# Phase 3: Frontend Integration - Complete Implementation Guide

## Overview
Phase 3 integrates Inngest background jobs with the frontend, enabling real-time progress updates and non-blocking UI during screen generation.

## ✅ Completed Components

### 1. React Query Hook: `useJobPolling`
**File**: `bolt.diy/app/lib/hooks/useJobPolling.ts`

**Features**:
- Polls job status every 2 seconds
- Auto-stops on completion/failure
- Toast notifications
- Callback support
- Type-safe with InngestJob interface

**Usage**:
```typescript
import { useScreenGenerationPolling } from '~/lib/hooks/useJobPolling';

const { data: job } = useScreenGenerationPolling(jobId, (screens) => {
  setFrames(screens);
  setJobId(null);
});
```

### 2. Progress UI Component: `JobProgressBar`
**File**: `bolt.diy/app/components/inngest/JobProgressBar.tsx`

**Features**:
- Animated progress bar with shimmer effect
- Status indicators (processing, completed, failed)
- Elapsed time display
- Error message display
- Compact badge version available

**Usage**:
```tsx
import { JobProgressBar } from '~/components/inngest/JobProgressBar';

<JobProgressBar
  jobId={jobId}
  onComplete={(result) => setFrames(result.screens)}
  showDetails={true}
/>
```

### 3. Dual-Mode API Routes

#### Screen Generation API
**File**: `bolt.diy/app/routes/api.studio.generate.ts`

**Changes**:
- Added `userId` parameter support
- Feature flag check: `FEATURE_FLAGS.USE_INNGEST_SCREEN_GEN`
- Returns `{ mode: 'async', jobId, status: 'pending' }` when Inngest enabled
- Returns `{ mode: 'sync', screens, theme }` when disabled
- Fully backward compatible

#### Screenshot API
**File**: `bolt.diy/app/routes/api.screenshot.ts`

**Changes**:
- Added `userId` parameter support
- Feature flag check: `FEATURE_FLAGS.USE_INNGEST_SCREENSHOT`
- Same dual-mode response pattern
- Fully backward compatible

---

## 🚧 Integration into Step5Interactive (Pending)

### Current Flow (Synchronous)
```typescript
handleInitialize() {
  setStatus('generating');

  // Create placeholder frames
  setFrames(placeholderFrames);

  // Call API (blocks for 30+ seconds)
  const response = await fetch('/api/studio/generate', {
    body: JSON.stringify({ branding, screens, includeTheme: true })
  });

  const data = await response.json();

  // Update with real frames
  setFrames(data.screens);
  setStatus('preview');
}
```

### Proposed Flow (Async with Inngest)
```typescript
const [jobId, setJobId] = useState<string | null>(null);

// Poll for job completion
useScreenGenerationPolling(jobId, (screens) => {
  setFrames(screens.map((s, idx) => ({
    ...s,
    x: 2300 + (idx * 450),
    y: 2200
  })));
  setJobId(null);
  setStatus('preview');
  persistStudioFrames(screens);
});

handleInitialize() {
  setIsFullscreen(true);
  setStatus('generating');

  // Create placeholder frames
  setFrames(placeholderFrames);

  // Call API (returns immediately)
  const response = await fetch('/api/studio/generate', {
    body: JSON.stringify({
      branding,
      screens,
      includeTheme: true,
      userId: 'user-123' // Add user ID for channel targeting
    })
  });

  const data = await response.json();

  // Handle dual mode
  if (data.mode === 'async') {
    // Inngest mode: Start polling
    setJobId(data.jobId);
  } else {
    // Sync mode: Update immediately (backward compatible)
    setFrames(data.screens.map((s, idx) => ({
      ...s,
      x: 2300 + (idx * 450),
      y: 2200
    })));
    setStatus('preview');
  }
}
```

### Required Changes to Step5Interactive.tsx

#### 1. Add Imports
```typescript
import { useScreenGenerationPolling } from '~/lib/hooks/useJobPolling';
import { JobProgressBar } from '~/components/inngest/JobProgressBar';
import { FEATURE_FLAGS } from '~/lib/feature-flags';
```

#### 2. Add State
```typescript
const [jobId, setJobId] = useState<string | null>(null);
```

#### 3. Add Polling Hook
```typescript
useScreenGenerationPolling(jobId, (result) => {
  if (result?.screens) {
    const generatedFrames = result.screens.map((s: any, index: number) => ({
      id: s.id,
      title: s.title,
      html: s.html,
      x: 2300 + (index * 450),
      y: 2200
    }));

    setFrames(generatedFrames);
    persistStudioFrames(generatedFrames);
    setStatus('preview');
    setJobId(null);

    if (result.theme) {
      setCustomTheme(result.theme);
    }
  }
});
```

#### 4. Update handleInitialize
Replace lines 138-183 with:
```typescript
const response = await fetch('/api/studio/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    branding,
    screens: finalScreens,
    includeTheme: true,
    userId: 'user-placeholder' // TODO: Get from auth context
  })
});

if (!response.ok) {
  const errorData = await response.json();
  console.error('[App Forge] API Error:', response.status, errorData);
  throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
}

const data = await response.json();

// Handle dual mode response
if (data.mode === 'async') {
  console.log('[Studio] Background generation started:', data.jobId);
  setJobId(data.jobId);
  toast.info('Generating screens in background...');
} else {
  // Backward compatible sync mode
  if (data.theme) {
    setCustomTheme(data.theme);
  }

  const generatedFrames = data.screens.map((s: any, index: number) => ({
    id: s.id,
    title: s.title,
    html: s.html,
    x: 2300 + (index * 450),
    y: 2200
  }));

  setFrames(generatedFrames);
  persistStudioFrames(generatedFrames);
  setStatus('preview');
  toast.success('Studio initialized with custom brand theme.');
}

hasGeneratedRef.current = true;
snapshotRef.current = latestSnapshotRef.current || wizardSnapshot;
```

#### 5. Add Progress UI (Optional)
In the render section, add progress indicator when job is running:
```tsx
{status === 'generating' && jobId && (
  <div className="fixed top-4 right-4 z-50 w-96 bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
    <h3 className="text-sm font-bold text-white mb-3">Generating Screens</h3>
    <JobProgressBar
      jobId={jobId}
      showDetails={true}
    />
  </div>
)}
```

---

## Testing Plan

### 1. Test Synchronous Mode (Default)
```bash
# Ensure .env.local has:
USE_INNGEST_SCREEN_GEN=false
```
- Generate screens
- Verify blocking behavior (expected)
- Verify screens appear after completion

### 2. Test Async Mode (Inngest)
```bash
# Set in .env.local:
USE_INNGEST_SCREEN_GEN=true
INNGEST_EVENT_KEY=your_key
INNGEST_SIGNING_KEY=your_key
```
- Generate screens
- Verify immediate response with jobId
- Verify placeholder frames appear
- Verify progress updates
- Verify final screens appear
- Check job status at `/api/jobs/{jobId}`

### 3. Test Error Handling
- Invalid API key → Should show error
- Network failure → Should retry 3 times
- Inngest unavailable → Should fail gracefully

### 4. Test Progress UI
- Progress bar animation
- Status updates (0% → 10% → 50% → 100%)
- Completion notification
- Error display

---

## Deployment Checklist

### Local Development
- [x] Install `inngest` and `@inngest/realtime`
- [x] Create database schema (or use in-memory for testing)
- [x] Set environment variables in `.env.local`
- [x] Start dev server
- [ ] Test both sync and async modes

### Vercel Deployment
1. **Add Environment Variables** in Vercel dashboard:
   - `INNGEST_EVENT_KEY`
   - `INNGEST_SIGNING_KEY`
   - `USE_INNGEST_SCREEN_GEN=false` (start disabled)

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Add Inngest background job support"
   git push
   ```

3. **Register with Inngest**:
   - Go to https://app.inngest.com/
   - Add your app: `https://your-domain.vercel.app/api/inngest`
   - Verify functions are registered

4. **Gradual Rollout**:
   - Week 1: `USE_INNGEST_SCREEN_GEN=false` (test deployment)
   - Week 2: `USE_INNGEST_SCREEN_GEN=true` (10% traffic)
   - Week 3: Monitor, increase to 50%
   - Week 4: 100% traffic
   - Week 5: Remove sync code path

### Database Setup
For production, replace in-memory storage with real database:

```typescript
// bolt.diy/app/lib/inngest/db/index.ts
export async function createJob(input: CreateJobInput): Promise<string> {
  const jobId = uuidv4();

  // Example with Prisma
  await db.inngestJob.create({
    data: {
      id: jobId,
      jobType: input.jobType,
      status: 'pending',
      progress: 0,
      userId: input.userId,
      inputData: JSON.stringify(input.inputData),
      provider: input.provider,
      model: input.model,
    }
  });

  return jobId;
}
```

---

## Real-Time Progress Events

When Inngest mode is enabled, clients can subscribe to real-time events:

### Server-Side Events (Published by Inngest Functions)
```typescript
// Screen Generation
channel.publish(`user:${userId}`, {
  type: 'generation.start',        // Started
  type: 'theme.generating',        // Generating theme
  type: 'theme.complete',          // Theme ready
  type: 'screen.generating',       // Starting screen N
  type: 'screen.complete',         // Screen N done
  type: 'generation.complete',     // All screens done
  type: 'generation.failed',       // Error
});
```

### Client-Side Subscription (Future Enhancement)
```typescript
import { useRealtime } from '@inngest/realtime/react';

const { events } = useRealtime(`user:${userId}`);

useEffect(() => {
  const latestEvent = events[events.length - 1];

  if (latestEvent?.type === 'screen.complete') {
    toast.success(`${latestEvent.screenName} completed!`);
  }
}, [events]);
```

---

## Monitoring & Observability

### Database Queries
```sql
-- Active jobs
SELECT id, job_type, status, progress, created_at
FROM inngest_jobs
WHERE status IN ('pending', 'processing')
ORDER BY created_at DESC;

-- Failed jobs (last hour)
SELECT id, job_type, error_message, attempts, created_at
FROM inngest_jobs
WHERE status = 'failed' AND created_at >= NOW() - INTERVAL 1 HOUR;

-- Success rate (last 24 hours)
SELECT
  job_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate,
  AVG(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as avg_duration_sec
FROM inngest_jobs
WHERE created_at >= NOW() - INTERVAL 24 HOUR
GROUP BY job_type;
```

### Inngest Dashboard
- View function executions: https://app.inngest.com/
- Monitor retry rates
- View error logs
- Track execution times

---

## Next Steps

1. **Integrate into Step5Interactive** (see guide above)
2. **Test locally** with both modes
3. **Deploy to Vercel** with flags disabled
4. **Enable Inngest** for 10% of traffic
5. **Monitor** success rates and performance
6. **Scale up** gradually to 100%

---

## Support & Troubleshooting

### Common Issues

**"INNGEST_EVENT_KEY not found"**
- Add to `.env.local` or Vercel environment variables

**"Job not found" when polling**
- Check database connection
- Verify job was created in `createJob()`

**Screens not updating after completion**
- Verify `onComplete` callback in `useJobPolling`
- Check job status at `/api/jobs/{jobId}`

**Real-time events not working**
- Verify `@inngest/realtime` is installed
- Check `realtimeMiddleware()` is added to client

### Debug Mode
Enable detailed logging:
```typescript
// Add to Inngest client
export const inngest = new Inngest({
  id: 'appforge-ai',
  eventKey: process.env.INNGEST_EVENT_KEY,
  middleware: [realtimeMiddleware()],
  logger: console, // Enable debug logs
});
```
