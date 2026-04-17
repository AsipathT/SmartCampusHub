import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from 'react-leaflet';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Filter,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  TicketCheck,
  XCircle,
} from 'lucide-react';

import { listTickets } from '../../api/ticketApi';
import { Ticket, TicketPriority, TicketStatus } from '../../types/ticket';

// ── Map constants ────────────────────────────────────────────────────────────
const SLIIT_CAMPUS_CENTER: [number, number] = [6.91485, 79.97228];
const MAP_MIN_ZOOM = 15;
const MAP_DEFAULT_ZOOM = 18;
const MAP_MAX_ZOOM = 22;
const TILE_MAX_NATIVE_ZOOM = 19;

// ── Pin styling ──────────────────────────────────────────────────────────────
const PRIORITY_TONE: Record<TicketPriority, { fill: string; ring: string; label: string }> = {
  HIGH:   { fill: '#ef4444', ring: 'rgba(239,68,68,0.25)',  label: 'High' },
  MEDIUM: { fill: '#f59e0b', ring: 'rgba(245,158,11,0.25)', label: 'Medium' },
  LOW:    { fill: '#64748b', ring: 'rgba(100,116,139,0.25)', label: 'Low' },
};

const STATUS_TONE: Record<TicketStatus, { bg: string; text: string; border: string; dot: string; label: string }> = {
  IN_PROGRESS: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   label: 'In Progress' },
  RESOLVED:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Resolved' },
  REJECTED:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500',    label: 'Rejected' },
};

