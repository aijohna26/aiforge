'use client';

import { useRef, useEffect, type FormEvent } from 'react';
import { classNames } from '@/lib/utils/classNames';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isStreaming?: boolean;
  className?: string;
  placeholder?: string;
}

export function Chat({
  messages,
  onSendMessage,
  isStreaming = false,
  className,
  placeholder = 'Type a message...',
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = formData.get('message') as string;

    if (message.trim()) {
      onSendMessage(message);
      e.currentTarget.reset();
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className={classNames('flex flex-col h-full bg-slate-950', className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Start a conversation by typing a message below
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={classNames('flex', {
                'justify-end': message.role === 'user',
                'justify-start': message.role === 'assistant',
              })}
            >
              <div
                className={classNames('max-w-[80%] rounded-lg px-4 py-2', {
                  'bg-blue-600 text-white': message.role === 'user',
                  'bg-slate-800 text-slate-200': message.role === 'assistant',
                  'bg-slate-700 text-slate-300 italic': message.role === 'system',
                })}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({ node, inline, className, children, ...props }: any) => {
                          if (inline) {
                            return (
                              <code className="bg-slate-900 px-1 py-0.5 rounded text-xs" {...props}>
                                {children}
                              </code>
                            );
                          }
                          return (
                            <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          ))
        )}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-900 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            name="message"
            placeholder={placeholder}
            disabled={isStreaming}
            onKeyDown={handleKeyDown}
            className={classNames(
              'flex-1 bg-slate-800 text-slate-200 rounded-lg px-4 py-2 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-blue-600',
              'placeholder:text-slate-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            rows={3}
          />
          <button
            type="submit"
            disabled={isStreaming}
            className={classNames(
              'px-6 py-2 bg-blue-600 text-white rounded-lg font-medium',
              'hover:bg-blue-700 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-slate-900',
            )}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
