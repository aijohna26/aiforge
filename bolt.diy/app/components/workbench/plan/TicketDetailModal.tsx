import { useState } from 'react';
import type { PlanTicket, TicketStatus, TicketPriority } from '~/lib/stores/plan';
import { updateTicket, updateTicketStatus } from '~/lib/stores/plan';
import { classNames } from '~/utils/classNames';

interface TicketDetailModalProps {
    ticket: PlanTicket;
    onClose: () => void;
}

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);

    const priorityOptions: { value: TicketPriority; label: string; icon: string; color: string }[] = [
        { value: 'highest', label: 'Highest', icon: 'i-ph:caret-double-up-bold', color: 'text-rose-500' },
        { value: 'high', label: 'High', icon: 'i-ph:caret-up-bold', color: 'text-orange-500' },
        { value: 'medium', label: 'Medium', icon: 'i-ph:minus-bold', color: 'text-amber-500' },
        { value: 'low', label: 'Low', icon: 'i-ph:caret-down-bold', color: 'text-emerald-500' },
        { value: 'lowest', label: 'Lowest', icon: 'i-ph:caret-double-down-bold', color: 'text-slate-500' },
    ];

    const statusOptions: { value: TicketStatus; label: string; icon: string }[] = [
        { value: 'todo', label: 'To Do', icon: 'i-ph:list-bullets-bold' },
        { value: 'in-progress', label: 'In Progress', icon: 'i-ph:rocket-launch-bold' },
        { value: 'testing', label: 'Testing', icon: 'i-ph:flask-bold' },
        { value: 'done', label: 'Done', icon: 'i-ph:check-circle-bold' },
    ];

    const handleStatusChange = (newStatus: TicketStatus) => {
        updateTicketStatus(ticket.id, newStatus);
    };

    const handlePriorityChange = (newPriority: TicketPriority) => {
        updateTicket(ticket.id, { priority: newPriority });
    };

    const typeConfig = {
        epic: { icon: 'i-ph:lightning-bold', color: 'text-orange-500 dark:text-purple-500', bg: 'bg-orange-500/10 dark:bg-purple-500/10' },
        story: { icon: 'i-ph:book-open-bold', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        task: { icon: 'i-ph:circle-fill', color: 'text-slate-400', bg: 'bg-slate-400/10' },
        bug: { icon: 'i-ph:bug-bold', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    };

    const type = typeConfig[ticket.type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-8 border-b border-gray-100 dark:border-white/5">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={classNames("flex items-center gap-1.5 px-2 py-1 rounded-md", type.bg)}>
                                <div className={classNames(type.icon, type.color, "text-xs")} />
                                <span className={classNames(type.color, "capitalize text-[10px] font-bold tracking-widest uppercase")}>
                                    {ticket.type}
                                </span>
                            </div>
                            <span className="text-xs font-bold font-mono text-orange-600 dark:text-purple-400">
                                {ticket.key}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {ticket.title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:rotate-90"
                    >
                        <div className="i-ph:x-bold text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                    {/* Status and Priority Grid */}
                    <div className="grid grid-cols-2 gap-6 p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-500 flex items-center gap-2">
                                <div className="i-ph:kanban-bold" />
                                Status
                            </label>
                            <select
                                value={ticket.status}
                                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-purple-500/50 outline-none transition-all appearance-none cursor-pointer"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="bg-white dark:bg-[#111]">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-500 flex items-center gap-2">
                                <div className="i-ph:flag-bold" />
                                Priority
                            </label>
                            <div className="relative">
                                <select
                                    value={ticket.priority}
                                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-purple-500/50 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {priorityOptions.map((option) => (
                                        <option key={option.value} value={option.value} className="bg-white dark:bg-[#111]">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className={classNames("absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none", priorityOptions.find(p => p.value === ticket.priority)?.color)}>
                                    <div className={priorityOptions.find(p => p.value === ticket.priority)?.icon} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="i-ph:text-align-left-bold text-orange-500 dark:text-purple-500" />
                            Description
                        </h3>
                        <div className="p-5 rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5">
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-medium whitespace-pre-wrap">
                                {ticket.description}
                            </p>
                        </div>
                    </div>

                    {/* Acceptance Criteria */}
                    {ticket.acceptanceCriteria.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="i-ph:list-checks-bold text-orange-500 dark:text-purple-500" />
                                Acceptance Criteria
                            </h3>
                            <div className="space-y-2">
                                {ticket.acceptanceCriteria.map((criteria, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 hover:border-orange-500/20 dark:hover:border-purple-500/20 transition-all group"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <div className="i-ph:check-bold text-[10px] text-emerald-500 group-hover:text-white" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                                            {criteria}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section Grid for Metadata and Labels */}
                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-white/5">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="i-ph:tag-bold text-orange-500 dark:text-purple-500" />
                                Labels
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {ticket.labels.map((label) => (
                                    <span
                                        key={label}
                                        className="text-[10px] font-bold uppercase tracking-tight px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10"
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Allocation</span>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                                    <div className="i-ph:timer-bold text-orange-500 dark:text-purple-500" />
                                    {ticket.estimatedHours}h
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Timeline</span>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                                    <div className="i-ph:calendar-bold text-orange-500 dark:text-purple-500" />
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        {ticket.status !== 'in-progress' && (
                            <button
                                onClick={() => handleStatusChange('in-progress')}
                                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 dark:shadow-purple-500/20 active:scale-[0.98]"
                            >
                                <div className="i-ph:play-bold" />
                                Start Development
                            </button>
                        )}
                        {ticket.status === 'in-progress' && (
                            <button
                                onClick={() => handleStatusChange('testing')}
                                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                            >
                                <div className="i-ph:flask-bold" />
                                Release to Test
                            </button>
                        )}
                        {ticket.status === 'testing' && (
                            <button
                                onClick={() => handleStatusChange('done')}
                                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                            >
                                <div className="i-ph:check-circle-bold" />
                                Complete Task
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                    >
                        Back to Board
                    </button>
                </div>
            </div>
        </div>
    );
}
