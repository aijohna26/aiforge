"use client";

import { useEffect, useState, useRef } from "react";
import type { GeneratedProject, ExpoServer } from "@/lib/types";
import { Smartphone, Monitor, RefreshCcw, StopCircle, Loader2 } from "lucide-react";

interface MobilePreviewProps {
  project: GeneratedProject | null;
}

type PreviewMode = "web" | "device";

export function MobilePreview({ project }: MobilePreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("web");
  const [expoServer, setExpoServer] = useState<ExpoServer | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const currentProjectRef = useRef<string | null>(null);

  // Function to fetch preview HTML
  const fetchPreview = async () => {
    if (!project) {
      console.log('[MobilePreview] No project to preview');
      setPreviewHtml(null);
      setPreviewError(null);
      return;
    }

    console.log('[MobilePreview] Project received:', {
      projectName: project.projectName,
      fileCount: project.files?.length,
      filePaths: project.files?.map(f => f.path)
    });

    // Find the main app file
    const indexFile = project.files?.find(
      (f) =>
        f.path === "app/index.tsx" ||
        f.path === "App.tsx" ||
        f.path === "App.js"
    );

    if (!indexFile) {
      console.error('[MobilePreview] No entry file found. Available files:', project.files?.map(f => f.path));
      setPreviewError("No app entry file found (app/index.tsx or App.tsx)");
      return;
    }

    console.log('[MobilePreview] Found entry file:', indexFile.path, 'Content length:', indexFile.content?.length);

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      console.log('[MobilePreview] Fetching preview HTML...');
      const res = await fetch("/api/preview-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: indexFile.content,
          name: project.projectName,
        }),
      });

      console.log('[MobilePreview] Preview API response:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[MobilePreview] Preview API error:', errorText);
        throw new Error("Failed to generate preview");
      }

      const html = await res.text();
      console.log('[MobilePreview] Preview HTML generated, length:', html.length);
      setPreviewHtml(html);
      setPreviewKey((k) => k + 1);
    } catch (err) {
      console.error("[MobilePreview] Preview generation failed:", err);
      setPreviewError(err instanceof Error ? err.message : "Failed to generate preview");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Fetch preview HTML when project changes
  useEffect(() => {
    fetchPreview();
  }, [project]);

  // Sync file changes to running Expo server (for hot reload)
  useEffect(() => {
    console.log('[MobilePreview] Sync effect triggered', {
      hasProject: !!project,
      hasExpoServer: !!expoServer,
      expoServerStatus: expoServer?.status,
      fileCount: project?.files?.length,
    });

    if (!project || !expoServer || expoServer.status !== "running") {
      console.log('[MobilePreview] Skipping sync - conditions not met');
      return;
    }

    const syncFiles = async () => {
      try {
        console.log('[MobilePreview] Syncing file changes to Expo server...', {
          serverId: expoServer.id,
          fileCount: project.files?.length,
        });
        const response = await fetch(`/api/expo-server?id=${expoServer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project }),
        });

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`);
        }

        console.log('[MobilePreview] Files synced successfully - Metro will hot reload');
      } catch (error) {
        console.error('[MobilePreview] Failed to sync files:', error);
      }
    };

    // Debounce the sync to avoid too many requests
    const timeoutId = setTimeout(syncFiles, 300);
    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(project?.files), expoServer?.id]);

  // Stop server when project changes
  useEffect(() => {
    const projectId = project?.projectName || null;

    if (currentProjectRef.current !== projectId && expoServer) {
      stopExpoServer();
    }

    currentProjectRef.current = projectId;

    return () => {
      if (expoServer) {
        fetch(`/api/expo-server?id=${expoServer.id}`, { method: "DELETE" });
      }
    };
  }, [project?.projectName]);

  const startExpoServer = async () => {
    if (!project) return;

    setIsStarting(true);
    setError(null);
    setExpoServer(null);

    try {
      const response = await fetch("/api/expo-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start Expo server");
      }

      setExpoServer(data.server);

      if (data.server.status === "starting") {
        pollServerStatus(data.server.id);
      }
    } catch (err) {
      console.error("Expo server start failed:", err);
      setError(err instanceof Error ? err.message : "Failed to start server");
    } finally {
      setIsStarting(false);
    }
  };

  const pollServerStatus = async (serverId: string) => {
    let attempts = 0;
    const maxAttempts = 60;

    const poll = async () => {
      try {
        const response = await fetch(`/api/expo-server?id=${serverId}`);
        const data = await response.json();

        if (data.success && data.server) {
          setExpoServer(data.server);

          if (data.server.status === "running") return;
          if (data.server.status === "error") {
            setError(data.server.error || "Server failed to start");
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError("Server startup timed out");
        }
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        }
      }
    };

    setTimeout(poll, 2000);
  };

  const stopExpoServer = async () => {
    if (!expoServer) return;

    try {
      await fetch(`/api/expo-server?id=${expoServer.id}`, { method: "DELETE" });
    } catch {
      // Ignore
    }

    setExpoServer(null);
    setError(null);
  };

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-950/80 px-6 text-center text-slate-400">
        <p className="text-sm font-semibold text-slate-200">No preview yet</p>
        <p className="mt-2 text-xs text-slate-500">
          Generate an app to see a live preview.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-950/80 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Preview</p>
          <p className="text-sm font-semibold text-white">{project.projectName}</p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "web" && (
            <button
              type="button"
              onClick={fetchPreview}
              disabled={isLoadingPreview}
              className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              title="Refresh preview"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isLoadingPreview ? "animate-spin" : ""}`} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode("web")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
              mode === "web"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Web
          </button>
          <button
            type="button"
            onClick={() => setMode("device")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
              mode === "device"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Device
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {mode === "web" ? (
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="text-center max-w-sm">
              <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Mobile App Preview
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                This is a React Native mobile app. To see it in action, use the Device tab to launch an Expo server and scan the QR code with Expo Go on your phone.
              </p>
              <div className="bg-slate-900 rounded-lg p-4 text-left">
                <p className="text-xs font-semibold text-slate-300 mb-2">Quick Start:</p>
                <ol className="text-xs text-slate-400 space-y-1.5">
                  <li>1. Click the "Device" tab above</li>
                  <li>2. Click "Start Expo Server"</li>
                  <li>3. Install Expo Go on your phone</li>
                  <li>4. Scan the QR code to test your app</li>
                </ol>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                React Native apps run natively on iOS/Android, not in a web browser.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            {/* Initial state - Start button */}
            {!expoServer && !isStarting && !error && (
              <div className="text-center max-w-sm">
                <Smartphone className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Test on Your Device
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Start an Expo development server to run your app natively on
                  your phone using Expo Go.
                </p>
                <button
                  onClick={startExpoServer}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  Start Expo Server
                </button>
                <p className="mt-4 text-xs text-slate-500">
                  Requires Expo Go app. Phone must be on same WiFi network.
                </p>
              </div>
            )}

            {/* Starting state */}
            {isStarting && (
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-sm text-slate-200">Starting Expo server...</p>
                <p className="mt-2 text-xs text-slate-500">
                  This may take 1-2 minutes on first run.
                </p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center max-w-sm">
                <p className="text-sm font-semibold text-red-400 mb-2">Server Error</p>
                <p className="text-xs text-slate-400 mb-4">{error}</p>
                <button
                  onClick={startExpoServer}
                  className="flex items-center gap-2 mx-auto bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            )}

            {/* Running state - QR code */}
            {expoServer && expoServer.status === "running" && (
              <div className="text-center">
                <div className="mb-4 overflow-hidden rounded-lg bg-white p-3">
                  <img
                    src={expoServer.qrCodeUrl}
                    alt="QR Code"
                    width={180}
                    height={180}
                    className="h-[180px] w-[180px]"
                  />
                </div>

                <p className="text-sm font-semibold text-green-400 mb-1">Server Running</p>
                <p className="text-xs text-slate-400 mb-4 font-mono">{expoServer.expUrl}</p>

                <div className="text-left bg-slate-900 rounded-lg p-4 mb-4 max-w-xs">
                  <p className="text-xs font-semibold text-slate-300 mb-2">To run on your device:</p>
                  <ol className="text-xs text-slate-400 space-y-1">
                    <li>1. Install Expo Go from App Store / Play Store</li>
                    <li>2. Connect phone to same WiFi network</li>
                    <li>3. Scan QR code with your camera</li>
                    <li>4. App opens in Expo Go</li>
                  </ol>
                </div>

                <button
                  onClick={stopExpoServer}
                  className="flex items-center gap-2 mx-auto bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  <StopCircle className="h-4 w-4" />
                  Stop Server
                </button>
              </div>
            )}

            {/* Starting (polling) state */}
            {expoServer && expoServer.status === "starting" && (
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-yellow-500 animate-spin" />
                <p className="text-sm text-slate-200">Server is starting...</p>
                <p className="mt-2 text-xs text-slate-500">
                  Installing dependencies and starting Metro bundler.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
