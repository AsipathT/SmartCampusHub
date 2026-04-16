import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  ClipboardList,
  Sparkles,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { getAllBookings, type Booking } from '../../api/bookingApi';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const getStatusBadge = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'CANCELLED':
      return 'bg-slate-200 text-slate-700 border border-slate-300';
    default:
      return 'bg-amber-100 text-amber-700 border border-amber-200';
  }
};

export const AdminBookingDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load booking dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter((b) => (b.status || '').toUpperCase() === 'APPROVED').length;
    const pending = bookings.filter((b) => (b.status || '').toUpperCase() === 'PENDING').length;
    const rejected = bookings.filter((b) => (b.status || '').toUpperCase() === 'REJECTED').length;

    return { total, approved, pending, rejected };
  }, [bookings]);

  const pieData = [
    { name: 'Approved', value: stats.approved },
    { name: 'Pending', value: stats.pending },
    { name: 'Rejected', value: stats.rejected },
  ];

  const resourceData = useMemo(() => {
    const map: Record<string, number> = {};

    bookings.forEach((b) => {
      const name = b.resourceName || 'Unknown';
      map[name] = (map[name] || 0) + 1;
    });

    return Object.keys(map).map((key) => ({
      name: key,
      count: map[key],
    }));
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const aCreated = new Date(a.bookingDate).getTime();
        const bCreated = new Date(b.bookingDate).getTime();

        if (aCreated === bCreated) {
          const aTime = new Date(`1970-01-01T${a.startTime || '00:00'}`).getTime();
          const bTime = new Date(`1970-01-01T${b.startTime || '00:00'}`).getTime();
          return bTime - aTime;
        }

        return bCreated - aCreated;
      })
      .slice(0, 10);
  }, [bookings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HERO */}
        <div className="mb-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-7 md:p-9">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                <Sparkles size={14} />
                Booking Management
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-800">
                Admin Booking Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm md:text-base leading-6 text-slate-500">
                Monitor booking performance, review distribution across resources,
                and keep track of the latest booking activity in one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Overview</p>
                  <p className="mt-1 text-lg font-black text-slate-800">Admin Analytics</p>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-indigo-400">Records</p>
                  <p className="mt-1 text-lg font-black text-indigo-700">{stats.total} Total</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-7 md:p-9 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <Activity size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">
                    Quick Snapshot
                  </p>
                  <h2 className="text-2xl font-black">{stats.total} Bookings</h2>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">Approved</p>
                  <p className="mt-1 text-2xl font-black">{stats.approved}</p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">Pending</p>
                  <p className="mt-1 text-2xl font-black">{stats.pending}</p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">Rejected</p>
                  <p className="mt-1 text-2xl font-black">{stats.rejected}</p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">Resources</p>
                  <p className="mt-1 text-2xl font-black">{resourceData.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading dashboard...</div>
        ) : (
          <>
            {/* STATS */}
            <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total"
                value={stats.total}
                icon={<CalendarDays size={20} />}
                gradient="from-indigo-500 to-purple-600"
              />
              <StatCard
                title="Approved"
                value={stats.approved}
                icon={<CheckCircle2 size={20} />}
                gradient="from-green-500 to-emerald-600"
              />
              <StatCard
                title="Pending"
                value={stats.pending}
                icon={<Clock3 size={20} />}
                gradient="from-yellow-500 to-orange-500"
              />
              <StatCard
                title="Rejected"
                value={stats.rejected}
                icon={<XCircle size={20} />}
                gradient="from-red-500 to-pink-600"
              />
            </div>

            {/* CHARTS */}
            <div className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5">
                  <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800">Bookings by Resource</h2>
                    <p className="text-sm text-slate-500">See which resources are used most</p>
                  </div>
                </div>

                <div className="p-5">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={resourceData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5">
                  <div className="rounded-2xl bg-violet-100 p-3 text-violet-600">
                    <PieChartIcon size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800">Status Distribution</h2>
                    <p className="text-sm text-slate-500">Current booking outcome split</p>
                  </div>
                </div>

                <div className="p-5">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {pieData.map((item, index) => (
                      <div
                        key={item.name}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        {item.name}: {item.value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT BOOKINGS */}
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800">Recent Bookings</h2>
                    <p className="text-sm text-slate-500">
                      Latest booking activity across the system
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    {recentBookings.length} Records
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-100 bg-white">
                    <tr className="text-left text-slate-500">
                      <th className="px-6 py-4 font-bold">Resource</th>
                      <th className="px-6 py-4 font-bold">User</th>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Time</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentBookings.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 last:border-b-0"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {b.resourceName}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{b.userName}</td>
                        <td className="px-6 py-4 text-slate-600">{b.bookingDate}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {b.startTime} - {b.endTime}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${getStatusBadge(
                              b.status
                            )}`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient }) => (
  <div className={`rounded-[28px] bg-gradient-to-r ${gradient} p-6 text-white shadow-lg`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-white/85">{title}</p>
        <p className="mt-3 text-4xl font-black">{value}</p>
      </div>

      <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
        {icon}
      </div>
    </div>
  </div>
);