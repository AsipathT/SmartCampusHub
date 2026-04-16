import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  XCircle,
  ClipboardList,
  Search,
  Clock3,
  CalendarDays,
  MapPin,
  UserRound,
  Users,
  Filter,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { getAllBookings, updateBookingStatus, type Booking } from '../../api/bookingApi';

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

export const ManageBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const [rejectingBookingId, setRejectingBookingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await updateBookingStatus(id, { status: 'APPROVED' });
      toast.success('Booking approved');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to approve booking');
    }
  };

  const handleReject = async () => {
    if (!rejectingBookingId) return;

    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    try {
      await updateBookingStatus(rejectingBookingId, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      });

      toast.success('Booking rejected');
      setRejectingBookingId(null);
      setRejectionReason('');
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to reject booking');
    }
  };

  const filteredBookings = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return bookings.filter((b) => {
      const matchesKeyword =
        !keyword ||
        (b.resourceName || '').toLowerCase().includes(keyword) ||
        (b.userName || '').toLowerCase().includes(keyword) ||
        (b.purpose || '').toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === 'ALL' || (b.status || '').toUpperCase() === statusFilter;

      const matchesDate = !dateFilter || b.bookingDate === dateFilter;

      const matchesLocation =
        !locationFilter ||
        (b.resourceLocation || '').toLowerCase().includes(locationFilter.toLowerCase());

      return matchesKeyword && matchesStatus && matchesDate && matchesLocation;
    });
  }, [bookings, search, statusFilter, dateFilter, locationFilter]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter((b) => (b.status || '').toUpperCase() === 'APPROVED').length;
    const pending = bookings.filter((b) => (b.status || '').toUpperCase() === 'PENDING').length;
    const rejected = bookings.filter((b) => (b.status || '').toUpperCase() === 'REJECTED').length;

    return { total, approved, pending, rejected };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-violet-100/40 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 p-8 md:p-10 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-indigo-300/10 blur-2xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">
                <ShieldCheck size={14} />
                Admin Control Panel
              </div>

              <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
                Manage Bookings
              </h1>

              <p className="mt-4 max-w-2xl text-sm md:text-base leading-6 text-indigo-100">
                Review requests, apply filters, and approve or reject bookings from
                one focused admin workspace.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">Pending</p>
                  <p className="mt-1 text-2xl font-black">{stats.pending}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">All Requests</p>
                  <p className="mt-1 text-2xl font-black">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/80 backdrop-blur p-6 md:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-600">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Approval Snapshot</h3>
                <p className="text-sm text-slate-500">Current request status</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SoftStat title="Approved" value={stats.approved} color="text-emerald-600" />
              <SoftStat title="Pending" value={stats.pending} color="text-amber-600" />
              <SoftStat title="Rejected" value={stats.rejected} color="text-red-600" />
              <SoftStat title="Total" value={stats.total} color="text-indigo-600" />
            </div>
          </div>
        </div>

        {/* COLORFUL STATS */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
            <StatCard title="Total Requests" value={stats.total} gradient="from-violet-600 to-indigo-500" />
            <StatCard title="Approved" value={stats.approved} gradient="from-emerald-500 to-teal-500" />
            <StatCard title="Pending" value={stats.pending} gradient="from-amber-500 to-orange-500" />
            <StatCard title="Rejected" value={stats.rejected} gradient="from-rose-500 to-red-500" />
          </div>
        )}

        {/* FILTER BLOCK */}
        <div className="mb-6 overflow-hidden rounded-[30px] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/60 to-violet-50/60 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-indigo-100/70 bg-white/50 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-sm">
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Search & Filters</h2>
                <p className="text-sm text-slate-500">Find the exact booking request quickly</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4 md:p-6">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resource, user, purpose..."
                className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter by location..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <ClipboardList size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Booking Requests</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review each request and take action where needed
                </p>
              </div>
            </div>

            {!loading && (
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 w-fit">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  {filteredBookings.length} Results
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-slate-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="px-8 py-14 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <ClipboardList size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No bookings found</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-md">
                Try adjusting the search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/70 border-b border-slate-100">
                  <tr className="text-left text-slate-500">
                    <th className="px-6 md:px-8 py-4 font-bold">User</th>
                    <th className="px-6 py-4 font-bold">Resource</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Time</th>
                    <th className="px-6 py-4 font-bold">Purpose</th>
                    <th className="px-6 py-4 font-bold">Attendees</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((b) => {
                    const currentStatus = (b.status || 'PENDING').toUpperCase();

                    return (
                      <tr
                        key={b.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 md:px-8 py-5">
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <UserRound size={14} className="text-slate-400" />
                            {b.userName || `User ${b.userId}`}
                          </div>
                        </td>

                        <td className="px-6 py-5">
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

                        <td className="px-6 py-5 text-slate-600 max-w-[260px]">
                          <div className="line-clamp-2">{b.purpose || '-'}</div>
                          {b.rejectionReason && (
                            <div className="mt-2 text-xs font-medium text-red-600">
                              Reason: {b.rejectionReason}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5 text-slate-600">
                          <div className="inline-flex items-center gap-2">
                            <Users size={14} className="text-slate-400" />
                            <span className="font-medium">{b.expectedAttendees}</span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClass(
                              b.status
                            )}`}
                          >
                            {currentStatus}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {currentStatus === 'PENDING' ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => b.id && handleApprove(b.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                              >
                                <CheckCircle2 size={14} />
                                Approve
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingBookingId(b.id || null);
                                  setRejectionReason('');
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                              >
                                <XCircle size={14} />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              {currentStatus === 'APPROVED' && 'Already approved'}
                              {currentStatus === 'REJECTED' && 'Already rejected'}
                              {currentStatus === 'CANCELLED' && 'Cancelled'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* REJECT MODAL */}
      {rejectingBookingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-5 text-white">
              <h3 className="text-xl font-black">Reject Booking</h3>
              <p className="mt-1 text-sm text-red-50">
                Please enter the reason for rejecting this booking request.
              </p>
            </div>

            <div className="p-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                placeholder="Enter rejection reason..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setRejectingBookingId(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleReject}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:opacity-90 text-white text-sm font-bold transition shadow-sm"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SoftStat: React.FC<{
  title: string;
  value: number;
  color: string;
}> = ({ title, value, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-3">
    <p className="text-xs uppercase tracking-widest text-slate-400">{title}</p>
    <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: number;
  gradient: string;
}> = ({ title, value, gradient }) => (
  <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg`}>
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
      {title}
    </p>
    <p className="text-4xl font-black">{value}</p>
  </div>
);