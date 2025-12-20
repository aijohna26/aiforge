import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { planStore, updateTicketStatus, setViewMode, getTicketsByStatus, addTicket, type PlanTicket, type TicketStatus, type TicketPriority, type TicketType } from '~/lib/stores/plan';

export function PlanPanel() {
    const planState = useStore(planStore);
    const [draggedTicket, setDraggedTicket] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<PlanTicket | null>(null);

    const columns: { status: TicketStatus; title: string; color: string; icon: string }[] = [
        { status: 'todo', title: 'To Do', color: 'bg-gray-500', icon: '📋' },
        { status: 'in-progress', title: 'In Progress', color: 'bg-blue-500', icon: '🚀' },
        { status: 'testing', title: 'Testing', color: 'bg-yellow-500', icon: '🧪' },
        { status: 'done', title: 'Done', color: 'bg-green-500', icon: '✅' },
    ];

    const handleDragStart = (ticketId: string) => {
        setDraggedTicket(ticketId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (status: TicketStatus) => {
        if (draggedTicket) {
            updateTicketStatus(draggedTicket, status);
            setDraggedTicket(null);
        }
    };

    const handleCreateTicket = () => {
        const tickets = planState.tickets;
        const ticketNumber = tickets.length + 1;
        const newTicket: PlanTicket = {
            id: `${planState.projectKey}-${ticketNumber}`,
            key: `${planState.projectKey}-${ticketNumber}`,
            title: `Sample Task ${ticketNumber}`,
            description: 'This is a sample ticket. Click to edit details.',
            type: 'task',
            priority: 'medium',
            status: 'todo',
            estimatedHours: 4,
            acceptanceCriteria: ['Implement feature', 'Write tests', 'Update documentation'],
            relatedScreens: [],
            relatedDataModels: [],
            dependencies: [],
            labels: ['sample'],
            orderIndex: tickets.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        addTicket(newTicket);
    };

    const totalTickets = planState.tickets.length;
    const completedTickets = planState.tickets.filter(t => t.status === 'done').length;
    const progress = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

    return (
        <div className="h-full flex flex-col bg-bolt-elements-background-depth-1">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-bolt-elements-textPrimary">
                                {planState.projectKey} Board
                            </h2>
                            <p className="text-sm text-bolt-elements-textSecondary mt-1">
                                {totalTickets} tickets • {completedTickets} completed
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {/* Create Ticket Button */}
                            <button
                                onClick={handleCreateTicket}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <div className="i-ph:plus-circle text-lg" />
                                Create Ticket
                            </button>

                            {/* View Toggle */}
                            <div className="flex items-center gap-1 bg-bolt-elements-background-depth-1 rounded-lg p-1 border border-bolt-elements-borderColor">
                                <button
                                    onClick={() => setViewMode('board')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${planState.viewMode === 'board'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2'
                                        }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className="i-ph:kanban" />
                                        Board
                                    </div>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${planState.viewMode === 'list'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2'
                                        }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className="i-ph:list" />
                                        List
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {totalTickets > 0 && (
                        <div className="w-full">
                            <div className="flex items-center justify-between text-xs text-bolt-elements-textSecondary mb-1.5">
                                <span className="font-medium">Progress</span>
                                <span className="font-semibold">{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-bolt-elements-background-depth-1 rounded-full overflow-hidden border border-bolt-elements-borderColor">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Board View */}
            {planState.viewMode === 'board' && (
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="h-full flex gap-4 p-6 min-w-max">
                        {columns.map((column) => {
                            const tickets = getTicketsByStatus(column.status);

                            return (
                                <div
                                    key={column.status}
                                    className="flex-shrink-0 w-80 flex flex-col"
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(column.status)}
                                >
                                    {/* Column Header */}
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <span className="text-lg">{column.icon}</span>
                                        <h3 className="font-semibold text-bolt-elements-textPrimary uppercase text-xs tracking-wide">
                                            {column.title}
                                        </h3>
                                        <span className="ml-auto text-xs font-semibold text-bolt-elements-textTertiary bg-bolt-elements-background-depth-2 px-2.5 py-1 rounded-full border border-bolt-elements-borderColor">
                                            {tickets.length}
                                        </span>
                                    </div>

                                    {/* Column Content */}
                                    <div className="flex-1 overflow-y-auto space-y-2 min-h-[400px] bg-bolt-elements-background-depth-2/50 rounded-lg p-3 border border-bolt-elements-borderColor">
                                        {tickets.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-32 text-bolt-elements-textTertiary text-sm">
                                                <div className="i-ph:tray text-3xl mb-2 opacity-40" />
                                                <span className="opacity-60">No tickets</span>
                                            </div>
                                        ) : (
                                            tickets.map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(ticket.id)}
                                                    onClick={() => setSelectedTicket(ticket)}
                                                    className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg p-3 cursor-pointer hover:border-blue-500/50 hover:shadow-md transition-all group"
                                                >
                                                    {/* Ticket Header */}
                                                    <div className="flex items-start justify-between mb-2">
                                                        <span className="text-xs font-mono text-blue-500 font-semibold">
                                                            {ticket.key}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {/* Priority */}
                                                            <span className="text-sm" title={`Priority: ${ticket.priority}`}>
                                                                {ticket.priority === 'highest' && '🔴'}
                                                                {ticket.priority === 'high' && '🟠'}
                                                                {ticket.priority === 'medium' && '🟡'}
                                                                {ticket.priority === 'low' && '🟢'}
                                                                {ticket.priority === 'lowest' && '⚪'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Ticket Title */}
                                                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
                                                        {ticket.title}
                                                    </h4>

                                                    {/* Labels */}
                                                    {ticket.labels.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                            {ticket.labels.slice(0, 2).map((label) => (
                                                                <span
                                                                    key={label}
                                                                    className="text-[10px] px-2 py-0.5 rounded-full bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary border border-bolt-elements-borderColor"
                                                                >
                                                                    {label}
                                                                </span>
                                                            ))}
                                                            {ticket.labels.length > 2 && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-bolt-elements-background-depth-1 text-bolt-elements-textTertiary">
                                                                    +{ticket.labels.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Footer */}
                                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-bolt-elements-borderColor">
                                                        {/* Type Badge */}
                                                        <div className="flex items-center gap-1 text-xs text-bolt-elements-textTertiary">
                                                            {ticket.type === 'epic' && <span className="text-purple-500">⚡</span>}
                                                            {ticket.type === 'story' && <span className="text-green-500">📖</span>}
                                                            {ticket.type === 'task' && <span className="text-blue-500">☑️</span>}
                                                            {ticket.type === 'bug' && <span className="text-red-500">🐛</span>}
                                                            <span className="capitalize text-[10px]">{ticket.type}</span>
                                                        </div>

                                                        {/* Estimated Hours */}
                                                        {ticket.estimatedHours && (
                                                            <div className="flex items-center gap-1 text-xs text-bolt-elements-textTertiary">
                                                                <div className="i-ph:clock text-xs" />
                                                                <span className="text-[10px]">{ticket.estimatedHours}h</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedTicket(null)}>
                    <div className="bg-bolt-elements-background-depth-2 rounded-xl shadow-2xl max-w-2xl w-full border border-bolt-elements-borderColor p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-mono text-blue-500 font-semibold">{selectedTicket.key}</span>
                                    <span className="text-xs px-2 py-1 rounded bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary capitalize border border-bolt-elements-borderColor">
                                        {selectedTicket.type}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-bolt-elements-textPrimary">{selectedTicket.title}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                            >
                                <div className="i-ph:x text-xl" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-bolt-elements-textPrimary mb-2">Description</h3>
                                <p className="text-sm text-bolt-elements-textSecondary">{selectedTicket.description}</p>
                            </div>

                            {selectedTicket.acceptanceCriteria.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-bolt-elements-textPrimary mb-2">Acceptance Criteria</h3>
                                    <div className="space-y-2">
                                        {selectedTicket.acceptanceCriteria.map((criteria, index) => (
                                            <div key={index} className="flex items-start gap-2 text-sm text-bolt-elements-textSecondary">
                                                <div className="i-ph:check-circle text-green-500 mt-0.5" />
                                                <span>{criteria}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 pt-4 border-t border-bolt-elements-borderColor">
                                <div>
                                    <span className="text-xs text-bolt-elements-textTertiary">Priority:</span>
                                    <span className="ml-2 text-sm font-medium text-bolt-elements-textPrimary capitalize">{selectedTicket.priority}</span>
                                </div>
                                {selectedTicket.estimatedHours && (
                                    <div>
                                        <span className="text-xs text-bolt-elements-textTertiary">Estimated:</span>
                                        <span className="ml-2 text-sm font-medium text-bolt-elements-textPrimary">{selectedTicket.estimatedHours}h</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
