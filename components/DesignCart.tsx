'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SavedScreen {
    id: string;
    type: string;
    name: string;
    url: string;
    stage: number;
}

interface DesignCartProps {
    items: SavedScreen[];
    logo: string | null;
    onRemoveItem: (id: string) => void;
    onClear: () => void;
}

export function DesignCart({ items, logo, onRemoveItem, onClear }: DesignCartProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const totalItems = (logo ? 1 : 0) + items.length;

    // Combine logo and screens
    const allItems = [
        ...(logo ? [{ id: 'logo', type: 'logo', name: 'App Logo', url: logo, stage: 0 }] : []),
        ...items
    ];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === allItems.length - 1 ? 0 : prev + 1));
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? allItems.length - 1 : prev - 1));
    };

    const currentItem = allItems[currentIndex];

    const groupedByStage = items.reduce((acc, item) => {
        if (!acc[item.stage]) {
            acc[item.stage] = [];
        }
        acc[item.stage].push(item);
        return acc;
    }, {} as Record<number, SavedScreen[]>);

    const stageNames = {
        0: 'Logo',
        1: 'Essential Screens',
        2: 'Onboarding',
        3: 'Core Screens'
    };

    return (
        <>
            {/* Cart Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
            >
                <span className="text-2xl">🛒</span>
                <div className="text-left">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Design Cart</div>
                    <div className="text-sm font-bold">{totalItems} item{totalItems !== 1 ? 's' : ''}</div>
                </div>
                {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                        {totalItems}
                    </span>
                )}
            </button>

            {/* Cart Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    🛒 Design Cart
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {items.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to clear all items from the cart?')) {
                                                onClear();
                                                toast.success('Cart cleared');
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        🗑️ Clear All
                                    </Button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {totalItems === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="text-6xl mb-4">🛒</div>
                                    <p className="text-slate-500 text-lg">Your cart is empty</p>
                                    <p className="text-slate-400 text-sm mt-2">
                                        Generate screens and add them to your cart to see them here
                                    </p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Preview Carousel */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Preview</h3>
                                        <div className="relative bg-slate-50 dark:bg-slate-900 rounded-lg p-6 min-h-[500px] flex flex-col items-center justify-center">
                                            {currentItem && (
                                                <>
                                                    <div className="absolute top-4 left-4">
                                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                                            {currentItem.type === 'logo' ? '🎨 Logo' : `📱 ${currentItem.name}`}
                                                        </span>
                                                    </div>

                                                    <div className="text-center space-y-4">
                                                        <img
                                                            src={currentItem.url}
                                                            alt={currentItem.name}
                                                            className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                                                        />
                                                    </div>

                                                    {/* Navigation Arrows */}
                                                    {allItems.length > 1 && (
                                                        <>
                                                            <button
                                                                onClick={handlePrev}
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
                                                </>) }

                                            {/* Pagination */}
                                            {allItems.length > 1 && (
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                                                    {allItems.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setCurrentIndex(index)}
                                                            className={`h-2 rounded-full transition-all ${
                                                                index === currentIndex
                                                                    ? 'w-8 bg-blue-500'
                                                                    : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Item List */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Cart Items</h3>
                                        <div className="space-y-4">
                                            {/* Logo */}
                                            {logo && (
                                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                                    <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                                                        {stageNames[0]}
                                                    </h4>
                                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        <img
                                                            src={logo}
                                                            alt="Logo"
                                                            className="w-16 h-16 object-cover rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm">App Logo</p>
                                                            <p className="text-xs text-slate-500">Stage 0</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setCurrentIndex(0)}
                                                            className="text-blue-500 hover:text-blue-600 text-sm"
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Screens by Stage */}
                                            {Object.entries(groupedByStage)
                                                .sort(([a], [b]) => Number(a) - Number(b))
                                                .map(([stage, stageItems]) => (
                                                    <div key={stage} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                                        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                                                            {stageNames[Number(stage) as keyof typeof stageNames]} ({stageItems.length})
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {stageItems.map((item, idx) => (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                                                >
                                                                    <img
                                                                        src={item.url}
                                                                        alt={item.name}
                                                                        className="w-12 h-16 object-cover rounded"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-sm">{item.name}</p>
                                                                        <p className="text-xs text-slate-500">{item.type}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const logoOffset = logo ? 1 : 0;
                                                                            const itemsBeforeStage = items
                                                                                .filter(i => i.stage < Number(stage))
                                                                                .length;
                                                                            setCurrentIndex(logoOffset + itemsBeforeStage + idx);
                                                                        }}
                                                                        className="text-blue-500 hover:text-blue-600 text-sm mr-2"
                                                                    >
                                                                        View
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            onRemoveItem(item.id);
                                                                            toast.success('Item removed from cart');
                                                                            // Adjust current index if needed
                                                                            if (currentIndex >= allItems.length - 1) {
                                                                                setCurrentIndex(Math.max(0, currentIndex - 1));
                                                                            }
                                                                        }}
                                                                        className="text-red-500 hover:text-red-600 text-sm"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center p-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Total items: <span className="font-bold text-slate-900 dark:text-slate-100">{totalItems}</span>
                            </div>
                            <Button onClick={() => setIsOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
