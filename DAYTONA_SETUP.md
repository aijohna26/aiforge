# Daytona Setup Guide

## Environment Variables Setup

### Required for Daytona Integration

Add these to your `.env.local` file:

```env
# Daytona API
DAYTONA_API_KEY=your_daytona_api_key_here
DAYTONA_API_URL=https://app.daytona.io/api  # Optional, uses this default
DAYTONA_TARGET=us  # Optional, defaults to org default region

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe dashboard)
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
```

## Getting Daytona API Key

1. Sign up at https://www.daytona.io/
2. Navigate to [API Keys](https://app.daytona.io/dashboard/keys) in dashboard
3. Click **Create Key** and select appropriate scopes
4. Copy and paste into `.env.local`

---

## TypeScript SDK Setup

### Installation

The Daytona TypeScript SDK and required polyfills are already installed:

```bash
pnpm add @daytonaio/sdk node-polyfill-webpack-plugin unenv
```

### Next.js Configuration

The project's `next.config.ts` has been configured with:
- **Webpack polyfills** for browser compatibility (client-side)
- **Turbopack alias** for development mode

This configuration allows the Daytona SDK to work in both server and client components.

### Quick Start

```typescript
import { Daytona } from '@daytonaio/sdk';

// Create a sandbox
const daytona = new Daytona();
const sandbox = await daytona.create({
  language: 'typescript',
  envVars: { NODE_ENV: 'development' }
});

// Execute code
const result = await sandbox.process.codeRun(`
  console.log('Hello from Daytona!');
`);

// Get preview URL
const preview = await sandbox.getPreviewLink(3000);
console.log(preview.url);

// Cleanup
await sandbox.delete();
```

### Utility Functions

The project includes helper functions in `lib/daytona/`:

**`client.ts`** - Singleton Daytona client
```typescript
import { daytonaClient } from '@/lib/daytona/client';
```

**`sandbox.ts`** - Helper functions
```typescript
import {
  createSandbox,
  executeCode,
  getPreviewLink,
  cleanupSandbox,
  uploadFile,
  downloadFile
} from '@/lib/daytona/sandbox';
```

**`types.ts`** - TypeScript interfaces
```typescript
import type {
  SandboxConfig,
  CodeExecutionResult,
  PreviewLink
} from '@/lib/daytona/types';
```

### Example Implementations

**Basic Usage** (`lib/daytona/examples/basic-usage.ts`)
- Sandbox creation and lifecycle management
- Code execution
- Preview URL generation
- Cleanup

**AI Code Execution** (`lib/daytona/examples/ai-code-execution.ts`)
- AI-generated code execution pattern
- Integration with LLM APIs
- Agentic iteration loop
- Similar to the Lovable clone approach

---

## Setting up Stripe

1. Create account at https://stripe.com/
2. Create two products:
   - **Pro Plan**: $12/month recurring
   - **Business Plan**: $49/month recurring
3. Copy price IDs from product pages
4. Get API keys from Developers → API keys
5. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`

## Database Migration

Run the Supabase migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute the SQL file
# supabase/migrations/20241202_add_subscriptions.sql
```

---

## Testing Daytona Setup

Run the verification script:

```bash
npx tsx scripts/test-daytona.ts
```

**Expected output:**
```
🧪 Testing Daytona SDK Setup...

1️⃣ Initializing Daytona client...
   ✅ Daytona client initialized

2️⃣ Creating sandbox...
   ✅ Sandbox created: dtn_sandbox_***

3️⃣ Executing test command...
   ✅ Command executed
   📤 Output: Hello Daytona

4️⃣ Testing code execution...
   ✅ Code executed
   📤 Output: Daytona SDK is working!

5️⃣ Cleaning up sandbox...
   ✅ Sandbox deleted

══════════════════════════════════════════════════
✅ All tests passed successfully!
══════════════════════════════════════════════════
```

## Testing Local Setup

1. Start dev server: `pnpm dev`
2. Navigate to `/pricing` to see pricing page
3. Create a project to test preview limits
4. Free tier should show "X/5 sessions used"

## Default Behavior

- All existing users get Free tier automatically
- New users get Free tier on signup
- Upgrade to Pro/Business via pricing page (requires Stripe setup)

---

## Key Daytona Concepts

### Sandboxes
Isolated development environments where code executes safely. Each sandbox can run web servers, execute code, and host files.

### Preview URLs
Public URLs that allow accessing web applications running inside sandboxes. Generated dynamically for each running service.

### Code Execution
Two modes available:
- **`codeRun()`** - Execute code snippets (Python, TypeScript, JavaScript)
- **`executeCommand()`** - Run shell commands

### Lifecycle Management
- **`create()`** - Spin up new sandbox
- **`start()`** - Resume stopped sandbox
- **`stop()`** - Pause sandbox (keeps state)
- **`delete()`** - Permanently remove sandbox

### File Operations
- **`uploadFile()`** - Upload files to sandbox
- **`downloadFile()`** - Download files from sandbox
- **`fs.listFiles()`** - List sandbox files
- **`fs.createFolder()`** - Create directories

---

## API Reference

Full documentation: https://www.daytona.io/docs/en/typescript-sdk.md

**Key interfaces:**
- [Sandbox Management](https://www.daytona.io/docs/typescript-sdk/sandbox.md)
- [Code Execution](https://www.daytona.io/docs/typescript-sdk/process.md)
- [File System](https://www.daytona.io/docs/typescript-sdk/file-system.md)
- [Preview URLs](https://www.daytona.io/docs/typescript-sdk/sandbox.md#getpreviewlink)
- [Git Operations](https://www.daytona.io/docs/typescript-sdk/git.md)
