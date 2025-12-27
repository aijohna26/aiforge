# Context Handover: Studio Generation & Image Handling

## Project Overview
**App (Bolt.diy / AppForge)**: A web-based IDE for generating React/Expo apps.
**Current Focus**: improving the "Studio" (Design Wizard Step 5) which uses an LLM (`StudioAgent`) to generate screen designs and an external API (Kie) to generate assets.

## ✅ Recently Fixed Issues (Dec 27, 2025)

### 1. Image Generation Timeout Message ✅ FIXED
*   **Status**: Fixed
*   **Problem**: Error message incorrectly stated "timed out after 600 seconds" when actual timeout was 120 seconds
*   **Fix**: Updated error message in `image-generation.ts` line 248 to correctly state "120 seconds"
*   **File**: `app/lib/inngest/functions/image-generation.ts:248`

### 2. Navigation/Footer Implementation ✅ ENHANCED
*   **Status**: Enhanced with stronger prompt guidance
*   **Requirement**: Navigation bars, tab bars, and footers MUST be implemented using **HTML (divs), CSS (Tailwind), and Icons (Lucide)**
*   **Fix**: Enhanced `StudioAgent.ts` lines 296-300 with explicit CRITICAL section:
    * NEVER use `<img>` tags for navigation/footers
    * ALWAYS recreate using HTML divs, Tailwind CSS, and Lucide icons/SVG
    * Match reference design's style using code, NOT images
    * Include proper semantic HTML and interactive states
*   **File**: `app/lib/modules/studio/StudioAgent.ts:296-300`

### 3. Studio Canvas Spacing ✅ FIXED
*   **Status**: Fixed
*   **Problem**: Screens were clustering together - initial screens used different spacing (500px) than subsequent batches (875px)
*   **Root Cause**: Initial screen positioning used `startX + (index * FRAME_SPACING)` while subsequent screens used `baseX + DEVICE_WIDTH + FRAME_SPACING + ((DEVICE_WIDTH + FRAME_SPACING) * index)`, creating inconsistent spacing
*   **Fix**: Updated all position calculations in `Step5Interactive.tsx` to use consistent formula:
    * Added `DEVICE_WIDTH = 375` constant
    * Initial screens now use: `startX + (index * (DEVICE_WIDTH + FRAME_SPACING))`
    * Subsequent screens use: `baseX + DEVICE_WIDTH + FRAME_SPACING + ((DEVICE_WIDTH + FRAME_SPACING) * index)`
    * Group width calculation: `(count - 1) * (DEVICE_WIDTH + FRAME_SPACING) + DEVICE_WIDTH`
    * This ensures ALL frames account for: device width (375px) + gap (500px) = 875px total spacing
    * Applied to: Initial generation (lines 377-389, 427-443), `handleGenerateNextScreen` (650, 692), `handleGenerateRemaining` (513, 540), `handleCleanupLayout` (727-733)
*   **Result**: Consistent 875px spacing (375px device + 500px gap) between all frames, regardless of generation batch
*   **File**: `app/components/workbench/design/Step5Interactive.tsx:16-17, 377-389, 427-443, 513, 540, 650, 692, 727-733`

### 4. Logo/Nav Settings Persistence ✅ FIXED
*   **Status**: Fixed
*   **Problem**: Existing screens created before `showLogo`/`showBottomNav` were added didn't have these properties, causing UI to show incorrect state
*   **Root Cause**: Old project data in localStorage had screens without `showLogo`/`showBottomNav` properties (undefined)
*   **Fix**: Added migration in `migrateStoredWizardData` function to:
    * Detect screens missing `showLogo` or `showBottomNav` properties
    * Set defaults based on screen type:
      - Auth/Onboarding screens (splash, signin, signup, onboarding): showLogo = true, showBottomNav = false
      - Main app screens (home, profile, settings, etc.): showLogo = false, showBottomNav = true
*   **Result**: All existing screens now have correct default values, and toggle buttons work properly
*   **File**: `app/lib/stores/designWizard.ts:421-435`

### 5. Image Generation Tool Timeout ✅ FIXED
*   **Status**: Fixed
*   **Problem**: `generateImage` tool in StudioAgent not returning success when it works - AI model loses context during long waits
*   **Root Cause**: Tool was polling for 120 seconds (60 attempts × 2s), causing the AI model to timeout or lose context before receiving the result
*   **Fix**: Reduced polling timeout in `pollJobCompletion`:
    * Changed default maxAttempts from 60 to 15 (120s → 30s)
    * Updated error message to show dynamic timeout based on attempts
    * Added logging to show when image is ready and how long it took
