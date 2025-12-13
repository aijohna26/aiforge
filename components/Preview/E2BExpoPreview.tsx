'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Smartphone, Terminal as TerminalIcon, X, QrCode } from 'lucide-react';

interface E2BExpoPreviewProps {
  projectId: string;
  files: Record<string, { type: string; content: string }>;
  onClose?: () => void;
}

interface SandboxInfo {
  id: string;
  url: string;
  status: 'creating' | 'installing' | 'starting' | 'running' | 'error';
  logs: Array<{ timestamp: number; message: string; type: 'stdout' | 'stderr' | 'info' }>;
}

export function E2BExpoPreview({ projectId, files, onClose }: E2BExpoPreviewProps) {
  const [sandbox, setSandbox] = useState<SandboxInfo | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [qrCodeUrl, setQRCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const logsPollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initE2B = async () => {
      try {
        addOutput('[AppForge] Creating E2B sandbox...');

        // Convert files to E2B format
        const fileList = Object.entries(files)
          .filter(([_, file]) => file.type === 'file')
          .map(([path, file]) => ({
            path: path.startsWith('/') ? path.slice(1) : path,
            content: file.content,
          }));

        // Create sandbox via API
        const response = await fetch('/api/sandbox/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            files: fileList,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create sandbox: ${response.statusText}`);
        }

        const sandboxData: SandboxInfo = await response.json();
        setSandbox(sandboxData);
        addOutput('[AppForge] Sandbox created! Installing dependencies...');

        // Start polling for logs
        startLogsPolling(sandboxData.id);
      } catch (err) {
        console.error('[E2BExpoPreview] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to start E2B sandbox');
        addOutput(`[Error] ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    initE2B();

    return () => {
      // Cleanup: stop polling
      if (logsPollingRef.current) {
        clearInterval(logsPollingRef.current);
      }
    };
  }, []);

  const startLogsPolling = (sandboxId: string) => {
    // Poll every 2 seconds for new logs
    logsPollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/sandbox/logs?sandboxId=${sandboxId}&projectId=${projectId}`);
        if (!response.ok) return;

        const data = await response.json();

        // Update logs
        if (data.logs && data.logs.length > 0) {
          const newLogs = data.logs.map((log: any) => log.message);
          setTerminalOutput((prev) => {
            // Only add new logs (simple deduplication)
            const existingSet = new Set(prev);
            const toAdd = newLogs.filter((log: string) => !existingSet.has(log));
            return [...prev, ...toAdd];
          });

          // Check for QR code or exp:// URL in logs
          for (const log of data.logs) {
            if (log.message.includes('exp://')) {
              const match = log.message.match(/exp:\/\/[\w\d.-]+:\d+/);
              if (match) {
                setQRCodeUrl(match[0]);
                if (sandbox) {
                  setSandbox({ ...sandbox, status: 'running' });
                }
              }
            }
          }
        }

        // Update status
        if (data.status && sandbox) {
          setSandbox({ ...sandbox, status: data.status });
        }
      } catch (err) {
        console.error('[E2BExpoPreview] Logs polling error:', err);
      }
    }, 2000);
  };

  const addOutput = (data: string) => {
    setTerminalOutput((prev) => [...prev, data]);
  };

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">Expo Preview (E2B)</h2>
          {sandbox?.status === 'running' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
              Running
            </span>
          )}
          {sandbox && ['creating', 'installing', 'starting'].includes(sandbox.status) && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              {sandbox.status === 'creating' && 'Creating...'}
              {sandbox.status === 'installing' && 'Installing...'}
              {sandbox.status === 'starting' && 'Starting...'}
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
        {/* Terminal */}
        <div className="flex flex-1 flex-col border-r border-slate-700">
          <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-4 py-2">
            <TerminalIcon className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Terminal</span>
          </div>
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-[10px] leading-tight text-slate-300"
          >
            {terminalOutput.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex w-80 flex-col bg-slate-800">
          <div className="border-b border-slate-700 px-4 py-2">
            <span className="text-xs font-medium text-slate-300">Scan to Preview</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            {sandbox?.status === 'running' && qrCodeUrl ? (
              <>
                <div className="mb-4 flex h-64 w-64 items-center justify-center rounded-lg bg-white p-4">
                  <QrCode className="h-full w-full text-black" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">Open Expo Go and scan QR code</p>
                  <code className="mt-2 block rounded bg-slate-700 px-2 py-1 text-xs text-blue-400">
                    {qrCodeUrl}
                  </code>
                  {sandbox.url && (
                    <a
                      href={sandbox.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-xs text-blue-400 hover:underline"
                    >
                      Open in browser
                    </a>
                  )}
                </div>
              </>
            ) : error ? (
              <div className="text-center">
                <div className="mb-2 text-red-400">❌</div>
                <p className="text-sm text-red-400">Failed to start sandbox</p>
                <p className="mt-2 text-xs text-slate-500">{error}</p>
              </div>
            ) : (
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-400" />
                <p className="text-sm text-slate-300">
                  {!sandbox && 'Creating sandbox...'}
                  {sandbox?.status === 'creating' && 'Creating sandbox...'}
                  {sandbox?.status === 'installing' && 'Installing dependencies...'}
                  {sandbox?.status === 'starting' && 'Starting Expo server...'}
                </p>
                <p className="mt-2 text-xs text-slate-500">This may take 1-2 minutes</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="border-t border-slate-700 p-4">
            <p className="mb-2 text-xs font-medium text-slate-300">How to preview:</p>
            <ol className="space-y-1 text-xs text-slate-400">
              <li>1. Install Expo Go app on your phone</li>
              <li>2. Open Expo Go</li>
              <li>3. Scan the QR code above</li>
              <li>4. See your app live on your device!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
