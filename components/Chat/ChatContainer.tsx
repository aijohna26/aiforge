"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage as ChatMessageType, GeneratedProject } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

const SAMPLE_PROMPTS = [
  "Build a simple habit tracker with streaks",
  "Create a task manager with calendar view",
  "Generate a workout timer with progress charts",
];

interface ChatContainerProps {
  onProjectGenerated: (project: GeneratedProject) => void;
}

export function ChatContainer({ onProjectGenerated }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState(SAMPLE_PROMPTS[0]);

  useEffect(() => {
    const index = Math.floor(Math.random() * SAMPLE_PROMPTS.length);
    setPlaceholder(SAMPLE_PROMPTS[index]);
  }, []);

  const handleSend = useCallback(async () => {
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

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error("Generation failed. Please try again.");
      }

      const data = await response.json();

      const aiMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          data?.message ??
          "I generated your mobile app project. Select a file to inspect the code.",
        timestamp: new Date().toISOString(),
        metadata: {
          filesCreated: data?.filesCreated,
        },
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (data?.project) {
        onProjectGenerated(data.project);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [input, isGenerating, onProjectGenerated]);

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950/90 text-white">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">AppForge AI</p>
          <p className="text-xs text-slate-400">
            Describe your React Native app idea
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-blue-400" />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-200">
              Start a conversation
            </p>
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
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isGenerating && <TypingIndicator />}
          </>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="border-t border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
            disabled={isGenerating}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Build with AI
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
