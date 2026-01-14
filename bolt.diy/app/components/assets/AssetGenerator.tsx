import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';

export type Provider = 'gemini' | 'openai';
export type GoogleModel = 'nano-banana' | 'nano-banana-pro' | 'nano-banana-edit';
export type OutputFormat = 'png' | 'jpg' | 'webp';
export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:3' | '3:4';

interface AssetGeneratorProps {
    initialPrompt?: string;
    onGenerate?: (urls: string[]) => void;
    onSelect?: (url: string, prompt: string) => void;
    className?: string;
}

export function AssetGenerator({
    initialPrompt = '',
    onGenerate,
    onSelect,
    className = ''
}: AssetGeneratorProps) {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Settings
    const [provider, setProvider] = useState<Provider>('openai');
    const [googleModel, setGoogleModel] = useState<GoogleModel>('nano-banana');
    const [quantity, setQuantity] = useState<number>(2);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

    // Editing State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const [urlToEdit, setUrlToEdit] = useState<string | null>(null);

    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const promises = Array.from({ length: quantity }, async () => {
                const response = await fetch('/api/test/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt,
                        provider,
                        googleModel: provider === 'gemini' ? googleModel : undefined,
                        outputFormat,
                        aspectRatio,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to generate image');
                }

                const data = await response.json();
                return data.success && data.imageUrl ? data.imageUrl : null;
            });

            const results = await Promise.all(promises);
            const validUrls = results.filter((url): url is string => url !== null);

            if (validUrls.length > 0) {
                setGeneratedUrls((prev) => [...prev, ...validUrls]);
                onGenerate?.(validUrls);
                toast.success(`Generated ${validUrls.length} image${validUrls.length > 1 ? 's' : ''}`);
            } else {
                setError('Failed to generate any images');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate image');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEdit = async () => {
        if (!editPrompt.trim() || !urlToEdit) return;

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/test/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: editPrompt,
                    provider: 'gemini',
                    googleModel: 'nano-banana-edit',
                    outputFormat,
                    aspectRatio,
                    referenceImages: [urlToEdit],
                }),
            });

            if (!response.ok) throw new Error('Failed to editing image');

            const data = await response.json();
            if (data.success && data.imageUrl) {
                setGeneratedUrls((prev) => [...prev, data.imageUrl]);
                setSelectedUrl(data.imageUrl);
                onSelect?.(data.imageUrl, editPrompt);
                setIsEditModalOpen(false);
                setEditPrompt('');
                toast.success('Image edited successfully');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to edit image');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Controls */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-bolt-elements-textPrimary mb-2 uppercase tracking-wide">
                        Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your asset..."
                        rows={3}
                        className="w-full px-4 py-3 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl text-sm text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus resize-none"
                    />
                </div>

                <div className="flex gap-3 items-center flex-wrap">
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as Provider)}
                        className="px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-sm text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-focus"
                    >
                        <option value="gemini">🌟 Gemini</option>
                        <option value="openai">🤖 OpenAI</option>
                    </select>

                    {provider === 'gemini' && (
                        <select
                            value={googleModel}
                            onChange={(e) => setGoogleModel(e.target.value as GoogleModel)}
                            className="px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-sm text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-focus"
                        >
                            <option value="nano-banana">Nano Banana</option>
                            <option value="nano-banana-pro">Nano Banana Pro</option>
                        </select>
                    )}

                    <select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-sm text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-focus"
                    >
                        <option value={1}>1 image</option>
                        <option value={2}>2 images</option>
                        <option value={3}>3 images</option>
                        <option value={4}>4 images</option>
                    </select>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="px-4 py-2 rounded-lg bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                        {isGenerating ? (
                            <>
                                <div className="i-ph:spinner animate-spin" /> Generating...
                            </>
                        ) : (
                            <>
                                <div className="i-ph:sparkle" /> Generate
                            </>
                        )}
                    </button>

                    {generatedUrls.length > 0 && (
                        <button
                            onClick={() => {
                                setPrompt('');
                                // Reset?
                            }}
                            className="px-4 py-2 rounded-lg bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 text-bolt-elements-textPrimary text-sm transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 border border-red-500/50 bg-red-500/10 rounded-xl text-sm text-red-200">
                    {error}
                </div>
            )}

            {/* Results Grid */}
            {generatedUrls.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-bolt-elements-textSecondary">Generated Images ({generatedUrls.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {generatedUrls.map((url, index) => (
                            <div
                                key={index}
                                onClick={() => {
                                    setSelectedUrl(url);
                                    onSelect?.(url, prompt);
                                }}
                                className={`group relative aspect-square rounded-xl border-2 overflow-hidden bg-bolt-elements-background-depth-1 cursor-pointer transition-all ${selectedUrl === url
                                        ? 'border-blue-500 shadow-lg'
                                        : 'border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive'
                                    }`}
                            >
                                <img
                                    src={url}
                                    alt={`Generated ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                                {selectedUrl === url && (
                                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                        ✓ Selected
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUrlToEdit(url);
                                            setEditPrompt('');
                                            setIsEditModalOpen(true);
                                        }}
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                                        title="Edit"
                                    >
                                        <div className="i-ph:pencil" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(url, '_blank');
                                        }}
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                                        title="View Full Size"
                                    >
                                        <div className="i-ph:eye" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Modal Portal */}
            {isEditModalOpen && urlToEdit && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-xl p-6 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-bolt-elements-textPrimary">Edit Asset</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-colors"
                            >
                                <div className="i-ph:x text-xl" />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/3">
                                <img
                                    src={urlToEdit}
                                    alt="To edit"
                                    className="w-full rounded-lg border border-bolt-elements-borderColor"
                                    crossOrigin="anonymous"
                                />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">Instructions</label>
                                    <textarea
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        placeholder="E.g., Make it darker, add a red background..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl text-sm text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus resize-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEdit}
                                        disabled={isGenerating || !editPrompt.trim()}
                                        className="px-4 py-2 rounded-lg bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        {isGenerating ? 'Editing...' : 'Generate Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
