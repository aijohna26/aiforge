"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Sparkles, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const errorDescription = searchParams.get("error_description");
        if (errorDescription) {
            setError(errorDescription);
        }
    }, [searchParams]);

    // Password validation states
    const [passwordFocused, setPasswordFocused] = useState(false);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const passwordLongEnough = password.length >= 6;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validation
        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        const supabase = createClient();

        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
            return;
        }

        setSuccess(true);

        // Redirect to login after 2 seconds
        setTimeout(() => {
            router.push("/login?reset=success");
        }, 2000);
    };

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
                <div className="w-full max-w-md text-center">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Password updated!</h1>
                    <p className="text-slate-400 mb-6">
                        Your password has been successfully reset.
                    </p>
                    <p className="text-sm text-slate-500">
                        Redirecting you to login...
                    </p>
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
                    <h1 className="text-2xl font-bold text-white">Set new password</h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Choose a strong password for your account
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* New Password */}
                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm text-slate-300">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setPasswordFocused(true)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-10 pr-12 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>

                        {/* Password requirements */}
                        {passwordFocused && (
                            <div className="mt-2 space-y-1">
                                <div className={`flex items-center gap-2 text-xs ${passwordLongEnough ? 'text-green-400' : 'text-slate-500'}`}>
                                    {passwordLongEnough ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                        <XCircle className="h-3 w-3" />
                                    )}
                                    At least 6 characters
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="mb-2 block text-sm text-slate-300">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-10 pr-12 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>

                        {/* Password match indicator */}
                        {confirmPassword.length > 0 && (
                            <div className={`mt-2 flex items-center gap-2 text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                                {passwordsMatch ? (
                                    <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        Passwords match
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-3 w-3" />
                                        Passwords do not match
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading || !passwordLongEnough || !passwordsMatch}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating password...
                            </>
                        ) : (
                            "Update password"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
