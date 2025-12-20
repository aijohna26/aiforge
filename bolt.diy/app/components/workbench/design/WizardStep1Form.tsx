import { useStore } from '@nanostores/react';
import { designWizardStore, updateStep1Data, loadWizardData } from '~/lib/stores/designWizard';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface WizardStep1FormProps {
    zoom?: number;
    panX?: number;
    panY?: number;
}

export function WizardStep1Form({ zoom = 1, panX = 0, panY = 0 }: WizardStep1FormProps) {
    const wizardData = useStore(designWizardStore);
    const { step1 } = wizardData;
    const [recentProjects, setRecentProjects] = useState<any[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [showProjects, setShowProjects] = useState(false);

    useEffect(() => {
        if (showProjects) {
            fetchRecentProjects();
        }
    }, [showProjects]);

    const fetchRecentProjects = async () => {
        setIsLoadingProjects(true);
        try {
            const response = await fetch('/api/get-projects');
            const data = await response.json();
            if (data.success) {
                setRecentProjects(data.projects);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const handleRestore = (project: any) => {
        try {
            loadWizardData(project.data);
            toast.success(`Restored ${project.name}!`);
            setShowProjects(false);
        } catch (error) {
            toast.error('Failed to restore project');
        }
    };

    const handleChange = (field: keyof typeof step1, value: string) => {
        updateStep1Data({ [field]: value });
    };

    return (
        <div className="w-[770px] max-h-[85vh] overflow-y-auto custom-scrollbar pointer-events-auto bg-[#1a1a1a] border-2 border-[#333] rounded-xl p-10 pb-60 shadow-2xl">
            {/* Header */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Step 1: App Information</h2>
                    <p className="text-sm text-slate-200 font-medium">Tell me about the app you want to build</p>
                </div>
                <button
                    onClick={() => setShowProjects(!showProjects)}
                    className="mt-10 flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-bold transition-all"
                >
                    <div className="i-ph:clock-counter-clockwise-bold text-sm" />
                    RECOUP SAVED DESIGN
                </button>
            </div>

            {/* Recent Projects Modal/Dropdown */}
            {showProjects && (
                <div className="mb-8 p-4 bg-[#111] border border-[#333] rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Saved Projects in Database</h3>
                        <button onClick={() => setShowProjects(false)} className="text-slate-500 hover:text-white">
                            <div className="i-ph:x-bold" />
                        </button>
                    </div>

                    {isLoadingProjects ? (
                        <div className="flex flex-col items-center py-8 gap-3">
                            <div className="i-svg-spinners:90-ring-with-bg text-blue-500 text-2xl animate-spin" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Accessing Brain...</p>
                        </div>
                    ) : recentProjects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {recentProjects.map((project) => (
                                <button
                                    key={project.id}
                                    onClick={() => handleRestore(project)}
                                    className="flex items-center justify-between p-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#444] rounded-lg text-left transition-all group"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white group-hover:text-blue-400">{project.name}</span>
                                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[300px]">{project.description}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] text-slate-600 font-bold uppercase">{new Date(project.created_at).toLocaleDateString()}</span>
                                        <div className="i-ph:arrow-right-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No saved projects found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-6">
                {/* App Name */}
                <div>
                    <label className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wide">
                        App Name
                    </label>
                    <input
                        type="text"
                        value={step1.appName}
                        onChange={(e) => handleChange('appName', e.target.value)}
                        placeholder="e.g., FitTracker"
                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Description - Textarea */}
                <div>
                    <label className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wide">
                        Description
                    </label>
                    <textarea
                        value={step1.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="e.g., Track your fitness journey with personalized workouts and nutrition plans"
                        rows={3}
                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wide">
                        Category
                    </label>
                    <select
                        value={step1.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="" className="bg-[#2a2a2a]">Select a category</option>
                        <option value="Productivity" className="bg-[#2a2a2a]">Productivity</option>
                        <option value="Social Media" className="bg-[#2a2a2a]">Social Media</option>
                        <option value="E-commerce" className="bg-[#2a2a2a]">E-commerce</option>
                        <option value="Education" className="bg-[#2a2a2a]">Education</option>
                        <option value="Health & Fitness" className="bg-[#2a2a2a]">Health & Fitness</option>
                        <option value="Entertainment" className="bg-[#2a2a2a]">Entertainment</option>
                        <option value="Finance" className="bg-[#2a2a2a]">Finance</option>
                        <option value="Travel" className="bg-[#2a2a2a]">Travel</option>
                        <option value="Food & Drink" className="bg-[#2a2a2a]">Food & Drink</option>
                        <option value="Utilities" className="bg-[#2a2a2a]">Utilities</option>
                    </select>
                </div>

                {/* Target Audience */}
                <div>
                    <label className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wide">
                        Target Audience
                    </label>
                    <input
                        type="text"
                        value={step1.targetAudience}
                        onChange={(e) => handleChange('targetAudience', e.target.value)}
                        placeholder="e.g., Fitness enthusiasts aged 18-35"
                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Platform */}
                <div>
                    <label className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wide">
                        Platform
                    </label>
                    <select
                        value={step1.platform}
                        onChange={(e) => handleChange('platform', e.target.value as 'ios' | 'android' | 'both')}
                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="both" className="bg-[#2a2a2a]">iOS & Android</option>
                        <option value="ios" className="bg-[#2a2a2a]">iOS Only</option>
                        <option value="android" className="bg-[#2a2a2a]">Android Only</option>
                    </select>
                </div>

                {/* Primary Goal */}
                <div>
                    <label className="block text-xs font-bold text-slate-200 mb-2 uppercase tracking-wide">
                        Primary Goal
                    </label>
                    <input
                        type="text"
                        value={step1.primaryGoal}
                        onChange={(e) => handleChange('primaryGoal', e.target.value)}
                        placeholder="e.g., Help users achieve their fitness goals"
                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Data Description (Optional) */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide">
                            Key Data & Content
                        </label>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Optional</span>
                    </div>
                    <textarea
                        value={step1.dataDescription || ''}
                        onChange={(e) => handleChange('dataDescription', e.target.value)}
                        placeholder="What are the main things you want to store? (e.g. Users, Workouts, Exercises, Nutrition Logs)"
                        rows={2}
                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-medium"
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5 italic">This helps AI prepare your database structure in later steps.</p>
                </div>
            </div>

            {/* Helper Text */}
            <div className="mt-6 pt-6 border-t border-[#333]">
                <p className="text-xs text-gray-500 italic">
                    AI can help fill this out, or you can type directly
                </p>
            </div>
        </div>
    );
}
