import React, { useEffect, useMemo, useState } from 'react';
import { listTickets } from '../../api/ticketApi';
import { getUnreadCount } from '../../api/notificationApi';
import { Ticket } from '../../types/ticket';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { StatusPill } from '../../components/incidents/TicketVisuals';
import { formatDuration, getSlaState, getTicketAgeMs } from '../../utils/ticketUx';
import { useAuth } from '../../contexts/AuthContext';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  XOctagon,
} from 'lucide-react';

export const IncidentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

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

  useEffect(() => {
    if (!user?.id) return;
    getUnreadCount(user.id).then(setUnread).catch(() => null);
  }, [user?.id]);

  const stats = useMemo(() => ({
    open: tickets.filter((t) => t.status === 'OPEN').length,
    progress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
    rejected: tickets.filter((t) => t.status === 'REJECTED').length,
  }), [tickets]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-card-enter">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Incident Dashboard</h1>
          <div className="flex items-center gap-3 sm:shrink-0">
            <Link
              to="/app/admin/incidents/notifications"
              className="relative flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Bell size={16} className="text-indigo-500" />
              Notifications
              {unread > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                  {unread}
                </span>
              )}
            </Link>
            <Link
              to="/app/admin/incidents/manage"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200/50 transition-all"
            >
              Manage Tickets
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi
            label="Open"
            value={stats.open}
            icon={<Clock size={22} />}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {tickets.slice(0, 8).map((t, i) => {
                const sla = getSlaState(t);
                const slaLabel = sla === 'breached' ? 'Breached' : sla === 'warning' ? 'At Risk' : 'On Track';
                const slaDot =
                  sla === 'breached' ? 'bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)]' :
                  sla === 'warning' ? 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.25)]' :
                  'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]';
                return (
                  <Link
                    key={t.id}
                    to={`/app/admin/incidents/${t.id}`}
                    className="group relative isolate flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.18)] animate-card-enter"
                    style={{ animationDelay: `${(i + 3) * 60}ms` }}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/[0.07] to-violet-500/[0.04] blur-2xl transition-all duration-500 group-hover:from-indigo-500/15 group-hover:to-violet-500/10" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Reference</p>
                        <p className="mt-0.5 font-mono text-xl font-bold tracking-tight text-slate-950">TKT-{t.id}</p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <StatusPill status={t.status} />
                      </div>
                    </div>

                    <p className="relative mt-4 text-[15px] font-medium leading-relaxed tracking-tight text-slate-700 line-clamp-2 transition-colors duration-200 group-hover:text-slate-900">
                      {t.description}
                    </p>

                    <div className="relative mt-5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/80">
                        <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden />
                        <span className="truncate">{t.location}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/80">
                        <Calendar size={13} className="shrink-0 text-slate-400" aria-hidden />
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <span className={`inline-flex h-2 w-2 shrink-0 rounded-full ${slaDot}`} aria-hidden />
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200/60">
                          <Clock size={12} className="text-slate-500" aria-hidden />
                          {formatDuration(getTicketAgeMs(t))}
                        </span>
                        <span className={`text-xs font-semibold ${
                          sla === 'breached' ? 'text-rose-600' : sla === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          SLA {slaLabel}
                        </span>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition-all duration-300 group-hover:border-indigo-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-500/25">
                        <ArrowRight size={18} strokeWidth={2.25} className="-translate-x-px transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </div>
                  </Link>
                );
              })}
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
