import { useState } from 'react';
import type { PlanTicket, TicketStatus, TicketPriority } from '~/lib/stores/plan';
import { toast } from 'react-toastify';
import { updateTicket, updateTicketStatus, triggerCodingBot } from '~/lib/stores/plan';
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#080808] rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.4)] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-white/[0.08]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section with Gradient Accent */}
                <div className="relative overflow-hidden pt-10 pb-8 px-10 border-b border-gray-100 dark:border-white/[0.05]">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 dark:bg-purple-500/5 blur-[80px] -mr-32 -mt-32 rounded-full" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={classNames("flex items-center gap-2 px-3 py-1 rounded-full border border-opacity-20 shadow-sm", type.bg, type.color.replace('text-', 'border-'))}>
                                    <div className={classNames(type.icon, type.color, "text-xs")} />
                                    <span className={classNames(type.color, "capitalize text-[10px] font-black tracking-widest uppercase")}>
                                        {ticket.type}
                                    </span>
                                </div>
                                <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10" />
                                <span className="text-xs font-black font-mono text-orange-600/60 dark:text-purple-400/60 tracking-tighter">
                                    {ticket.key}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100/50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
                            >
                                <div className="i-ph:x-bold text-lg" />
                            </button>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1]">
                            {ticket.title}
                        </h2>
                    </div>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-none">
                    {/* Visual Status & Priority Grid */}
                    <div className="grid grid-cols-2 gap-8 sticky top-0 z-20 bg-white/80 dark:bg-[#080808]/80 backdrop-blur-md pb-4 pt-2 -mt-2">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                <div className="i-ph:kanban-duotone text-sm opacity-60" />
                                Current Status
                            </label>
                            <div className="relative group">
                                <select
                                    value={ticket.status}
                                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                                    className="w-full pl-4 pr-10 py-3 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-purple-500/20 outline-none transition-all appearance-none cursor-pointer group-hover:bg-gray-100 dark:group-hover:bg-white/5"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value} className="bg-white dark:bg-[#111]">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <div className="i-ph:caret-down-bold text-xs" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                <div className="i-ph:flag-duotone text-sm opacity-60" />
                                Priority Level
                            </label>
                            <div className="relative group">
                                <select
                                    value={ticket.priority}
                                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                                    className="w-full pl-4 pr-10 py-3 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-purple-500/20 outline-none transition-all appearance-none cursor-pointer group-hover:bg-gray-100 dark:group-hover:bg-white/5"
                                >
                                    {priorityOptions.map((option) => (
                                        <option key={option.value} value={option.value} className="bg-white dark:bg-[#111]">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className={classNames("absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]", priorityOptions.find(p => p.value === ticket.priority)?.color)}>
                                    <div className={priorityOptions.find(p => p.value === ticket.priority)?.icon} />
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <div className="i-ph:caret-down-bold text-xs" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="i-ph:text-align-left-duotone text-orange-500 dark:text-purple-500 text-base" />
                            Description
                        </h3>
                        <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] leading-relaxed">
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap selection:bg-orange-500/20 dark:selection:bg-purple-500/40">
                                {ticket.description}
                            </p>
                        </div>
                    </div>

                    {/* Acceptance Criteria */}
                    {ticket.acceptanceCriteria.length > 0 && (
                        <div className="space-y-5">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="i-ph:list-checks-duotone text-orange-500 dark:text-purple-500 text-base" />
                                Acceptance Criteria
                            </h3>
                            <div className="grid gap-3">
                                {ticket.acceptanceCriteria.map((criteria, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] hover:border-orange-500/20 dark:hover:border-purple-500/20 transition-all group/criteria shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mt-1 group-hover/criteria:bg-emerald-500 group-hover/criteria:text-white transition-all duration-300">
                                            <div className="i-ph:check-bold text-[10px] text-emerald-500 group-hover/criteria:text-white" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex-1 leading-snug">
                                            {criteria}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metadata & Progress Context */}
                    <div className="grid grid-cols-2 gap-8 pt-10 border-t border-gray-100 dark:border-white/[0.05]">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="i-ph:tag-duotone text-orange-500 dark:text-purple-500 text-base" />
                                Classification
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {ticket.labels.length > 0 ? (
                                    ticket.labels.map((label) => (
                                        <span
                                            key={label}
                                            className="text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                                        >
                                            {label}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[10px] italic text-gray-400">No labels assigned</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="i-ph:info-duotone text-orange-500 dark:text-purple-500 text-base" />
                                Timing & Effort
                            </h3>
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05]">
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">Total Allocation</span>
                                    <div className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
                                        <div className="i-ph:timer-duotone text-orange-500 dark:text-purple-500" />
                                        {ticket.estimatedHours || 0}h
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05]">
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">Initiated On</span>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                                        <div className="i-ph:calendar-duotone text-orange-500 dark:text-purple-500 opacity-60" />
                                        {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between p-10 mt-auto border-t border-gray-100 dark:border-white/[0.08] bg-gray-50/30 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        {ticket.status !== 'in-progress' && (
                            <button
                                onClick={() => handleStatusChange('in-progress')}
                                className="px-8 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-sm font-black transition-all flex items-center gap-3 shadow-xl shadow-orange-500/20 dark:shadow-purple-700/30 active:scale-95 group"
                            >
                                <div className="i-ph:rocket-launch-duotone text-base group-hover:rotate-12 transition-transform" />
                                Start Implementation
                            </button>
                        )}
                        {ticket.status === 'in-progress' && (
                            <>
                                <button
                                    onClick={() => {
                                        triggerCodingBot(ticket);
                                        toast.info('Re-running scaffolding for this ticket...');
                                    }}
                                    className="px-5 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white text-sm font-bold transition-all flex items-center gap-2 active:scale-95 group border border-gray-200 dark:border-white/5"
                                    title="Regenerate Code"
                                >
                                    <div className="i-ph:arrows-clockwise-bold text-lg group-hover:rotate-180 transition-transform duration-700" />
                                    <span>Rerun Agent</span>
                                </button>
                                <button
                                    onClick={() => handleStatusChange('testing')}
                                    className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black transition-all flex items-center gap-3 shadow-xl shadow-amber-500/20 active:scale-95 group"
                                >
                                    <div className="i-ph:flask-duotone text-base group-hover:rotate-12 transition-transform" />
                                    Release to Test
                                </button>
                            </>
                        )}
                        {ticket.status === 'testing' && (
                            <button
                                onClick={() => handleStatusChange('done')}
                                className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black transition-all flex items-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 group"
                            >
                                <div className="i-ph:check-circle-duotone text-lg group-hover:scale-110 transition-transform" />
                                Finish Task
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-3.5 rounded-2xl bg-white dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-sm font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                    >
                        Back to Board
                    </button>
                </div>
            </div>
        </div>
    );
}
