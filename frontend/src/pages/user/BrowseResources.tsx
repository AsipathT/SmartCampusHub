import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getResources } from '../../api/resourceApi';
import { Resource } from '../../types/resource';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Package,
  RotateCcw,
  Search,
  Users,
  X,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 9;

const RESOURCE_TYPES = [
  { label: 'All Types', value: 'ALL' },
  { label: 'Classroom', value: 'CLASSROOM' },
  { label: 'Laboratory', value: 'LABORATORY' },
  { label: 'Lecture Hall', value: 'LECTURE_HALL' },
  { label: 'Library', value: 'LIBRARY' },
  { label: 'Sports', value: 'SPORTS' },
  { label: 'Auditorium', value: 'AUDITORIUM' },
  { label: 'Conference Room', value: 'CONFERENCE_ROOM' },
  { label: 'Other', value: 'OTHER' },
];

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Available', value: 'ACTIVE' },
  { label: 'Under Maintenance', value: 'MAINTENANCE' },
];

const SORT_OPTIONS = [
  { label: 'Default (ID)', field: 'id' },
  { label: 'Name A–Z', field: 'name', dir: 'asc' },
  { label: 'Name Z–A', field: 'name', dir: 'desc' },
  { label: 'Capacity ↑', field: 'capacity', dir: 'asc' },
  { label: 'Capacity ↓', field: 'capacity', dir: 'desc' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatType = (t: string) =>
  (t || 'OTHER').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const parseTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

const statusMeta = (status: string) => {
  switch (status) {
    case 'ACTIVE':        return { bg: '#dcfce7', text: '#15803d', dot: '#16a34a', label: 'Available',    icon: '✅' };
    case 'MAINTENANCE':   return { bg: '#fef9c3', text: '#b45309', dot: '#d97706', label: 'Maintenance',  icon: '🔧' };
    case 'OUT_OF_SERVICE':return { bg: '#fee2e2', text: '#b91c1c', dot: '#dc2626', label: 'Unavailable',  icon: '🚫' };
    default:              return { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8', label: status,          icon: '❓' };
  }
};

// ── Smart Status Banner ───────────────────────────────────────────────────────
// Feature 3: Auto-derive availability from availableFrom / availableTo + status
const getSmartAvailability = (resource: Resource): { available: boolean; reason: string } => {
  if (resource.status !== 'ACTIVE') {
    return { available: false, reason: resource.status === 'MAINTENANCE' ? 'Under maintenance' : 'Out of service' };
  }
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  if (resource.availableFrom && resource.availableTo) {
    const from = parseTime(resource.availableFrom);
    const to   = parseTime(resource.availableTo);
    if (nowMins < from) return { available: false, reason: `Opens at ${resource.availableFrom}` };
    if (nowMins > to)   return { available: false, reason: `Closed since ${resource.availableTo}` };
  }
  return { available: true, reason: `Open until ${resource.availableTo ?? '–'}` };
};

// ── Time Slot Calendar ────────────────────────────────────────────────────────
// Feature 2: Availability Calendar View
const AvailabilityCalendar: React.FC<{ resource: Resource }> = ({ resource }) => {
  const from  = resource.availableFrom ? parseTime(resource.availableFrom) : 8 * 60;
  const to    = resource.availableTo   ? parseTime(resource.availableTo)   : 20 * 60;
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const isMaintenance = resource.status !== 'ACTIVE';

  // Build hourly slots
  const startHour = Math.floor(from / 60);
  const endHour   = Math.ceil(to / 60);
  const slots = Array.from({ length: endHour - startHour }, (_, i) => {
    const h = startHour + i;
    const slotStart = h * 60;
    const slotEnd   = (h + 1) * 60;
    const isOpen    = slotStart >= from && slotEnd <= to;
    const isCurrent = nowMins >= slotStart && nowMins < slotEnd;
    const isPast    = slotEnd <= nowMins;
    return { h, isOpen, isCurrent, isPast };
  });

  const bgSlot = (s: typeof slots[0]) => {
    if (isMaintenance) return '#fef9c3';
    if (!s.isOpen)     return '#f1f5f9';
    if (s.isCurrent)   return '#bfdbfe';
    if (s.isPast)      return '#d1fae5';
    return '#e0e7ff';
  };

  const labelSlot = (s: typeof slots[0]) => {
    if (isMaintenance) return 'Maintenance';
    if (!s.isOpen)     return 'Closed';
    if (s.isCurrent)   return 'Now';
    if (s.isPast)      return 'Done';
    return 'Free';
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
        <Clock size={10} /> Today's Availability
      </p>
      <div className="flex gap-0.5 flex-wrap">
        {slots.map((s) => (
          <div
            key={s.h}
            title={`${s.h}:00 – ${s.h + 1}:00 · ${labelSlot(s)}`}
            className="relative group"
            style={{ width: '1.6rem', height: '1.8rem' }}
          >
            <div
              className={`w-full h-full rounded-sm text-[7px] font-bold flex items-center justify-center cursor-default
                ${s.isCurrent ? 'ring-2 ring-blue-400 ring-offset-0' : ''}`}
              style={{ background: bgSlot(s), color: '#475569' }}
            >
              {s.h % 2 === 0 ? `${s.h}` : ''}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex z-30
              bg-slate-800 text-white text-[9px] font-semibold px-2 py-1 rounded-md whitespace-nowrap shadow-lg pointer-events-none">
              {s.h}:00 – {s.h + 1}:00 · {labelSlot(s)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {[
          { color: '#e0e7ff', label: 'Free' },
          { color: '#bfdbfe', label: 'Now' },
          { color: '#d1fae5', label: 'Done' },
          { color: '#fef9c3', label: 'Maintenance' },
          { color: '#f1f5f9', label: 'Closed' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1 text-[9px] text-slate-500">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Resource Card ─────────────────────────────────────────────────────────────
const BrowseCard: React.FC<{ resource: Resource; showCalendar: boolean }> = ({ resource, showCalendar }) => {
  const navigate = useNavigate();
  const status  = statusMeta(resource.status);
  const smart   = getSmartAvailability(resource);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group flex flex-col">
      {/* Thumbnail */}
      <div className="h-36 w-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
        {resource.imageUrl
          ? <img src={resource.imageUrl} alt={resource.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center"><Building2 size={40} className="text-indigo-200" /></div>
        }

        {/* Status badge */}
        <span className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full shadow backdrop-blur-sm"
          style={{ background: status.bg, color: status.text }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: status.dot }} />
          {status.label}
        </span>

        {/* Smart availability chip — Feature 3 */}
        <span className={`absolute bottom-3 left-3 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full
          ${smart.available
            ? 'bg-emerald-500/90 text-white'
            : 'bg-slate-700/80 text-slate-200'}`}>
          <Zap size={8} />
          {smart.reason}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">{formatType(resource.type)}</p>
        <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors flex-1 mb-1">
          {resource.name}
        </h3>

        {resource.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">{resource.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1"><MapPin size={11} />{resource.location || '—'}</span>
          {resource.capacity && (
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
              <Users size={11} />{resource.capacity} seats
            </span>
          )}
        </div>

        {/* Availability hours */}
        {resource.availableFrom && resource.availableTo && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-2">
            <Clock size={10} />
            {resource.availableFrom} – {resource.availableTo}
          </div>
        )}

        {/* Feature 2: Calendar toggle */}
        {showCalendar && <AvailabilityCalendar resource={resource} />}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate(`/app/bookings/add?resourceId=${resource.id}`)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-xs transition-colors shadow-sm
              ${smart.available
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            disabled={!smart.available}
            title={smart.available ? 'Book this resource' : smart.reason}
          >
            <CalendarDays size={13} />
            {smart.available ? 'Book Now' : 'Unavailable'}
          </button>
          <Link to={`/app/facilities/resources/${resource.id}`}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs transition-colors">
            Details <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── Sort Button ───────────────────────────────────────────────────────────────
const SortButton: React.FC<{
  field: string; label: string;
  current: string; dir: string;
  onClick: (f: string, d: string) => void;
}> = ({ field, label, current, dir, onClick }) => {
  const isActive = current === field;
  const toggle = () => onclick !== undefined && onClick(field, isActive && dir === 'asc' ? 'desc' : 'asc');
  const Icon = !isActive ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button onClick={toggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
        ${isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
      <Icon size={12} />{label}
    </button>
  );
};

// ── Main Browse Page ──────────────────────────────────────────────────────────
export const BrowseResources: React.FC = () => {
  const navigate = useNavigate();
  const [resources, setResources]       = useState<Resource[]>([]);
  const [loading, setLoading]           = useState(true);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage]                 = useState(0);

  // Feature 1 — Advanced search state
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy]             = useState('id');
  const [sortDir, setSortDir]           = useState('asc');

  // Feature 2 — Calendar toggle
  const [showCalendar, setShowCalendar] = useState(false);

  // View mode
  const [viewMode, setViewMode]         = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen]   = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(async (
    pg: number, q: string, type: string, st: string, sb: string, sd: string
  ) => {
    setLoading(true);
    try {
      const typeId = undefined; // future: resolve type name → id lookup
      const res = await getResources(pg, PAGE_SIZE, q, typeId, st !== 'ALL' ? st : undefined, sb, sd);
      // Client-side type filter (until backend supports type-name filter)
      let content = res.content || [];
      if (type !== 'ALL') {
        content = content.filter(r => r.type?.toUpperCase() === type.toUpperCase());
      }
      setResources(content);
      setTotalPages(res.totalPages ?? 1);
      setTotalElements(res.totalElements ?? 0);
    } catch {
      toast.error('Failed to load facilities');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search; immediate for other filter changes
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(
      () => fetchPage(page, search, typeFilter, statusFilter, sortBy, sortDir),
      search ? 350 : 0
    );
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [page, search, typeFilter, statusFilter, sortBy, sortDir, fetchPage]);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleType   = (v: string) => { setTypeFilter(v); setPage(0); };
  const handleStatus = (v: string) => { setStatusFilter(v); setPage(0); };
  const handleSort   = (field: string, dir: string) => { setSortBy(field); setSortDir(dir); setPage(0); };
  const clearAll     = () => { setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); setSortBy('id'); setSortDir('asc'); setPage(0); };

  const hasFilters = search || typeFilter !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'id';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ══ HERO HEADER ══════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 220 }}>
        <img src="/sliit_campus.png" alt="SLIIT"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.5)' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.85) 0%,rgba(15,23,42,0.8) 60%,rgba(15,23,42,0.95) 100%)' }} />
        <div className="absolute right-10 top-2 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle,#a78bfa,transparent)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 flex flex-col justify-end h-full">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">
            Facilities & Resources
          </p>
          <h1 className="text-3xl font-black text-white tracking-tight">Browse Campus Facilities</h1>
          <p className="text-indigo-200 mt-1 text-sm">
            {loading ? 'Loading…' : `${totalElements} resources across SLIIT's campus`}
          </p>

          {/* ── Search Bar ── */}
          <div className="mt-5 flex items-center gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
              <input
                id="browse-search"
                type="text"
                placeholder="Search name, location, or description…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40
                  focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur text-sm"
              />
              {search && (
                <button onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-all
                ${filtersOpen ? 'bg-white text-indigo-700 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
              <Filter size={16} />
              Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" />}
            </button>
          </div>
        </div>
      </div>

      {/* ══ FILTER PANEL (Feature 1) ══════════════════════════════════════════ */}
      {filtersOpen && (
        <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto space-y-4">

            {/* Row 1: Type + Status */}
            <div className="flex flex-wrap gap-6 items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Resource Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {RESOURCE_TYPES.map(t => (
                    <button key={t.value} onClick={() => handleType(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${typeFilter === t.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Status</p>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => handleStatus(s.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${statusFilter === s.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Sort */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sort By</p>
              <div className="flex gap-1.5 flex-wrap">
                <SortButton field="id"       label="Default"    current={sortBy} dir={sortDir} onClick={handleSort} />
                <SortButton field="name"     label="Name"       current={sortBy} dir={sortDir} onClick={handleSort} />
                <SortButton field="capacity" label="Capacity"   current={sortBy} dir={sortDir} onClick={handleSort} />
              </div>
            </div>

            {/* Row 3: Feature toggles + Clear */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => setShowCalendar(!showCalendar)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${showCalendar ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                    ${showCalendar ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-indigo-500" />
                  Show Availability Calendar
                </span>
              </label>

              {hasFilters && (
                <button onClick={clearAll}
                  className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">
                  <RotateCcw size={13} /> Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ RESULTS ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-800">{totalElements}</strong> facilities found
              {hasFilters && (
                <button onClick={clearAll} className="ml-2 text-indigo-500 hover:underline text-xs">(clear)</button>
              )}
            </p>
            {hasFilters && (
              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Filtered</span>
            )}
          </div>

          {/* View mode + calendar toggle shortcut */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCalendar(!showCalendar)} title="Toggle availability calendar"
              className={`p-2 rounded-lg border transition-all ${showCalendar ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
              <CalendarDays size={16} />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>
              <Grid3X3 size={16} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Calendar Legend (when active) */}
        {showCalendar && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-wrap gap-4 items-center text-xs text-slate-600">
            <span className="font-bold text-indigo-700 flex items-center gap-1"><CalendarDays size={13} /> Availability Calendar is ON</span>
            <span>Each card shows today's hourly slots. Hover a slot to see details.</span>
          </div>
        )}

        {/* Grid / List */}
        {loading ? (
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col'} gap-5 animate-pulse`}>
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Building2 size={56} className="opacity-20 mb-4" />
            <p className="text-xl font-semibold">No facilities match your filters</p>
            <p className="text-sm mt-1">Try adjusting your search or clearing filters.</p>
            {hasFilters && (
              <button onClick={clearAll}
                className="mt-5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {resources.map((r) => <BrowseCard key={r.id} resource={r} showCalendar={showCalendar} />)}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-3">
            {resources.map((r) => {
              const status = statusMeta(r.status);
              const smart  = getSmartAvailability(r);
              return (
                <div key={r.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4 items-center hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-indigo-50">
                    {r.imageUrl
                      ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 size={24} className="text-indigo-300" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">{formatType(r.type)}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: status.bg, color: status.text }}>{status.label}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors truncate">{r.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1"><MapPin size={10} />{r.location}</span>
                      {r.capacity && <span className="flex items-center gap-1"><Package size={10} />{r.capacity} seats</span>}
                      {r.availableFrom && <span className="flex items-center gap-1"><Clock size={10} />{r.availableFrom}–{r.availableTo}</span>}
                    </div>
                    {showCalendar && <AvailabilityCalendar resource={r} />}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button disabled={!smart.available}
                      onClick={() => navigate(`/app/bookings/add?resourceId=${r.id}`)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                        ${smart.available ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                      Book
                    </button>
                    <Link to={`/app/facilities/resources/${r.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors">
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination (Feature 1) ─────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-all">
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i).map(i => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all
                  ${page === i
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                {i + 1}
              </button>
            ))}

            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        <p className="text-center text-xs text-slate-400 mt-3">
          Page {page + 1} of {totalPages} · {totalElements} total facilities
        </p>
      </div>
    </div>
  );
};
