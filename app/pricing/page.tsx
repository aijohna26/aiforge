"use client";

import { PRICING_PLANS } from "@/lib/pricing";
import { Check, Crown, Zap } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-slate-400">
                        Build faster with unlimited AI-powered previews
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Plan */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold mb-2">Free</h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-4xl font-bold">$0</span>
                                <span className="text-slate-400">/month</span>
                            </div>
                            <p className="text-sm text-slate-400">
                                Perfect for trying out the platform
                            </p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {PRICING_PLANS.free.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/editor"
                            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium text-center transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-gradient-to-b from-blue-900/20 to-purple-900/20 border-2 border-blue-500/50 rounded-2xl p-8 flex flex-col relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <Crown className="h-4 w-4" />
                            Most Popular
                        </div>

                        <div className="mb-6">
                            <h3 className="text-2xl font-bold mb-2">Pro</h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-4xl font-bold">$25</span>
                                <span className="text-slate-400">/month</span>
                            </div>
                            <p className="text-sm text-slate-400">
                                For serious developers
                            </p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {PRICING_PLANS.pro.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium text-center transition-all shadow-lg shadow-blue-500/20">
                            Upgrade to Pro
                        </button>
                    </div>

                    {/* Business Plan */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                Business
                                <Zap className="h-5 w-5 text-yellow-400" />
                            </h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-4xl font-bold">$49</span>
                                <span className="text-slate-400">/month</span>
                            </div>
                            <p className="text-sm text-slate-400">
                                For teams and enterprises
                            </p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {PRICING_PLANS.business.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <Check className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium text-center transition-colors">
                            Contact Sales
                        </button>
                    </div>
                </div>

                <div className="mt-16 text-center text-sm text-slate-500">
                    <p>All plans include access to our AI-powered development tools</p>
                    <p className="mt-2">Questions? <a href="mailto:support@appforge.ai" className="text-blue-400 hover:text-blue-300">Contact us</a></p>
                </div>
            </div>
        </div>
    );
}
