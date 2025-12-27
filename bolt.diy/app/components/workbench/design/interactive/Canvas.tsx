import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as ZoomPanModule from 'react-zoom-pan-pinch';
const { TransformWrapper, TransformComponent } = ZoomPanModule;
type ReactZoomPanPinchRef = ZoomPanModule.ReactZoomPanPinchRef;
import { DeviceFrame } from './DeviceFrame';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_VARIABLES, THEME_LIST, parseThemeColors, type ThemeType } from '~/utils/theme';

export interface FrameData {
    id: string;
    html: string;
    title?: string;
    x?: number;
    y?: number;
}

interface CanvasProps {
    frames: FrameData[];
    isGenerating?: boolean;
    customTheme?: ThemeType;
    branding?: any; // Branding context for custom prompts
    userId?: string; // User ID for tracking
    onGenerateNext?: () => void;
    onRegenerateTheme?: () => void;
    onCleanupLayout?: () => void;
    onDuplicateFrame?: (frameId: string) => void;
    onNewFrame?: (frame: FrameData) => void; // Callback for adding new frames from chatbox
}

const FRAME_SCREENSHOT_WIDTH = 500;
const FRAME_SCREENSHOT_HEIGHT = 940;

export const Canvas: React.FC<CanvasProps> = ({ frames, isGenerating = false, customTheme, branding, userId, onGenerateNext, onRegenerateTheme, onCleanupLayout, onDuplicateFrame, onNewFrame }) => {
    const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
    const [selectedThemeId, setSelectedThemeId] = useState<string>(customTheme?.id || 'ocean-breeze');
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [zoom, setZoom] = useState(80);
    const [isPanningMode, setIsPanningMode] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isHidingForScreenshot, setIsHidingForScreenshot] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [prompt, setPrompt] = useState('');
    const [isChatGenerating, setIsChatGenerating] = useState(false);
    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const [hasAutoFocused, setHasAutoFocused] = useState(false);

    const isScreenshotMode = isHidingForScreenshot || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('screenshot'));

    const EFFECTIVE_THEME_LIST = customTheme
        ? [customTheme, ...THEME_LIST.filter(t => t.id !== customTheme.id)]
        : THEME_LIST;

    const selectedTheme = EFFECTIVE_THEME_LIST.find(t => t.id === selectedThemeId) || EFFECTIVE_THEME_LIST[0];

    useEffect(() => {
        if (frames.length > 0 && !hasAutoFocused && transformRef.current && canvasRef.current) {
            const container = canvasRef.current.getBoundingClientRect();
            const avgX = frames.reduce((sum, f) => sum + (f.x || 4000), 0) / frames.length;
            const avgY = frames.reduce((sum, f) => sum + (f.y || 4000), 0) / frames.length;

            transformRef.current.setTransform(
                container.width / 2 - (avgX * 0.8) - (375 * 0.8 / 2),
                container.height / 2 - (avgY * 0.8) - (812 * 0.8 / 2) + 700, // Balanced Y offset for optimal visibility
                0.8,
                0
            );
            setHasAutoFocused(true);
        }
    }, [frames, hasAutoFocused]);

    const takeScreenshot = async (format: 'png' | 'pdf' = 'png') => {
        if (frames.length === 0) {
            toast.error('No frames to capture');
            return;
        }

        const t = toast.loading(`📸 Preparing ${format.toUpperCase()} export...`);

        try {
            setIsHidingForScreenshot(true);
            await new Promise(resolve => setTimeout(resolve, 200));

            const screenshotArea = document.getElementById('screenshot-area');
            const frameElements = document.querySelectorAll('[data-screen-frame="true"]');

            if (!screenshotArea || frameElements.length === 0) {
                throw new Error('Capture area not found');
            }

            const areaRect = screenshotArea.getBoundingClientRect();
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            frameElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const relX = rect.left - areaRect.left;
                const relY = rect.top - areaRect.top;

                minX = Math.min(minX, relX);
                minY = Math.min(minY, relY);
                maxX = Math.max(maxX, relX + rect.width);
                maxY = Math.max(maxY, relY + rect.height);
            });

            const padding = 120;
            const clip = {
                x: Math.max(0, minX - padding),
                y: Math.max(0, minY - padding),
                width: (maxX - minX) + (padding * 2),
                height: (maxY - minY) + (padding * 2)
            };

            const html = document.documentElement.outerHTML;
            setIsHidingForScreenshot(false);

            const response = await fetch('/api/screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html: html,
                    clip: clip,
                    format: format,
                    width: 8000,
                    height: 8000
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || 'Export failed');
            }

            const { data } = await response.json() as { data: string };
            const link = document.createElement('a');
            link.download = `appforge-design-${new Date().getTime()}.${format}`;
            link.href = data;
            link.click();

            toast.success(`✨ ${format.toUpperCase()} Exported!`, { id: t });
        } catch (error: any) {
            console.error('Export failed:', error);
            toast.error(`Export failed: ${error.message}`, { id: t });
            setIsHidingForScreenshot(false);
        } finally {
            setIsExportMenuOpen(false);
        }
    };

    const handlePromptSubmit = async () => {
        if (!prompt.trim()) {
            toast.error('Please enter a prompt');
            return;
        }

        if (!branding) {
            toast.error('Branding information is missing. Please complete the wizard first.');
            return;
        }

        setIsChatGenerating(true);
        const loadingToast = toast.loading('🎨 AI is designing your screen...');

        try {
            console.log('[Canvas Chat] Submitting prompt:', prompt);

            const response = await fetch('/api/studio/custom-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    branding,
                    userId: userId || 'anonymous'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate screen');
            }

            const result = await response.json();

            console.log('[Canvas Chat] Generation successful:', result.screen.title);

            // Calculate position for new frame
            const newX = frames.length > 0
                ? Math.max(...frames.map(f => f.x || 0)) + 1000
                : 4000;
            const newY = 4000;

            const newFrame: FrameData = {
                id: result.screen.id,
                html: result.screen.html,
                title: result.screen.title,
                x: newX,
                y: newY
            };

            // Notify parent component
            if (onNewFrame) {
                onNewFrame(newFrame);
            }

            toast.success(`✨ Created: ${result.interpretedAs.name}!`, { id: loadingToast });
            setPrompt('');
            setIsChatOpen(false);

        } catch (error: any) {
            console.error('[Canvas Chat] Error:', error);
            toast.error(error.message || 'Failed to generate screen', { id: loadingToast });
        } finally {
            setIsChatGenerating(false);
        }
    };

    const buildFrameExportHtml = useCallback((frame: FrameData, theme: ThemeType) => {
        const tailwindUrl = `/api/image-proxy?url=${encodeURIComponent('https://cdn.tailwindcss.com')}`;
        const content = frame.html || '<div class="w-full h-full bg-slate-900"></div>';

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script src="${tailwindUrl}"></script>
                <style>
                    :root {
                        ${BASE_VARIABLES}
                        ${theme?.style || ''}
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: transparent;
                        font-family: var(--font-sans), sans-serif;
                    }
                    #screenshot-area {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: ${FRAME_SCREENSHOT_WIDTH}px;
                        height: ${FRAME_SCREENSHOT_HEIGHT}px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: transparent;
                    }
                    .frame-shell {
                        width: 375px;
                        height: 812px;
                        border-radius: 42px;
                        background: linear-gradient(180deg, #2a2a2a, #1f1f1f);
                        box-shadow: 0 50px 120px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1);
                        position: relative;
                        overflow: hidden;
                    }
                    .frame-shell::before {
                        content: '';
                        position: absolute;
                        inset: 3px;
                        border-radius: 39px;
                        border: 1px solid rgba(0,0,0,0.8);
                        pointer-events: none;
                    }
                    .dynamic-island {
                        position: absolute;
                        top: 6px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 120px;
                        height: 30px;
                        background: black;
                        border-radius: 999px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.8);
                        z-index: 3;
                    }
                    .screen-content {
                        position: absolute;
                        inset: 3px;
                        border-radius: 39px;
                        overflow: hidden;
                        background: var(--background, #000);
                    }
                </style>
            </head>
            <body>
                <div id="screenshot-area">
                    <div class="frame-shell" data-screen-frame="true">
                        <div class="dynamic-island"></div>
                        <div class="screen-content">
                            ${content}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }, []);

    const handleDownloadFrame = useCallback(async (frameId: string) => {
        const targetFrame = frames.find((f) => f.id === frameId);
        if (!targetFrame) {
            throw new Error('Frame not found');
        }

        const doc = buildFrameExportHtml(targetFrame, selectedTheme);
        const response = await fetch('/api/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                html: doc,
                clip: { x: 0, y: 0, width: FRAME_SCREENSHOT_WIDTH, height: FRAME_SCREENSHOT_HEIGHT },
                format: 'png',
                width: FRAME_SCREENSHOT_WIDTH,
                height: FRAME_SCREENSHOT_HEIGHT,
            }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.error || 'Failed to render PNG');
        }

        const { data } = await response.json() as { data: string };
        const link = document.createElement('a');
        link.download = `${targetFrame.title || targetFrame.id}.png`;
        link.href = data;
        link.click();
    }, [buildFrameExportHtml, frames, selectedTheme]);

    return (
        <div ref={canvasRef} className="relative w-full h-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
            {/* Muted Off-White Dot Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.3]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(#e8e8e8 1px, transparent 0px)',
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            <TransformWrapper
                ref={transformRef}
                minScale={0.05}
                maxScale={2}
                limitToBounds={false}
                wheel={{ step: 0.1, disabled: !isPanningMode }}
                panning={{ disabled: !isPanningMode }}
                onTransformed={(ref) => setZoom(Math.round(ref.state.scale * 100))}
            >
                {({ zoomIn, zoomOut, resetTransform, setTransform }) => (
                    <>
                        <TransformComponent
                            wrapperStyle={{ width: '100vw', height: '100vh', background: 'transparent' }}
                            contentStyle={{ width: '8000px', height: '8000px', position: 'relative' }}
                        >
                            <div id="screenshot-area"
                                className="w-[8000px] h-[8000px] relative pointer-events-auto frames-container bg-[#1a1a1a]"
                                style={{
                                    cursor: isPanningMode ? 'grab' : 'default',
                                    backgroundImage: 'radial-gradient(#e8e8e8 1px, transparent 1px)',
                                    backgroundSize: '40px 40px'
                                }}
                                onClick={() => setActiveFrameId(null)}
                            >
                                {frames.map((frame, index) => {
                                    const defaultX = frame.x ?? (4000 + (index * 1000) - 500);
                                    const defaultY = frame.y ?? 4000;
                                    return (
                                        <DeviceFrame
                                            key={frame.id}
                                            id={frame.id}
                                            html={frame.html}
                                            isActive={activeFrameId === frame.id}
                                            isPanningMode={isPanningMode}
                                            isScreenshotMode={isScreenshotMode}
                                            theme={selectedTheme}
                                            onSelect={setActiveFrameId}
                                            defaultX={defaultX}
                                            defaultY={defaultY}
                                            scale={zoom / 100}
                                            onDownload={handleDownloadFrame}
                                            onDuplicate={onDuplicateFrame}
                                        />
                                    );
                                })}
                            </div>
                        </TransformComponent>

                        {!isScreenshotMode && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 p-1.5 bg-[#1E1E21]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[22px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] screenshot-exclude">
                                <button
                                    onClick={() => setIsChatOpen(!isChatOpen)}
                                    className={`group relative size-9 flex items-center justify-center rounded-full transition-all duration-300 ${isChatOpen
                                        ? 'bg-[#9333EA] text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                                        : 'bg-white/[0.06] text-white/50 hover:bg-[#9333EA]/20 hover:text-[#9333EA]'}`}
                                >
                                    <div className="i-ph:magic-wand-fill text-lg transition-transform group-hover:rotate-12" />
                                </button>
                                <div className="w-px h-5 bg-white/[0.08] mx-1.5" />
                                <div className="flex items-center relative">
                                    <div className="flex items-center gap-1.5 px-2">
                                        {EFFECTIVE_THEME_LIST.slice(0, 4).map((theme) => {
                                            const colors = parseThemeColors(theme.style);
                                            const isSelected = selectedThemeId === theme.id;
                                            return (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => setSelectedThemeId(theme.id)}
                                                    className={`size-5 rounded-full ring-offset-2 ring-offset-[#1E1E21] transition-all hover:scale-110 ${isSelected ? 'ring-2 ring-indigo-500' : 'ring-1 ring-white/10'}`}
                                                    style={{ backgroundColor: colors.primary }}
                                                    title={theme.name}
                                                />
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setIsThemeOpen(!isThemeOpen)}
                                        className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full transition-all duration-300 ${isThemeOpen
                                            ? 'bg-[#9333EA] text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                                            : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.12] hover:text-white/80'}`}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">+{EFFECTIVE_THEME_LIST.length - 4} more</span>
                                        <div className={`i-ph:caret-down-bold text-[10px] transition-all duration-300 ${isThemeOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isThemeOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                                                className="absolute top-[calc(100%+12px)] left-0 w-[280px] max-h-[480px] overflow-y-auto bg-[#0A0A0B]/98 backdrop-blur-[40px] border border-white/[0.08] rounded-[28px] p-2.5 shadow-[0_32px_80px_rgba(0,0,0,0.9)] z-[70] custom-scrollbar screenshot-exclude"
                                            >
                                                <div className="px-3 py-2 mb-2 border-b border-white/5 flex items-center justify-between">
                                                    <h5 className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">Design Library</h5>
                                                    {onRegenerateTheme && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRegenerateTheme();
                                                            }}
                                                            className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-md transition-colors group/regen"
                                                            title="AI Regenerate Custom Design System"
                                                        >
                                                            <div className="i-ph:magic-wand-fill text-[10px] group-hover/regen:rotate-12 transition-transform" />
                                                            <span className="text-[9px] font-bold uppercase tracking-wider">Regenerate</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    {EFFECTIVE_THEME_LIST.map((theme) => {
                                                        const colors = parseThemeColors(theme.style);
                                                        const isSelected = selectedThemeId === theme.id;
                                                        return (
                                                            <button
                                                                key={theme.id}
                                                                onClick={() => {
                                                                    setSelectedThemeId(theme.id);
                                                                    setIsThemeOpen(false);
                                                                }}
                                                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-[18px] transition-all duration-200 group ${isSelected
                                                                    ? 'bg-[#9333EA]/10 border border-[#9333EA]/30 text-white'
                                                                    : 'bg-transparent border border-transparent hover:bg-white/[0.03] text-white/50 hover:text-white'}`}
                                                            >
                                                                <div className="flex -space-x-1.5 translate-y-[1px]">
                                                                    <div className="size-4 rounded-full ring-2 ring-[#0A0A0B] shadow-lg" style={{ backgroundColor: colors.primary }} />
                                                                    <div className="size-4 rounded-full ring-2 ring-[#0A0A0B] shadow-lg" style={{ backgroundColor: colors.secondary || colors.background }} />
                                                                </div>
                                                                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-left flex-1">{theme.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="w-px h-5 bg-white/[0.08] mx-1.5" />
                                <div className="flex items-center gap-1 pr-1">
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                            className={`size-9 flex items-center justify-center rounded-full transition-all duration-300 ${isExportMenuOpen ? 'bg-[#9333EA] text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'text-white/50 bg-white/[0.06] hover:bg-[#9333EA]/20 hover:text-[#9333EA]'}`}
                                        >
                                            <div className="i-ph:export-bold text-lg" />
                                        </button>
                                        <AnimatePresence>
                                            {isExportMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    className="absolute top-full right-0 mt-3 w-[180px] bg-[#17171A]/98 backdrop-blur-[40px] border border-white/[0.08] rounded-[20px] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[100]"
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => takeScreenshot('png')}
                                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] text-white/70 hover:text-white rounded-[14px] transition-all group"
                                                        >
                                                            <div className="i-ph:image-bold text-base text-indigo-400" />
                                                            <div className="flex flex-col items-start text-left">
                                                                <span className="text-[11px] font-bold">Export PNG</span>
                                                                <span className="text-[9px] opacity-40">High-Res Image</span>
                                                            </div>
                                                        </button>
                                                        <button
                                                            onClick={() => takeScreenshot('pdf')}
                                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] text-white/70 hover:text-white rounded-[14px] transition-all group"
                                                        >
                                                            <div className="i-ph:file-pdf-bold text-base text-red-400" />
                                                            <div className="flex flex-col items-start text-left">
                                                                <span className="text-[11px] font-bold">Export PDF</span>
                                                                <span className="text-[9px] opacity-40">Print Quality</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    {onGenerateNext && (
                                        <button
                                            onClick={onGenerateNext}
                                            disabled={isGenerating}
                                            className="group relative px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full text-[11px] font-black uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_20px_rgba(79,70,229,0.5)] active:scale-95 flex items-center gap-2"
                                        >
                                            <div className="i-ph:plus-circle-bold text-sm" />
                                            <span>Generate Next</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {(isChatOpen && !isScreenshotMode) && (
                                <motion.div
                                    initial={{ opacity: 0, x: -12, scale: 0.96 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -12, scale: 0.96 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="fixed top-24 left-6 w-[380px] bg-[#17171A]/98 backdrop-blur-[40px] border border-white/[0.1] rounded-[28px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)] z-[100] screenshot-exclude"
                                >
                                    <div className="flex flex-col gap-5">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="i-ph:sparkle-fill text-indigo-400 text-sm" />
                                                    <h4 className="text-xs font-black text-white/95 uppercase tracking-[0.12em]">Studio Agent</h4>
                                                </div>
                                                <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">AI DESIGN ENGINE</p>
                                            </div>
                                            <button
                                                onClick={() => setIsChatOpen(false)}
                                                className="size-8 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all"
                                            >
                                                <div className="i-ph:x-bold text-sm" />
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="Ask me to design a new screen or style..."
                                                className="w-full bg-black/40 border border-white/[0.08] rounded-[22px] px-5 py-4 text-[13px] text-white/90 placeholder-white/20 focus:outline-none focus:border-indigo-500/40 focus:bg-black/60 min-h-[160px] resize-none transition-all leading-relaxed font-medium"
                                                autoFocus
                                            />
                                            <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                                                <div className="px-2.5 py-1 bg-white/[0.04] rounded-lg border border-white/[0.04]">
                                                    <span className="text-[9px] font-black text-white/30 tracking-wider font-mono">{prompt.length}/500</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handlePromptSubmit}
                                            disabled={!prompt.trim() || isChatGenerating}
                                            className="group relative w-full py-4 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-white/5 disabled:to-white/5 text-white disabled:text-white/30 rounded-[20px] text-[11px] font-black uppercase tracking-[0.12em] transition-all shadow-[0_8px_32px_rgba(79,70,229,0.4)] disabled:shadow-none active:scale-[0.98] overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative flex items-center justify-center gap-2">
                                                {isChatGenerating ? (
                                                    <>
                                                        <div className="i-ph:circle-notch-bold text-sm animate-spin" />
                                                        <span>Generating...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="i-ph:magic-wand-fill text-sm" />
                                                        <span>Initialize Generation</span>
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isScreenshotMode && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-[#1E1E21]/95 backdrop-blur-2xl border border-white/[0.08] rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)] screenshot-exclude">
                                <button
                                    className={`group size-9 flex items-center justify-center rounded-full transition-all duration-200 ${!isPanningMode
                                        ? 'bg-[#9333EA]/10 text-[#9333EA] border border-[#9333EA]/20 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                                        : 'text-white/40 bg-transparent hover:bg-white/[0.05]'
                                        }`}
                                    onClick={() => setIsPanningMode(false)}
                                >
                                    <div className="i-ph:cursor-fill text-lg" />
                                </button>
                                <button
                                    className={`group flex items-center gap-2.5 px-6 py-2.5 rounded-full transition-all duration-200 ${isPanningMode
                                        ? 'bg-[#9333EA]/10 text-[#9333EA] border border-[#9333EA]/20 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                                        : 'text-white/40 bg-transparent hover:bg-white/[0.05]'
                                        }`}
                                    onClick={() => setIsPanningMode(true)}
                                >
                                    <div className="i-ph:hand-fill text-lg" />
                                    <span className="text-[12px] font-bold tracking-tight">Hand</span>
                                </button>
                                <div className="w-px h-5 bg-white/5 mx-1" />
                                <button
                                    onClick={() => zoomOut(0.1)}
                                    className="group size-9 flex items-center justify-center text-white/40 bg-transparent hover:bg-white/[0.06] hover:text-white rounded-full transition-all"
                                >
                                    <div className="i-ph:minus-bold text-base" />
                                </button>
                                <div className="flex items-center gap-1 px-3 py-1.5 bg-black/40 rounded-full border border-white/[0.04]">
                                    <span className="text-xs font-bold text-white/80 tabular-nums min-w-[38px] text-center">{zoom}%</span>
                                </div>
                                <button
                                    onClick={() => zoomIn(0.1)}
                                    className="group size-9 flex items-center justify-center text-white/40 bg-transparent hover:bg-white/[0.06] hover:text-white rounded-full transition-all"
                                >
                                    <div className="i-ph:plus-bold text-base" />
                                </button>
                                <div className="w-px h-5 bg-white/5 mx-1" />
                                <button
                                    onClick={() => {
                                        if (frames.length > 0 && canvasRef.current) {
                                            const container = canvasRef.current.getBoundingClientRect();
                                            const avgX = frames.reduce((sum, f) => sum + (f.x || 4000), 0) / frames.length;
                                            const avgY = frames.reduce((sum, f) => sum + (f.y || 4000), 0) / frames.length;
                                            setTransform(
                                                container.width / 2 - (avgX * 0.8) - (375 * 0.8 / 2),
                                                container.height / 2 - (avgY * 0.8) - (812 * 0.8 / 2) + 700,
                                                0.8,
                                                400
                                            );
                                        } else {
                                            resetTransform();
                                        }
                                    }}
                                    className="group size-9 flex items-center justify-center text-white/40 bg-white/[0.04] hover:bg-indigo-500/20 hover:text-indigo-400 border border-white/[0.04] rounded-full transition-all active:scale-95 shadow-xl"
                                >
                                    <div className="i-ph:frame-corners-bold text-lg" />
                                </button>
                                {onCleanupLayout && (
                                    <button
                                        onClick={() => {
                                            onCleanupLayout();
                                            // Trigger re-center after a brief delay for state propagation
                                            setTimeout(() => {
                                                if (transformRef.current && canvasRef.current) {
                                                    const container = canvasRef.current.getBoundingClientRect();
                                                    // Math for dead center 4000, 4000 with balanced Y offset
                                                    transformRef.current.setTransform(
                                                        container.width / 2 - (4000 * 0.8) - (375 * 0.8 / 2),
                                                        container.height / 2 - (4000 * 0.8) - (812 * 0.8 / 2) + 700,
                                                        0.8,
                                                        600
                                                    );
                                                }
                                            }, 100);
                                        }}
                                        className="group size-9 flex items-center justify-center text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-full transition-all active:scale-95 shadow-xl"
                                        title="Optimize Layout (Re-center & Space Out)"
                                    >
                                        <div className="i-ph:magic-wand-bold text-lg" />
                                    </button>
                                )}
                            </div>
                        )}

                        <AnimatePresence>
                            {(isGenerating && !isScreenshotMode) && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -20, scale: 0.9 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute bottom-8 left-8 z-50 flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[18px] text-white shadow-[0_8px_32px_rgba(79,70,229,0.5)] border border-indigo-400/20 screenshot-exclude"
                                >
                                    <div className="relative">
                                        <div className="i-ph:circle-notch-bold animate-spin text-base" />
                                        <div className="absolute inset-0 i-ph:circle-notch-bold animate-ping opacity-20" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/95">Synchronizing</span>
                                    <div className="flex items-center gap-0.5">
                                        <div className="w-1 h-1 rounded-full bg-white/60 animate-pulse" />
                                        <div className="w-1 h-1 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                        <div className="w-1 h-1 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </TransformWrapper>

            {frames.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500/30 pointer-events-none z-0">
                    <div className="i-ph:magic-wand-duotone text-6xl mb-4 opacity-10" />
                    <p className="font-medium tracking-widest uppercase text-xs opacity-30">Generating Design System State...</p>
                </div>
            )}
        </div>
    );
};
