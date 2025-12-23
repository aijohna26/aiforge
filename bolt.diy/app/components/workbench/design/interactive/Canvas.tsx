import React, { useState, useEffect, useRef } from 'react';
import * as ZoomPanModule from 'react-zoom-pan-pinch';
const { TransformWrapper, TransformComponent } = ZoomPanModule;
type ReactZoomPanPinchRef = ZoomPanModule.ReactZoomPanPinchRef;
import { DeviceFrame } from './DeviceFrame';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME_LIST, parseThemeColors, type ThemeType } from '~/utils/theme';

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
}

export const Canvas: React.FC<CanvasProps> = ({ frames, isGenerating = false, customTheme }) => {
    const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
    const [selectedThemeId, setSelectedThemeId] = useState<string>(customTheme?.id || 'ocean-breeze');
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [zoom, setZoom] = useState(80);
    const [isPanningMode, setIsPanningMode] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const [hasAutoFocused, setHasAutoFocused] = useState(false);

    // Merge custom theme into list
    const EFFECTIVE_THEME_LIST = customTheme
        ? [customTheme, ...THEME_LIST.filter(t => t.id !== customTheme.id)]
        : THEME_LIST;

    const selectedTheme = EFFECTIVE_THEME_LIST.find(t => t.id === selectedThemeId) || EFFECTIVE_THEME_LIST[0];

    // ... (keep useEffect) ...
    // Auto-focus on frames when they first load
    useEffect(() => {
        if (frames.length > 0 && !hasAutoFocused && transformRef.current) {
            const avgX = frames.reduce((sum, f) => sum + (f.x || 4000), 0) / frames.length;
            const avgY = frames.reduce((sum, f) => sum + (f.y || 3600), 0) / frames.length;

            transformRef.current.setTransform(
                window.innerWidth / 2 - (avgX * 0.8) - (375 * 0.8 / 2),
                window.innerHeight / 2 - (avgY * 0.8) - (812 * 0.8 / 2),
                0.8,
                0
            );
            setHasAutoFocused(true);
        }
    }, [frames, hasAutoFocused]);

    return (
        <div className="relative w-full h-full bg-[#0B0B0E] overflow-hidden flex items-center justify-center">

            {/* Premium Red Dot Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.4]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(#ff0000 1px, transparent 0px)',
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
                disabled={false} // We handle sub-feature disabling instead of the whole wrapper
                onTransformed={(ref) => setZoom(Math.round(ref.state.scale * 100))}
            >
                {({ zoomIn, zoomOut, resetTransform, setTransform }) => (
                    <>
                        <TransformComponent
                            wrapperStyle={{ width: '100%', height: '100%', cursor: isPanningMode ? 'grab' : 'default' }}
                            contentStyle={{
                                width: '8000px',
                                height: '8000px',
                                position: 'relative'
                            }}
                        >
                            <div
                                className="w-[8000px] h-[8000px] relative pointer-events-auto frames-container"
                                style={{ cursor: isPanningMode ? 'grab' : 'default' }}
                                onClick={() => setActiveFrameId(null)}
                            >
                                {frames.map((frame, index) => (
                                    <DeviceFrame
                                        key={frame.id || index}
                                        id={frame.id}
                                        html={frame.html}
                                        isActive={activeFrameId === frame.id}
                                        isPanningMode={isPanningMode}
                                        theme={selectedTheme}
                                        onSelect={setActiveFrameId}
                                        defaultX={frame.x || (4000 + (index * 450) - 150)}
                                        defaultY={frame.y || 3600}
                                    />
                                ))}
                            </div>
                        </TransformComponent>

                        {/* TOP CENTER TOOLBAR (Premium Dubs Style) */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 p-1.5 bg-[#1E1E21]/95 backdrop-blur-2xl border border-white/[0.08] rounded-[22px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                            {/* AI Mode Toggle (Reference Style) */}
                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className={`group relative size-9 flex items-center justify-center rounded-full transition-all duration-300 ${isChatOpen
                                    ? 'bg-[#9333EA] text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                                    : 'bg-white/[0.06] text-white/50 hover:bg-[#9333EA]/20 hover:text-[#9333EA]'}`}
                                aria-label="AI Studio"
                            >
                                <div className="i-ph:magic-wand-fill text-lg transition-transform group-hover:rotate-12" />
                            </button>

                            <div className="w-px h-5 bg-white/[0.08] mx-1.5" />

                            <div className="flex items-center relative">
                                {/* Theme Selection dots */}
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

                                {/* More themes toggle */}
                                <button
                                    onClick={() => setIsThemeOpen(!isThemeOpen)}
                                    className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full transition-all duration-300 ${isThemeOpen
                                        ? 'bg-[#9333EA] text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                                        : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.12] hover:text-white/80'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">+{EFFECTIVE_THEME_LIST.length - 4} more</span>
                                    <div className={`i-ph:caret-down-bold text-[10px] transition-all duration-300 ${isThemeOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Theme Selector Popover */}
                                <AnimatePresence>
                                    {isThemeOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                                            className="absolute top-[calc(100%+12px)] left-0 w-[280px] max-h-[480px] overflow-y-auto bg-[#0A0A0B]/98 backdrop-blur-[40px] border border-white/[0.08] rounded-[28px] p-2.5 shadow-[0_32px_80px_rgba(0,0,0,0.9)] z-[70] custom-scrollbar"
                                        >
                                            <div className="px-3 py-2 mb-2 border-b border-white/5">
                                                <h5 className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">Design Library</h5>
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
                                                            {isSelected ? (
                                                                <div className="i-ph:check-circle-fill text-[#9333EA] text-base" />
                                                            ) : (
                                                                <div className="i-ph:circle-bold text-white/10 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="w-px h-5 bg-white/[0.08] mx-1.5" />

                            {/* Right Utils */}
                            <div className="flex items-center gap-1 pr-1">
                                <button className="size-9 flex items-center justify-center rounded-full text-white/50 bg-white/[0.06] hover:bg-[#9333EA]/20 hover:text-[#9333EA] transition-all">
                                    <div className="i-ph:camera-bold text-lg" />
                                </button>
                                <button
                                    onClick={() => toast.success('✨ Design Saved')}
                                    className="px-5 py-2 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white rounded-full text-[11px] font-black uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_20px_rgba(249,115,22,0.5)] active:scale-95"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* AI Chat Popover (Premium Dubs Style) */}
                        <AnimatePresence>
                            {isChatOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -12, scale: 0.96 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -12, scale: 0.96 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="fixed top-24 left-6 w-[380px] bg-[#17171A]/98 backdrop-blur-[40px] border border-white/[0.1] rounded-[28px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)] z-[100]"
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
                                                    <span className="text-[9px] font-black text-white/30 tracking-wider">{prompt.length}/500</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                toast.info('🎨 AI is designing...');
                                                setIsChatOpen(false);
                                                setPrompt('');
                                            }}
                                            disabled={!prompt.trim()}
                                            className="group relative w-full py-4 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-white/5 disabled:to-white/5 text-white disabled:text-white/30 rounded-[20px] text-[11px] font-black uppercase tracking-[0.12em] transition-all shadow-[0_8px_32px_rgba(79,70,229,0.4)] disabled:shadow-none active:scale-[0.98] overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative flex items-center justify-center gap-2">
                                                <div className="i-ph:magic-wand-fill text-sm" />
                                                <span>Initialize Generation</span>
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* BOTTOM CENTER STATUS BAR (Premium Dubs Style) */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-[#1E1E21]/95 backdrop-blur-2xl border border-white/[0.08] rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                            {/* Selection Tool (Arrow) */}
                            <button
                                className={`group size-9 flex items-center justify-center rounded-full transition-all duration-200 ${!isPanningMode
                                    ? 'bg-[#9333EA]/10 text-[#9333EA] border border-[#9333EA]/20 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                                    : 'text-white/40 bg-transparent hover:bg-white/[0.05]'
                                    }`}
                                onClick={() => setIsPanningMode(false)}
                                aria-label="Selection tool"
                            >
                                <div className="i-ph:cursor-fill text-lg" />
                            </button>

                            {/* Hand Tool */}
                            <button
                                className={`group flex items-center gap-2.5 px-6 py-2.5 rounded-full transition-all duration-200 ${isPanningMode
                                    ? 'bg-[#9333EA]/10 text-[#9333EA] border border-[#9333EA]/20 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                                    : 'text-white/40 bg-transparent hover:bg-white/[0.05]'
                                    }`}
                                onClick={() => setIsPanningMode(true)}
                                aria-label="Hand tool"
                            >
                                <div className="i-ph:hand-fill text-lg" />
                                <span className="text-[12px] font-bold tracking-tight">Hand</span>
                            </button>

                            <div className="w-px h-5 bg-white/5 mx-1" />

                            {/* Zoom Out Button */}
                            <button
                                onClick={() => zoomOut(0.1)}
                                className="group size-9 flex items-center justify-center text-white/40 bg-transparent hover:bg-white/[0.06] hover:text-white rounded-full transition-all"
                                aria-label="Zoom out"
                            >
                                <div className="i-ph:minus-bold text-base" />
                            </button>

                            <div className="flex items-center gap-1 px-3 py-1.5 bg-black/40 rounded-full border border-white/[0.04]">
                                <span className="text-xs font-bold text-white/80 tabular-nums min-w-[38px] text-center">{zoom}%</span>
                            </div>

                            {/* Zoom In Button */}
                            <button
                                onClick={() => zoomIn(0.1)}
                                className="group size-9 flex items-center justify-center text-white/40 bg-transparent hover:bg-white/[0.06] hover:text-white rounded-full transition-all"
                                aria-label="Zoom in"
                            >
                                <div className="i-ph:plus-bold text-base" />
                            </button>

                            <div className="w-px h-5 bg-white/5 mx-1" />

                            {/* Fit to Screen */}
                            <button
                                onClick={() => {
                                    if (frames.length > 0) {
                                        const avgX = frames.reduce((sum, f) => sum + (f.x || 4000), 0) / frames.length;
                                        const avgY = frames.reduce((sum, f) => sum + (f.y || 3600), 0) / frames.length;
                                        setTransform(
                                            window.innerWidth / 2 - (avgX * 0.8) - (375 * 0.8 / 2),
                                            window.innerHeight / 2 - (avgY * 0.8) - (812 * 0.8 / 2),
                                            0.8,
                                            400
                                        );
                                    } else {
                                        resetTransform();
                                    }
                                }}
                                className="group size-9 flex items-center justify-center text-white/40 bg-white/[0.04] hover:bg-indigo-500/20 hover:text-indigo-400 border border-white/[0.04] rounded-full transition-all active:scale-95 shadow-xl"
                                aria-label="Fit to screen"
                            >
                                <div className="i-ph:frame-corners-bold text-lg" />
                            </button>
                        </div>

                        {/* Syncing Indicator (Premium Dubs Style) */}
                        <AnimatePresence>
                            {isGenerating && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -20, scale: 0.9 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute bottom-8 left-8 z-50 flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[18px] text-white shadow-[0_8px_32px_rgba(79,70,229,0.5)] border border-indigo-400/20"
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

            {
                frames.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500/30 pointer-events-none z-0">
                        <div className="i-ph:magic-wand-duotone text-6xl mb-4 opacity-10" />
                        <p className="font-medium tracking-widest uppercase text-xs opacity-30">Generating Design System State...</p>
                    </div>
                )
            }
        </div >
    );
};