function buildPinIcon(priority: TicketPriority, status: TicketStatus, selected: boolean) {
  const tone = PRIORITY_TONE[priority];
  const statusDot = status === 'RESOLVED' ? '#10b981' : status === 'REJECTED' ? '#f43f5e' : '#ffffff';
  const size = selected ? 44 : 36;
  const pulse = priority === 'HIGH' && status === 'IN_PROGRESS';

  const html = `
    <div class="sch-pin ${pulse ? 'sch-pin--pulse' : ''}" style="--pin-fill:${tone.fill};--pin-ring:${tone.ring};width:${size}px;height:${size}px">
      <span class="sch-pin__ring"></span>
      <svg viewBox="0 0 32 44" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="g-${priority}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${tone.fill}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${tone.fill}" stop-opacity="0.85"/>
          </linearGradient>
        </defs>
        <path d="M16 0c8.8 0 16 7 16 15.6 0 11-12 24.4-15.2 27.7a1.1 1.1 0 0 1-1.6 0C12 40 0 26.6 0 15.6 0 7 7.2 0 16 0z" fill="url(#g-${priority})"/>
        <circle cx="16" cy="15.5" r="6" fill="white"/>
        <circle cx="16" cy="15.5" r="3.3" fill="${statusDot}"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    className: 'sch-pin-wrapper',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

// ── Map helpers ──────────────────────────────────────────────────────────────
function InvalidateOnChange({ deps }: { deps: any[] }) {
  const map = useMap();
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      map.invalidateSize();
      window.requestAnimationFrame(() => map.invalidateSize());
    });
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

function FitBounds({ tickets, enabled }: { tickets: Ticket[]; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const pts = tickets
      .filter((t) => t.pinLatitude != null && t.pinLongitude != null)
      .map((t) => [t.pinLatitude!, t.pinLongitude!] as [number, number]);
    if (pts.length === 0) {
      map.setView(SLIIT_CAMPUS_CENTER, MAP_DEFAULT_ZOOM);
      return;
    }
    if (pts.length === 1) {
      map.setView(pts[0], Math.max(map.getZoom(), 19));
      return;
    }
    const bounds = L.latLngBounds(pts);
    map.fitBounds(bounds.pad(0.2), { maxZoom: 20 });
  }, [enabled, tickets, map]);
  return null;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export const IncidentMap: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maximized, setMaximized] = useState(false);
  const [tileStyle, setTileStyle] = useState<'streets' | 'satellite'>('streets');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fitRequested, setFitRequested] = useState(true);

  const [locationQuery, setLocationQuery] = useState('');
  const [priority, setPriority] = useState<'ALL' | TicketPriority>('ALL');
  const [category, setCategory] = useState<string>('ALL');

  const markersRef = useRef<Record<number, L.Marker | null>>({});

  const load = () => {
    setLoading(true);
    setError(null);
    listTickets()
      .then((data) => {
        setTickets(data);
        setFitRequested(true);
      })
      .catch(() => {
        setError('Could not load incident tickets.');
        toast.error('Failed to load incidents for the map');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!maximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaximized(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [maximized]);

  const withPin = useMemo(
    () => tickets.filter((t) => t.pinLatitude != null && t.pinLongitude != null),
    [tickets]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => t.category && set.add(t.category.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    return withPin.filter((t) => {
      if (priority !== 'ALL' && t.priority !== priority) return false;
      if (category !== 'ALL' && (t.category || '').trim() !== category) return false;
      if (q && !`${t.location || ''} ${t.description || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [withPin, locationQuery, priority, category]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const inProgress = filtered.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = filtered.filter((t) => t.status === 'RESOLVED').length;
    const rejected = filtered.filter((t) => t.status === 'REJECTED').length;
    const high = filtered.filter((t) => t.priority === 'HIGH').length;
    return { total, inProgress, resolved, rejected, high };
  }, [filtered]);

  const resetFilters = () => {
    setLocationQuery('');
    setPriority('ALL');
    setCategory('ALL');
    setFitRequested(true);
  };

  const focusTicket = (t: Ticket) => {
    setSelectedId(t.id);
    const marker = markersRef.current[t.id];
    if (marker) marker.openPopup();
  };

  const tileConfig = tileStyle === 'satellite'
    ? {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
      }
    : {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
      };

  return (
    <div className={maximized ? 'fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-auto' : 'min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50/40 px-4 sm:px-6 lg:px-8 py-6'}>
      <style>{`
        .sch-pin-wrapper { background: transparent !important; border: 0 !important; }
        .sch-pin { position: relative; display: flex; align-items: flex-end; justify-content: center; filter: drop-shadow(0 4px 6px rgba(15,23,42,0.25)); transition: transform .2s ease; }
        .sch-pin:hover { transform: translateY(-2px) scale(1.05); }
        .sch-pin__ring { position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px; border-radius: 9999px; box-shadow: 0 0 0 6px var(--pin-ring, rgba(0,0,0,0.15)); opacity: 0; transition: opacity .2s ease; }
        .sch-pin:hover .sch-pin__ring { opacity: 1; }
        .sch-pin--pulse::before { content:''; position: absolute; inset: 0; border-radius: 9999px; background: var(--pin-fill, #ef4444); opacity: 0.45; animation: sch-pin-pulse 1.6s ease-out infinite; z-index: -1; }
        @keyframes sch-pin-pulse { 0% { transform: scale(.4); opacity: .55; } 70% { transform: scale(1.4); opacity: 0; } 100% { transform: scale(1.4); opacity: 0; } }
        .sch-popup .leaflet-popup-content-wrapper { border-radius: 16px; padding: 0; overflow: hidden; box-shadow: 0 20px 40px -12px rgba(15,23,42,0.3); border: 1px solid rgba(226,232,240,0.9); }
        .sch-popup .leaflet-popup-content { margin: 0; width: 300px !important; }
        .sch-popup .leaflet-popup-tip { box-shadow: none; }
      `}</style>

      <div className={maximized ? 'mx-auto max-w-[1400px] space-y-4 rounded-3xl bg-white/95 p-4 sm:p-6 shadow-2xl' : 'mx-auto max-w-[1400px] space-y-5'}>
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/50">
              <MapPin size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Incident Map</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Live view of every reported incident pinned on the SLIIT Malabe campus.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 transition-all"
              title="Refresh tickets"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setTileStyle((s) => (s === 'streets' ? 'satellite' : 'streets'))}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              title="Toggle map style"
            >
              <Layers size={14} />
              {tileStyle === 'streets' ? 'Satellite' : 'Streets'}
            </button>
            <button
              onClick={() => setMaximized((m) => !m)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm"
              title={maximized ? 'Exit fullscreen' : 'Maximize map'}
            >
              {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {maximized ? 'Exit' : 'Fullscreen'}
            </button>
          </div>
        </div>

        {/* ── Filters + stats ── */}
        <div className="bg-white/85 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-indigo-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Filters</p>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Reset
            </button>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <StatChip tone="slate"   icon={<TicketCheck size={12} />}    label="Total"       value={stats.total} />
              <StatChip tone="amber"   icon={<AlertTriangle size={12} />}  label="In Progress" value={stats.inProgress} />
              <StatChip tone="emerald" icon={<CheckCircle2 size={12} />}   label="Resolved"    value={stats.resolved} />
              <StatChip tone="rose"    icon={<XCircle size={12} />}        label="Rejected"    value={stats.rejected} />
              <StatChip tone="red"     icon={<AlertTriangle size={12} />}  label="High"        value={stats.high} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Search by location or description"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'ALL' | TicketPriority)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer"
              >
                <option value="ALL">All priorities</option>
                <option value="HIGH">High priority</option>
                <option value="MEDIUM">Medium priority</option>
                <option value="LOW">Low priority</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer"
              >
                <option value="ALL">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Map + list ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div
              className="relative w-full"
              style={{ height: maximized ? 'min(80vh, calc(100dvh - 20rem))' : 'min(78vh, 720px)', minHeight: 460 }}
            >
              <MapContainer
                center={SLIIT_CAMPUS_CENTER}
                zoom={MAP_DEFAULT_ZOOM}
                minZoom={MAP_MIN_ZOOM}
                maxZoom={MAP_MAX_ZOOM}
                scrollWheelZoom
                zoomControl={false}
                className="h-full w-full"
              >
                <ZoomControl position="bottomright" />
                <InvalidateOnChange deps={[maximized, filtered.length, tileStyle]} />
                <FitBounds tickets={filtered} enabled={fitRequested} />
                <TileLayer
                  key={tileStyle}
                  url={tileConfig.url}
                  attribution={tileConfig.attribution}
                  maxZoom={MAP_MAX_ZOOM}
                  maxNativeZoom={TILE_MAX_NATIVE_ZOOM}
                />
                {filtered.map((t) => (
                  <Marker
                    key={t.id}
                    position={[t.pinLatitude!, t.pinLongitude!]}
                    icon={buildPinIcon(t.priority, t.status, selectedId === t.id)}
                    eventHandlers={{
                      click: () => {
                        setSelectedId(t.id);
                        setFitRequested(false);
                      },
                    }}
                    ref={(el: L.Marker | null) => {
                      markersRef.current[t.id] = el;
                    }}
                  >
                    <Popup className="sch-popup" maxWidth={320} minWidth={280} autoPan closeButton>
                      <IncidentPopup ticket={t} onOpen={() => navigate(`/app/admin/incidents/${t.id}`)} />
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Legend */}
              <div className="absolute left-3 bottom-3 z-[500] bg-white/95 backdrop-blur rounded-xl border border-slate-200 shadow-md px-3 py-2 text-[11px]">
                <p className="font-semibold text-slate-700 mb-1 uppercase tracking-widest text-[10px]">Priority</p>
                <div className="flex items-center gap-3">
                  {(['HIGH','MEDIUM','LOW'] as TicketPriority[]).map((p) => (
                    <div key={p} className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_TONE[p].fill }} />
                      <span className="text-slate-600">{PRIORITY_TONE[p].label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Empty / loading overlays */}
              {loading && (
                <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading incidents...
                  </div>
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center z-[500]">
                  <div className="pointer-events-auto bg-white/95 backdrop-blur border border-slate-200 rounded-2xl px-4 py-3 shadow-md text-sm text-slate-600 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500" />
                    No incidents match the current filters.
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/80">
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm font-medium">
                    {error}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side list */}
          <aside className="bg-white/85 backdrop-blur-sm border border-slate-200/70 rounded-2xl p-3 shadow-sm flex flex-col max-h-[720px]">
            <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pinned Incidents</p>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="overflow-y-auto pt-2 space-y-2 pr-1">
              {filtered.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-6">Nothing to show. Try loosening the filters.</div>
              ) : (
                filtered.map((t) => {
                  const st = STATUS_TONE[t.status];
                  const pr = PRIORITY_TONE[t.priority];
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => focusTicket(t)}
                      className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        selectedId === t.id
                          ? 'border-indigo-300 bg-indigo-50/60'
                          : 'border-slate-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-500">#{t.id} · {t.category || 'Incident'}</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">{t.location || 'Unknown location'}</p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white shrink-0"
                          style={{ background: pr.fill }}
                        >
                          {pr.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">{t.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// ── Subcomponents ────────────────────────────────────────────────────────────

const IncidentPopup: React.FC<{ ticket: Ticket; onOpen: () => void }> = ({ ticket, onOpen }) => {
  const st = STATUS_TONE[ticket.status];
  const pr = PRIORITY_TONE[ticket.priority];
  return (
    <div className="bg-white">
      <div
        className="px-4 py-3 text-white"
        style={{ background: `linear-gradient(135deg, ${pr.fill} 0%, ${pr.fill}cc 100%)` }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-90">Incident #{ticket.id}</p>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
            {pr.label} priority
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold leading-snug line-clamp-2">
          {ticket.category || 'Incident'}
        </p>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-700 font-medium">{ticket.location || 'Location unspecified'}</p>
        </div>
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
          {ticket.description || 'No description provided.'}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
          </span>
          {ticket.assignedStaffProfile ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700">
              Assigned · {ticket.assignedStaffProfile.fullName.split(' ')[0]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
              Unassigned
            </span>
          )}
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Reporter</p>
          <p className="text-xs font-medium text-slate-800 mt-0.5">
            {ticket.contactName || `User #${ticket.reporterUserId}`}
          </p>
          {ticket.contactNumber && (
            <p className="text-[11px] text-slate-500">{ticket.contactNumber}</p>
          )}
        </div>
        <button
          onClick={onOpen}
          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors shadow-sm"
        >
          Open full ticket <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

const StatChip: React.FC<{
  tone: 'slate' | 'amber' | 'emerald' | 'rose' | 'red';
  icon: React.ReactNode;
  label: string;
  value: number;
}> = ({ tone, icon, label, value }) => {
  const tones: Record<string, string> = {
    slate:   'bg-slate-50 text-slate-600 border-slate-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose:    'bg-rose-50 text-rose-700 border-rose-200',
    red:     'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${tones[tone]}`}>
      {icon}
      <span className="uppercase tracking-wide">{label}</span>
      <span className="text-[11px] font-bold">{value}</span>
    </span>
  );
};

export default IncidentMap;
