import { atom } from 'nanostores';

// Step 1: App Information
export interface Step1Data {
    appName: string;
    description: string;
    category: string;
    targetAudience: string;
    platform: 'ios' | 'android' | 'both';
    primaryGoal: string;
    dataDescription?: string;
    parallelReady?: boolean;
    additionalDetails?: string;
    dataModels: DataModel[];
}

export interface DataModel {
    id: string;
    name: string;
    description: string;
    fields: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'reference';
        required: boolean;
        description?: string;
        referenceModel?: string;
    }>;
}

// Step 2: Style & Personality (Inspiration Gathering)
export interface Step2Data {
    referenceImages: Array<{
        id: string;
        url: string;
        file?: File;
        source: 'upload' | 'paste';
    }>;
    typography: '' | 'serif' | 'sans-serif' | 'monospace' | 'handwritten';
    uiStyle: '' | 'minimal' | 'modern' | 'playful' | 'elegant' | 'bold';
    personality: '' | 'professional' | 'friendly' | 'energetic' | 'calm' | 'luxurious';
    components: '' | 'rounded' | 'sharp' | 'mixed';
    colorPreferences: {
        primary: string;
        secondary: string;
        useAutoGenerate: boolean;
    };
    additionalNotes: string;
}

// Step 3: Brand Assets (Logo Generation)
export interface Step3Data {
    logo: {
        url: string;
        prompt: string;
        format: 'png' | 'svg';
        selectedVariation: number;
    } | null;
    logoVariations: Array<{
        id: string;
        url: string;
        prompt: string;
    }>;
    entryMode: 'ai' | 'manual';
    logoTextMode: 'symbol-only' | 'with-text';
    lastExtractedImageIds?: string[]; // Track which images were used for last style extraction
    colorPalette: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        text: {
            primary: string;
            secondary: string;
            disabled: string;
        };
        error: string;
        success: string;
        warning: string;
    } | null;
    typography: {
        fontFamily: string;
        scale: {
            h1: { size: number; weight: string; lineHeight: number };
            h2: { size: number; weight: string; lineHeight: number };
            h3: { size: number; weight: string; lineHeight: number };
            body: { size: number; weight: string; lineHeight: number };
            caption: { size: number; weight: string; lineHeight: number };
        };
    } | null;
    paletteOptions: Array<{
        id: string;
        name: string;
        summary: string;
        colors: Array<{
            role: string;
            hex: string;
            description?: string;
            usage?: string;
        }>;
        keywords?: string[];
    }>;
    typographyOptions: Array<{
        id: string;
        name: string;
        headingFont: string;
        bodyFont: string;
        vibe: string;
        description: string;
        sampleText: string;
        scale: {
            h1: { size: number; weight: string; lineHeight: number };
            h2: { size: number; weight: string; lineHeight: number };
            h3: { size: number; weight: string; lineHeight: number };
            body: { size: number; weight: string; lineHeight: number };
            caption: { size: number; weight: string; lineHeight: number };
        };
        tags?: string[];
    }>;
    styleDirections: Array<{
        id: string;
        name: string;
        description: string;
        uiStyle: string;
        keywords: string[];
        personality: string[];
    }>;
    selectedPaletteId: string | null;
    selectedTypographyId: string | null;
    selectedStyleId: string | null;
    lastExtractedAt: string | null;
    extractionStatus: 'idle' | 'extracting' | 'error' | 'complete';
    extractionError?: string;
    logoProcessStatus: 'idle' | 'generating' | 'error' | 'complete';
}

// Step 4: Screen Flow Mapping
export interface Step4Data {
    screens: Array<{
        id: string;
        name: string;
        type:
        | 'splash'
        | 'signin'
        | 'signup'
        | 'home'
        | 'profile'
        | 'settings'
        | 'custom'
        | 'scanner'
        | 'onboarding';
        purpose: string;
        keyElements: string[];
        position: { x: number; y: number };
    }>;
    connections: Array<{
        from: string;
        to: string;
    }>;
    initialScreen: string;
    authRequired: boolean;
    navigation: {
        type: 'bottom' | 'none';
        items: string[];
        confirmed: boolean;
        generatedNavBar: {
            url: string;
            prompt: string;
            provider: string;
            model: string;
        } | null;
        navBarVariations: Array<{
            id: string;
            url: string;
            originalUrl?: string; // Original URL before proxy (for editing)
            prompt: string;
            provider: string;
            model: string;
            createdAt: string;
        }>;
        selectedVariationId: string | null;
    };
}

