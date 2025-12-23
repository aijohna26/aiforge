import React from 'react';
import { Rnd } from 'react-rnd';
import { PreviewFrame } from './PreviewFrame';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { ThemeType } from '~/utils/theme';

interface DeviceFrameProps {
    id: string;
    html: string;
    isActive: boolean;
    isPanningMode: boolean;
    theme?: ThemeType;
    onSelect: (id: string) => void;
    isScreenshotMode?: boolean;
    defaultX?: number;
    defaultY?: number;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
    id,
    html,
    isActive,
    isPanningMode,
    theme,
    onSelect,
    isScreenshotMode = false,
    defaultX = 4000,
    defaultY = 3600,
}) => {
    return (
        <Rnd
            size={{ width: 375, height: 812 }}
            disableDragging={isPanningMode}
            default={{
                x: defaultX,
                y: defaultY,
                width: 375,
                height: 812,
            }}
            lockAspectRatio={375 / 812}
            enableResizing={false}
            bounds="parent"
            dragHandleClassName="handle"
            onDragStart={() => onSelect(id)}
            className={`group ${isActive ? 'z-50' : 'z-10'}`}
        >
            {/* PRO Floating Frame Header (Dubs Pro Style) */}
            {!isScreenshotMode && (
                <div className={`absolute -top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 bg-[#0A0A0B]/90 backdrop-blur-[40px] border border-white/[0.08] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 screenshot-exclude ${isActive ? 'opacity-100 translate-y-0 scale-100 ring-1 ring-indigo-500/30' : 'opacity-40 translate-y-2 scale-95 pointer-events-none'}`}>
                    <div className="flex items-center gap-2 px-3.5 py-1.5 border-r border-white/5">
                        <div className="i-ph:dots-six-vertical-bold text-white/20 text-xs handle cursor-grab active:cursor-grabbing" />
                        <span className="text-[11px] font-bold text-white tracking-wide whitespace-nowrap">
                            {id.replace('screen-', '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                    </div>

                    <div className="flex items-center gap-0.5 px-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); toast.info('Code view coming soon'); }}
                            className="size-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-[#9333EA]/20 hover:text-[#9333EA] transition-all"
                            title="View Code"
                        >
                            <div className="i-ph:code-bold text-xs" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toast.info('Exporting...'); }}
                            className="size-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-[#9333EA]/20 hover:text-[#9333EA] transition-all"
                            title="Export"
                        >
                            <div className="i-ph:download-simple-bold text-xs" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toast.error('Screen deleted'); }}
                            className="size-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all"
                            title="Delete"
                        >
                            <div className="i-ph:trash-bold text-xs" />
                        </button>
                    </div>
                </div>
            )}

            <div
                className={`
                    w-[375px] h-[812px] bg-[#FFFFFF] rounded-[32px] overflow-hidden relative shadow-[20px_40px_80px_rgba(0,0,0,0.6)] transition-all duration-300 handle cursor-pointer
                    ${isActive ? 'ring-[2px] ring-indigo-500 scale-[1.02]' : 'ring-1 ring-white/10'}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(id);
                }}
            >
                {/* Selection Capture Overlay (Crucial for iframe clicks) */}
                {!isActive && (
                    <div className="absolute inset-0 z-20 bg-transparent" />
                )}

                {/* Content Area - Strictly Mobile Aspect Ratio */}
                <div className="w-full h-full relative z-10 bg-[#FFFFFF]">
                    <PreviewFrame html={html} id={id} theme={theme} />
                </div>

                {/* PRO Selection Handles (Reference Style) */}
                <AnimatePresence>
                    {(isActive && !isScreenshotMode) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 pointer-events-none z-30 screenshot-exclude"
                        >
                            {/* Pro-style Corner Points (Handles) */}
                            <div className="absolute -top-1 -left-1 size-3 bg-white border-[1.5px] border-indigo-500 shadow-lg pointer-events-auto" />
                            <div className="absolute -top-1 -right-1 size-3 bg-white border-[1.5px] border-indigo-500 shadow-lg pointer-events-auto" />
                            <div className="absolute -bottom-1 -left-1 size-3 bg-white border-[1.5px] border-indigo-500 shadow-lg pointer-events-auto" />
                            <div className="absolute -bottom-1 -right-1 size-3 bg-white border-[1.5px] border-indigo-500 shadow-lg pointer-events-auto" />

                            {/* Indigo Selection Border */}
                            <div className="absolute inset-0 border-[2px] border-indigo-500/80 rounded-[32px]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Rnd>
    );
};
