import { useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@nanostores/react';
import { toast } from 'sonner';
import {
    designWizardStore,
    updateStep5Data,
    setIsProcessing,
    type Step5Data,
    type Step4Data,
} from '~/lib/stores/designWizard';
import { ImageEditor } from './ImageEditor';
import { migrateImageToSupabase } from './utils/migrateImages';
import { showAlert } from '~/lib/stores/alertStore';


type ProviderOption = 'gemini' | 'openai';

const GEMINI_MODELS = [
    {
        value: 'nano-banana',
        label: 'Gemini Nano Banana Standard',
        supportsImageInput: false,
        requiresImageInput: false,
        priority: 1,
    },
    {
        value: 'nano-banana-edit',
        label: 'Gemini Nano Banana Edit',
        supportsImageInput: true,
        requiresImageInput: true,
        priority: 2,
    },
    {
        value: 'nano-banana-pro',
        label: 'Gemini Nano Banana Pro',
        supportsImageInput: true,
        requiresImageInput: false,
        priority: 99,
    },
];

const OPENAI_MODELS = [
    { value: 'gpt-image-1', label: 'GPT Image 1' },
    { value: 'dall-e-3', label: 'DALL·E 3' },
];

const IMAGE_COUNT_OPTIONS = [1, 2, 3, 4];
const ASPECT_RATIO_OPTIONS = ['9:16', '3:4', '1:1', '4:3', '16:9'];

const EDIT_MODELS = [
    { value: 'nano-banana-edit', label: 'Nano Banana Edit', provider: 'gemini' },
    { value: 'seedream-4.5-edit', label: 'Seedream 4.5 Edit', provider: 'seedream-4.5-edit' },
    { value: 'qwen-image-edit', label: 'Qwen Image Edit', provider: 'qwen-image-edit' },
    { value: 'gpt-image-1-edit', label: 'GPT Image 1 Edit', provider: 'gpt-image-1' },
];


type GenerationResponse = {
    success?: boolean;
    imageUrl?: string;
    creditsUsed?: number;
    error?: string;
};

const SCREEN_TYPE_GUIDANCE: Record<string, string> = {
    splash: 'Pure splash screen hero moment: Place the primary reference image logo in the center with the app name and a short tagline underneath. Atmosphere: Premium, spacious, and minimalist. Background should be a subtle gradient or branded texture. ABSOLUTELY NO buttons, cards, or interactive UI elements.',
    signin: 'Authentication screen. Hierarchy: Place the primary reference image logo at the top (prominent), followed by a clear "Sign In" heading. Input fields for Email and Password should be clean and modern with clear labels. Single primary CTA button. Social login buttons (Apple/Google) should be at the bottom, separate from the primary form.',
    signup: 'Registration screen. Hierarchy: Place the primary reference image logo at the top, clear "Create Account" heading. Form fields with consistent spacing. Primary CTA button should be the most prominent element.',
    home: 'Primary dashboard screen. Hierarchy: Header with user greeting or search, followed by featured content cards or hero banner. Use clear sections, grouped utility icons, and balanced whitespace. Content should feel dynamic and personalized.',
    profile: 'User profile screen. Hierarchy: Top section with user avatar, name, and bio. Followed by editable menu categories, user stats (e.g. followers, activity), and a prominent logout or settings action.',
    settings: 'Settings hub. Hierarchy: Categorized list items with clean icons and descriptive labels. Use switches, toggles, and disclosure indicators (chevron-right). Minimalist design with strong vertical rhythm.',
    custom: 'High-fidelity mobile UI screen. Hierarchy: Dedicated header section, followed by structured content cards and interactive components. Maintain consistent padding, premium typography, and clear visual hierarchy.',
};

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

const getOriginalUrl = (url: string | null | undefined) => {
    if (!url) return null;

    // Reject data URLs - the API doesn't support them
    if (url.startsWith('data:') || url.startsWith('blob:')) {
        console.error('[Step5] Data URLs are not supported for reference images. URL must be HTTP/HTTPS:', url.substring(0, 100));
        return null;
    }

    if (url.startsWith('/api/image-proxy?url=')) {
        try {
            const parsed = new URL(url, window.location.origin);
            const originalUrl = parsed.searchParams.get('url');

            // Double-check the extracted URL is also not a data URL
            if (originalUrl && (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:'))) {
                console.error('[Step5] Extracted URL is a data URL, which is not supported:', originalUrl.substring(0, 100));
                return null;
            }

            return originalUrl;
        } catch {
            return url;
        }
    }

    // For direct HTTP/HTTPS URLs, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    console.warn('[Step5] Unexpected URL format:', url.substring(0, 100));
    return url;
};

export function Step5Frame() {
    const wizardData = useStore(designWizardStore);
    const { step1, step2, step3, step4, step5 } = wizardData;

    const [provider, setProvider] = useState<ProviderOption>('gemini');
    const [googleModel, setGoogleModel] = useState<string>('nano-banana-pro');
    const [openaiModel, setOpenaiModel] = useState<string>('gpt-image-1');
    const [imageCount, setImageCount] = useState<number>(2);
    const [aspectRatio, setAspectRatio] = useState<string>('9:16');
    const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
    const [generatingScreens, setGeneratingScreens] = useState<Record<string, boolean>>({});
    const [activeRequests, setActiveRequests] = useState(0);
    const [viewingVariation, setViewingVariation] = useState<{ url: string; title: string } | null>(null);
    const [screenPendingDelete, setScreenPendingDelete] = useState<string | null>(null);
    const [screenNavigationSettings, setScreenNavigationSettings] = useState<Record<string, boolean>>({});
    const [screenLogoSettings, setScreenLogoSettings] = useState<Record<string, boolean>>({});
    const [isEditingScreen, setIsEditingScreen] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const [editModel, setEditModel] = useState('nano-banana-pro');
    const [screenToEdit, setScreenToEdit] = useState<{ id: string; url: string; variationId: string } | null>(null);
    const [isManualEditing, setIsManualEditing] = useState(false);
    const [screenToManualEdit, setScreenToManualEdit] = useState<{ id: string; url: string; variationId: string } | null>(null);


    const isBusy = activeRequests > 0;
    const screens = step4.screens;
    const splashLogoUrl = step3.logo?.url ?? null;
    const navigationState = step4.navigation ?? { type: 'bottom', items: [], confirmed: false, generatedNavBar: null, navBarVariations: [], selectedVariationId: null };
    const navigationConfirmed = navigationState.confirmed;
    const navigationType = navigationState.type ?? 'bottom';
    const hasNavigationBar = navigationState.generatedNavBar !== null;

    const getIncludeNav = useCallback((screenId: string) => {
        if (screenNavigationSettings[screenId] !== undefined) {
            return screenNavigationSettings[screenId];
        }

        const screen = screens.find(s => s.id === screenId);
        if (!screen) return true;

        // Smart defaults: Everything except splash should include navigation by default.
        const noNavTypes = ['splash'];
        return !noNavTypes.includes(screen.type);
    }, [screenNavigationSettings, screens]);

    const toggleIncludeNav = useCallback((screenId: string) => {
        setScreenNavigationSettings(prev => ({
            ...prev,
            [screenId]: !getIncludeNav(screenId)
        }));
    }, [getIncludeNav]);

    const getIncludeLogo = useCallback((screenId: string) => {
        if (screenLogoSettings[screenId] !== undefined) {
            return screenLogoSettings[screenId];
        }

        const screen = screens.find(s => s.id === screenId);
        if (!screen) return false;

        // Default to true for splash, signin, signup
        const logoTypes = ['splash', 'signin', 'signup'];
        return logoTypes.includes(screen.type);
    }, [screenLogoSettings, screens]);

    const toggleIncludeLogo = useCallback((screenId: string) => {
        setScreenLogoSettings(prev => ({
            ...prev,
            [screenId]: !getIncludeLogo(screenId)
        }));
    }, [getIncludeLogo]);

    useEffect(() => {
        if (!selectedScreenId && screens.length) {
            setSelectedScreenId(screens[0].id);
        }
    }, [screens, selectedScreenId]);

    const screensMissingGeneration = useMemo(
        () =>
            screens.filter((screen) => {
                const generated = step5.generatedScreens.find((g) => g.screenId === screen.id);
                return !generated || generated.variations.length === 0;
            }),
        [screens, step5.generatedScreens]
    );

    const selectedScreen = useMemo(
        () => screens.find((screen) => screen.id === selectedScreenId) || null,
        [screens, selectedScreenId]
    );

    const selectedGenerated = useMemo(
        () => step5.generatedScreens.find((g) => g.screenId === selectedScreenId) || null,
        [step5.generatedScreens, selectedScreenId]
    );

    const isScreenGenerating = (screenId: string) => !!generatingScreens[screenId];

    const selectedIncludeNav = selectedScreen ? getIncludeNav(selectedScreen.id) : false;
    const selectedIncludeLogo = selectedScreen ? getIncludeLogo(selectedScreen.id) : false;
    const hasReferences = (selectedIncludeNav && hasNavigationBar) || (selectedIncludeLogo && splashLogoUrl);

    const availableGeminiModels = useMemo(() => {
        const filtered = GEMINI_MODELS.filter((model) => {
            if (hasReferences) {
                // If references (NAV/LOGO) are ON: Only Pro or Edit are allowed (models that support image input)
                return model.supportsImageInput;
            } else {
                // If references are OFF: Only Standard or Pro are allowed (models that don't REQUIRE image input)
                return !model.requiresImageInput;
            }
        });

        return [...filtered].sort((a, b) => a.priority - b.priority);
    }, [hasReferences]);

    const screenCanBypassNavigation = (screenType: Step4Data['screens'][0]['type']) =>
        screenType === 'scanner' || screenType === 'onboarding';

    useEffect(() => {
        if (provider !== 'gemini') return;

        const isCurrentModelValid = availableGeminiModels.some((model) => model.value === googleModel);

        if (!isCurrentModelValid && availableGeminiModels.length > 0) {
            // Pick the first valid model, which will be the most cost-effective due to priority sorting
            setGoogleModel(availableGeminiModels[0].value);
        }
    }, [provider, availableGeminiModels, googleModel]);

    // Sync isProcessing with active requests to avoid stale closures
    useEffect(() => {
        setIsProcessing(activeRequests > 0 || isEditingScreen);
    }, [activeRequests, isEditingScreen]);

    const buildScreenPrompt = useCallback(
        (screen: (typeof screens)[number], includeNavOverride?: boolean, includeLogoOverride?: boolean) => {
            const appName = step1.appName || 'the app';
            const category = step1.category || 'mobile';
            const description = step1.description ? `${step1.description}.` : '';
            const keyElements =
                screen.keyElements && screen.keyElements.length
                    ? `Key elements: ${screen.keyElements.join(', ')}.`
                    : '';
            const palette = step3.colorPalette
                ? `Brand colors should follow primary ${step3.colorPalette.primary}, secondary ${step3.colorPalette.secondary}, accent ${step3.colorPalette.accent}.`
                : '';
            const typography = step3.typography
                ? `Typography pairing: ${step3.typography.fontFamily}.`
                : '';
            const styleDirection = step3.styleDirections.find((s) => s.id === step3.selectedStyleId);
            const styleKeywords = styleDirection?.keywords?.length
                ? `Style direction: ${styleDirection.name} with keywords ${styleDirection.keywords.join(', ')}.`
                : '';
            const personality = step2.personality
                ? `Overall mood should feel ${step2.personality}.`
                : '';
            const componentTone =
                step2.components === 'rounded'
                    ? 'Components should feature rounded corners and soft shadows.'
                    : step2.components === 'sharp'
                        ? 'Components should feature sharp corners and defined edges.'
                        : '';

            const typeGuidance =
                SCREEN_TYPE_GUIDANCE[screen.type] || SCREEN_TYPE_GUIDANCE.custom;

            const includeNav = includeNavOverride ?? getIncludeNav(screen.id);
            const includeLogo = includeLogoOverride ?? getIncludeLogo(screen.id);

            const hasNavRef = includeNav && hasNavigationBar && navigationState.generatedNavBar;
            const hasLogoRef = includeLogo && splashLogoUrl;

            // Add navigation bar context
            const navigationGuidance = (includeNav && hasNavigationBar)
                ? `IMPORTANT: Use the bottom navigation bar style from the reference images. Place it at the bottom of the screen. The navigation should be integrated into the screen layout.`
                : 'STRICTLY NO bottom navigation bars, NO menus, and NO tab bars. This screen must be a dedicated full-height experience without app-wide navigation.';

            // Add logo context
            const logoGuidance = (includeLogo && splashLogoUrl)
                ? `IMPORTANT: Reference Image 1 is your EXACT brand logo. You MUST use it without any modifications. DO NOT attempt to recreate a logo based on the app name "${appName}". Use the actual image from Reference Image 1 and place it prominently in the ${screen.type === 'splash' ? 'center' : 'header section'} of the screen.`
                : 'Do NOT include any brand logos or icons in this design. Focus purely on the UI components.';

            const globalConstraints = 'IMPORTANT: Render ONLY the UI content. DO NOT include phone frames, device bezels, notches, or OS status bars (time, battery, signal). The design should fill the entire 9:16 canvas. Use the provided reference images as the absolute truth for visual style, branding, and layouts.';

            return [
                `High fidelity ${screen.type} screen for "${appName}", a ${category} app. ${description}`,
                typeGuidance,
                keyElements,
                palette,
                typography,
                styleKeywords,
                personality,
                componentTone,
                'Use 9:16 aspect ratio, polished Apple iOS design language, premium spacing, and legible text.',
                globalConstraints,
                logoGuidance,
                navigationGuidance,
            ]
                .filter(Boolean)
                .join(' ');
        },
        [step1.appName, step1.category, step1.description, step2.components, step2.personality, step3.colorPalette, step3.typography, step3.styleDirections, step3.selectedStyleId, getIncludeNav, getIncludeLogo, hasNavigationBar, splashLogoUrl]
    );

    const handleGenerateScreen = useCallback(
        async (screenId: string, quantityOverride?: number) => {
            console.log(`[Step5] handleGenerateScreen called for: ${screenId}`);
            const screen = screens.find((s) => s.id === screenId);
            if (!screen) return;
            if (navigationType === 'bottom' && !hasNavigationBar && getIncludeNav(screenId)) {
                toast.error('Generate a bottom navigation bar in Step 4 before including it in this screen.');
                return;
            }

            const quantity = quantityOverride ?? imageCount;
            const isGemini = provider === 'gemini';
            const modelLabel = isGemini
                ? GEMINI_MODELS.find((m) => m.value === googleModel)?.label || googleModel
                : OPENAI_MODELS.find((m) => m.value === openaiModel)?.label || openaiModel;
            const providerLabel = isGemini ? 'Gemini' : 'OpenAI';

            // Smart logic check for Gemini
            if (isGemini) {
                const screenIncludeNav = getIncludeNav(screenId);
                const screenIncludeLogo = getIncludeLogo(screenId);
                const screenHasRefs = (screenIncludeNav && hasNavigationBar) || (screenIncludeLogo && splashLogoUrl);

                if (screenHasRefs && googleModel === 'nano-banana') {
                    toast.error(`"${screen.name}" has branding enabled (Nav/Logo), but Gemini Nano Banana Standard does not support it. Please switch to Gemini Nano Banana Pro.`);
                    return;
                }

                if (!screenHasRefs && googleModel === 'nano-banana-edit') {
                    toast.error(`"${screen.name}" does not have branding enabled, but Gemini Nano Banana Edit requires reference images. Please switch to Standard or Pro.`);
                    return;
                }
            }

            const includeNav = getIncludeNav(screenId);
            const includeLogo = getIncludeLogo(screenId);
            const prompt = buildScreenPrompt(screen, includeNav, includeLogo);

            toast.loading(`Drafting ${screen.name}...`, { id: `gen-${screenId}` });
            setActiveRequests((count) => count + 1);
            setGeneratingScreens((prev) => ({ ...prev, [screenId]: true }));

            try {
                const newVariations: Step5Data['generatedScreens'][0]['variations'] = [];

                for (let i = 0; i < quantity; i++) {
                    const body: Record<string, unknown> = {
                        prompt,
                        provider,
                        googleModel: isGemini ? googleModel : undefined,
                        openaiModel: !isGemini ? openaiModel : undefined,
                        outputFormat: 'png',
                        aspectRatio,
                    };

                    // Collect reference images
                    const referenceImages: string[] = [];
                    let hasInvalidReferences = false;

                    // Add splash logo if enabled
                    if (includeLogo && splashLogoUrl) {
                        const originalLogoUrl = getOriginalUrl(splashLogoUrl);
                        console.log('[Step5] Logo URL:', splashLogoUrl);
                        console.log('[Step5] Original Logo URL:', originalLogoUrl);
                        if (originalLogoUrl) {
                            referenceImages.push(originalLogoUrl);
                        } else if (splashLogoUrl) {
                            hasInvalidReferences = true;
                            console.error('[Step5] Logo URL is invalid (likely a data URL)');
                        }
                    }

                    // Add navigation bar if enabled for this screen
                    if (includeNav && hasNavigationBar && navigationState.generatedNavBar) {
                        const navUrl = navigationState.generatedNavBar.url;
                        const originalNavUrl = getOriginalUrl(navUrl);
                        console.log('[Step5] Nav URL:', navUrl);
                        console.log('[Step5] Original Nav URL:', originalNavUrl);
                        if (originalNavUrl) {
                            referenceImages.push(originalNavUrl);
                        } else if (navUrl) {
                            hasInvalidReferences = true;
                            console.error('[Step5] Navigation URL is invalid (likely a data URL)');
                        }
                    }

                    // If we have invalid references, show error and skip
                    if (hasInvalidReferences) {
                        throw new Error('Reference images must be uploaded to a server first. Data URLs are not supported by the image generation API. Please regenerate your logo or navigation bar.');
                    }

                    console.log('[Step5] Final reference images array:', referenceImages);

                    // Only add referenceImages if we have any
                    if (referenceImages.length > 0) {
                        body.referenceImages = referenceImages;
                    }

                    const response = await fetch('/api/test/image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });

                    const data: GenerationResponse | null = await response.json().catch(() => null);
                    if (!response.ok || !data?.success || !data?.imageUrl) {
                        const error: any = new Error(data?.error || 'Failed to generate screen image');
                        error.status = response.status;
                        throw error;
                    }

                    newVariations.push({
                        id: `${screenId}-${Date.now()}-${i}`,
                        url: getSafeImageUrl(data.imageUrl),
                        prompt,
                        provider: providerLabel,
                        model: modelLabel,
                        creditsUsed: data.creditsUsed ?? 6,
                        createdAt: new Date().toISOString(),
                    });
                }

                if (!newVariations.length) {
                    throw new Error('No images were generated');
                }

                const creditDelta = newVariations.reduce(
                    (sum, variation) => sum + (variation.creditsUsed || 0),
                    0
                );

                const existing = step5.generatedScreens.find((g) => g.screenId === screen.id);
                let updatedScreens: Step5Data['generatedScreens'];

                if (existing) {
                    const mergedVariations = [...existing.variations, ...newVariations];
                    const selectedVariation =
                        mergedVariations.find((variation) => variation.id === existing.selectedVariationId) ||
                        mergedVariations[mergedVariations.length - newVariations.length] ||
                        mergedVariations[0];

                    updatedScreens = step5.generatedScreens.map((g) =>
                        g.screenId === screen.id
                            ? {
                                ...g,
                                url: selectedVariation?.url ?? g.url,
                                prompt,
                                provider: providerLabel,
                                model: modelLabel,
                                creditsUsed: g.creditsUsed + creditDelta,
                                variations: mergedVariations,
                                selectedVariationId: selectedVariation?.id ?? null,
                            }
                            : g
                    );
                } else {
                    const defaultVariation = newVariations[0];
                    updatedScreens = [
                        ...step5.generatedScreens,
                        {
                            screenId: screen.id,
                            type: screen.type,
                            name: screen.name,
                            url: defaultVariation?.url ?? null,
                            prompt,
                            provider: providerLabel,
                            model: modelLabel,
                            creditsUsed: creditDelta,
                            selected: true,
                            selectedVariationId: defaultVariation?.id ?? null,
                            variations: newVariations,
                        },
                    ];
                    setSelectedScreenId((prev) => prev ?? screen.id);
                }

                updateStep5Data({
                    generatedScreens: updatedScreens,
                    totalCreditsUsed: step5.totalCreditsUsed + creditDelta,
                });

                toast.success(
                    `Generated ${newVariations.length} design${newVariations.length > 1 ? 's' : ''} for ${screen.name}`
                );
            } catch (error) {
                console.error('[Screen Generation]', error);

                // Dismiss the loading toast first
                toast.dismiss(`gen-${screenId}`);

                let message = 'Your request cannot be processed right now. Please try again in a few moments.';
                let description = 'The design engine may be busy';

                if (error instanceof Error) {
                    // Check for insufficient credits error (402 status or message contains "insufficient credits")
                    const isCreditError = (error as any)?.status === 402 ||
                        error.message.toLowerCase().includes('insufficient credits');

                    if (isCreditError) {
                        console.warn('[Screen Generation] Insufficient credits detected');
                        // Show global alert
                        showAlert({
                            message: 'Insufficient Credits',
                            description: error.message || 'You need more credits to generate this screen. Please add credits or choose a cheaper model.',
                        });
                        return; // Exit early
                    } else if (error.message.includes('Image Service Error') || error.message.includes('failed') || error.message.includes('500')) {
                        // Keep the friendly message but log the technical detail for developers
                        console.error('Technical Error:', error.message);
                        message = `Design Engine unreachable. ${error.message}`;
                    } else {
                        message = error.message;
                    }
                }

                toast.error(message, {
                    id: `gen-${screenId}`,
                    duration: 5000,
                    description
                });
            } finally {
                setGeneratingScreens((prev) => {
                    const next = { ...prev };
                    delete next[screenId];
                    return next;
                });
                setActiveRequests((count) => Math.max(0, count - 1));
            }
        },
        [screens, step5.generatedScreens, step5.totalCreditsUsed, provider, googleModel, openaiModel, imageCount, aspectRatio, buildScreenPrompt, splashLogoUrl, navigationState.confirmed, navigationType, getIncludeNav, getIncludeLogo, hasNavigationBar, navigationState.generatedNavBar]
    );

    const handleGenerateAll = useCallback(async () => {
        if (!screensMissingGeneration.length) return;

        // Pre-validation for Gemini
        if (provider === 'gemini') {
            const invalidScreens = screensMissingGeneration.filter(screen => {
                const screenIncludeNav = getIncludeNav(screen.id);
                const screenIncludeLogo = getIncludeLogo(screen.id);
                const screenHasRefs = (screenIncludeNav && hasNavigationBar) || (screenIncludeLogo && splashLogoUrl);

                if (screenHasRefs && googleModel === 'nano-banana') return true;
                if (!screenHasRefs && googleModel === 'nano-banana-edit') return true;
                return false;
            });

            if (invalidScreens.length > 0) {
                const msg = googleModel === 'nano-banana'
                    ? `Gemini Nano Banana Standard cannot be used for screens with branding (Nav/Logo). Please switch to Pro.`
                    : `Gemini Nano Banana Edit requires branding/references. Please switch to Standard or Pro for pure text generation.`;
                toast.error(msg);
                return;
            }
        }

        for (const screen of screensMissingGeneration) {
            await handleGenerateScreen(screen.id);
        }
    }, [screensMissingGeneration, handleGenerateScreen, provider, googleModel, getIncludeNav, getIncludeLogo, hasNavigationBar, splashLogoUrl]);

    const handleToggleSelection = useCallback(
        (screenId: string) => {
            const updated = step5.generatedScreens.map((gen) =>
                gen.screenId === screenId ? { ...gen, selected: !gen.selected } : gen
            );
            updateStep5Data({ generatedScreens: updated });
        },
        [step5.generatedScreens]
    );

    const handleSelectVariation = useCallback(
        (screenId: string, variationId: string) => {
            const updated = step5.generatedScreens.map((gen) => {
                if (gen.screenId !== screenId) return gen;
                const variation = gen.variations.find((v) => v.id === variationId);
                if (!variation) return gen;
                return {
                    ...gen,
                    url: variation.url,
                    selectedVariationId: variation.id,
                };
            });
            updateStep5Data({ generatedScreens: updated });
        },
        [step5.generatedScreens]
    );

    const handleDeleteVariation = useCallback(
        (screenId: string, variationId: string) => {
            const target = step5.generatedScreens.find((gen) => gen.screenId === screenId);
            if (!target) return;

            const remaining = target.variations.filter((variation) => variation.id !== variationId);

            if (!remaining.length) {
                const updatedScreens = step5.generatedScreens.filter((gen) => gen.screenId !== screenId);
                updateStep5Data({ generatedScreens: updatedScreens });
                if (selectedScreenId === screenId) {
                    setSelectedScreenId(null);
                }
                return;
            }

            const nextSelected =
                remaining.find((variation) => variation.id === target.selectedVariationId) ||
                remaining[0];

            const updatedScreens = step5.generatedScreens.map((gen) =>
                gen.screenId === screenId
                    ? {
                        ...gen,
                        variations: remaining,
                        url: nextSelected?.url ?? null,
                        selectedVariationId: nextSelected?.id ?? null,
                    }
                    : gen
            );
            updateStep5Data({ generatedScreens: updatedScreens });
        },
        [step5.generatedScreens, selectedScreenId]
    );

    const handleDeleteScreen = useCallback(
        (screenId: string) => {
            const updatedScreens = step5.generatedScreens.filter((gen) => gen.screenId !== screenId);
            updateStep5Data({ generatedScreens: updatedScreens });
            if (selectedScreenId === screenId) {
                setSelectedScreenId(null);
            }
            setScreenPendingDelete(null);
        },
        [step5.generatedScreens, selectedScreenId]
    );

    const handleEditScreen = useCallback(async () => {
        if (!screenToEdit || !editPrompt.trim()) return;

        const originalSource = getOriginalUrl(screenToEdit.url);
        if (!originalSource) {
            toast.error('Source image is not valid for editing. Ensure it is a permanent URL.');
            return;
        }

        toast.loading('Applying AI changes...', { id: `edit-${screenToEdit.id}` });
        setActiveRequests((count) => count + 1);
        try {
            const modelConfig = EDIT_MODELS.find(m => m.value === editModel);
            const isGemini = modelConfig?.provider === 'gemini';

            const response = await fetch('/api/test/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: editPrompt,
                    provider: modelConfig?.provider || 'gemini',
                    googleModel: isGemini ? editModel : undefined,
                    seedreamModel: editModel === 'seedream-4.5-edit' ? editModel : undefined,
                    qwenModel: editModel === 'qwen-image-edit' ? editModel : undefined,
                    outputFormat: 'png',
                    aspectRatio: aspectRatio,
                    referenceImages: [originalSource],
                }),
            });

            const data = await response.json();
            if (!response.ok || !data?.success || !data?.imageUrl) {
                const error: any = new Error(data?.error || 'Failed to edit screen');
                error.status = response.status;
                throw error;
            }

            const providerName =
                modelConfig?.provider === 'gemini' ? 'Gemini' :
                    modelConfig?.provider === 'seedream-4.5-edit' ? 'Seedream' :
                        modelConfig?.provider === 'gpt-image-1' ? 'OpenAI' :
                            'Qwen';

            const newVariation = {
                id: `${screenToEdit.id}-edit-${Date.now()}`,
                url: getSafeImageUrl(data.imageUrl),
                originalUrl: data.imageUrl,
                prompt: editPrompt,
                provider: providerName,
                model: modelConfig?.label || editModel,
                creditsUsed: data.creditsUsed || 18,
                createdAt: new Date().toISOString(),
            };

            const updatedScreens = step5.generatedScreens.map((gen) => {
                if (gen.screenId !== screenToEdit.id) return gen;

                const mergedVariations = [...gen.variations, newVariation];
                return {
                    ...gen,
                    variations: mergedVariations,
                    url: newVariation.url,
                    selectedVariationId: newVariation.id,
                    creditsUsed: gen.creditsUsed + (newVariation.creditsUsed || 0),
                };
            });

            updateStep5Data({
                generatedScreens: updatedScreens,
                totalCreditsUsed: step5.totalCreditsUsed + (newVariation.creditsUsed || 0),
            });

            toast.success('Design updated successfully', { id: `edit-${screenToEdit.id}` });
        } catch (error) {
            console.error('[Screen Edit Error]', error);

            // Dismiss the loading toast first
            toast.dismiss(`edit-${screenToEdit.id}`);

            let message = 'Failed to edit screen';
            let description: string | undefined = undefined;

            if (error instanceof Error) {
                // Check for insufficient credits error (402 status or message contains "insufficient credits")
                const isCreditError = (error as any)?.status === 402 ||
                    error.message.toLowerCase().includes('insufficient credits');

                if (isCreditError) {
                    console.warn('[Screen Edit] Insufficient credits detected');
                    // Show global alert
                    showAlert({
                        message: 'Insufficient Credits',
                        description: error.message || 'You need more credits to edit this screen. Please add credits or choose a cheaper model.',
                    });
                    return; // Exit early
                } else {
                    message = error.message;
                }
            }

            toast.error(message, {
                id: `edit-${screenToEdit.id}`,
                description,
                duration: 5000
            });
        } finally {
            setIsEditingScreen(false);
            setEditPrompt('');
            setScreenToEdit(null);
            setActiveRequests((count) => Math.max(0, count - 1));
        }
    }, [screenToEdit, editPrompt, editModel, aspectRatio, step5.generatedScreens, step5.totalCreditsUsed]);

    const handleSaveManualEdit = useCallback(async (editedImageUrl: string) => {
        if (!screenToManualEdit) return;

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

        const safeUrl = getSafeImageUrl(finalUrl);
        const updatedScreens = step5.generatedScreens.map((gen) => {
            if (gen.screenId !== screenToManualEdit.id) return gen;

            const variationIndex = gen.variations.findIndex(v => v.id === screenToManualEdit.variationId);
            if (variationIndex === -1) return gen;

            const updatedVariations = [...gen.variations];
            updatedVariations[variationIndex] = {
                ...updatedVariations[variationIndex],
                url: safeUrl,
                originalUrl: finalUrl,
            };

            return {
                ...gen,
                variations: updatedVariations,
                url: gen.selectedVariationId === screenToManualEdit.variationId ? safeUrl : gen.url,
            };
        });

        updateStep5Data({
            generatedScreens: updatedScreens,
        });

        toast.success('Screen edited successfully');
        setIsManualEditing(false);
        setScreenToManualEdit(null);
    }, [screenToManualEdit, step5.generatedScreens]);


    return (
        <>
            <div className="w-[1210px] max-h-[85vh] overflow-y-auto custom-scrollbar pointer-events-auto bg-[#11121D] border-2 border-[#1F243B] rounded-2xl p-10 pb-60 shadow-2xl text-white">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold mb-1">Step 5: Screen Generation</h2>
                        <p className="text-sm text-slate-100 font-medium">
                            Generate multi-variation designs for each key screen
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Credits Used</p>
                            <p className="text-2xl font-black text-blue-400">{step5.totalCreditsUsed}</p>
                        </div>
                        <button
                            onClick={() => window.open("/credits", "_blank")}
                            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors flex items-center gap-2"
                            title="Top up your credits"
                        >
                            <div className="i-ph:coins text-lg" />
                            Top Up Credits
                        </button>                        <button
                            onClick={handleGenerateAll}
                            disabled={isBusy || !screensMissingGeneration.length}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <div className="i-ph:sparkle text-lg" />
                            {isBusy ? 'Generating...' : `Generate All (${screensMissingGeneration.length})`}
                        </button>
                    </div>
                </div>

                {navigationType === 'none' && (
                    <p className="text-xs text-blue-300 mt-2 flex items-center gap-2">
                        <div className="i-ph:info" />
                        No bottom navigation - all screens will be generated in full-screen mode.
                    </p>
                )}

                {/* Brand Assets & Navigation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 mt-4">
                    {/* Brand Logo Card */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-[#1A1F32] to-[#141828] border border-[#1F243B] hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300 shadow-lg">
                        <div className="flex items-center gap-5">
                            <div className="relative w-20 h-20 rounded-xl bg-slate-900 border border-[#2F344B] group-hover:border-blue-500/40 flex items-center justify-center overflow-hidden transition-all duration-300">
                                {splashLogoUrl ? (
                                    <img src={splashLogoUrl} alt="Brand Logo" className="w-full h-full object-contain p-2" crossOrigin="anonymous" />
                                ) : (
                                    <div className="i-ph:image-square text-3xl text-slate-700" />
                                )}
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        Visual Identity
                                    </span>
                                </div>
                                <h4 className="text-base font-semibold text-white mb-1">Brand Logo</h4>
                                <p className="text-[11px] text-slate-100 leading-tight font-medium">
                                    {splashLogoUrl ? 'Configured in Step 3. Used for splash screens & branding.' : 'No logo selected. Add one in Step 3.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Structure Card */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-[#1A1F32] to-[#141828] border border-[#1F243B] hover:border-emerald-500/30 rounded-2xl p-5 transition-all duration-300 shadow-lg">
                        <div className="flex items-center gap-5">
                            <div className="relative w-20 h-20 rounded-xl bg-slate-900 border border-[#2F344B] group-hover:border-emerald-500/40 flex items-center justify-center overflow-hidden transition-all duration-300">
                                {hasNavigationBar && navigationState.generatedNavBar ? (
                                    <img src={navigationState.generatedNavBar.url} alt="Nav Bar" className="w-full h-full object-contain px-1" />
                                ) : (
                                    <div className="i-ph:navigation-arrow text-3xl text-slate-700" />
                                )}
                                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        UX Structure
                                    </span>
                                </div>
                                <h4 className="text-base font-semibold text-white mb-1">Global Navigation</h4>
                                <p className="text-[11px] text-slate-100 leading-tight font-medium">
                                    {hasNavigationBar ? 'Selected in Step 4. Can be toggled on specific screens.' : 'No navigation bar selected in Step 4.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 bg-[#171C2D]/50 border border-[#1F243B] rounded-2xl p-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-200 font-black mb-1.5">Engine</p>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value as ProviderOption)}
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0F1C] border border-[#1F243B] focus:border-blue-500 outline-none text-sm transition-all"
                        >
                            <option value="gemini">Gemini</option>
                            <option value="openai">OpenAI</option>
                        </select>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-200 font-black mb-1.5">Model</p>
                        <select
                            value={provider === 'gemini' ? googleModel : openaiModel}
                            onChange={(e) =>
                                provider === 'gemini'
                                    ? setGoogleModel(e.target.value)
                                    : setOpenaiModel(e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0F1C] border border-[#1F243B] focus:border-blue-500 outline-none text-sm transition-all"
                        >
                            {(provider === 'gemini' ? availableGeminiModels : OPENAI_MODELS).map((model) => (
                                <option key={model.value} value={model.value}>
                                    {model.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-200 font-black mb-1.5">Variations</p>
                        <select
                            value={imageCount}
                            onChange={(e) => setImageCount(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0F1C] border border-[#1F243B] focus:border-blue-500 outline-none text-sm transition-all"
                        >
                            {IMAGE_COUNT_OPTIONS.map((count) => (
                                <option key={count} value={count}>
                                    {count} {count === 1 ? 'Variant' : 'Variants'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-200 font-black mb-1.5">Aspect ratio</p>
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#0B0F1C] border border-[#1F243B] focus:border-blue-500 outline-none text-sm transition-all"
                        >
                            {ASPECT_RATIO_OPTIONS.map((ratio) => (
                                <option key={ratio} value={ratio}>
                                    {ratio}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2 px-3 py-2 h-fit bg-blue-500/5 border border-blue-500/20 rounded-lg">
                            <div className="i-ph:info text-blue-400 text-sm" />
                            <span className="text-[11px] text-blue-300 leading-tight">Assets are auto-injected.</span>
                        </div>
                    </div>
                </div>

                {!screens.length && (
                    <div className="border border-dashed border-[#1F243B] bg-[#171C2D]/30 rounded-2xl p-12 text-center text-slate-500">
                        <div className="i-ph:browser text-4xl mx-auto mb-4 opacity-20" />
                        <p className="text-sm">Add screens in Step 4 to start generating designs.</p>
                    </div>
                )}

                {screens.length > 0 && (
                    <div className="flex gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                    <div className="i-ph:stack-simple" />
                                    Project Screens ({screens.length})
                                </h3>
                            </div>

                            {screens.map((screen) => {
                                const generated = step5.generatedScreens.find((g) => g.screenId === screen.id);
                                const isActive = selectedScreenId === screen.id;

                                return (
                                    <div
                                        key={screen.id}
                                        className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-300 ${isActive
                                            ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_-10px_rgba(59,130,246,0.3)]'
                                            : 'border-[#1F243B] bg-[#171C2D]/50 hover:border-[#2F344B] hover:bg-[#171C2D]'
                                            }`}
                                        onClick={() => setSelectedScreenId(screen.id)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1.5 text-ellipsis overflow-hidden">
                                                    <h4 className={`font-semibold transition-colors ${isActive ? 'text-white' : 'text-slate-200'}`}>{screen.name}</h4>
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight bg-[#242A42] text-slate-400 border border-[#2F344B]">
                                                        {screen.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-300 mb-4 line-clamp-1 group-hover:line-clamp-none transition-all font-medium">
                                                    {screen.purpose || 'Core experience screen'}
                                                </p>

                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {hasNavigationBar && navigationType !== 'none' && (
                                                        <div
                                                            className="flex items-center gap-3 bg-[#0B0F1C] rounded-lg px-2.5 py-1.5 w-fit border border-[#1F243B] hover:border-blue-500/30 transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only peer"
                                                                    checked={getIncludeNav(screen.id)}
                                                                    onChange={() => toggleIncludeNav(screen.id)}
                                                                />
                                                                <div className="w-7 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                                                                <span className="ml-2 text-[10px] font-black text-slate-400 peer-checked:text-blue-300 uppercase tracking-wide transition-colors">
                                                                    Nav
                                                                </span>
                                                            </label>
                                                        </div>
                                                    )}

                                                    {splashLogoUrl && (
                                                        <div
                                                            className="flex items-center gap-3 bg-[#0B0F1C] rounded-lg px-2.5 py-1.5 w-fit border border-[#1F243B] hover:border-amber-500/30 transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only peer"
                                                                    checked={getIncludeLogo(screen.id)}
                                                                    onChange={() => toggleIncludeLogo(screen.id)}
                                                                />
                                                                <div className="w-7 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600"></div>
                                                                <span className="ml-2 text-[10px] font-bold text-slate-500 peer-checked:text-amber-400 uppercase tracking-wide transition-colors">
                                                                    Logo
                                                                </span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3 min-w-[120px]">
                                                {generated ? (
                                                    <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded text-[10px] font-bold text-green-400 uppercase tracking-wide">
                                                        <div className="i-ph:check-bold text-sm" />
                                                        {generated.variations.length} {generated.variations.length === 1 ? 'VARIANT' : 'VARIANTS'}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                                        Empty
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleGenerateScreen(screen.id);
                                                        }}
                                                        disabled={isBusy || isScreenGenerating(screen.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${isScreenGenerating(screen.id)
                                                            ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none'
                                                            }`}
                                                    >
                                                        {isScreenGenerating(screen.id) ? 'Working...' : generated ? 'Keep Going' : 'Generate'}
                                                    </button>
                                                    {generated && !isScreenGenerating(screen.id) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setScreenPendingDelete(screen.id);
                                                            }}
                                                            disabled={isBusy}
                                                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all text-slate-500"
                                                            title="Clear variations"
                                                        >
                                                            <div className="i-ph:trash text-base" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                        <div className="w-[500px] bg-[#171C2D] border border-[#1F243B] rounded-xl p-6">
                            {selectedScreen ? (
                                selectedGenerated ? (
                                    selectedGenerated.variations.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-500 text-center text-sm px-6">
                                            No mockups for {selectedGenerated.name}. Generate this screen to preview AI variations.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{selectedGenerated.name}</h3>
                                                    <p className="text-xs text-slate-400">
                                                        {selectedScreen.purpose || 'Core experience screen'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleSelection(selectedGenerated.screenId)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedGenerated.selected
                                                        ? 'bg-green-500/20 text-green-200 border border-green-500/50'
                                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                        }`}
                                                >
                                                    {selectedGenerated.selected ? (
                                                        <span className="flex items-center gap-1">
                                                            <div className="i-ph:check text-sm" />
                                                            Selected
                                                        </span>
                                                    ) : (
                                                        'Select'
                                                    )}
                                                </button>
                                            </div>

                                            <div className="rounded-lg border-2 border-[#1F243B] bg-slate-900 aspect-[9/16] mb-3 flex items-center justify-center overflow-hidden relative">
                                                {selectedGenerated.url ? (
                                                    <img
                                                        src={selectedGenerated.url}
                                                        alt={selectedGenerated.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-slate-500 text-sm text-center px-6">
                                                        No active variation. Select one from the list below.
                                                    </div>
                                                )}
                                                {selectedGenerated.url && (
                                                    <button
                                                        className="absolute bottom-3 right-3 text-xs bg-black/60 px-3 py-1.5 rounded-full border border-white/10"
                                                        onClick={() =>
                                                            setViewingVariation({
                                                                url: selectedGenerated.url!,
                                                                title: selectedGenerated.name,
                                                            })
                                                        }
                                                    >
                                                        View full size
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs text-slate-400">
                                                    Variations ({selectedGenerated.variations.length})
                                                </p>
                                                <button
                                                    onClick={() => handleGenerateScreen(selectedGenerated.screenId)}
                                                    disabled={isBusy || isScreenGenerating(selectedGenerated.screenId)}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                                                >
                                                    + Generate variation
                                                </button>
                                            </div>

                                            {selectedGenerated.variations.length === 0 ? (
                                                <div className="text-xs text-slate-500 border border-dashed border-slate-600 rounded-lg p-4">
                                                    Generate images to see variations here.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-2 mb-4">
                                                    {selectedGenerated.variations.map((variation) => {
                                                        const isActive = variation.id === selectedGenerated.selectedVariationId;
                                                        return (
                                                            <div
                                                                key={variation.id}
                                                                className={`relative rounded border bg-slate-900 aspect-[9/16] overflow-hidden cursor-pointer group ${isActive ? 'border-blue-500' : 'border-[#1F243B]'
                                                                    }`}
                                                                onClick={() => handleSelectVariation(selectedGenerated.screenId, variation.id)}
                                                            >
                                                                <img
                                                                    src={variation.url}
                                                                    alt="Variation"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-xs">
                                                                    <button
                                                                        className="px-3 py-1 rounded-full bg-white text-black text-[11px] font-bold"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setViewingVariation({ url: variation.url, title: selectedGenerated.name });
                                                                        }}
                                                                    >
                                                                        View
                                                                    </button>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setScreenToEdit({ id: selectedGenerated.screenId, url: variation.url, variationId: variation.id });
                                                                                setIsEditingScreen(true);
                                                                            }}
                                                                        >
                                                                            AI Edit
                                                                        </button>
                                                                        <button
                                                                            className="px-3 py-1 rounded-full bg-amber-600 text-white text-[11px] font-bold"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setScreenToManualEdit({ id: selectedGenerated.screenId, url: variation.url, variationId: variation.id });
                                                                                setIsManualEditing(true);
                                                                            }}
                                                                        >
                                                                            Manual
                                                                        </button>
                                                                    </div>
                                                                    <button
                                                                        className="px-3 py-1 rounded-full bg-red-500/80 text-white text-[11px] font-bold"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteVariation(selectedGenerated.screenId, variation.id);
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                                {isActive && (
                                                                    <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                                                        Active
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div className="space-y-2 text-xs text-slate-400 border-t border-slate-700 pt-3">
                                                <div className="flex justify-between">
                                                    <span>Provider</span>
                                                    <span className="text-white">{selectedGenerated.provider}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Model</span>
                                                    <span className="text-white">{selectedGenerated.model}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Credits Used</span>
                                                    <span className="text-white">{selectedGenerated.creditsUsed}</span>
                                                </div>
                                                <div className="pt-2">
                                                    <p className="text-slate-400 mb-1">Prompt</p>
                                                    <p className="text-white text-xs leading-relaxed">
                                                        {selectedGenerated.prompt}
                                                    </p>
                                                </div>
                                            </div>

                                        </>
                                    )
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500 text-center text-sm px-6">
                                        No mockups for {selectedScreen.name}.
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500">
                                    <div className="text-center">
                                        <div className="i-ph:cursor-click text-4xl mb-2" />
                                        <p className="text-sm">Select a screen to view details</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step5.generatedScreens.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-700 flex items-center justify-between text-sm">
                        <div className="text-slate-400">
                            Generated:{' '}
                            <strong className="text-white">{step5.generatedScreens.length}</strong> of{' '}
                            <strong className="text-white">{screens.length}</strong> screens
                        </div>
                        <div className="text-slate-400">
                            Selected:{' '}
                            <strong className="text-green-400">
                                {step5.generatedScreens.filter((g) => g.selected).length}
                            </strong>{' '}
                            screens for app
                        </div>
                    </div>
                )}
            </div>

            {typeof window !== 'undefined' && viewingVariation
                ? createPortal(
                    <div
                        className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setViewingVariation(null)}
                    >
                        <div
                            className="bg-[#0b0c14] border border-[#1F243B] rounded-2xl p-4 shadow-2xl max-w-3xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">{viewingVariation.title}</h3>
                                <button
                                    onClick={() => setViewingVariation(null)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <div className="i-ph:x text-2xl" />
                                </button>
                            </div>
                            <div className="h-[70vh] flex items-center justify-center">
                                <img
                                    src={viewingVariation.url}
                                    alt={viewingVariation.title}
                                    className="max-h-full max-w-full rounded-xl border border-[#1F243B] object-contain"
                                />
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null
            }

            {typeof window !== 'undefined' && screenPendingDelete
                ? createPortal(
                    <div
                        className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setScreenPendingDelete(null)}
                    >
                        <div
                            className="bg-[#0b0c14] border border-[#1F243B] rounded-2xl p-6 shadow-2xl w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Delete screen?</h3>
                                <button
                                    onClick={() => setScreenPendingDelete(null)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <div className="i-ph:x text-2xl" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-300 mb-6">
                                This will remove all generated mockups for this screen. You can regenerate it later if
                                needed.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setScreenPendingDelete(null)}
                                    className="px-4 py-2 rounded-lg bg-[#2a2a2a] border border-[#333] text-sm text-white hover:bg-[#333] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteScreen(screenPendingDelete)}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null
            }

            {typeof window !== 'undefined' && isEditingScreen && screenToEdit
                ? createPortal(
                    <div
                        className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => {
                            if (!isBusy) {
                                setIsEditingScreen(false);
                                setScreenToEdit(null);
                            }
                        }}
                    >
                        <div
                            className="bg-[#0b0c14] border border-[#1F243B] rounded-2xl p-6 shadow-2xl w-full max-w-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <div className="i-ph:sparkle text-blue-400" />
                                    AI Design Editor
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsEditingScreen(false);
                                        setScreenToEdit(null);
                                    }}
                                    className="text-slate-400 hover:text-white transition-colors"
                                    disabled={isBusy}
                                >
                                    <div className="i-ph:x text-2xl" />
                                </button>
                            </div>

                            <div className="flex gap-4 mb-6">
                                <div className="w-1/3 aspect-[9/16] rounded-lg border border-[#1F243B] overflow-hidden bg-slate-900">
                                    <img src={screenToEdit.url} alt="To Edit" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                            Edit Model
                                        </label>
                                        <select
                                            value={editModel}
                                            onChange={(e) => setEditModel(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-[#0B0F1C] border border-[#1F243B] focus:border-blue-500 outline-none text-sm transition-all text-white"
                                            disabled={isBusy}
                                        >
                                            {EDIT_MODELS.map((model) => (
                                                <option key={model.value} value={model.value}>
                                                    {model.label} ({model.provider})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                            What would you like to change?
                                        </label>
                                        <textarea
                                            value={editPrompt}
                                            onChange={(e) => setEditPrompt(e.target.value)}
                                            placeholder="e.g. Change the background to a dark gradient, make the buttons more rounded, add a glassmorphism effect to the cards..."
                                            className="w-full h-32 px-3 py-2 rounded-lg bg-[#0B0F1C] border border-[#1F243B] focus:border-blue-500 outline-none text-sm transition-all resize-none text-white"
                                            disabled={isBusy}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-[#1F243B]">
                                <button
                                    onClick={() => {
                                        setIsEditingScreen(false);
                                        setScreenToEdit(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-[#2a2a2a] border border-[#333] text-sm text-white hover:bg-[#333] transition-colors disabled:opacity-50"
                                    disabled={isBusy}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditScreen}
                                    disabled={isBusy || !editPrompt.trim()}
                                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:bg-slate-700 shadow-lg shadow-blue-500/20"
                                >
                                    {isBusy ? (
                                        <>
                                            <div className="i-ph:circle-notch animate-spin" />
                                            Updating Design...

                                        </>
                                    ) : (
                                        <>
                                            <div className="i-ph:sparkle" />
                                            Apply AI Edits

                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null
            }

            {typeof window !== 'undefined' && isManualEditing && screenToManualEdit
                ? createPortal(
                    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[#0b0c14] border border-[#1F243B] rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-[#1F243B] flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <div className="i-ph:paint-brush text-amber-400" />
                                    Manual Design Editor
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsManualEditing(false);
                                        setScreenToManualEdit(null);
                                    }}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <div className="i-ph:x text-2xl" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <ImageEditor
                                    imageUrl={screenToManualEdit.url}
                                    onSave={(url) => handleSaveManualEdit(url)}
                                    onCancel={() => {
                                        setIsManualEditing(false);
                                        setScreenToManualEdit(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null
            }
        </>
    );
}
