import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllBookings, getMyBookings, type Booking } from '../../api/bookingApi';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

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

export const BookingDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (user?.id) {
      loadBookings();
    }
  }, [user?.id, isAdmin, location.pathname, loadBookings]);

  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        loadBookings();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, loadBookings]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(`${a.bookingDate}T${a.startTime || '00:00'}`).getTime();
      const dateB = new Date(`${b.bookingDate}T${b.startTime || '00:00'}`).getTime();
      return dateB - dateA;
    });
  }, [bookings]);

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
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500 mb-2">
            Booking Management
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                Booking Dashboard
              </h1>
              <p className="mt-2 text-slate-500 text-sm md:text-base">
                {isAdmin
                  ? 'Monitor all booking requests and recent activity.'
                  : 'Track your booking activity and latest request updates.'}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm w-fit">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ClipboardList size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Summary
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {isAdmin ? 'All bookings overview' : 'Your booking overview'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading dashboard...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white p-6 shadow-lg">
                <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute right-8 top-6 text-white/90">
                  <CalendarDays size={20} />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 mb-3">
                  Total Bookings
                </p>
                <p className="text-4xl font-black">{stats.total}</p>
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
              </div>
            </div>

            <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Recent Bookings</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Latest booking requests and status updates.
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    {sortedBookings.length} Records
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-left text-slate-500">
                      <th className="px-6 md:px-8 py-4 font-bold">Resource</th>
                      {isAdmin && <th className="px-6 py-4 font-bold">User</th>}
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Time</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedBookings.slice(0, 8).map((b) => (
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

                        {isAdmin && (
                          <td className="px-6 py-5 text-slate-600 font-medium">
                            {b.userName || `User ${b.userId}`}
                          </td>
                        )}

                        <td className="px-6 py-5 text-slate-600 font-medium">
                          {b.bookingDate}
                        </td>

                        <td className="px-6 py-5 text-slate-600 font-medium">
                          {b.startTime} - {b.endTime}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${getStatusClass(
                              b.status
                            )}`}
                          >
                            {(b.status || 'PENDING').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {sortedBookings.length === 0 && (
                      <tr>
                        <td
                          colSpan={isAdmin ? 5 : 4}
                          className="px-6 py-10 text-center text-slate-500"
                        >
                          No bookings found.
                        </td>
                      </tr>
                    )}
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