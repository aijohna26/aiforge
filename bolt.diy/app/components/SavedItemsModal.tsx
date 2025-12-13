import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/Button';
import { toast } from 'react-toastify';

interface SelectedScreen {
    id?: string;
    type: string;
    name: string;
    url: string;
}

type SavedItem = {
    id?: string;
    type: 'logo' | 'screen';
    name: string;
    url: string;
};

interface SavedItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedLogo: string | null;
    savedScreens: SelectedScreen[];
    onRemoveItem?: (item: SavedItem) => void;
}

export function SavedItemsModal({ isOpen, onClose, savedLogo, savedScreens, onRemoveItem }: SavedItemsModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Combine logo and screens into one array
    const allItems: SavedItem[] = [
        ...(savedLogo ? [{ id: 'logo', type: 'logo' as const, name: 'App Logo', url: savedLogo }] : []),
        ...savedScreens.map(screen => ({
            id: screen.id,
            type: 'screen' as const,
            name: screen.name,
            url: screen.url,
        })),
    ];

    const hasItems = allItems.length > 0;

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? allItems.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === allItems.length - 1 ? 0 : prev + 1));
    };

    const currentItem = allItems[currentIndex];

    useEffect(() => {
        if (currentIndex >= allItems.length) {
            setCurrentIndex(allItems.length > 0 ? allItems.length - 1 : 0);
        }
    }, [allItems.length, currentIndex]);

    const handleCopyImage = async (url: string) => {
        const clipboardSupported =
            typeof navigator !== 'undefined' &&
            navigator.clipboard &&
            'write' in navigator.clipboard &&
            typeof window !== 'undefined' &&
            (window as any).ClipboardItem;

        if (!clipboardSupported) {
            toast.error('Clipboard image copy not supported in this browser');
            return;
        }

        try {
            const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error('Failed to download image');
            }
            const blob = await response.blob();
            const ClipboardItemConstructor = (window as any).ClipboardItem;
            const clipboardItem = new ClipboardItemConstructor({ [blob.type]: blob });
            await navigator.clipboard.write([clipboardItem]);
            toast.success('Image copied to clipboard');
        } catch (error) {
            console.error('Failed to copy image', error);
            toast.error('Unable to copy image');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center gap-3">
                    <h2 className="text-2xl font-bold">Saved Design Assets</h2>
                    <div className="flex items-center gap-2">
                        {onRemoveItem && hasItems && currentItem && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRemoveItem(currentItem)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                🗑 Remove
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {!hasItems ? (
                    <div className="py-12 text-center">
                        <p className="text-slate-500 text-lg">No saved items yet</p>
                        <p className="text-slate-400 text-sm mt-2">
                            Complete the Logo Generation and Key Screens steps to see your saved designs here
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Current Item Display */}
                        <div className="relative bg-slate-50 dark:bg-slate-900 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center">
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                    {currentItem?.type === 'logo' ? '🎨 Logo' : '📱 Screen'}
                                </span>
                            </div>

                            <div className="text-center space-y-4">
                                <h3 className="text-xl font-semibold">{currentItem?.name}</h3>
                                <div className="flex justify-center">
                                    <div className="relative group inline-block">
                                        <img
                                            src={currentItem?.url}
                                            alt={currentItem?.name}
                                            className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                                        />
                                        {currentItem?.url && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleCopyImage(currentItem.url);
                                                }}
                                                className="absolute top-3 right-3 px-3 py-1 text-xs font-medium rounded-full bg-slate-900/80 text-white shadow opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                                                aria-label="Copy image to clipboard"
                                            >
                                                Copy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Arrows */}
                            {allItems.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePrevious}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full p-3 shadow-lg transition-all"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full p-3 shadow-lg transition-all"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Pagination Indicator */}
                        <div className="flex justify-center items-center gap-2">
                            <span className="text-sm text-slate-500">
                                {currentIndex + 1} / {allItems.length}
                            </span>
                            <div className="flex gap-1">
                                {allItems.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentIndex(index)}
                                        className={`h-2 rounded-full transition-all ${index === currentIndex
                                            ? 'w-8 bg-blue-500'
                                            : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Thumbnail Grid */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <h4 className="text-sm font-medium mb-3 text-slate-600 dark:text-slate-400">All Items</h4>
                            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                                {allItems.map((item, index) => (
                                    <div
                                        key={index}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setCurrentIndex(index)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setCurrentIndex(index);
                                            }
                                        }}
                                        className={`relative group aspect-square rounded border-2 transition-all overflow-hidden cursor-pointer ${index === currentIndex
                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                            }`}
                                    >
                                        <img
                                            src={item.url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-x-2 bottom-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                                            {onRemoveItem && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveItem(item);
                                                    }}
                                                    className="px-2 py-1 rounded-full bg-red-600 text-white uppercase tracking-wide"
                                                    aria-label={`Remove ${item.name}`}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyImage(item.url);
                                                }}
                                                className="px-2 py-1 rounded-full bg-slate-900/80 text-white uppercase tracking-wide"
                                                aria-label={`Copy ${item.name}`}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        {index === currentIndex && (
                                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center pointer-events-none">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}
