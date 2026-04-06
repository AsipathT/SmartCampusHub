import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  Package,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface Resource {
  id: number;
  name: string;
  location?: string;
  type?: string;
}

const formatType = (t?: string) =>
  (t || "OTHER")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const AddBooking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const resourceIdFromUrl = searchParams.get("resourceId");
  const { user } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const [form, setForm] = useState({
    resourceId: resourceIdFromUrl || "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
  });

  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const res = await axios.get("http://localhost:8080/api/v1/resources");
      const data = res.data?.content || res.data || [];
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      toast.error("Failed to load resources");
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      resourceId: resourceIdFromUrl || "",
    }));

    fetchResources();
  }, [resourceIdFromUrl]);

  const selectedResource = useMemo(() => {
    if (!resourceIdFromUrl) return null;
    return resources.find((r) => String(r.id) === String(resourceIdFromUrl)) || null;
  }, [resources, resourceIdFromUrl]);

  const selectedDropdownResource = useMemo(() => {
    if (!form.resourceId) return null;
    return resources.find((r) => String(r.id) === String(form.resourceId)) || null;
  }, [resources, form.resourceId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalResourceId = Number(form.resourceId || resourceIdFromUrl);
    const currentUserId = user?.id ? Number(user.id) : null;

    if (!currentUserId) {
      toast.error("Logged-in user not found");
      return;
    }

    if (!finalResourceId || !form.bookingDate || !form.startTime || !form.endTime) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.post("http://localhost:8080/api/v1/bookings", {
        resourceId: finalResourceId,
        userId: currentUserId,
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
      });

      toast.success("Booking created successfully");

      setForm({
        resourceId: resourceIdFromUrl || "",
        bookingDate: "",
        startTime: "",
        endTime: "",
        purpose: "",
      });
    } catch (error: any) {
      console.error("Booking creation failed:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to create booking"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(79,70,229,0.95) 0%, rgba(30,41,59,0.96) 65%, rgba(15,23,42,0.98) 100%)",
          }}
        />
        <div
          className="absolute -top-12 right-10 w-56 h-56 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }}
        />
        <div
          className="absolute -bottom-12 left-10 w-52 h-52 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #34d399, transparent)" }}
        />

        <div className="relative max-w-6xl mx-auto px-6 md:px-8 pt-10 pb-24">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.22em] mb-3">
            Booking Management
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Add Booking
          </h1>
          <p className="mt-3 text-sm md:text-base text-indigo-100 max-w-2xl">
            Reserve a campus facility quickly and clearly.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-8 -mt-14 pb-12 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          <div className="xl:col-span-2 bg-white rounded-[28px] shadow-lg border border-slate-200 p-7 md:p-9">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-800">Booking Details</h2>
              <p className="mt-2 text-sm text-slate-500">
                Fill in the date, time, and purpose for your booking.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {resourceIdFromUrl ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Selected Resource
                  </label>

                  <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 md:p-6 shadow-sm">
                    <div
                      className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-40"
                      style={{ background: "radial-gradient(circle, #c4b5fd, transparent)" }}
                    />

                    <div className="relative flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Building2 size={24} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500 mb-1">
                          {selectedResource ? formatType(selectedResource.type) : "Selected Resource"}
                        </p>

                        <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
                          {selectedResource ? selectedResource.name : "Loading resource..."}
                        </h3>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                            <MapPin size={13} />
                            {selectedResource?.location || "SLIIT Campus"}
                          </span>

                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                            <Package size={13} />
                            {selectedResource ? formatType(selectedResource.type) : "Loading type"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resource
                  </label>
                  <select
                    name="resourceId"
                    value={form.resourceId}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={loadingResources}
                  >
                    <option value="">Select Resource</option>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Booking Date
                </label>
                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="date"
                    name="bookingDate"
                    value={form.bookingDate}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Time
                  </label>
                  <div className="relative">
                    <Clock3
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
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
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Purpose
                </label>
                <div className="relative">
                  <FileText
                    size={18}
                    className="absolute left-4 top-4 text-slate-400 pointer-events-none"
                  />
                  <textarea
                    name="purpose"
                    value={form.purpose}
                    onChange={handleChange}
                    placeholder="Enter booking purpose"
                    rows={5}
                    className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm"
                >
                  Create Booking
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[28px] shadow-lg border border-slate-200 p-6 md:p-7 h-fit">
            <h3 className="text-xl font-black text-slate-800">Quick Summary</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Review the selected resource and booking inputs before submitting.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400 mb-1">
                  Resource
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {resourceIdFromUrl
                    ? selectedResource?.name || "Loading resource..."
                    : selectedDropdownResource?.name || "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400 mb-1">
                  Location
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {resourceIdFromUrl
                    ? selectedResource?.location || "SLIIT Campus"
                    : selectedDropdownResource?.location || "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400 mb-1">
                  Time Slot
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {form.startTime && form.endTime
                    ? `${form.startTime} - ${form.endTime}`
                    : "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
                <p className="text-xs font-semibold text-indigo-700">Tip</p>
                <p className="mt-1 text-sm text-indigo-900 leading-relaxed">
                  This booking will be saved for the currently logged-in user.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};