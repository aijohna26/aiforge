'use client';

import { CheckCircle, Zap, Smartphone, Code2 } from 'lucide-react';
import { useState } from 'react';

interface GenerationSummaryProps {
  projectName: string;
  description?: string;
  filesCreated: string[];
  userPrompt?: string;
}

export function GenerationSummary({
  projectName,
  description,
  filesCreated,
  userPrompt
}: GenerationSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const features = [
    { icon: Smartphone, label: 'Cross-platform', description: 'Works on iOS & Android' },
    { icon: Zap, label: 'Performant', description: 'Optimized React Native code' },
    { icon: Code2, label: 'Production-ready', description: 'TypeScript with type safety' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Summary */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-emerald-300">
              Built {projectName}
            </p>
            {userPrompt && (
              <p className="text-xs text-slate-400">
                "{userPrompt}"
              </p>
            )}
            {description && (
              <p className="text-sm text-slate-300 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-2">
        {features.map((feature, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-center"
          >
            <feature.icon className="h-4 w-4 mx-auto mb-1 text-blue-400" />
            <p className="text-xs font-medium text-slate-300">{feature.label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Files Created - Collapsible */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/50 transition"
        >
          <span className="text-sm font-medium text-slate-300">
            {filesCreated.length} files created
          </span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="border-t border-slate-700 px-4 py-3 space-y-1">
            {filesCreated.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-slate-400 py-1"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="font-mono">{file}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="rounded-lg border border-blue-700/30 bg-blue-950/20 p-3">
        <p className="text-xs font-medium text-blue-300 mb-2">Next steps:</p>
        <ul className="space-y-1 text-xs text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">1.</span>
            <span>Click a file to view and edit the code</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">2.</span>
            <span>Use "Launch" to test on your device</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">3.</span>
            <span>Ask AI to make changes or add features</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
