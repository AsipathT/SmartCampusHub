import React, { useEffect, useState } from "react";
import { cancelBooking, getMyBookings, type Booking } from "../../api/bookingApi";



export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const userId = 1;

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const data = await getMyBookings(userId);
      setBookings(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load my bookings");
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this approved booking?")) return;

    try {
      await cancelBooking(id);
      fetchMyBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error cancelling booking");
    }
  };

  const getStatusClass = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "CANCELLED":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Bookings</h1>
        <p className="text-slate-500">Track your booking requests and cancellations.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-500">
          No bookings found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600 border-b">
                <th className="p-4">Resource</th>
                <th className="p-4">Date</th>
                <th className="p-4">Time</th>
                <th className="p-4">Purpose</th>
                <th className="p-4">Status</th>
                <th className="p-4">Notes</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b last:border-b-0">
                  <td className="p-4">{b.resourceName || `Resource ${b.resourceId}`}</td>
                  <td className="p-4">{b.bookingDate}</td>
                  <td className="p-4">{b.startTime} - {b.endTime}</td>
                  <td className="p-4">{b.purpose || "-"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(b.status)}`}>
                      {b.status || "PENDING"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {(b.status || "").toUpperCase() === "REJECTED"
                      ? b.rejectionReason || "Rejected"
                      : "-"}
                  </td>
                  <td className="p-4">
                    {(b.status || "").toUpperCase() === "APPROVED" ? (
                      <button
                        onClick={() => b.id && handleCancel(b.id)}
                        className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};