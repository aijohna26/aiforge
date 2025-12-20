import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Dialog, DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import { createClient } from '~/lib/supabase/browser';
import { toast } from 'react-toastify';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [email, setEmail] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const checkConfig = () => {
        const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !anonKey) {
            console.error('Supabase Config Missing:', { url: !!url, anonKey: !!anonKey });
            toast.error('Supabase configuration is missing. Check your .env file.');
            return false;
        }

        return true;
    };

    const handleLogin = async (provider: 'google' | 'github') => {
        if (!checkConfig()) {
            return;
        }

        setIsLoading(true);

        try {
            console.log(`Initiating ${provider} login...`);
            const supabase = createClient();

            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                throw error;
            }
        } catch (error: any) {
            console.error('Login error:', error.message || error);
            toast.error(`Login failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!checkConfig()) {
            return;
        }

        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Initiating magic link login for:', email);
            const supabase = createClient();

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                throw error;
            }

            toast.success('Check your email for the login link!');
        } catch (error: any) {
            console.error('Email login error:', error.message || error);
            toast.error(`Email login failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog onClose={onClose}>
                <div className="p-8 bg-white dark:bg-[#141414] relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-tr from-accent-500 to-orange-400 dark:from-purple-500 dark:to-blue-500 rounded-xl flex items-center justify-center mb-6">
                        <div className="i-ph:lightning-duotone text-white text-2xl" />
                    </div>

                    <DialogTitle className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Welcome to AppForge</DialogTitle>
                    <DialogDescription className="text-center mb-8 max-w-xs mx-auto text-gray-500 dark:text-gray-400">
                        Sign in to start building production-ready apps with AI.
                    </DialogDescription>

                    <form onSubmit={handleEmailLogin} className="w-full space-y-4 mb-6">
                        <div className="space-y-2">
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 h-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50 dark:focus:ring-purple-500/50 transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 h-12 text-sm font-semibold transition-all duration-200 rounded-xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-accent-500 dark:hover:border-purple-500 shadow-sm disabled:opacity-50"
                        >
                            <div className="i-ph:envelope-simple-bold text-xl opacity-80" />
                            {isLoading ? 'Sending Link...' : 'Continue with Email'}
                        </button>
                    </form>

                    <div className="relative w-full mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-white dark:bg-[#141414] text-gray-500 uppercase tracking-wider">or sign in with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                            className="flex items-center justify-center gap-3 h-12 text-sm font-semibold transition-all duration-200 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            onClick={() => handleLogin('google')}
                            disabled={isLoading}
                        >
                            <div className="i-ph:google-logo-bold text-xl" />
                            Google
                        </button>
                        <button
                            className="flex items-center justify-center gap-3 h-12 text-sm font-semibold transition-all duration-200 rounded-xl bg-[#24292F] hover:bg-[#1C1F23] text-white shadow-lg shadow-black/20 disabled:opacity-50"
                            onClick={() => handleLogin('github')}
                            disabled={isLoading}
                        >
                            <div className="i-ph:github-logo-bold text-xl" />
                            GitHub
                        </button>
                    </div>

                    <div className="mt-8 text-xs text-center text-gray-500 dark:text-gray-400">
                        By continuing, you agree to our{' '}
                        <a href="#" className="underline hover:text-gray-900 dark:hover:text-gray-200">Terms of Service</a>{' '}
                        and{' '}
                        <a href="#" className="underline hover:text-gray-900 dark:hover:text-gray-200">Privacy Policy</a>.
                    </div>
                </div>
            </Dialog>
        </RadixDialog.Root>
    );
}
