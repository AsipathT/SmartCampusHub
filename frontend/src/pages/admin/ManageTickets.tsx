import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listTickets } from '../../api/ticketApi';
import { Ticket } from '../../types/ticket';
import { PriorityBadge, StatusPill } from '../../components/incidents/TicketVisuals';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Clock,
  Filter,
  MapPin,
  Search,
  Settings2,
  TicketCheck,
  User2,
} from 'lucide-react';
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

  const activeFilters = [status, priority, category, assignment].filter((f) => f !== 'ALL').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-card-enter">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-200/50">
              <Settings2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Manage Tickets</h1>
              <p className="text-sm text-slate-500 mt-0.5">Search, filter, assign, and manage incident workflow</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TicketCheck size={16} className="text-indigo-500" />
            <span className="font-semibold text-slate-700">{filtered.length}</span> of {tickets.length} tickets
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 shadow-sm shadow-slate-200/40 animate-card-enter" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Filters</span>
            {activeFilters > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {activeFilters}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket ID or description..."
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
              />
            </div>
            <StyledSelect value={status} setValue={setStatus} options={['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']} />
            <StyledSelect value={priority} setValue={setPriority} options={['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']} />
            <StyledSelect value={category} setValue={setCategory} options={['ALL', ...categories]} />
            <StyledSelect value={assignment} setValue={setAssignment} options={['ALL', 'ASSIGNED', 'UNASSIGNED']} />
          </div>
        </div>

        {/* ── Ticket list ── */}
        <div className="space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl skeleton-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
            ))
          ) : error ? (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5">
              <AlertTriangle className="text-rose-500 shrink-0" size={20} />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Search size={24} />
              </div>
              <p className="text-sm text-slate-500 font-medium">No tickets match your filters.</p>
              <p className="text-xs text-slate-400 mt-1">Try broadening your search criteria</p>
            </div>
          ) : (
            filtered.map((t, i) => (
              <Link
                key={t.id}
                to={`/app/admin/incidents/${t.id}`}
                className="group block bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/30 transition-all duration-200 animate-card-enter"
                style={{ animationDelay: `${Math.min(i, 10) * 50 + 120}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200/60 transition-colors">
                      <TicketCheck size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 tracking-wider">TKT-{t.id}</span>
                        <StatusPill status={t.status} />
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <p className="text-sm font-medium text-slate-800 mt-1.5 line-clamp-2 group-hover:text-indigo-900 transition-colors">
                        {t.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 hidden sm:block" />
                </div>
                <div className="mt-3 pl-[52px] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-300" />
                    {t.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400" />
                    {t.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User2 size={11} className="text-slate-400" />
                    {t.assignedStaffId ? `Staff #${t.assignedStaffId}` : 'Unassigned'}
                  </span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${
                    getSlaState(t) === 'breached' ? 'text-rose-600' : getSlaState(t) === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    <Clock size={11} />
                    {formatDuration(getTicketAgeMs(t))}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const StyledSelect: React.FC<{ value: string; setValue: (v: string) => void; options: string[] }> = ({ value, setValue, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o.replace('_', ' ')}</option>
      ))}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
  </div>
);
