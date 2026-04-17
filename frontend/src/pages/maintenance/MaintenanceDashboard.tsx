import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getResources } from '../../api/resourceApi';
import { Resource } from '../../types/resource';
import { useAuth } from '../../contexts/AuthContext';
import {
  Wrench,
  Building2,
  AlertTriangle,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Search,
  Wifi,
  Zap,
  CheckCircle2,
  ClipboardList,
  HardHat,
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatType = (t: string) =>
  (t || 'OTHER').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':        return { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' };
    case 'MAINTENANCE':
    case 'OUT_OF_SERVICE': return { bg: '#fef9c3', text: '#b45309', dot: '#d97706' };
    default:              return { bg: '#fee2e2', text: '#b91c1c', dot: '#dc2626' };
  }
};

const ANNOUNCEMENTS = [
  {
    id: 'm-1', icon: '🔧', title: 'Scheduled HVAC Inspection',
    body: 'Air conditioning units in Block C require quarterly inspection this Friday.',
    time: '30m ago', category: 'Urgent', color: 'cyan',
  },
  {
    id: 'm-2', icon: '💡', title: 'Lighting Upgrade — Block A',
    body: 'LED replacement work for Block A corridors is scheduled for this weekend.',
    time: '2h ago', category: 'Scheduled', color: 'amber',
  },
  {
    id: 'm-3', icon: '🚿', title: 'Plumbing Check Complete',
    body: 'Routine plumbing inspection for Level 3 washrooms completed successfully.',
    time: '1d ago', category: 'Done', color: 'emerald',
  },
  {
    id: 'm-4', icon: '⚡', title: 'Generator Test Passed',
    body: 'Monthly backup generator test completed. All systems operating normally.',
    time: '2d ago', category: 'Done', color: 'blue',
  },
];

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; to: string; gradient: string }> = ({
  icon, label, to, gradient,
}) => (
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

const ResourceCard: React.FC<{ resource: Resource; index: number }> = ({ resource, index }) => {
  const colors = getStatusColor(resource.status);
  const needsAttention = resource.status === 'MAINTENANCE' || resource.status === 'OUT_OF_SERVICE';
  return (
    <div
      className={`bg-white rounded-3xl border overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group flex flex-col relative animate-fade-in-up cursor-pointer ${needsAttention ? 'border-amber-200' : 'border-slate-100'}`}
      style={{ animationFillMode: 'both', animationDelay: `${index * 120}ms` }}
    >
      <div className="h-24 w-full relative bg-cyan-50 flex items-center justify-center overflow-hidden">
        {resource.imageUrl ? (
          <img src={resource.imageUrl} alt={resource.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-60" />
        <span
          className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md bg-white/95 uppercase tracking-wide"
          style={{ color: colors.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: colors.dot }} />
          {resource.status?.replace(/_/g, ' ')}
        </span>
        {needsAttention && (
          <div className="absolute top-3 left-3 bg-amber-400 text-white rounded-full p-1">
            <AlertTriangle size={12} />
          </div>
        )}
      </div>
      <div className="p-5 pt-7 relative bg-white flex-1 flex flex-col">
        <div className="absolute -top-7 left-5 w-14 h-14 rounded-2xl bg-white shadow-lg border border-slate-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 z-10">
          <Wrench size={24} className="text-cyan-600" />
        </div>
        <p className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider mb-1.5">{formatType(resource.type)}</p>
        <h3 className="font-bold text-slate-800 text-lg leading-snug group-hover:text-cyan-600 transition-colors">{resource.name}</h3>
        <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPin size={14} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="truncate max-w-[120px]">{resource.location || 'Campus'}</span>
          </div>
          {resource.capacity && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg group-hover:bg-cyan-50 group-hover:text-cyan-700 transition-colors">
              <Package size={14} />
              <span>{resource.capacity} cap.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnnouncementCard: React.FC<(typeof ANNOUNCEMENTS)[0] & { index: number }> = ({
  icon, title, body, time, category, color, index,
}) => {
  const colorMap: Record<string, string> = {
    cyan:    'bg-cyan-50 text-cyan-700 border-cyan-100',
    amber:   'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue:    'bg-blue-50 text-blue-700 border-blue-100',
  };
  const iconBgMap: Record<string, string> = {
    cyan:    'bg-cyan-100/50 shadow-cyan-100',
    amber:   'bg-amber-100/50 shadow-amber-100',
    emerald: 'bg-emerald-100/50 shadow-emerald-100',
    blue:    'bg-blue-100/50 shadow-blue-100',
  };
  return (
    <div
      className="group flex items-start gap-4 p-4 border border-transparent hover:border-slate-100 bg-white hover:bg-slate-50/80 hover:shadow-lg hover:-translate-y-1 rounded-2xl transition-all duration-300 cursor-pointer animate-fade-in-up mb-2 last:mb-0"
      style={{ animationFillMode: 'both', animationDelay: `${index * 100 + 400}ms` }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${iconBgMap[color] || iconBgMap.cyan} group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-sm font-extrabold text-slate-800 group-hover:text-cyan-600 transition-colors">{title}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${colorMap[color] || colorMap.cyan}`}>{category}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{body}</p>
      </div>
      <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap flex-shrink-0 mt-1 flex items-center gap-1 group-hover:text-cyan-500 transition-colors">
        <Clock size={11} /> {time}
      </span>
    </div>
  );
};

export const MaintenanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading]         = useState(true);
  const [resources, setResources]     = useState<Resource[]>([]);

  useEffect(() => {
    getResources(0, 100)
      .then((data) => {
        const res: Resource[] = data.content || [];
        setResources(res);
      })
      .catch(() => toast.error('Failed to load campus resources'))
      .finally(() => setLoading(false));
  }, []);

  const activeCount      = resources.filter(r => r.status === 'ACTIVE').length;
  const maintenanceCount = resources.filter(r => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE').length;

  // Prioritise resources needing attention, then show all
  const priorityResources = [
    ...resources.filter(r => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE'),
    ...resources.filter(r => r.status === 'ACTIVE'),
  ].slice(0, 6);

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
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ═══ HERO BANNER ══════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden" style={{ height: '260px' }}>
        <img
          src="/sliit_campus.png"
          alt="SLIIT Campus"
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.55)' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.85) 0%, rgba(15,23,42,0.8) 60%, rgba(15,23,42,0.95) 100%)' }}
        />
        <div className="absolute top-4 right-16 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #67e8f9, transparent)' }} />
        <div className="absolute -bottom-8 left-20 w-40 h-40 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-8 max-w-7xl mx-auto left-0 right-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/30 border border-cyan-400/30 flex items-center justify-center">
              <HardHat size={16} className="text-cyan-300" />
            </div>
            <p className="text-cyan-300 text-xs font-bold uppercase tracking-widest">
              Maintenance Staff Portal · SLIIT Smart Campus
            </p>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {greeting}, <span className="text-cyan-300">{user?.name}</span> 👋
          </h1>
          <p className="text-slate-300 mt-1 text-sm max-w-lg">
            Monitor campus infrastructure and manage maintenance tasks.
            {maintenanceCount > 0
              ? <span className="text-amber-300 font-semibold"> {maintenanceCount} resource{maintenanceCount !== 1 ? 's' : ''} need{maintenanceCount === 1 ? 's' : ''} attention.</span>
              : <span className="text-emerald-300 font-semibold"> All systems operational.</span>
            }
          </p>
          <div className="flex items-center gap-4 mt-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">Systems Live</span>
            </span>
            {maintenanceCount > 0 && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 text-xs font-semibold">{maintenanceCount} Pending</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BODY ═════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* KPI CHIPS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 -mt-2">
          {[
            { label: 'Active Resources',    value: activeCount,              icon: <CheckCircle2 size={20} className="text-white" />,  from: '#059669', to: '#10b981' },
            { label: 'Need Attention',      value: maintenanceCount,         icon: <AlertTriangle size={20} className="text-white" />, from: '#d97706', to: '#f59e0b' },
            { label: 'Total Resources',     value: resources.length,         icon: <Package size={20} className="text-white" />,       from: '#0891b2', to: '#06b6d4' },
            { label: 'Campus Updates',      value: ANNOUNCEMENTS.length,     icon: <Zap size={20} className="text-white" />,           from: '#4f46e5', to: '#7c3aed' },
          ].map(({ label, value, icon, from, to }) => (
            <div
              key={label}
              className="rounded-2xl p-5 shadow-md flex items-center gap-4 text-white relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">{icon}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{label}</p>
                <p className="text-2xl font-black text-white leading-none mt-0.5">{value}</p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-white/10" />
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS + ANNOUNCEMENTS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
              <Zap size={16} className="text-cyan-500" /> Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction icon={<Search size={20} />}        label="View Resources"    to="/app/user/browse"   gradient="linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)" />
              <QuickAction icon={<Wrench size={20} />}        label="Maintenance Log"   to="/app/user/browse"   gradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" />
              <QuickAction icon={<ClipboardList size={20} />} label="All Facilities"    to="/app/user/browse"   gradient="linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)" />
              <QuickAction icon={<AlertTriangle size={20} />} label="Report Issue"      to="/app/user/browse"   gradient="linear-gradient(135deg, #dc2626 0%, #ef4444 100%)" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Wifi size={16} className="text-cyan-500" /> Maintenance Notices
              </h2>
              <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">
                {ANNOUNCEMENTS.length} updates
              </span>
            </div>
            <div>
              {ANNOUNCEMENTS.map((ann, i) => <AnnouncementCard key={ann.id} {...ann} index={i} />)}
            </div>
          </div>
        </div>

        {/* RESOURCES OVERVIEW */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={16} className="text-cyan-500" />
              Campus Resources Overview
              {maintenanceCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle size={11} /> {maintenanceCount} need attention
                </span>
              )}
            </h2>
            <Link to="/app/user/browse" className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-800 transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {priorityResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Package size={36} className="opacity-30 mb-3" />
              <p className="font-medium">No resources found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {priorityResources.map((r, i) => <ResourceCard key={r.id} resource={r} index={i} />)}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-t border-slate-100 pt-4">
          <span className="flex items-center gap-2">
            <HardHat size={13} className="text-cyan-400" />
            <strong className="text-slate-600">SLIIT</strong> · Maintenance Staff Portal
          </span>
          <span className="flex items-center gap-1"><Clock size={11} /> {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
