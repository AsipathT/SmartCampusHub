import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Bell,
  ArrowRight,
  LayoutDashboard,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllBookings,
  getMyBookings,
  type Booking,
} from '../../api/bookingApi';
import { getUnreadBookingNotificationCount } from '../../api/bookingNotificationApi';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const getStatusClass = (status?: string) => {
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

const getStatusDot = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'APPROVED':
      return 'bg-emerald-500';
    case 'REJECTED':
      return 'bg-red-500';
    case 'CANCELLED':
      return 'bg-slate-500';
    default:
      return 'bg-amber-500';
  }
};

export const BookingDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);

      const data = isAdmin
        ? await getAllBookings()
        : await getMyBookings(Number(user?.id));

      setBookings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load booking dashboard');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    if (user?.id) loadBookings();
  }, [user?.id, isAdmin, location.pathname, loadBookings]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;

      try {
        const count = await getUnreadBookingNotificationCount(user.id);
        setUnreadCount(count);
      } catch {
        console.error('Failed to fetch unread count');
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(`${a.bookingDate}T${a.startTime || '00:00'}`).getTime();
      const dateB = new Date(`${b.bookingDate}T${b.startTime || '00:00'}`).getTime();
      return dateB - dateA;
    });
  }, [bookings]);

  const recentBookings = useMemo(() => sortedBookings.slice(0, 6), [sortedBookings]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter((b) => b.status === 'APPROVED').length;
    const pending = bookings.filter((b) => b.status === 'PENDING').length;
    const rejected = bookings.filter((b) => b.status === 'REJECTED').length;
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;

    return { total, approved, pending, rejected, cancelled };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="overflow-hidden rounded-[28px] border border-indigo-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-6 py-8 md:px-8 md:py-10">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-50">
                  <LayoutDashboard size={14} />
                  Booking Management
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                  Booking Dashboard
                </h1>

                <p className="mt-3 text-sm leading-6 text-indigo-100 md:text-base">
                  {isAdmin
                    ? 'Monitor booking requests, approvals, pending activity, and overall platform usage in one place.'
                    : 'Track your booking activity, recent requests, and notification updates with a clearer overview.'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/app/bookings/notifications')}
                  className="relative inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:scale-[1.02]"
                >
                  <Bell size={18} />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 min-w-[22px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-bold text-white shadow animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigate('/app/bookings/my')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <ClipboardList size={18} />
                  View Booking List
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Bookings"
                value={stats.total}
                subtitle="Overall requests"
                icon={<CalendarDays size={20} />}
                iconBg="bg-indigo-100"
                iconColor="text-indigo-600"
              />
              <StatCard
                title="Approved"
                value={stats.approved}
                subtitle="Successfully confirmed"
                icon={<CheckCircle2 size={20} />}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
              />
              <StatCard
                title="Pending"
                value={stats.pending}
                subtitle="Waiting for review"
                icon={<Clock3 size={20} />}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
              />
              <StatCard
                title="Rejected"
                value={stats.rejected}
                subtitle="Not approved"
                icon={<XCircle size={20} />}
                iconBg="bg-red-100"
                iconColor="text-red-600"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Recent Bookings</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Latest booking activity overview
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/app/bookings/my')}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    View All
                    <ArrowRight size={16} />
                  </button>
                </div>

                {loading ? (
                  <div className="p-6 text-sm text-slate-500">Loading dashboard...</div>
                ) : recentBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="mb-4 rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                      <ClipboardList size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No bookings yet</h3>
                    <p className="mt-2 max-w-md text-sm text-slate-500">
                      Your recent bookings will appear here once you start making requests.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold text-slate-600">Resource</th>
                          <th className="px-6 py-4 text-left font-bold text-slate-600">Date</th>
                          <th className="px-6 py-4 text-left font-bold text-slate-600">Time</th>
                          <th className="px-6 py-4 text-left font-bold text-slate-600">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentBookings.map((b) => (
                          <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                            <td className="px-6 py-4 font-medium text-slate-800">
                              {b.resourceName}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{b.bookingDate}</td>
                            <td className="px-6 py-4 text-slate-600">
                              {b.startTime} - {b.endTime}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                                  b.status
                                )}`}
                              >
                                <span className={`h-2 w-2 rounded-full ${getStatusDot(b.status)}`} />
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-900 p-6 text-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                        Quick Summary
                      </p>
                      <h3 className="mt-2 text-2xl font-black">Booking Insights</h3>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <TrendingUp size={22} />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-sm text-indigo-100">Approved bookings</p>
                      <p className="mt-1 text-3xl font-black">{stats.approved}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs text-indigo-100">Pending</p>
                        <p className="mt-1 text-2xl font-black">{stats.pending}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs text-indigo-100">Rejected</p>
                        <p className="mt-1 text-2xl font-black">{stats.rejected}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-sm text-indigo-100">Unread notifications</p>
                      <p className="mt-1 text-3xl font-black">{unreadCount}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800">Dashboard Actions</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Quick access to your booking tools
                  </p>

                  <div className="mt-5 space-y-3">
                    <button
                      onClick={() => navigate('/app/bookings/add')}
                      className="flex w-full items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left transition hover:bg-indigo-100"
                    >
                      <div>
                        <p className="font-bold text-indigo-700">Add New Booking</p>
                        <p className="text-xs text-indigo-500">Create a new booking request</p>
                      </div>
                      <ArrowRight size={18} className="text-indigo-600" />
                    </button>

                    <button
                      onClick={() => navigate('/app/bookings/my')}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                    >
                      <div>
                        <p className="font-bold text-slate-800">Open Booking List</p>
                        <p className="text-xs text-slate-500">View all your booking records</p>
                      </div>
                      <ArrowRight size={18} className="text-slate-600" />
                    </button>

                    <button
                      onClick={() => navigate('/app/bookings/notifications')}
                      className="flex w-full items-center justify-between rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-left transition hover:bg-violet-100"
                    >
                      <div>
                        <p className="font-bold text-violet-700">Check Notifications</p>
                        <p className="text-xs text-violet-500">See latest booking updates</p>
                      </div>
                      <ArrowRight size={18} className="text-violet-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

type StatCardProps = {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
}) => (
  <div className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-800">
          {value}
        </h2>
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className={`rounded-2xl p-3 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
    </div>
  </div>
);