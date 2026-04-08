import React from 'react';
import { TicketPriority, TicketStatus } from '../../types/ticket';

export const StatusPill: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const map: Record<TicketStatus, string> = {
    OPEN: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200',
    RESOLVED: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-gradient-to-r from-slate-100 to-zinc-100 text-slate-700 border-slate-300',
    REJECTED: 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold shadow-sm ${map[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const map: Record<TicketPriority, string> = {
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[priority]}`}>
      {priority}
    </span>
  );
};
