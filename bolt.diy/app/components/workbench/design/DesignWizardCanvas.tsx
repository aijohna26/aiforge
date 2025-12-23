import { useStore } from '@nanostores/react';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { designWizardStore, goToNextStep, goToPreviousStep, canProceedToNextStep, resetDesignWizard, updateStep6Data, setCurrentStep } from '~/lib/stores/designWizard';
import { MoodBoardFrame } from './MoodBoardFrame';
import { WizardStep1Form } from './WizardStep1Form';
import { BrandStyleFrame } from './BrandStyleFrame';
import { ScreenFlowFrame } from './ScreenFlowFrame';
import { Step5Frame } from './Step5Frame';
import { Step6Features } from './Step6Features';
import { Step7Review } from './Step7Review';
import { extractStyleGuideFromMoodboard } from '~/lib/styleGuideExtraction';
import { updateStep7Data } from '~/lib/stores/designWizard';
import { generateBootstrapPrompt } from '~/lib/utils/bootstrapPromptGenerator';
import { generatePRD } from '~/lib/utils/prdGenerator';
import { Step5Interactive } from './Step5Interactive';
import { isFeatureEnabled, FEATURES } from '~/utils/featureFlags';
import { chatStore } from '~/lib/stores/chat';

interface DesignWizardCanvasProps {
    zoom?: number;
    panX?: number;
    panY?: number;
    onRecenter?: () => void;
}

