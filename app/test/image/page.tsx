'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type Tab = 'preview' | 'variations' | 'code' | 'analytics' | 'screens';
type Provider = 'gemini' | 'openai';
type OpenAIModel = 'gpt-image-1' | 'dall-e-2' | 'dall-e-3';
type GoogleModel = 'nano-banana' | 'nano-banana-pro' | 'nano-banana-edit';
type OutputFormat = 'png' | 'jpeg';
type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '512';

export default function TestImagePage() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('preview');
    const [showTabs, setShowTabs] = useState(false);

    // Configuration options
    const [provider, setProvider] = useState<Provider>('gemini');
    const [openaiModel, setOpenaiModel] = useState<OpenAIModel>('gpt-image-1');
    const [googleModel, setGoogleModel] = useState<GoogleModel>('nano-banana');
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');

    // Image consistency - Clip Tray for reference images
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [useReference, setUseReference] = useState(false);

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
                                addReferenceImage(data.url);
                            } else {
                                alert('Failed to upload image: ' + (data.error || 'Unknown error'));
                            }
                        } catch (err) {
                            console.error('Upload error:', err);
                            alert('Failed to upload image');
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

    const addReferenceImage = (url: string) => {
        if (referenceImages.length >= 8) {
            alert('Clip Tray is full (max 8 images)');
            return;
        }
        if (!referenceImages.includes(url)) {
            setReferenceImages(prev => [...prev, url]);
            setUseReference(true);
        }
    };

    const removeReferenceImage = (index: number) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
        if (referenceImages.length <= 1) {
            setUseReference(false);
        }
    };

    // Saved screens from Supabase
    const [generatedImages, setGeneratedImages] = useState<any[]>([]);
    const [loadingScreens, setLoadingScreens] = useState(false);

    // Load saved screens on mount
    useEffect(() => {
        loadScreens();
    }, []);

    const loadScreens = async () => {
        try {
            setLoadingScreens(true);
            const response = await fetch('/api/screens');
            if (response.ok) {
                const data = await response.json();
                setGeneratedImages(data.screens || []);
            }
        } catch (error) {
            console.error('Failed to load screens:', error);
        } finally {
            setLoadingScreens(false);
        }
    };

    const saveScreen = async (screenData: any) => {
        try {
            const response = await fetch('/api/screens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(screenData),
            });
            if (response.ok) {
                const data = await response.json();
                setGeneratedImages(prev => [data.screen, ...prev]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to save screen:', error);
            return false;
        }
    };

    const deleteScreen = async (screenId: string) => {
        try {
            const response = await fetch(`/api/screens?id=${screenId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setGeneratedImages(prev => prev.filter(s => s.id !== screenId));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete screen:', error);
            return false;
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setShowTabs(false);

        try {
            const response = await fetch(`/api/test/image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    provider,
                    openaiModel: provider === 'openai' ? openaiModel : undefined,
                    googleModel: provider === 'gemini' ? googleModel : undefined,
                    outputFormat,
                    aspectRatio,
                    referenceImages: useReference ? referenceImages : undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
                setShowTabs(true);
                setActiveTab('preview');

                // Save to local generated images array
                setGeneratedImages(prev => [...prev, {
                    id: Date.now(),
                    prompt,
                    imageUrl: data.imageUrl,
                    provider: data.provider,
                    timestamp: new Date().toISOString(),
                    options: data.options,
                }]);
            } else {
                setError(data.error || 'Image generation failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate image');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleGenerate();
        }
    };

    const handleNewSearch = () => {
        setShowTabs(false);
        setResult(null);
        setPrompt('');
        setError('');
    };

    // Simple search interface (before generation)
    if (!showTabs) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">🎨 Image Generation Test</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Configure and test image generation with multiple providers
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
                        <div className="space-y-4">
                            {/* Prompt Input */}
                            <div>
                                <textarea
                                    placeholder="A surreal painting of a giant banana floating in space, stars and galaxies in the background, vibrant colors, digital art"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none text-sm"
                                />
                            </div>

                            {/* Clip Tray */}
                            {referenceImages.length > 0 && (
                                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            📋 Clip Tray ({referenceImages.length}/8)
                                            <span className="text-xs font-normal text-slate-500">
                                                {provider === 'gemini' && googleModel === 'nano-banana-edit'
                                                    ? '(Images to Edit)'
                                                    : '(Style References)'}
                                            </span>
                                        </h3>
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useReference}
                                                onChange={(e) => setUseReference(e.target.checked)}
                                                className="w-3 h-3"
                                            />
                                            <span className={useReference ? "text-blue-600 font-medium" : "text-slate-500"}>
                                                Enable References
                                            </span>
                                        </label>
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
                                                    onClick={() => removeReferenceImage(index)}
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
                            )}

                            {/* Compact Configuration Row */}
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
                                {provider === 'gemini' && (
                                    <div className="relative">
                                        <select
                                            value={googleModel}
                                            onChange={(e) => setGoogleModel(e.target.value as GoogleModel)}
                                            className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                        >
                                            <option value="nano-banana">Nano Banana</option>
                                            <option value="nano-banana-pro">Nano Banana Pro</option>
                                            <option value="nano-banana-edit">Nano Banana Edit</option>
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                    </div>
                                )}

                                {provider === 'openai' && (
                                    <div className="relative">
                                        <select
                                            value={openaiModel}
                                            onChange={(e) => setOpenaiModel(e.target.value as OpenAIModel)}
                                            className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                        >
                                            <option value="gpt-image-1">GPT-Image-1</option>
                                            <option value="dall-e-3">DALL-E 3</option>
                                            <option value="dall-e-2">DALL-E 2</option>
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                    </div>
                                )}

                                {/* Format Dropdown */}
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
                                        <option value="1:1">1:1</option>
                                        <option value="9:16">9:16</option>
                                        <option value="16:9">16:9</option>
                                        <option value="3:4">3:4</option>
                                        <option value="4:3">4:3</option>
                                        <option value="3:2">3:2</option>
                                        <option value="2:3">2:3</option>
                                        <option value="512">512</option>
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                </div>

                                {/* Generate Button */}
                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading || !prompt.trim()}
                                    className="ml-auto"
                                >
                                    {loading ? 'Generating...' : '✨ Run'}
                                </Button>
                            </div>

                            {/* Quick prompts */}
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Examples:</span>
                                {[
                                    'modern fitness app logo',
                                    'mobile app wireframe',
                                    'meditation app icon',
                                ].map((example) => (
                                    <button
                                        key={example}
                                        onClick={() => setPrompt(example)}
                                        disabled={loading}
                                        className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-500 rounded-lg p-4 mb-6">
                            <p className="text-red-600 dark:text-red-400">
                                <strong>Error:</strong> {error}
                            </p>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Generating with {provider === 'gemini' ? `Gemini 3 (${googleModel})` : `OpenAI (${openaiModel})`}...
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Multi-tab interface (after generation) - same as before
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">Image Generation Result</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{result.prompt}</p>
                        </div>
                        <Button onClick={handleNewSearch} variant="outline">
                            ← New Search
                        </Button>
                    </div>

                    <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 -mb-px">
                        {[
                            { id: 'preview', label: '🖼️ Preview' },
                            { id: 'variations', label: '🎨 Variations' },
                            { id: 'code', label: '</> Code' },
                            { id: 'analytics', label: '📊 Analytics' },
                            { id: 'screens', label: '📱 Screens' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {activeTab === 'preview' && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Generated Image</h2>
                                <span className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                                    {result.provider}
                                </span>
                            </div>

                            {result.imageUrl && (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <div className="border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 max-w-[375px] w-full">
                                            <img
                                                src={result.imageUrl}
                                                alt={result.prompt}
                                                className="w-full h-auto"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    setError('Failed to load image.');
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => window.open(result.imageUrl, '_blank')}
                                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        >
                                            Open Full Size
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(result.imageUrl);
                                                alert('Image URL copied!');
                                            }}
                                            className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            Copy URL
                                        </button>
                                        <button
                                            onClick={() => {
                                                addReferenceImage(result.imageUrl);
                                                alert('✅ Image added to Clip Tray!');
                                            }}
                                            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                                        >
                                            🎨 Add to Clip Tray
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const success = await saveScreen({
                                                    image_url: result.imageUrl,
                                                    prompt: result.prompt,
                                                    model: googleModel || 'nano-banana',
                                                    output_format: outputFormat,
                                                    aspect_ratio: aspectRatio,
                                                });
                                                if (success) {
                                                    alert('📱 Screen saved!');
                                                } else {
                                                    alert('❌ Failed to save screen');
                                                }
                                            }}
                                            className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                                        >
                                            📱 Add to Screen List
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'variations' && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Generate Variations</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                    <p className="text-slate-400">Variation {i}</p>
                                </div>
                            ))}
                        </div>
                        <Button className="mt-4">Generate 6 Variations</Button>
                    </div>
                )}

                {activeTab === 'code' && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Integration Code</h2>
                        <pre className="p-4 bg-slate-100 dark:bg-slate-900 rounded overflow-auto text-sm">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Generation Analytics</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <p className="text-sm text-slate-600 dark:text-slate-400">Provider</p>
                                <p className="text-2xl font-bold mt-1">{result.provider}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <p className="text-sm text-slate-600 dark:text-slate-400">Model</p>
                                <p className="text-2xl font-bold mt-1">{result.options?.googleModel || result.options?.openaiModel || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                                <p className="text-2xl font-bold mt-1 text-green-600">Success</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'screens' && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Screen List ({generatedImages.length})</h2>
                            {generatedImages.length > 0 && (
                                <button
                                    onClick={async () => {
                                        if (confirm('Clear all screens? This cannot be undone.')) {
                                            // Delete all screens one by one
                                            for (const screen of generatedImages) {
                                                await deleteScreen(screen.id);
                                            }
                                        }
                                    }}
                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {generatedImages.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-lg mb-2">📱 No screens saved yet</p>
                                <p className="text-sm">Generate images and click "Add to Screen List" to save them here</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {generatedImages.map((screen, index) => (
                                    <div key={screen.id} className="border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
                                        <div className="aspect-[9/16] relative">
                                            <img
                                                src={screen.image_url}
                                                alt={screen.prompt}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-2">
                                            <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-1">
                                                {screen.prompt}
                                            </p>
                                            <p className="text-xs text-slate-500 mb-2">
                                                {screen.model}
                                            </p>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => window.open(screen.image_url, '_blank')}
                                                    className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Remove this screen?')) {
                                                            const success = await deleteScreen(screen.id);
                                                            if (!success) {
                                                                alert('❌ Failed to remove screen');
                                                            }
                                                        }
                                                    }}
                                                    className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
