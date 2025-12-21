import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CreditAlertProps {
    message: string;
    description: string;
    onClose: () => void;
    duration?: number;
}

export function CreditAlert({ message, description, onClose, duration = 12000 }: CreditAlertProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const alertContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 pointer-events-none">
                {/* Backdrop to ensure visibility */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="relative w-full max-w-md pointer-events-auto"
                >
                    <div
                        className="rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.3)] border-2 border-red-500/50 bg-[#11121D]"
                    >
                        {/* Header/Gradient */}
                        <div className="h-2 bg-gradient-to-r from-red-600 via-pink-600 to-red-600" />

                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 text-2xl shadow-inner">
                                    💳
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        {message}
                                    </h3>
                                    <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                                        {description}
                                    </p>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => window.open('/credits', '_blank')}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all shadow-lg active:scale-95"
                                        >
                                            Add Credits
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-all active:scale-95"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="h-1 bg-slate-800 w-full overflow-hidden">
                            <motion.div
                                className="h-full bg-red-500"
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: duration / 1000, ease: 'linear' }}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return typeof window !== 'undefined' ? createPortal(alertContent, document.body) : null;
}
