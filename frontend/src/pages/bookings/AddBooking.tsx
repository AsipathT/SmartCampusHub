import React, { useEffect, useState } from "react";
import axios from "axios";

interface Resource {
  id: number;
  name: string;
}

export const AddBooking: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [form, setForm] = useState({
    resourceId: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
  });

  const userId = 1;

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/v1/resources");

      // Handles both:
      // 1. plain array response
      // 2. paginated response { content: [...] }
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];

      setResources(data);
    } catch (err) {
      console.error("Failed to load resources:", err);
      alert("Failed to load resources");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8080/api/v1/bookings", {
        ...form,
        resourceId: Number(form.resourceId),
        userId,
      });

      alert("Booking created successfully ✅");

      setForm({
        resourceId: "",
        bookingDate: "",
        startTime: "",
        endTime: "",
        purpose: "",
      });
    } catch (err: any) {
      console.error("Booking create error:", err);
      alert(err.response?.data?.message || "Error creating booking ❌");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Add Booking</h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block mb-1 font-medium">Select Resource</label>
          <select
            name="resourceId"
            value={form.resourceId}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">-- Select Resource --</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Booking Date</label>
          <input
            type="date"
            name="bookingDate"
            value={form.bookingDate}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Start Time</label>
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">End Time</label>
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Purpose</label>
          <input
            type="text"
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            placeholder="Enter purpose"
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Booking
        </button>
      </form>
    </div>
  );
};