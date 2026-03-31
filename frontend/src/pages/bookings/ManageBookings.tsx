import React, { useEffect, useState } from "react";
import { deleteBooking, getAllBookings, updateBookingStatus, type Booking } from "../../api/bookingApi";

export const ManageBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load bookings");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await updateBookingStatus(id, "APPROVED");
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error updating booking");
    }
  };

  const handleReject = async (id: number) => {
    const reason = rejectionReasons[id]?.trim();

    if (!reason) {
      alert("Please enter a rejection reason");
      return;
    }

    try {
      await updateBookingStatus(id, "REJECTED", reason);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error updating booking");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this booking?")) return;

    try {
      await deleteBooking(id);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error deleting booking");
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
        <h1 className="text-2xl font-bold text-slate-800">Manage Bookings</h1>
        <p className="text-slate-500">Approve, reject, or remove booking requests.</p>
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
                <th className="p-4">ID</th>
                <th className="p-4">Resource</th>
                <th className="p-4">Date</th>
                <th className="p-4">Time</th>
                <th className="p-4">Purpose</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b last:border-b-0 align-top">
                  <td className="p-4">{b.id}</td>
                  <td className="p-4">{b.resourceName || `Resource ${b.resourceId}`}</td>
                  <td className="p-4">{b.bookingDate}</td>
                  <td className="p-4">{b.startTime} - {b.endTime}</td>
                  <td className="p-4">{b.purpose || "-"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(b.status)}`}>
                      {b.status || "PENDING"}
                    </span>
                  </td>
                  <td className="p-4">
                    {(b.status || "").toUpperCase() === "REJECTED" ? (
                      <div className="text-red-600 text-xs">{b.rejectionReason || "-"}</div>
                    ) : (
                  <input
  type="text"
  placeholder="Reason for rejection"
  value={b.id != null ? (rejectionReasons[b.id] || "") : ""}
  onChange={(e) => {
    const id = b.id;
    if (id === undefined) return;

    setRejectionReasons((prev) => ({
      ...prev,
      [id]: e.target.value,
    }));
  }}
  className="border border-slate-300 rounded-lg px-3 py-2 w-52"
/>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => b.id && handleApprove(b.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => b.id && handleReject(b.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => b.id && handleDelete(b.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
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