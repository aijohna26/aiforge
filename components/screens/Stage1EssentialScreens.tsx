'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AppInfo {
    name: string;
    description: string;
    category: string;
    targetAudience: string;
    colorScheme: string;
}

interface Stage1Props {
    appInfo: AppInfo;
    savedLogo: string | null;
    onAddToCart: (screens: SavedScreen[]) => void;
    cartItems: SavedScreen[];
}

interface SavedScreen {
    id: string;
    type: string;
    name: string;
    url: string;
    stage: number;
}

type ScreenType = 'splash' | 'signin' | 'signup';
type ModelType = 'nano-banana-pro' | 'nano-banana-edit' | 'dall-e-3' | 'gpt-image-1' | 'qwen-image-edit' | 'seedream-4.5-edit';

const SCREEN_CONFIGS = {
    splash: { name: 'Splash Screen', icon: '🚀', required: true },
    signin: { name: 'Sign In', icon: '🔐', required: false },
    signup: { name: 'Sign Up', icon: '✍️', required: false },
};

const MODEL_CONFIGS: Record<ModelType, { name: string; cost: number; provider: string; googleModel?: string; openaiModel?: string; qwenModel?: string; seedreamModel?: string }> = {
    'nano-banana-pro': { name: 'Nano Banana Pro', cost: 27, provider: 'gemini', googleModel: 'nano-banana-pro' },
    'nano-banana-edit': { name: 'Nano Banana Edit', cost: 6, provider: 'gemini', googleModel: 'nano-banana-edit' },
    'qwen-image-edit': { name: 'Qwen Image Edit', cost: 3, provider: 'qwen-image-edit', qwenModel: 'qwen/image-edit' },
    'seedream-4.5-edit': { name: 'Seedream 4.5 Edit', cost: 7, provider: 'seedream-4.5-edit', seedreamModel: 'seedream/4.5-edit' },
    'gpt-image-1': { name: 'GPT Image', cost: 10, provider: 'gpt-image-1' },
    'dall-e-3': { name: 'DALL-E 3', cost: 8, provider: 'openai', openaiModel: 'dall-e-3' },
};

