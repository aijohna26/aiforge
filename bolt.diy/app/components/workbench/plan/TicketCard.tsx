import type { PlanTicket } from '~/lib/stores/plan';
import { classNames } from '~/utils/classNames';
import { Tooltip } from '~/components/ui/Tooltip';

interface TicketCardProps {
    ticket: PlanTicket;
    onDragStart: (ticketId: string) => void;
    onClick: () => void;
}

export function TicketCard({ ticket, onDragStart, onClick }: TicketCardProps) {
    const priorityConfig = {
        highest: { color: 'text-rose-500', icon: 'i-ph:caret-double-up-bold', label: 'Highest Priority' },
        high: { color: 'text-orange-500', icon: 'i-ph:caret-up-bold', label: 'High Priority' },
        medium: { color: 'text-amber-500', icon: 'i-ph:minus-bold', label: 'Medium Priority' },
        low: { color: 'text-emerald-500', icon: 'i-ph:caret-down-bold', label: 'Low Priority' },
        lowest: { color: 'text-slate-500', icon: 'i-ph:caret-double-down-bold', label: 'Lowest Priority' },
    };

    const typeConfig = {
        epic: { icon: 'i-ph:lightning-bold', color: 'text-orange-500 dark:text-purple-500', bg: 'bg-orange-500/10 dark:bg-purple-500/10', label: 'Epic' },
        story: { icon: 'i-ph:book-open-bold', color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'User Story' },
        task: { icon: 'i-ph:circle-fill', color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'Task' },
        bug: { icon: 'i-ph:bug-bold', color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Bug' },
    };

    const priority = priorityConfig[ticket.priority];
    const type = typeConfig[ticket.type];

    return (
        <div
            draggable
            onDragStart={() => onDragStart(ticket.id)}
            onClick={onClick}
            className="group relative bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/[0.05] rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:border-orange-500/30 dark:hover:border-purple-500/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] overflow-hidden"
        >
            {/* Type Indicator Bar */}
            <div className={classNames("absolute left-0 top-0 bottom-0 w-1 opacity-60 group-hover:opacity-100 transition-opacity", type.bg.replace('bg-', 'bg-').replace('/10', ''))} />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold tracking-[0.1em] uppercase text-orange-600/60 dark:text-purple-400/50 font-mono">
                        {ticket.key}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 translate-x-1">
                    {ticket.parallel && (
                        <Tooltip content="Parallel Development Ready">
                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                                <div className="i-ph:intersect-duotone text-xs" />
                            </div>
                        </Tooltip>
                    )}
                    <Tooltip content={priority.label}>
                        <div className={classNames("flex items-center justify-center w-6 h-6 rounded-lg bg-opacity-10 border border-current border-opacity-10 transition-colors", priority.color)}>
                            <div className={classNames(priority.icon, "text-xs")} />
                        </div>
                    </Tooltip>
                </div>
            </div>

            {/* Title */}
            <h4 className="text-sm leading-[1.6] font-bold text-gray-800 dark:text-gray-100 mb-4 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-purple-400 transition-colors">
                {ticket.title}
            </h4>

            {/* Labels */}
            {ticket.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {ticket.labels.slice(0, 3).map((label) => (
                        <span
                            key={label}
                            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5"
                        >
                            {label}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-white/[0.03]">
                <div className="flex items-center gap-2">
                    <div className={classNames("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-opacity-10", type.bg, type.color.replace('text-', 'border-'))}>
                        <div className={classNames(type.icon, type.color, "text-xs")} />
                        <span className={classNames(type.color, "capitalize text-[10px] font-bold tracking-tight")}>
                            {ticket.type}
                        </span>
                    </div>
                </div>

                {/* Meta details */}
                <div className="flex items-center gap-3">
                    {ticket.acceptanceCriteria.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                            <div className="i-ph:list-checks-duotone text-sm opacity-60" />
                            <span>{ticket.acceptanceCriteria.length}</span>
                        </div>
                    )}
                    {ticket.estimatedHours && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                            <div className="i-ph:timer-duotone text-sm opacity-60" />
                            <span>{ticket.estimatedHours}h</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Subtle glass overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/[0.02] dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}
