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
            className={classNames(
                "group relative bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/5",
                "rounded-xl p-4 cursor-pointer transition-all duration-200",
                "hover:border-orange-500/40 dark:hover:border-purple-500/40 hover:shadow-[0_8px_30px_rgba(249,115,22,0.1)] dark:hover:shadow-[0_8px_30px_rgba(168,85,247,0.08)]",
                "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-orange-600 dark:text-purple-400/80 font-mono">
                        {ticket.key}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {ticket.parallel && (
                        <Tooltip content="Can be developed in parallel">
                            <div className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500">
                                <div className="i-ph:intersect-bold text-[10px]" />
                            </div>
                        </Tooltip>
                    )}
                    <Tooltip content={priority.label}>
                        <div className={classNames("flex items-center justify-center w-5 h-5 rounded-md bg-opacity-10", priority.color)}>
                            <div className={classNames(priority.icon, "text-xs")} />
                        </div>
                    </Tooltip>
                </div>
            </div>

            {/* Title */}
            <h4 className="text-[13px] leading-relaxed font-semibold text-gray-800 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-purple-400 transition-colors">
                {ticket.title}
            </h4>

            {/* Labels */}
            {ticket.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {ticket.labels.slice(0, 3).map((label) => (
                        <span
                            key={label}
                            className="text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-transparent dark:border-white/5"
                        >
                            {label}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <Tooltip content={`Type: ${type.label}`}>
                        <div className={classNames("flex items-center gap-1.5 px-2 py-0.5 rounded-md", type.bg)}>
                            <div className={classNames(type.icon, type.color, "text-[10px]")} />
                            <span className={classNames(type.color, "capitalize text-[10px] font-bold tracking-tight")}>
                                {ticket.type}
                            </span>
                        </div>
                    </Tooltip>
                </div>

                {/* Meta details */}
                <div className="flex items-center gap-3">
                    {ticket.acceptanceCriteria.length > 0 && (
                        <Tooltip content={`${ticket.acceptanceCriteria.length} Acceptance Criteria`}>
                            <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                <div className="i-ph:list-checks-bold" />
                                <span>{ticket.acceptanceCriteria.length}</span>
                            </div>
                        </Tooltip>
                    )}
                    {ticket.estimatedHours && (
                        <Tooltip content={`Estimated time: ${ticket.estimatedHours} hours`}>
                            <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                <div className="i-ph:timer-bold" />
                                <span>{ticket.estimatedHours}h</span>
                            </div>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Subtle glow on hover */}
            <div className="absolute inset-0 rounded-xl bg-orange-500/5 dark:bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}
