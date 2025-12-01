"use client";

import { memo, ReactNode } from "react";
import { Bot, User2, RotateCcw } from "lucide-react";
import { type ChatMessage as ChatMessageType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface ChatMessageProps {
  message: ChatMessageType;
  customContent?: ReactNode;
  onRollback?: (snapshotId: string) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  customContent,
  onRollback,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={clsx(
        "flex gap-3 text-sm",
        isUser ? "flex-row" : "flex-row-reverse"
      )}
    >
      <div
        className={clsx(
          "h-10 w-10 rounded-full flex items-center justify-center border",
          isUser
            ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
        )}
      >
        {isUser ? (
          <User2 className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>
      <div
        className={clsx(
          "flex-1 rounded-2xl border px-4 py-3 shadow-sm",
          isUser
            ? "border-blue-500/30 bg-blue-500/10 text-blue-50"
            : "border-slate-700 bg-slate-900/80 text-slate-100"
        )}
      >
        {customContent || (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
        {message.metadata?.filesCreated && !customContent && (
          <div className="mt-3 rounded-lg bg-slate-950/50 p-3 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <p className="font-semibold uppercase tracking-wide text-slate-300">
                Files Created
              </p>
              {message.metadata.snapshotId && onRollback && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRollback(message.metadata.snapshotId!)}
                  className="gap-1.5 border-amber-700/50 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 text-[11px] h-7 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  Rollback
                </Button>
              )}
            </div>
            <ul className="mt-2 space-y-1">
              {message.metadata.filesCreated.map((file) => (
                <li key={file} className="font-mono text-[11px] text-slate-400">
                  {file}
                </li>
              ))}
            </ul>
          </div>
        )}
        <span className="mt-2 block text-[11px] uppercase tracking-wide text-slate-500">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
});
