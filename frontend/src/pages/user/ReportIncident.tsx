import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignTicket, createTicket, uploadTicketAttachments } from '../../api/ticketApi';
import { useAuth } from '../../contexts/AuthContext';
import { TicketPriority } from '../../types/ticket';
import toast from 'react-hot-toast';
import { AlertTriangle, Camera, CheckCircle2, Clock3, MapPin, ShieldAlert, UserCog } from 'lucide-react';

export const ReportIncident: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    location: '',
    category: 'ELECTRICAL',
    description: '',
    priority: 'MEDIUM' as TicketPriority,
    preferredContactDetails: '',
  });
  const [allocatedTech, setAllocatedTech] = useState<{ id: number; name: string; eta: string } | null>(null);

  const CATEGORY_OPTIONS = [
    { value: 'ELECTRICAL', label: 'Electrical Issues' },
    { value: 'PLUMBING', label: 'Plumbing & Water Leaks' },
    { value: 'IT_NETWORK', label: 'IT / Network' },
    { value: 'FURNITURE', label: 'Furniture & Fixtures' },
    { value: 'AV_EQUIPMENT', label: 'AV Equipment' },
    { value: 'CLEANING_HYGIENE', label: 'Cleaning & Hygiene' },
  ];

  const TECHNICIANS_BY_CATEGORY: Record<string, { id: number; name: string; eta: string }[]> = {
    ELECTRICAL: [
      { id: 201, name: 'Kasun Perera', eta: '25 min' },
      { id: 202, name: 'Nimal Jayasinghe', eta: '35 min' },
      { id: 203, name: 'Pradeep Fernando', eta: '40 min' },
      { id: 204, name: 'Ruwan Senanayake', eta: '30 min' },
      { id: 205, name: 'Sahan Wijekoon', eta: '45 min' },
    ],
    PLUMBING: [
      { id: 211, name: 'Sampath Gunasekara', eta: '30 min' },
      { id: 212, name: 'Chathura Madushan', eta: '35 min' },
      { id: 213, name: 'Ishara Lakmal', eta: '50 min' },
      { id: 214, name: 'Manoj Ranasinghe', eta: '40 min' },
      { id: 215, name: 'Nadeera Gamage', eta: '25 min' },
    ],
    IT_NETWORK: [
      { id: 221, name: 'Dilan Kularatne', eta: '20 min' },
      { id: 222, name: 'Chamath Silva', eta: '30 min' },
      { id: 223, name: 'Yohan Premaratne', eta: '25 min' },
      { id: 224, name: 'Ravindu Ekanayake', eta: '40 min' },
      { id: 225, name: 'Nuwantha Abeywickrama', eta: '35 min' },
    ],
    FURNITURE: [
      { id: 231, name: 'Tharindu Rajapaksha', eta: '45 min' },
      { id: 232, name: 'Malinda Weerasinghe', eta: '35 min' },
      { id: 233, name: 'Pasan Wijesinghe', eta: '40 min' },
      { id: 234, name: 'Dilshan Herath', eta: '50 min' },
      { id: 235, name: 'Lahiru Mendis', eta: '30 min' },
    ],
    AV_EQUIPMENT: [
      { id: 241, name: 'Udesh Bandara', eta: '25 min' },
      { id: 242, name: 'Sachintha Peiris', eta: '30 min' },
      { id: 243, name: 'Kavindu Jayawardena', eta: '45 min' },
      { id: 244, name: 'Minura Alwis', eta: '35 min' },
      { id: 245, name: 'Tharuka Karunaratne', eta: '40 min' },
    ],
    CLEANING_HYGIENE: [
      { id: 251, name: 'Gayantha Dissanayake', eta: '20 min' },
      { id: 252, name: 'Niroshan Mallawarachchi', eta: '25 min' },
      { id: 253, name: 'Harsha Jayalath', eta: '30 min' },
      { id: 254, name: 'Anjana Pathirana', eta: '35 min' },
      { id: 255, name: 'Sujeewa Nandasena', eta: '40 min' },
    ],
  };

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
    const techPool = TECHNICIANS_BY_CATEGORY[form.category] || [];
    if (!techPool.length) {
      setAllocatedTech(null);
      return;
    }
    const picked = techPool[Math.floor(Math.random() * techPool.length)];
    setAllocatedTech(picked);
  }, [form.category]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const qualityScore = useMemo(() => {
    let score = 0;
    if (form.location.trim().length >= 4) score += 20;
    if (form.description.trim().length >= 40) score += 40;
    if (form.preferredContactDetails.trim().length >= 6) score += 20;
    if (files.length > 0) score += 20;
    return score;
  }, [form, files]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!form.location || !form.category || !form.description || !form.preferredContactDetails) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.description.trim().length < 20) {
      toast.error('Please provide a more detailed description (at least 20 characters)');
      return;
    }
    try {
      setError(null);
      setSubmitting(true);
      const created = await createTicket({
        ...form,
        category: CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label || form.category,
        reporterUserId: Number(user.id),
      });
      if (allocatedTech) {
        try {
          await assignTicket(created.id, allocatedTech.id);
        } catch {
          // Keep the ticket creation successful even if dummy assignee IDs do not exist in DB.
          toast('Ticket created, but technician assignment requires matching backend users.');
        }
      }
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
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl border border-indigo-100 bg-white/95 p-6 sm:p-8 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Report Incident</h1>
              <p className="text-sm text-slate-500 mt-1">Submit a complete request with category-based technician auto-allocation.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-2 text-xs font-semibold border border-blue-100">
              <ShieldAlert size={14} />
              Service Desk Enabled
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
            <form onSubmit={submit} className="xl:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Resource / Location" required icon={<MapPin size={14} />}>
                  <input className={inputClass} placeholder="e.g., Computer Lab B, 3rd Floor" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </Field>
                <Field label="Priority" required icon={<AlertTriangle size={14} />}>
                  <select className={inputClass} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}>
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Incident Category" required icon={<UserCog size={14} />}>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Description" required>
                <textarea
                  rows={6}
                  className={inputClass}
                  placeholder="Describe what happened, where it happened, and current impact..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <p className="text-[11px] text-slate-500 mt-1">Tip: include room number, observed issue, and urgency reason.</p>
              </Field>

              <Field label="Preferred Contact Details" required>
                <input className={inputClass} placeholder="Phone / email / preferred time window" value={form.preferredContactDetails} onChange={(e) => setForm((f) => ({ ...f, preferredContactDetails: e.target.value }))} />
              </Field>

              <Field label="Attachments (max 3)" icon={<Camera size={14} />}>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => onFileChange(e.target.files)} />
                  <p className="text-xs text-slate-500 mt-2">PNG/JPG/WEBP only. Max 3 images.</p>
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
                <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Auto Allocation</p>
                {allocatedTech ? (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-slate-900">{allocatedTech.name}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Category: {CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label}
                    </p>
                    <p className="text-xs text-slate-600 inline-flex items-center gap-1 mt-1">
                      <Clock3 size={12} />
                      ETA: {allocatedTech.eta}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">No technician mapped.</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Submission Quality</p>
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${qualityScore}%`,
                        background: qualityScore >= 80 ? '#16a34a' : qualityScore >= 50 ? '#d97706' : '#dc2626',
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{qualityScore}% complete</p>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <li className="inline-flex items-center gap-1"><CheckCircle2 size={12} className={form.location ? 'text-emerald-600' : 'text-slate-400'} /> Location provided</li>
                  <li className="inline-flex items-center gap-1"><CheckCircle2 size={12} className={form.description.length >= 20 ? 'text-emerald-600' : 'text-slate-400'} /> Sufficient description</li>
                  <li className="inline-flex items-center gap-1"><CheckCircle2 size={12} className={form.preferredContactDetails ? 'text-emerald-600' : 'text-slate-400'} /> Contact details filled</li>
                  <li className="inline-flex items-center gap-1"><CheckCircle2 size={12} className={files.length ? 'text-emerald-600' : 'text-slate-400'} /> Attachment added</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode; required?: boolean; icon?: React.ReactNode }> = ({ label, children, required, icon }) => (
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
