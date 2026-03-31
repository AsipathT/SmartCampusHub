import React, { useEffect, useState } from "react";
import axios from "axios";
import { CalendarDays, Clock3, ClipboardList, MapPinned } from "lucide-react";

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
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setResources(data);
    } catch (err) {
      console.error("Failed to load resources:", err);
      alert("Failed to load resources");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Add Booking</h1>
        <p className="mt-2 text-slate-500">
          Submit a new booking request for an available campus resource.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-xl">
                <ClipboardList className="text-blue-600" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Booking Request Form
                </h2>
                <p className="text-sm text-slate-500">
                  Fill in the details below to create your booking.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Resource */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Resource
                </label>
                <div className="relative">
                  <MapPinned
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    name="resourceId"
                    value={form.resourceId}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Select Resource --</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Booking Date
                </label>
                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    name="bookingDate"
                    value={form.bookingDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Time fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Time
                  </label>
                  <div className="relative">
                    <Clock3
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    End Time
                  </label>
                  <div className="relative">
                    <Clock3
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Purpose
                </label>
                <textarea
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter the reason for this booking request..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-700 outline-none transition resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Side Info Card */}
        <div className="xl:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Booking Guidelines
            </h3>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                Select a valid resource before choosing a date and time.
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                Make sure your booking time falls within the resource’s available hours.
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                Overlapping bookings for the same resource will be rejected automatically.
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-blue-700">
                Your request will usually start with <span className="font-semibold">PENDING</span> status until reviewed.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};