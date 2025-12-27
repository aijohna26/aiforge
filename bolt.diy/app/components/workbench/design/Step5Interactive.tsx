import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { designWizardStore, updateStep5Data, setStudioActive } from '../../../lib/stores/designWizard';
import { Canvas, type FrameData } from './interactive/Canvas';
import { useScreenGenerationPolling } from '~/lib/hooks/useJobPolling';
import { JobProgressBar } from '~/components/inngest/JobProgressBar';
import { FEATURE_FLAGS } from '~/lib/feature-flags';
import { hashStringSync } from '~/utils/hash';

type InteractionState = 'idle' | 'generating' | 'preview';

export function Step5Interactive() {
    const DEVICE_WIDTH = 375; // Device frame width in pixels
    const FRAME_SPACING = 500; // Gap between frames (reduced from 1000)
    const CANVAS_CENTER_X = 4000;
    const CANVAS_CENTER_Y = 4000;
    const wizardData = useStore(designWizardStore);
    const [status, setStatus] = useState<InteractionState>('idle');
    const [frames, setFrames] = useState<FrameData[]>([]);

    const handleRegenerateTheme = useCallback(async () => {
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

            const response = await fetch('/api/studio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branding, screens: [], includeTheme: true, userId: 'user-placeholder' })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.mode === 'async') {
                setJobId(data.jobId);
                toast.info('Regenerating theme in background...');
            } else if (data.theme) {
                setCustomTheme(data.theme);
                toast.success('Design System regenerated successfully!');
            }
        } catch (error) {
            console.error('[Studio] Theme regeneration failed:', error);
            toast.error('Failed to regenerate theme');
        } finally {
            setStatus('preview');
        }
    }, [wizardData]);

    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        setStudioActive(isFullscreen);
    }, [isFullscreen]);
    const [customTheme, setCustomTheme] = useState<any>(wizardData.step5?.customTheme || null);
    const [pendingRegeneration, setPendingRegeneration] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const snapshotRef = useRef<string>('');
    const latestSnapshotRef = useRef<string>('');
    const hasGeneratedRef = useRef(false);
    const framesRef = useRef<FrameData[]>([]);
    const storedStudioFrames = wizardData.step5?.studioFrames || [];
    const storedStudioSnapshot = wizardData.step5?.studioSnapshot || null;

    // Poll for job completion when using Inngest
    useScreenGenerationPolling(jobId, (result) => {
        console.log('[Inngest] Polling callback received:', {
            hasScreens: !!result?.screens,
            screensCount: result?.screens?.length
        });

        if (result?.screens) {
            console.log('[Inngest] Job completed, merging results...');

            setFrames((prev) => {
                const updatedFrames = [...prev];
                console.log('[Inngest] Current frames before update:', prev.map(f => ({ id: f.id, hasHtml: !!f.html })));

                result.screens.forEach((screen: any, index: number) => {
                    let existingIndex = updatedFrames.findIndex(f => f.id === screen.id);

                    // Fallback: If ID mismatch but index aligns with a placeholder, Assume it's the correct one
                    // This handles cases where LLM might slightly alter the ID or if we used a generated ID
                    if (existingIndex === -1 && index < updatedFrames.length && !updatedFrames[index].html) {
                        console.warn(`[Inngest] ID mismatch for screen index ${index}. Expected ${updatedFrames[index].id}, got ${screen.id}. Updating by index.`);
                        existingIndex = index;
                    }

                    if (existingIndex >= 0) {
                        // Update placeholder with actual content
                        console.log(`[Inngest] Updating frame ${updatedFrames[existingIndex].id} with content (length: ${screen.html?.length})`);
                        updatedFrames[existingIndex] = {
                            ...updatedFrames[existingIndex],
                            id: screen.id, // Update ID in case we matched by index
                            html: screen.html,
                            title: screen.title || updatedFrames[existingIndex].title
                        };
                    } else {
                        // Fallback position if for some reason placeholder wasn't there
                        console.log(`[Inngest] Appending new frame ${screen.id}`);
                        const x = CANVAS_CENTER_X + (prev.length + index) * FRAME_SPACING;
                        updatedFrames.push({
                            id: screen.id,
                            title: screen.title,
                            html: screen.html,
                            x,
                            y: CANVAS_CENTER_Y
                        });
                    }
                });

                persistStudioFrames(updatedFrames);
                return updatedFrames;
            });

            setStatus('preview');
            setJobId(null);

            if (result.theme) {
                setCustomTheme(result.theme);
            }
        }
    });

    const getRightmostFrame = useCallback(() => {
        const currentFrames = framesRef.current;
        if (!currentFrames.length) {
            return { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y };
        }
        return currentFrames.reduce((rightmost, frame) => {
            if (!rightmost) return frame;
            const frameX = frame.x ?? 0;
            const rightX = rightmost.x ?? 0;
            return frameX > rightX ? frame : rightmost;
        }, currentFrames[0]);
    }, []);



    useEffect(() => {
        framesRef.current = frames;
    }, [frames]);

    const wizardSnapshot = useMemo(
        () =>
            hashStringSync(JSON.stringify({
                step1: wizardData.step1,
                step2: wizardData.step2,
                step3: wizardData.step3,
                step4: wizardData.step4,
            })),
        [wizardData.step1, wizardData.step2, wizardData.step3, wizardData.step4]
    );

    const persistStudioFrames = useCallback((nextFrames: FrameData[], nextTheme?: any) => {
        updateStep5Data({
            studioFrames: nextFrames,
            studioSnapshot: wizardSnapshot,
            ...(nextTheme ? { customTheme: nextTheme } : {}),
        });
    }, [wizardSnapshot]);

    // Auto-persist theme changes
    useEffect(() => {
        if (customTheme && customTheme !== wizardData.step5?.customTheme) {
            updateStep5Data({ customTheme });
        }
    }, [customTheme, wizardData.step5?.customTheme]);

    // Auto-restore Studio state from stored frames
    useEffect(() => {
        if (storedStudioFrames.length > 0 && frames.length === 0) {
            setFrames(storedStudioFrames);
            if (wizardData.step5?.customTheme) setCustomTheme(wizardData.step5.customTheme);
            setStatus('preview');
            setIsFullscreen(true);
            hasGeneratedRef.current = true;
            snapshotRef.current = storedStudioSnapshot || wizardSnapshot;
            console.log('[Studio] Restored', storedStudioFrames.length, 'frames from stored session');
        }
    }, [storedStudioFrames, frames.length, storedStudioSnapshot, wizardSnapshot, wizardData.step5?.customTheme]);

    const [isSaving, setIsSaving] = useState(false);
    const isSavingRef = useRef(false); // Added for immediate lock
    const [isCheckingDb, setIsCheckingDb] = useState(false);

    // Track last saved state to detect changes
    const [lastSavedStateHash, setLastSavedStateHash] = useState<string>('');

    // Compute current state hash for change detection
    const currentStateHash = useMemo(() => {
        return hashStringSync(JSON.stringify({
            frames,
            theme: customTheme,
        }));
    }, [frames, customTheme]);

    // Determine if there are unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        if (frames.length === 0) return false;
        if (!lastSavedStateHash) return true; // Never saved
        return currentStateHash !== lastSavedStateHash;
    }, [currentStateHash, lastSavedStateHash, frames.length]);

    const handleSave = useCallback(async () => {
        // Use ref for immediate lock to prevent rapid-click duplicates
        if (frames.length === 0 || isSavingRef.current) return;

        isSavingRef.current = true;
        setIsSaving(true);

        const t = toast.loading('💾 Saving workspace to cloud...');

        // Safety timeout: if request takes > 15s, dismiss the loader
        const safetyTimeout = setTimeout(() => {
            toast.dismiss(t);
            isSavingRef.current = false;
            setIsSaving(false);
        }, 15000);

        try {
            const hash = await import('~/utils/hash').then(m => m.hashString(wizardSnapshot));

            const response = await fetch('/api/studio/workspace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    snapshotHash: hash,
                    frames,
                    theme: customTheme,
                    projectId: wizardData.projectId || 'default'
                })
            });

            const data = await response.json();
            clearTimeout(safetyTimeout); // Clear timeout on successful response

            if (!response.ok) {
                if (data.sql) {
                    toast.update(t, {
                        render: (
                            <div className="flex flex-col gap-2">
                                <p className="font-bold">{data.error}</p>
                                <code className="block p-2 bg-black/50 rounded text-[10px] break-all select-all font-mono">
                                    {data.sql}
                                </code>
                                <p className="text-[10px] text-white/50 italic">Copy and run this in your Supabase SQL Editor</p>
                            </div>
                        ),
                        type: 'error',
                        isLoading: false,
                        autoClose: 10000 // Ensure autoClose is always applied
                    });
                    console.log('%c[Supabase SQL Fix]', 'color: #818cf8; font-weight: bold;', '\n' + data.sql);
                } else {
                    throw new Error(data.error || 'Failed to save to database');
                }
                return;
            }

            // Update last saved state hash on successful save
            setLastSavedStateHash(currentStateHash);

            toast.update(t, {
                render: '✨ Workspace persisted to database',
                type: 'success',
                isLoading: false,
                autoClose: 3000 // Ensure autoClose is always applied
            });
        } catch (error: any) {
            console.error('[Studio Save] Failed:', error);
            clearTimeout(safetyTimeout); // Clear timeout on error
            toast.update(t, {
                render: error.message || 'Failed to save to database',
                type: 'error',
                isLoading: false,
                autoClose: 4000 // Ensure autoClose is always applied
            });
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    }, [frames, customTheme, wizardSnapshot, wizardData.projectId, currentStateHash]); // Removed `isSaving` from dependencies

    const handleInitialize = useCallback(async () => {
        setIsFullscreen(true);

        // 1. Check if we already have it in store (local memory)
        if (storedStudioFrames.length > 0 && storedStudioSnapshot === wizardSnapshot) {
            setFrames(storedStudioFrames);
            setStatus('preview');
            setIsFullscreen(true);
            setStudioActive(true);
            hasGeneratedRef.current = true;
            snapshotRef.current = storedStudioSnapshot || wizardSnapshot;
            return;
        }

        // 2. Check Database for existing design with this snapshot hash
        setIsCheckingDb(true);
        try {
            const hash = await import('~/utils/hash').then(m => m.hashString(wizardSnapshot));
            const dbResponse = await fetch(`/api/studio/workspace?hash=${hash}&projectId=${wizardData.projectId || 'default'}`);

            const data = await dbResponse.json();

            if (dbResponse.ok && data.workspace) {
                console.log('[Studio] Found existing design in database');
                setFrames(data.workspace.frames);
                if (data.workspace.theme) setCustomTheme(data.workspace.theme);
                persistStudioFrames(data.workspace.frames);
                setStatus('preview');
                hasGeneratedRef.current = true;
                snapshotRef.current = wizardSnapshot;
                setIsCheckingDb(false);
                return;
            } else if (!dbResponse.ok && data.errorCode === 'TABLE_MISSING') {
                console.warn('[Studio] studio_workspaces table missing. Please run migration.');
                // We don't show toast here during initialize to avoid noise,
                // but we might show it if user tries to Save.
            }
        } catch (error) {
            console.warn('[Studio] DB lookup failed, falling back to generation:', error);
        } finally {
            setIsCheckingDb(false);
        }

        // 3. If no existing design, proceed with LLM generation
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
                keyElements: s.keyElements,
                showLogo: s.showLogo,
                showBottomNav: s.showBottomNav
            }));

            // Only generate FIRST 3 SCREENS for approval
            const initialBatch = screensToGenerate.slice(0, 3);

            // If no screens defined in step 4, fallback to basic set
            const finalScreens = initialBatch.length > 0 ? initialBatch : [
                { id: 'screen-1', name: 'Welcome', type: 'splash', purpose: 'Introduce the app', keyElements: ['Logo', 'Get Started Button'] },
                { id: 'screen-2', name: 'Dashboard', type: 'home', purpose: 'Main overview', keyElements: ['Statistics', 'Recent Activity'] },
                { id: 'screen-3', name: 'Profile', type: 'profile', purpose: 'User settings', keyElements: ['Avatar', 'Logout'] }
            ];

            // Calculate starting X to center the entire group of screens
            // Account for device width + spacing between frames
            const groupWidth = (finalScreens.length - 1) * (DEVICE_WIDTH + FRAME_SPACING) + DEVICE_WIDTH;
            const startX = CANVAS_CENTER_X - (groupWidth / 2);

            // Create placeholder frames immediately with empty HTML (triggers skeleton loaders)
            const placeholderFrames = finalScreens.map((s, index) => ({
                id: s.id,
                title: s.name,
                html: '', // Empty HTML triggers skeleton loader
                x: startX + (index * (DEVICE_WIDTH + FRAME_SPACING)),
                y: CANVAS_CENTER_Y
            }));

            // Show placeholder frames immediately
            setFrames(placeholderFrames);

            const response = await fetch('/api/studio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branding,
                    screens: finalScreens,
                    includeTheme: true,
                    userId: 'user-placeholder' // TODO: Get from auth context
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[App Forge] API Error:', response.status, errorData);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle dual mode response (async with Inngest or sync)
            if (data.mode === 'async') {
                // Inngest mode: Start polling for job completion
                console.log('[Studio] Background generation started:', data.jobId);
                setJobId(data.jobId);
                toast.info('Generating screens in background...');
                hasGeneratedRef.current = true;
                snapshotRef.current = latestSnapshotRef.current || wizardSnapshot;
            } else {
                // Backward compatible sync mode
                if (data.theme) {
                    setCustomTheme(data.theme);
                }

                // Update frames with actual HTML content
                const screensCount = data.screens?.length || initialBatch.length || 1;
                const groupWidth = (screensCount - 1) * (DEVICE_WIDTH + FRAME_SPACING) + DEVICE_WIDTH;
                const startX = CANVAS_CENTER_X - (groupWidth / 2);

                const generatedFrames = data.screens.map((s: any, index: number) => {
                    const x = startX + (index * (DEVICE_WIDTH + FRAME_SPACING));
                    const y = CANVAS_CENTER_Y;
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
            }
        } catch (error: any) {
            console.error('[App Forge] Gen failed:', error);
            toast.error(error.message || 'Generation failed. Please check your API keys.');
            setStatus('idle');
            setIsFullscreen(false);
        }
    }, [wizardData.step1, wizardData.step2, wizardData.step3, wizardData.step4, wizardData.projectId, wizardSnapshot, storedStudioFrames, storedStudioSnapshot, persistStudioFrames]);

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
                keyElements: s.keyElements,
                showLogo: s.showLogo,
                showBottomNav: s.showBottomNav
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
            const baseX = rightmost.x ?? CANVAS_CENTER_X;
            const baseY = CANVAS_CENTER_Y; // Always use the initial Y position

            // Create placeholder frames immediately with empty HTML (triggers skeleton loaders)
            const placeholderFrames = remainingBatch.map((s, index) => ({
                id: s.id,
                title: s.name,
                html: '', // Empty HTML triggers skeleton loader
                x: baseX + DEVICE_WIDTH + FRAME_SPACING + ((DEVICE_WIDTH + FRAME_SPACING) * index),
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
                x: baseX + DEVICE_WIDTH + FRAME_SPACING + ((DEVICE_WIDTH + FRAME_SPACING) * index),
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
        if (pendingRegeneration && status !== 'generating' && wizardData.currentStep === 5) {
            setPendingRegeneration(false);
            toast.info('Detected updates in earlier steps. Regenerating Studio...');
            handleInitialize();
        }
    }, [pendingRegeneration, status, handleInitialize, wizardData.currentStep]);

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
                showLogo: screen.showLogo,
                showBottomNav: screen.showBottomNav,
            }));

            if (batch.length === 0) {
                // Fallback to generic screens if all defined ones already generated
                const startIndex = framesRef.current.length + 1;
                batch = Array.from({ length: batchSize }, (_, i) => ({
                    id: `screen-${framesRef.current.length + i + 1}`,
                    name: `Additional Screen ${i + 1}`,
                    type: 'custom',
                    purpose: 'Continuing the app flow',
                    keyElements: ['Navigation', 'Content'],
                    showLogo: false,
                    showBottomNav: true
                })) as Step4Data['screens'];
            }

            // If there's nothing to generate (shouldn't happen due to fallback), exit
            if (batch.length === 0) {
                toast.info('All screens are already generated.');
                setStatus('preview');
                return;
            }

            // Create placeholder frames immediately
            const rightmost = getRightmostFrame();
            const baseX = rightmost.x ?? CANVAS_CENTER_X;
            const baseY = CANVAS_CENTER_Y; // Always use the initial Y position

            console.log('[Step5Interactive] Rightmost frame:', rightmost);
            console.log('[Step5Interactive] BaseX:', baseX, 'BaseY:', baseY);
            console.log('[Step5Interactive] Current frames:', framesRef.current.map(f => ({ id: f.id, x: f.x, y: f.y })));

            placeholderFrames = batch.map((screen, index) => {
                const x = baseX + DEVICE_WIDTH + FRAME_SPACING + ((DEVICE_WIDTH + FRAME_SPACING) * index);
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

            if (data.mode === 'async') {
                // Inngest mode: Start polling for job completion
                console.log('[Studio] Background generation started (batch):', data.jobId);
                setJobId(data.jobId);
                toast.info('Generating additional screens in background...');
                hasGeneratedRef.current = true;
                // Note: We don't set status to 'preview' here because we want to stay in 'generating' 
                // while the background job works. The polling callback will handle the transition.
            } else {
                // Update placeholders with actual HTML (Sync mode)
                const generatedFrames = data.screens.map((s: any, index: number) => ({
                    id: s.id,
                    title: s.title,
                    html: s.html,
                    x: placeholderFrames[index]?.x ?? (baseX + DEVICE_WIDTH + FRAME_SPACING + ((DEVICE_WIDTH + FRAME_SPACING) * index)),
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
            }
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


    const handleCleanupLayout = useCallback(() => {
        if (!frames.length) return;

        const groupWidth = (frames.length - 1) * (DEVICE_WIDTH + FRAME_SPACING) + DEVICE_WIDTH;
        const startX = CANVAS_CENTER_X - (groupWidth / 2);

        const cleaned = frames.map((f, i) => ({
            ...f,
            x: startX + (i * (DEVICE_WIDTH + FRAME_SPACING)),
            y: CANVAS_CENTER_Y
        }));

        setFrames(cleaned);
        persistStudioFrames(cleaned);
        toast.success('✨ Workspace layout optimized and centered');
    }, [frames, DEVICE_WIDTH, FRAME_SPACING, CANVAS_CENTER_X, CANVAS_CENTER_Y, persistStudioFrames]);

    const handleDuplicateFrame = useCallback((frameId: string) => {
        setFrames((prev) => {
            const target = prev.find((frame) => frame.id === frameId);
            if (!target) {
                toast.error('Unable to duplicate screen');
                return prev;
            }

            const baseX = target.x ?? CANVAS_CENTER_X;
            const baseY = target.y ?? CANVAS_CENTER_Y;
            let nextX = baseX + FRAME_SPACING;

            const isOccupied = (x: number) => prev.some((frame) => Math.abs((frame.x ?? 0) - x) < 10 && (frame.y ?? 0) === baseY);
            while (isOccupied(nextX)) {
                nextX += FRAME_SPACING;
            }

            const newFrame: FrameData = {
                ...target,
                id: `${target.id}-copy-${Date.now()}`,
                title: `${target.title || target.id} Copy`,
                x: nextX,
                y: baseY,
            };

            const updated = [...prev, newFrame];
            persistStudioFrames(updated);
            toast.success('Screen duplicated');
            return updated;
        });
    }, [CANVAS_CENTER_X, CANVAS_CENTER_Y, FRAME_SPACING, persistStudioFrames]);

    const handleNewFrameFromChat = useCallback((newFrame: FrameData) => {
        console.log('[Studio Chat] Adding new frame from chatbox:', newFrame.title);
        setFrames((prev) => {
            const updated = [...prev, newFrame];
            persistStudioFrames(updated);
            return updated;
        });
        toast.success(`✨ ${newFrame.title || 'New screen'} added to canvas!`);
    }, [persistStudioFrames]);

    // Build branding object for chatbox
    const branding = useMemo(() => {
        const selectedNav = wizardData.step4.navigation.navBarVariations.find(v => v.id === wizardData.step4.navigation.selectedVariationId);
        return {
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
    }, [wizardData]);

    const content = (
        <div className={`
            ${isFullscreen ? 'fixed inset-0 z-[9980] w-screen h-screen rounded-none border-0' : 'flex h-[500px] w-[900px] rounded-[40px] border border-white/5 mx-auto'} 
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
                                    setStudioActive(false);
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
                                onClick={handleSave}
                                disabled={isSaving || !hasUnsavedChanges}
                                className={`group relative px-8 py-2.5 rounded-[14px] text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 overflow-hidden ${
                                    isSaving
                                        ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-[0_4px_16px_rgba(79,70,229,0.4)]'
                                        : hasUnsavedChanges
                                            ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-[0_4px_16px_rgba(79,70,229,0.4)]'
                                            : 'bg-white/[0.06] border border-white/[0.08] text-white/40 cursor-default hover:bg-white/[0.06]'
                                }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 transition-opacity ${hasUnsavedChanges && !isSaving ? 'group-hover:opacity-100' : ''}`} />
                                <span className="relative flex items-center gap-2">
                                    {isSaving ? (
                                        <>
                                            <div className="size-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : hasUnsavedChanges ? (
                                        <>
                                            <div className="size-1.5 bg-white rounded-full animate-pulse" />
                                            Save
                                        </>
                                    ) : (
                                        <>
                                            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Saved
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DB Lookup Loader */}
            <AnimatePresence>
                {isCheckingDb && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[1002] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center"
                    >
                        <div className="relative size-20 mb-6">
                            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 tracking-tight">Checking Database</h3>
                        <p className="text-white/40 text-sm font-medium">Looking for previously generated designs...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Indicator (when using Inngest) */}
            <AnimatePresence>
                {status === 'generating' && jobId && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-50 w-96 bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.8)]"
                    >
                        <h3 className="text-sm font-bold text-white mb-3">Generating Screens</h3>
                        <JobProgressBar
                            jobId={jobId}
                            showDetails={true}
                        />
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
                                        {storedStudioFrames.length > 0 || wizardData.step5?.customTheme ? 'Continue Designing' : 'Interactive Design Studio'}
                                    </h3>
                                    <p className="text-indigo-200/70 text-[13px] leading-relaxed mb-10 font-medium max-w-sm">
                                        {storedStudioFrames.length > 0 || wizardData.step5?.customTheme
                                            ? "Pick up where you left off. Your custom design system and screen architecture are ready for further refinement."
                                            : "Launch our immersive design engine to iterate on your app's flow and visual branding in an infinite workspace."}
                                    </p>

                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={handleInitialize}
                                            className="group relative flex items-center gap-3 px-10 py-4 bg-gradient-to-b from-white to-white/95 text-black rounded-[16px] font-black text-[11px] uppercase tracking-[0.12em] transition-all hover:shadow-[0_20px_60px_rgba(255,255,255,0.25)] shadow-[0_12px_40px_rgba(0,0,0,0.8)] active:scale-[0.98] overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="i-ph:rocket-launch-fill text-indigo-600 text-base group-hover:scale-110 transition-transform" />
                                            <span className="relative">
                                                {storedStudioFrames.length > 0 || wizardData.step5?.customTheme ? 'Resume Studio' : 'Launch Studio'}
                                            </span>
                                            <div className="i-ph:arrow-right-bold group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        {(storedStudioFrames.length > 0 || wizardData.step5?.customTheme) && (
                                            <button
                                                onClick={() => {
                                                    updateStep5Data({ studioFrames: [], studioSnapshot: null, customTheme: null });
                                                    setFrames([]);
                                                    setCustomTheme(null);
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
                                branding={branding}
                                userId="user-placeholder"
                                onGenerateNext={handleGenerateNextScreen}
                                onRegenerateTheme={handleRegenerateTheme}
                                onCleanupLayout={handleCleanupLayout}
                                onDuplicateFrame={handleDuplicateFrame}
                                onNewFrame={handleNewFrameFromChat}
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
