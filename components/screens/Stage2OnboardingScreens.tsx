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

interface Stage2Props {
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

type ModelType = 'nano-banana-pro' | 'nano-banana-edit' | 'dall-e-3' | 'gpt-image-1' | 'qwen-image-edit' | 'seedream-4.5-edit';

const MODEL_CONFIGS: Record<ModelType, { name: string; cost: number; provider: string; googleModel?: string; openaiModel?: string; qwenModel?: string; seedreamModel?: string }> = {
    'nano-banana-pro': { name: 'Nano Banana Pro', cost: 27, provider: 'gemini', googleModel: 'nano-banana-pro' },
    'nano-banana-edit': { name: 'Nano Banana Edit', cost: 6, provider: 'gemini', googleModel: 'nano-banana-edit' },
    'qwen-image-edit': { name: 'Qwen Image Edit', cost: 3, provider: 'qwen-image-edit', qwenModel: 'qwen/image-edit' },
    'seedream-4.5-edit': { name: 'Seedream 4.5 Edit', cost: 7, provider: 'seedream-4.5-edit', seedreamModel: 'seedream/4.5-edit' },
    'gpt-image-1': { name: 'GPT Image', cost: 10, provider: 'gpt-image-1' },
    'dall-e-3': { name: 'DALL-E 3', cost: 8, provider: 'openai', openaiModel: 'dall-e-3' },
};

export function Stage2OnboardingScreens({ appInfo, savedLogo, onAddToCart, cartItems }: Stage2Props) {
    const [numberOfSlides, setNumberOfSlides] = useState(3);
    const [variationsPerSlide, setVariationsPerSlide] = useState(2);
    const [selectedModel, setSelectedModel] = useState<ModelType>('nano-banana-edit');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSlides, setGeneratedSlides] = useState<Record<number, string[]>>({});
    const [selectedVariations, setSelectedVariations] = useState<Record<number, string | null>>({});
    const [error, setError] = useState<string | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<{ slideNumber: number, url: string } | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editReferenceImages, setEditReferenceImages] = useState<string[]>([]);
    const [isEditUploading, setIsEditUploading] = useState(false);
    const [editSelectedModel, setEditSelectedModel] = useState<ModelType>('nano-banana-edit');

    const generateOnboardingPrompts = () => {
        const colorSchemeMap: Record<string, string> = {
            'Modern Blue': 'modern blue and white',
            'Vibrant Purple': 'vibrant purple and pink gradient',
            'Fresh Green': 'fresh green and white',
            'Warm Orange': 'warm orange and yellow',
            'Bold Red': 'bold red and white',
            'Elegant Dark': 'elegant dark theme with subtle white accents',
        };

        const colors = colorSchemeMap[appInfo.colorScheme] || 'professional';

        const prompts = [
            `Mobile app onboarding screen 1/3 for '${appInfo.name}', a ${appInfo.category.toLowerCase()} app. Large illustration at top showing the main value proposition, bold headline '${appInfo.name}' with subtitle explaining core benefit for ${appInfo.targetAudience}, clean modern design using ${colors} color scheme, progress indicator dots at bottom (1st dot highlighted), 'Next' button, 9:16 mobile portrait, iOS style, professional minimalist design`,

            `Mobile app onboarding screen 2/3 for '${appInfo.name}', a ${appInfo.category.toLowerCase()} app. Engaging illustration showing key feature or benefit, compelling headline describing how it helps users, concise 2-line description, ${colors} color palette, progress dots (2nd highlighted), 'Next' and 'Skip' buttons, 9:16 mobile portrait, consistent with screen 1, modern clean UI`,

            `Mobile app onboarding screen 3/3 for '${appInfo.name}', a ${appInfo.category.toLowerCase()} app. Final compelling illustration, strong call-to-action headline, brief description of getting started, ${colors} branding colors, progress dots (3rd/final highlighted), prominent 'Get Started' button in primary color, 'Sign in' link at bottom, 9:16 mobile portrait, polished modern design`,
        ];

        // If user wants more than 3 slides, generate additional ones
        if (numberOfSlides > 3) {
            for (let i = 4; i <= numberOfSlides; i++) {
                prompts.push(
                    `Mobile app onboarding screen ${i}/${numberOfSlides} for '${appInfo.name}', a ${appInfo.category.toLowerCase()} app. Engaging illustration highlighting another key feature or benefit, clear headline, brief description, ${colors} color scheme, progress dots (${i}th highlighted), 'Next' and 'Skip' buttons, 9:16 mobile portrait, modern professional design`
                );
            }
        }

        return prompts.slice(0, numberOfSlides);
    };

    // Clipboard paste handler
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
        setGeneratedSlides({});
        setSelectedVariations({});

        try {
            const prompts = generateOnboardingPrompts();
            const modelConfig = MODEL_CONFIGS[selectedModel];
            const newGeneratedSlides: Record<number, string[]> = {};

            for (let slideNum = 0; slideNum < prompts.length; slideNum++) {
                const prompt = prompts[slideNum];

                const promises = Array.from({ length: variationsPerSlide }, async () => {
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
                    newGeneratedSlides[slideNum + 1] = validUrls;
                }
            }

            setGeneratedSlides(newGeneratedSlides);
            toast.success('Onboarding screens generated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while generating screens');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddToCart = () => {
        const screens: SavedScreen[] = [];
        Object.entries(selectedVariations).forEach(([slideNum, url]) => {
            if (url) {
                screens.push({
                    id: `onboarding-${slideNum}-${Date.now()}`,
                    type: 'onboarding',
                    name: `Onboarding ${slideNum}`,
                    url: url,
                    stage: 2,
                });
            }
        });

        onAddToCart(screens);
        toast.success(`${screens.length} onboarding screen(s) added to cart!`);
    };

    const handleEditSlide = async () => {
        if (!editingSlide || !editPrompt) return;

        setIsEditing(true);
        setEditError(null);

        try {
            const editModelConfig = MODEL_CONFIGS[editSelectedModel];
            const allReferenceImages = editSelectedModel === 'qwen-image-edit'
                ? [editingSlide.url]
                : [editingSlide.url, ...editReferenceImages];

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
                const currentSlides = generatedSlides[editingSlide.slideNumber] || [];
                const updatedSlides = [...currentSlides, data.imageUrl];

                setGeneratedSlides({
                    ...generatedSlides,
                    [editingSlide.slideNumber]: updatedSlides
                });

                setSelectedVariations({
                    ...selectedVariations,
                    [editingSlide.slideNumber]: data.imageUrl
                });

                setIsEditModalOpen(false);
                setEditPrompt('');
                setEditingSlide(null);
                setEditReferenceImages([]);
                toast.success('Slide edited successfully!');
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

    const totalSlides = numberOfSlides;
    const totalImages = totalSlides * variationsPerSlide;
    const estimatedCost = totalImages * MODEL_CONFIGS[selectedModel].cost;
    const hasGeneratedSlides = Object.keys(generatedSlides).length > 0;
    const hasSelections = Object.values(selectedVariations).some(v => v !== null);

    return (
        <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Stage 2: Onboarding Screens</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                    Create a compelling onboarding experience that introduces users to your app's key features and benefits.
                </p>
            </div>

            {/* Configuration */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Number of Slides */}
                <div>
                    <label className="block text-sm font-medium mb-2">Number of Slides</label>
                    <select
                        value={numberOfSlides}
                        onChange={(e) => setNumberOfSlides(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500"
                    >
                        <option value={3}>3 slides (Recommended)</option>
                        <option value={4}>4 slides</option>
                        <option value={5}>5 slides</option>
                    </select>
                </div>

                {/* Variations */}
                <div>
                    <label className="block text-sm font-medium mb-2">Variations per Slide</label>
                    <select
                        value={variationsPerSlide}
                        onChange={(e) => setVariationsPerSlide(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500"
                    >
                        <option value={1}>1 variation</option>
                        <option value={2}>2 variations</option>
                        <option value={3}>3 variations</option>
                    </select>
                </div>

                {/* Model Selection */}
                <div>
                    <label className="block text-sm font-medium mb-2">Generation Model</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500"
                    >
                        {(Object.keys(MODEL_CONFIGS) as ModelType[]).map((model) => (
                            <option key={model} value={model}>
                                {MODEL_CONFIGS[model].name} ({MODEL_CONFIGS[model].cost} credits)
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-sm">
                    <span className="font-medium">Total:</span> {totalSlides} slides × {variationsPerSlide} variations = {totalImages} images
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Estimated credits: {estimatedCost}
                </p>
            </div>

            {/* Generate Button */}
            {!hasGeneratedSlides && (
                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
                    {isGenerating ? '⚙️ Generating...' : `✨ Generate ${totalImages} Onboarding Screen(s)`}
                </Button>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">❌ {error}</p>
                </div>
            )}

            {/* Generated Slides */}
            {hasGeneratedSlides && (
                <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold">Generated Onboarding Slides - Select Your Favorites</h3>

                    {Object.entries(generatedSlides)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([slideNum, slides]) => {
                            const slideNumber = Number(slideNum);
                            return (
                                <div key={slideNum} className="space-y-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <span className="text-xl">📱</span>
                                        Slide {slideNum} of {numberOfSlides} ({slides.length} variation{slides.length > 1 ? 's' : ''})
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {slides.map((url, index) => (
                                            <div
                                                key={index}
                                                className={`relative border-2 rounded-lg overflow-hidden bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                                                    selectedVariations[slideNumber] === url
                                                        ? 'border-purple-500 shadow-lg ring-2 ring-purple-200'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                }`}
                                                onClick={() => setSelectedVariations({ ...selectedVariations, [slideNumber]: url })}
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Onboarding Slide ${slideNum} - Variation ${index + 1}`}
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-2 flex gap-2 justify-between items-center bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                                                    {selectedVariations[slideNumber] === url ? (
                                                        <span className="text-xs text-purple-600 font-medium flex-1">✓ Selected</span>
                                                    ) : (
                                                        <span className="flex-1"></span>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 text-xs px-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingSlide({ slideNumber, url });
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

            {/* Edit Modal - Same as Stage 1 */}
            {isEditModalOpen && editingSlide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Edit Onboarding Slide</h3>
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
                                    src={editingSlide.url}
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
                                        placeholder="e.g., Change the illustration style, update the headline..."
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm h-24 resize-none focus:ring-2 focus:ring-purple-500"
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
                                                    ? 'bg-purple-500 text-white ring-2 ring-purple-400'
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
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
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
                                onClick={handleEditSlide}
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
