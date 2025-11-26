import { EventEmitter } from "events";

export interface JobEventPayload {
  jobId: string;
  type: string;
  data?: unknown;
}

class JobEventBus extends EventEmitter {
  emitEvent(event: JobEventPayload) {
    this.emit("event", event);
  }

  subscribe(listener: (event: JobEventPayload) => void) {
    this.on("event", listener);
    return () => this.off("event", listener);
  }
}

export const jobEventBus = new JobEventBus();

export function emitJobEvent(event: JobEventPayload) {
  jobEventBus.emitEvent(event);
}
