"use client";

import { useEffect, useState } from "react";
import type { GeneratedFile } from "@/lib/types";
import { Loader2, Monitor, Smartphone, RefreshCcw, AlertCircle, Crown } from "lucide-react";
import { useSubscription } from "@/lib/hooks/use-subscription";
import Link from "next/link";

interface WebDevicePreviewProps {
    files: GeneratedFile[];
    projectId: string | null;
    projectName: string;
    refreshToken?: number;
}

type PreviewMode = "web" | "device";

interface Sandbox {
    id: string;
    tunnelUrl: string | null;
    status: string;
    expiresAt: number;
    provider?: 'e2b' | 'daytona';
}

export function WebDevicePreview({
    files,
    projectId,
    projectName,
    refreshToken = 0,
}: WebDevicePreviewProps) {
    const [mode, setMode] = useState<PreviewMode>("web");
    const [sandbox, setSandbox] = useState<Sandbox | null>(null);
    const [qrCode, setQrCode] = useState<string>("");
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const { subscription, canCreateSession, sessionsThisMonth } = useSubscription();

    useEffect(() => {
        if (!files?.length || !projectId) {
            setStatus("idle");
            return;
        }

        createSandbox();
    }, [files, projectId, refreshToken]);

    async function createSandbox() {
        try {
            // Check limits
            const { allowed, reason } = canCreateSession();
            if (!allowed) {
                setStatus("error");
                setErrorMessage(reason || "Cannot create session");
                return;
            }

            setStatus("loading");
            setErrorMessage("");

            // Create sandbox - manager handles cleanup and prevents race conditions
            const payload = { projectId, files };
            console.log(`[Preview] Sending create request, payload size: ${JSON.stringify(payload).length} chars`);
            console.log(`[Preview] Files count: ${files?.length}`);

            const response = await fetch("/api/sandbox/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('[Preview] Sandbox creation failed:', error);
                throw new Error(error.message || error.error);
            }

            const data = await response.json();
            console.log('[Preview] Sandbox created:', data.sandbox);
            setSandbox({ ...data.sandbox, provider: data.provider });

            // Always poll for tunnel URL - backend will update it when ready
            console.log('[Preview] Starting polling for tunnel URL and Expo server...');
            setStatus("loading");
            if (projectId) {
                pollForServerReady(projectId);
            }

        } catch (error) {
            console.error("[Preview] Failed to create sandbox:", error);
            setErrorMessage(error instanceof Error ? error.message : "Failed to create sandbox");
            setStatus("error");
        }
    }

    async function pollForServerReady(projectId: string) {
        const maxAttempts = 60; // Poll for up to 3 minutes (60 * 3s)
        let attempts = 0;

        const poll = async () => {
            try {
                attempts++;
                console.log(`[Preview] Checking sandbox status attempt ${attempts}/${maxAttempts}`);

                // First, check if tunnel URL has been updated in backend
                const sandboxResponse = await fetch(`/api/sandbox/status?projectId=${projectId}`, {
                    cache: 'no-store'
                }).catch(() => null);

                // If sandbox not found (404) after many attempts, it may be lost
                if (sandboxResponse?.status === 404) {
                    console.warn('[Preview] Sandbox not found (404)');
                    // Only give up after multiple attempts (backend might still be storing it)
                    if (attempts > 10) {
                        console.error('[Preview] Sandbox still not found after 10 attempts - may need to recreate');
                        setStatus("error");
                        setErrorMessage("Sandbox session expired. Please click Restart.");
                        return;
                    }
                    // Otherwise keep polling - backend might still be creating it
                }

                if (sandboxResponse?.ok) {
                    const data = await sandboxResponse.json();
                    console.log('[Preview] Sandbox status:', data);

                    // Support both E2B (data.url) and Daytona (data.tunnelUrl)
                    const previewUrl = data.url || data.tunnelUrl;

                    if (data.ready && previewUrl) {
                        console.log(`[Preview] Preview URL ready (${data.provider}):`, previewUrl);

                        // Update sandbox with real URL
                        setSandbox(prev => prev ? { ...prev, tunnelUrl: previewUrl, provider: data.provider } : {
                            id: projectId,
                            tunnelUrl: previewUrl,
                            status: 'running',
                            expiresAt: Date.now() + 10 * 60 * 1000,
                            provider: data.provider
                        } as Sandbox);

                        // For E2B, URL is ready immediately - just show it
                        // For Daytona, check if tunnel is responding
                        if (data.provider === 'e2b') {
                            console.log('[Preview] E2B URL ready, displaying preview!');
                            setStatus("ready");

                            // Generate QR code
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(previewUrl)}`;
                            setQrCode(qrUrl);
                            return;
                        } else {
                            // For Daytona, check proxy endpoint
                            const checkUrl = `/api/daytona/${projectId}?t=${Date.now()}`;
                            const serverHealth = await fetch(checkUrl, {
                                method: 'HEAD',
                                cache: 'no-store'
                            }).catch(() => null);

                            if (serverHealth?.ok || serverHealth?.status === 503) {
                                // 503 means server is starting but tunnel is working
                                console.log('[Preview] Daytona tunnel is ready!');
                                setStatus("ready");

                                // Generate QR code
                                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(previewUrl)}`;
                                setQrCode(qrUrl);
                                return;
                            } else {
                                console.log('[Preview] Tunnel ready but server still starting...');
                            }
                        }
                    }
                }

                if (attempts < maxAttempts) {
                    setTimeout(poll, 3000);
                } else {
                    console.warn('[Preview] Timeout waiting for sandbox - this may indicate an issue');
                    setStatus("error");
                    setErrorMessage("Sandbox timeout - please try restarting");
                }
            } catch (error) {
                console.error('[Preview] Polling error:', error);
                if (attempts < maxAttempts) {
                    setTimeout(poll, 3000);
                } else {
                    setStatus("error");
                    setErrorMessage("Failed to connect to sandbox");
                }
            }
        };

        poll();
    }

    const renderStatus = () => {
        if (status === "loading") {
            return (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {sandbox ? 'Loading web preview & generating QR code...' : 'Creating sandbox...'}
                </div>
            );
        }

        if (status === "error") {
            return (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-rose-400">
                        <AlertCircle className="h-3 w-3" />
                        {errorMessage}
                    </div>
                    {errorMessage.includes("limit") && (
                        <Link
                            href="/pricing"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            <Crown className="h-3 w-3" />
                            Upgrade to Pro
                        </Link>
                    )}
                </div>
            );
        }

        if (status === "ready") {
            return (
                <div className="flex items-center gap-3">
                    <span className="text-xs text-emerald-400">● Live</span>
                    {subscription?.plan_tier === 'free' && (
                        <span className="text-xs text-slate-500">
                            {sessionsThisMonth}/5 sessions used
                        </span>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="flex h-full flex-col bg-slate-950 border-l border-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-900 px-4 py-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-slate-100">Preview</h3>
                    {renderStatus()}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => createSandbox()}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-900"
                    >
                        <RefreshCcw className="h-3 w-3" />
                        Restart
                    </button>
                    <div className="inline-flex rounded-lg bg-slate-900 p-1 text-xs text-slate-400">
                        <button
                            onClick={() => setMode("web")}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${mode === "web"
                                ? "bg-blue-600 text-white shadow"
                                : "hover:text-slate-200"
                                }`}
                        >
                            <Monitor className="h-3.5 w-3.5" /> App
                        </button>
                        <button
                            onClick={() => setMode("device")}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${mode === "device"
                                ? "bg-blue-600 text-white shadow"
                                : "hover:text-slate-200"
                                }`}
                        >
                            <Smartphone className="h-3.5 w-3.5" /> Test on your phone
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-900">
                {mode === "web" ? (
                    <div className="flex h-full items-center justify-center p-8">
                        <div className="relative" style={{ width: "375px", height: "812px" }}>
                            <div className="absolute inset-0 rounded-[3rem] bg-black shadow-2xl border-[14px] border-gray-800">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10" />

                                <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-white">
                                    {status === "ready" && projectId && sandbox?.tunnelUrl ? (
                                        <iframe
                                            key={`${projectId}-${refreshToken}-${sandbox.tunnelUrl}`}
                                            src={
                                                sandbox.provider === 'e2b'
                                                    ? sandbox.tunnelUrl
                                                    : `/api/daytona/${projectId}?session=${sandbox.id}`
                                            }
                                            className="w-full h-full border-0"
                                            title="App Preview"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-slate-500 text-sm px-8 text-center gap-4">
                                            {status === "loading" ? (
                                                <>
                                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                                    <div className="space-y-1">
                                                        <p>Starting Expo...</p>
                                                        <p className="text-xs opacity-60">This may take up to 60 seconds</p>
                                                    </div>
                                                </>
                                            ) : status === "error" ? (
                                                <>
                                                    <AlertCircle className="h-8 w-8 text-rose-500" />
                                                    <p className="text-rose-500">{errorMessage}</p>
                                                </>
                                            ) : (
                                                "Waiting for sandbox..."
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-6 text-center p-4">
                        <div>
                            <h4 className="text-base font-semibold text-slate-100">
                                Test on your phone
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                                Scan the QR code to open this app in Expo Go
                            </p>
                        </div>
                        {qrCode && status === "ready" ? (
                            <div className="bg-white p-4 rounded-2xl shadow-2xl">
                                <img src={qrCode} alt="Preview QR Code" className="w-56 h-56" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {status === "loading"
                                    ? "Creating sandbox..."
                                    : "Waiting for tunnel..."}
                            </div>
                        )}
                        <p className="text-[11px] text-slate-500">
                            Download Expo Go from App Store or Google Play
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
