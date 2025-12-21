import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@nanostores/react';
import { toast } from 'sonner';
import { designWizardStore, updateStep4Data, setIsProcessing } from '~/lib/stores/designWizard';
import type { Step4Data } from '~/lib/stores/designWizard';
import { ImageEditor } from './ImageEditor';
import { migrateImageToSupabase } from './utils/migrateImages';

const SCREEN_TYPES = [
    { id: 'splash', name: 'Splash', icon: 'i-ph:star', description: 'App launch screen' },
    { id: 'signin', name: 'Sign In', icon: 'i-ph:sign-in', description: 'User login' },
    { id: 'signup', name: 'Sign Up', icon: 'i-ph:user-plus', description: 'User registration' },
    { id: 'home', name: 'Home', icon: 'i-ph:house', description: 'Main dashboard' },
    { id: 'profile', name: 'Profile', icon: 'i-ph:user-circle', description: 'User profile' },
    { id: 'settings', name: 'Settings', icon: 'i-ph:gear', description: 'App settings' },
    { id: 'scanner', name: 'Scan', icon: 'i-ph:scan', description: 'Camera scanning experience' },
    { id: 'onboarding', name: 'Onboarding', icon: 'i-ph:book-open', description: 'Intro or tutorial flow' },
    { id: 'custom', name: 'Custom', icon: 'i-ph:plus-circle', description: 'Custom functionality' },
] as const;

const NAV_MAX_ITEMS = 4;

const GEMINI_MODELS = [
    { value: 'nano-banana', label: 'Gemini Nano Banana Standard' },
    { value: 'nano-banana-pro', label: 'Gemini Nano Banana Pro' },
    { value: 'gpt-image-1', label: 'GPT Image 1' },
];

const EDIT_MODELS = [
    { value: 'nano-banana-edit', label: 'Nano Banana Edit', provider: 'gemini' },
    { value: 'seedream-4.5-edit', label: 'Seedream 4.5 Edit', provider: 'seedream-4.5-edit' },
    { value: 'qwen-image-edit', label: 'Qwen Image Edit', provider: 'qwen-image-edit' },
    { value: 'gpt-image-1-edit', label: 'GPT Image 1 Edit', provider: 'gpt-image-1' },
];

const getSafeImageUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/api/image-proxy')) {
        return url;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
};

const persistRemoteImage = async (url: string) => {
    if (!url) return url;
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/api/image-proxy')) return url;
    if (url.includes('supabase.co')) return url;

    try {
        // Use proxy to avoid CORS when fetching for persistence if needed, 
        // but since this is client-side, we try relative proxy first
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Failed to fetch remote image');

        const blob = await response.blob();
        const formData = new FormData();
        formData.append('image', blob, 'image.png');

        const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) throw new Error('Failed to upload image');

        const data = await uploadResponse.json();
        if (data.success && data.url) {
            console.log('[ScreenFlowFrame] Image persisted to Supabase:', data.url);
            return data.url;
        }
        return url;
    } catch (e) {
        console.warn('[ScreenFlowFrame] Persistence failed, using original URL:', e);
        return url;
    }
};

const getOriginalUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('/api/image-proxy?url=')) {
        try {
            const parsed = new URL(
                url,
                typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
            );
            return parsed.searchParams.get('url');
        } catch {
            return url;
        }
    }
    return url;
};

const getAspectRatioClass = (ratio: string) => {
    const ratioMap: Record<string, string> = {
        '1:1': 'aspect-square',
        '3:4': 'aspect-[3/4]',
        '4:3': 'aspect-[4/3]',
        '2:3': 'aspect-[2/3]',
        '3:2': 'aspect-[3/2]',
        '9:16': 'aspect-[9/16]',
        '16:9': 'aspect-[16/9]',
    };
    return ratioMap[ratio] || 'aspect-[16/9]';
};

