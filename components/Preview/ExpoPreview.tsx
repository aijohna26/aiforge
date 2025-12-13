'use client';

import { useEffect, useRef, useState } from 'react';
import { ExpoWebContainer, type ExpoQRCode } from '@/lib/expo-webcontainer';
import { Loader2, Smartphone, Terminal as TerminalIcon, X } from 'lucide-react';

interface ExpoPreviewProps {
  files: Record<string, { type: string; content: string }>;
  onClose?: () => void;
}

export function ExpoPreview({ files, onClose }: ExpoPreviewProps) {
  const [status, setStatus] = useState<'booting' | 'installing' | 'starting' | 'running' | 'error'>('booting');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [qrCode, setQRCode] = useState<ExpoQRCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<ExpoWebContainer | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initExpo = async () => {
      try {
        const container = new ExpoWebContainer();
        containerRef.current = container;

        // Boot WebContainer
        setStatus('booting');
        addOutput('[AppForge] Booting WebContainer...');
        await container.boot();
        addOutput('[AppForge] WebContainer ready');

        // Write files (like bolt.diy - faster than mounting)
        addOutput('[AppForge] Writing project files...');
        await container.writeFiles(files, (file) => {
          addOutput(`[AppForge] Wrote ${file}`);
        });
        addOutput('[AppForge] All files written');

        // Install dependencies
        setStatus('installing');
        addOutput('[AppForge] Installing dependencies (this may take a minute)...');
        await container.installDependencies((data) => addOutput(data));
        addOutput('[AppForge] Dependencies installed');

        // Start Expo
        setStatus('starting');
        addOutput('[AppForge] Starting Expo dev server...');
        await container.startExpo(
          (data) => addOutput(data),
          (qr) => {
            setQRCode(qr);
            setStatus('running');
            addOutput('[AppForge] Expo is running! Scan the QR code with Expo Go app.');
          }
        );
      } catch (err) {
        console.error('[ExpoPreview] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to start Expo');
        setStatus('error');
        addOutput(`[Error] ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    initExpo();

    return () => {
      // Kill the Expo process but keep WebContainer alive
      if (containerRef.current) {
        containerRef.current.stopExpo();
      }
    };
  }, []);

  // Update files when they change
  useEffect(() => {
    if (containerRef.current && status === 'running') {
      Object.entries(files).forEach(async ([path, file]) => {
        if (file.type === 'file') {
          try {
            await containerRef.current!.writeFile(path, file.content);
            addOutput(`[AppForge] Updated ${path}`);
          } catch (err) {
            console.error(`Failed to update ${path}:`, err);
          }
        }
      });
    }
  }, [files, status]);

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
          <h2 className="text-sm font-semibold text-slate-200">Expo Preview</h2>
          {status === 'running' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
              Running
            </span>
          )}
          {(status === 'booting' || status === 'installing' || status === 'starting') && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              {status === 'booting' && 'Booting...'}
              {status === 'installing' && 'Installing...'}
              {status === 'starting' && 'Starting...'}
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

        {/* Web Preview Section */}
        <div className="flex w-80 flex-col bg-slate-800">
          <div className="border-b border-slate-700 px-4 py-2">
            <span className="text-xs font-medium text-slate-300">Web Preview</span>
          </div>
          <div className="flex flex-1 flex-col p-4">
            {status === 'running' && qrCode?.url ? (
              <>
                <div className="mb-3 rounded-lg bg-slate-700 p-3">
                  <p className="mb-1 text-xs font-medium text-slate-300">Preview URL:</p>
                  <a
                    href={qrCode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-xs text-blue-400 hover:underline"
                  >
                    {qrCode.url}
                  </a>
                </div>
                <div className="flex-1 overflow-hidden rounded-lg border border-slate-700 bg-white">
                  <iframe
                    src={qrCode.url}
                    className="h-full w-full"
                    title="Expo Web Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                  />
                </div>
              </>
            ) : status === 'error' ? (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <div className="mb-2 text-red-400">❌</div>
                  <p className="text-sm text-red-400">Failed to start Expo</p>
                  {error && <p className="mt-2 text-xs text-slate-500">{error}</p>}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-400" />
                  <p className="text-sm text-slate-300">
                    {status === 'booting' && 'Booting WebContainer...'}
                    {status === 'installing' && 'Installing dependencies...'}
                    {status === 'starting' && 'Starting Expo server...'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">This may take a minute</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
