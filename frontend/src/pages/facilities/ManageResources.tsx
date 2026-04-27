import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getResources, deleteResource, patchResourceStatus } from '../../api/resourceApi';
import { Resource } from '../../types/resource';
import {
  ArrowDown, ArrowUp, ArrowUpDown,
  ChevronLeft, ChevronRight,
  Edit2, FileSpreadsheet, FileText, Filter, Plus, RotateCcw,
  Search, ShieldAlert, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { exportCSV, exportPDF } from '../../utils/reportExport';

const PAGE_SIZE = 10;

const STATUS_TABS = [
  { label: 'All',              value: 'ALL' },
  { label: '✅ Active',        value: 'ACTIVE' },
  { label: '🔧 Maintenance',   value: 'MAINTENANCE' },
  { label: '🚫 Out of Service',value: 'OUT_OF_SERVICE' },
];

const getStatusStyle = (s: string) => {
  if (s === 'ACTIVE')         return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'MAINTENANCE')    return 'bg-amber-50   text-amber-700   border-amber-200';
  if (s === 'OUT_OF_SERVICE') return 'bg-rose-50    text-rose-700    border-rose-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

const nextStatus = (s: Resource['status']): Resource['status'] => {
  if (s === 'ACTIVE')      return 'MAINTENANCE';
  if (s === 'MAINTENANCE') return 'OUT_OF_SERVICE';
  return 'ACTIVE';
};

const statusLabel = (s: string) => {
  if (s === 'ACTIVE')         return '✅ ACTIVE';
  if (s === 'MAINTENANCE')    return '🔧 MAINTENANCE';
  if (s === 'OUT_OF_SERVICE') return '🚫 OUT_OF_SERVICE';
  return s;
};

// ── Sort Header Cell ──────────────────────────────────────────────────────────
const SortTh: React.FC<{
  label: string; field: string; sortBy: string; sortDir: string;
  onSort: (f: string, d: string) => void;
}> = ({ label, field, sortBy, sortDir, onSort }) => {
  const active = sortBy === field;
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className="py-4 px-6 cursor-pointer select-none group"
      onClick={() => onSort(field, active && sortDir === 'asc' ? 'desc' : 'asc')}>
      <span className="flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
        {label}
        <Icon size={13} className={active ? 'text-indigo-600' : 'text-slate-400'} />
      </span>
    </th>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const ManageResources: React.FC = () => {
  const navigate = useNavigate();
  const [resources, setResources]       = useState<Resource[]>([]);
  const [loading, setLoading]           = useState(true);
  const [exporting, setExporting]       = useState(false);
  const [page, setPage]                 = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [search, setSearch]       = useState('');
  const [statusTab, setStatusTab] = useState('ALL');
  const [sortBy, setSortBy]       = useState('id');
  const [sortDir, setSortDir]     = useState('asc');

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (
    pg: number, q: string, st: string, sb: string, sd: string
  ) => {
    setLoading(true);
    try {
      const res = await getResources(pg, PAGE_SIZE, q, undefined, st !== 'ALL' ? st : undefined, sb, sd);
      setResources(res.content || []);
      setTotalPages(res.totalPages ?? 1);
      setTotalElements(res.totalElements ?? 0);
    } catch {
      toast.error('Failed to load resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(
      () => fetchData(page, search, statusTab, sortBy, sortDir),
      search ? 350 : 0
    );
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [page, search, statusTab, sortBy, sortDir, fetchData]);

  const handleToggleStatus = async (res: Resource) => {
    const newStatus = nextStatus(res.status);
    if (newStatus === 'MAINTENANCE' && !window.confirm(
      `⚠️ Mark "${res.name}" as Maintenance? This will make it unavailable for bookings.`
    )) return;
    try {
      await patchResourceStatus(res.id, newStatus);
      toast.success(`"${res.name}" → ${newStatus}`);
      fetchData(page, search, statusTab, sortBy, sortDir);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (!window.confirm(`Delete "${resource.name}"?`)) return;
    try {
      await deleteResource(resource.id);
      toast.success(`"${resource.name}" deleted`);
      fetchData(page, search, statusTab, sortBy, sortDir);
    } catch {
      toast.error('Failed to delete resource');
    }
  };

  const handleSort = (field: string, dir: string) => { setSortBy(field); setSortDir(dir); setPage(0); };
  const hasFilters = !!(search || statusTab !== 'ALL' || sortBy !== 'id');
  const clearAll   = () => { setSearch(''); setStatusTab('ALL'); setSortBy('id'); setSortDir('asc'); setPage(0); };

  const fetchAllForExport = async (): Promise<Resource[]> => {
    const res = await getResources(0, 9999, search, undefined, statusTab !== 'ALL' ? statusTab : undefined, sortBy, sortDir);
    return res.content || [];
  };

  const exportStats = {
    total:       totalElements,
    active:      resources.filter(r => r.status === 'ACTIVE').length,
    maintenance: resources.filter(r => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE').length,
    inactive:    resources.filter(r => r.status !== 'ACTIVE' && r.status !== 'MAINTENANCE' && r.status !== 'OUT_OF_SERVICE').length,
  };

  const handleExport = async (type: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const all = await fetchAllForExport();
      if (!all.length) { toast.error('No resources to export.'); return; }
      if (type === 'csv') {
        exportCSV(all, 'Resource_Report');
        Swal.fire({
          title: 'Download Successful!',
          text: `CSV Report containing ${all.length} records has been downloaded.`,
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        exportPDF(all, 'Resource_Report', exportStats);
        Swal.fire({
          title: 'Download Successful!',
          text: `PDF Report containing ${all.length} records has been downloaded.`,
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
      }
    } catch (e) {
      toast.error('Export failed — please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ShieldAlert size={28} /></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Management Grid</h2>
            <p className="text-slate-500 mt-0.5 text-sm">
              {totalElements} resources · Elevated access to moderate campus resources
            </p>
          </div>
        </div>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="manage-export-csv"
            disabled={exporting}
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <FileSpreadsheet size={16} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            id="manage-export-pdf"
            disabled={exporting}
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <FileText size={16} />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            onClick={() => navigate('/app/facilities/resources/add')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-sm text-sm"
          >
            <Plus size={18} /> Add Resource
          </button>
        </div>
      </div>

      {/* ── Search + Filter Bar ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-0 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="manage-search"
              type="text"
              placeholder="Search by name, location, or description…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors"
            />
          </div>

          <div className="relative w-full sm:w-52">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={statusTab}
              onChange={(e) => { setStatusTab(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none bg-white text-sm text-slate-700"
            >
              {STATUS_TABS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-red-500 hover:text-red-700 border border-red-200 rounded-xl transition-colors whitespace-nowrap"
            >
              <RotateCcw size={14} /> Clear
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setStatusTab(t.value); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                ${statusTab === t.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
            <tr>
              <SortTh label="ID / Name"  field="id"       sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <SortTh label="Type"       field="location" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <SortTh label="Capacity"   field="capacity" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              <th className="py-4 px-6">Status · Smart Control</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={5} className="h-48 text-center text-slate-500">
                <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                <br />Loading resources…
              </td></tr>
            )}
            {!loading && resources.length === 0 && (
              <tr><td colSpan={5} className="py-16 text-center text-slate-500 font-medium">
                No resources found for the current filters.
              </td></tr>
            )}
            {!loading && resources.map((res) => (
              <tr key={res.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="py-4 px-6">
                  <span className="text-xs text-slate-400 font-mono mr-2">#{res.id}</span>
                  <span className="font-bold text-slate-800">{res.name}</span>
                  {res.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{res.description}</p>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="font-semibold text-slate-700">{res.type}</div>
                  <div className="text-xs text-slate-400">{res.location}</div>
                </td>
                <td className="py-4 px-6">
                  <span className="font-semibold text-slate-700">{res.capacity}</span>
                  <span className="text-xs text-slate-400 ml-1">seats</span>
                </td>
                <td className="py-4 px-6">
                  <button
                    onClick={() => handleToggleStatus(res)}
                    title={`Click to cycle → ${nextStatus(res.status)}`}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all border shadow-sm ${getStatusStyle(res.status)}`}
                  >
                    {statusLabel(res.status)}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Click → {nextStatus(res.status)}
                  </p>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/app/facilities/resources/manage/edit/${res.id}`)}
                      className="p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit Resource"
                    >
                      <Edit2 size={17} />
                    </button>
                    <button
                      onClick={() => handleDelete(res)}
                      className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete Resource"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
            <span className="ml-2 text-slate-400 text-xs">({totalElements} total)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i).map(i => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-bold border transition-all
                  ${page === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
