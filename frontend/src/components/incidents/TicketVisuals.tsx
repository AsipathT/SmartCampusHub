import React from 'react';
import { TicketPriority, TicketStatus } from '../../types/ticket';
import { AlertCircle, CheckCircle2, Clock, XCircle, Archive } from 'lucide-react';

const statusConfig: Record<TicketStatus, { bg: string; icon: React.ReactNode }> = {
  OPEN: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80 ring-1 ring-blue-100',
    icon: <Clock size={11} className="shrink-0" />,
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-100',
    icon: <AlertCircle size={11} className="shrink-0" />,
  },
  RESOLVED: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-100',
    icon: <CheckCircle2 size={11} className="shrink-0" />,
  },
  CLOSED: {
    bg: 'bg-slate-100 text-slate-600 border-slate-300/80 ring-1 ring-slate-200',
    icon: <Archive size={11} className="shrink-0" />,
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

const priorityConfig: Record<TicketPriority, { bg: string; dot: string }> = {
  LOW: { bg: 'bg-slate-50 text-slate-600 border-slate-200 ring-1 ring-slate-100', dot: 'bg-slate-400' },
  MEDIUM: { bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100', dot: 'bg-amber-500' },
  HIGH: { bg: 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100', dot: 'bg-orange-500' },
  CRITICAL: { bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-100', dot: 'bg-rose-500' },
};

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const cfg = priorityConfig[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border tracking-wide ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
};
