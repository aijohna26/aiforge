import React, { useState, useRef, useEffect } from 'react';
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
  scale?: number;
  onDownload?: (id: string) => Promise<void> | void;
  onDuplicate?: (id: string) => Promise<void> | void;
  onEditFrame?: (id: string) => void;
  isEditing?: boolean;
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
  scale = 1,
  onDownload,
  onDuplicate,
  onEditFrame,
  isEditing = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Always use the latest defaultX/defaultY values - this ensures positions update correctly
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });

  // Update position whenever defaultX or defaultY changes
  useEffect(() => {
    setPosition({ x: defaultX, y: defaultY });
  }, [defaultX, defaultY]);

  // Check scroll position and content overflow
  const checkScroll = () => {
    const container = contentRef.current;

    if (!container) {
      return;
    }

    const iframe = container.querySelector('iframe');

    if (!iframe || !iframe.contentWindow) {
      return;
    }

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const scrollTop = iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop;
      const scrollHeight = iframeDoc.documentElement.scrollHeight || iframeDoc.body.scrollHeight;
      const clientHeight = iframe.clientHeight;

      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 5);
    } catch (e) {
      // Cross-origin iframe, can't access
    }
  };

  useEffect(() => {
    const container = contentRef.current;

    if (!container) {
      return;
    }

    const iframe = container.querySelector('iframe');

    if (!iframe) {
      return;
    }

    const onLoad = () => {
      checkScroll();

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeDoc) {
          iframeDoc.addEventListener('scroll', checkScroll);
        }
      } catch (e) {
        // Cross-origin
      }
    };

    iframe.addEventListener('load', onLoad);

    // Check immediately if already loaded
    if (iframe.contentDocument?.readyState === 'complete') {
      onLoad();
    }

    return () => {
      iframe.removeEventListener('load', onLoad);

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeDoc) {
          iframeDoc.removeEventListener('scroll', checkScroll);
        }
      } catch (e) {
        // Cross-origin
      }
    };
  }, [html]);

  const smoothScroll = (direction: 'up' | 'down') => {
    const container = contentRef.current;

    if (!container || isScrolling) {
      return;
    }

    const iframe = container.querySelector('iframe');

    if (!iframe || !iframe.contentWindow) {
      return;
    }

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const scrollAmount = 200; // pixels to scroll
      const currentScroll = iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop;
      const targetScroll =
        direction === 'up' ? Math.max(0, currentScroll - scrollAmount) : currentScroll + scrollAmount;

      setIsScrolling(true);
      iframeDoc.documentElement.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });

      setTimeout(() => {
        setIsScrolling(false);
        checkScroll();
      }, 300);
    } catch (e) {
      setIsScrolling(false);
    }
  };

  return (
    <Rnd
      size={{ width: 375, height: 812 }}
      position={position}
      onDragStop={(e, d) => {
        console.log(`[DeviceFrame ${id}] Dragged to x:${d.x}, y:${d.y}`);
        setPosition({ x: d.x, y: d.y });
      }}
      disableDragging={isPanningMode}
      scale={scale}
      lockAspectRatio={375 / 812}
      enableResizing={false}
      bounds="parent"
      dragHandleClassName="handle"
      className={`group ${isActive ? 'z-50' : 'z-10'}`}
      data-screen-frame="true"
      style={isScreenshotMode ? {
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'none !important',
      } : undefined}
    >
      {/* PRO Floating Frame Header */}
      {!isScreenshotMode && (
        <div
          className={`absolute -top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 bg-[#0A0A0B]/90 backdrop-blur-[40px] border border-white/[0.08] rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 screenshot-exclude ${isActive ? 'opacity-100 translate-y-0 scale-100 ring-1 ring-indigo-500/30' : 'opacity-40 translate-y-2 scale-95 pointer-events-none'}`}
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 border-r border-white/5">
            <div className="i-ph:dots-six-vertical-bold text-white/20 text-xs handle cursor-grab active:cursor-grabbing" />
            <span className="text-[11px] font-bold text-white tracking-wide whitespace-nowrap">
              {id
                .replace('screen-', '')
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
            </span>
          </div>

          <div className="flex items-center gap-0.5 px-1">
            <button
              onClick={(e) => {
                e.stopPropagation();

                if (!onEditFrame) {
                  toast.warning('Edit not available');
                  return;
                }

                onEditFrame(id);
              }}
              className="size-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-[#9333EA]/20 hover:text-[#9333EA] transition-all"
              title="Edit Device Frame Style"
            >
              <div className="i-ph:paint-brush-bold text-xs" />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();

                if (!onDuplicate) {
                  toast.warning('Duplicate not available');
                  return;
                }

                try {
                  await Promise.resolve(onDuplicate(id));
                } catch (error) {
                  console.error('[DeviceFrame] Duplicate failed', error);
                  toast.error(error instanceof Error ? error.message : 'Failed to duplicate screen');
                }
              }}
              className="size-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-[#9333EA]/20 hover:text-[#9333EA] transition-all"
              title="Duplicate Screen"
            >
              <div className="i-ph:squares-four-bold text-xs" />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();

                if (!onDownload) {
                  toast.warning('Download not available');
                  return;
                }

                setIsExporting(true);
                try {
                  await onDownload(id);
                } catch (error) {
                  console.error('[DeviceFrame] Download failed', error);
                  toast.error(error instanceof Error ? error.message : 'Failed to download screen');
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting}
              className="size-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-[#9333EA]/20 hover:text-[#9333EA] transition-all disabled:opacity-30 disabled:pointer-events-none"
              title="Take Screenshot"
            >
              {isExporting ? (
                <div className="i-ph:circle-notch-bold text-xs animate-spin text-[#9333EA]" />
              ) : (
                <div className="i-ph:camera-bold text-xs" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.error('Screen deleted');
              }}
              className="size-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all"
              title="Delete"
            >
              <div className="i-ph:trash-bold text-xs" />
            </button>
          </div>
        </div>
      )}

      {/* Smooth Scroll Arrows - OUTSIDE the device frame */}
      {!isScreenshotMode && isActive && (
        <>
          <AnimatePresence>
            {canScrollUp && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  smoothScroll('up');
                }}
                disabled={isScrolling}
                className="absolute -left-14 top-1/3 z-50 size-10 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white/90 hover:bg-black/90 hover:text-white hover:scale-110 transition-all shadow-2xl screenshot-exclude disabled:opacity-50 border border-white/10"
                title="Scroll Up"
              >
                <div className="i-ph:caret-up-bold text-lg" />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canScrollDown && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  smoothScroll('down');
                }}
                disabled={isScrolling}
                className="absolute -left-14 bottom-1/3 z-50 size-10 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white/90 hover:bg-black/90 hover:text-white hover:scale-110 transition-all shadow-2xl screenshot-exclude disabled:opacity-50 border border-white/10"
                title="Scroll Down"
              >
                <div className="i-ph:caret-down-bold text-lg" />
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      <div
        className={`
                    w-[375px] h-[812px] rounded-[42px] overflow-hidden relative transition-all duration-300 cursor-pointer
                    ${isActive ? 'ring-[3px] ring-indigo-500 scale-[1.02]' : 'ring-[3px] ring-[#2a2a2a]'}
                    bg-gradient-to-b from-[#2a2a2a] via-[#1f1f1f] to-[#2a2a2a]
                    shadow-[0_50px_120px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)]
                `}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        {/* iPhone Bezel - Outer Frame */}
        <div className="absolute inset-0 rounded-[42px] pointer-events-none z-40">
          {/* Inner bezel shadow */}
          <div className="absolute inset-[3px] rounded-[39px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.8)]" />

          {/* Dynamic Island */}
          {!isScreenshotMode && (
            <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-full z-50 shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
          )}
        </div>

        {/* Selection Capture Overlay (Crucial for iframe clicks) */}
        {!isActive && <div className="absolute inset-0 z-20 bg-transparent" />}

        {/* Screen Content Area */}
        <div className="absolute inset-[3px] rounded-[39px] overflow-hidden bg-background">
          {/* Skeleton Loader - Shows when no HTML content or when editing */}
          {(!html || isEditing) && (
            <div className="absolute inset-0 z-50 bg-[#0a0a0a] flex flex-col p-6 gap-4 animate-pulse">
              {/* Header Skeleton */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="flex-1 space-y-4 mt-8">
                <div className="h-32 bg-white/10 rounded-2xl" />
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-5/6" />
                <div className="h-4 bg-white/5 rounded w-4/6" />

                <div className="mt-8 space-y-3">
                  <div className="h-12 bg-white/10 rounded-xl" />
                  <div className="h-12 bg-white/10 rounded-xl" />
                  <div className="h-12 bg-white/10 rounded-xl" />
                </div>
              </div>

              {/* Shimmer Effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                }}
              />
            </div>
          )}

          {/* Actual Content */}
          <div ref={contentRef} className="w-full h-full relative z-10 bg-background custom-scrollbar">
            <PreviewFrame html={html} id={id} theme={theme} isCapturing={isScreenshotMode} />
          </div>
        </div>

        {/* PRO Selection State UI */}
        <AnimatePresence>
          {isActive && !isScreenshotMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none z-30 screenshot-exclude"
            >
              {/* Indigo Selection Glow */}
              <div className="absolute inset-0 rounded-[42px] ring-[3px] ring-indigo-500/80 shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shimmer Animation Keyframes */}
      <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>

      {/* Custom Scrollbar Styles - COMPLETELY HIDDEN */}
      <style>{`
                .custom-scrollbar,
                .custom-scrollbar * {
                    scrollbar-width: none !important; /* Firefox */
                    -ms-overflow-style: none !important; /* IE and Edge */
                }

                .custom-scrollbar::-webkit-scrollbar,
                .custom-scrollbar *::-webkit-scrollbar {
                    display: none !important; /* Chrome, Safari, Opera */
                    width: 0 !important;
                    height: 0 !important;
                }

                .custom-scrollbar iframe {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }

                .custom-scrollbar iframe::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
            `}</style>
    </Rnd>
  );
};
