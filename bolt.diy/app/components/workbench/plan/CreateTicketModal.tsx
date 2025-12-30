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
      acceptanceCriteria: formData.acceptanceCriteria.filter((c) => c.trim()),
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
        acceptanceCriteria: formData.acceptanceCriteria.filter((c) => c.trim()),
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
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#080808] rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.4)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-10 border-b border-gray-100 dark:border-white/[0.05]">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {isEditing ? 'Modify Ticket' : 'Initialize New Ticket'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">
              Project Context: {projectKey}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100/50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
          >
            <div className="i-ph:x-bold text-xl" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-none">
          {/* Title */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <div className="i-ph:text-t-duotone text-orange-500 dark:text-purple-500 text-sm" />
              Objective Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Implement User Authentication"
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-purple-500/20 outline-none transition-all font-bold text-sm"
              required
            />
          </div>

          {/* Type and Priority Selection Grid */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <div className="i-ph:stack-duotone text-orange-500 dark:text-purple-500 text-sm" />
                Category
              </label>
              <div className="relative group">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TicketType })}
                  className="w-full pl-5 pr-10 py-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-purple-500/20 outline-none transition-all font-bold text-xs appearance-none cursor-pointer group-hover:bg-gray-100 dark:group-hover:bg-white/5"
                >
                  <option value="task">Task</option>
                  <option value="story">Story</option>
                  <option value="epic">Epic</option>
                  <option value="bug">Bug</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <div className="i-ph:caret-down-bold text-xs" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <div className="i-ph:flag-duotone text-orange-500 dark:text-purple-500 text-sm" />
                Urgency
              </label>
              <div className="relative group">
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                  className="w-full pl-5 pr-10 py-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-purple-500/20 outline-none transition-all font-bold text-xs appearance-none cursor-pointer group-hover:bg-gray-100 dark:group-hover:bg-white/5"
                >
                  <option value="highest">Highest</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="lowest">Lowest</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <div className="i-ph:caret-down-bold text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Description Area */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <div className="i-ph:text-align-left-duotone text-orange-500 dark:text-purple-500 text-base" />
              Detailed Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide exhaustive context for the implementation..."
              rows={4}
              className="w-full px-6 py-5 rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-purple-500/20 outline-none transition-all font-medium text-sm resize-none leading-relaxed"
            />
          </div>

          {/* Acceptance Criteria Management */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <div className="i-ph:list-checks-duotone text-orange-500 dark:text-purple-500 text-base" />
                Acceptance Criteria
              </label>
              <button
                type="button"
                onClick={addCriteria}
                className="text-[9px] font-black uppercase tracking-widest text-orange-600 dark:text-purple-400 hover:text-orange-700 dark:hover:text-purple-300 flex items-center gap-2 transition-all hover:scale-105"
              >
                <div className="i-ph:plus-circle-duotone text-lg" />
                Add Requirement
              </button>
            </div>
            <div className="grid gap-4">
              {formData.acceptanceCriteria.map((criteria, index) => (
                <div key={index} className="flex gap-4 group/item animate-in slide-in-from-left-2 duration-300">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={criteria}
                      onChange={(e) => updateCriteria(index, e.target.value)}
                      placeholder={`Specific requirement ${index + 1}`}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-purple-500/20 outline-none transition-all font-bold text-xs"
                    />
                  </div>
                  {formData.acceptanceCriteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriteria(index)}
                      className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-rose-500/5 text-rose-500 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                      title="Remove requirement"
                    >
                      <div className="i-ph:trash-duotone text-lg" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer Actions Panel */}
        <div className="flex items-center justify-end gap-5 p-10 border-t border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3.5 rounded-2xl bg-white dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all font-black"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-10 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-sm font-black transition-all shadow-xl shadow-orange-500/20 dark:shadow-purple-700/30 active:scale-95"
          >
            {isEditing ? 'Sync Changes' : 'Initialize Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