// Step 5: Screen Generation
export interface Step5Data {
    generatedScreens: Array<{
        screenId: string;
        type: Step4Data['screens'][number]['type'];
        name: string;
        url: string | null;
        prompt: string;
        provider: string;
        model: string;
        creditsUsed: number;
        selected: boolean;
        selectedVariationId: string | null;
        variations: Array<{
            id: string;
            url: string;
            originalUrl?: string;
            prompt: string;
            provider: string;
            model: string;
            creditsUsed: number;
            createdAt: string;
        }>;
    }>;
    totalCreditsUsed: number;
    studioFrames: Array<{
        id: string;
        title?: string;
        html: string;
        x?: number;
        y?: number;
    }>;
    studioSnapshot: string | null;
}

// Step 6: Feature Configuration (Integrations & Data Models)
export interface Step6Data {
    integrations: Array<{
        id: string;
        enabled: boolean;
        config?: Record<string, any>;
    }>;
}


// Step 7: Review & Package Selection
export interface Step7Data {
    selectedPackage: '' | 'basic' | 'complete' | 'premium';
    codeGenerationSettings: {
        framework: 'expo';
        expoRouter: boolean;
        typescript: boolean;
        stylingMethod: 'stylesheet' | 'nativewind';
        includeTests: boolean;
        includeEslint: boolean;
        includePrettier: boolean;
    };
    projectName: string;
    bundleIdentifier: string;
}

export interface DesignWizardData {
    projectId: string | null;
    sessionId: string | null;
    step1: Step1Data;
    step2: Step2Data;
    step3: Step3Data;
    step4: Step4Data;
    step5: Step5Data;
    step6: Step6Data;
    step7: Step7Data;
    currentStep: number;
    completedSteps: number[];
    isComplete: boolean;
    isProcessing?: boolean;
}

const initialDesignData: DesignWizardData = {
    projectId: null,
    sessionId: null,
    step1: {
        appName: '',
        description: '',
        category: '',
        targetAudience: '',
        platform: 'both',
        primaryGoal: '',
        dataDescription: '',
        additionalDetails: '',
        dataModels: [],
    },
    step2: {
        referenceImages: [],
        typography: '',
        uiStyle: '',
        personality: '',
        components: '',
        colorPreferences: {
            primary: '',
            secondary: '',
            useAutoGenerate: true,
        },
        additionalNotes: '',
    },
    step3: {
        logo: null,
        logoVariations: [],
        colorPalette: null,
        typography: null,
        paletteOptions: [],
        typographyOptions: [],
        styleDirections: [],
        selectedPaletteId: null,
        selectedTypographyId: null,
        selectedStyleId: null,
        lastExtractedAt: null,
        lastExtractedImageIds: [],
        extractionStatus: 'idle',
        extractionError: undefined,
        logoProcessStatus: 'idle',
        logoTextMode: 'symbol-only',
        entryMode: 'ai',
    },
    step4: {
        screens: [],
        connections: [],
        initialScreen: '',
        authRequired: false,
        navigation: {
            type: 'bottom',
            items: [],
            confirmed: false,
            generatedNavBar: null,
            navBarVariations: [],
            selectedVariationId: null,
        },
    },
    step5: {
        generatedScreens: [],
        totalCreditsUsed: 0,
        studioFrames: [],
        studioSnapshot: null,
    },
    step6: {
        integrations: [],
    },
    step7: {
        selectedPackage: '',
        codeGenerationSettings: {
            framework: 'expo',
            expoRouter: true,
            typescript: true,
            stylingMethod: 'stylesheet',
            includeTests: false,
            includeEslint: true,
            includePrettier: true,
        },
        projectName: '',
        bundleIdentifier: '',
    },
    currentStep: 1,
    completedSteps: [],
    isComplete: false,
    isProcessing: false,
};

const STORAGE_KEY = 'appforge_design_wizard_state';

const ensureProxyUrl = (url?: string | null) => {
    if (!url) return url;
    if (url.startsWith('/api/image-proxy') || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
};

const extractOriginalUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('/api/image-proxy?url=')) {
        try {
            const parsed = new URL(url, 'http://localhost');
            return parsed.searchParams.get('url');
        } catch {
            return null;
        }
    }
    return url;
};

