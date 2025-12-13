'use client';

import { useEffect, useRef, useState } from 'react';
import { webcontainer } from '@/lib/webcontainer';
import { Loader2, Terminal as TerminalIcon, X, ExternalLink } from 'lucide-react';
import { terminalOutput, serverStatus } from '@/lib/stores/editor';

interface BoltExpoPreviewProps {
  files: Record<string, { type: string; content: string }>;
  onClose?: () => void;
}

export function BoltExpoPreview({ files, onClose }: BoltExpoPreviewProps) {
  const [status, setStatus] = useState<'init' | 'writing' | 'installing' | 'starting' | 'ready' | 'error'>('init');
  const [log, setLog] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Tunnel URL for QR code
  const [webPreviewUrl, setWebPreviewUrl] = useState<string | null>(null); // Web URL for iframe
  const [error, setError] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'qr' | 'web'>('web');
  const logRef = useRef<HTMLDivElement>(null);
  const isBooting = useRef(true);
  const processRef = useRef<any>(null);
  const tunnelProcessRef = useRef<any>(null);

  const addLog = (message: string) => {
    setLog(prev => [...prev, message]);
    // Also update the global terminal output store
    terminalOutput.set(terminalOutput.get() + message + '\n');
  };

  // Initialization effect (runs once)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        isBooting.current = true;
        serverStatus.set('booting');
        addLog('[AppForge] Initializing WebContainer...');
        const container = await webcontainer;

        if (!mounted) return;

        addLog('[AppForge] WebContainer ready');

        // Write initial files
        setStatus('writing');
        serverStatus.set('mounting');
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
        addLog('[AppForge] Files synced');

        // Check if node_modules already exists (WebContainer persists across refreshes)
        let hasNodeModules = false;
        try {
          await container.fs.readdir('node_modules');
          hasNodeModules = true;
          addLog('[AppForge] ✓ Found existing node_modules');
        } catch (e) {
          // node_modules missing
        }

        // Install dependencies
        if (!hasNodeModules) {
          setStatus('installing');
          serverStatus.set('installing');
          addLog('[AppForge] Installing dependencies...');

          const runInstall = async () => {
            return await container.spawn('npm', [
              'install',
              '--yes',
              '--no-audit',
              '--no-fund'
            ]);
          };

          let installProcess = await runInstall();

          installProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                if (mounted) addLog(data);
              },
            })
          );

          let installExitCode = await installProcess.exit;

          // If install fails, try clearing node_modules and retrying
          if (installExitCode !== 0) {
            addLog('[AppForge] ⚠️ Install failed, clearing cache and retrying...');
            await container.spawn('rm', ['-rf', 'node_modules']);

            installProcess = await runInstall();
            installProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  if (mounted) addLog(data);
                },
              })
            );
            installExitCode = await installProcess.exit;
          }

          if (!mounted) return;

          if (installExitCode !== 0) {
            throw new Error(`npm install failed with exit code ${installExitCode}`);
          }

          addLog('[AppForge] ✓ Dependencies installed');
        } else {
          addLog('[AppForge] ✓ Using cached dependencies');
        }


        // Start Expo dev server (provides both web and mobile previews)
        setStatus('starting');
        serverStatus.set('starting');
        addLog('[AppForge] Starting Expo dev server...');
        addLog('[AppForge] This will provide web preview and QR code for mobile...');

        // Listen for server-ready event to get the web preview URL
        container.on('server-ready', (port, url) => {
          if (mounted && port === 8081) {
            addLog(`[AppForge] ✓ Server ready on port ${port}: ${url}`);
            addLog(`[AppForge] ✓ Web preview ready: ${url}`);
            setWebPreviewUrl(url);
            setStatus('ready');
            serverStatus.set('ready');

            // Start localtunnel for mobile preview
            // We do this after server is ready to ensure port 8081 is open
            (async () => {
              try {
                addLog('[AppForge] Starting localtunnel for mobile preview...');
                const tunnelProcess = await container.spawn('npx', ['localtunnel', '--port', '8081']);
                tunnelProcessRef.current = tunnelProcess;

                tunnelProcess.output.pipeTo(
                  new WritableStream({
                    write(data) {
                      if (!mounted) return;
                      const output = data.toString();
                      // localtunnel outputs: "your url is: https://..."
                      const match = output.match(/your url is: (https:\/\/[^\s]+)/);
                      if (match) {
                        const tunnelUrl = match[1];
                        // Convert https:// to exp:// for Expo Go
                        const expUrl = tunnelUrl.replace('https://', 'exp://');
                        addLog(`[AppForge] ✓ Mobile Tunnel URL: ${expUrl}`);
                        setPreviewUrl(expUrl);
                      }
                    }
                  })
                );
              } catch (e) {
                console.error('Failed to start localtunnel:', e);
                addLog('[AppForge] ⚠️ Failed to start mobile tunnel');
              }
            })();
          }
        });

        // Also listen for port events (bolt.diy uses both)
        container.on('port', (port, type, url) => {
          if (mounted && port === 8081 && type === 'open') {
            addLog(`[AppForge] ✓ Web preview URL: ${url}`);
            setWebPreviewUrl(url);
            setStatus('ready');
            serverStatus.set('ready');
          }
        });


        const expoProcess = await container.spawn('npx', ['expo', 'start']);
        processRef.current = expoProcess;

        let buffer = '';

        expoProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (!mounted) return;

              const output = data.toString();
              addLog(output);
              buffer += output;

              if (buffer.length > 8192) {
                buffer = buffer.slice(-8192);
              }
            },
          })
        );

        // Mark boot as complete
        isBooting.current = false;

      } catch (err) {
        console.error('[BoltExpoPreview] Error:', err);
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Failed to start Expo';
          setError(message);
          setStatus('error');
          serverStatus.set('error');
          addLog(`[Error] ${message}`);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (processRef.current) {
        try {
          processRef.current.kill();
        } catch (e) {
          console.error('Failed to kill process:', e);
        }
      }
      if (tunnelProcessRef.current) {
        try {
          tunnelProcessRef.current.kill();
        } catch (e) {
          console.error('Failed to kill tunnel:', e);
        }
      }
    };
  }, []);

  // File syncing effect (runs when files change)
  useEffect(() => {
    // Skip syncing if still booting (init handles the first write)
    if (isBooting.current) return;

    const syncFiles = async () => {
      const container = await webcontainer;

      // Write files using bolt.diy's approach
      // Don't change status to 'writing' here to avoid UI flicker, just log
      addLog('[AppForge] Syncing files...');

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

        // Optimization: Only write file if content has changed
        try {
          const existingContent = await container.fs.readFile(relativePath, 'utf-8');
          if (existingContent === file.content) {
            continue;
          }
        } catch (e) {
          // File doesn't exist, proceed to write
        }

        await container.fs.writeFile(relativePath, file.content);
        addLog(`  ✓ ${relativePath}`);
      }

      addLog('[AppForge] Files synced');
    };

    syncFiles();
  }, [files]);

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
          {(status === 'init' || status === 'writing' || status === 'installing' || status === 'starting') && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              {status === 'init' && 'Initializing...'}
              {status === 'writing' && 'Writing files...'}
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
        {/* Preview */}
        <div className="flex flex-1 flex-col bg-slate-800">
          {/* Preview Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-2">
            <button
              onClick={() => setActivePreviewTab('qr')}
              className={`px-4 py-2 text-xs font-medium transition-colors ${activePreviewTab === 'qr'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setActivePreviewTab('web')}
              className={`px-4 py-2 text-xs font-medium transition-colors ${activePreviewTab === 'web'
                ? 'text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Web Preview
            </button>
          </div>

          <div className="flex flex-1 flex-col p-4">
            {status === 'ready' && (previewUrl || webPreviewUrl) ? (
              <div className="flex flex-1 flex-col">
                {activePreviewTab === 'qr' ? (
                  /* QR Code Section */
                  previewUrl ? (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="rounded-lg border border-slate-700 bg-slate-900 p-8 max-w-md w-full">
                        <div className="mb-6 text-center">
                          <h3 className="text-lg font-semibold text-slate-200">Scan to Preview on Mobile</h3>
                          <p className="mt-2 text-sm text-slate-400">
                            Use Expo Go app to scan this QR code.
                          </p>
                          <p className="mt-1 text-xs text-green-400">
                            ✓ Public tunnel active via localtunnel
                          </p>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center mb-6">
                          <div className="rounded-lg bg-white p-6 shadow-xl">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(previewUrl)}`}
                              alt="QR Code"
                              className="h-[300px] w-[300px]"
                            />
                          </div>
                        </div>

                        {/* URL Display */}
                        <div className="rounded-lg bg-slate-800 p-4">
                          <p className="mb-2 text-xs font-medium text-slate-400">Preview URL:</p>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-blue-400 hover:underline break-all"
                          >
                            <span className="flex-1">{previewUrl}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center text-slate-400">
                      <p className="text-sm">Waiting for mobile URL...</p>
                    </div>
                  )
                ) : (
                  /* Web Preview iframe */
                  webPreviewUrl ? (
                    <div className="flex-1 overflow-hidden rounded-lg border border-slate-700 bg-white shadow-lg">
                      <iframe
                        src={webPreviewUrl}
                        className="h-full w-full"
                        title="Expo Web Preview"
                        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin"
                        allow="cross-origin-isolated"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center text-slate-400">
                      <p className="text-sm">Starting web server...</p>
                    </div>
                  )
                )}
              </div>
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
                  <p className="text-sm text-slate-300">
                    {status === 'init' && 'Initializing WebContainer...'}
                    {status === 'writing' && 'Writing project files...'}
                    {status === 'installing' && 'Installing dependencies...'}
                    {status === 'starting' && 'Starting Expo server...'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {status === 'installing' ? 'This takes 30-60 seconds' : 'This takes 10-20 seconds'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
