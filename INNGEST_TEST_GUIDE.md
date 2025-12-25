# Inngest Integration Test Guide

## Current Status: ✅ READY TO TEST

Your Inngest integration is fully configured with async mode **ENABLED**.

## Quick Test Steps

### 1. Start Inngest Dev Server (Required for Local Testing)

Open a **new terminal** and run:

```bash
cd bolt.diy
npx inngest-cli@latest dev
```

This will:
- Start Inngest dashboard at `http://localhost:8288`
- Auto-discover functions from `http://localhost:5173/api/inngest`
- Show real-time job execution logs

**Keep this terminal open** while testing.

### 2. Verify Your Dev Server is Running

Your main dev server should already be running at `http://localhost:5173`

If not, start it:
```bash
cd bolt.diy
pnpm run dev
```

 Inngest dashboard accessible at http://localhost:8288

 Check http://localhost:5173/api/inngest returns function list
Restart Inngest dev server
Make sure USE_INNGEST_SCREEN_GEN=true in .env.local

npx inngest-cli@latest dev -u http://localhost:5173/api/inngest


### 3. Test Screen Generation

1. **Open your app**: `http://localhost:5173`
2. **Navigate to the wizard**: Go through steps 1-4
3. **Launch Studio** (Step 5)
4. **Watch for**:
   - Toast notification: "Generating screens in background..."
   - Progress bar appears in top-right corner
   - Progress updates from 0% → 100%
   - Screens appear when complete

### 4. Monitor in Inngest Dashboard

Open `http://localhost:8288` and you should see:
- **Functions** tab: `screen-generation` function registered
- **Runs** tab: Active job execution with real-time logs
- **Events** tab: `studio/generate.screens` events

### 5. Check Browser Console

Open DevTools Console and look for:
```
[Studio] Background generation started: <jobId>
[Inngest] Job completed, updating frames: [...]
```

### 6. Verify Job Status API

While a job is running, check its status:
```bash
# Replace <jobId> with the actual job ID from console
curl http://localhost:5173/api/jobs/<jobId>
```

Expected response:
```json
{
  "id": "...",
  "status": "processing",
  "progress": 45,
  "jobType": "screen-generation",
  ...
}
```

---

## Troubleshooting

### Issue: "INNGEST_EVENT_KEY not found"
**Solution**: Already configured in `.env.local` ✅

### Issue: Functions not appearing in Inngest dashboard
**Solution**: 
1. Make sure Inngest dev server is running
2. Check `http://localhost:5173/api/inngest` returns function list
3. Restart Inngest dev server

### Issue: Jobs stay in "pending" forever
**Solution**:
- Verify Inngest dev server is running
- Check Inngest dashboard for errors
- Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set

### Issue: Progress bar doesn't appear
**Solution**:
- Check browser console for errors
- Verify `jobId` is being set in state
- Check that `USE_INNGEST_SCREEN_GEN=true` in `.env.local`

### Issue: Screens don't update after completion
**Solution**:
- Check browser console for polling errors
- Verify `/api/jobs/<jobId>` returns correct data
- Check `onComplete` callback is firing

---

## Testing Checklist

- [ ] Inngest dev server running at `http://localhost:8288`
- [ ] Main dev server running at `http://localhost:5173`
- [ ] Functions registered in Inngest dashboard
- [ ] Screen generation triggers background job
- [ ] Progress bar appears and updates
- [ ] Job status API returns correct data
- [ ] Screens appear when job completes
- [ ] Toast notifications work
- [ ] Browser console shows correct logs

---

## Switching Between Sync/Async Modes

### Enable Async Mode (Current Setting)
```bash
# In .env.local
USE_INNGEST_SCREEN_GEN=true
```

### Disable Async Mode (Fallback to Sync)
```bash
# In .env.local
USE_INNGEST_SCREEN_GEN=false
```

Restart dev server after changing.

---

## Production Deployment

### 1. Add Environment Variables to Vercel

In Vercel Dashboard → Settings → Environment Variables:
```
INNGEST_EVENT_KEY=<your-event-key>
INNGEST_SIGNING_KEY=<your-signing-key>
USE_INNGEST_SCREEN_GEN=true
```

### 2. Deploy
```bash
git add .
git commit -m "Enable Inngest background jobs"
git push
```

### 3. Register with Inngest
1. Go to https://app.inngest.com/
2. Add your production URL: `https://your-domain.vercel.app/api/inngest`
3. Verify functions are synced

### 4. Test in Production
- Generate screens
- Monitor in Inngest dashboard
- Check for errors

---

## Database Migration (Optional)

Currently using **in-memory storage** (jobs lost on restart).

For production, implement real database in `app/lib/inngest/db/index.ts`:

### Option 1: Supabase (Recommended)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function createJob(input: CreateJobInput) {
  const jobId = uuidv4();
  await supabase.from('inngest_jobs').insert({
    id: jobId,
    job_type: input.jobType,
    // ... other fields
  });
  return jobId;
}
```

### Option 2: Prisma
See SQL schema in `app/lib/inngest/db/index.ts` comments.

---

## Support

- **Inngest Docs**: https://www.inngest.com/docs
- **Inngest Discord**: https://www.inngest.com/discord
- **Integration Guide**: See `INNGEST_INTEGRATION.md`
- **Phase 3 Guide**: See `PHASE_3_INTEGRATION_GUIDE.md`
