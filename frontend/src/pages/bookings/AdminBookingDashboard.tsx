import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  ClipboardList,
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
        const aDateTime = new Date(`${a.bookingDate}T${a.startTime || '00:00'}`).getTime();
        const bDateTime = new Date(`${b.bookingDate}T${b.startTime || '00:00'}`).getTime();
        return bDateTime - aDateTime;
      })
      .slice(0, 5);
  }, [bookings]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">
            Booking Management
          </p>
          <h1 className="text-3xl font-black text-slate-800">
            Admin Booking Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Monitor all booking activity and performance.
          </p>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading dashboard...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow">
                <CalendarDays />
                <h2 className="text-sm mt-2">Total</h2>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow">
                <CheckCircle2 />
                <h2 className="text-sm mt-2">Approved</h2>
                <p className="text-3xl font-bold">{stats.approved}</p>
              </div>

              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-2xl shadow">
                <Clock3 />
                <h2 className="text-sm mt-2">Pending</h2>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-2xl shadow">
                <XCircle />
                <h2 className="text-sm mt-2">Rejected</h2>
                <p className="text-3xl font-bold">{stats.rejected}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-7">
              <div className="xl:col-span-2 bg-white p-5 rounded-2xl shadow border">
                <h2 className="font-bold text-slate-700 mb-4">
                  Bookings by Resource
                </h2>

                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={resourceData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow border">
                <h2 className="font-bold text-slate-700 mb-4">
                  Status Distribution
                </h2>

                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border overflow-hidden">
              <div className="p-5 border-b font-bold text-slate-700">
                Recent Bookings
              </div>

              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left">Resource</th>
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Time</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="border-b">
                      <td className="p-3">{b.resourceName}</td>
                      <td className="p-3">{b.userName}</td>
                      <td className="p-3">{b.bookingDate}</td>
                      <td className="p-3">
                        {b.startTime} - {b.endTime}
                      </td>
                      <td className="p-3">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};