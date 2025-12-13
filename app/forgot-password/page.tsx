"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password`,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
            return;
        }

        setEmailSent(true);
        setIsLoading(false);
    };

    if (emailSent) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
                <div className="w-full max-w-md">
                    {/* Success State */}
                    <div className="text-center">
                        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
                        <p className="text-slate-400 mb-6">
                            We've sent a password reset link to{" "}
                            <span className="text-white font-medium">{email}</span>
                        </p>
                        <p className="text-sm text-slate-500 mb-8">
                            Click the link in the email to reset your password. The link will expire in 1 hour.
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => router.push("/login")}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                Back to login
                            </Button>
                            <Button
                                onClick={() => setEmailSent(false)}
                                variant="outline"
                                className="w-full border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
                            >
                                Try another email
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Reset your password</h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Enter your email address and we'll send you a reset link
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="you@example.com"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending reset link...
                            </>
                        ) : (
                            "Send reset link"
                        )}
                    </Button>
                </form>

                {/* Back to login */}
                <Link
                    href="/login"
                    className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                </Link>
            </div>
        </div>
    );
}
