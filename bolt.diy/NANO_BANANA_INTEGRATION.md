# Nano Banana Image Generation Integration

## Overview

This implementation adds AI-powered image generation capabilities to the StudioAgent using Google's Nano Banana models via the Kie API. The LLM can now intelligently generate custom branded imagery during screen generation.

## Architecture

```
StudioAgent.generateScreen()
    ↓
LLM decides to generate image
    ↓
Calls generateImage tool
    ↓
Creates Inngest job in database
    ↓
Sends event to Inngest worker
    ↓
Worker polls Kie API (10s intervals, max 10 attempts)
    ↓
Downloads image & persists to Supabase Storage
    ↓
Returns permanent URL to LLM
    ↓
LLM embeds image in generated HTML
```

## Files Created/Modified

### New Files

1. **`app/lib/inngest/functions/image-generation.ts`**
   - Main Inngest function for image generation
   - Handles Kie API polling (10s intervals, max 10 attempts = 100s timeout)
   - Manages credit reservation/settlement/refund flow (currently stubbed)
   - Persists images to Supabase Storage
   - Publishes real-time progress events

### Modified Files

1. **`app/lib/inngest/client.ts`**
   - Added `media/generate.image` event type definition

2. **`app/lib/inngest/functions/index.ts`**
   - Registered `imageGeneration` function in the functions array

3. **`app/lib/modules/studio/StudioAgent.ts`**
   - Added `generateImage` tool to the tools object
   - Added `enhanceImagePromptForBranding()` helper method
   - Added `pollJobCompletion()` helper method
   - Updated system prompt with image generation guidelines
   - Added `userId` field to `StudioBranding` interface

4. **`app/types/inngest-jobs.ts`**
   - Added `'image-generation'` to `JobType` union

5. **`.env.example`**
   - Added `KIE_API_KEY` environment variable
   - Added `USE_INNGEST_IMAGE_GEN` feature flag
   - Added `SUPABASE_SERVICE_ROLE_KEY` for server-side uploads
   - Added `NEXT_PUBLIC_SUPABASE_URL` for public access

## Environment Variables

Add these to your `.env.local`:

```bash
# Kie API (Required)
KIE_API_KEY=your_kie_api_key_here

# Supabase (Required for image persistence)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Feature Flag (Optional - defaults to false)
USE_INNGEST_IMAGE_GEN=false

# Inngest (Should already be configured)
INNGEST_EVENT_KEY=your_inngest_event_key_here
INNGEST_SIGNING_KEY=your_inngest_signing_key_here
```

## How It Works

### 1. LLM Tool Integration

The `generateImage` tool is added to the StudioAgent's toolkit alongside the existing `searchImages` tool. The LLM can invoke it when generating screens:

**When to Use:**
- Splash screens: Hero background imagery
- Home/Dashboard: Feature card illustrations
- Onboarding: Step-by-step visual guides
- Empty states: Friendly illustrations

**When NOT to Use:**
- Icons or logos (use provided assets)
- Generic stock photos (use `searchImages` instead for speed/cost)

### 2. Tool Execution Flow

```typescript
generateImage: tool({
  parameters: z.object({
    description: z.string(),
    imageType: z.enum(['hero', 'background', 'illustration', 'feature-card']),
    aspectRatio: z.string().default('9:16'),
  }),
  execute: async ({ description, imageType, aspectRatio }) => {
    // 1. Enhance prompt with branding context
    const enhancedPrompt = enhanceImagePromptForBranding(...);

    // 2. Create job in database
    const jobId = await createJob({ jobType: 'image-generation', ... });

    // 3. Send to Inngest (non-blocking)
    await inngest.send({ name: 'media/generate.image', ... });

    // 4. Poll for completion (blocking)
    const imageUrl = await pollJobCompletion(jobId);

    // 5. Return URL to LLM
    return { imageUrl, alt: description, imageType };
  }
})
```

### 3. Inngest Worker Process

The `image-generation` function runs as a background worker:

**Steps:**
1. **Initialize Job** - Set status to 'processing', publish start event
2. **Reserve Credits** - Pre-reserve 6 credits ($0.06) from user's wallet (stubbed)
3. **Create Kie Task** - POST to `https://api.kie.ai/api/v1/jobs/createTask`
4. **Poll for Completion** - Query taskId every 10s, max 10 attempts (100s total)
5. **Persist to Supabase** - Download image from Kie, upload to Supabase Storage bucket `images`
6. **Complete Job** - Update job with permanent URL, settle credits, publish completion event

### 4. Error Handling

- **Insufficient Credits:** Throws error before creating Kie task (when wallet integration is complete)
- **Kie API Failure:** Retries up to 3 times (Inngest retry policy)
- **Timeout:** Fails after 100 seconds of polling
- **Supabase Upload Failure:** Falls back to Kie temporary URL
- **Credit Refund:** Automatically refunds on any failure (when wallet integration is complete)

### 5. Real-time Progress Events

Published to `user:${userId}` channel:

