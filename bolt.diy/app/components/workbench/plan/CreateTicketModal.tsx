import { useState } from 'react';
import type { PlanTicket, TicketPriority, TicketType } from '~/lib/stores/plan';
import { addTicket, updateTicket } from '~/lib/stores/plan';
import { planStore } from '~/lib/stores/plan';

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
            // Generate new ticket
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-bolt-elements-background-depth-2 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-bolt-elements-borderColor">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-bolt-elements-borderColor">
                    <h2 className="text-xl font-bold text-bolt-elements-textPrimary">
                        {isEditing ? 'Edit Ticket' : 'Create New Ticket'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                    >
                        <div className="i-ph:x text-xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter ticket title"
                            className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Type and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                                Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as TicketType })}
                                className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="task">Task</option>
                                <option value="story">Story</option>
                                <option value="epic">Epic</option>
                                <option value="bug">Bug</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                                className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="highest">🔴 Highest</option>
                                <option value="high">🟠 High</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="low">🟢 Low</option>
                                <option value="lowest">⚪ Lowest</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the ticket in detail"
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Estimated Hours */}
                    <div>
                        <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                            Estimated Hours
                        </label>
                        <input
                            type="number"
                            value={formData.estimatedHours || ''}
                            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="e.g., 4"
                            min="0"
                            className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Acceptance Criteria */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-bolt-elements-textPrimary">
                                Acceptance Criteria
                            </label>
                            <button
                                type="button"
                                onClick={addCriteria}
                                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                            >
                                <div className="i-ph:plus-circle" />
                                Add Criteria
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.acceptanceCriteria.map((criteria, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={criteria}
                                        onChange={(e) => updateCriteria(index, e.target.value)}
                                        placeholder={`Criteria ${index + 1}`}
                                        className="flex-1 px-3 py-2 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {formData.acceptanceCriteria.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCriteria(index)}
                                            className="px-3 py-2 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-red-500 hover:border-red-500 transition-colors"
                                        >
                                            <div className="i-ph:trash" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary border border-bolt-elements-borderColor transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                    >
                        {isEditing ? 'Update Ticket' : 'Create Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
}
