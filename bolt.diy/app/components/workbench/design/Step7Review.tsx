import { useStore } from '@nanostores/react';
import { designWizardStore, updateStep7Data } from '~/lib/stores/designWizard';
import { motion } from 'framer-motion';
import { generatePRD } from '~/lib/utils/prdGenerator';
import { toast } from 'react-toastify';
import { useState } from 'react';

export function Step7Review() {
    const wizardData = useStore(designWizardStore);
    const { step1, step3, step4, step5, step6, step7 } = wizardData;
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const selectedScreens = (step5.generatedScreens || []).filter((s: any) => s.selected);
    const enabledIntegrations = (step6.integrations || []).filter((i: any) => i.enabled);

    const selectedNavBar = step4.navigation.selectedVariationId
        ? step4.navigation.navBarVariations.find((v: any) => v.id === step4.navigation.selectedVariationId)?.url
        : step4.navigation.generatedNavBar?.url;

    // Check if navigation exists (either has a navbar image OR type is bottom)
    const hasNavigation = step4.navigation.type === 'bottom' || selectedNavBar || step4.navigation.items.length > 0;

    const handleDownloadPRD = () => {
        const prd = generatePRD(wizardData);
        const blob = new Blob([prd], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(step7.projectName || step1.appName || 'project').toLowerCase()}-prd.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('PRD generated and downloaded successfully!');
    };

    return (
        <div className="w-[880px] max-h-[85vh] overflow-y-auto custom-scrollbar bg-[#06080F] border-2 border-[#1E2533] rounded-3xl p-8 pb-60 shadow-2xl pointer-events-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-black text-white mb-1 flex items-center gap-3">
                    <div className="i-ph:rocket-launch-duotone text-blue-500" />
                    Review & Generate
                </h2>
                <div className="flex justify-between items-center">
                    <p className="text-slate-400 text-sm font-medium italic">
                        Final review of your application architecture and design system.
                    </p>
                    <button
                        onClick={handleDownloadPRD}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                    >
                        <div className="i-ph:file-text text-base" />
                        Download PRD
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* App Identity Section */}
                <section className="bg-[#0B0F1C] border border-[#1E2533] rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <div className="i-ph:identification-card text-6xl text-blue-400" />
                    </div>

                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        App Identity
                    </h3>

                    <div className="flex flex-col gap-8">
                        {/* Logo & NavBar Preview */}
                        <div className="w-full space-y-3">
                            <div className="flex gap-3">
                                <div className="w-24 h-24 flex-shrink-0 rounded-2xl bg-[#06080F] border-2 border-[#1E2533] p-4 flex items-center justify-center shadow-inner relative group/logo">
                                    {step3.logo ? (
                                        <>
                                            <img src={step3.logo.url} alt="Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                                            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/logo:opacity-100 transition-opacity rounded-2xl" />
                                        </>
                                    ) : (
                                        <div className="i-ph:image text-slate-700 text-3xl" />
                                    )}
                                </div>
                                <div className="flex-1 h-24 rounded-2xl bg-[#06080F] border-2 border-[#1E2533] overflow-hidden flex items-center justify-center shadow-inner relative group/nav">
                                    {selectedNavBar ? (
                                        <>
                                            <img src={selectedNavBar} alt="Navbar" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/nav:opacity-100 transition-opacity" />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="i-ph:rows-duotone text-slate-700 text-2xl" />
                                            <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">No Navbar</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between px-1">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Brand Mark</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Navigation</p>
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            <div>
                                <h4 className="text-2xl font-black text-white leading-tight">{step7.projectName || step1.appName || 'Untitled Project'}</h4>
                                <div>
                                    <p className={`text-slate-400 text-sm mt-1 leading-relaxed font-medium ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}>
                                        {step1.description}
                                    </p>
                                    {step1.description && step1.description.length > 120 && (
                                        <button
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                            className="bg-transparent border-none p-0 h-auto text-blue-400 hover:text-blue-300 text-xs font-bold mt-1 transition-colors hover:underline"
                                        >
                                            {isDescriptionExpanded ? 'Show less' : 'Show more'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <Badge icon="i-ph:tag" label={step1.category || 'General'} color="blue" />
                                <Badge icon="i-ph:users" label={step1.targetAudience || 'General'} color="purple" />
                                <Badge icon="i-ph:device-mobile" label={step1.platform.toUpperCase()} color="amber" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Design System Section */}
                <section className="grid grid-cols-1 gap-6">
                    <div className="bg-[#0B0F1C] border border-[#1E2533] rounded-2xl p-6">
                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            Visual Language
                        </h3>

                        <div className="space-y-4">
                            {/* Color Palette */}
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Color Core</p>
                                <div className="flex gap-1.5">
                                    {step3.colorPalette && (
                                        <>
                                            <ColorDisk color={step3.colorPalette.primary} label="Pri" />
                                            <ColorDisk color={step3.colorPalette.secondary} label="Sec" />
                                            <ColorDisk color={step3.colorPalette.accent} label="Acc" />
                                            <ColorDisk color={step3.colorPalette.background} label="Bg" />
                                            <ColorDisk color={step3.colorPalette.text.primary} label="Txt" />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Typography */}
                            <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Typography</p>
                                <p className="text-white font-bold text-lg leading-tight truncate">
                                    {step3.typography?.fontFamily.split(',')[0] || 'Inter'}
                                </p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">H1: {step3.typography?.scale.h1.size}px</span>
                                    <span className="text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">Body: {step3.typography?.scale.body.size}px</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0B0F1C] border border-[#1E2533] rounded-2xl p-6">
                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            Architecture
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-[#06080F] rounded-xl border border-[#1E2533]">
                                <div className="flex items-center gap-3">
                                    <div className="i-ph:stack-duotone text-blue-400 text-xl" />
                                    <span className="text-sm font-bold text-slate-200">Total Screens</span>
                                </div>
                                <span className="text-xl font-black text-white">{step4.screens.length}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-[#06080F] rounded-xl border border-[#1E2533]">
                                <div className="flex items-center gap-3">
                                    <div className="i-ph:rows-duotone text-purple-400 text-xl" />
                                    <span className="text-sm font-bold text-slate-200">Navigation</span>
                                </div>
                                <span className="text-xs font-black text-purple-300 uppercase bg-purple-500/10 px-2.5 py-1 rounded-full">
                                    {hasNavigation ? 'Bottom Tab Bar' : 'No Navigation'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Screens Preview Section */}
                <section className="bg-[#0B0F1C] border border-[#1E2533] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            User Interface Drafts
                        </h3>
                        <span className="text-[10px] font-black text-slate-500 uppercase">{selectedScreens.length} Screens Selected</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {selectedScreens.map((screen: any, idx: number) => (
                            <div key={idx} className="flex-shrink-0 w-36 group/screen">
                                <div className="aspect-[9/16] rounded-xl bg-[#06080F] border-2 border-[#1E2533] overflow-hidden group-hover/screen:border-blue-500/50 transition-all shadow-lg">
                                    {screen.url ? (
                                        <img src={screen.url} alt={screen.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                                            <div className="i-ph:image text-2xl text-slate-700" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] font-black text-white mt-2 truncate uppercase tracking-tighter">{screen.name}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features & Packages Section */}
                <section className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 bg-[#0B0F1C] border border-[#1E2533] rounded-2xl p-6">
                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            Final Project Configuration
                        </h3>

                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Internal Project Name</label>
                                    <input
                                        type="text"
                                        value={step7.projectName}
                                        onChange={(e) => updateStep7Data({ projectName: e.target.value })}
                                        placeholder="e.g. app-forge-project"
                                        className="w-full bg-[#06080F] border border-[#1E2533] rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all font-bold placeholder:text-slate-700 placeholder:font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Bundle Identifier</label>
                                    <input
                                        type="text"
                                        value={step7.bundleIdentifier}
                                        onChange={(e) => updateStep7Data({ bundleIdentifier: e.target.value })}
                                        placeholder="com.yourcompany.appname"
                                        className="w-full bg-[#06080F] border border-[#1E2533] rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-3">Enabled Integrations</p>
                                    <div className="flex flex-wrap gap-2">
                                        {enabledIntegrations.length > 0 ? (
                                            enabledIntegrations.map((integration: any) => (
                                                <div key={integration.id} className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                    <div className="i-ph:check-circle-duotone text-green-400 text-sm" />
                                                    <span className="text-[11px] font-black text-green-100 uppercase tracking-tight">{integration.id}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-500 italic font-medium">No external integrations selected.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase mb-3">Data Schema</p>
                                    <div className="flex flex-wrap gap-2">
                                        {step6.dataModels && step6.dataModels.length > 0 ? (
                                            step6.dataModels.map((model: any) => (
                                                <div key={model.id} className="group relative">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                                        <div className="i-ph:database-duotone text-cyan-400 text-sm" />
                                                        <span className="text-[11px] font-black text-cyan-100 uppercase tracking-tight">{model.name}</span>
                                                    </div>
                                                    {/* Tooltip on hover */}
                                                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-[#1A2133] border border-cyan-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                        <p className="text-[9px] text-cyan-400 font-black uppercase mb-1">{model.fields.length} properties</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {model.fields.slice(0, 5).map((f: any, i: number) => (
                                                                <span key={i} className="text-[8px] text-slate-400 font-mono tracking-tighter">
                                                                    {f.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-500 italic font-medium">No data models defined.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #3B82F6;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #2563EB;
                }
            `}</style>
        </div>
    );
}

function Badge({ icon, label, color }: { icon: string, label: string, color: 'blue' | 'purple' | 'amber' | 'rose' }) {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    };

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${colors[color]} text-xs font-black uppercase tracking-tight`}>
            <div className={`${icon} text-sm`} />
            {label}
        </div>
    );
}

function ColorDisk({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div
                className="w-8 h-8 rounded-full border-2 border-[#1E2533] shadow-lg"
                style={{ backgroundColor: color }}
            />
            <span className="text-[8px] font-black text-slate-500 uppercase">{label}</span>
        </div>
    );
}
