'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AppInfo {
    name: string;
    description: string;
    category: string;
    targetAudience: string;
    brandColors: {
        primary: string;
        secondary: string;
        accent: string;
    };
}

interface SavedScreen {
    id: string;
    type: string;
    name: string;
    url: string;
    stage: number;
}

interface StylePreferences {
    keywords?: string[];
    notes?: string;
    references?: string[];
    typography?: string;
    uiStyle?: string;
    personality?: string[];
    components?: {
        corners: 'rounded' | 'sharp';
        gradient: boolean;
    };
}

interface CustomScreenGeneratorProps {
    appInfo: AppInfo;
    savedLogo: string | null;
    onAddToCart: (screens: SavedScreen[]) => void;
    cartItems: SavedScreen[];
    stylePreferences?: StylePreferences;
}

type Provider = 'gemini' | 'openai';
type OpenAIModel = 'gpt-image-1' | 'dall-e-2' | 'dall-e-3';
type GoogleModel = 'nano-banana' | 'nano-banana-pro' | 'nano-banana-edit';
type OutputFormat = 'png' | 'jpeg';
type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '512';

const PRESET_SCREENS = [
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'home', label: 'Home Screen' },
    { value: 'profile', label: 'Profile' },
    { value: 'settings', label: 'Settings' },
    { value: 'list', label: 'List View' },
    { value: 'detail', label: 'Detail View' },
    { value: 'search', label: 'Search' },
    { value: 'camera', label: 'Camera/Scan' },
    { value: 'other', label: 'Other (Custom)' },
];

const GOOGLE_MODELS: { value: GoogleModel; label: string }[] = [
    { value: 'nano-banana', label: 'Nano Banana' },
    { value: 'nano-banana-pro', label: 'Nano Banana Pro' },
    { value: 'nano-banana-edit', label: 'Nano Banana Edit' },
];

const OPENAI_MODELS: { value: OpenAIModel; label: string }[] = [
    { value: 'gpt-image-1', label: 'GPT Image 1' },
    { value: 'dall-e-2', label: 'DALL·E 2' },
    { value: 'dall-e-3', label: 'DALL·E 3' },
];

