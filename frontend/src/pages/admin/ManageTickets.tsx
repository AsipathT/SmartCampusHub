import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listTickets } from '../../api/ticketApi';
import { Ticket } from '../../types/ticket';
import { PriorityBadge, StatusPill } from '../../components/incidents/TicketVisuals';
import { Search } from 'lucide-react';
import { formatDuration, getSlaState, getTicketAgeMs } from '../../utils/ticketUx';

export const ManageTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [assignment, setAssignment] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listTickets()
      .then(setTickets)
      .catch(() => {
        setError('Failed to load tickets.');
        toast.error('Failed to load tickets');
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => [...new Set(tickets.map((t) => t.category))], [tickets]);
  const filtered = useMemo(() => tickets.filter((t) => {
    const q = search.toLowerCase();
    const searchOk = !q || String(t.id).includes(q) || t.description.toLowerCase().includes(q);
    const statusOk = status === 'ALL' || t.status === status;
    const priorityOk = priority === 'ALL' || t.priority === priority;
    const categoryOk = category === 'ALL' || t.category === category;
    const assignmentOk =
      assignment === 'ALL' ||
      (assignment === 'ASSIGNED' ? !!t.assignedStaffId : !t.assignedStaffId);
    return searchOk && statusOk && priorityOk && categoryOk && assignmentOk;
  }), [tickets, search, status, priority, category, assignment]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-sky-50 to-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">Search, filter, assign, and manage incident workflow.</p>
        </div>

        <div className="bg-white border border-indigo-100 rounded-2xl p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-6 gap-3 shadow-sm">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket ID or title"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm"
            />
          </div>
          <Select value={status} setValue={setStatus} options={['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']} />
          <Select value={priority} setValue={setPriority} options={['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']} />
          <Select value={category} setValue={setCategory} options={['ALL', ...categories]} />
          <Select value={assignment} setValue={setAssignment} options={['ALL', 'ASSIGNED', 'UNASSIGNED']} />
        </div>

        <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 border border-slate-200 rounded-xl animate-pulse" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No tickets match your filters.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <Link key={t.id} to={`/app/admin/incidents/${t.id}`} className="block border border-indigo-100 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">TKT-{t.id}</p>
                      <StatusPill status={t.status} />
                    </div>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <p className="text-sm text-slate-800 mt-2 line-clamp-2">{t.description}</p>
                  <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span>{t.category}</span>
                    <span>{t.location}</span>
                    <span>{t.assignedStaffId ? `Assigned #${t.assignedStaffId}` : 'Unassigned'}</span>
                    <span>{new Date(t.createdAt).toLocaleString()}</span>
                    <span className={getSlaState(t) === 'breached' ? 'text-rose-600' : getSlaState(t) === 'warning' ? 'text-amber-600' : 'text-emerald-600'}>
                      Age {formatDuration(getTicketAgeMs(t))}
                    </span>
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

const Select: React.FC<{ value: string; setValue: (v: string) => void; options: string[] }> = ({ value, setValue, options }) => (
  <select value={value} onChange={(e) => setValue(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
    {options.map((o) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
  </select>
);
