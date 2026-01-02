# E2B & Inngest Integration

This project integrates E2B for secure code execution and Inngest for durable event-driven workflows.

## Architecture

The integration follows a dual-path architecture to satisfy immediate UI feedback requirements while ensuring durable execution logging.

### 1. Synchronous Execution (UI Feedback)
- **Client**: `E2BRunner` (`app/lib/runtime/e2b-runner.ts`) sends a POST request to `/api/e2b/execute`.
- **API Route**: `app/routes/api.e2b.execute.ts` receives the command.
    - It initializes an E2B Sandbox using `E2B_API_KEY`.
    - It executes the command synchronously to capture `stdout`/`stderr`.
    - It returns the result to the client for real-time terminal display.

### 2. Asynchronous Durability (Inngest)
- **Event Trigger**: The API Route also sends an Inngest event `e2b/script.execute`.
- **Inngest Function**: `e2bExecutor` (`app/inngest/functions/e2b.ts`) listens for this event.
    - It re-executes the code in a separate, durable step (logic mirroring the API route).
    - This provides a history of executions, retries if needed, and observability via the Inngest dashboard.

## Configuration

### Environment Variables
Ensure `.env.local` includes:
```bash
E2B_ON=true
E2B_API_KEY=sk_e2b_...
```

### Inngest Setup
- **Client**: `app/lib/inngest/client.ts`
- **Serve Handler**: `app/routes/api.inngest.ts`
- **Functions**: `app/inngest/functions/`

## Usage
To enable this flow, simply toggle `E2B_ON=true`. The system automatically routes execution through the new API endpoint and triggers Inngest events.
