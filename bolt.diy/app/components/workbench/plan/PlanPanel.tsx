import { useStore } from '@nanostores/react';
import { useState } from 'react';
import {
  planStore,
  updateTicketStatus,
  setViewMode,
  getTicketsByStatus,
  addTicket,
  type PlanTicket,
  type TicketStatus,
  type TicketPriority,
  type TicketType,
} from '~/lib/stores/plan';
import { TicketCard } from './TicketCard';
import { TicketDetailModal } from './TicketDetailModal';
import { CreateTicketModal } from './CreateTicketModal';
import { classNames } from '~/utils/classNames';

export function PlanPanel() {
  const planState = useStore(planStore);
  const [draggedTicket, setDraggedTicket] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<PlanTicket | null>(null);

  const columns: { status: TicketStatus; title: string; color: string; icon: string }[] = [
    { status: 'todo', title: 'To Do', color: 'text-slate-400', icon: 'i-ph:list-bullets-bold' },
    {
      status: 'in-progress',
      title: 'In Progress',
      color: 'text-orange-500 dark:text-purple-500',
      icon: 'i-ph:rocket-launch-bold',
    },
    { status: 'testing', title: 'Testing', color: 'text-amber-500', icon: 'i-ph:flask-bold' },
    { status: 'done', title: 'Done', color: 'text-emerald-500', icon: 'i-ph:check-circle-bold' },
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

  const totalTickets = planState.tickets.length;
  const completedTickets = planState.tickets.filter((t) => t.status === 'done').length;
  const progress = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB] dark:bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#0A0A0A]">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {planState.projectKey} Board
                </h2>
                <div className="px-2 py-0.5 rounded-md bg-orange-500/10 dark:bg-purple-500/10 border border-orange-500/20 dark:border-purple-500/20 text-[10px] font-bold text-orange-600 dark:text-purple-400 uppercase tracking-widest">
                  Active Sprint
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                {totalTickets} tickets total <span className="mx-1.5 opacity-30">•</span> {completedTickets} completed
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Create Ticket Button */}
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 dark:shadow-purple-500/20 active:scale-[0.98]"
              >
                <div className="i-ph:plus-bold text-lg" />
                Create Ticket
              </button>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/5">
                <button
                  onClick={() => setViewMode('board')}
                  className={classNames(
                    'px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2',
                    planState.viewMode === 'board'
                      ? 'bg-white dark:bg-[#1A1A1A] text-orange-600 dark:text-purple-400 shadow-sm border border-gray-200 dark:border-white/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ring-offset-background',
                  )}
                >
                  <div className="i-ph:kanban-bold" />
                  Board
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={classNames(
                    'px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2',
                    planState.viewMode === 'list'
                      ? 'bg-white dark:bg-[#1A1A1A] text-orange-600 dark:text-purple-400 shadow-sm border border-gray-200 dark:border-white/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
                  )}
                >
                  <div className="i-ph:list-bold" />
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {totalTickets > 0 && (
            <div className="max-w-md">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-500 mb-2">
                <span>Overall Progress</span>
                <span className="text-orange-600 dark:text-purple-400">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 dark:from-purple-600 dark:to-indigo-500 transition-all duration-700 ease-out shadow-orange-500/40 dark:shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Board View */}
      {planState.viewMode === 'board' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#F8F9FA] dark:bg-[#050505]">
          <div className="h-full flex gap-8 p-10 min-w-max">
            {columns.map((column) => {
              const tickets = getTicketsByStatus(column.status);

              return (
                <div
                  key={column.status}
                  className="flex-shrink-0 w-80 flex flex-col group/column"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.status)}
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] shadow-sm">
                    <div
                      className={classNames(
                        'w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm',
                        column.color,
                      )}
                    >
                      <div className={classNames(column.icon, 'text-sm')} />
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-[0.2em]">
                      {column.title}
                    </h3>
                    <div className="ml-auto text-[10px] font-black text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2.5 py-1 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/5">
                      {tickets.length}
                    </div>
                  </div>

                  {/* Column Content */}
                  <div
                    className={classNames(
                      'flex-1 overflow-y-auto space-y-4 min-h-[400px] p-2 rounded-3xl transition-all duration-300',
                      'bg-gray-100/30 dark:bg-white/[0.01] border border-transparent',
                      'group-hover/column:bg-gray-100/50 dark:group-hover/column:bg-white/[0.02] group-hover/column:border-gray-200/50 dark:group-hover/column:border-white/[0.05]',
                    )}
                  >
                    {tickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-300 dark:text-gray-700 select-none">
                        <div className="i-ph:tray-duotone text-5xl mb-4 opacity-10" />
                        <span className="text-[10px] font-black tracking-[0.2em] opacity-30 uppercase italic">
                          Empty Queue
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4 p-2">
                        {tickets.map((ticket) => (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onDragStart={handleDragStart}
                            onClick={() => setSelectedTicket(ticket)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Drop zone placeholder indicator */}
                    <div className="mx-2 h-24 border-2 border-dashed border-gray-200 dark:border-white/[0.05] rounded-3xl opacity-0 group-hover/column:opacity-40 transition-opacity flex items-center justify-center">
                      <div className="i-ph:plus-circle-duotone text-2xl text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}

      {isCreating && <CreateTicketModal onClose={() => setIsCreating(false)} />}
    </div>
  );
}
