'use client';

import { CheckCircle, FileText, Loader2, Edit3 } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface GenerationLog {
  type: 'file' | 'status' | 'edit';
  message: string;
  timestamp: number;
}

interface GenerationProgressProps {
  logs?: GenerationLog[];
  currentStatus?: string;
  isComplete?: boolean;
}

export function GenerationProgress({
  logs = [],
  currentStatus,
  isComplete = false
}: GenerationProgressProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />;
      case 'edit':
        return <Edit3 className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />;
      default:
        return <FileText className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />;
    }
  };

  const getPrefix = (type: string) => {
    switch (type) {
      case 'file':
        return 'Created';
      case 'edit':
        return 'Edited';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Status */}
      {currentStatus && !isComplete && (
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{currentStatus}</span>
        </div>
      )}

      {/* Activity Log - Rork style */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-sm text-slate-400 py-1 animate-in fade-in slide-in-from-left-2 duration-300"
          >
            {getIcon(log.type)}
            <span className="font-mono text-xs">
              {getPrefix(log.type)} {log.message}
            </span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Completion indicator */}
      {isComplete && logs.length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Generation complete</span>
          </div>
        </div>
      )}
    </div>
  );
}
