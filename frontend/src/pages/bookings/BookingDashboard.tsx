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
  BookOpenCheck,
  BadgeInfo,
  Sparkles,
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

  const recentBookings = useMemo(() => sortedBookings.slice(0, 4), [sortedBookings]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter((b) => b.status === 'APPROVED').length;
    const pending = bookings.filter((b) => b.status === 'PENDING').length;
    const rejected = bookings.filter((b) => b.status === 'REJECTED').length;
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;

    return { total, approved, pending, rejected, cancelled };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-white p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 px-6 py-8 md:px-8 md:py-10">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 left-20 h-32 w-32 rounded-full bg-indigo-200/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-100 backdrop-blur-sm">
                  <LayoutDashboard size={14} />
                  Booking Management
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                  Booking Dashboard
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100/90 md:text-base">
                  {isAdmin
                    ? 'Monitor booking requests, approvals, pending activity, and overall usage from one elegant dashboard.'
                    : 'Track your booking activity, recent requests, and notification updates with a cleaner and more modern view.'}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-100">
                      Active View
                    </p>
                    <p className="mt-1 text-lg font-black">Booking Overview</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-100">
                      Unread Alerts
                    </p>
                    <p className="mt-1 text-lg font-black">{unreadCount}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[360px]">
                <button
                  onClick={() => navigate('/app/bookings/notifications')}
                  className="relative inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <ClipboardList size={18} />
                  Booking List
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

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_0.95fr]">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-800">
                      Recent Bookings
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Latest booking activity overview
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/app/bookings/my')}
                    className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition duration-300 hover:bg-slate-50"
                  >
                    View All
                    <ArrowRight size={16} />
                  </button>
                </div>

                {loading ? (
                  <div className="p-6 text-sm text-slate-500">Loading dashboard...</div>
                ) : recentBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="mb-4 rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                      <ClipboardList size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No bookings yet</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Your recent bookings will appear here once you start making requests.
                    </p>
                  </div>
                ) : (
                  <>
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
                            <tr
                              key={b.id}
                              className="border-t border-slate-100 transition duration-300 hover:bg-indigo-50/20"
                            >
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-800">{b.resourceName}</div>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{b.bookingDate}</td>
                              <td className="px-6 py-4 text-slate-600">
                                {b.startTime} - {b.endTime}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
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

                    <div className="border-t border-slate-100 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="group overflow-hidden rounded-[24px] border border-indigo-100 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 p-[1px] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                          <div className="flex h-full flex-col rounded-[23px] bg-white/95 p-5 backdrop-blur">
                            <div className="flex items-start gap-3">
                              <div className="rounded-2xl bg-purple-100 p-3 text-purple-600">
                                <BookOpenCheck size={20} />
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-500">
                                  Booking Flow
                                </p>
                                <h3 className="mt-2 text-xl font-black text-slate-800">
                                  Status overview
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  Follow each booking stage clearly from request submission to final outcome.
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 space-y-3">
                              <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 shadow-sm transition duration-300 hover:translate-x-1">
                                <span className="text-sm font-semibold text-slate-700">Pending</span>
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                  Waiting review
                                </span>
                              </div>

                              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 shadow-sm transition duration-300 hover:translate-x-1">
                                <span className="text-sm font-semibold text-slate-700">Approved</span>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                  Confirmed
                                </span>
                              </div>

                              <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3 shadow-sm transition duration-300 hover:translate-x-1">
                                <span className="text-sm font-semibold text-slate-700">Rejected</span>
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                  Not approved
                                </span>
                              </div>

                              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition duration-300 hover:translate-x-1">
                                <span className="text-sm font-semibold text-slate-700">Cancelled</span>
                                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                                  Inactive
                                </span>
                              </div>
                            </div>

                            <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-purple-600">
                              <Sparkles size={14} />
                              Smooth booking status journey
                            </div>
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-[24px] border border-violet-100 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-[1px] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                          <div className="flex h-full flex-col rounded-[23px] bg-white/95 p-5">
                            <div className="flex items-start gap-3">
                              <div className="rounded-2xl bg-violet-100 p-3 text-violet-600">
                                <BadgeInfo size={20} />
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">
                                  Quick Note
                                </p>
                                <h3 className="mt-2 text-xl font-black text-slate-800">
                                  Common booking purposes
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  Use realistic academic purposes to make requests clearer and easier to review.
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                              {[
                                'Lecture Session',
                                'Group Study',
                                'Project Meeting',
                                'Exam Preparation',
                                'Workshop',
                                'Presentation',
                              ].map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition duration-300 hover:bg-violet-50"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>

                            <div className="mt-5 rounded-2xl bg-slate-50/80 p-4">
                              <p className="text-sm font-bold text-slate-800">Best practice</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                Keep the purpose clear, choose a valid time range, and set a suitable attendee count to improve approval chances.
                              </p>
                            </div>

                            <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-violet-600">
                              <Sparkles size={14} />
                              Cleaner requests look more professional
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <div className="overflow-hidden rounded-[28px] border border-indigo-200/30 bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800 p-6 text-white shadow-[0_14px_40px_rgba(49,46,129,0.20)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                        Quick Summary
                      </p>
                      <h3 className="mt-2 text-2xl font-black">Booking Insights</h3>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 transition duration-300 hover:scale-105">
                      <TrendingUp size={22} />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-white/10 p-4 transition duration-300 hover:bg-white/15">
                      <p className="text-sm text-indigo-100">Approved bookings</p>
                      <p className="mt-1 text-3xl font-black">{stats.approved}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-white/10 p-4 transition duration-300 hover:bg-white/15">
                        <p className="text-xs text-indigo-100">Pending</p>
                        <p className="mt-1 text-2xl font-black">{stats.pending}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4 transition duration-300 hover:bg-white/15">
                        <p className="text-xs text-indigo-100">Rejected</p>
                        <p className="mt-1 text-2xl font-black">{stats.rejected}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 transition duration-300 hover:bg-white/15">
                      <p className="text-sm text-indigo-100">Unread notifications</p>
                      <p className="mt-1 text-3xl font-black">{unreadCount}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800">Dashboard Actions</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Quick access to your booking tools
                  </p>

                  <div className="mt-5 space-y-3">
                    <ActionButton
                      onClick={() => navigate('/app/bookings/add')}
                      title="Add New Booking"
                      subtitle="Create a new booking request"
                      wrapperClass="border-indigo-100 bg-indigo-50 hover:bg-indigo-100"
                      titleClass="text-indigo-700"
                      subtitleClass="text-indigo-500"
                      arrowClass="text-indigo-600"
                    />

                    <ActionButton
                      onClick={() => navigate('/app/bookings/my')}
                      title="Open Booking List"
                      subtitle="View all your booking records"
                      wrapperClass="border-slate-200 bg-slate-50 hover:bg-slate-100"
                      titleClass="text-slate-800"
                      subtitleClass="text-slate-500"
                      arrowClass="text-slate-600"
                    />

                    <ActionButton
                      onClick={() => navigate('/app/bookings/notifications')}
                      title="Check Notifications"
                      subtitle="See latest booking updates"
                      wrapperClass="border-violet-100 bg-violet-50 hover:bg-violet-100"
                      titleClass="text-violet-700"
                      subtitleClass="text-violet-500"
                      arrowClass="text-violet-600"
                    />
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
  <div className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
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

type ActionButtonProps = {
  onClick: () => void;
  title: string;
  subtitle: string;
  wrapperClass: string;
  titleClass: string;
  subtitleClass: string;
  arrowClass: string;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  title,
  subtitle,
  wrapperClass,
  titleClass,
  subtitleClass,
  arrowClass,
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition duration-300 hover:-translate-y-0.5 ${wrapperClass}`}
  >
    <div>
      <p className={`font-bold ${titleClass}`}>{title}</p>
      <p className={`text-xs ${subtitleClass}`}>{subtitle}</p>
    </div>
    <ArrowRight size={18} className={arrowClass} />
  </button>
);