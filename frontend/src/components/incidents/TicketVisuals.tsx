import React from 'react';
import { TicketPriority, TicketStatus } from '../../types/ticket';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const statusConfig: Record<TicketStatus, { bg: string; icon: React.ReactNode }> = {
  IN_PROGRESS: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-100',
    icon: <AlertCircle size={11} className="shrink-0" />,
  },
  RESOLVED: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-100',
    icon: <CheckCircle2 size={11} className="shrink-0" />,
  },
  REJECTED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80 ring-1 ring-rose-100',
    icon: <XCircle size={11} className="shrink-0" />,
  },
};

export const StatusPill: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide shadow-sm ${cfg.bg}`}>
      {cfg.icon}
      {status.replace('_', ' ')}
    </span>
  );
};

const priorityConfig: Record<TicketPriority, { text: string; dot: string }> = {
  LOW: { text: 'text-slate-600', dot: 'bg-slate-400' },
  MEDIUM: { text: 'text-amber-600', dot: 'bg-amber-500' },
  HIGH: { text: 'text-red-600', dot: 'bg-red-500' },
};

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const cfg = priorityConfig[priority];
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  );
};