export function ScreenFlowFrame() {
    const wizardData = useStore(designWizardStore);
    const { screens, initialScreen, authRequired, navigation } = wizardData.step4;
    const { step1, step2, step3 } = wizardData;

    // Auto-add splash screen for Expo apps
    useEffect(() => {
        if (screens.length === 0) {
            const splashScreen: Step4Data['screens'][0] = {
                id: 'screen-splash-default',
                name: 'Splash Screen',
                type: 'splash',
                purpose: 'App launch animation and branding',
                keyElements: [],
                position: { x: 0, y: 0 },
            };

            updateStep4Data({
                screens: [splashScreen],
                initialScreen: splashScreen.id,
            });
        }
    }, []); // Only run once on mount

    useEffect(() => {
        if (!navigation?.items?.length) return;
        const availableIds = new Set(screens.map((screen) => screen.id));
        const filteredNav = navigation.items.filter((id) => availableIds.has(id));
        if (filteredNav.length !== navigation.items.length) {
            updateStep4Data({
                navigation: {
                    ...navigation,
                    items: filteredNav,
                    confirmed: false,
                },
            });
        }
    }, [screens, navigation]);

    const [isAddingScreen, setIsAddingScreen] = useState(false);
    const [newScreenName, setNewScreenName] = useState('');
    const [newScreenType, setNewScreenType] = useState<Step4Data['screens'][0]['type']>('custom');
    const [newScreenPurpose, setNewScreenPurpose] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [navError, setNavError] = useState<string | null>(null);
    const [isGeneratingNav, setIsGeneratingNav] = useState(false);
    const [selectedModel, setSelectedModel] = useState('nano-banana');
    const [navVariationCount, setNavVariationCount] = useState(2);
    const [navAspectRatio, setNavAspectRatio] = useState('16:9');
    const [viewingNavVariation, setViewingNavVariation] = useState<string | null>(null);
    const [isEditingNav, setIsEditingNav] = useState(false);
    const [editNavPrompt, setEditNavPrompt] = useState('');
    const [editNavModel, setEditNavModel] = useState('nano-banana-edit');
    const [navToEdit, setNavToEdit] = useState<string | null>(null);
    const [navToEditOriginal, setNavToEditOriginal] = useState<string | null>(null);
    const [navPendingDelete, setNavPendingDelete] = useState<string | null>(null);
    const [isManualEditingNav, setIsManualEditingNav] = useState(false);
    const [navToManualEdit, setNavToManualEdit] = useState<string | null>(null);
    const [navToManualEditId, setNavToManualEditId] = useState<string | null>(null);
    const [isMigratingImages, setIsMigratingImages] = useState(false);

    const navItems = navigation?.items || [];
    const navConfirmed = navigation?.confirmed || false;
    const navType = navigation?.type || 'bottom';
    const generatedNavBar = navigation?.generatedNavBar || null;
    const navBarVariations = navigation?.navBarVariations || [];
    const selectedVariationId = navigation?.selectedVariationId || null;

    // Debug: Log navigation bar URLs
    useEffect(() => {
        if (generatedNavBar) {
            console.log('[ScreenFlowFrame] Active Nav URL:', generatedNavBar.url);
        }
        if (navBarVariations.length > 0) {
            console.log('[ScreenFlowFrame] Variations:', navBarVariations.map(v => ({
                id: v.id,
                url: v.url,
                originalUrl: v.originalUrl,
            })));
        }
    }, [generatedNavBar, navBarVariations]);

    const handleToggleNavigationScreen = (screenId: string) => {
        const exists = navItems.includes(screenId);
        let nextItems = exists ? navItems.filter((id) => id !== screenId) : [...navItems, screenId];
        if (!exists && nextItems.length > NAV_MAX_ITEMS) {
            nextItems = nextItems.slice(0, NAV_MAX_ITEMS);
        }

        updateStep4Data({
            navigation: {
                ...navigation,
                items: nextItems,
                confirmed: false,
            },
        });
    };

    const handleMoveNavigationScreen = (screenId: string, direction: -1 | 1) => {
        const index = navItems.indexOf(screenId);
        if (index === -1) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= navItems.length) return;

        const reordered = [...navItems];
        const [removed] = reordered.splice(index, 1);
        reordered.splice(newIndex, 0, removed);

        updateStep4Data({
            navigation: {
                ...navigation,
                items: reordered,
                confirmed: false,
            },
        });
    };

    const handleToggleNavType = (type: 'bottom' | 'none') => {
        updateStep4Data({
            navigation: {
                ...navigation,
                type,
                confirmed: type === 'none', // Auto-confirm if no navigation
            },
        });
    };

    const buildNavigationPrompt = useCallback(() => {
        const appName = step1.appName || 'the app';
        const selectedScreens = navItems.map(id => screens.find(s => s.id === id)?.name).filter(Boolean);
        const palette = step3.colorPalette
            ? `primary ${step3.colorPalette.primary}, secondary ${step3.colorPalette.secondary}, accent ${step3.colorPalette.accent}`
            : '';
        const personality = step2.personality ? `${step2.personality} mood` : '';

        return `iOS bottom navigation bar component for "${appName}" with ${selectedScreens.length} tabs: ${selectedScreens.join(', ')}. ${palette ? `Use brand colors: ${palette}.` : ''} ${personality ? `${personality} style.` : ''} Modern iOS design with icons and labels. IMPORTANT: Transparent or solid background, navigation bar should fill the entire width with NO white space or margins around it. The navigation bar component should occupy the full image area. Include tab icons, labels, and active state indicator. Clean, professional design.`;
    }, [step1.appName, navItems, screens, step3.colorPalette, step2.personality]);

    const handleGenerateNavigation = useCallback(async () => {
        if (navItems.length < 2) {
            toast.error('Select at least 2 screens for navigation');
            return;
        }

        setIsGeneratingNav(true);
        setIsProcessing(true);
        try {
            const prompt = buildNavigationPrompt();
            const newVariations: typeof navBarVariations = [];

            // Generate multiple variations
            for (let i = 0; i < navVariationCount; i++) {
                const isGptImage = selectedModel === 'gpt-image-1';
                const response = await fetch('/api/test/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt,
                        provider: isGptImage ? 'gpt-image-1' : 'gemini',
                        googleModel: isGptImage ? undefined : selectedModel,
                        outputFormat: 'png',
                        aspectRatio: navAspectRatio,
                    }),
                });

                const data = await response.json();
                if (!response.ok || !data?.success || !data?.imageUrl) {
                    throw new Error(data?.error || 'Failed to generate navigation');
                }

                // Persist the image to Supabase to avoid expiration
                const persistedUrl = await persistRemoteImage(data.imageUrl);
                console.log('[Nav Generation] AI URL:', data.imageUrl);
                console.log('[Nav Generation] Persisted URL:', persistedUrl);
                console.log('[Nav Generation] Safe URL:', getSafeImageUrl(persistedUrl));

                const modelInfo = GEMINI_MODELS.find(m => m.value === selectedModel);
                newVariations.push({
                    id: `nav-${Date.now()}-${i}`,
                    url: getSafeImageUrl(persistedUrl),
                    originalUrl: persistedUrl, // Store persisted Supabase URL for editing
                    prompt,
                    provider: isGptImage ? 'OpenAI' : 'Gemini',
                    model: modelInfo?.label || selectedModel,
                    createdAt: new Date().toISOString(),
                });
            }

            const updatedVariations = [...navBarVariations, ...newVariations];
            const defaultVariation = newVariations[0];

            updateStep4Data({
                navigation: {
                    ...navigation,
                    generatedNavBar: {
                        url: defaultVariation.url,
                        prompt,
                        provider: defaultVariation.provider,
                        model: defaultVariation.model,
                    },
                    navBarVariations: updatedVariations,
                    selectedVariationId: defaultVariation.id,
                },
            });

            toast.success(`Generated ${newVariations.length} navigation bar variation${newVariations.length > 1 ? 's' : ''}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate navigation';
            console.error('[Navigation Generation]', error);
            toast.error(message);
        } finally {
            setIsGeneratingNav(false);
            setIsProcessing(false);
        }
    }, [navItems, buildNavigationPrompt, selectedModel, navVariationCount, navAspectRatio, navBarVariations, navigation]);

    const handleSelectNavVariation = useCallback((variationId: string) => {
        const variation = navBarVariations.find(v => v.id === variationId);
        if (!variation) return;

        updateStep4Data({
            navigation: {
                ...navigation,
                generatedNavBar: {
                    url: variation.url,
                    prompt: variation.prompt,
                    provider: variation.provider,
                    model: variation.model,
                },
                selectedVariationId: variationId,
                confirmed: true, // Auto-confirm when selecting a variation
            },
        });

        toast.success('Navigation bar selected and confirmed');
    }, [navBarVariations, navigation]);

    const handleDeleteNavVariation = useCallback((variationId: string) => {
        const updatedVariations = navBarVariations.filter(v => v.id !== variationId);

        if (updatedVariations.length === 0) {
            updateStep4Data({
                navigation: {
                    ...navigation,
                    generatedNavBar: null,
                    navBarVariations: [],
                    selectedVariationId: null,
                },
            });
        } else {
            const nextSelected = selectedVariationId === variationId
                ? updatedVariations[0]
                : navBarVariations.find(v => v.id === selectedVariationId) || updatedVariations[0];

            updateStep4Data({
                navigation: {
                    ...navigation,
                    generatedNavBar: {
                        url: nextSelected.url,
                        prompt: nextSelected.prompt,
                        provider: nextSelected.provider,
                        model: nextSelected.model,
                    },
                    navBarVariations: updatedVariations,
                    selectedVariationId: nextSelected.id,
                },
            });
        }
    }, [navBarVariations, navigation, selectedVariationId]);

    const handleEditNavigation = useCallback(async () => {
        const originalSource = getOriginalUrl(navToEditOriginal);
        if (!editNavPrompt.trim() || !originalSource) {
            setNavError('Please enter edit instructions');
            return;
        }

        setIsGeneratingNav(true);
        setIsProcessing(true);
        setNavError(null);
        try {
            console.log('[Nav Edit] Reference image URL:', navToEditOriginal);

            const modelConfig = EDIT_MODELS.find(m => m.value === editNavModel);
            const isGemini = modelConfig?.provider === 'gemini';
            const isGptImage = modelConfig?.provider === 'gpt-image-1';

            const response = await fetch('/api/test/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: editNavPrompt,
                    provider: modelConfig?.provider || 'gemini',
                    googleModel: isGemini ? editNavModel : undefined,
                    seedreamModel: editNavModel === 'seedream-4.5-edit' ? editNavModel : undefined,
                    qwenModel: editNavModel === 'qwen-image-edit' ? editNavModel : undefined,
                    outputFormat: 'png',
                    aspectRatio: navAspectRatio,
                    referenceImages: [originalSource], // Use original URL, not proxied
                }),
            });

            const data = await response.json();
            if (!response.ok || !data?.success || !data?.imageUrl) {
                throw new Error(data?.error || 'Failed to edit navigation');
            }

            const providerName =
                modelConfig?.provider === 'gemini' ? 'Gemini' :
                    modelConfig?.provider === 'seedream-4.5-edit' ? 'Seedream' :
                        modelConfig?.provider === 'gpt-image-1' ? 'OpenAI' :
                            'Qwen';

            const newVariation = {
                id: `nav-edit-${Date.now()}`,
                url: getSafeImageUrl(data.imageUrl),
                originalUrl: data.imageUrl, // Store original URL for future editing
                prompt: editNavPrompt,
                provider: providerName,
                model: modelConfig?.label || editNavModel,
                createdAt: new Date().toISOString(),
            };

            const updatedVariations = [...navBarVariations, newVariation];

            updateStep4Data({
                navigation: {
                    ...navigation,
                    generatedNavBar: {
                        url: newVariation.url,
                        prompt: editNavPrompt,
                        provider: 'Gemini',
                        model: 'Nano Banana Edit',
                    },
                    navBarVariations: updatedVariations,
                    selectedVariationId: newVariation.id,
                },
            });

            toast.success('Navigation bar edited successfully');
            setIsEditingNav(false);
            setEditNavPrompt('');
            setNavToEdit(null);
            setNavToEditOriginal(null);
            setNavError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to edit navigation';
            console.error('[Navigation Edit]', error);
            setNavError(message);
            toast.error(message);
        } finally {
            setIsGeneratingNav(false);
            setIsProcessing(false);
        }
    }, [editNavPrompt, editNavModel, navToEditOriginal, navAspectRatio, navBarVariations, navigation]);

    const handleSaveManualEdit = useCallback(async (editedImageUrl: string) => {
        if (!navToManualEditId) return;

        // Find the variation being edited
        const variationIndex = navBarVariations.findIndex(v => v.id === navToManualEditId);
        if (variationIndex === -1) return;

        // If it's a data URL, try to migrate it immediately to permanent storage
        let finalUrl = editedImageUrl;
        if (editedImageUrl.startsWith('data:')) {
            toast.info('Saving edited image to permanent storage...');
            try {
                finalUrl = await migrateImageToSupabase(editedImageUrl);
            } catch (e) {
                console.error('[Manual Edit] Migration failed, using data URL:', e);
            }
        }

        const updatedVariations = [...navBarVariations];
        const safeUrl = getSafeImageUrl(finalUrl);
        updatedVariations[variationIndex] = {
            ...updatedVariations[variationIndex],
            url: safeUrl,
            originalUrl: finalUrl,
        };

        updateStep4Data({
            navigation: {
                ...navigation,
                navBarVariations: updatedVariations,
                // If this was the selected variation, update the generatedNavBar
                ...(selectedVariationId === navToManualEditId && {
                    generatedNavBar: {
                        url: safeUrl,
                        prompt: updatedVariations[variationIndex].prompt,
                        provider: updatedVariations[variationIndex].provider,
                        model: updatedVariations[variationIndex].model,
                    },
                }),
            },
        });

        toast.success('Navigation bar edited successfully');
        setIsManualEditingNav(false);
        setNavToManualEdit(null);
        setNavToManualEditId(null);
    }, [navToManualEditId, navBarVariations, navigation, selectedVariationId]);

    const handleMigrateAllImages = useCallback(async () => {
        if (navBarVariations.length === 0) {
            toast.error('No images to migrate');
            return;
        }

        setIsMigratingImages(true);
        toast.info('Migrating images to permanent storage...');

        try {
            const migratedVariations = [];

            for (const variation of navBarVariations) {
                const originalUrl = variation.originalUrl || variation.url;

                // Extract the actual URL if it's proxied
                let urlToMigrate = originalUrl;
                if (originalUrl.startsWith('/api/image-proxy?url=')) {
                    const parsed = new URL(originalUrl, window.location.origin);
                    urlToMigrate = parsed.searchParams.get('url') || originalUrl;
                }

                console.log('[Migration] Migrating variation:', variation.id, urlToMigrate);

                const migratedUrl = await migrateImageToSupabase(urlToMigrate);
                const safeUrl = getSafeImageUrl(migratedUrl);

                migratedVariations.push({
                    ...variation,
                    url: safeUrl,
                    originalUrl: migratedUrl,
                });
            }

            // Update the active navigation bar if it exists
            let updatedNavBar = generatedNavBar;
            if (generatedNavBar && selectedVariationId) {
                const selectedMigrated = migratedVariations.find(v => v.id === selectedVariationId);
                if (selectedMigrated) {
                    updatedNavBar = {
                        ...generatedNavBar,
                        url: selectedMigrated.url,
                    };
                }
            }

            updateStep4Data({
                navigation: {
                    ...navigation,
                    navBarVariations: migratedVariations,
                    generatedNavBar: updatedNavBar,
                },
            });

            toast.success(`Successfully migrated ${migratedVariations.length} images to permanent storage`);
        } catch (error) {
            console.error('[Migration] Failed:', error);
            toast.error('Failed to migrate some images. Please try again.');
        } finally {
            setIsMigratingImages(false);
        }
    }, [navBarVariations, generatedNavBar, selectedVariationId, navigation]);

    const handleConfirmNavigation = () => {
        if (navType === 'bottom' && navItems.length < 2) {
            toast.error('Select at least 2 screens for navigation');
            return;
        }
        updateStep4Data({
            navigation: {
                ...navigation,
                confirmed: true,
            },
        });
    };

    const handleResetNavigation = () => {
        updateStep4Data({
            navigation: {
                ...navigation,
                confirmed: false,
            },
        });
    };

    const handleQuickAddScreen = (type: Step4Data['screens'][0]['type']) => {
        // Check if already added
        if (screens.some(s => s.type === type)) {
            return;
        }

        // Get default name and purpose for this screen type
        const typeInfo = SCREEN_TYPES.find(t => t.id === type);
        if (!typeInfo) return;

        const newScreen: Step4Data['screens'][0] = {
            id: `screen-${type}-${Date.now()}`,
            name: typeInfo.name,
            type: type,
            purpose: typeInfo.description,
            keyElements: [],
            position: { x: 0, y: 0 },
        };

        updateStep4Data({
            screens: [...screens, newScreen],
        });

        // Auto-set as initial screen if it's the first screen
        if (screens.length === 0) {
            updateStep4Data({ initialScreen: newScreen.id });
        }

        // Don't close the panel - let users add multiple screens
    };

    const handleAddScreen = () => {
        if (!newScreenName.trim()) {
            setError('Screen name is required');
            return;
        }

        const newScreen: Step4Data['screens'][0] = {
            id: `screen-${Date.now()}`,
            name: newScreenName,
            type: newScreenType,
            purpose: newScreenPurpose,
            keyElements: [],
            position: { x: 0, y: 0 },
        };

        updateStep4Data({
            screens: [...screens, newScreen],
        });

        // Auto-set as initial screen if it's the first screen
        if (screens.length === 0) {
            updateStep4Data({ initialScreen: newScreen.id });
        }

        // Reset form
        setNewScreenName('');
        setNewScreenType('custom');
        setNewScreenPurpose('');
        setIsAddingScreen(false);
        setError(null);
    };

    const handleRemoveScreen = (screenId: string) => {
        const updatedScreens = screens.filter(s => s.id !== screenId);
        const updatedNavItems = navItems.filter(id => id !== screenId);

        const payload: Partial<Step4Data> = { screens: updatedScreens };

        if (initialScreen === screenId) {
            payload.initialScreen = '';
        }

        if (updatedNavItems.length !== navItems.length) {
            payload.navigation = {
                ...navigation,
                items: updatedNavItems,
                confirmed: false,
            };
        }

        updateStep4Data(payload);
    };

    const handleSetInitialScreen = (screenId: string) => {
        updateStep4Data({ initialScreen: screenId });
    };

    const handleToggleAuth = () => {
        const newAuthRequired = !authRequired;
        updateStep4Data({ authRequired: newAuthRequired });

        if (newAuthRequired) {
            // Auto-add Sign In and Sign Up screens if they don't exist
            const hasSignIn = screens.some(s => s.type === 'signin');
            const hasSignUp = screens.some(s => s.type === 'signup');

            const newScreens = [...screens];

            if (!hasSignIn) {
                newScreens.push({
                    id: `screen-signin-${Date.now()}`,
                    name: 'Sign In',
                    type: 'signin',
                    purpose: 'User authentication and login',
                    keyElements: [],
                    position: { x: 0, y: 0 },
                });
            }

            if (!hasSignUp) {
                newScreens.push({
                    id: `screen-signup-${Date.now() + 1}`,
                    name: 'Sign Up',
                    type: 'signup',
                    purpose: 'New user registration',
                    keyElements: [],
                    position: { x: 0, y: 0 },
                });
            }

            if (newScreens.length > screens.length) {
                updateStep4Data({ screens: newScreens });
            }
        } else {
            // Remove Sign In and Sign Up screens when auth is disabled
            const filteredScreens = screens.filter(s => s.type !== 'signin' && s.type !== 'signup');
            if (filteredScreens.length !== screens.length) {
                updateStep4Data({ screens: filteredScreens });

                // If we removed the initial screen, clear it
                const removedIds = screens.filter(s => s.type === 'signin' || s.type === 'signup').map(s => s.id);
                if (removedIds.includes(initialScreen)) {
                    updateStep4Data({ initialScreen: '' });
                }
            }
        }
    };

    const getScreenTypeInfo = (type: Step4Data['screens'][0]['type']) => {
        return SCREEN_TYPES.find(t => t.id === type) || SCREEN_TYPES[SCREEN_TYPES.length - 1];
    };

    return (
        <div className="w-[990px] max-h-[85vh] overflow-y-auto custom-scrollbar pointer-events-auto bg-[#11121D] border-2 border-[#1F243B] rounded-2xl p-10 pb-60 shadow-2xl text-white">
            <div className="mb-6">
                <h2 className="text-3xl font-bold mb-1">Step 4: Screen Flow Mapping</h2>
                <p className="text-sm text-slate-300">
                    Define the screens your app needs and their navigation flow
                </p>
            </div>

            {/* Authentication Toggle */}
            <div className="mb-6 p-4 bg-[#1A1F32] border border-[#1F243B] rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-white">Requires Authentication</h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Does your app require users to sign in?
                        </p>
                    </div>
                    <button
                        onClick={handleToggleAuth}
                        className={`relative w-12 h-6 rounded-full transition-colors ${authRequired ? 'bg-blue-600' : 'bg-[#2a2a2a]'
                            }`}
                    >
                        <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${authRequired ? 'translate-x-7' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Quick Add Screen Buttons */}
                <div className="border-t border-[#1F243B] pt-4">
                    <p className="text-xs text-slate-400 mb-3">Quick add common screens:</p>
                    <div className="flex flex-wrap gap-2">
                        {SCREEN_TYPES.filter(type => type.id !== 'custom').map((type) => {
                            const isAlreadyAdded = screens.some(s => s.type === type.id);

                            return (
                                <button
                                    key={type.id}
                                    onClick={() => handleQuickAddScreen(type.id)}
                                    disabled={isAlreadyAdded}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${isAlreadyAdded
                                        ? 'bg-[#0a0a0a] border border-[#2a2a2a] text-slate-600 cursor-not-allowed'
                                        : 'bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:border-blue-500/50'
                                        }`}
                                    title={isAlreadyAdded ? 'Already added' : `Add ${type.name} screen`}
                                >
                                    <div className={`${type.icon} text-sm`} />
                                    {type.name}
                                    {isAlreadyAdded && <div className="i-ph:check text-xs" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Screens List */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-lg">Screens ({screens.length})</h3>
                        {!isAddingScreen && screens.length > 0 && (
                            <p className="text-xs text-slate-400 mt-1">Click "Add Screen" to add more screens to your app</p>
                        )}
                    </div>
                    {!isAddingScreen && (
                        <button
                            onClick={() => setIsAddingScreen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <div className="i-ph:plus text-lg" />
                            Add Screen
                        </button>
                    )}
                </div>

                {/* Add Screen Panel */}
                {isAddingScreen && (
                    <div className="mb-4 p-4 bg-[#1A1F32] border border-[#1F243B] rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Add Screen</h4>
                            <button
                                onClick={() => {
                                    setIsAddingScreen(false);
                                    setNewScreenName('');
                                    setNewScreenType('custom');
                                    setNewScreenPurpose('');
                                    setError(null);
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <div className="i-ph:x text-lg" />
                            </button>
                        </div>

                        {newScreenType === 'custom' ? (
                            <>
                                {/* Custom Screen Form */}
                                <div className="mb-4">
                                    <label className="block text-xs text-slate-400 mb-2">Screen Name *</label>
                                    <input
                                        type="text"
                                        value={newScreenName}
                                        onChange={(e) => setNewScreenName(e.target.value)}
                                        placeholder="e.g., Dashboard, Product List, Checkout"
                                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#444] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs text-slate-400 mb-2">Purpose (Optional)</label>
                                    <textarea
                                        value={newScreenPurpose}
                                        onChange={(e) => setNewScreenPurpose(e.target.value)}
                                        placeholder="Describe what users do on this screen..."
                                        rows={2}
                                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#444] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddScreen}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Add Custom Screen
                                    </button>
                                    <button
                                        onClick={() => setNewScreenType('home')}
                                        className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg text-sm transition-colors"
                                    >
                                        Back to Templates
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Screen Type Selection */}
                                <p className="text-xs text-slate-400 mb-3">Choose a screen type or create a custom one</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {SCREEN_TYPES.map((type) => {
                                        const isAlreadyAdded = screens.some(s => s.type === type.id);
                                        const isCustom = type.id === 'custom';

                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => {
                                                    if (isCustom) {
                                                        setNewScreenType('custom');
                                                    } else if (!isAlreadyAdded) {
                                                        handleQuickAddScreen(type.id);
                                                    }
                                                }}
                                                disabled={isAlreadyAdded && !isCustom}
                                                className={`p-3 rounded-lg border text-left transition-all ${isAlreadyAdded && !isCustom
                                                    ? 'border-[#2a2a2a] bg-[#0a0a0a] text-slate-600 cursor-not-allowed opacity-50'
                                                    : isCustom
                                                        ? 'border-purple-500 bg-purple-500/10 text-white hover:bg-purple-500/20'
                                                        : 'border-[#444] bg-[#1A1F32] hover:border-blue-500 hover:bg-blue-500/10 text-slate-300'
                                                    }`}
                                            >
                                                <div className={`${type.icon} text-xl mb-1 ${isAlreadyAdded && !isCustom
                                                    ? 'text-slate-700'
                                                    : isCustom
                                                        ? 'text-purple-400'
                                                        : 'text-blue-400'
                                                    }`} />
                                                <p className="text-xs font-medium">{type.name}</p>
                                                <p className={`text-[10px] mt-0.5 ${isAlreadyAdded && !isCustom
                                                    ? 'text-slate-700'
                                                    : isCustom
                                                        ? 'text-purple-300'
                                                        : 'text-slate-500'
                                                    }`}>
                                                    {isAlreadyAdded && !isCustom ? 'Already added' : type.description}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Screens Grid */}
                {screens.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-[#444] rounded-xl text-center text-slate-400">
                        <div className="i-ph:layout text-4xl mb-3 opacity-30" />
                        <p className="text-sm">No screens added yet. Add at least 3 screens to continue.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {screens.map((screen) => {
                            const typeInfo = getScreenTypeInfo(screen.type);
                            return (
                                <div
                                    key={screen.id}
                                    className={`p-4 rounded-xl border-2 transition-all ${initialScreen === screen.id
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-[#1F243B] bg-[#1A1F32]'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className={`${typeInfo.icon} text-2xl text-blue-400 mt-1`} />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-white">{screen.name}</h4>
                                                    {initialScreen === screen.id && (
                                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-medium rounded-full">
                                                            Initial Screen
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mb-1">{typeInfo.name}</p>
                                                {screen.purpose && (
                                                    <p className="text-xs text-slate-500">{screen.purpose}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {initialScreen !== screen.id && (
                                                <button
                                                    onClick={() => handleSetInitialScreen(screen.id)}
                                                    className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-xs transition-colors"
                                                    title="Set as initial screen"
                                                >
                                                    Set Initial
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveScreen(screen.id)}
                                                className="w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                                                title="Remove screen"
                                            >
                                                <div className="i-ph:trash text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Navigation Agreement */}
            <div className="mt-10 p-5 bg-[#1A1F32] border border-[#1F243B] rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">App Navigation</h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Configure how users navigate through your app
                        </p>
                    </div>
                    {/* Only show button if navigation is confirmed OR if no nav bar has been generated yet */}
                    {(navConfirmed || !generatedNavBar) && (
                        <div className="flex gap-2">
                            {navConfirmed ? (
                                <button
                                    onClick={handleResetNavigation}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 transition-colors"
                                >
                                    Edit navigation
                                </button>
                            ) : (
                                <button
                                    onClick={handleConfirmNavigation}
                                    disabled={navType === 'bottom' && navItems.length < 2}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 transition-colors"
                                >
                                    {navType === 'none' ? 'Navigation confirmed' : navItems.length < 2 ? 'Select screens' : 'Confirm navigation'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation Type Selection */}
                <div className="mb-4 flex gap-3">
                    <button
                        onClick={() => handleToggleNavType('bottom')}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${navType === 'bottom'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-[#2F344B] bg-[#171C2D] hover:border-blue-500/50'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className="i-ph:layout text-lg text-blue-400" />
                            <span className="font-semibold text-sm">Bottom Navigation</span>
                        </div>
                        <p className="text-xs text-slate-400">Persistent tab bar at the bottom</p>
                    </button>
                    <button
                        onClick={() => handleToggleNavType('none')}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${navType === 'none'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-[#2F344B] bg-[#171C2D] hover:border-blue-500/50'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className="i-ph:x-circle text-lg text-slate-400" />
                            <span className="font-semibold text-sm">No Navigation</span>
                        </div>
                        <p className="text-xs text-slate-400">Custom or screen-specific navigation</p>
                    </button>
                </div>

                {/* Bottom Navigation Configuration */}
                {navType === 'bottom' && (
                    <>
                        <div className="border-t border-[#2F344B] pt-4 mb-4">
                            <p className="text-xs text-slate-400 mb-3">
                                Select up to {NAV_MAX_ITEMS} screens (excluding splash) for your bottom navigation
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {screens
                                    .filter((screen) => screen.type !== 'splash')
                                    .map((screen) => {
                                        const isSelected = navItems.includes(screen.id);
                                        const atLimit = navItems.length >= NAV_MAX_ITEMS;
                                        return (
                                            <button
                                                key={screen.id}
                                                onClick={() => handleToggleNavigationScreen(screen.id)}
                                                disabled={!isSelected && atLimit}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${isSelected
                                                    ? 'border-blue-500 bg-blue-500/20 text-blue-200'
                                                    : 'border-[#2F344B] bg-[#171C2D] text-slate-300 hover:border-blue-500'
                                                    } ${!isSelected && atLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {screen.name}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>

                        {navItems.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-slate-400">Navigation order</p>
                                {navItems.map((screenId, index) => {
                                    const screen = screens.find((s) => s.id === screenId);
                                    return (
                                        <div
                                            key={screenId}
                                            className="flex items-center justify-between bg-[#11121D] border border-[#2F344B] rounded-xl px-4 py-2 text-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                                                    {index + 1}
                                                </span>
                                                <span className="text-white">{screen?.name || 'Unknown screen'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleMoveNavigationScreen(screenId, -1)}
                                                    disabled={index === 0}
                                                    className="p-1 rounded bg-[#1F243B] text-slate-300 disabled:opacity-30"
                                                    aria-label="Move up"
                                                >
                                                    <div className="i-ph:arrow-up" />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveNavigationScreen(screenId, 1)}
                                                    disabled={index === navItems.length - 1}
                                                    className="p-1 rounded bg-[#1F243B] text-slate-300 disabled:opacity-30"
                                                    aria-label="Move down"
                                                >
                                                    <div className="i-ph:arrow-down" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Navigation Bar Generator */}
                        {navItems.length >= 2 && (
                            <div className="border-t border-[#2F344B] pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Generate Navigation Bar</h4>
                                        <p className="text-xs text-slate-200 mt-1 font-medium">
                                            Create AI-generated mockup of your bottom navigation
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {navBarVariations.length > 0 && (
                                            <button
                                                onClick={handleMigrateAllImages}
                                                disabled={isMigratingImages}
                                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-xs font-medium transition-colors flex items-center gap-1.5"
                                                title="Fix broken images by re-uploading them to permanent storage"
                                            >
                                                <div className="i-ph:arrows-clockwise text-sm" />
                                                {isMigratingImages ? 'Fixing...' : 'Fix Images'}
                                            </button>
                                        )}
                                        <select
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="px-2 py-1 text-xs rounded bg-[#11121D] border border-[#2F344B] text-white"
                                        >
                                            {GEMINI_MODELS.map((model) => (
                                                <option key={model.value} value={model.value}>
                                                    {model.label}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={navAspectRatio}
                                            onChange={(e) => setNavAspectRatio(e.target.value)}
                                            className="px-2 py-1 text-xs rounded bg-[#11121D] border border-[#2F344B] text-white"
                                        >
                                            <option value="1:1">1:1 Square</option>
                                            <option value="3:2">3:2 Horizontal</option>
                                            <option value="2:3">2:3 Vertical</option>
                                            <option value="4:3">4:3 Standard</option>
                                            <option value="3:4">3:4 Portrait</option>
                                            <option value="16:9">16:9 Wide</option>
                                            <option value="9:16">9:16 Tall</option>
                                        </select>
                                        <select
                                            value={navVariationCount}
                                            onChange={(e) => setNavVariationCount(Number(e.target.value))}
                                            className="px-2 py-1 text-xs rounded bg-[#11121D] border border-[#2F344B] text-white"
                                        >
                                            <option value={1}>1 variation</option>
                                            <option value={2}>2 variations</option>
                                            <option value={3}>3 variations</option>
                                            <option value={4}>4 variations</option>
                                        </select>
                                        <button
                                            onClick={handleGenerateNavigation}
                                            disabled={isGeneratingNav}
                                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 text-xs font-medium transition-colors flex items-center gap-1.5"
                                        >
                                            <div className="i-ph:sparkle text-sm" />
                                            {isGeneratingNav ? 'Generating...' : navBarVariations.length > 0 ? 'Generate More' : 'Generate'}
                                        </button>
                                    </div>
                                </div>

                                {/* Navigation Preview and Variations */}
                                {generatedNavBar && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Main Preview */}
                                        <div className="bg-[#11121D] border border-[#2F344B] rounded-lg p-3">
                                            <p className="text-xs text-slate-400 mb-2">Active Navigation</p>
                                            <div className={`rounded-lg border border-[#2F344B] bg-slate-900 ${getAspectRatioClass(navAspectRatio)} overflow-hidden`}>
                                                {generatedNavBar.url ? (
                                                    <img
                                                        src={generatedNavBar.url}
                                                        alt="Navigation Bar"
                                                        className="w-full h-full object-cover cursor-pointer"
                                                        onClick={() => setViewingNavVariation(generatedNavBar.url)}
                                                        onError={(e) => {
                                                            console.error('[Nav Image] Failed to load:', generatedNavBar.url);
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                                                        No image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 text-xs text-slate-400">
                                                <p>{generatedNavBar.model}</p>
                                            </div>
                                        </div>

                                        {/* Variations */}
                                        <div className="bg-[#11121D] border border-[#2F344B] rounded-lg p-3">
                                            <p className="text-xs text-slate-400 mb-2">Variations ({navBarVariations.length})</p>
                                            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                                                {navBarVariations.map((variation) => {
                                                    const isActive = variation.id === selectedVariationId;
                                                    return (
                                                        <div
                                                            key={variation.id}
                                                            className={`relative rounded border ${getAspectRatioClass(navAspectRatio)} overflow-hidden cursor-pointer group ${isActive ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-[#2F344B]'
                                                                }`}
                                                            onClick={() => handleSelectNavVariation(variation.id)}
                                                        >
                                                            <img
                                                                src={variation.url}
                                                                alt="Variation"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    console.error('[Nav Variation] Failed to load:', variation.url);
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                                <button
                                                                    className="px-2 py-1 rounded bg-white text-black text-[10px]"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setViewingNavVariation(variation.url);
                                                                    }}
                                                                >
                                                                    View
                                                                </button>
                                                                <button
                                                                    className="px-2 py-1 rounded bg-blue-500 text-white text-[10px]"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setNavToEdit(variation.url);
                                                                        setNavToEditOriginal(getOriginalUrl(variation.originalUrl || variation.url));
                                                                        setEditNavPrompt(buildNavigationPrompt());
                                                                        setIsEditingNav(true);
                                                                    }}
                                                                >
                                                                    AI Edit
                                                                </button>
                                                                <button
                                                                    className="px-2 py-1 rounded bg-purple-500 text-white text-[10px]"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setNavToManualEdit(variation.url);
                                                                        setNavToManualEditId(variation.id);
                                                                        setIsManualEditingNav(true);
                                                                    }}
                                                                >
                                                                    Manual Edit
                                                                </button>
                                                                <button
                                                                    className="px-2 py-1 rounded bg-red-500 text-white text-[10px]"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setNavPendingDelete(variation.id);
                                                                    }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                            {isActive && (
                                                                <div className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full bg-purple-600 text-white">
                                                                    Active
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Status Messages */}
                {navType === 'none' ? (
                    <p className="text-xs text-blue-400 mt-4 flex items-center gap-2">
                        <div className="i-ph:info" />
                        No navigation bar selected. All screens can be generated freely.
                    </p>
                ) : generatedNavBar ? (
                    <p className="text-xs text-green-400 mt-4 flex items-center gap-2">
                        <div className="i-ph:check-circle" />
                        Navigation configured. Click on variations to switch designs.
                    </p>
                ) : navItems.length >= 2 ? (
                    <p className="text-xs text-blue-400 mt-4 flex items-center gap-2">
                        <div className="i-ph:info" />
                        Generate navigation bar variations below to proceed.
                    </p>
                ) : null}
            </div>

            {/* Navigation Variation Viewer Modal */}
            {viewingNavVariation && typeof document !== 'undefined' && typeof window !== 'undefined' && (
                createPortal(
                    <div
                        className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setViewingNavVariation(null)}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    >
                        <div
                            className="bg-[#0b0c14] border border-[#1F243B] rounded-2xl p-4 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                <h3 className="text-lg font-semibold text-white">Navigation Bar Preview</h3>
                                <button
                                    onClick={() => setViewingNavVariation(null)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <div className="i-ph:x text-2xl" />
                                </button>
                            </div>
                            <div className="flex-1 flex items-center justify-center overflow-hidden">
                                <img
                                    src={viewingNavVariation}
                                    alt="Navigation Bar"
                                    className="max-h-full max-w-full rounded-xl border border-[#1F243B] object-contain"
                                />
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            )}

            {/* Navigation Edit Modal */}
            {isEditingNav && typeof document !== 'undefined' && typeof window !== 'undefined' && (
                createPortal(
                    <div
                        className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => {
                            if (!isGeneratingNav) {
                                setIsEditingNav(false);
                                setEditNavPrompt('');
                                setNavToEdit(null);
                                setNavToEditOriginal(null);
                            }
                        }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    >
                        <div
                            className="bg-[#0b0c14] border border-[#1F243B] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-[#1F243B] flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-white">Edit Navigation Bar</h3>
                                <button
                                    onClick={() => {
                                        if (!isGeneratingNav) {
                                            setIsEditingNav(false);
                                            setEditNavPrompt('');
                                            setNavToEdit(null);
                                            setNavToEditOriginal(null);
                                        }
                                    }}
                                    className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                    disabled={isGeneratingNav}
                                >
                                    <div className="i-ph:x text-2xl" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Image Preview */}
                                {navToEdit && (
                                    <div className="flex justify-center">
                                        <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-dashed border-[#2F344B] bg-[#11121D]">
                                            <img
                                                src={navToEdit}
                                                alt="Navigation bar to edit"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {/* Model Selector */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">
                                        AI Model
                                    </label>
                                    <select
                                        value={editNavModel}
                                        onChange={(e) => setEditNavModel(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#171C2D] border border-[#2F344B] rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                                        disabled={isGeneratingNav}
                                    >
                                        {EDIT_MODELS.map((model) => (
                                            <option key={model.value} value={model.value}>
                                                {model.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Edit Instructions */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">
                                        Edit Instructions
                                    </label>
                                    <textarea
                                        value={editNavPrompt}
                                        onChange={(e) => setEditNavPrompt(e.target.value)}
                                        placeholder="e.g., Make the icons larger, change the selected color to green, add labels..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-[#171C2D] border border-[#2F344B] rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-colors"
                                        disabled={isGeneratingNav}
                                    />
                                </div>

                                {/* Model Info */}
                                <div className="text-xs text-slate-400 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-center">
                                    Using <strong className="text-blue-400">{EDIT_MODELS.find(m => m.value === editNavModel)?.label}</strong> model with aspect ratio <strong className="text-blue-400">{navAspectRatio}</strong>
                                </div>

                                {/* Error Display */}
                                {navError && (
                                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2">
                                        <div className="i-ph:warning text-lg" />
                                        <span>{navError}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-[#1F243B] flex justify-end gap-2 bg-[#0a0b12]">
                                <button
                                    onClick={() => {
                                        setIsEditingNav(false);
                                        setEditNavPrompt('');
                                        setNavToEdit(null);
                                        setNavToEditOriginal(null);
                                    }}
                                    disabled={isGeneratingNav}
                                    className="px-4 py-2 rounded-lg bg-[#2a2a2a] border border-[#333] text-white hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditNavigation}
                                    disabled={isGeneratingNav || !editNavPrompt.trim()}
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2 min-w-[140px]"
                                >
                                    {isGeneratingNav ? (
                                        <>
                                            <div className="i-ph:spinner animate-spin text-sm" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <div className="i-ph:sparkle text-sm" />
                                            Generate Edit
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            )}

            {/* Navigation Delete Confirmation Modal */}
            {navPendingDelete && typeof document !== 'undefined' && typeof window !== 'undefined' && (
                createPortal(
                    <div
                        className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setNavPendingDelete(null)}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    >
                        <div
                            className="bg-[#0b0c14] border border-[#1F243B] rounded-2xl p-6 shadow-2xl max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                    <div className="i-ph:warning text-2xl text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Delete Navigation Variation</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                            <p className="text-slate-300 mb-6">
                                Are you sure you want to delete this navigation bar variation? This will permanently remove it from your project.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setNavPendingDelete(null)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-[#2a2a2a] border border-[#333] text-white hover:bg-[#333] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteNavVariation(navPendingDelete);
                                        setNavPendingDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            )}

            {/* Manual Image Editor Modal */}
            {isManualEditingNav && navToManualEdit && typeof document !== 'undefined' && typeof window !== 'undefined' && (
                createPortal(
                    <ImageEditor
                        imageUrl={navToManualEdit}
                        onSave={handleSaveManualEdit}
                        onCancel={() => {
                            setIsManualEditingNav(false);
                            setNavToManualEdit(null);
                            setNavToManualEditId(null);
                        }}
                    />,
                    document.body
                )
            )}

            {/* Validation Message */}
            {screens.length > 0 && screens.length < 3 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-sm text-yellow-400">
                        Add at least {3 - screens.length} more screen{3 - screens.length !== 1 ? 's' : ''} to continue (minimum 3 required)
                    </p>
                </div>
            )}

            {/* Summary */}
            {screens.length >= 3 && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-green-400">
                        <div className="i-ph:check-circle text-xl" />
                        <p className="text-sm font-medium">
                            You have {screens.length} screen{screens.length !== 1 ? 's' : ''}. You can either add more screens or proceed to the next step
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
