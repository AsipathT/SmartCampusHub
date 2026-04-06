import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  MapPin,
  XCircle,
  BookMarked,
  CheckCircle2,
  Hourglass,
} from 'lucide-react';
import { cancelBooking, getMyBookings, type Booking } from '../../api/bookingApi.ts';
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this booking request?')) return;

    try {
      await cancelBooking(id);
      toast.success('Booking cancelled');
      fetchMyBookings();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const stats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter((b) => (b.status || '').toUpperCase() === 'APPROVED').length;
    const pending = bookings.filter((b) => (b.status || '').toUpperCase() === 'PENDING').length;

    return { total, approved, pending };
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
                My Bookings
              </h1>
              <p className="mt-2 text-slate-500 text-sm md:text-base">
                Review all booking requests you have created.
              </p>
            </div>

            <div className="inline-flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm w-fit">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookMarked size={20} />
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

        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white p-5 shadow-lg">
              <div className="absolute right-[-18px] bottom-[-18px] w-24 h-24 rounded-full bg-white/10" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 mb-3">
                Total Bookings
              </p>
              <p className="text-4xl font-black">{stats.total}</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-5 shadow-lg">
              <div className="absolute right-[-18px] bottom-[-18px] w-24 h-24 rounded-full bg-white/10" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 mb-3">
                Approved
              </p>
              <p className="text-4xl font-black">{stats.approved}</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5 shadow-lg">
              <div className="absolute right-[-18px] bottom-[-18px] w-24 h-24 rounded-full bg-white/10" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 mb-3">
                Pending
              </p>
              <p className="text-4xl font-black">{stats.pending}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-xl font-black text-slate-800">Booking History</h2>
              <p className="text-sm text-slate-500 mt-1">
                Track status changes, dates, and request details.
              </p>
            </div>

            {!loading && (
              <div className="hidden md:flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  {bookings.length} Records
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="px-8 py-10 text-slate-500">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="px-8 py-14 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <ClipboardList size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No bookings found</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-md">
                You have not created any booking requests yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white border-b border-slate-100">
                  <tr className="text-left text-slate-500">
                    <th className="px-6 md:px-8 py-4 font-bold">Resource</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Time</th>
                    <th className="px-6 py-4 font-bold">Purpose</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {bookings.map((b) => {
                    const currentStatus = (b.status || 'PENDING').toUpperCase();

                    return (
                      <tr
                        key={b.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 md:px-8 py-5">
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
                          <div className="flex items-start gap-2">
                            <ClipboardList size={14} className="text-slate-400 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{b.purpose || '-'}</span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusClass(
                              b.status
                            )}`}
                          >
                            {currentStatus === 'APPROVED' && <CheckCircle2 size={12} className="mr-1.5" />}
                            {currentStatus === 'PENDING' && <Hourglass size={12} className="mr-1.5" />}
                            {currentStatus === 'REJECTED' && <XCircle size={12} className="mr-1.5" />}
                            {currentStatus}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {currentStatus !== 'CANCELLED' ? (
                            <button
                              onClick={() => b.id && handleCancel(b.id)}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition shadow-sm"
                            >
                              <XCircle size={14} />
                              Cancel
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              Already cancelled
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