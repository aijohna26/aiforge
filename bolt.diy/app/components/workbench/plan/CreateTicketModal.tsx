import { useState } from 'react';
import type { PlanTicket, TicketPriority, TicketType } from '~/lib/stores/plan';
import { addTicket, updateTicket } from '~/lib/stores/plan';
import { planStore } from '~/lib/stores/plan';
import { classNames } from '~/utils/classNames';

interface CreateTicketModalProps {
    ticket?: PlanTicket;
    onClose: () => void;
}

export function CreateTicketModal({ ticket, onClose }: CreateTicketModalProps) {
    const isEditing = ticket && ticket.id;
    const projectKey = planStore.get().projectKey;

    const [formData, setFormData] = useState({
        title: ticket?.title || '',
        description: ticket?.description || '',
        type: (ticket?.type || 'task') as TicketType,
        priority: (ticket?.priority || 'medium') as TicketPriority,
        estimatedHours: ticket?.estimatedHours || undefined,
        acceptanceCriteria: ticket?.acceptanceCriteria || [''],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            return;
        }

        const ticketData: Partial<PlanTicket> = {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            priority: formData.priority,
            estimatedHours: formData.estimatedHours,
            acceptanceCriteria: formData.acceptanceCriteria.filter(c => c.trim()),
        };

        if (isEditing) {
            updateTicket(ticket.id, ticketData);
        } else {
            const tickets = planStore.get().tickets;
            const ticketNumber = tickets.length + 1;
            const newTicket: PlanTicket = {
                id: `${projectKey}-${ticketNumber}`,
                key: `${projectKey}-${ticketNumber}`,
                title: formData.title,
                description: formData.description,
                type: formData.type,
                priority: formData.priority,
                status: 'todo',
                estimatedHours: formData.estimatedHours,
                acceptanceCriteria: formData.acceptanceCriteria.filter(c => c.trim()),
                relatedScreens: [],
                relatedDataModels: [],
                dependencies: [],
                labels: [],
                orderIndex: tickets.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            addTicket(newTicket);
        }

        onClose();
    };

    const addCriteria = () => {
        setFormData({
            ...formData,
            acceptanceCriteria: [...formData.acceptanceCriteria, ''],
        });
    };

    const updateCriteria = (index: number, value: string) => {
        const newCriteria = [...formData.acceptanceCriteria];
        newCriteria[index] = value;
        setFormData({ ...formData, acceptanceCriteria: newCriteria });
    };

    const removeCriteria = (index: number) => {
        setFormData({
            ...formData,
            acceptanceCriteria: formData.acceptanceCriteria.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {isEditing ? 'Edit Ticket' : 'Create New Ticket'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:rotate-90"
                    >
                        <div className="i-ph:x-bold text-xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                    {/* Title */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-500 flex items-center gap-2">
                            <div className="i-ph:text-t-bold text-orange-500 dark:text-purple-500" />
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Implement User Authentication"
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-purple-500/50 outline-none transition-all font-medium"
                            required
                        />
                    </div>

                    {/* Type and Priority */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-500 flex items-center gap-2">
                                <div className="i-ph:stack-bold text-orange-500 dark:text-purple-500" />
                                Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as TicketType })}
                                className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-purple-500/50 outline-none transition-all font-semibold appearance-none cursor-pointer"
                            >
                                <option value="task">Task</option>
                                <option value="story">Story</option>
                                <option value="epic">Epic</option>
                                <option value="bug">Bug</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-500 flex items-center gap-2">
                                <div className="i-ph:flag-bold text-orange-500 dark:text-purple-500" />
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                                className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-purple-500/50 outline-none transition-all font-semibold appearance-none cursor-pointer"
                            >
                                <option value="highest">Highest</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                                <option value="lowest">Lowest</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-500 flex items-center gap-2">
                            <div className="i-ph:text-align-left-bold text-orange-500 dark:text-purple-500" />
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the objective and requirements..."
                            rows={4}
                            className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-purple-500/50 outline-none transition-all font-medium resize-none leading-relaxed"
                        />
                    </div>

                    {/* Estimated Hours */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-500 flex items-center gap-2">
                            <div className="i-ph:timer-bold text-orange-500 dark:text-purple-500" />
                            Allocation (Hours)
                        </label>
                        <input
                            type="number"
                            value={formData.estimatedHours || ''}
                            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="e.g. 8"
                            min="0"
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-purple-500/50 outline-none transition-all font-semibold"
                        />
                    </div>

                    {/* Acceptance Criteria */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-500 flex items-center gap-2">
                                <div className="i-ph:list-checks-bold text-orange-500 dark:text-purple-500" />
                                Acceptance Criteria
                            </label>
                            <button
                                type="button"
                                onClick={addCriteria}
                                className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-purple-400 hover:text-orange-700 dark:hover:text-purple-700 flex items-center gap-1.5 transition-colors bg-transparent border-none appearance-none"
                            >
                                <div className="i-ph:plus-circle-bold text-sm" />
                                New Criteria
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.acceptanceCriteria.map((criteria, index) => (
                                <div key={index} className="flex gap-3 animate-in fade-in duration-300">
                                    <div className="flex-1 relative group">
                                        <input
                                            type="text"
                                            value={criteria}
                                            onChange={(e) => updateCriteria(index, e.target.value)}
                                            placeholder={`Requirement ${index + 1}`}
                                            className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-purple-500/50 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    {formData.acceptanceCriteria.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCriteria(index)}
                                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-rose-500/5 text-rose-500 border border-transparent hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <div className="i-ph:trash-bold" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-4 p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all font-bold"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-8 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-sm font-extrabold transition-all shadow-lg shadow-orange-500/20 dark:shadow-purple-500/20 active:scale-[0.98]"
                    >
                        {isEditing ? 'Save Changes' : 'Initialize Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
}