const ASPECT_RATIO_OPTIONS: AspectRatio[] = ['1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '512'];
const OUTPUT_FORMAT_OPTIONS: OutputFormat[] = ['png', 'jpeg'];
const TYPOGRAPHY_TONES: Record<string, string> = {
    'modern-sans': 'Modern sans-serif typography, clean and minimal.',
    'serif-elegant': 'Elegant serif typography with editorial flair.',
    'playful-rounded': 'Rounded playful typography with friendly curves.',
    'mono-tech': 'Monospaced futuristic typography inspired by developer tools.',
};

const UI_STYLE_TONES: Record<string, string> = {
    clean: 'Overall layout should feel clean and minimal with soft shadows.',
    pro: 'Overall layout should feel professional with sharp cards.',
    playful: 'Overall layout should feel playful with curvy components.',
    edtech: 'Overall layout should feel EdTech-friendly and approachable.',
};

interface CustomScreen {
    id: string;
    screenType: string;
    customName: string;
    additionalInfo: string;
    url: string | null;
    isGenerating: boolean;
}

const getScreenLabel = (screenType: string, customName: string) => {
    return screenType === 'other'
        ? (customName || 'Custom Screen')
        : PRESET_SCREENS.find(s => s.value === screenType)?.label || screenType;
};

export function CustomScreenGenerator({ appInfo, savedLogo, onAddToCart, cartItems, stylePreferences }: CustomScreenGeneratorProps) {
    const formRef = useRef<HTMLDivElement>(null);
    const [selectedScreenType, setSelectedScreenType] = useState<string>('onboarding');
    const [customScreenName, setCustomScreenName] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [provider, setProvider] = useState<Provider>('gemini');
    const [googleModel, setGoogleModel] = useState<GoogleModel>('nano-banana');
    const [openaiModel, setOpenaiModel] = useState<OpenAIModel>('dall-e-3');
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
    const [generatedScreens, setGeneratedScreens] = useState<CustomScreen[]>([]);
    const [isGeneratingScreen, setIsGeneratingScreen] = useState(false);

    // Image consistency - Clip Tray for reference images
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Handle clipboard paste
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        // Upload the file
                        setIsUploading(true);
                        try {
                            const formData = new FormData();
                            formData.append('file', blob);

                            const response = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData,
                            });

                            const data = await response.json();
                            if (data.url) {
                                if (referenceImages.length < 8 && !referenceImages.includes(data.url)) {
                                    setReferenceImages(prev => [...prev, data.url]);
                                    toast.success('Image added to Clip Tray');
                                } else if (referenceImages.length >= 8) {
                                    toast.error('Clip Tray is full (max 8 images)');
                                }
                            } else {
                                toast.error('Failed to upload image');
                            }
                        } catch (err) {
                            console.error('Upload error:', err);
                            toast.error('Failed to upload image');
                        } finally {
                            setIsUploading(false);
                        }
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [referenceImages]);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingScreen, setEditingScreen] = useState<{ id: string; url: string; screenType: string; customName: string } | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingScreen, setViewingScreen] = useState<{ url: string; title: string } | null>(null);
    const [editProvider, setEditProvider] = useState<Provider>('gemini');
    const [editGoogleModel, setEditGoogleModel] = useState<GoogleModel>('nano-banana');
    const [editOpenaiModel, setEditOpenaiModel] = useState<OpenAIModel>('dall-e-3');
    const [editOutputFormat, setEditOutputFormat] = useState<OutputFormat>('png');
    const [editAspectRatio, setEditAspectRatio] = useState<AspectRatio>('9:16');

    const generatePrompt = (screenType: string, customName: string, extraInfo: string): string => {
        const { name, description, brandColors } = appInfo;

        let basePrompt = '';

        if (screenType === 'other' && customName) {
            basePrompt = `Mobile app screen for "${customName}" in ${name} app. ${description}. `;
        } else {
            const screenLabels: Record<string, string> = {
                onboarding: 'onboarding welcome screen with engaging visuals',
                home: 'home dashboard screen with key features and navigation',
                profile: 'user profile screen with personal information and settings',
                settings: 'settings and preferences screen with organized options',
                list: 'list view screen showing multiple items in an organized layout',
                detail: 'detailed view screen showing comprehensive item information',
                search: 'search screen with input field and filter options',
                camera: 'camera/scan screen with viewfinder and capture controls',
            };

            basePrompt = `Mobile app ${screenLabels[screenType] || screenType} for ${name}. ${description}. `;
        }

        // Add brand colors if available
        if (brandColors && brandColors.primary) {
            basePrompt += `Modern, clean UI design with primary color ${brandColors.primary}, `;
            basePrompt += `secondary color ${brandColors.secondary}, and accent color ${brandColors.accent}. `;
        } else {
            basePrompt += `Modern, clean UI design. `;
        }

        basePrompt += `Professional mobile interface, intuitive layout, high-quality design.`;

        const styleParts: string[] = [];
        if (stylePreferences?.typography && TYPOGRAPHY_TONES[stylePreferences.typography]) {
            styleParts.push(TYPOGRAPHY_TONES[stylePreferences.typography]);
        }
        if (stylePreferences?.uiStyle && UI_STYLE_TONES[stylePreferences.uiStyle]) {
            styleParts.push(UI_STYLE_TONES[stylePreferences.uiStyle]);
        }
        if (stylePreferences?.personality?.length) {
            styleParts.push(`Brand personality: ${stylePreferences.personality.join(', ')}.`);
        }
        if (stylePreferences?.components) {
            styleParts.push(`Use ${stylePreferences.components.corners === 'rounded' ? 'rounded' : 'sharp'} corners${stylePreferences.components.gradient ? ' with gradient accents' : ''}.`);
        }
        if (stylePreferences?.keywords?.length) {
            styleParts.push(`Mood board keywords: ${stylePreferences.keywords.join(', ')}.`);
        }
        if (stylePreferences?.notes?.trim()) {
            styleParts.push(`Creative direction: ${stylePreferences.notes.trim()}`);
        }
        if (styleParts.length) {
            basePrompt += ` ${styleParts.join(' ')}`;
        }

        if (extraInfo && extraInfo.trim()) {
            basePrompt += ` ${extraInfo.trim()}`;
        }

        return basePrompt;
    };

    const handleGenerate = async () => {
        const screenType = selectedScreenType;
        const customName = screenType === 'other' ? customScreenName : '';

        if (screenType === 'other' && !customName.trim()) {
            toast.error('Please enter a screen name');
            return;
        }

        if (isGeneratingScreen) return;

        const screenId = `custom-${Date.now()}`;
        const newScreen: CustomScreen = {
            id: screenId,
            screenType,
            customName,
            additionalInfo,
            url: null,
            isGenerating: true,
        };

        setGeneratedScreens((prev) => [...prev, newScreen]);
        setIsGeneratingScreen(true);

        try {
            const prompt = generatePrompt(screenType, customName, additionalInfo);

            // Auto-upgrade model if using reference images with Nano Banana
            let effectiveGoogleModel = googleModel;
            if (referenceImages.length > 0 && provider === 'gemini' && googleModel === 'nano-banana') {
                toast.info('Switched to Nano Banana Edit to support reference images (Cheaper option)');
                effectiveGoogleModel = 'nano-banana-edit';
                setGoogleModel('nano-banana-edit');
            }

            const response = await fetch('/api/test/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    provider,
                    googleModel: provider === 'gemini' ? effectiveGoogleModel : undefined,
                    openaiModel: provider === 'openai' ? openaiModel : undefined,
                    outputFormat,
                    aspectRatio,
                    referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const err = new Error(errorData.error || 'Failed to generate screen');
                (err as any).status = response.status;
                throw err;
            }

            const data = await response.json();

            setGeneratedScreens((prev) =>
                prev.map((screen) =>
                    screen.id === screenId
                        ? { ...screen, url: data.imageUrl, isGenerating: false }
                        : screen
                )
            );

            toast.success('Screen generated successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate screen';
            const isCreditError = (error as any)?.status === 402 || message.toLowerCase().includes('insufficient credits');
            if (isCreditError) {
                console.warn('Insufficient credits while generating custom screen');
                toast.error('Insufficient credits. Please add more credits or choose a cheaper model.');
            } else {
                console.error('Error generating screen:', error);
                toast.error(message);
            }
            setGeneratedScreens((prev) => prev.filter((screen) => screen.id !== screenId));
        } finally {
            setIsGeneratingScreen(false);
        }
    };

    const handleAddNewScreen = () => {
        setSelectedScreenType('onboarding');
        setCustomScreenName('');
        setAdditionalInfo('');

        // Scroll to the form
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleEditScreen = async () => {
        if (!editingScreen || !editPrompt) return;

        setIsEditing(true);
        setEditError(null);

        try {
            const response = await fetch('/api/test/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: editPrompt,
                    provider: editProvider,
                    googleModel: editProvider === 'gemini' ? editGoogleModel : undefined,
                    openaiModel: editProvider === 'openai' ? editOpenaiModel : undefined,
                    outputFormat: editOutputFormat,
                    aspectRatio: editAspectRatio,
                    referenceImages: [editingScreen.url],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const err = new Error(errorData.error || 'Failed to generate edit');
                (err as any).status = response.status;
                throw err;
            }

            const data = await response.json();

            if (data.success && data.imageUrl) {
                // Update the screen with the edited version
                setGeneratedScreens((prev) =>
                    prev.map((screen) =>
                        screen.id === editingScreen.id
                            ? { ...screen, url: data.imageUrl }
                            : screen
                    )
                );

                setIsEditModalOpen(false);
                setEditPrompt('');

                const editedLabel = getScreenLabel(editingScreen.screenType, editingScreen.customName);
                setViewingScreen({ url: data.imageUrl, title: editedLabel });
                setIsViewModalOpen(true);
                setEditingScreen(null);
                toast.success('Screen edited successfully!');
            } else {
                setEditError(data.error || 'Failed to generate edit');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to edit screen';
            const isCreditError = (err as any)?.status === 402 || message.toLowerCase().includes('insufficient credits');
            if (isCreditError) {
                console.warn('Insufficient credits while editing custom screen');
                setEditError('Insufficient credits. Please add more credits or switch to a lower-cost model.');
            } else {
                console.error('Failed to edit screen:', err);
                setEditError(message);
            }
            toast.error(isCreditError
                ? 'Insufficient credits. Please add more credits or switch to a lower-cost model.'
                : message);
        } finally {
            setIsEditing(false);
        }
    };

    const handleAddToCart = (screen: CustomScreen) => {
        if (!screen.url) return;

        const displayName = getScreenLabel(screen.screenType, screen.customName);

        const savedScreen: SavedScreen = {
            id: screen.id,
            type: screen.screenType,
            name: displayName,
            url: screen.url,
            stage: 4,
        };

        onAddToCart([savedScreen]);
        toast.success(`Added "${displayName}" to cart`);
    };

    const handleRemoveScreen = (screenId: string) => {
        setGeneratedScreens((prev) => prev.filter((screen) => screen.id !== screenId));
        toast.success('Screen removed');
    };

    const isInCart = (screenId: string) => {
        return cartItems.some(item => item.id === screenId);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Additional Screens</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Generate custom screens for your app using preset types or create your own.
                </p>
            </div>

            {/* Screen Generator Form */}
            <div ref={formRef} className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 p-6 space-y-4">
                <h3 className="text-lg font-semibold">Generate New Screen</h3>

                {/* Screen Type Dropdown */}
                <div>
                    <label className="block text-sm font-medium mb-2">Choose a Screen</label>
                    <select
                        value={selectedScreenType}
                        onChange={(e) => {
                            setSelectedScreenType(e.target.value);
                            if (e.target.value !== 'other') {
                                setCustomScreenName('');
                            }
                        }}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {PRESET_SCREENS.map((screen) => (
                            <option key={screen.value} value={screen.value}>
                                {screen.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Custom Screen Name (only shown when "Other" is selected) */}
                {selectedScreenType === 'other' && (
                    <div>
                        <label className="block text-sm font-medium mb-2">Screen Name</label>
                        <input
                            type="text"
                            value={customScreenName}
                            onChange={(e) => setCustomScreenName(e.target.value)}
                            placeholder="e.g., Checkout, Map View, Calendar..."
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* Configuration Row */}
                <div>
                    <label className="block text-sm font-medium mb-2">Configuration</label>
                    <div className="flex gap-2 items-center flex-wrap">
                        {/* Provider Dropdown */}
                        <div className="relative">
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value as Provider)}
                                className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="gemini">🌟 Gemini 3</option>
                                <option value="openai">🤖 OpenAI</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>

                        {/* Model Dropdown */}
                        <div className="relative">
                            <select
                                value={provider === 'gemini' ? googleModel : openaiModel}
                                onChange={(e) => {
                                    if (provider === 'gemini') {
                                        setGoogleModel(e.target.value as GoogleModel);
                                    } else {
                                        setOpenaiModel(e.target.value as OpenAIModel);
                                    }
                                }}
                                className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                            >
                                {provider === 'gemini'
                                    ? GOOGLE_MODELS.map((model) => (
                                        <option key={model.value} value={model.value}>
                                            {model.label}
                                        </option>
                                    ))
                                    : OPENAI_MODELS.map((model) => (
                                        <option key={model.value} value={model.value}>
                                            {model.label}
                                        </option>
                                    ))
                                }
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>

                        {/* Output Format Dropdown */}
                        <div className="relative">
                            <select
                                value={outputFormat}
                                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                                className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="png">PNG</option>
                                <option value="jpeg">JPEG</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>

                        {/* Aspect Ratio Dropdown */}
                        <div className="relative">
                            <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                                className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="9:16">📱 9:16 (Phone)</option>
                                <option value="1:1">⬜ 1:1 (Square)</option>
                                <option value="16:9">🖥️ 16:9 (Wide)</option>
                                <option value="3:4">📄 3:4 (Portrait)</option>
                                <option value="4:3">🖼️ 4:3 (Landscape)</option>
                                <option value="3:2">📐 3:2</option>
                                <option value="2:3">📐 2:3</option>
                                <option value="512">🔲 512x512</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Additional Info <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        placeholder="Add any specific details you want in this screen (e.g., 'include a dark mode toggle', 'show user statistics', etc.)"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
                    />
                </div>

                {/* Clip Tray */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            📋 Clip Tray ({referenceImages.length}/8)
                            <span className="text-xs font-normal text-slate-500">(Style References)</span>
                        </h3>
                        <span className="text-xs text-slate-400">Ctrl+V to paste images</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {referenceImages.map((url, index) => (
                            <div key={index} className="relative group flex-shrink-0">
                                <img
                                    src={url}
                                    alt={`Reference ${index + 1}`}
                                    className="w-16 h-24 object-cover rounded border border-slate-300 dark:border-slate-600"
                                />
                                <button
                                    onClick={() => setReferenceImages(prev => prev.filter((_, i) => i !== index))}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {isUploading && (
                            <div className="w-16 h-24 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            </div>
                        )}
                        {!isUploading && referenceImages.length < 8 && (
                            <div className="w-16 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center text-slate-400 text-xs text-center p-1">
                                Paste Image (Ctrl+V)
                            </div>
                        )}
                    </div>
                </div>

                {/* Auto-generated Prompt Preview */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">
                        Auto-generated Prompt - (read-only)
                    </label>
                    <textarea
                        value={generatePrompt(selectedScreenType, customScreenName, additionalInfo)}
                        readOnly
                        className="w-full text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-3 min-h-[100px] resize-none cursor-default focus:outline-none"
                    />
                </div>

                {/* Generate Button */}
                <Button
                    onClick={handleGenerate}
                    disabled={isGeneratingScreen || (selectedScreenType === 'other' && !customScreenName.trim())}
                    className="w-full"
                >
                    {isGeneratingScreen ? 'Generating...' : 'Generate Screen'}
                </Button>
            </div>

            {/* Generated Screens */}
            {generatedScreens.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Your Mock Screens</h3>

                    <div className="grid gap-4">
                        {generatedScreens.map((screen) => {
                            const screenLabel = getScreenLabel(screen.screenType, screen.customName);

                            return (
                                <div
                                    key={screen.id}
                                    className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 p-4"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Preview */}
                                        <div className="flex-shrink-0 w-32">
                                            <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                                                {screen.isGenerating ? (
                                                    <div className="text-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                        <p className="text-xs text-slate-500">Generating...</p>
                                                    </div>
                                                ) : screen.url ? (
                                                    <img
                                                        src={screen.url}
                                                        alt={screen.customName || screen.screenType}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <p className="text-xs text-slate-400">No preview</p>
                                                )}
                                            </div>
                                            {screen.url && !screen.isGenerating && (
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setViewingScreen({ url: screen.url!, title: screenLabel || 'Screen preview' });
                                                            setIsViewModalOpen(true);
                                                        }}
                                                    >
                                                        👁️ View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingScreen({
                                                                id: screen.id,
                                                                url: screen.url!,
                                                                screenType: screen.screenType,
                                                                customName: screen.customName
                                                            });
                                                            setEditProvider(provider);
                                                            setEditGoogleModel(googleModel);
                                                            setEditOpenaiModel(openaiModel);
                                                            setEditOutputFormat(outputFormat);
                                                            setEditAspectRatio(aspectRatio);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                    >
                                                        ✏️ Edit
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <h4 className="font-semibold mb-1">
                                                {screenLabel}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                                {generatePrompt(screen.screenType, screen.customName, screen.additionalInfo)}
                                            </p>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                {screen.url && !screen.isGenerating && (
                                                    <>
                                                        {isInCart(screen.id) ? (
                                                            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                                                ✓ Saved
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAddToCart(screen)}
                                                            >
                                                                Save
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRemoveScreen(screen.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add New Screen Button */}
                    <Button
                        onClick={handleAddNewScreen}
                        variant="outline"
                        className="w-full border-dashed border-2"
                    >
                        ➕ Add New Screen
                    </Button>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingScreen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Edit Screen</h3>
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditPrompt('');
                                    setEditingScreen(null);
                                }}
                                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1/3">
                                <p className="text-xs font-medium mb-1 text-slate-500">Original:</p>
                                <img
                                    src={editingScreen.url}
                                    alt="Original"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div className="w-2/3 space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        What would you like to change?
                                    </label>
                                    <textarea
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        placeholder="e.g., Change the button color to red, make the text larger..."
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">
                                Generation Options
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                <div className="relative">
                                    <select
                                        value={editProvider}
                                        onChange={(e) => setEditProvider(e.target.value as Provider)}
                                        className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                    >
                                        <option value="gemini">🌟 Gemini 3</option>
                                        <option value="openai">🤖 OpenAI</option>
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                </div>

                                <div className="relative">
                                    <select
                                        value={editProvider === 'gemini' ? editGoogleModel : editOpenaiModel}
                                        onChange={(e) => {
                                            if (editProvider === 'gemini') {
                                                setEditGoogleModel(e.target.value as GoogleModel);
                                            } else {
                                                setEditOpenaiModel(e.target.value as OpenAIModel);
                                            }
                                        }}
                                        className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                    >
                                        {editProvider === 'gemini'
                                            ? GOOGLE_MODELS.map((model) => (
                                                <option key={model.value} value={model.value}>
                                                    {model.label}
                                                </option>
                                            ))
                                            : OPENAI_MODELS.map((model) => (
                                                <option key={model.value} value={model.value}>
                                                    {model.label}
                                                </option>
                                            ))}
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                </div>

                                <div className="relative">
                                    <select
                                        value={editOutputFormat}
                                        onChange={(e) => setEditOutputFormat(e.target.value as OutputFormat)}
                                        className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                    >
                                        {OUTPUT_FORMAT_OPTIONS.map((formatOption) => (
                                            <option key={formatOption} value={formatOption}>
                                                {formatOption.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                </div>

                                <div className="relative">
                                    <select
                                        value={editAspectRatio}
                                        onChange={(e) => setEditAspectRatio(e.target.value as AspectRatio)}
                                        className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                    >
                                        {ASPECT_RATIO_OPTIONS.map((ratio) => (
                                            <option key={ratio} value={ratio}>
                                                {ratio}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                </div>
                            </div>
                        </div>

                        {editError && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-600 text-sm">
                                {editError}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditPrompt('');
                                    setEditingScreen(null);
                                }}
                                disabled={isEditing}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditScreen}
                                disabled={!editPrompt || isEditing}
                            >
                                {isEditing ? 'Generating...' : 'Generate Edit ✨'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {isViewModalOpen && viewingScreen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-xs uppercase text-slate-400 tracking-wide">Preview</p>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewingScreen.title}</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    setViewingScreen(null);
                                }}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                                src={viewingScreen.url}
                                alt={viewingScreen.title}
                                className="max-h-[75vh] w-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
