import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Paperclip, Plus, Search } from 'lucide-react';
import { listTickets } from '../../api/ticketApi';
import { useAuth } from '../../contexts/AuthContext';
import { Ticket, TicketPriority, TicketStatus } from '../../types/ticket';
import { PriorityBadge, StatusPill } from '../../components/incidents/TicketVisuals';
import toast from 'react-hot-toast';
import { formatDuration, getSlaState, getTicketAgeMs } from '../../utils/ticketUx';

export const IncidentTickets: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [priority, setPriority] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    listTickets({ reporterUserId: Number(user.id) })
      .then(setTickets)
      .catch(() => {
        setError('Could not load your incident tickets.');
        toast.error('Failed to load incident tickets');
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        String(t.id).includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      const matchesStatus = status === 'ALL' || t.status === status;
      const matchesPriority = priority === 'ALL' || t.priority === priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, status, priority]);

  const summary = useMemo(
    () => ({
      progress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
      rejected: tickets.filter((t) => t.status === 'REJECTED').length,
    }),
    [tickets]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-sky-50 to-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Incident Tickets</h1>
          </div>
          <Link
            to="/app/user/incidents/report"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md"
          >
            <Plus size={16} />
            New Ticket
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="In Progress" value={summary.progress} />
          <StatCard label="Resolved" value={summary.resolved} />
          <StatCard label="Rejected" value={summary.rejected} />
        </div>

        <div className="bg-white border border-indigo-100 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or title..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="ALL">All Statuses</option>
            {['IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="ALL">All Priorities</option>
            {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center">
            <p className="text-rose-600 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm px-3 py-2 rounded-xl bg-blue-600 text-white"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            No tickets found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/app/user/incidents/${ticket.id}`}
                className="bg-white border border-indigo-100 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">TKT-{ticket.id}</p>
                  <StatusPill status={ticket.status as TicketStatus} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                    {ticket.description.slice(0, 55)}
                  </h3>
                  <PriorityBadge priority={ticket.priority as TicketPriority} />
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{ticket.description}</p>
                <p className="mt-2 text-xs text-slate-600">
                  Assigned to:{' '}
                  <span className="font-medium text-slate-800">
                    {ticket.assignedStaffProfile?.fullName ||
                      (ticket.assignedStaffId ? `User #${ticket.assignedStaffId}` : 'Not assigned yet')}
                  </span>
                </p>
                <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                  <span>{ticket.location}</span>
                  <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-xs flex items-center justify-between">
                  <span className="text-slate-500">Age: {formatDuration(getTicketAgeMs(ticket))}</span>
                  <span className={`font-semibold ${getSlaState(ticket) === 'breached' ? 'text-rose-600' : getSlaState(ticket) === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    SLA {getSlaState(ticket) === 'breached' ? 'Breached' : getSlaState(ticket) === 'warning' ? 'At Risk' : 'On Track'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-md">{ticket.category}</span>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="inline-flex items-center gap-1"><Paperclip size={12} />{ticket.attachmentCount}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare size={12} />{ticket.commentCount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);
