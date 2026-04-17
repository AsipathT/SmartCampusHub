import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, uploadTicketAttachments } from '../../api/ticketApi';
import { useAuth } from '../../contexts/AuthContext';
import { TicketPriority } from '../../types/ticket';
import toast from 'react-hot-toast';
import { AlertTriangle, Camera, MapPin, ShieldAlert, User } from 'lucide-react';
import { IncidentLocationMapPicker } from '../../components/incidents/IncidentLocationMapPicker';
import {
  resolveIncidentLocationLabel,
  resolveIncidentLocationPin,
  SLIIT_LOCATION_OPTIONS,
} from '../../utils/incidentLocationPins';

const PRIORITY_OPTIONS: { value: TicketPriority; label: string; helper: string }[] = [
  { value: 'LOW', label: 'Low', helper: 'Minor inconvenience, no immediate impact' },
  { value: 'MEDIUM', label: 'Medium', helper: 'Affects normal usage, should be addressed soon' },
  { value: 'HIGH', label: 'High', helper: 'Safety concern or major service disruption' },
];

const INCIDENT_CATEGORIES = [
  { value: 'ELECTRICAL_LIGHTING', label: 'Electrical / lighting fault' },
  { value: 'PLUMBING_WATER', label: 'Plumbing or water leak' },
  { value: 'AC_VENTILATION', label: 'AC or ventilation issue' },
  { value: 'IT_NETWORK', label: 'IT, Wi‑Fi, or lab equipment' },
  { value: 'FURNITURE_STRUCTURAL', label: 'Furniture, door, or fitting damage' },
  { value: 'CLEANLINESS', label: 'Cleanliness or hygiene concern' },
  { value: 'SECURITY', label: 'Security-related concern' },
  { value: 'LIFT_ACCESS', label: 'Lift, ramp, or accessibility' },
  { value: 'NOISE', label: 'Noise disturbance' },
  { value: 'HAZARD', label: 'Safety hazard (glass, spill, exposed wiring)' },
  { value: 'FIRE_SAFETY', label: 'Fire alarm, extinguisher, or emergency signage' },
  { value: 'OTHER', label: 'Other campus incident' },
];

