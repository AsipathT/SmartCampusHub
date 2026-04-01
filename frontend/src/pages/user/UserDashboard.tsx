import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getResources } from '../../api/resourceApi';
import { Resource } from '../../types/resource';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  GraduationCap,
  MapPin,
  Package,
  Plus,
  Search,
  Wifi,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatType = (t: string) =>
  (t || 'OTHER').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' };
    case 'MAINTENANCE':
    case 'OUT_OF_SERVICE': return { bg: '#fef9c3', text: '#b45309', dot: '#d97706' };
    default: return { bg: '#fee2e2', text: '#b91c1c', dot: '#dc2626' };
  }
};

// ── Campus announcement feed (static mock — wire to API later) ────────────────
const CAMPUS_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    icon: '📚',
    title: 'Library Hours Extended',
    body: 'The main library will be open until 10 PM during exam season.',
    time: '2h ago',
    category: 'Academic',
    color: 'indigo',
  },
  {
    id: 'ann-2',
    icon: '🏟️',
    title: 'Sports Hall Renovation',
    body: 'Basketball court A will be closed for maintenance until April 10.',
    time: '5h ago',
    category: 'Facility',
    color: 'amber',
  },
  {
    id: 'ann-3',
    icon: '💻',
    title: 'New Computer Lab Open',
    body: 'Lab G-204 is now available with 40 high-performance workstations.',
    time: '1d ago',
    category: 'New',
    color: 'emerald',
  },
  {
    id: 'ann-4',
    icon: '📡',
    title: 'Campus Wi-Fi Upgrade',
    body: 'Wi-Fi 6E coverage rolled out across all lecture halls.',
    time: '2d ago',
    category: 'Tech',
    color: 'blue',
  },
];

// ── Quick Action Card ─────────────────────────────────────────────────────────
const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  to: string;
  gradient: string;
}> = ({ icon, label, to, gradient }) => (
  <Link
    to={to}
    className="relative overflow-hidden rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-white font-semibold text-sm shadow-lg hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200 group"
    style={{ background: gradient }}
  >
    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
      {icon}
    </div>
    <span className="text-center leading-tight">{label}</span>
    <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
  </Link>
);

// ── Resource Card ─────────────────────────────────────────────────────────────
const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  const colors = getStatusColor(resource.status);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Building2 size={18} className="text-indigo-500" />
        </div>
        <span
          className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: colors.bg, color: colors.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
          {resource.status?.replace(/_/g, ' ')}
        </span>
      </div>
      <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
        {resource.name}
      </h3>
      <p className="text-xs text-slate-500 mt-1">{formatType(resource.type)}</p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin size={11} />
          <span className="truncate max-w-[100px]">{resource.location || 'Campus'}</span>
        </div>
        {resource.capacity && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Package size={11} />
            <span>{resource.capacity} cap.</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Announcement Card ─────────────────────────────────────────────────────────
const AnnouncementCard: React.FC<(typeof CAMPUS_ANNOUNCEMENTS)[0]> = ({
  icon, title, body, time, category, color,
}) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
  };
  return (
    <div className="flex items-start gap-3 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer">
      <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colorMap[color] || colorMap.indigo}`}>
            {category}
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
      </div>
      <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0 mt-1 flex items-center gap-1">
        <Clock size={9} /> {time}
      </span>
    </div>
  );
};

// ── Main User Dashboard ───────────────────────────────────────────────────────
export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    getResources(0, 100)
      .then((data) => {
        const res: Resource[] = data.content || [];
        setResources(res);
        setActiveCount(res.filter((r) => r.status === 'ACTIVE').length);
      })
      .catch(() => toast.error('Failed to load campus resources'))
      .finally(() => setLoading(false));
  }, []);

  const recentlyAdded = [...resources].slice(0, 6);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 space-y-6 animate-pulse">
        <div className="h-52 rounded-3xl bg-slate-200 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-200" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-slate-200" />)}
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ═══ HERO BANNER ═══════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden" style={{ height: '260px' }}>
        <img
          src="/sliit_campus.png"
          alt="SLIIT Campus"
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.55)' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(79,70,229,0.85) 0%, rgba(15,23,42,0.8) 60%, rgba(15,23,42,0.95) 100%)',
          }}
        />

        {/* Animated blobs */}
        <div className="absolute top-4 right-16 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute -bottom-8 left-20 w-40 h-40 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-8 max-w-7xl mx-auto left-0 right-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center">
              <GraduationCap size={16} className="text-indigo-300" />
            </div>
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">
              Sri Lanka Institute of Information Technology
            </p>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">
            {greeting}, <span className="text-indigo-300">{user?.name}</span> 👋
          </h1>
          <p className="text-slate-300 mt-1 text-sm max-w-lg">
            Discover and explore campus facilities. {activeCount} resources are currently available.
          </p>

          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold">Campus is Live · Operational</span>
          </div>
        </div>
      </div>

      {/* ═══ BODY ══════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── KPI CHIPS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 -mt-2">
          {[
            { label: 'Available Facilities', value: activeCount, icon: <Building2 size={20} className="text-white" />, from: '#4f46e5', to: '#7c3aed' },
            { label: 'Total Resources', value: resources.length, icon: <Package size={20} className="text-white" />, from: '#0891b2', to: '#06b6d4' },
            { label: 'My Bookings', value: 0, icon: <Calendar size={20} className="text-white" />, from: '#059669', to: '#10b981' },
            { label: 'Campus Updates', value: CAMPUS_ANNOUNCEMENTS.length, icon: <Zap size={20} className="text-white" />, from: '#d97706', to: '#f59e0b' },
          ].map(({ label, value, icon, from, to }) => (
            <div
              key={label}
              className="rounded-2xl p-5 shadow-md flex items-center gap-4 text-white relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{label}</p>
                <p className="text-2xl font-black text-white leading-none mt-0.5">{value}</p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-white/10" />
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS + ANNOUNCEMENTS ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Quick Actions 2×2 grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
              <Zap size={16} className="text-indigo-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction
                icon={<Search size={20} />}
                label="Browse Facilities"
                to="/app/user/browse"
                gradient="linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)"
              />
              <QuickAction
                icon={<Calendar size={20} />}
                label="Book a Room"
                to="/app/user/browse"
                gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
              />
              <QuickAction
                icon={<Package size={20} />}
                label="View Resources"
                to="/app/user/browse"
                gradient="linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)"
              />
              <QuickAction
                icon={<Plus size={20} />}
                label="Request Access"
                to="/app/user/browse"
                gradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
              />
            </div>
          </div>

          {/* Campus Announcements Feed */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Wifi size={16} className="text-indigo-500" />
                Campus Announcements
              </h2>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {CAMPUS_ANNOUNCEMENTS.length} updates
              </span>
            </div>
            <div>
              {CAMPUS_ANNOUNCEMENTS.map((ann) => (
                <AnnouncementCard key={ann.id} {...ann} />
              ))}
            </div>
          </div>
        </div>

        {/* ── RECENTLY ADDED FACILITIES ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-500" />
              Recently Added Facilities
            </h2>
            <Link
              to="/app/user/browse"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {recentlyAdded.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Package size={36} className="opacity-30 mb-3" />
              <p className="font-medium">No facilities available yet</p>
              <p className="text-sm mt-1">Check back soon for new campus resources.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {recentlyAdded.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-t border-slate-100 pt-4">
          <span className="flex items-center gap-2">
            <GraduationCap size={13} className="text-indigo-400" />
            <strong className="text-slate-600">SLIIT</strong> · Smart Campus Operations Hub
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};
