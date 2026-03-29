import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { getResources } from '../../api/resourceApi';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Package,
  TrendingUp,
  Activity,
  Layers,
  RefreshCw,
  MapPin,
  ArrowUpRight,
  Clock,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Resource } from '../../types/resource';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const PIE_COLOURS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6'];
const ACTIVE_COLOUR   = '#10b981';
const MAINT_COLOUR    = '#f59e0b';
const INACTIVE_COLOUR = '#f43f5e';

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

const formatType = (t: string) =>
  t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  subtitle?: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient, iconBg, subtitle, trend }) => (
  <div
    className="relative overflow-hidden rounded-2xl p-6 shadow-lg border border-white/10 flex flex-col gap-4"
    style={{ background: gradient }}
  >
    {/* top row */}
    <div className="flex items-start justify-between">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      {trend !== undefined && (
        <span
          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
            trend >= 0
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/20 text-rose-300'
          }`}
        >
          <ArrowUpRight size={12} className={trend < 0 ? 'rotate-180' : ''} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    {/* value */}
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">{label}</p>
      <h3 className="text-4xl font-black text-white leading-none">{value}</h3>
      {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
    </div>
    {/* decorative blob */}
    <div
      className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-20"
      style={{ background: iconBg }}
    />
  </div>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>
    {children}
  </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-xl shadow-xl px-4 py-3 border border-white/10">
      <p className="font-bold mb-2 text-slate-300">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, maintenance: 0, inactive: 0 });
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    getResources(0, 500)
      .then((data) => {
        const res = data.content || [];
        setResources(res);

        const active      = res.filter((r) => r.status === 'ACTIVE').length;
        const maintenance = res.filter((r) => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE').length;
        const inactive    = res.length - active - maintenance;

        setStats({ total: res.length, active, maintenance, inactive });

        // Distribution: stacked bar by type
        const dist: Record<string, { active: number; maintenance: number; inactive: number }> = {};
        res.forEach((r) => {
          const t = r.type || 'OTHER';
          if (!dist[t]) dist[t] = { active: 0, maintenance: 0, inactive: 0 };
          if (r.status === 'ACTIVE') dist[t].active += 1;
          else if (r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE') dist[t].maintenance += 1;
          else dist[t].inactive += 1;
        });

        const processed = Object.entries(dist).map(([k, v]) => ({
          name: formatType(k),
          Active: v.active,
          Maintenance: v.maintenance,
          Inactive: v.inactive,
        }));

        setDistributionData(
          processed.length > 0
            ? processed
            : [
                { name: 'Lecture Halls', Active: 0, Maintenance: 0, Inactive: 0 },
                { name: 'Labs', Active: 0, Maintenance: 0, Inactive: 0 },
                { name: 'Library', Active: 0, Maintenance: 0, Inactive: 0 },
                { name: 'Sports', Active: 0, Maintenance: 0, Inactive: 0 },
              ]
        );

        // Pie data – count per type
        const typeCount: Record<string, number> = {};
        res.forEach((r) => {
          const t = formatType(r.type || 'OTHER');
          typeCount[t] = (typeCount[t] || 0) + 1;
        });
        setTypeData(Object.entries(typeCount).map(([name, value]) => ({ name, value })));

        setLastUpdated(new Date());
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load dashboard metrics');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-200 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-slate-200" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-200" />)}
        </div>
      </div>
    );

  const utilizationPct = pct(stats.active, stats.total);

  // Recent 5 resources
  const recentResources = [...resources]
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HERO HEADER ───────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-8 pt-8 pb-10"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #312e81 100%)',
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 -translate-y-1/3 translate-x-1/3"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 translate-y-1/3 -translate-x-1/3"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                <Zap size={20} className="text-white" />
              </div>
              <span className="text-indigo-300 text-sm font-semibold uppercase tracking-widest">Smart Campus Hub</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Facilities Overview</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Real-time metrics and health of your campus infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-slate-400 text-xs">Last updated</p>
              <p className="text-slate-200 text-sm font-semibold flex items-center gap-1 justify-end">
                <Clock size={13} />
                {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/10 backdrop-blur"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Utilization bar */}
        <div className="relative max-w-7xl mx-auto mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 text-xs font-semibold flex items-center gap-1">
              <Activity size={12} /> Campus Utilization Rate
            </span>
            <span className="text-white text-sm font-black">{utilizationPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${utilizationPct}%`,
                background: 'linear-gradient(90deg, #6366f1, #10b981)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── KPI CARDS ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            label="Total Assets"
            value={stats.total}
            icon={<Package size={22} className="text-white" />}
            gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
            iconBg="rgba(255,255,255,0.2)"
            subtitle="All campus resources"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<CheckCircle2 size={22} className="text-white" />}
            gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
            iconBg="rgba(255,255,255,0.2)"
            subtitle={`${pct(stats.active, stats.total)}% of total`}
            trend={utilizationPct}
          />
          <StatCard
            label="In Maintenance"
            value={stats.maintenance}
            icon={<AlertTriangle size={22} className="text-white" />}
            gradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
            iconBg="rgba(255,255,255,0.2)"
            subtitle={`${pct(stats.maintenance, stats.total)}% of total`}
          />
          <StatCard
            label="Inactive"
            value={stats.inactive}
            icon={<Layers size={22} className="text-white" />}
            gradient="linear-gradient(135deg, #be123c 0%, #f43f5e 100%)"
            iconBg="rgba(255,255,255,0.2)"
            subtitle={`${pct(stats.inactive, stats.total)}% of total`}
          />
        </div>

        {/* ── CHARTS ROW ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Stacked Bar – 2/3 width */}
          <Card className="xl:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-500" />
                  Resource Distribution by Type
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Status breakdown per facility category</p>
              </div>
              <div className="flex gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: ACTIVE_COLOUR }} />Active</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: MAINT_COLOUR }} />Maintenance</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: INACTIVE_COLOUR }} />Inactive</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={distributionData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar name="Active"      dataKey="Active"      stackId="a" fill={ACTIVE_COLOUR}   radius={[0, 0, 4, 4]} />
                <Bar name="Maintenance" dataKey="Maintenance" stackId="a" fill={MAINT_COLOUR}    radius={[0, 0, 0, 0]} />
                <Bar name="Inactive"    dataKey="Inactive"    stackId="a" fill={INACTIVE_COLOUR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Donut – 1/3 width */}
          <Card>
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-indigo-500" />
              Type Breakdown
            </h4>
            <p className="text-xs text-slate-400 mb-4">Share of each resource category</p>
            {typeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
                            <span className="font-bold">{payload[0].name}</span>: {payload[0].value}
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {typeData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLOURS[i % PIE_COLOURS.length] }} />
                        {d.name}
                      </span>
                      <span className="font-bold text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Layers size={32} className="opacity-30 mb-2" />
                <p className="text-sm">No data available</p>
              </div>
            )}
          </Card>
        </div>

        {/* ── UTILIZATION + RECENT ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Per-type utilization bars */}
          <Card>
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Activity size={16} className="text-indigo-500" />
              Utilization by Type
            </h4>
            {distributionData.length === 0 ? (
              <p className="text-sm text-slate-400">No data.</p>
            ) : (
              <div className="space-y-4">
                {distributionData.map((d, i) => {
                  const total = d.Active + d.Maintenance + d.Inactive;
                  const activePct = pct(d.Active, total);
                  return (
                    <div key={d.name}>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>{d.name}</span>
                        <span>{activePct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${activePct}%`,
                            background: `linear-gradient(90deg, ${PIE_COLOURS[i % PIE_COLOURS.length]}, ${PIE_COLOURS[(i + 1) % PIE_COLOURS.length]})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent resources table */}
          <Card className="xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" />
                Recent Resources
              </h4>
              <span className="text-xs text-slate-400">{resources.length} total</span>
            </div>
            {recentResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Package size={32} className="opacity-30 mb-2" />
                <p className="text-sm">No resources found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-3 text-left">Name</th>
                      <th className="pb-3 text-left">Type</th>
                      <th className="pb-3 text-left">Location</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Capacity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentResources.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-3 font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {r.name}
                        </td>
                        <td className="py-3 text-slate-500">{formatType(r.type || '')}</td>
                        <td className="py-3 text-slate-500 flex items-center gap-1">
                          <MapPin size={11} className="opacity-50" />{r.location || '—'}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              background:
                                r.status === 'ACTIVE'
                                  ? '#dcfce7'
                                  : r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE'
                                  ? '#fef9c3'
                                  : '#fee2e2',
                              color:
                                r.status === 'ACTIVE'
                                  ? '#15803d'
                                  : r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE'
                                  ? '#b45309'
                                  : '#b91c1c',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background:
                                  r.status === 'ACTIVE'
                                    ? '#16a34a'
                                    : r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE'
                                    ? '#d97706'
                                    : '#dc2626',
                              }}
                            />
                            {r.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-700">{r.capacity ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ── FOOTER NOTE ────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-slate-400 pb-4">
          SmartCampusHub · Facilities & Assets Module · Data refreshed at {lastUpdated.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
