import React, { useEffect, useState } from "react";
import axios from "axios";

type Booking = {
  id: number;
  resourceId: number;
  resourceName?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status?: string;
  purpose?: string;
};

export const ManageBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/v1/bookings");
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load bookings");
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.put(
        `http://localhost:8080/api/v1/bookings/${id}/status?status=${status}`
      );

      alert(`Booking ${status} successfully ✅`);
      fetchBookings(); // refresh list
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Error updating booking ❌");
    }
  };

  const deleteBooking = async (id: number) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      await axios.delete(`http://localhost:8080/api/v1/bookings/${id}`);
      alert("Booking deleted 🗑️");
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Error deleting booking ❌");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Bookings</h1>

      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <table className="w-full border border-gray-200 rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Resource</th>
              <th className="p-2">Date</th>
              <th className="p-2">Time</th>
              <th className="p-2">Status</th>
              <th className="p-2">Purpose</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="text-center border-t">
                <td className="p-2">{b.id}</td>

                <td className="p-2">
                  {b.resourceName || `Resource ${b.resourceId}`}
                </td>

                <td className="p-2">{b.bookingDate}</td>

                <td className="p-2">
                  {b.startTime} - {b.endTime}
                </td>

                <td className="p-2 font-semibold">
                  {b.status || "PENDING"}
                </td>

                <td className="p-2">{b.purpose}</td>

                <td className="p-2 space-x-2">
                  <button
                    onClick={() => updateStatus(b.id, "APPROVED")}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => updateStatus(b.id, "REJECTED")}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => deleteBooking(b.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};