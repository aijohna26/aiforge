import type { PlanTicket } from '~/lib/stores/plan';

interface TicketCardProps {
    ticket: PlanTicket;
    onDragStart: (ticketId: string) => void;
    onClick: () => void;
}

export function TicketCard({ ticket, onDragStart, onClick }: TicketCardProps) {
    const priorityConfig = {
        highest: { color: 'text-red-500', icon: '🔴', bg: 'bg-red-500/10' },
        high: { color: 'text-orange-500', icon: '🟠', bg: 'bg-orange-500/10' },
        medium: { color: 'text-yellow-500', icon: '🟡', bg: 'bg-yellow-500/10' },
        low: { color: 'text-green-500', icon: '🟢', bg: 'bg-green-500/10' },
        lowest: { color: 'text-gray-500', icon: '⚪', bg: 'bg-gray-500/10' },
    };

    const typeConfig = {
        epic: { icon: 'i-ph:lightning', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        story: { icon: 'i-ph:book-open', color: 'text-green-500', bg: 'bg-green-500/10' },
        task: { icon: 'i-ph:check-square', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        bug: { icon: 'i-ph:bug', color: 'text-red-500', bg: 'bg-red-500/10' },
    };

    const priority = priorityConfig[ticket.priority];
    const type = typeConfig[ticket.type];

    return (
        <div
            draggable
            onDragStart={() => onDragStart(ticket.id)}
            onClick={onClick}
            className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg p-3 cursor-pointer hover:border-blue-500/50 hover:shadow-lg transition-all group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-mono text-blue-500 font-semibold">
                    {ticket.key}
                </span>
                <div className="flex items-center gap-1">
                    <span className={`text-xs ${priority.color}`} title={`Priority: ${ticket.priority}`}>
                        {priority.icon}
                    </span>
                </div>
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
                {ticket.title}
            </h4>

            {/* Labels */}
            {ticket.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {ticket.labels.slice(0, 3).map((label) => (
                        <span
                            key={label}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary border border-bolt-elements-borderColor"
                        >
                            {label}
                        </span>
                    ))}
                    {ticket.labels.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-1 text-bolt-elements-textTertiary">
                            +{ticket.labels.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-bolt-elements-borderColor">
                <div className="flex items-center gap-2">
                    {/* Type Badge */}
                    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${type.bg}`}>
                        <div className={`${type.icon} ${type.color} text-xs`} />
                        <span className={`${type.color} capitalize text-[10px] font-medium`}>
                            {ticket.type}
                        </span>
                    </div>
                </div>

                {/* Estimated Hours */}
                {ticket.estimatedHours && (
                    <div className="flex items-center gap-1 text-xs text-bolt-elements-textTertiary">
                        <div className="i-ph:clock" />
                        <span>{ticket.estimatedHours}h</span>
                    </div>
                )}
            </div>

            {/* Acceptance Criteria Count */}
            {ticket.acceptanceCriteria.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-bolt-elements-textTertiary">
                    <div className="i-ph:check-circle" />
                    <span>{ticket.acceptanceCriteria.length} acceptance criteria</span>
                </div>
            )}
        </div>
    );
}