export const ReportIncident: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    location: string;
    category: string;
    contactName: string;
    contactNumber: string;
    description: string;
    priority: TicketPriority;
  }>({
    location: '',
    category: INCIDENT_CATEGORIES[0].value,
    contactName: '',
    contactNumber: '',
    description: '',
    priority: 'MEDIUM',
  });
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  const onFileChange = (incoming: FileList | null) => {
    if (!incoming) return;
    const picked = Array.from(incoming);
    const next = [...files, ...picked].slice(0, 3);
    if (files.length + picked.length > 3) toast.error('Maximum 3 images are allowed');
    setFiles(next);
  };

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  useEffect(() => {
    const mapped = resolveIncidentLocationPin(form.location);
    setPin(mapped);
  }, [form.location]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!form.location || !form.category || !form.description.trim() || !form.contactName.trim() || !form.contactNumber.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!pin) {
      toast.error('Please select a campus location to auto-pin the incident on the map');
      return;
    }
    if (form.description.trim().length < 20) {
      toast.error('Please describe the incident in at least 20 characters');
      return;
    }
    if (files.length === 0) {
      toast.error('Please add at least one photo attachment');
      return;
    }
    const phoneOk = /^[\d+\s()-]{9,20}$/.test(form.contactNumber.trim());
    if (!phoneOk) {
      toast.error('Enter a valid contact number (9–20 digits, spaces, or + allowed)');
      return;
    }
    try {
      setError(null);
      setSubmitting(true);
      const locationLabel = resolveIncidentLocationLabel(form.location) ?? form.location;
      const categoryLabel = INCIDENT_CATEGORIES.find((c) => c.value === form.category)?.label ?? form.category;
      const created = await createTicket({
        location: locationLabel,
        category: categoryLabel,
        description: form.description.trim(),
        priority: form.priority,
        contactName: form.contactName.trim(),
        contactNumber: form.contactNumber.trim(),
        pinLatitude: pin.lat,
        pinLongitude: pin.lng,
        reporterUserId: Number(user.id),
      });
      if (files.length) {
        await uploadTicketAttachments(created.id, files);
      }
      toast.success('Incident ticket submitted');
      navigate('/app/user/incidents');
    } catch {
      setError('Submission failed. Please verify details and try again.');
      toast.error('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-indigo-50 to-sky-50 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl border border-indigo-100 bg-white/95 p-6 sm:p-8 shadow-md">
          <div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Report New Incident</h1>
              <p className="text-sm text-slate-500 mt-1">
                Submit a new maintenance &amp; incident ticket for SLIIT campus. Choose a category and
                priority so the right technician can be assigned quickly.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Campus location" required icon={<MapPin size={14} />}>
              <select
                className={inputClass}
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                required
              >
                <option value="">Select a location…</option>
                {SLIIT_LOCATION_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Incident category" required icon={<ShieldAlert size={14} />}>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Priority" required icon={<AlertTriangle size={14} />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRIORITY_OPTIONS.map((opt) => {
                  const selected = form.priority === opt.value;
                  const tone =
                    opt.value === 'HIGH'
                      ? selected
                        ? 'border-rose-300 bg-rose-50 ring-2 ring-rose-200'
                        : 'border-slate-200 hover:border-rose-200'
                      : opt.value === 'MEDIUM'
                      ? selected
                        ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-slate-200 hover:border-amber-200'
                      : selected
                      ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:border-emerald-200';
                  const dot =
                    opt.value === 'HIGH'
                      ? 'bg-rose-500'
                      : opt.value === 'MEDIUM'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setForm((f) => ({ ...f, priority: opt.value }))}
                      className={`text-left rounded-xl border bg-white p-3 transition-all ${tone}`}
                      aria-pressed={selected}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                        <span className="text-sm font-semibold text-slate-800">{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{opt.helper}</p>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Your name" required icon={<User size={14} />}>
                <input
                  className={inputClass}
                  placeholder="Full name"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  autoComplete="name"
                />
              </Field>
              <Field label="Contact number" required>
                <input
                  className={inputClass}
                  placeholder="e.g. 07xxxxxxxx"
                  value={form.contactNumber}
                  onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
            </div>

            <Field label="Pin exact location on campus map" required icon={<MapPin size={14} />}>
              <p className="text-xs text-slate-500 mb-2">
                The pin is automatically set based on your selected campus location.
              </p>
              <IncidentLocationMapPicker
                position={pin}
                onChange={(lat, lng) => setPin({ lat, lng })}
                interactive={false}
              />
            </Field>

            <Field label="Brief description" required>
              <textarea
                rows={5}
                className={inputClass}
                placeholder="What happened, when you noticed it, and any immediate risk…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>

            <Field label="Attachments (required, max 3)" required icon={<Camera size={14} />}>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => onFileChange(e.target.files)} />
                <p className="text-xs text-slate-500 mt-2">PNG / JPG / WEBP only. Up to 3 images.</p>
              </div>
              {!!previews.length && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {previews.map((entry, idx) => (
                    <div key={`${entry.file.name}-${idx}`} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <img src={entry.url} alt={entry.file.name} className="w-full h-24 object-cover" />
                      <div className="p-2">
                        <p className="text-xs text-slate-600 truncate">{entry.file.name}</p>
                        <button
                          type="button"
                          onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="mt-1 text-xs text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-sm"
            >
              {submitting ? 'Submitting…' : 'Submit incident ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode; required?: boolean; icon?: React.ReactNode }> = ({
  label,
  children,
  required,
  icon,
}) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-700 inline-flex items-center gap-1.5">
      {icon}
      {label} {required && <span className="text-rose-500">*</span>}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';