```typescript
// Events published during generation:
'image.generation.start'         // Job started
'image.generation.task_created'  // Kie task created
'image.generation.kie_complete'  // Kie generation done
'image.generation.persisted'     // Uploaded to Supabase
'image.generation.complete'      // Job completed with final URL
'image.generation.failed'        // Job failed with error
```

## Testing

### 1. Enable the Feature

In `.env.local`:
```bash
USE_INNGEST_IMAGE_GEN=true
```

### 2. Test Manually

Generate a splash screen via the Studio and observe the LLM's decision to use `generateImage`:

```
Branding: { appName: "FitTracker", uiStyle: "modern", personality: "energetic" }
Screen: { type: "splash", purpose: "Welcome screen with hero imagery" }
```

Expected behavior:
- LLM calls `generateImage` tool with description like "fitness motivation hero banner"
- Tool creates job, sends to Inngest, polls for completion
- Returns permanent Supabase URL
- LLM embeds image in generated HTML

### 3. Monitor Logs

```bash
# Watch Inngest worker logs
tail -f logs/inngest.log

# Watch StudioAgent tool usage
grep "generateImage" logs/studio-agent.log
```

### 4. Check Job Status

Query the job via API:
```bash
curl http://localhost:5173/api/jobs/{jobId}
```

## Cost & Billing

- **Model:** `nano-banana` (basic generation)
- **Cost:** 6 platform credits = $0.06 per image
- **Billing Flow:** Reserve → Generate → Settle/Refund
- **Integration:** Stubbed in code, needs wallet manager integration

**TODO:** Uncomment wallet integration lines in:
- `app/lib/inngest/functions/image-generation.ts` lines 42-47 (reserve)
- `app/lib/inngest/functions/image-generation.ts` lines 167-168 (settle)
- `app/lib/inngest/functions/image-generation.ts` lines 235-236 (refund)

## Supabase Storage Setup

### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `images`
3. Set as public (or configure RLS policies)
4. Ensure service role key has upload permissions

### Bucket Structure

```
images/
  generated/
    {timestamp}-{jobId}.png
    {timestamp}-{jobId}.png
    ...
```

## Limitations

1. **Models Supported:** Only `nano-banana` and `nano-banana-edit` (not nano-banana-pro)
2. **Blocking Tool:** Tool execution blocks screen generation (by design for synchronous flow)
3. **LLM Decision:** Image quality depends on LLM's judgment of when to generate
4. **Cost:** Each image costs $0.06 - monitor usage carefully
5. **Timeout:** Max 100 seconds for generation (10 polling attempts × 10s)

## Future Enhancements

1. **Add nano-banana-pro** for style-matched branding
2. **Image Caching:** Avoid regenerating similar requests
3. **Batch Generation:** Generate multiple images in parallel for multi-screen flows
4. **Image-to-Image Editing:** Use `nano-banana-edit` for iterative refinement
5. **Progressive Enhancement:** Show low-res preview while generating final image
6. **Cost Optimization:** Implement intelligent caching and deduplication

## Rollout Strategy

1. **Week 1:** Deploy with `USE_INNGEST_IMAGE_GEN=false` (disabled)
2. **Week 2:** Enable for internal testing team
3. **Week 3:** Monitor costs, quality, and completion rates
4. **Week 4:** Enable for 10% of users (A/B test)
5. **Week 5:** Full rollout if success rate > 95% and costs are within budget

## Troubleshooting

### Image Generation Times Out

- Check Kie API status: `https://status.kie.ai`
- Verify `KIE_API_KEY` is valid
- Check network connectivity to Kie API
- Increase polling attempts in code if needed

### Images Not Persisting to Supabase

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase Storage bucket exists and is public
- Verify service role has upload permissions
- Check Supabase API logs for errors

### Credits Not Deducting

- Wallet integration is currently stubbed
- Uncomment wallet manager calls in `image-generation.ts`
- Ensure wallet manager is properly initialized

### LLM Not Using Tool

- Check system prompt includes image generation guidelines
- Verify `USE_INNGEST_IMAGE_GEN=true` in environment
- Try more explicit screen purposes (e.g., "splash screen with hero image")
- Check LLM model supports tool calling (Gemini 3 Pro does)

## Security Considerations

1. **Service Role Key:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
2. **Kie API Key:** Server-side only, never send to browser
3. **Image Content:** No validation of generated content - monitor for inappropriate imagery
4. **Rate Limiting:** Implement per-user rate limits to prevent abuse
5. **Cost Controls:** Set spending limits per user/organization

## Monitoring & Observability

### Key Metrics to Track

- Image generation success rate (target: > 95%)
- Average generation time (target: < 30s)
- Cost per image (target: $0.06)
- User satisfaction with generated imagery
- Tool usage frequency (images generated per screen)

### Alerts to Configure

- Generation failure rate > 5%
- Average generation time > 60s
- Kie API unavailable
- Supabase upload failures
- Daily cost exceeds budget

## Support

For issues or questions:
1. Check logs in `logs/inngest.log` and `logs/studio-agent.log`
2. Review Inngest dashboard for failed jobs
3. Check Kie API documentation: https://docs.kie.ai
4. Review Supabase Storage logs

---

**Implementation Date:** 2025-12-26
**Status:** ✅ Complete - Ready for Testing
