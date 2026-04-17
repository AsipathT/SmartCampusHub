import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, uploadTicketAttachments } from '../../api/ticketApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Camera, MapPin, ShieldAlert, User } from 'lucide-react';
import { IncidentLocationMapPicker } from '../../components/incidents/IncidentLocationMapPicker';

const SLIIT_LOCATIONS = [
  { value: 'MAIN_BUILDING', label: 'Main Building (Administration)' },
  { value: 'BLOCK_A', label: 'Block A — Computing & IT' },
  { value: 'BLOCK_B', label: 'Block B — Engineering' },
  { value: 'BLOCK_C', label: 'Block C — Business Faculty' },
  { value: 'LIBRARY', label: 'Library & Learning Commons' },
  { value: 'STUDENT_CENTER', label: 'Student Center / Cafeteria' },
  { value: 'AUDITORIUM', label: 'Main Auditorium' },
  { value: 'SPORTS_COMPLEX', label: 'Sports Complex / Grounds' },
  { value: 'PARKING_A', label: 'Car Park A' },
  { value: 'PARKING_B', label: 'Car Park B' },
  { value: 'MAIN_GATE', label: 'Main Gate / Security Post' },
  { value: 'HOSTEL_ZONE', label: 'Student Accommodation / Hostel Zone' },
  { value: 'OPEN_LECTURE_AREA', label: 'Open Lecture / Courtyard Areas' },
  { value: 'LAB_COMPLEX', label: 'Laboratory Complex (Computing Labs)' },
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
  const [form, setForm] = useState({
    location: '',
    category: INCIDENT_CATEGORIES[0].value,
    contactName: '',
    contactNumber: '',
    description: '',
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!form.location || !form.category || !form.description.trim() || !form.contactName.trim() || !form.contactNumber.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!pin) {
      toast.error('Please tap the map to pin the exact incident location on campus');
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
      const locationLabel = SLIIT_LOCATIONS.find((l) => l.value === form.location)?.label ?? form.location;
      const categoryLabel = INCIDENT_CATEGORIES.find((c) => c.value === form.category)?.label ?? form.category;
      const created = await createTicket({
        location: locationLabel,
        category: categoryLabel,
        description: form.description.trim(),
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
              <h1 className="text-3xl font-bold text-slate-900">Report Incident</h1>
              <p className="text-sm text-slate-500 mt-1">
                Report a campus issue at SLIIT. Your ticket will be visible to incident operations staff.
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
                {SLIIT_LOCATIONS.map((l) => (
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
                Tap the map to drop a pin, or drag the pin to adjust. Centered on SLIIT Malabe.
              </p>
              <IncidentLocationMapPicker
                position={pin}
                onChange={(lat, lng) => setPin({ lat, lng })}
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
