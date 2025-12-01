"use client";

import { useEffect, useState } from "react";
import { useStore } from '@nanostores/react';
import {
  serverStatus,
  previewUrl,
  qrCodeUrl,
  connectedDevices
} from '@/lib/webcontainer/stores';
import {
  mountProject,
  installDependencies,
  startDevServer
} from '@/lib/webcontainer';
import type { GeneratedProject } from "@/lib/types";
import { Smartphone, Monitor, RefreshCcw, Loader2, QrCode, Terminal as TerminalIcon, ZoomIn, ZoomOut, ChevronDown } from "lucide-react";
import { DeviceFrame } from "./DeviceFrame";
import { Button } from "@/components/ui/button";
import { Terminal } from "@/components/Terminal/Terminal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";

import QRCode from 'qrcode';

interface MobilePreviewProps {
  project: GeneratedProject | null;
  previewVersion: number;
}

type PreviewMode = "preview" | "qr" | "emulator" | "terminal";

interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  type: "ios" | "android";
}

const DEVICES: DeviceConfig[] = [
  { name: "iPhone 16", width: 402, height: 874, type: "ios" },
  { name: "Pixel 9", width: 412, height: 915, type: "android" },
  { name: "Galaxy S24", width: 360, height: 780, type: "android" },
];

function QRCodeDisplay({ data }: { data: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(data, { width: 256, margin: 2 }, (err, url) => {
      if (!err) setDataUrl(url);
    });
  }, [data]);

  if (!dataUrl) return <div className="w-64 h-64 bg-slate-100 animate-pulse rounded-lg" />;

  return <img src={dataUrl} alt="QR Code" className="w-64 h-64" />;
}

export function MobilePreview({ project, previewVersion }: MobilePreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("emulator");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(DEVICES[0]);
  const [zoomLevel, setZoomLevel] = useState(70);

  const status = useStore(serverStatus);
  const url = useStore(previewUrl);
  const qr = useStore(qrCodeUrl);
  const deviceCount = useStore(connectedDevices);

  // Initialize WebContainer when project loads
  useEffect(() => {
    if (project && status === 'idle') {
      const init = async () => {
        try {
          setErrorMessage(null);
          await mountProject(project.files);

          // installDependencies will check if it needs to run
          // It will skip if node_modules already exists and package.json hasn't changed
          await installDependencies();

          await startDevServer();
        } catch (err) {
          console.error('Failed to start WebContainer:', err);
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Failed to start WebContainer. Check the Terminal tab for logs.'
          );
        }
      };
      init();
    }
  }, [project, status]);

  // Handle updates (re-mount files)
  useEffect(() => {
    if (project && status === 'ready' && previewVersion > 0) {
      mountProject(project.files).catch((err) => {
        console.error('Failed to sync files to WebContainer:', err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to sync files to preview environment.'
        );
      });
    }
  }, [previewVersion, project, status]);

  const handleRestart = async () => {
    if (!project) return;
    setIsRestarting(true);
    setMode("terminal");
    try {
      setErrorMessage(null);
      await mountProject(project.files);
      await installDependencies();
      await startDevServer();
    } catch (err) {
      console.error('Failed to restart WebContainer:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to restart preview. See Terminal tab for details.'
      );
    } finally {
      setIsRestarting(false);
    }
  };

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 text-center">
        <div className="rounded-full bg-slate-800/50 p-6 mb-4">
          <Smartphone className="h-12 w-12 text-slate-500" />
        </div>
        <p className="text-lg font-semibold text-slate-200">No Preview Available</p>
        <p className="mt-2 text-sm text-slate-400 max-w-xs">
          Generate an app to see a live preview
        </p>
      </div>
    );
  }

  const isLoading = status === 'booting' || status === 'mounting' || status === 'installing' || status === 'starting';

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              Live Preview
            </p>
            <h2 className="text-lg font-bold text-white">
              {project.projectName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="capitalize">{status}...</span>
              </div>
            )}
            {status === 'ready' && (
              <>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Server Running</span>
                </div>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                {deviceCount > 0 ? (
                  <div className="flex items-center gap-2 text-xs text-blue-400">
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                    <span>{deviceCount} Device{deviceCount > 1 ? 's' : ''} Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-gray-600" />
                    <span>No Devices</span>
                  </div>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              disabled={!project || isLoading || isRestarting}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCcw className={`h-4 w-4 ${isRestarting ? 'animate-spin text-blue-400' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setMode("emulator")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "emulator"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                }`}
            >
              <Smartphone className="h-4 w-4" />
              Emulator
            </button>
            <button
              onClick={() => setMode("qr")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "qr"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                }`}
            >
              <QrCode className="h-4 w-4" />
              Device
            </button>
            <button
              onClick={() => setMode("terminal")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "terminal"
                ? "bg-slate-700 text-white"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                }`}
              title="Terminal Output"
            >
              <TerminalIcon className="h-4 w-4" />
            </button>
          </div>

          {mode === "emulator" && (
            <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
              {/* Device Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white min-w-[140px] justify-between">
                    {selectedDevice.name}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
                  {DEVICES.map((device) => (
                    <DropdownMenuItem
                      key={device.name}
                      onClick={() => setSelectedDevice(device)}
                      className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                    >
                      {device.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Zoom Control */}
              <div className="flex items-center gap-2 min-w-[120px]">
                <ZoomOut className="h-3 w-3 text-slate-500" />
                <Slider
                  value={[zoomLevel]}
                  onValueChange={(vals: number[]) => setZoomLevel(vals[0])}
                  min={50}
                  max={150}
                  step={10}
                  className="w-20"
                />
                <ZoomIn className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-400 w-8 text-right">{zoomLevel}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative bg-slate-950/50">
        {errorMessage && (
          <div className="absolute top-4 right-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 shadow-lg shadow-rose-950/30 max-w-sm z-50">
            <p className="font-semibold text-rose-200">Preview Error</p>
            <p className="text-rose-100/90 mt-1">{errorMessage}</p>
            <p className="text-rose-100/70 text-xs mt-2">
              Click Restart to try again, or open the Terminal tab for detailed logs.
            </p>
          </div>
        )}
        {isLoading && !url ? (
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-medium capitalize">{status}...</p>
            <p className="text-sm text-slate-500 mt-2">Setting up development environment</p>
          </div>
        ) : (
          <>
            {mode === "emulator" && url && (
              <div
                className="transition-transform duration-300 ease-in-out origin-center"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                <DeviceFrame
                  type={selectedDevice.type}
                  width={selectedDevice.width}
                  height={selectedDevice.height}
                >
                  <iframe
                    src={url}
                    className="w-full h-full border-0 bg-white"
                    title="App Preview"
                  />
                </DeviceFrame>
              </div>
            )}

            {mode === "qr" && qr && (
              <div className="text-center">
                <div className="bg-white p-6 rounded-2xl shadow-2xl border-4 border-slate-800 inline-block mb-6">
                  <QRCodeDisplay data={qr} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Scan with Expo Go</h3>
                <p className="text-slate-400 max-w-xs mx-auto text-sm">
                  Open the Camera app on iOS or Expo Go on Android to preview on your device.
                </p>
                <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-800 inline-block">
                  <code className="text-xs text-blue-400 font-mono break-all">{qr}</code>
                </div>
              </div>
            )}

            {mode === "terminal" && (
              <Terminal />
            )}
          </>
        )}
      </div>
    </div>
  );
}
