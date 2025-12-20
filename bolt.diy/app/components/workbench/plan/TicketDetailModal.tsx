import { useState } from 'react';
import type { PlanTicket, TicketStatus, TicketPriority } from '~/lib/stores/plan';
import { updateTicket, updateTicketStatus } from '~/lib/stores/plan';

interface TicketDetailModalProps {
    ticket: PlanTicket;
    onClose: () => void;
}

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);

    const priorityOptions: { value: TicketPriority; label: string; emoji: string }[] = [
        { value: 'highest', label: 'Highest', emoji: '🔴' },
        { value: 'high', label: 'High', emoji: '🟠' },
        { value: 'medium', label: 'Medium', emoji: '🟡' },
        { value: 'low', label: 'Low', emoji: '🟢' },
        { value: 'lowest', label: 'Lowest', emoji: '⚪' },
    ];

    const statusOptions: { value: TicketStatus; label: string }[] = [
        { value: 'todo', label: 'To Do' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'testing', label: 'Testing' },
        { value: 'done', label: 'Done' },
    ];

    const handleStatusChange = (newStatus: TicketStatus) => {
        updateTicketStatus(ticket.id, newStatus);
    };

    const handlePriorityChange = (newPriority: TicketPriority) => {
        updateTicket(ticket.id, { priority: newPriority });
    };

    const typeIcons = {
        epic: 'i-ph:lightning',
        story: 'i-ph:book-open',
        task: 'i-ph:check-square',
        bug: 'i-ph:bug',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-bolt-elements-background-depth-2 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-bolt-elements-borderColor">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-bolt-elements-borderColor">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`${typeIcons[ticket.type]} text-xl ${ticket.type === 'epic' ? 'text-purple-500' :
                                    ticket.type === 'story' ? 'text-green-500' :
                                        ticket.type === 'task' ? 'text-blue-500' :
                                            'text-red-500'
                                }`} />
                            <span className="text-sm font-mono text-blue-500 font-semibold">
                                {ticket.key}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary capitalize">
                                {ticket.type}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-bolt-elements-textPrimary">
                            {ticket.title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                    >
                        <div className="i-ph:x text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
                                Status
                            </label>
                            <select
                                value={ticket.status}
                                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                                className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
                                Priority
                            </label>
                            <select
                                value={ticket.priority}
                                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                                className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {priorityOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.emoji} {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-sm font-semibold text-bolt-elements-textPrimary mb-2">
                            Description
                        </h3>
                        <p className="text-sm text-bolt-elements-textSecondary whitespace-pre-wrap">
                            {ticket.description}
                        </p>
                    </div>

                    {/* Acceptance Criteria */}
                    {ticket.acceptanceCriteria.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-bolt-elements-textPrimary mb-3">
                                Acceptance Criteria
                            </h3>
                            <div className="space-y-2">
                                {ticket.acceptanceCriteria.map((criteria, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor"
                                    >
                                        <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-green-500 flex items-center justify-center mt-0.5">
                                            <div className="i-ph:check text-green-500 text-xs" />
                                        </div>
                                        <p className="text-sm text-bolt-elements-textPrimary flex-1">
                                            {criteria}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Labels */}
                    {ticket.labels.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-bolt-elements-textPrimary mb-2">
                                Labels
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {ticket.labels.map((label) => (
                                    <span
                                        key={label}
                                        className="text-xs px-3 py-1 rounded-full bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary border border-bolt-elements-borderColor"
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-bolt-elements-borderColor">
                        {ticket.estimatedHours && (
                            <div>
                                <span className="text-xs text-bolt-elements-textTertiary">Estimated Hours</span>
                                <p className="text-sm font-medium text-bolt-elements-textPrimary mt-1">
                                    {ticket.estimatedHours}h
                                </p>
                            </div>
                        )}
                        <div>
                            <span className="text-xs text-bolt-elements-textTertiary">Created</span>
                            <p className="text-sm font-medium text-bolt-elements-textPrimary mt-1">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Related Items */}
                    {(ticket.relatedScreens.length > 0 || ticket.relatedDataModels.length > 0) && (
                        <div className="pt-4 border-t border-bolt-elements-borderColor">
                            <h3 className="text-sm font-semibold text-bolt-elements-textPrimary mb-3">
                                Related Items
                            </h3>
                            {ticket.relatedScreens.length > 0 && (
                                <div className="mb-3">
                                    <span className="text-xs text-bolt-elements-textTertiary">Screens:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {ticket.relatedScreens.map((screenId) => (
                                            <span
                                                key={screenId}
                                                className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                            >
                                                {screenId}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {ticket.relatedDataModels.length > 0 && (
                                <div>
                                    <span className="text-xs text-bolt-elements-textTertiary">Data Models:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {ticket.relatedDataModels.map((modelId) => (
                                            <span
                                                key={modelId}
                                                className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                            >
                                                {modelId}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-6 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                    <div className="flex items-center gap-2">
                        {ticket.status !== 'in-progress' && (
                            <button
                                onClick={() => handleStatusChange('in-progress')}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2"
                            >
                                <div className="i-ph:play" />
                                Start Work
                            </button>
                        )}
                        {ticket.status === 'in-progress' && (
                            <button
                                onClick={() => handleStatusChange('testing')}
                                className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition-colors flex items-center gap-2"
                            >
                                <div className="i-ph:flask" />
                                Move to Testing
                            </button>
                        )}
                        {ticket.status === 'testing' && (
                            <button
                                onClick={() => handleStatusChange('done')}
                                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors flex items-center gap-2"
                            >
                                <div className="i-ph:check-circle" />
                                Mark as Done
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary border border-bolt-elements-borderColor transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
