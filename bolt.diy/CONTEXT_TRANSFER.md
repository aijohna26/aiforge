# 🧠 AppForge AI - Context Transfer & critical Fixes

## 1. Project Overview
**AppForge AI** is a web-based mobile app builder (fork of Bolt.diy).
- **Core Stack**: Next.js (Remix), Tailwind CSS, Node.js.
- **Key Infrastructure**: 
  - **Inngest**: Background job orchestration (critical for screen generation).
  - **AI SDK (Vercel AI)**: Version 6.0.3, handles LLM interactions.
  - **Google Gemini**: The underlying LLM provider.

## 2. The Critical "Empty HTML" Bug (RESOLVED)
We faced a persistent issue where the AI Agent would return empty HTML for generated screens, creating skeleton loaders that never resolved.

### Root Cause Analysis
The project uses `ai` SDK version **6.0.3**.
- **The specific bug:** In this version, the `generateText` function **defaults to a single step execution** (`stopWhen: stepCountIs(1)`).
- **Previous Configuration:** We were passing `maxSteps: 10`, which worked in v5 but is **ignored/deprecated** in v6.
- **Consequence:** The model would call the `searchImages` tool (Step 1) and then immediately stop execution because the step count limit (1) was reached. It never proceeded to the next step to actually generate the final HTML response.

### The Fix (Applied in `StudioAgent.ts`)
We replaced the ignored `maxSteps` property with the correct `stopWhen` configuration.

**Before (Broken):**
```typescript
const { text } = await generateText({
    model: this.getModel(),
    maxSteps: 10, // IGNORED by SDK 6.0.3
    // ...
```

**After (Fixed):**
```typescript
import { generateText, tool, stepCountIs } from 'ai'; // Added stepCountIs import

const { text } = await generateText({
    model: this.getModel(),
    stopWhen: stepCountIs(10), // Correct way to enable multi-step loops
    // ...
```

## 3. Other Critical Improvements
- **Strict Response Parsing**: `StudioAgent.parseScreenResponse` now explicitly **throws an error** if the generated HTML is empty or shorter than 10 characters. This forces Inngest to retry the job instead of silently failing.
- **Model Configuration**: The agent is currently set to usage **`gemini-3-flash-preview`** per user request. This can be reverted to `gemini-1.5-pro-002` in `StudioAgent.ts` if stability issues arise.

## 4. Key Files to Watch
- **`app/lib/modules/studio/StudioAgent.ts`**: The brain of the operation. Contains the prompt, validation logic, and the critical `generateText` call.
- **`app/lib/inngest/functions/screen-generation.ts`**: The orchestrator. Handles the job lifecycle and retries.
- **`app/components/workbench/design/Step5Interactive.tsx`**: The frontend component that displays the generation progress.

## 5. Next Recommended Steps
1.  **Monitor Inngest**: Watch the local Inngest dashboard (`http://localhost:8288` usually) to ensure jobs are completing with `html` content (check "Step Output").
2.  **Verify UI**: Ensure screens update from skeleton -> real content.
3.  **Prompt Tuning**: If `gemini-3-flash-preview` hallucinates or fails JSON formatting often, consider stricter system prompts or reverting to `gemini-1.5-pro-002`.

*Context last updated: 2025-12-27*
