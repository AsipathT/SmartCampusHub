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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      setBookings(data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateBookingStatus(id, status);
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update booking');
    }
  };

  const filteredBookings = useMemo(() => {
    const keyword = search.toLowerCase();

    return bookings.filter((b) => {
      const resourceName = (b.resourceName || '').toLowerCase();
      const userName = (b.userName || '').toLowerCase();
      const purpose = (b.purpose || '').toLowerCase();

      return (
        resourceName.includes(keyword) ||
        userName.includes(keyword) ||
        purpose.includes(keyword)
      );
    });
  }, [bookings, search]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter((b) => (b.status || '').toUpperCase() === 'APPROVED').length;
    const pending = bookings.filter((b) => (b.status || '').toUpperCase() === 'PENDING').length;
    const rejected = bookings.filter((b) => (b.status || '').toUpperCase() === 'REJECTED').length;

    return { total, approved, pending, rejected };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500 mb-2">
            Booking Management
          </p>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                Manage Bookings
              </h1>
              <p className="mt-2 text-slate-500 text-sm md:text-base">
                Review, approve, and reject booking requests.
              </p>
            </div>

            <div className="inline-flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm w-fit">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ClipboardList size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Overview
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {stats.total} booking{stats.total === 1 ? '' : 's'} total
                </p>
              </div>
            </div>
          </div>
        </div>

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white p-6 shadow-lg">
              <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute right-8 top-6 text-white/90">
                <ClipboardList size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 mb-3">
                Total Requests
              </p>
              <p className="text-4xl font-black">{stats.total}</p>
              <p className="text-sm text-white/80 mt-1">All booking records</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-6 shadow-lg">
              <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute right-8 top-6 text-white/90">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 mb-3">
                Approved
              </p>
              <p className="text-4xl font-black">{stats.approved}</p>
              <p className="text-sm text-white/80 mt-1">Accepted bookings</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 shadow-lg">
              <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute right-8 top-6 text-white/90">
                <Clock3 size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 mb-3">
                Pending
              </p>
              <p className="text-4xl font-black">{stats.pending}</p>
              <p className="text-sm text-white/80 mt-1">Waiting review</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-red-500 text-white p-6 shadow-lg">
              <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute right-8 top-6 text-white/90">
                <XCircle size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 mb-3">
                Rejected
              </p>
              <p className="text-4xl font-black">{stats.rejected}</p>
              <p className="text-sm text-white/80 mt-1">Declined requests</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 md:p-6 mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">Search & Filter</h2>
              <p className="text-sm text-slate-500 mt-1">
                Search by resource, user, or purpose.
              </p>
            </div>

            <div className="w-full md:max-w-xl relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resource name, user name, or purpose..."
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-xl font-black text-slate-800">Booking Requests</h2>
              <p className="text-sm text-slate-500 mt-1">
                Approve or reject pending requests from one place.
              </p>
            </div>

            {!loading && (
              <div className="hidden md:flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
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
                Try adjusting the search keyword.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white border-b border-slate-100">
                  <tr className="text-left text-slate-500">
                    <th className="px-6 md:px-8 py-4 font-bold">User</th>
                    <th className="px-6 py-4 font-bold">Resource</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Time</th>
                    <th className="px-6 py-4 font-bold">Purpose</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((b) => {
                    const currentStatus = (b.status || 'PENDING').toUpperCase();

                    return (
                      <tr
                        key={b.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 md:px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <UserRound size={16} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">
                                {b.userName || `User ${b.userId}`}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Booking requester
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-800">
                            {b.resourceName || `Resource ${b.resourceId}`}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
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
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusClass(
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
                                onClick={() => b.id && handleStatus(b.id, 'APPROVED')}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                              >
                                <CheckCircle2 size={14} />
                                Approve
                              </button>
                              <button
                                onClick={() => b.id && handleStatus(b.id, 'REJECTED')}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
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
    </div>
  );
};