const migrateNavigationState = (navigation: Step4Data['navigation']) => {
    if (!navigation) return navigation;

    const migratedVariations = (navigation.navBarVariations || []).map((variation) => {
        const originalUrl = variation.originalUrl || extractOriginalUrl(variation.url) || undefined;
        const safeUrl = ensureProxyUrl(variation.url) || variation.url;

        return {
            ...variation,
            url: safeUrl,
            ...(originalUrl ? { originalUrl } : {}),
        };
    });

    const migratedGeneratedNav = navigation.generatedNavBar
        ? {
            ...navigation.generatedNavBar,
            url: ensureProxyUrl(navigation.generatedNavBar.url) || navigation.generatedNavBar.url,
        }
        : navigation.generatedNavBar;

    return {
        ...navigation,
        navBarVariations: migratedVariations,
        generatedNavBar: migratedGeneratedNav,
    };
};

const migrateStoredWizardData = (data: DesignWizardData): DesignWizardData => {
    const migrated = { ...data };

    if (migrated.step4?.navigation) {
        migrated.step4 = {
            ...migrated.step4,
            navigation: migrateNavigationState(migrated.step4.navigation),
        };
    }

    if (!migrated.step6) {
        migrated.step6 = {
            integrations: [],
        };
    } else {
        if (!migrated.step6.integrations) migrated.step6.integrations = [];
        // Migration: Move dataModels from step6 to step1 if present (and step1 doesn't have them)
        if ((migrated.step6 as any).dataModels && (!migrated.step1.dataModels || migrated.step1.dataModels.length === 0)) {
            migrated.step1.dataModels = (migrated.step6 as any).dataModels;
            delete (migrated.step6 as any).dataModels;
        }
    }

    // Ensure step1 has dataModels
    if (!migrated.step1.dataModels) {
        migrated.step1.dataModels = [];
    }

    // Migrate step3 to include lastExtractedImageIds
    if (migrated.step3 && !migrated.step3.lastExtractedImageIds) {
        migrated.step3.lastExtractedImageIds = [];
    }

    // Remove deprecated Convex integrations
    if (migrated.step6?.integrations) {
        migrated.step6.integrations = migrated.step6.integrations.filter(
            i => !['convex', 'convex-auth'].includes(i.id)
        );
    }

    return migrated;
};

// Load initial state from localStorage if available
function getInitialState(): DesignWizardData {
    if (typeof window === 'undefined') {
        return initialDesignData;
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            console.log('[DesignWizard] Restored state from localStorage');
            const migrated = migrateStoredWizardData(parsed);

            // Critical: Never restore isProcessing as true
            return {
                ...migrated,
                isProcessing: false
            };
        }
    } catch (error) {
        console.error('[DesignWizard] Failed to load state from localStorage:', error);
    }

    return initialDesignData;
}

export const designWizardStore = atom<DesignWizardData>(getInitialState());

// Subscribe to store changes and save to localStorage
if (typeof window !== 'undefined') {
    designWizardStore.subscribe((state) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            console.log('[DesignWizard] Auto-saved to localStorage');
        } catch (error) {
            console.error('[DesignWizard] Failed to save to localStorage:', error);
        }
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Update functions for each step
export function updateStep1Data(data: Partial<Step1Data>) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        step1: { ...current.step1, ...data },
    });
}

export function updateStep2Data(data: Partial<Step2Data>) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        step2: { ...current.step2, ...data },
    });
}

export function updateStep3Data(data: Partial<Step3Data>) {
    const current = designWizardStore.get();
    const nextStep3 = { ...current.step3, ...data };
    designWizardStore.set({
        ...current,
        step3: nextStep3,
    });
}

export function updateStep4Data(data: Partial<Step4Data>) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        step4: { ...current.step4, ...data },
    });
}

export function updateStep5Data(data: Partial<Step5Data>) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        step5: { ...current.step5, ...data },
    });
}

export function updateStep6Data(data: Partial<Step6Data>) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        step6: { ...current.step6, ...data },
    });
}

export function updateStep7Data(data: Partial<Step7Data>) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        step7: { ...current.step7, ...data },
    });
}

// Navigation functions
export function setCurrentStep(step: number) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        currentStep: step,
    });
}

export function markStepComplete(step: number) {
    const current = designWizardStore.get();
    if (!current.completedSteps.includes(step)) {
        designWizardStore.set({
            ...current,
            completedSteps: [...current.completedSteps, step].sort(),
        });
    }
}

export function goToNextStep() {
    const current = designWizardStore.get();
    const nextStep = Math.min(current.currentStep + 1, 7);
    markStepComplete(current.currentStep);
    setCurrentStep(nextStep);
}

export function goToPreviousStep() {
    const current = designWizardStore.get();
    const prevStep = Math.max(current.currentStep - 1, 1);
    setCurrentStep(prevStep);
}

