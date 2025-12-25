import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { designWizardStore, updateStep5Data } from '../../../lib/stores/designWizard';
import { Canvas, type FrameData } from './interactive/Canvas';

type InteractionState = 'idle' | 'generating' | 'preview';

export function Step5Interactive() {
    const wizardData = useStore(designWizardStore);
    const [status, setStatus] = useState<InteractionState>('idle');
    const [frames, setFrames] = useState<FrameData[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [customTheme, setCustomTheme] = useState<any>(null);
    const [pendingRegeneration, setPendingRegeneration] = useState(false);
    const snapshotRef = useRef<string>('');
    const latestSnapshotRef = useRef<string>('');
    const hasGeneratedRef = useRef(false);
    const framesRef = useRef<FrameData[]>([]);
    const storedStudioFrames = wizardData.step5?.studioFrames || [];
    const storedStudioSnapshot = wizardData.step5?.studioSnapshot || null;

    const getRightmostFrame = useCallback(() => {
        const currentFrames = framesRef.current;
        if (!currentFrames.length) {
            return { x: 2300, y: 2200 };
        }
        return currentFrames.reduce((rightmost, frame) => {
            if (!rightmost) return frame;
            const frameX = frame.x ?? 0;
            const rightX = rightmost.x ?? 0;
            return frameX > rightX ? frame : rightmost;
        }, currentFrames[0]);
    }, []);

    const FRAME_SPACING = 450;

    useEffect(() => {
        framesRef.current = frames;
    }, [frames]);

    const wizardSnapshot = useMemo(
        () =>
            JSON.stringify({
                step1: wizardData.step1,
                step2: wizardData.step2,
                step3: wizardData.step3,
                step4: wizardData.step4,
            }),
        [wizardData.step1, wizardData.step2, wizardData.step3, wizardData.step4]
    );

    const persistStudioFrames = useCallback((nextFrames: FrameData[]) => {
        updateStep5Data({
            studioFrames: nextFrames,
            studioSnapshot: wizardSnapshot,
        });
    }, [wizardSnapshot]);

    // Auto-restore Studio state from stored frames
    useEffect(() => {
        if (storedStudioFrames.length > 0 && frames.length === 0) {
            setFrames(storedStudioFrames);
            setStatus('preview');
            setIsFullscreen(true);
            hasGeneratedRef.current = true;
            snapshotRef.current = storedStudioSnapshot || wizardSnapshot;
            console.log('[Studio] Restored', storedStudioFrames.length, 'frames from stored session');
        }
    }, [storedStudioFrames, storedStudioSnapshot, frames.length, wizardSnapshot]);

    const handleInitialize = useCallback(async () => {
        setIsFullscreen(true);

        if (storedStudioFrames.length > 0 && storedStudioSnapshot === wizardSnapshot) {
            setFrames(storedStudioFrames);
            setStatus('preview');
            hasGeneratedRef.current = true;
            snapshotRef.current = storedStudioSnapshot || wizardSnapshot;
            return;
        }

        setStatus('generating');

        try {
            const selectedNav = wizardData.step4.navigation.navBarVariations.find(v => v.id === wizardData.step4.navigation.selectedVariationId);

            const branding = {
                appName: wizardData.step1.appName || 'My App',
                description: wizardData.step1.description,
                targetAudience: wizardData.step1.targetAudience,
                category: wizardData.step1.category,
                platform: wizardData.step1.platform,
                logo: wizardData.step3.logo?.url,
                footer: selectedNav?.url,
                primaryColor: wizardData.step3.colorPalette?.primary || '#4F46E5',
                backgroundColor: wizardData.step3.colorPalette?.background || '#FFFFFF',
                textColor: wizardData.step3.colorPalette?.text?.primary || '#111827',
                uiStyle: wizardData.step2.uiStyle,
                personality: wizardData.step2.personality,
                colorPalette: wizardData.step3.colorPalette,
                typography: wizardData.step2.typography,
                components: wizardData.step2.components
            };

            const screensToGenerate = wizardData.step4.screens.map(s => ({
                id: s.id,
                name: s.name,
                type: s.type,
                purpose: s.purpose,
                keyElements: s.keyElements
            }));

            // Only generate FIRST 3 SCREENS for approval
            const initialBatch = screensToGenerate.slice(0, 3);

            // If no screens defined in step 4, fallback to basic set
            const finalScreens = initialBatch.length > 0 ? initialBatch : [
                { id: 'screen-1', name: 'Welcome', type: 'splash', purpose: 'Introduce the app', keyElements: ['Logo', 'Get Started Button'] },
                { id: 'screen-2', name: 'Dashboard', type: 'home', purpose: 'Main overview', keyElements: ['Statistics', 'Recent Activity'] },
                { id: 'screen-3', name: 'Profile', type: 'profile', purpose: 'User settings', keyElements: ['Avatar', 'Logout'] }
            ];

            // Create placeholder frames immediately with empty HTML (triggers skeleton loaders)
            const placeholderFrames = finalScreens.map((s, index) => ({
                id: s.id,
                title: s.name,
                html: '', // Empty HTML triggers skeleton loader
                x: 2300 + (index * 450),
                y: 2200
            }));

            // Show placeholder frames immediately
            setFrames(placeholderFrames);

            const response = await fetch('/api/studio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branding, screens: finalScreens, includeTheme: true })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[App Forge] API Error:', response.status, errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Set custom theme if generated
            if (data.theme) {
                setCustomTheme(data.theme);
            }

            // Update frames with actual HTML content
            const generatedFrames = data.screens.map((s: any, index: number) => {
                const x = 2300 + (index * 450);
                const y = 2200;
                console.log(`[Initial Generation] Screen ${s.id} positioned at x:${x}, y:${y} (index:${index})`);
                return {
                    id: s.id,
                    title: s.title,
                    html: s.html,
                    x, // Arrange horizontally
                    y
                };
            });

            console.log('[Initial Generation] Generated frames:', generatedFrames.map(f => ({ id: f.id, x: f.x, y: f.y })));
            setFrames(generatedFrames);
            persistStudioFrames(generatedFrames);
            setStatus('preview');
            toast.success('Studio initialized with custom brand theme.');
            hasGeneratedRef.current = true;
            snapshotRef.current = latestSnapshotRef.current || wizardSnapshot;
        } catch (error: any) {
            console.error('[App Forge] Gen failed:', error);
            toast.error(error.message || 'Generation failed. Please check your API keys.');
            setStatus('idle');
            setIsFullscreen(false);
        }
    }, [wizardData.step1, wizardData.step2, wizardData.step3, wizardData.step4, wizardSnapshot, storedStudioFrames, storedStudioSnapshot, persistStudioFrames]);

    const handleGenerateRemaining = async () => {
        setStatus('generating');

        try {
            const selectedNav = wizardData.step4.navigation.navBarVariations.find(v => v.id === wizardData.step4.navigation.selectedVariationId);

            const branding = {
                appName: wizardData.step1.appName || 'My App',
                description: wizardData.step1.description,
                targetAudience: wizardData.step1.targetAudience,
                category: wizardData.step1.category,
                platform: wizardData.step1.platform,
                logo: wizardData.step3.logo?.url,
                footer: selectedNav?.url,
                primaryColor: wizardData.step3.colorPalette?.primary || '#4F46E5',
                backgroundColor: wizardData.step3.colorPalette?.background || '#FFFFFF',
                textColor: wizardData.step3.colorPalette?.text?.primary || '#111827',
                uiStyle: wizardData.step2.uiStyle,
                personality: wizardData.step2.personality,
                colorPalette: wizardData.step3.colorPalette,
                typography: wizardData.step2.typography,
                components: wizardData.step2.components
            };

            const screensToGenerate = wizardData.step4.screens.map(s => ({
                id: s.id,
                name: s.name,
                type: s.type,
                purpose: s.purpose,
                keyElements: s.keyElements
            }));

            // Get the screens we haven't generated yet (skip first 3)
            const remainingBatch = screensToGenerate.slice(3);

            if (remainingBatch.length === 0) {
                setStatus('preview');
                toast.info('All screens have already been generated!');
                return;
            }

            // Calculate starting position based on rightmost frame
            const rightmost = getRightmostFrame();
            const baseX = rightmost.x ?? 2300;
            const baseY = 2200; // Always use the initial Y position

            // Create placeholder frames immediately with empty HTML (triggers skeleton loaders)
            const placeholderFrames = remainingBatch.map((s, index) => ({
                id: s.id,
                title: s.name,
                html: '', // Empty HTML triggers skeleton loader
                x: baseX + FRAME_SPACING * (index + 1),
                y: baseY
            }));

            // Add placeholder frames alongside existing frames
            const placeholderCount = placeholderFrames.length;
            setFrames((prev) => [...prev, ...placeholderFrames]);

            const response = await fetch('/api/studio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branding, screens: remainingBatch })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[App Forge] Sync API Error:', response.status, errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Update frames with actual HTML content
            const newFrames = data.screens.map((s: any, index: number) => ({
                id: s.id,
                title: s.title,
                html: s.html,
                x: baseX + FRAME_SPACING * (index + 1),
                y: baseY
            }));

            // Replace placeholder frames with actual content
            // Keep the first N frames (existing), replace the rest with new frames
            setFrames((prev) => {
                const keep = prev.slice(0, Math.max(0, prev.length - placeholderCount));
                const updated = [...keep, ...newFrames];
                persistStudioFrames(updated);
                return updated;
            });
            setStatus('preview');
            toast.success(`Generated ${newFrames.length} additional screens!`);
        } catch (error: any) {
            console.error('[App Forge] Gen failed:', error);
            toast.error(error.message || 'Generation failed.');
            setStatus('preview');
        }
    };

    useEffect(() => {
        latestSnapshotRef.current = wizardSnapshot;
        if (!snapshotRef.current) {
            snapshotRef.current = wizardSnapshot;
            return;
        }
        if (wizardSnapshot !== snapshotRef.current && hasGeneratedRef.current) {
            setPendingRegeneration(true);
        }
    }, [wizardSnapshot]);

    useEffect(() => {
        if (pendingRegeneration && status !== 'generating') {
            setPendingRegeneration(false);
            toast.info('Detected updates in earlier steps. Regenerating Studio...');
            handleInitialize();
        }
    }, [pendingRegeneration, status, handleInitialize]);

    const handleGenerateNextScreen = async () => {
        setStatus('generating');
        let placeholderFrames: FrameData[] = [];

        try {
            const selectedNav = wizardData.step4.navigation.navBarVariations.find(v => v.id === wizardData.step4.navigation.selectedVariationId);

            const branding = {
                appName: wizardData.step1.appName || 'My App',
                description: wizardData.step1.description,
                targetAudience: wizardData.step1.targetAudience,
                category: wizardData.step1.category,
                platform: wizardData.step1.platform,
                logo: wizardData.step3.logo?.url,
                footer: selectedNav?.url,
                primaryColor: wizardData.step3.colorPalette?.primary || '#4F46E5',
                backgroundColor: wizardData.step3.colorPalette?.background || '#FFFFFF',
                textColor: wizardData.step3.colorPalette?.text?.primary || '#111827',
                uiStyle: wizardData.step2.uiStyle,
                personality: wizardData.step2.personality,
                colorPalette: wizardData.step3.colorPalette,
                typography: wizardData.step2.typography,
                components: wizardData.step2.components
            };

            const existingIds = new Set(framesRef.current.map(f => f.id));
            const remainingDefinedScreens = wizardData.step4.screens.filter(s => !existingIds.has(s.id));

            const batchSize = 3;
            let batch = remainingDefinedScreens.slice(0, batchSize).map((screen) => ({
                id: screen.id,
                name: screen.name,
                type: screen.type,
                purpose: screen.purpose,
                keyElements: screen.keyElements,
            }));

            if (batch.length === 0) {
                // Fallback to generic screens if all defined ones already generated
                const startIndex = framesRef.current.length + 1;
                batch = Array.from({ length: batchSize }, (_, i) => ({
                    id: `screen-${startIndex + i}`,
                    name: `Screen ${startIndex + i}`,
                    type: 'custom',
                    purpose: 'Additional screen',
                    keyElements: ['Content', 'Navigation'],
                }));
            }

            // If there's nothing to generate (shouldn't happen due to fallback), exit
            if (batch.length === 0) {
                toast.info('All screens are already generated.');
                setStatus('preview');
                return;
            }

            // Create placeholder frames immediately
            const rightmost = getRightmostFrame();
            const baseX = rightmost.x ?? 2300;
            const baseY = 2200; // Always use the initial Y position

            console.log('[Step5Interactive] Rightmost frame:', rightmost);
            console.log('[Step5Interactive] BaseX:', baseX, 'BaseY:', baseY);
            console.log('[Step5Interactive] Current frames:', framesRef.current.map(f => ({ id: f.id, x: f.x, y: f.y })));

            placeholderFrames = batch.map((screen, index) => {
                const x = baseX + FRAME_SPACING * (index + 1);
                const y = baseY;
                console.log(`[Step5Interactive] Creating frame ${screen.id} at x:${x}, y:${y} (index:${index})`);
                return {
                    id: screen.id,
                    title: screen.name,
                    html: '',
                    x,
                    y,
                };
            });

            setFrames((prev) => [...prev, ...placeholderFrames]);

            const response = await fetch('/api/studio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branding, screens: batch })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[App Forge] API Error:', response.status, errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Update placeholders with actual HTML
            const generatedFrames = data.screens.map((s: any, index: number) => ({
                id: s.id,
                title: s.title,
                html: s.html,
                x: placeholderFrames[index]?.x ?? (baseX + FRAME_SPACING * (index + 1)),
                y: placeholderFrames[index]?.y ?? baseY,
            }));

            setFrames((prev) => {
                // Remove placeholder frames and add generated frames
                const placeholderIds = new Set(placeholderFrames.map(f => f.id));
                const withoutPlaceholders = prev.filter(frame => !placeholderIds.has(frame.id));
                const updated = [...withoutPlaceholders, ...generatedFrames];
                persistStudioFrames(updated);
                return updated;
            });
            setStatus('preview');
            toast.success(`Generated ${generatedFrames.length} screen${generatedFrames.length === 1 ? '' : 's'}!`);
        } catch (error: any) {
            console.error('[App Forge] Gen failed:', error);
            toast.error(error.message || 'Generation failed.');
            setStatus('preview');
            if (placeholderFrames.length) {
                const placeholderIds = new Set(placeholderFrames.map((frame) => frame.id));
                setFrames((prev) => {
                    const updated = prev.filter((frame) => !placeholderIds.has(frame.id));
                    persistStudioFrames(updated);
                    return updated;
                });
            }
        }
    };

    const content = (
        <div className={`
            ${isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen rounded-none border-0' : 'flex h-[500px] w-[900px] rounded-[40px] border border-white/5 mx-auto'} 
            flex flex-col bg-[#000] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-700 ease-in-out
        `}>

            {/* Global Header (Premium Dubs Style) */}
            <AnimatePresence>
                {(isFullscreen || status !== 'idle') && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center justify-between px-8 py-5 bg-transparent select-none z-[1001] screenshot-exclude"
                    >
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => {
                                    setIsFullscreen(false);
                                    setStatus('idle');
                                }}
                                className="size-9 flex items-center justify-center text-white/70 bg-white/[0.06] hover:bg-white/[0.12] rounded-xl transition-all active:scale-95"
                            >
                                <div className="i-ph:arrow-left-bold text-lg" />
                            </button>

                            <div className="flex items-center gap-4">
                                <h2 className="text-base font-black text-white/95 tracking-[-0.01em]">{wizardData.step1.appName || 'Untitled App'}</h2>
                                <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-white/[0.04] backdrop-blur-xl rounded-full border border-white/[0.08]">
                                    <div className="relative size-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]">
                                        <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-75" />
                                    </div>
                                    <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-[0.12em]">Editing</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => toast.success('✨ Workspace Saved')}
                                className="group relative px-8 py-2.5 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-[14px] text-[11px] font-black uppercase tracking-[0.1em] transition-all shadow-[0_4px_16px_rgba(79,70,229,0.4)] active:scale-95 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative">Save</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden bg-[#000]">
                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center"
                        >
                            {/* Card-style UI */}
                            <div className="relative w-full h-full flex items-center justify-center p-12 group">
                                {/* High-Fidelity Animated Gradient Background */}
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0a0a1a] to-black z-10" />
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

                                    {/* Radial Pulsars */}
                                    <div className="absolute top-1/4 left-1/4 size-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" />
                                    <div className="absolute bottom-1/4 right-1/4 size-96 bg-emerald-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

                                    <div className="absolute inset-0 opacity-20 bg-[url('/assets/noise.svg')] brightness-50 contrast-150" />
                                </div>

                                <div className="relative z-20 flex flex-col items-center text-center max-w-md">
                                    <div className="relative size-24 rounded-[32px] bg-gradient-to-br from-[#1A1A1D] to-[#0D0D10] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center mb-8 shadow-[0_24px_48px_rgba(0,0,0,0.8)] overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="i-ph:magic-wand-fill text-5xl text-indigo-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                                    </div>

                                    <h3 className="text-[28px] font-black text-white mb-3 tracking-[-0.02em] leading-tight">
                                        Interactive Design Studio
                                    </h3>
                                    <p className="text-indigo-200/70 text-[13px] leading-relaxed mb-10 font-medium max-w-sm">
                                        Launch our immersive design engine to iterate on your app's flow and visual branding in an infinite workspace.
                                    </p>

                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={handleInitialize}
                                            className="group relative flex items-center gap-3 px-10 py-4 bg-gradient-to-b from-white to-white/95 text-black rounded-[16px] font-black text-[11px] uppercase tracking-[0.12em] transition-all hover:shadow-[0_20px_60px_rgba(255,255,255,0.25)] shadow-[0_12px_40px_rgba(0,0,0,0.8)] active:scale-[0.98] overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="i-ph:rocket-launch-fill text-indigo-600 text-base group-hover:scale-110 transition-transform" />
                                            <span className="relative">Launch Studio</span>
                                            <div className="i-ph:arrow-right-bold group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        {storedStudioFrames.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    updateStep5Data({ studioFrames: [], studioSnapshot: null });
                                                    setFrames([]);
                                                    hasGeneratedRef.current = false;
                                                    snapshotRef.current = '';
                                                    toast.info('Studio cache cleared');
                                                }}
                                                className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
                                            >
                                                Clear Cache & Start Fresh
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Always show canvas - frames will have individual skeleton loaders */}
                    {(status === 'preview' || status === 'generating') && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 w-full h-full"
                        >
                            <Canvas
                                frames={frames}
                                isGenerating={status === 'generating'}
                                customTheme={customTheme}
                                onGenerateNext={handleGenerateNextScreen}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    if (isFullscreen && typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }

    return (
        <div className="flex items-center justify-center py-8">
            {content}
        </div>
    );
}
