import React, { useEffect, useMemo, useState } from 'react';
import { listTickets } from '../../api/ticketApi';
import { Ticket } from '../../types/ticket';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { PriorityBadge, StatusPill } from '../../components/incidents/TicketVisuals';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Paperclip,
  Plus,
  Ticket as TicketIcon,
  User2,
  XOctagon,
} from 'lucide-react';

export const IncidentDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    listTickets()
      .then(setTickets)
      .catch(() => {
        setError('Unable to load dashboard data.');
        toast.error('Failed to load incident dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    progress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
    rejected: tickets.filter((t) => t.status === 'REJECTED').length,
  }), [tickets]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 animate-card-enter">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Incident Tickets</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage and track maintenance requests</p>
          </div>
          <Link
            to="/app/admin/incidents/manage"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            New Ticket
          </Link>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi
            label="Total Tickets"
            value={tickets.length}
            icon={<TicketIcon size={22} />}
            color="blue"
            delay={0}
          />
          <Kpi
            label="In Progress"
            value={stats.progress}
            icon={<Loader2 size={22} />}
            color="amber"
            delay={1}
          />
          <Kpi
            label="Resolved"
            value={stats.resolved}
            icon={<CheckCircle2 size={22} />}
            color="emerald"
            delay={2}
          />
          <Kpi
            label="Rejected"
            value={stats.rejected}
            icon={<XOctagon size={22} />}
            color="rose"
            delay={3}
          />
        </div>

        {/* ── Recent Tickets ── */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 shadow-sm shadow-slate-200/50 animate-card-enter" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Recent Tickets</h2>
            <Link
              to="/app/admin/incidents/manage"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <AlertTriangle className="text-rose-500 shrink-0" size={20} />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">No tickets found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {tickets.slice(0, 8).map((t, i) => (
                <Link
                  key={t.id}
                  to={`/app/admin/incidents/${t.id}`}
                  className="group flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 animate-card-enter"
                  style={{ animationDelay: `${(i + 3) * 60}ms` }}
                >
                  <div className="flex-1 px-5 pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-bold text-slate-800">TKT-{t.id}</span>
                      <StatusPill status={t.status} />
                      <span className="ml-auto"><PriorityBadge priority={t.priority} /></span>
                    </div>

                    <h3 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-slate-700 transition-colors">
                      {t.description}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" aria-hidden />
                        {t.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" aria-hidden />
                        {new Date(t.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-600">{t.category}</span>
                    </div>
                  </div>

                  <div className="mx-5 border-t border-slate-100" />

                  <div className="px-5 py-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <User2 size={14} className="text-slate-400" aria-hidden />
                      {t.assignedStaffId ? `Staff #${t.assignedStaffId}` : 'Unassigned'}
                    </span>
                    <div className="flex items-center gap-3">
                      {(t.attachmentCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip size={13} className="text-slate-400" aria-hidden />
                          {t.attachmentCount}
                        </span>
                      )}
                      {(t.commentCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare size={13} className="text-slate-400" aria-hidden />
                          {t.commentCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const colorMap = {
  blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',    text: 'text-blue-600',    ring: 'ring-blue-100' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',  text: 'text-amber-600',   ring: 'ring-amber-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  rose:    { bg: 'bg-rose-50',    icon: 'bg-rose-100 text-rose-600',    text: 'text-rose-600',    ring: 'ring-rose-100' },
};

const Kpi: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: keyof typeof colorMap;
  delay: number;
}> = ({ label, value, icon, color, delay }) => {
  const c = colorMap[color];
  return (
    <div
      className={`relative overflow-hidden bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300/70 transition-all duration-200 animate-card-enter`}
      style={{ animationDelay: `${delay * 80}ms` }}
    >
      <div className={`absolute -top-4 -right-4 w-20 h-20 ${c.bg} rounded-full opacity-60 blur-xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-400">{label}</p>
          <p className="text-3xl font-extrabold mt-2 text-black animate-pop-in">{value}</p>
        </div>
        <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
