import React, { useEffect, useState } from "react";
import axios from "axios";
import { CalendarDays, ClipboardList, CheckCircle, Clock } from "lucide-react";

type Booking = {
  id: number;
  resourceId: number;
  resourceName?: string;
  userId?: number;
  userName?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status?: string;
  purpose?: string;
};

export const BookingDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/v1/bookings");
      setBookings(res.data || []);
    } catch (error) {
      console.error("Failed to load bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const totalBookings = bookings.length;
  const approvedBookings = bookings.filter(
    (b) => (b.status || "").toUpperCase() === "APPROVED"
  ).length;
  const pendingBookings = bookings.filter(
    (b) => (b.status || "").toUpperCase() === "PENDING"
  ).length;

  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter((b) => b.bookingDate === today).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Booking Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Overview of your booking activity and requests.
        </p>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Bookings</p>
                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    {totalBookings}
                  </h2>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <ClipboardList className="text-blue-600" size={22} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Approved</p>
                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    {approvedBookings}
                  </h2>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="text-green-600" size={22} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending</p>
                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    {pendingBookings}
                  </h2>
                </div>
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Clock className="text-yellow-600" size={22} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Today&apos;s Bookings</p>
                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    {todayBookings}
                  </h2>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <CalendarDays className="text-purple-600" size={22} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Recent Bookings
            </h2>

            {bookings.length === 0 ? (
              <p className="text-slate-500">No bookings found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-3 pr-4">ID</th>
                      <th className="py-3 pr-4">Resource</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Time</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 text-slate-700">{booking.id}</td>
                        <td className="py-3 pr-4 text-slate-700">
                          {booking.resourceName || `Resource #${booking.resourceId}`}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {booking.bookingDate}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {booking.startTime} - {booking.endTime}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {booking.status || "PENDING"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {booking.purpose || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};