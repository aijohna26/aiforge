"use client";

import { useState, useCallback } from "react";

export interface FileDiff {
  path: string;
  before: string;
  after: string;
}

export interface AiCommandStatus {
  status: "idle" | "running" | "completed" | "error";
  logs: string[];
  filesCreated: string[];
  error: string | null;
  diffs: Record<string, FileDiff>;
  snapshotId?: string; // ID for rollback functionality
}

interface UseAiCommandReturn {
  status: AiCommandStatus;
  sendCommand: (projectId: string, prompt: string, onSnapshotCreated?: () => void) => Promise<void>;
  reset: () => void;
}

export function useAiCommand(): UseAiCommandReturn {
  const [status, setStatus] = useState<AiCommandStatus>({
    status: "idle",
    logs: [],
    filesCreated: [],
    error: null,
    diffs: {},
  });

  const sendCommand = useCallback(
    async (projectId: string, prompt: string, onSnapshotCreated?: () => void): Promise<void> => {
      setStatus({
        status: "running",
        logs: ["Starting AI edit..."],
        filesCreated: [],
        error: null,
        diffs: {},
      });

      try {
        const res = await fetch(`/api/projects/${projectId}/ai-command`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompt }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to submit command");
        }

        // Handle streaming response (Bolt.diy style)
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim() || !line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "status":
                  setStatus((prev) => ({
                    ...prev,
                    logs: [...prev.logs, data.message],
                  }));
                  break;

                case "snapshot_created":
                  setStatus((prev) => ({
                    ...prev,
                    logs: [...prev.logs, `Created backup: ${data.description || "AI edit"}`],
                    snapshotId: data.snapshotId,
                  }));
                  // Notify parent immediately when snapshot is created
                  onSnapshotCreated?.();
                  break;

                case "file_modified":
                  setStatus((prev) => ({
                    ...prev,
                    filesCreated: [...prev.filesCreated, data.path],
                    logs: [...prev.logs, `Modified: ${data.path}`],
                  }));
                  break;

                case "diff":
                  setStatus((prev) => ({
                    ...prev,
                    diffs: {
                      ...prev.diffs,
                      [data.path]: {
                        path: data.path,
                        before: data.before ?? "",
                        after: data.after ?? "",
                      },
                    },
                  }));
                  break;

                case "complete":
                  setStatus((prev) => ({
                    ...prev,
                    status: "completed",
                    logs: [...prev.logs, data.message || "Completed!"],
                    filesCreated: data.filesModified || prev.filesCreated,
                  }));
                  break;

                case "error":
                  throw new Error(data.error || "Unknown error");
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setStatus((prev) => ({
          ...prev,
          status: "error",
          error: message,
          logs: [...prev.logs, `Error: ${message}`],
        }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus({
      status: "idle",
      logs: [],
      filesCreated: [],
      error: null,
      diffs: {},
    });
  }, []);

  return {
    status,
    sendCommand,
    reset,
  };
}
