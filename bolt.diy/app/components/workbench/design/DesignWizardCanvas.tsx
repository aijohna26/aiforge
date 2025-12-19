import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { designWizardStore, goToNextStep, goToPreviousStep, canProceedToNextStep, resetDesignWizard, updateStep6Data } from '~/lib/stores/designWizard';
import { MoodBoardFrame } from './MoodBoardFrame';
import { WizardStep1Form } from './WizardStep1Form';
import { BrandStyleFrame } from './BrandStyleFrame';
import { ScreenFlowFrame } from './ScreenFlowFrame';
import { Step5Frame } from './Step5Frame';
import { Step6Features } from './Step6Features';
import { Step7Review } from './Step7Review';
import { extractStyleGuideFromMoodboard } from '~/lib/styleGuideExtraction';
import { updateStep7Data } from '~/lib/stores/designWizard';

interface DesignWizardCanvasProps {
    zoom?: number;
    panX?: number;
    panY?: number;
}

export function DesignWizardCanvas({ zoom = 1, panX = 0, panY = 0 }: DesignWizardCanvasProps) {
    const wizardData = useStore(designWizardStore);
    const { currentStep } = wizardData;
    const [isAnimating, setIsAnimating] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const logoProcessStatus = wizardData.step3.logoProcessStatus;
    const isLogoGenerating = logoProcessStatus === 'generating';
    const awaitsLogo = currentStep === 3 && !wizardData.step3.logo;
    const awaitingLogoCompletion = awaitsLogo;

    const handleClearSession = () => {
        resetDesignWizard();
        setShowClearConfirm(false);
    };

    const triggerStepAdvance = () => {
        setIsAnimating(true);
        setTimeout(() => {
            goToNextStep();
            setIsAnimating(false);
        }, 400);
    };

    const handleNext = async () => {
        if (!canProceedToNextStep() || isAnimating || currentStep >= 7 || isExtracting) return;
        if (awaitingLogoCompletion) return;

        if (currentStep === 2) {
            if (wizardData.step3.entryMode === 'manual') {
                triggerStepAdvance();
                return;
            }
            if (!wizardData.step2.referenceImages.length) return;
            try {
                setIsExtracting(true);
                await extractStyleGuideFromMoodboard(wizardData.step2.referenceImages.map((img) => img.url));
                triggerStepAdvance();
            } catch (error) {
                // errors handled in helper via toast; stay on step 2
            } finally {
                setIsExtracting(false);
            }
            return;
        }

        if (currentStep === 6) {
            // Auto-initialize project name if not set
            if (!wizardData.step7.projectName) {
                const name = wizardData.step1.appName
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                updateStep7Data({
                    projectName: name || `project-${Date.now()}`,
                    bundleIdentifier: `com.appforge.${name || 'project'}`
                });
            }
        }

        triggerStepAdvance();
    };

    const handleBack = () => {
        if (currentStep <= 1 || isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            goToPreviousStep();
            setIsAnimating(false);
        }, 400);
    };

    const handleFinish = async () => {
        if (isGenerating) return;

        try {
            setIsGenerating(true);

            // 1. Finalize images (persist to Supabase storage)
            const finalizeResponse = await fetch('/api/finalize-design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logoUrl: wizardData.step3.logo?.url,
                    screens: wizardData.step5.generatedScreens
                        .filter(s => s.selected)
                        .map(s => ({ id: s.screenId, url: s.url }))
                })
            });

            const finalizeData = await finalizeResponse.json();

            if (!finalizeData.success) {
                throw new Error('Failed to finalize images');
            }

            // 2. Save full design to database
            const saveResponse = await fetch('/api/save-wizard-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(wizardData)
            });

            const saveData = await saveResponse.json();

            if (!saveData.success) {
                console.warn('Database save failed, but images were persisted:', saveData.error);
            }

            // 3. Success!
            setIsGenerating(false);
            resetDesignWizard();

            // Navigate or show success
            if (typeof window !== 'undefined') {
                window.location.href = '/?generated=true';
            }

        } catch (error) {
            console.error('Finalization error:', error);
            setIsGenerating(false);
            // toast.error('Failed to generate app. Please try again.');
        }
    };

    // Calculate horizontal offset for current step (each step is 1000px apart)
    const stepOffset = -(currentStep - 1) * 1000;

    const steps = [
        {
            id: 1,
            title: 'App Information',
            description: 'Tell us about your app',
            component: <WizardStep1Form zoom={1} panX={0} panY={0} />,
        },
        {
            id: 2,
            title: 'Style Guide',
            description: 'Upload images to create your mood board',
            component: <MoodBoardFrame zoom={1} panX={0} panY={0} />,
        },
        {
            id: 3,
            title: 'Brand Assets',
            description: 'Generate logo and color palette',
            component: <BrandStyleFrame />,
        },
        {
            id: 4,
            title: 'Screen Flow',
            description: 'Map out your app screens',
            component: <ScreenFlowFrame />,
        },
        {
            id: 5,
            title: 'Screen Generation',
            description: 'Generate screen designs with AI',
            component: <Step5Frame />,
        },
        {
            id: 6,
            title: 'Features',
            description: 'Configure app features',
            component: (
                <Step6Features
                    selectedIntegrations={wizardData.step6.integrations}
                    dataModels={wizardData.step6.dataModels}
                    onUpdate={(integrations, dataModels) => updateStep6Data({ integrations, dataModels })}
                    onComplete={() => triggerStepAdvance()}
                />
            ),
        },
        {
            id: 7,
            title: 'Review & Generate',
            description: 'Review and generate your app',
            component: <Step7Review />,
        },
    ];

    return (
        <>
            {/* Progress Indicator with Clear Session Button */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] rounded-full px-6 py-3 shadow-lg">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${currentStep === step.id
                                    ? 'bg-blue-600 text-white scale-110'
                                    : wizardData.completedSteps.includes(step.id)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-[#2a2a2a] text-slate-300'
                                    }`}
                            >
                                {wizardData.completedSteps.includes(step.id) ? (
                                    <div className="i-ph:check text-sm" />
                                ) : (
                                    step.id
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`w-12 h-0.5 mx-1 transition-all duration-300 ${wizardData.completedSteps.includes(step.id)
                                        ? 'bg-green-600'
                                        : 'bg-[#2a2a2a]'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Clear Session Button */}
                <button
                    onClick={() => setShowClearConfirm(true)}
                    className="bg-[#1a1a1a] border border-[#333] rounded-full px-4 py-2 shadow-lg hover:bg-[#2a2a2a] transition-colors text-slate-200 hover:text-red-400 text-sm flex items-center gap-2"
                    title="Clear all progress and start over"
                >
                    <div className="i-ph:trash text-base" />
                    Clear Session
                </button>
            </div>

            {/* Clear Session Confirmation Dialog */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-2xl max-w-md mx-4">
                        <h3 className="text-xl font-bold text-white mb-2">Clear Session?</h3>
                        <p className="text-slate-100 font-medium mb-6">
                            Are you sure you want to clear all your progress? This will reset the entire design wizard and cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="px-4 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearSession}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                                Yes, Clear Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Steps Container with Smooth Animation */}
            <div
                className="absolute left-0 top-0 w-full h-full pointer-events-none"
                style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                }}
            >
                <div
                    className="absolute top-0 left-0 h-full transition-transform duration-500 ease-in-out"
                    style={{
                        transform: `translateX(${stepOffset}px)`,
                        width: `${steps.length * 1000}px`,
                    }}
                >
                    {steps.map((step, index) => {
                        const isActive = currentStep === step.id;
                        const xPosition = 200 + index * 1000;

                        return (
                            <div
                                key={step.id}
                                className="absolute top-[100px]"
                                style={{
                                    left: `${xPosition}px`,
                                    opacity: isActive ? 1 : 0,
                                    visibility: isActive ? 'visible' : 'hidden',
                                    pointerEvents: isActive ? 'auto' : 'none',
                                    transition: 'opacity 0.5s ease-in-out',
                                }}
                            >
                                {/* Step Frame Container */}
                                <div className="relative">
                                    {/* Active Step Indicator */}
                                    {isActive && (
                                        <div className="absolute -top-16 left-0 right-0 text-center">
                                            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-600/50 rounded-full px-4 py-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                                <span className="text-blue-400 font-semibold text-sm">
                                                    Current Step: {step.title}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step Content */}
                                    {step.component || (
                                        <div className="pointer-events-auto bg-[#1a1a1a] border-2 border-[#333] rounded-xl p-10 shadow-2xl w-[700px]">
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold text-white mb-2">
                                                    Step {step.id}: {step.title}
                                                </h2>
                                                <p className="text-sm text-gray-400">{step.description}</p>
                                            </div>
                                            <div className="flex items-center justify-center h-[400px] text-gray-500">
                                                <p className="text-sm">Coming soon...</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation Buttons */}
                                    {isActive && (
                                        <div className="absolute -bottom-20 left-0 right-0 flex justify-between items-center pointer-events-auto">
                                            {/* Back Button - Hidden on Step 1 */}
                                            {currentStep > 1 && (
                                                <button
                                                    onClick={handleBack}
                                                    className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 bg-[#2a2a2a] hover:bg-[#333] text-white border border-[#444]"
                                                >
                                                    <div className="i-ph:arrow-left text-lg" />
                                                    Back
                                                </button>
                                            )}
                                            {currentStep <= 1 && <div className="w-32"></div>}

                                            <div className="text-center text-gray-400 text-sm">
                                                Step {currentStep} of {steps.length}
                                            </div>

                                            {/* Next Button - Hidden on Step 7 */}
                                            {currentStep < 7 ? (
                                                <button
                                                    onClick={handleNext}
                                                    disabled={
                                                        !canProceedToNextStep() ||
                                                        isExtracting ||
                                                        (currentStep === 3 && awaitingLogoCompletion)
                                                    }
                                                    className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${!canProceedToNextStep() ||
                                                        isExtracting ||
                                                        (currentStep === 3 && awaitingLogoCompletion)
                                                        ? 'bg-[#2a2a2a] text-gray-600 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                    title={
                                                        !canProceedToNextStep()
                                                            ? 'Complete this step to continue'
                                                            : ''
                                                    }
                                                >
                                                    {currentStep === 2 && isExtracting
                                                        ? 'Analyzing…'
                                                        : currentStep === 3 && awaitingLogoCompletion
                                                            ? (isLogoGenerating ? 'Generating logo…' : 'Waiting for logo…')
                                                            : 'Next'}
                                                    {!isExtracting && !(currentStep === 3 && awaitingLogoCompletion) && (
                                                        <div className="i-ph:arrow-right text-lg" />
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleFinish}
                                                    disabled={!canProceedToNextStep() || isGenerating}
                                                    className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${!canProceedToNextStep() || isGenerating
                                                        ? 'bg-[#2a2a2a] text-gray-600 cursor-not-allowed'
                                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_20px_rgba(22,163,74,0.3)]'
                                                        }`}
                                                    title={
                                                        !canProceedToNextStep()
                                                            ? 'Complete this step to finish'
                                                            : ''
                                                    }
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <div className="i-ph:circle-notch animate-spin text-lg" />
                                                            Saving Project...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="i-ph:check-circle text-lg" />
                                                            Generate App
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Keyboard Navigation Helper */}
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
        </>
    );
}