*   **Comparison with Reference**: Reference code (XDesign) uses fire-and-forget pattern with client-side polling, but our pattern requires synchronous response for AI tool use
*   **Result**: AI model receives image generation results within 30 seconds, preventing context loss and timeout issues
*   **File**: `app/lib/modules/studio/StudioAgent.ts:229, 429-452`

### 6. Inngest Job State Sharing ✅ FIXED
*   **Status**: Fixed
*   **Problem**: Image URLs not being detected by LLM - StudioAgent polling never saw job updates from Inngest
*   **Root Cause**: In-memory storage (`globalThis.__INNGEST_JOBS__`) was separate for each process - StudioAgent and Inngest function ran in different memory spaces, so updates from Inngest were invisible to StudioAgent's polling
*   **Fix**: Implemented file-based job storage in `app/lib/inngest/db/index.ts`:
    * Created `.tmp/inngest-jobs/` directory for job state files
    * Each job stored as `{jobId}.json` for cross-process sharing
    * Helper functions: `readJobFromFile()`, `writeJobToFile()`, `getJobFilePath()`
    * Updated all DB functions: `createJob`, `updateJobStatus`, `updateJobProgress`, `getJob`, `incrementJobAttempts`, `findStaleJobs`
    * Added `.tmp/` to `.gitignore` to prevent committing temporary files
*   **Result**: Both StudioAgent and Inngest now share job state via filesystem, ensuring image URLs are properly detected and returned to the LLM
*   **Files**: `app/lib/inngest/db/index.ts`, `.gitignore`
*   **Note**: This is a temporary solution - should migrate to PostgreSQL/MySQL/Supabase for production

## 🚨 Known Active Issues

### 1. Image Generation Detection (Kie API)
*   **Status**: Monitoring
*   **Problem**: The Kie API occasionally returns `state: "success"` but `output` object is missing or undefined
*   **Current Mitigation**:
    *   Polling validates `success` only if `url` is present
    *   Logs warning and retries if success + no URL
    *   2-minute timeout with graceful failure (6 attempts × 20s)
*   **Next Steps**: Continue monitoring; may need to contact Kie support if issue persists

## Relevant Files
*   `app/lib/inngest/functions/image-generation.ts`: Image polling logic with Kie API
*   `app/lib/modules/studio/StudioAgent.ts`: LLM prompting and tool definitions
*   `app/components/workbench/design/Step5Interactive.tsx`: Frontend logic for positioning frames
*   `app/components/workbench/design/interactive/DeviceFrame.tsx`: Device frame component (375px width)
*   `app/components/workbench/design/ScreenFlowFrame.tsx`: Screen flow UI with Logo/Nav toggle buttons
*   `app/lib/stores/designWizard.ts`: Design wizard state management and migrations

## System Configuration
*   **Device Width**: 375px
*   **Frame Spacing**: 500px (gap between frames)
*   **Canvas Center**: (4000, 4000)
*   **Image Generation Timeout (Inngest)**: 120 seconds (6 polls × 20s)
*   **Image Generation Timeout (StudioAgent)**: 30 seconds (15 polls × 2s)
*   **Polling Interval (Inngest)**: 20 seconds
*   **Polling Interval (StudioAgent)**: 2 seconds
*   **Max Concurrent Image Jobs**: 5

## Recent Changes Summary
*   ✅ **Fixed** timeout error message (600s → 120s in Inngest, 120s → 30s in StudioAgent)
*   ✅ **Enhanced** navigation HTML recreation prompt
*   ✅ **Fixed** canvas spacing calculation - consistent 875px spacing for all frames (initial + subsequent batches)
*   ✅ **Added** DEVICE_WIDTH constant for maintainability
*   ✅ **Fixed** Logo/Nav settings persistence for existing screens via localStorage migration
*   ✅ **Reduced** image generation polling timeout from 120s to 30s to prevent AI model context loss
*   ✅ **Fixed** Inngest job state sharing - moved from in-memory to file-based storage for cross-process communication
*   ✅ **Enhanced** image generation prompt - explicitly excludes phone frames, device mockups, and smartphone bezels
*   🔄 **Reduced** frame spacing to 500px (from 1000px)
