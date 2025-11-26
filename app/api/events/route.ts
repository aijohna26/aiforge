import { jobEventBus, JobEventPayload } from "@/lib/job-events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobFilter = searchParams.get("jobId");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectEvent = `data: ${JSON.stringify({ type: "connected", jobId: jobFilter ?? null })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Subscribe to job events
      const listener = (event: JobEventPayload) => {
        if (jobFilter && event.jobId !== jobFilter) return;
        try {
          const sseMessage = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
        } catch {
          // ignore encoding errors
        }
      };

      const unsubscribe = jobEventBus.subscribe(listener);

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
