import React, { useEffect, useMemo, useState } from 'react';
import { listTickets } from '../../api/ticketApi';
import { getUnreadCount } from '../../api/notificationApi';
import { Ticket } from '../../types/ticket';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { StatusPill } from '../../components/incidents/TicketVisuals';
import { formatDuration, getSlaState, getTicketAgeMs } from '../../utils/ticketUx';
import { useAuth } from '../../contexts/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-blue-50 to-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 bg-white/85 border border-indigo-100 rounded-2xl p-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Incident Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Operational view of maintenance incidents.</p>
            <p className="text-xs text-blue-600 mt-2 font-medium">Unread notifications: {unread}</p>
          </div>
          <Link to="/app/admin/incidents/manage" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md">
            Manage Tickets
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi label="Open" value={stats.open} />
          <Kpi label="In Progress" value={stats.progress} />
          <Kpi label="Resolved" value={stats.resolved} />
          <Kpi label="Rejected" value={stats.rejected} />
        </div>

        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Tickets</h2>
          {loading ? (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 border border-slate-200 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600 mt-3">{error}</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-slate-500 mt-3">No tickets found.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {tickets.slice(0, 8).map((t) => (
                <Link key={t.id} to={`/app/admin/incidents/${t.id}`} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">TKT-{t.id}</p>
                    <StatusPill status={t.status} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-2 line-clamp-2">{t.description}</p>
                  <p className="text-xs text-slate-500 mt-2">{t.location} · {new Date(t.createdAt).toLocaleString()}</p>
                  <p className={`text-xs mt-1 ${getSlaState(t) === 'breached' ? 'text-rose-600' : getSlaState(t) === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    Age {formatDuration(getTicketAgeMs(t))} · SLA {getSlaState(t) === 'breached' ? 'Breached' : getSlaState(t) === 'warning' ? 'At Risk' : 'On Track'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Kpi: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);