export function Stage1EssentialScreens({ appInfo, savedLogo, onAddToCart, cartItems }: Stage1Props) {
    const [selectedScreens, setSelectedScreens] = useState<Record<ScreenType, boolean>>({
        splash: true,
        signin: true,
        signup: true,
    });
    const [variationsPerScreen, setVariationsPerScreen] = useState(3);
    const [selectedModel, setSelectedModel] = useState<ModelType>('nano-banana-edit');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedScreens, setGeneratedScreens] = useState<Record<ScreenType, string[]>>({
        splash: [], signin: [], signup: []
    });
    const [selectedVariations, setSelectedVariations] = useState<Record<ScreenType, string | null>>({
        splash: null, signin: null, signup: null
    });
    const [error, setError] = useState<string | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingScreen, setEditingScreen] = useState<{ type: ScreenType, url: string } | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editReferenceImages, setEditReferenceImages] = useState<string[]>([]);
    const [isEditUploading, setIsEditUploading] = useState(false);
    const [editSelectedModel, setEditSelectedModel] = useState<ModelType>('nano-banana-edit');

    const generatePrompt = (screenType: ScreenType): string => {
        const colorSchemeMap: Record<string, string> = {
            'Modern Blue': 'modern blue and white',
            'Vibrant Purple': 'vibrant purple and pink gradient',
            'Fresh Green': 'fresh green and white',
            'Warm Orange': 'warm orange and yellow',
            'Bold Red': 'bold red and white',
            'Elegant Dark': 'elegant dark theme with subtle white accents',
        };

        const colors = colorSchemeMap[appInfo.colorScheme] || 'professional';

        switch (screenType) {
            case 'splash':
                return `Mobile app splash screen for '${appInfo.name}', a ${appInfo.category.toLowerCase()} app. Centered app logo (provided in reference image), app name '${appInfo.name}' in professional modern sans-serif typography below the logo, clean minimal gradient background using ${colors} color palette. 9:16 mobile portrait aspect ratio, iOS design aesthetic, high contrast, balanced composition, premium feel, no additional UI elements, just logo and app name on branded background.`;
            case 'signin':
                return `Mobile app sign in screen for '${appInfo.name}', a ${appInfo.category.toLowerCase()} app. Top: small app logo (from reference image) with 'Welcome back' heading, subtitle 'Sign in to continue', 'Continue with Google' button with Google icon, 'or continue with email' divider, Email input field with envelope icon and placeholder 'you@example.com', Password input field with lock icon and dots placeholder, 'Forgot password?' link in ${colors} accent color on the right, 'Sign in' button in ${colors} primary color, Bottom: 'Don't have an account? Sign up' link, Dark theme background, modern rounded input fields, 9:16 mobile portrait, iOS design patterns, clean professional UI.`;
            case 'signup':
                return `Mobile app sign up screen for '${appInfo.name}', a ${appInfo.category.toLowerCase()} app. Top: small app logo (from reference image) with 'Create your account' heading, subtitle 'Start building with AI today', 'Continue with Google' button with Google icon, 'or continue with email' divider, Full name input field with user icon and placeholder 'John Doe', Email input field with envelope icon and placeholder 'you@example.com', Password input field with lock icon and dots placeholder, 'Must be at least 6 characters' helper text, 'Create account' button in ${colors} primary color, Bottom: 'Already have an account? Sign in' link, Terms of Service and Privacy Policy text at bottom, Dark theme background, modern rounded input fields, 9:16 mobile portrait, iOS design patterns, clean professional UI.`;
            default:
                return '';
        }
    };

    // Clipboard paste handler for Edit Modal
    useEffect(() => {
        if (!isEditModalOpen) return;

        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        if (editReferenceImages.length >= 8) {
                            toast.error('Maximum 8 reference images allowed');
                            return;
                        }

                        setIsEditUploading(true);
                        try {
                            const formData = new FormData();
                            formData.append('file', blob);

                            const response = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData,
                            });

                            const data = await response.json();
                            if (data.url) {
                                setEditReferenceImages([...editReferenceImages, data.url]);
                                toast.success('Image added to clip tray');
                            } else {
                                toast.error('Failed to upload image: ' + (data.error || 'Unknown error'));
                            }
                        } catch (err) {
                            console.error('Upload error:', err);
                            toast.error('Failed to upload image');
                        } finally {
                            setIsEditUploading(false);
                        }
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isEditModalOpen, editReferenceImages]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedScreens({ splash: [], signin: [], signup: [] });
        setSelectedVariations({ splash: null, signin: null, signup: null });

        try {
            const screensToGenerate = (Object.keys(selectedScreens) as ScreenType[]).filter(
                (type) => selectedScreens[type]
            );

            const modelConfig = MODEL_CONFIGS[selectedModel];
            const newGeneratedScreens: Record<ScreenType, string[]> = { splash: [], signin: [], signup: [] };

            for (const screenType of screensToGenerate) {
                const prompt = generatePrompt(screenType);

                const promises = Array.from({ length: variationsPerScreen }, async () => {
                    const body: any = {
                        prompt,
                        provider: modelConfig.provider,
                        googleModel: modelConfig.googleModel,
                        openaiModel: modelConfig.openaiModel,
                        qwenModel: modelConfig.qwenModel,
                        seedreamModel: modelConfig.seedreamModel,
                        outputFormat: 'png',
                        aspectRatio: '9:16',
                    };

                    if (savedLogo) {
                        body.referenceImages = [savedLogo];
                    }

                    const response = await fetch('/api/test/image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });

                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || `HTTP ${response.status}: Failed to generate image`);
                    }

                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(data.error || 'Failed to generate image');
                    }
                    return data.imageUrl;
                });

                const results = await Promise.all(promises);
                const validUrls = results.filter((url): url is string => url !== null);

                if (validUrls.length > 0) {
                    newGeneratedScreens[screenType] = validUrls;
                }
            }

            setGeneratedScreens(newGeneratedScreens);
            toast.success('Screens generated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while generating screens');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddToCart = () => {
        const screens: SavedScreen[] = [];
        (Object.keys(selectedVariations) as ScreenType[]).forEach((type) => {
            if (selectedVariations[type]) {
                screens.push({
                    id: `${type}-${Date.now()}`,
                    type,
                    name: SCREEN_CONFIGS[type].name,
                    url: selectedVariations[type]!,
                    stage: 1,
                });
            }
        });

        onAddToCart(screens);
        toast.success(`${screens.length} screen(s) added to cart!`);
    };

    const handleEditScreen = async () => {
        if (!editingScreen || !editPrompt) return;

        setIsEditing(true);
        setEditError(null);

        try {
            const editModelConfig = MODEL_CONFIGS[editSelectedModel];
            const allReferenceImages = editSelectedModel === 'qwen-image-edit'
                ? [editingScreen.url]
                : [editingScreen.url, ...editReferenceImages];

            if (editSelectedModel === 'qwen-image-edit' && editReferenceImages.length > 0) {
                toast.warning('Qwen only uses the original image. Clip tray images will be ignored.');
            }

            const body: any = {
                prompt: editPrompt,
                provider: editModelConfig.provider,
                outputFormat: 'png',
                aspectRatio: '9:16',
                referenceImages: allReferenceImages,
            };

            if (editModelConfig.googleModel) body.googleModel = editModelConfig.googleModel;
            if (editModelConfig.openaiModel) body.openaiModel = editModelConfig.openaiModel;
            if (editModelConfig.qwenModel) body.qwenModel = editModelConfig.qwenModel;
            if (editModelConfig.seedreamModel) body.seedreamModel = editModelConfig.seedreamModel;

            const response = await fetch('/api/test/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.success && data.imageUrl) {
                const currentScreens = generatedScreens[editingScreen.type] || [];
                const updatedScreens = [...currentScreens, data.imageUrl];

                setGeneratedScreens({
                    ...generatedScreens,
                    [editingScreen.type]: updatedScreens
                });

                setSelectedVariations({
                    ...selectedVariations,
                    [editingScreen.type]: data.imageUrl
                });

                setIsEditModalOpen(false);
                setEditPrompt('');
                setEditingScreen(null);
                setEditReferenceImages([]);
                toast.success('Screen edited successfully!');
            } else {
                setEditError(data.error || 'Failed to generate edit');
            }
        } catch (err) {
            setEditError('An error occurred while editing');
            console.error(err);
        } finally {
            setIsEditing(false);
        }
    };

    const totalScreens = Object.values(selectedScreens).filter(Boolean).length;
    const estimatedCost = totalScreens * variationsPerScreen * MODEL_CONFIGS[selectedModel].cost;
    const hasGeneratedScreens = Object.values(generatedScreens).some((screens) => screens.length > 0);
    const hasSelections = Object.values(selectedVariations).some(v => v !== null);

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Stage 1: Essential Screens</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    Generate the core authentication and entry screens for your app. All screens will use your logo for brand consistency.
                </p>
            </div>

            {/* Configuration */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Model Selection */}
                <div>
                    <label className="block text-sm font-medium mb-2">Generation Model</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                    >
                        {(Object.keys(MODEL_CONFIGS) as ModelType[]).map((model) => (
                            <option key={model} value={model}>
                                {MODEL_CONFIGS[model].name} ({MODEL_CONFIGS[model].cost} credits/image)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Variations */}
                <div>
                    <label className="block text-sm font-medium mb-2">Variations per Screen</label>
                    <select
                        value={variationsPerScreen}
                        onChange={(e) => setVariationsPerScreen(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={1}>1 variation</option>
                        <option value={2}>2 variations</option>
                        <option value={3}>3 variations</option>
                        <option value={4}>4 variations</option>
                    </select>
                </div>
            </div>

            {/* Screen Selection */}
            <div>
                <h4 className="text-sm font-medium mb-3">Select Screens</h4>
                <div className="space-y-2">
                    {(Object.keys(SCREEN_CONFIGS) as ScreenType[]).map((type) => {
                        const config = SCREEN_CONFIGS[type];
                        return (
                            <div
                                key={type}
                                className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedScreens[type]}
                                    onChange={(e) =>
                                        !config.required &&
                                        setSelectedScreens({ ...selectedScreens, [type]: e.target.checked })
                                    }
                                    disabled={config.required}
                                    className="w-4 h-4"
                                />
                                <span className="text-2xl">{config.icon}</span>
                                <div className="flex-1">
                                    <p className="font-medium">
                                        {config.name}
                                        {config.required && (
                                            <span className="text-xs text-blue-500 ml-2">(Required)</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-sm">
                    <span className="font-medium">Total:</span> {totalScreens} screen type(s) × {variationsPerScreen} variations = {totalScreens * variationsPerScreen} images
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Estimated credits: {estimatedCost}
                </p>
            </div>

            {/* Generate Button */}
            {!hasGeneratedScreens && (
                <Button onClick={handleGenerate} disabled={isGenerating || totalScreens === 0} className="w-full" size="lg">
                    {isGenerating ? '⚙️ Generating...' : `✨ Generate ${totalScreens * variationsPerScreen} Screen(s)`}
                </Button>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">❌ {error}</p>
                </div>
            )}

            {/* Generated Screens */}
            {hasGeneratedScreens && (
                <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold">Generated Screens - Select Your Favorites</h3>

                    {(Object.keys(generatedScreens) as ScreenType[]).map((type) => {
                        const screens = generatedScreens[type];
                        if (screens.length === 0) return null;

                        return (
                            <div key={type} className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2">
                                    <span className="text-xl">{SCREEN_CONFIGS[type].icon}</span>
                                    {SCREEN_CONFIGS[type].name} ({screens.length} variation{screens.length > 1 ? 's' : ''})
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {screens.map((url, index) => (
                                        <div
                                            key={index}
                                            className={`relative border-2 rounded-lg overflow-hidden bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                                                selectedVariations[type] === url
                                                    ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                            onClick={() => setSelectedVariations({ ...selectedVariations, [type]: url })}
                                        >
                                            <img
                                                src={url}
                                                alt={`${SCREEN_CONFIGS[type].name} ${index + 1}`}
                                                className="w-full h-auto"
                                            />
                                            <div className="p-2 flex gap-2 justify-between items-center bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                                                {selectedVariations[type] === url ? (
                                                    <span className="text-xs text-blue-600 font-medium flex-1">✓ Selected</span>
                                                ) : (
                                                    <span className="flex-1"></span>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-xs px-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingScreen({ type, url });
                                                        setIsEditModalOpen(true);
                                                    }}
                                                >
                                                    ✏️ Edit
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center pt-4">
                        <Button
                            onClick={handleGenerate}
                            variant="outline"
                            disabled={isGenerating}
                        >
                            {isGenerating ? '⚙️ Generating...' : '🔄 Generate New Variations'}
                        </Button>
                        <Button
                            onClick={handleAddToCart}
                            disabled={!hasSelections}
                            className="bg-green-500 hover:bg-green-600"
                        >
                            🛒 Add Selected to Cart
                        </Button>
                    </div>
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
                                    setEditReferenceImages([]);
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

                        {/* Model Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">AI Model</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(MODEL_CONFIGS) as ModelType[]).map((modelKey) => {
                                    const config = MODEL_CONFIGS[modelKey];
                                    const isSelected = editSelectedModel === modelKey;
                                    return (
                                        <button
                                            key={modelKey}
                                            onClick={() => setEditSelectedModel(modelKey)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                isSelected
                                                    ? 'bg-blue-500 text-white ring-2 ring-blue-400'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                            }`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span>{config.name}</span>
                                                <span className="text-xs opacity-75">{config.cost} credits</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reference Images Clip Tray */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    📋 Clip Tray ({editReferenceImages.length}/8)
                                    <span className="text-xs font-normal text-slate-500">(Style References)</span>
                                </h3>
                                <span className="text-xs text-slate-400">Ctrl+V to paste images</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {editReferenceImages.map((url, index) => (
                                    <div key={index} className="relative group flex-shrink-0">
                                        <img
                                            src={url}
                                            alt={`Reference ${index + 1}`}
                                            className="w-16 h-24 object-cover rounded border border-slate-300 dark:border-slate-600"
                                        />
                                        <button
                                            onClick={() => {
                                                setEditReferenceImages(editReferenceImages.filter((_, i) => i !== index));
                                            }}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {isEditUploading && (
                                    <div className="w-16 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    </div>
                                )}
                                {!isEditUploading && editReferenceImages.length < 8 && (
                                    <div className="w-16 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center justify-center">
                                        <input
                                            type="url"
                                            placeholder="Paste URL"
                                            className="w-full h-full text-xs text-center bg-transparent border-none focus:outline-none text-slate-400 p-1"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const input = e.currentTarget;
                                                    const url = input.value.trim();
                                                    if (url && !editReferenceImages.includes(url)) {
                                                        setEditReferenceImages([...editReferenceImages, url]);
                                                        input.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                )}
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
                                    setEditReferenceImages([]);
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
        </div>
    );
}
