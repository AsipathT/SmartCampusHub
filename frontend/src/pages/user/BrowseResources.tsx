import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getResources } from '../../api/resourceApi';
import { Resource } from '../../types/resource';
import {
  Building2,
  ChevronRight,
  Filter,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatType = (t: string) =>
  (t || 'OTHER').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return { bg: '#dcfce7', text: '#15803d', dot: '#16a34a', label: 'Available' };
    case 'MAINTENANCE':
    case 'OUT_OF_SERVICE': return { bg: '#fef9c3', text: '#b45309', dot: '#d97706', label: 'Maintenance' };
    default: return { bg: '#fee2e2', text: '#b91c1c', dot: '#dc2626', label: 'Unavailable' };
  }
};

const RESOURCE_TYPES = [
  'ALL',
  'CLASSROOM',
  'LABORATORY',
  'LECTURE_HALL',
  'LIBRARY',
  'SPORTS',
  'AUDITORIUM',
  'CONFERENCE_ROOM',
  'OTHER',
];

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'MAINTENANCE', 'INACTIVE'];

// ── Resource Card ──────────────────────────────────────────────────────────────
const BrowseCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  const colors = getStatusColor(resource.status);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col">
      {/* Thumbnail / placeholder */}
      <div
        className="h-36 w-full bg-slate-100 flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)`,
        }}
      >
        {resource.imageUrl ? (
          <img
            src={resource.imageUrl}
            alt={resource.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Building2 size={36} className="text-indigo-200" />
        )}

        {/* Status badge overlay */}
        <span
          className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm"
          style={{ background: colors.bg, color: colors.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
          {colors.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">
          {formatType(resource.type)}
        </p>
        <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors flex-1">
          {resource.name}
        </h3>

        {resource.description && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin size={11} />
            <span className="truncate max-w-[120px]">{resource.location || 'SLIIT Campus'}</span>
          </div>
          {resource.capacity && (
            <div className="flex items-center gap-1.5">
              <Package size={11} />
              <span>{resource.capacity} seats</span>
            </div>
          )}
        </div>

        <Link
          to={`/app/facilities/resources/${resource.id}`}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs transition-colors"
        >
          View Details <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
};

// ── Main Browse Page ──────────────────────────────────────────────────────────
export const BrowseResources: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    getResources(0, 200)
      .then((data) => setResources(data.content || []))
      .catch(() => toast.error('Failed to load facilities'))
      .finally(() => setLoading(false));
  }, []);

  // Derived filtered list
  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchesSearch =
        !search ||
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.location?.toLowerCase().includes(search.toLowerCase()) ||
        r.type?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'ALL' || r.type === typeFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && r.status === 'ACTIVE') ||
        (statusFilter === 'MAINTENANCE' && (r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE')) ||
        (statusFilter === 'INACTIVE' && r.status !== 'ACTIVE' && r.status !== 'MAINTENANCE' && r.status !== 'OUT_OF_SERVICE');

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, search, typeFilter, statusFilter]);

  const hasActiveFilters = search || typeFilter !== 'ALL' || statusFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div
        className="relative w-full py-10 px-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)' }}
      >
        {/* Blob decoration */}
        <div className="absolute right-10 top-2 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />

        <div className="max-w-7xl mx-auto">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">
            Facilities & Resources
          </p>
          <h1 className="text-3xl font-black text-white tracking-tight">Browse Campus Facilities</h1>
          <p className="text-indigo-200 mt-1 text-sm max-w-lg">
            Discover {resources.length} resources across SLIIT's campus.
          </p>

          {/* Search bar */}
          <div className="mt-5 flex items-center gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
              <input
                type="text"
                placeholder="Search by name, location, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur text-sm"
              />
            </div>
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${
                filtersVisible
                  ? 'bg-white text-indigo-700 border-white'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Panel ──────────────────────────────────────────────────────── */}
      {filtersVisible && (
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center">
            {/* Type filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type:</span>
              <div className="flex flex-wrap gap-1.5">
                {RESOURCE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      typeFilter === t
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {t === 'ALL' ? 'All Types' : formatType(t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
              <div className="flex gap-1.5">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      statusFilter === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 ml-auto"
              >
                <X size={13} /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-600">
            <strong className="text-slate-800">{filtered.length}</strong> facilities found
            {hasActiveFilters && (
              <button onClick={clearFilters} className="ml-2 text-indigo-500 hover:underline text-xs">
                (clear filters)
              </button>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Building2 size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-semibold">No facilities found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((r) => (
              <BrowseCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
