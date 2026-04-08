import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  MapPin,
  XCircle,
  BookMarked,
  CheckCircle2,
  Hourglass,
  Users,
  AlertTriangle,
  Bell,
  ArrowRight,
  LayoutList,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  cancelBooking,
  getMyBookings,
  type Booking,
} from '../../api/bookingApi.ts';
import { getUnreadBookingNotificationCount } from '../../api/bookingNotificationApi';
import { useAuth } from '../../contexts/AuthContext';

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

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // filter + pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const fetchMyBookings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getMyBookings(Number(user.id));
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [user?.id]);

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

  const openCancelModal = (id: number) => {
    setCancelBookingId(id);
  };

  const closeCancelModal = () => {
    if (cancelLoading) return;
    setCancelBookingId(null);
  };

  const confirmCancelBooking = async () => {
    if (!cancelBookingId) return;

    try {
      setCancelLoading(true);
      await cancelBooking(cancelBookingId);
      toast.success('Booking cancelled successfully');
      setCancelBookingId(null);
      fetchMyBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter(
      (b) => (b.status || '').toUpperCase() === 'APPROVED'
    ).length;
    const pending = bookings.filter(
      (b) => (b.status || '').toUpperCase() === 'PENDING'
    ).length;
    const rejected = bookings.filter(
      (b) => (b.status || '').toUpperCase() === 'REJECTED'
    ).length;

    return { total, approved, pending, rejected };
  }, [bookings]);

  const bookingToCancel = useMemo(() => {
    if (!cancelBookingId) return null;
    return bookings.find((b) => b.id === cancelBookingId) || null;
  }, [cancelBookingId, bookings]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(`${a.bookingDate}T${a.startTime || '00:00'}`).getTime();
      const dateB = new Date(`${b.bookingDate}T${b.startTime || '00:00'}`).getTime();
      return dateB - dateA;
    });
  }, [bookings]);

  const latestBooking = useMemo(() => {
    return sortedBookings[0] || null;
  }, [sortedBookings]);

  const filteredBookings = useMemo(() => {
    return sortedBookings.filter((b) => {
      const matchesSearch =
        (b.resourceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.purpose || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (b.status || '').toUpperCase() === statusFilter;

      const matchesDate =
        !dateFilter || b.bookingDate === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [sortedBookings, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-7 md:p-9">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                <LayoutList size={14} />
                Booking Management
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-800">
                My Bookings
              </h1>

              <p className="mt-3 max-w-2xl text-sm md:text-base leading-6 text-slate-500">
                Review your booking requests, track status changes, and manage approved
                bookings from one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/app/bookings/notifications')}
                  className="relative inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <Bell size={16} />
                  Notifications

                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 min-w-[22px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-bold text-white shadow animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigate('/app/bookings/add')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Add Booking
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-7 md:p-9 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <BookMarked size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">
                    Overview
                  </p>
                  <h2 className="text-2xl font-black">
                    {stats.total} Booking{stats.total === 1 ? '' : 's'}
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">
                    Approved
                  </p>
                  <p className="mt-1 text-2xl font-black">{stats.approved}</p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">
                    Pending
                  </p>
                  <p className="mt-1 text-2xl font-black">{stats.pending}</p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">
                    Rejected
                  </p>
                  <p className="mt-1 text-2xl font-black">{stats.rejected}</p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">
                    Alerts
                  </p>
                  <p className="mt-1 text-2xl font-black">{unreadCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        {!loading && latestBooking && (
          <div className="mb-7 overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 shadow-sm">
            <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow">
                  <Sparkles size={24} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
                    Recent Activity
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-800">
                    Latest Booking
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">
                      {latestBooking.resourceName || `Resource ${latestBooking.resourceId}`}
                    </span>{' '}
                    on {latestBooking.bookingDate} from {latestBooking.startTime} to {latestBooking.endTime}
                  </p>
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                    latestBooking.status
                  )}`}
                >
                  {(latestBooking.status || 'PENDING').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STATS */}
        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-7">
            <StatCard
              title="Total"
              value={stats.total}
              icon={<ClipboardList size={20} />}
              gradient="from-violet-600 to-indigo-500"
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              icon={<CheckCircle2 size={20} />}
              gradient="from-emerald-500 to-teal-500"
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={<Hourglass size={20} />}
              gradient="from-amber-500 to-orange-500"
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={<XCircle size={20} />}
              gradient="from-rose-500 to-red-500"
            />
          </div>
        )}

        {/* FILTER BAR */}
        <div className="mb-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by resource or purpose"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="w-full lg:w-56">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <div className="relative">
                <Filter
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="w-full lg:w-56">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 px-6 py-5 md:px-8">
            <div>
              <h2 className="text-xl font-black text-slate-800">Booking History</h2>
              <p className="mt-1 text-sm text-slate-500">
                Track dates, times, status changes, and request details.
              </p>
            </div>

            {!loading && (
              <div className="hidden md:flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  {filteredBookings.length} Filtered
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="px-8 py-10 text-slate-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center px-8 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ClipboardList size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No matching bookings found</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Try changing your search or filter options.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-100 bg-white">
                    <tr className="text-left text-slate-500">
                      <th className="px-6 py-4 font-bold md:px-8">Resource</th>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Time</th>
                      <th className="px-6 py-4 font-bold">Attendees</th>
                      <th className="px-6 py-4 font-bold">Purpose</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedBookings.map((b) => {
                      const currentStatus = (b.status || 'PENDING').toUpperCase();

                      return (
                        <tr
                          key={b.id}
                          className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 last:border-b-0"
                        >
                          <td className="px-6 py-5 md:px-8">
                            <div className="font-bold text-slate-800">
                              {b.resourceName || `Resource ${b.resourceId}`}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin size={12} />
                              {b.resourceLocation || 'SLIIT Campus'}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-slate-600">
                            <div className="flex items-center gap-2">
                              <CalendarDays size={14} className="text-slate-400" />
                              <span className="font-medium">{b.bookingDate}</span>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-slate-600">
                            <div className="flex items-center gap-2">
                              <Clock3 size={14} className="text-slate-400" />
                              <span className="font-medium">
                                {b.startTime} - {b.endTime}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-slate-600">
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-slate-400" />
                              <span className="font-medium">{b.expectedAttendees}</span>
                            </div>
                          </td>

                          <td className="max-w-[280px] px-6 py-5 text-slate-600">
                            <div className="flex items-start gap-2">
                              <ClipboardList
                                size={14}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />
                              <div>
                                <div className="line-clamp-2">{b.purpose || '-'}</div>
                                {b.rejectionReason && (
                                  <div className="mt-2 text-xs font-medium text-red-600">
                                    Rejection reason: {b.rejectionReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                b.status
                              )}`}
                            >
                              {currentStatus === 'APPROVED' && (
                                <CheckCircle2 size={12} className="mr-1.5" />
                              )}
                              {currentStatus === 'PENDING' && (
                                <Hourglass size={12} className="mr-1.5" />
                              )}
                              {currentStatus === 'REJECTED' && (
                                <XCircle size={12} className="mr-1.5" />
                              )}
                              {currentStatus}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            {currentStatus === 'APPROVED' ? (
                              <button
                                onClick={() => b.id && openCancelModal(b.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-900"
                              >
                                <XCircle size={14} />
                                Cancel
                              </button>
                            ) : currentStatus === 'CANCELLED' ? (
                              <span className="text-xs font-semibold text-slate-400">
                                Already cancelled
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">
                                No action available
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
                  <p className="text-sm text-slate-500">
                    Showing page <span className="font-bold text-slate-700">{currentPage}</span> of{' '}
                    <span className="font-bold text-slate-700">{totalPages}</span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                      Prev
                    </button>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CANCEL MODAL */}
      {cancelBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AlertTriangle size={24} />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-800">Cancel Booking</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Are you sure you want to cancel this approved booking?
                  </p>

                  {bookingToCancel && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-bold text-slate-800">
                        {bookingToCancel.resourceName || `Resource ${bookingToCancel.resourceId}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {bookingToCancel.bookingDate} • {bookingToCancel.startTime} -{' '}
                        {bookingToCancel.endTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeCancelModal}
                  disabled={cancelLoading}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Keep Booking
                </button>

                <button
                  onClick={confirmCancelBooking}
                  disabled={cancelLoading}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                >
                  {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
          {title}
        </p>
        <p className="text-4xl font-black">{value}</p>
      </div>

      <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
        {icon}
      </div>
    </div>
  </div>
);