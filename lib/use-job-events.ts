"use client";

import { useEffect, useCallback, useRef, useState } from "react";

export interface JobEvent {
  jobId: string;
  type: string;
  data?: unknown;
}

interface UseJobEventsOptions {
  jobId?: string | null;
  onEvent?: (event: JobEvent) => void;
  autoReconnect?: boolean;
}

export function useJobEvents(options: UseJobEventsOptions = {}) {
  const { jobId, onEvent, autoReconnect = true } = options;
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = jobId ? `/api/events?jobId=${jobId}` : "/api/events";
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const event: JobEvent = JSON.parse(e.data);
        setEvents((prev) => [...prev, event]);
        onEvent?.(event);
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();

      // Auto-reconnect after 3 seconds
      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  }, [jobId, onEvent, autoReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connected,
    events,
    connect,
    disconnect,
    clearEvents,
  };
}