export function DesignWizardCanvas({ zoom = 1, panX = 0, panY = 0, onRecenter }: DesignWizardCanvasProps) {
    const wizardData = useStore(designWizardStore);
    const { currentStep, isProcessing: globalIsProcessing } = wizardData;
    const [isAnimating, setIsAnimating] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const logoProcessStatus = wizardData.step3.logoProcessStatus;
    const isLogoGenerating = logoProcessStatus === 'generating';
    const awaitsLogo = currentStep === 3 && !wizardData.step3.logo;
    const awaitingLogoCompletion = awaitsLogo;

    const isProcessing = globalIsProcessing || isExtracting || isGenerating || isAnimating || isLogoGenerating;

    // Force internal scroll reset to top when step changes
    useEffect(() => {
        const scrollContainers = document.querySelectorAll('.overflow-y-auto');
        scrollContainers.forEach((container) => {
            container.scrollTo({ top: 0, behavior: 'instant' });
        });
    }, [currentStep]);

    const handleClearSession = () => {
        resetDesignWizard();
        chatStore.setKey('handedOver', false);
        chatStore.setKey('showChat', true);
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

            // Get current image IDs
            const currentImageIds = wizardData.step2.referenceImages.map((img) => img.id);
            const lastExtractedImageIds = wizardData.step3.lastExtractedImageIds || [];

            // Check if mood board has changed since last extraction
            const moodBoardHasChanged =
                currentImageIds.length !== lastExtractedImageIds.length ||
                !currentImageIds.every((id) => lastExtractedImageIds.includes(id));

            // Check if we already have style data extracted from these exact images
            const hasExistingStyleData = !!(wizardData.step3.colorPalette && wizardData.step3.typography);

            if (hasExistingStyleData && !moodBoardHasChanged) {
                // Style data already exists and mood board hasn't changed - no need to re-extract
                console.log('[DesignWizard] Skipping style extraction - mood board unchanged, data already exists');
                triggerStepAdvance();
                return;
            }

            try {
                setIsExtracting(true);
                const imageUrls = wizardData.step2.referenceImages.map((img) => img.url);
                const imageIds = wizardData.step2.referenceImages.map((img) => img.id);
                await extractStyleGuideFromMoodboard(imageUrls, imageIds);
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

            // Create a finalized version of data with permanent Supabase URLs
            const finalizedWizardData = {
                ...wizardData,
                step3: {
                    ...wizardData.step3,
                    logo: (wizardData.step3.logo && finalizeData.logoUrl)
                        ? { ...wizardData.step3.logo, url: finalizeData.logoUrl }
                        : wizardData.step3.logo
                },
                step5: {
                    ...wizardData.step5,
                    generatedScreens: wizardData.step5.generatedScreens.map(screen => {
                        const finalScreenData = finalizeData.screens.find((s: any) => s.id === screen.screenId);

                        if (finalScreenData) {
                            return {
                                ...screen,
                                url: finalScreenData.url,
                                variations: finalScreenData.variations || screen.variations
                            };
                        }

                        return screen;
                    })
                }
            };

            // 2. Generate PRD and tickets
            const prdGenerated = generatePRD(finalizedWizardData);

            // Generate tickets from PRD
            const { generateTicketsFromPRD, setTickets, setPlanProject } = await import('~/lib/stores/plan');
            const tickets = generateTicketsFromPRD(finalizedWizardData);

            // 3. Save full design to database with tickets
            const saveResponse = await fetch('/api/save-wizard-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...finalizedWizardData,
                    prd: prdGenerated,
                    tickets: tickets
                })
            });

            const saveData = await saveResponse.json();

            if (!saveData.success) {
                // If database save failed, WE DO NOT WIPE LOCALSTORAGE
                console.error('[Save Wizard] Error Response:', saveData);

                if (saveData.sql) {
                    toast.error(
                        <div>
                            <p className="font-bold mb-1">{saveData.error}</p>
                            <code className="block p-2 bg-black/50 rounded text-[10px] break-all mb-1 select-all">
                                {saveData.sql}
                            </code>
                            <p className="text-[10px]">Copied SQL to console for easy access.</p>
                        </div>,
                        { autoClose: 10000 }
                    );
                    console.log('%c[Supabase SQL Fix]', 'color: #3ECF8E; font-weight: bold; font-size: 14px;', '\n' + saveData.sql);
                } else {
                    toast.error(`Database save failed: ${saveData.error}`);
                }

                setIsGenerating(false);
                return;
            }

            // 4. Initialize Plan store with tickets
            const { resetPlan } = await import('~/lib/stores/plan');
            resetPlan(); // Ensure clean slate before setting new project context

            const projectKey = finalizedWizardData.step7.projectName
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .substring(0, 4) || 'PROJ';

            setPlanProject(saveData.project?.id || saveData.projectId, projectKey, saveData.prdUrl);
            setTickets(tickets);

            // 5. Store the project ID so future saves are upserts
            const { setProjectId } = await import('~/lib/stores/designWizard');
            setProjectId(saveData.project?.id || saveData.projectId);

            // 6. Success!
            setIsGenerating(false);

            // Trigger AI Scaffolding automatically
            const bootstrapPrompt = generateBootstrapPrompt(finalizedWizardData);
            chatStore.setKey('bootstrapPrompt', bootstrapPrompt);

            // Re-enable chat immediately
            chatStore.setKey('handedOver', false);
            chatStore.setKey('showChat', true);

            toast.success('PRD Generated! AI is now scaffolding your project baseline...');

            // Navigate to Code view instead of Plan (since we are bootstrapping)
            if (typeof window !== 'undefined') {
                const { workbenchStore } = await import('~/lib/stores/workbench');
                workbenchStore.currentView.set('code');
                workbenchStore.showWorkbench.set(true);
            }

        } catch (error) {
            console.error('Finalization error:', error);
            setIsGenerating(false);

            // Re-enable chat on error too, so user can ask for help/debug
            chatStore.setKey('handedOver', false);
            chatStore.setKey('showChat', true);

            toast.error('Failed to generate PRD. Please try again.');
        }
    };

    // Calculate horizontal offset for current step (each step is 1000px apart)
    const stepOffset = -(currentStep - 1) * 1000;

    interface WizardStep {
        id: number;
        title: string;
        description: string;
        component: React.ReactNode;
        width: number;
    }

    const steps: WizardStep[] = [
        {
            id: 1,
            title: 'App Information',
            description: 'Tell us about your app',
            component: <WizardStep1Form zoom={zoom} panX={panX} panY={panY} />,
            width: 700
        },
        {
            id: 2,
            title: 'Style Guide',
            description: 'Upload images to create your mood board',
            component: <MoodBoardFrame zoom={zoom} panX={panX} panY={panY} />,
            width: 700
        },
        {
            id: 3,
            title: 'Brand Assets',
            description: 'Generate logo and color palette',
            component: <BrandStyleFrame />,
            width: 900
        },
        {
            id: 4,
            title: 'Screen Flow',
            description: 'Map out your app screens',
            component: <ScreenFlowFrame />,
            width: 900
        },
        {
            id: 5,
            title: 'Screen Generation',
            description: 'Generate screen designs with AI',
            component: isFeatureEnabled(FEATURES.DUBS_INTERACTIVE_MOCKS) ? <Step5Interactive /> : <Step5Frame />,
            width: 1100
        },
        {
            id: 6,
            title: 'Features',
            description: 'Configure app features',
            component: (
                <Step6Features
                    selectedIntegrations={wizardData.step6.integrations}
                    onUpdate={(integrations) => updateStep6Data({ integrations })}
                    onComplete={() => triggerStepAdvance()}
                />
            ),
            width: 1200
        },
        {
            id: 7,
            title: 'Review & Generate',
            description: 'Review and generate your app',
            component: <Step7Review />,
            width: 1000
        },
    ];

    return (
        <>
            {/* VS Code Inspired Absolute Navigation Bar */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333] rounded-full px-6 py-2.5 shadow-2xl">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                onClick={() => {
                                    if (isProcessing) return;
                                    if (wizardData.completedSteps.includes(step.id) || step.id <= currentStep) {
                                        setCurrentStep(step.id);
                                    } else {
                                        toast.info(`Complete Step ${currentStep} to unlock Step ${step.id}`);
                                    }
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${currentStep === step.id
                                    ? 'bg-blue-600 text-white scale-110 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                                    : wizardData.completedSteps.includes(step.id)
                                        ? 'bg-green-600/90 text-white'
                                        : 'bg-[#252525] text-slate-400 border border-[#404040]'
                                    }`}
                            >
                                {wizardData.completedSteps.includes(step.id) ? (
                                    <div className="i-ph:check-bold text-sm" />
                                ) : (
                                    step.id
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`w-10 h-[1px] mx-1 transition-all duration-300 ${wizardData.completedSteps.includes(step.id)
                                        ? 'bg-green-600/50'
                                        : 'bg-[#333]'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Clear Session Button */}
                <button
                    onClick={() => !isProcessing && setShowClearConfirm(true)}
                    disabled={isProcessing}
                    className={`bg-[#1A1A1A] border border-[#333] rounded-full px-5 py-2.5 shadow-2xl transition-all group flex items-center gap-2 ${isProcessing ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#252525] hover:border-[#444]'}`}
                    title={isProcessing ? "Disabled during generation" : "Clear all progress and start over"}
                >
                    <div className="i-ph:trash-bold text-slate-400 group-hover:text-red-400 transition-colors text-base" />
                    <span className="text-slate-200 group-hover:text-red-400 font-medium text-sm transition-colors">Clear Session</span>
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
                                className="absolute top-[90px]"
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
                                    {/* Active Step Indicator - Integrated inside the card */}
                                    {isActive && (
                                        <div className="absolute top-6 right-6 z-10 pointer-events-none">
                                            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/30 rounded-full px-3 py-1.5 shadow-sm">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                                <span className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">
                                                    Current Action
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

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Miro-style Sticky Navigation Tray */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
                <div className="flex items-center gap-4 bg-[#11121D]/80 backdrop-blur-xl border border-[#1F243B] rounded-2xl px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
                    {/* Recenter Button (Miro style) */}
                    <button
                        onClick={() => {
                            if (isProcessing) return;
                            onRecenter?.();
                            const scrollContainers = document.querySelectorAll('.overflow-y-auto');
                            scrollContainers.forEach((container) => {
                                container.scrollTo({ top: 0, behavior: 'instant' });
                            });
                        }}
                        disabled={isProcessing}
                        className={`p-2.5 rounded-xl transition-all border group ${isProcessing
                            ? 'opacity-30 cursor-not-allowed border-transparent text-slate-500'
                            : 'bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'}`}
                        title={isProcessing ? "Disabled during generation" : "Recenter Camera (Focus on Current Step)"}
                    >
                        <div className="i-ph:crosshair-simple-bold text-xl group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="w-[1px] h-8 bg-slate-800 mx-2" />

                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        disabled={currentStep <= 1 || isProcessing}
                        className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border ${currentStep <= 1 || isProcessing
                            ? 'opacity-30 cursor-not-allowed border-transparent text-slate-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                            }`}
                    >
                        <div className="i-ph:caret-left-bold" />
                        Back
                    </button>

                    {/* Progress Info */}
                    <div className="px-6 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Progress</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-blue-400">{currentStep}</span>
                            <span className="text-xs font-bold text-slate-600">/</span>
                            <span className="text-sm font-bold text-slate-400">{steps.length}</span>
                        </div>
                    </div>

                    {/* Next / Finish Button */}
                    {currentStep < 7 ? (
                        <button
                            onClick={handleNext}
                            disabled={
                                !canProceedToNextStep() ||
                                isProcessing ||
                                (currentStep === 3 && awaitingLogoCompletion)
                            }
                            className={`px-8 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg ${!canProceedToNextStep() || isProcessing || (currentStep === 3 && awaitingLogoCompletion)
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                                }`}
                        >
                            {currentStep === 2 && isExtracting
                                ? 'Analyzing…'
                                : currentStep === 3 && awaitingLogoCompletion
                                    ? (isLogoGenerating ? 'Generating…' : 'Waiting…')
                                    : 'Next Step'}
                            {!isExtracting && !(currentStep === 3 && awaitingLogoCompletion) && (
                                <div className="i-ph:caret-right-bold" />
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={!canProceedToNextStep() || isGenerating || isAnimating}
                            className={`px-8 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg ${!canProceedToNextStep() || isGenerating || isAnimating
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="i-ph:circle-notch animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <div className="i-ph:rocket-launch-bold" />
                                    Generate PRD
                                </>
                            )}
                        </button>
                    )}
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
