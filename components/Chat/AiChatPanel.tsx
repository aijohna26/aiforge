"use client";
// Force update

import { useCallback, useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Coins,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage as ChatMessageType, GeneratedProject } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { useAiCommand, type FileDiff } from "@/lib/hooks/use-ai-command";
import { useWallet } from "@/lib/hooks/use-wallet";
import { GenerationProgress, type GenerationLog } from "@/components/GenerationProgress";
import { GenerationSummary } from "@/components/GenerationSummary";

const SAMPLE_PROMPTS = [
  "Build a simple habit tracker with streaks",
  "Create a task manager with calendar view",
  "Generate a workout timer with progress charts",
];

interface AiChatPanelProps {
  projectId: string | null;
  onProjectGenerated: (project: GeneratedProject, projectId?: string | null) => void;
  onFilesChanged?: (filesCreated?: string[], diffs?: Record<string, FileDiff>) => Promise<void> | void;
  onDiffAvailable?: (diffs: Record<string, FileDiff>) => void;
  onRollback?: (snapshotId: string) => void;
  onPreviewSyncRequested?: () => void;
  onCommandStart?: () => void;
  onCommandEnd?: () => void;
}

export function AiChatPanel({
  projectId,
  onProjectGenerated,
  onFilesChanged,
  onDiffAvailable,
  onRollback,
  onPreviewSyncRequested,
  onCommandStart,
  onCommandEnd,
}: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState(SAMPLE_PROMPTS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generation progress tracking - Rork style activity log
  const [generationLogs, setGenerationLogs] = useState<GenerationLog[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const [completedProject, setCompletedProject] = useState<{
    name: string;
    description?: string;
    files: string[];
    userPrompt?: string;
  } | null>(null);

  const { status: aiStatus, sendCommand, reset: resetAi } = useAiCommand();
  const { balance, refresh: refreshWallet } = useWallet();

  // Helper function to persist messages to database
  const persistMessage = useCallback(async (message: ChatMessageType) => {
    if (!projectId) return;

    try {
      await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
        }),
      });
    } catch (error) {
      console.error("Failed to persist message:", error);
    }
  }, [projectId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiStatus.logs]);

  useEffect(() => {
    const index = Math.floor(Math.random() * SAMPLE_PROMPTS.length);
    setPlaceholder(SAMPLE_PROMPTS[index]);
  }, []);

  // Load chat history when project ID changes
  useEffect(() => {
    if (!projectId) {
      setMessages([]);
      return;
    }

    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/messages`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
            })));
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    };

    loadChatHistory();
  }, [projectId]);

  // When AI command completes, refresh files and wallet
  useEffect(() => {
    if (aiStatus.status === "completed") {
      onCommandEnd?.();
      (async () => {
        // ... (existing logic)
      })();
    } else if (aiStatus.status === "error") {
      onCommandEnd?.();
      setError(aiStatus.error);
      resetAi();
    }
  }, [aiStatus.status, aiStatus.filesCreated, aiStatus.error, aiStatus.diffs, onFilesChanged, onDiffAvailable, onPreviewSyncRequested, refreshWallet, resetAi, persistMessage, onCommandEnd]);

  // Initial project generation (no projectId yet)
  const handleInitialGeneration = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);
    setError(null);

    // Reset progress tracking
    setGenerationLogs([]);
    setCurrentStatus("Starting generation...");
    setIsGenerationComplete(false);
    setCompletedProject(null);

    // Add a streaming message placeholder
    const streamingMessageId = crypto.randomUUID();
    const streamingMessage: ChatMessageType = {
      id: streamingMessageId,
      role: "assistant",
      content: "Starting generation...",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, streamingMessage]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content, streaming: true }),
      });

      if (!response.ok) {
        // Try to get error message from response
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || "Generation failed. Please try again.";
        throw new Error(errorMessage);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      let lastUpdate = Date.now();

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

            if (data.type === "status") {
              // Update current status
              setCurrentStatus(data.message);
              setGenerationLogs(prev => [...prev, {
                type: 'status',
                message: data.message,
                timestamp: Date.now()
              }]);
            } else if (data.type === "progress") {
              // Claude is streaming - just show we're working
              const now = Date.now();
              if (now - lastUpdate > 1000) {
                setCurrentStatus("Generating code...");
                lastUpdate = now;
              }
            } else if (data.type === "complete") {
              // Add file creation logs
              if (data?.filesCreated) {
                const fileLogs = data.filesCreated.map((file: string) => ({
                  type: 'file' as const,
                  message: file,
                  timestamp: Date.now()
                }));
                setGenerationLogs(prev => [...prev, ...fileLogs]);
              }

              setCurrentStatus("");
              setIsGenerationComplete(true);

              // Store completed project info for summary
              if (data?.project) {
                setCompletedProject({
                  name: data.project.projectName,
                  description: data.project.description,
                  files: data.filesCreated || [],
                  userPrompt: userMessage.content
                });
              }

              // Final result
              const aiMessage: ChatMessageType = {
                id: streamingMessageId,
                role: "assistant",
                content:
                  data?.message ??
                  "I generated your mobile app project. Select a file to inspect the code.",
                timestamp: new Date().toISOString(),
                metadata: {
                  filesCreated: data?.filesCreated,
                },
              };

              setMessages((prev) =>
                prev.map((msg) => (msg.id === streamingMessageId ? aiMessage : msg))
              );

              if (data?.project) {
                onProjectGenerated(data.project, data.projectId);
              }

              // Refresh wallet balance
              refreshWallet();

              // Persist initial conversation after project is created
              if (data?.projectId) {
                // Save both user message and AI response
                setTimeout(async () => {
                  try {
                    // Save user message
                    await fetch(`/api/projects/${data.projectId}/messages`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        role: userMessage.role,
                        content: userMessage.content,
                        timestamp: userMessage.timestamp,
                      }),
                    });

                    // Save assistant message
                    await fetch(`/api/projects/${data.projectId}/messages`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        role: aiMessage.role,
                        content: aiMessage.content,
                        timestamp: aiMessage.timestamp,
                      }),
                    });

                    console.log('[AiChatPanel] Persisted initial conversation');
                  } catch (error) {
                    console.error("Failed to persist initial conversation:", error);
                  }
                }, 500);
              }
            } else if (data.type === "error") {
              throw new Error(data.error || "Generation failed");
            }
          } catch (parseError) {
            console.error("Error parsing SSE data:", parseError);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );

      // Remove the streaming message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== streamingMessageId));
    } finally {
      setIsGenerating(false);
    }
  }, [input, isGenerating, onProjectGenerated]);

  // ... (handleInitialGeneration)

  // Iterative AI command (has projectId)
  const handleAiCommand = useCallback(async () => {
    if (!input.trim() || !projectId || aiStatus.status === "running") return;

    onCommandStart?.();

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    persistMessage(userMessage); // Save user message to database
    setInput("");
    setError(null);

    // Pass callback to refresh files when snapshot is created (for rollback button)
    await sendCommand(projectId, userMessage.content, () => {
      onFilesChanged?.(aiStatus.filesCreated, aiStatus.diffs);
    });
  }, [input, projectId, aiStatus.status, sendCommand, onFilesChanged, persistMessage, onCommandStart]);

  const handleSend = useCallback(() => {
    if (projectId) {
      handleAiCommand();
    } else {
      handleInitialGeneration();
    }
  }, [projectId, handleAiCommand, handleInitialGeneration]);

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const isProcessing = isGenerating || aiStatus.status === "running";

  return (
    <div className="flex h-full flex-col bg-slate-950/90 text-white">
      {/* Header with wallet */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">AppForge AI</p>
          <p className="text-xs text-slate-400">
            {projectId ? "Edit your app with AI" : "Describe your app idea"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {balance !== null && (
            <div className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-200">{balance}</span>
            </div>
          )}
          <Sparkles className="h-5 w-5 text-blue-400" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !projectId ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">Start a conversation</p>
            <p className="mt-2 text-sm text-slate-400">
              Tell AppForge what to build. Mention features, APIs, or platforms.
            </p>
            <div className="mt-4 space-y-2">
              {SAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptSelect(prompt)}
                  className="w-full rounded-xl border border-slate-800/70 bg-slate-900/30 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-900"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : messages.length === 0 && projectId ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">Project loaded</p>
            <p className="mt-2 text-sm text-slate-400">
              Ask AI to make changes: add features, fix bugs, refactor code.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Show progress for the last assistant message if generating
              const isLastAssistant = message.role === "assistant" &&
                index === messages.findLastIndex(m => m.role === "assistant");

              if (isLastAssistant && (isGenerating || isGenerationComplete) && generationLogs.length > 0) {
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRollback={onRollback}
                    customContent={
                      <div className="space-y-4">
                        {/* Show summary if complete, otherwise show progress */}
                        {isGenerationComplete && completedProject ? (
                          <GenerationSummary
                            projectName={completedProject.name}
                            description={completedProject.description}
                            filesCreated={completedProject.files}
                            userPrompt={completedProject.userPrompt}
                          />
                        ) : (
                          <GenerationProgress
                            logs={generationLogs}
                            currentStatus={currentStatus}
                            isComplete={isGenerationComplete}
                          />
                        )}
                      </div>
                    }
                  />
                );
              }
              return <ChatMessage key={message.id} message={message} onRollback={onRollback} />;
            })}
          </>
        )}

        {/* AI Status indicator */}
        {aiStatus.status === "running" && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
            <div className="flex items-center gap-2 text-sm text-blue-200">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is working...</span>
            </div>
            {aiStatus.logs.length > 0 && (
              <div className="mt-2 max-h-24 overflow-y-auto text-xs text-slate-400">
                {aiStatus.logs.slice(-5).map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {isGenerating && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={projectId ? "Ask AI to modify your app..." : placeholder}
            rows={3}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="w-full gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {aiStatus.status === "running" ? "AI Working..." : "Processing..."}
              </>
            ) : (
              <>
                {projectId ? "Send to AI" : "Build with AI"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
