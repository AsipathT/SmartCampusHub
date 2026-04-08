import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  Package,
  Users,
  ArrowRight,
  Sparkles,
  Info,
  BadgeCheck,
  WandSparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createBooking } from '../../api/bookingApi';

interface Resource {
  id: number;
  name: string;
  location?: string;
  type?: string;
  capacity?: number;
  availableFrom?: string;
  availableTo?: string;
}

const formatType = (t?: string) =>
  (t || 'OTHER')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const AddBooking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resourceIdFromUrl = searchParams.get('resourceId');
  const { user } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    resourceId: resourceIdFromUrl || '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: 1,
  });

  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const res = await axios.get('http://localhost:8080/api/v1/resources');
      const data = res.data?.content || res.data || [];
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      resourceId: resourceIdFromUrl || '',
    }));
    fetchResources();
  }, [resourceIdFromUrl]);

  const selectedResource = useMemo(() => {
    const selectedId = form.resourceId || resourceIdFromUrl;
    if (!selectedId) return null;
    return resources.find((r) => String(r.id) === String(selectedId)) || null;
  }, [resources, form.resourceId, resourceIdFromUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === 'expectedAttendees' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalResourceId = Number(form.resourceId || resourceIdFromUrl);
    const currentUserId = user?.id ? Number(user.id) : null;

    if (!currentUserId) {
      toast.error('Logged-in user not found');
      return;
    }

    if (
      !finalResourceId ||
      !form.bookingDate ||
      !form.startTime ||
      !form.endTime ||
      !form.purpose.trim()
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    if (form.expectedAttendees < 1) {
      toast.error('Expected attendees must be at least 1');
      return;
    }

    if (selectedResource?.capacity && form.expectedAttendees > selectedResource.capacity) {
      toast.error(`Expected attendees cannot exceed capacity (${selectedResource.capacity})`);
      return;
    }

    try {
      setSubmitting(true);

      await createBooking({
        resourceId: finalResourceId,
        userId: currentUserId,
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
        expectedAttendees: form.expectedAttendees,
      });

      toast.success('Booking created successfully');

      setForm({
        resourceId: resourceIdFromUrl || '',
        bookingDate: '',
        startTime: '',
        endTime: '',
        purpose: '',
        expectedAttendees: 1,
      });

      navigate('/app/bookings/my');
    } catch (error: any) {
      console.error('Booking creation failed:', error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Failed to create booking'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/60 to-violet-100/60">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        {/* TOP AREA */}
        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-8 md:p-10 text-white shadow-[0_24px_60px_rgba(79,70,229,0.25)]">
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-50">
                <Sparkles size={14} />
                Booking Request
              </div>

              <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
                Create a New Booking
              </h1>

              <p className="mt-4 max-w-2xl text-sm md:text-base leading-6 text-indigo-100">
                Submit a facility booking request with your preferred date, time,
                purpose, and expected attendees in a clean and professional way.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">Status</p>
                  <p className="mt-1 text-lg font-black">Pending Review</p>
                </div>

                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">Process</p>
                  <p className="mt-1 text-lg font-black">Request Submission</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-white/80 backdrop-blur p-6 md:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-600">
                <WandSparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Quick Tips</h3>
                <p className="text-sm text-slate-500">Make your booking stronger</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <TipCard text="Choose the correct resource before submitting the request." />
              <TipCard text="Use a clear purpose so admins can review faster." />
              <TipCard text="Keep attendees within the maximum capacity." />
              <TipCard text="Check your notifications for booking updates later." />
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[32px] border border-white/70 bg-white/90 backdrop-blur p-7 md:p-9 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
                Booking Form
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-black text-slate-800">
                Request Details
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Enter the booking details carefully before you submit the request.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {!resourceIdFromUrl && (
                <GlassSection title="Select Resource">
                  <select
                    name="resourceId"
                    value={form.resourceId}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
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
                </GlassSection>
              )}

              {selectedResource && (
                <div className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 md:p-6 shadow-sm">
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-indigo-100/60 blur-2xl" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
                      <Building2 size={24} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                        Selected Resource
                      </p>
                      <h3 className="mt-1 text-2xl font-black text-slate-800">
                        {selectedResource.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatType(selectedResource.type)} facility
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <BadgePill icon={<MapPin size={13} />} text={selectedResource.location || 'SLIIT Campus'} />
                        <BadgePill icon={<Package size={13} />} text={formatType(selectedResource.type)} />
                        <BadgePill icon={<Users size={13} />} text={`Capacity: ${selectedResource.capacity ?? 'N/A'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <GlassSection title="Booking Date">
                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="date"
                      name="bookingDate"
                      value={form.bookingDate}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </GlassSection>

                <GlassSection title="Expected Attendees">
                  <div className="relative">
                    <Users
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="number"
                      min={1}
                      name="expectedAttendees"
                      value={form.expectedAttendees}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  {selectedResource?.capacity && (
                    <p className="mt-2 text-xs text-slate-500">
                      Capacity limit: {selectedResource.capacity}
                    </p>
                  )}
                </GlassSection>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <GlassSection title="Start Time">
                  <div className="relative">
                    <Clock3
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </GlassSection>

                <GlassSection title="End Time">
                  <div className="relative">
                    <Clock3
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </GlassSection>
              </div>

              <GlassSection title="Purpose">
                <div className="relative">
                  <FileText
                    size={18}
                    className="pointer-events-none absolute left-4 top-4 text-slate-400"
                  />
                  <textarea
                    name="purpose"
                    value={form.purpose}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Enter the purpose of this booking"
                    className="w-full resize-none rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </GlassSection>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 font-bold text-white shadow-[0_12px_24px_rgba(79,70,229,0.25)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Create Booking'}
                  {!submitting && <ArrowRight size={18} />}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/app/bookings/my')}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] overflow-hidden border border-indigo-100 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <BadgeCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black">Booking Flow</h3>
                    <p className="text-sm text-indigo-100">Simple process</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <FlowStep number="01" text="Choose the resource and complete the form." />
                  <FlowStep number="02" text="Submit the booking request for admin review." />
                  <FlowStep number="03" text="Check notifications for latest updates." />
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/85 backdrop-blur p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                  <Info size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Helpful Notes</h3>
                  <p className="text-sm text-slate-500">Before you submit</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <SoftNote text="Bookings start in pending status until reviewed." />
                <SoftNote text="Overlapping bookings for the same resource are blocked." />
                <SoftNote text="Only approved bookings can later be cancelled." />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GlassSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="rounded-[28px] border border-indigo-100/70 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/60 p-5 shadow-sm">
    <label className="mb-3 block text-sm font-semibold text-slate-700">{title}</label>
    {children}
  </div>
);

const BadgePill: React.FC<{
  icon: React.ReactNode;
  text: string;
}> = ({ icon, text }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
    {icon}
    {text}
  </span>
);

const TipCard: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3 text-sm text-slate-600">
    {text}
  </div>
);

const SoftNote: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 px-4 py-3 text-sm text-slate-600">
    {text}
  </div>
);

const FlowStep: React.FC<{ number: string; text: string }> = ({ number, text }) => (
  <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
    <div className="min-w-[42px] rounded-xl bg-white text-center text-xs font-black text-indigo-700 px-2 py-2">
      {number}
    </div>
    <p className="text-sm text-indigo-50">{text}</p>
  </div>
);