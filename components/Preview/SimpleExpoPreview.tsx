'use client';

import { useEffect, useRef, useState } from 'react';
import { getWebContainer } from '@/lib/webcontainer-singleton';
import { Loader2, Terminal as TerminalIcon, X, ExternalLink } from 'lucide-react';

interface SimpleExpoPreviewProps {
  files: Record<string, { type: string; content: string }>;
  onClose?: () => void;
}

export function SimpleExpoPreview({ files, onClose }: SimpleExpoPreviewProps) {
  const [status, setStatus] = useState<'writing' | 'ready' | 'error'>('writing');
  const [log, setLog] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<any>(null);

  const addLog = (message: string) => {
    setLog(prev => [...prev, message]);
  };

  useEffect(() => {
    const init = async () => {
      try {
        addLog('[AppForge] Initializing WebContainer...');
        const container = await getWebContainer();
        addLog('[AppForge] WebContainer ready');

        // Write files
        addLog('[AppForge] Writing project files...');
        for (const [path, file] of Object.entries(files)) {
          if (file.type !== 'file') continue;

          const relativePath = path.startsWith('/') ? path.slice(1) : path;
          const dirPath = relativePath.split('/').slice(0, -1).join('/');

          if (dirPath) {
            try {
              await container.fs.mkdir(dirPath, { recursive: true });
            } catch (e) {
              // Directory exists
            }
          }

          await container.fs.writeFile(relativePath, file.content);
        }
        addLog('[AppForge] Files written successfully');

        // Install dependencies
        addLog('[AppForge] Installing dependencies (this may take 30-60 seconds)...');
        const installProcess = await container.spawn('npm', ['install']);

        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              addLog(data);
            },
          })
        );

        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error(`npm install failed with exit code ${installExitCode}`);
        }
        addLog('[AppForge] Dependencies installed');

        // Start Expo
        addLog('[AppForge] Starting Expo dev server...');
        addLog('[AppForge] This will take 10-20 seconds...');

        const expoProcess = await container.spawn('npx', ['expo', 'start', '--web']);
        processRef.current = expoProcess;

        let buffer = '';
        const webUrlRegex = /https?:\/\/localhost:\d+/;

        expoProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              const output = data.toString();
              addLog(output);
              buffer += output;

              // Look for localhost URL
              const match = buffer.match(webUrlRegex);
              if (match) {
                const url = match[0];
                addLog(`[AppForge] Expo web server ready at ${url}`);
                setPreviewUrl(url);
                setStatus('ready');
              }

              // Keep buffer size manageable
              if (buffer.length > 4096) {
                buffer = buffer.slice(-4096);
              }
            },
          })
        );

      } catch (err) {
        console.error('[SimpleExpoPreview] Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to start Expo';
        setError(message);
        setStatus('error');
        addLog(`[Error] ${message}`);
      }
    };

    init();

    return () => {
      if (processRef.current) {
        try {
          processRef.current.kill();
        } catch (e) {
          console.error('Failed to kill process:', e);
        }
      }
    };
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">Expo Preview</h2>
          {status === 'ready' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
              Running
            </span>
          )}
          {status === 'writing' && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Setting up...
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Terminal Log */}
        <div className="flex flex-1 flex-col border-r border-slate-700">
          <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-4 py-2">
            <TerminalIcon className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Build Log</span>
          </div>
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-[10px] leading-tight text-slate-300"
          >
            {log.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex w-96 flex-col bg-slate-800">
          <div className="border-b border-slate-700 px-4 py-2">
            <span className="text-xs font-medium text-slate-300">Web Preview</span>
          </div>
          <div className="flex flex-1 flex-col p-4">
            {status === 'ready' && previewUrl ? (
              <>
                <div className="mb-3 rounded-lg bg-slate-700 p-3">
                  <p className="mb-1 text-xs font-medium text-slate-300">Preview URL:</p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                  >
                    {previewUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex-1 overflow-hidden rounded-lg border border-slate-700 bg-white">
                  <iframe
                    src={previewUrl}
                    className="h-full w-full"
                    title="Expo Web Preview"
                  />
                </div>
              </>
            ) : status === 'error' ? (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <div className="mb-2 text-red-400">❌</div>
                  <p className="text-sm text-red-400">Failed to start</p>
                  {error && <p className="mt-2 text-xs text-slate-500">{error}</p>}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-400" />
                  <p className="text-sm text-slate-300">Starting Expo...</p>
                  <p className="mt-2 text-xs text-slate-500">This usually takes 10-20 seconds</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