export function canProceedToNextStep(): boolean {
    const current = designWizardStore.get();
    const stepValidators: Record<number, () => boolean> = {
        1: isStep1Complete,
        2: isStep2Complete,
        3: isStep3Complete,
        4: isStep4Complete,
        5: isStep5Complete,
        6: isStep6Complete,
        7: isStep7Complete,
    };
    return stepValidators[current.currentStep]?.() ?? false;
}

// Session management
export function setProjectId(projectId: string | null) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        projectId,
    });
}

export function setSessionId(sessionId: string) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        sessionId,
    });
}

export function markDesignComplete() {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        isComplete: true,
    });
}

export function resetDesignWizard() {
    designWizardStore.set(initialDesignData);

    // Clear localStorage
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('[DesignWizard] Cleared localStorage');
        } catch (error) {
            console.error('[DesignWizard] Failed to clear localStorage:', error);
        }
    }
}

export function loadWizardData(data: DesignWizardData) {
    // Ensure we migrate the data if it's from an older version
    const migrated = migrateStoredWizardData(data);
    designWizardStore.set(migrated);
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export function isStep1Complete(): boolean {
    const { step1 } = designWizardStore.get();
    // Only require app name and description to proceed
    return !!(
        step1.appName.trim() &&
        step1.description.trim()
    );
}

export function isStep2Complete(): boolean {
    const { step2 } = designWizardStore.get();
    const { step3 } = designWizardStore.get();
    // Either have at least 1 reference image or manual mode enabled
    const hasReferenceImages = step2.referenceImages.length > 0;
    const manualModeActive = step3.entryMode === 'manual';
    return hasReferenceImages || manualModeActive;
}

export function isStep3Complete(): boolean {
    const { step3 } = designWizardStore.get();
    // Primarily require a logo being selected
    return !!step3.logo;
}

export function isStep4Complete(): boolean {
    const { step4 } = designWizardStore.get();
    // Must have at least 3 screens and an initial screen set
    return step4.screens.length >= 3 && !!step4.initialScreen;
}

export function isStep5Complete(): boolean {
    const { step5 } = designWizardStore.get();
    // Must have generated screens for all screens defined in step 4
    const { step4 } = designWizardStore.get();
    const generatedCount = step5.generatedScreens.filter(s => s.selected).length;
    return generatedCount >= step4.screens.length;
}

export function isStep6Complete(): boolean {
    // Step 6 is always optional - user can proceed with 0 integrations
    return true;
}

export function isStep7Complete(): boolean {
    const { step7 } = designWizardStore.get();
    // Must provide project name (package selection is optional)
    return !!step7.projectName.trim();
}

// ============================================
// STEP 2 SPECIFIC HELPERS (Image Management)
// ============================================

export const MAX_REFERENCE_IMAGES = 8;
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export function addReferenceImage(image: {
    id: string;
    url: string;
    file?: File;
    source: 'upload' | 'paste';
}) {
    const current = designWizardStore.get();
    if (current.step2.referenceImages.length >= MAX_REFERENCE_IMAGES) {
        throw new Error(`Maximum ${MAX_REFERENCE_IMAGES} images allowed`);
    }
    updateStep2Data({
        referenceImages: [...current.step2.referenceImages, image],
    });
}

export function removeReferenceImage(imageId: string) {
    const current = designWizardStore.get();
    updateStep2Data({
        referenceImages: current.step2.referenceImages.filter(img => img.id !== imageId),
    });
}

export function canAddMoreImages(): boolean {
    const current = designWizardStore.get();
    return current.step2.referenceImages.length < MAX_REFERENCE_IMAGES;
}

export function getRemainingImageSlots(): number {
    const current = designWizardStore.get();
    return MAX_REFERENCE_IMAGES - current.step2.referenceImages.length;
}

export function isImageFormatSupported(mimeType: string): boolean {
    return SUPPORTED_IMAGE_FORMATS.includes(mimeType);
}

// ============================================
// DATA EXPORT (For PRD Generation)
// ============================================

export function exportDesignData(): DesignWizardData {
    return designWizardStore.get();
}

export function getDesignSummary() {
    const data = designWizardStore.get();
    return {
        appName: data.step1.appName,
        category: data.step1.category,
        totalScreens: data.step4.screens.length,
        creditsUsed: data.step5.totalCreditsUsed,
        selectedPackage: data.step7.selectedPackage,
        completionPercentage: Math.round((data.completedSteps.length / 7) * 100),
    };
}
export function setIsProcessing(isProcessing: boolean) {
    const current = designWizardStore.get();
    designWizardStore.set({
        ...current,
        isProcessing,
    });
}
