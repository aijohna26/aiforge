'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DesignPage() {
    const [selectedMode, setSelectedMode] = useState<'wizard' | 'express' | null>(null);

    if (!selectedMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4">Create Your App Design</h1>
                        <p className="text-lg text-muted-foreground">
                            Choose how you'd like to design your app
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Wizard Mode */}
                        <Card className="p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-primary"
                            onClick={() => setSelectedMode('wizard')}>
                            <div className="text-center">
                                <div className="text-6xl mb-4">🧙‍♂️</div>
                                <h2 className="text-2xl font-bold mb-2">Wizard Mode</h2>
                                <p className="text-muted-foreground mb-6">
                                    Step-by-step control over every element
                                </p>

                                <div className="space-y-3 text-left mb-6">
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary">✓</span>
                                        <span className="text-sm">Choose from 3 logo options</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary">✓</span>
                                        <span className="text-sm">Customize colors & branding</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary">✓</span>
                                        <span className="text-sm">Approve each screen individually</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary">✓</span>
                                        <span className="text-sm">Full creative control</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                                    <span>⏱️</span>
                                    <span>5-10 minutes</span>
                                </div>

                                <Button className="w-full" size="lg">
                                    Start Wizard
                                </Button>
                            </div>
                        </Card>

                        {/* Express Mode */}
                        <Card className="p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-primary"
                            onClick={() => setSelectedMode('express')}>
                            <div className="text-center">
                                <div className="text-6xl mb-4">⚡</div>
                                <h2 className="text-2xl font-bold mb-2">Express Mode</h2>
                                <p className="text-muted-foreground mb-6">
                                    AI generates everything for you
                                </p>

                                <div className="space-y-3 text-left mb-6">
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary">✓</span>
                                        <span className="text-sm">Complete design in 90 seconds</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary">✓</span>
                                        <span className="text-sm">Logo, branding, all screens</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary">✓</span>
                                        <span className="text-sm">Review & approve at the end</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="text-primary">✓</span>
                                        <span className="text-sm">Fast & effortless</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                                    <span>⏱️</span>
                                    <span>90 seconds</span>
                                </div>

                                <Button className="w-full" size="lg">
                                    Start Express
                                </Button>
                            </div>
                        </Card>
                    </div>

                    <div className="text-center mt-8">
                        <Button variant="ghost">
                            Not sure? See examples
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Show wizard or express flow
    if (selectedMode === 'wizard') {
        return <WizardFlow onBack={() => setSelectedMode(null)} />;
    }

    if (selectedMode === 'express') {
        return <ExpressFlow onBack={() => setSelectedMode(null)} />;
    }

    return null;
}

function WizardFlow({ onBack }: { onBack: () => void }) {
    return (
        <div className="min-h-screen p-8">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                ← Back to mode selection
            </Button>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Wizard Mode - Coming Soon</h1>
                <p>Step-by-step design flow will be implemented here.</p>
            </div>
        </div>
    );
}

function ExpressFlow({ onBack }: { onBack: () => void }) {
    return (
        <div className="min-h-screen p-8">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                ← Back to mode selection
            </Button>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Express Mode - Coming Soon</h1>
                <p>AI-powered design generation will be implemented here.</p>
            </div>
        </div>
    );
}
