import React, { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, Users, MapPin, Clock, ShieldCheck, AlignLeft,
  Upload, X, Save, ArrowLeft, Loader2, ImagePlus,
} from 'lucide-react';
import { createResource, uploadResourceImage } from '../../api/resourceApi';

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const schema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    type: z.string().min(1, 'Please select a type'),
    capacity: z.number().int().min(1, 'Capacity must be greater than 0'),
    location: z.string().min(3, 'Location must be at least 3 characters'),
    availableFrom: z.string().min(1, 'Available From is required'),
    availableTo: z.string().min(1, 'Available To is required'),
    status: z.enum(['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE']),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  })
  .refine((d) => d.availableTo > d.availableFrom, {
    message: 'Available To must be later than Available From',
    path: ['availableTo'],
  });

type FormValues = z.infer<typeof schema>;

// ─── Reusable Field Wrapper ────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, required, error, icon, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
      {icon && <span className="text-slate-400">{icon}</span>}
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
        <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
        {error}
      </p>
    )}
  </div>
);

// ─── Shared input styles ───────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
   focus:ring-2 focus:ring-blue-500 focus:border-blue-400
   ${hasError ? 'border-red-400 bg-red-50/40' : 'border-slate-300 bg-white hover:border-slate-400'}`;

// ─── Component ────────────────────────────────────────────────────────────────
export const AddResource: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: '',
      capacity: 0,
      location: '',
      availableFrom: '08:00',
      availableTo: '20:00',
      status: 'ACTIVE',
      description: '',
    },
  });

  const descValue = watch('description') ?? '';

  // ── Image handling ──────────────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    setImageError(null);
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setImageError('Only JPG and PNG files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be smaller than 5 MB.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (selectedFile) {
        const uploadToast = toast.loading('Uploading image…');
        try {
          imageUrl = await uploadResourceImage(selectedFile);
          toast.dismiss(uploadToast);
        } catch {
          toast.dismiss(uploadToast);
          toast.error('Image upload failed. Saving resource without image.');
        }
      }

      await createResource({
        name: data.name,
        description: data.description,
        type: data.type,
        capacity: data.capacity,
        location: data.location,
        availableFrom: data.availableFrom,
        availableTo: data.availableTo,
        status: data.status,
        imageUrl,
      });

      toast.success('Resource created successfully!');
      navigate('/app/facilities/resources/manage');
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to create resource. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = () => toast.error('Please fix the highlighted fields.');

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-fade-in-up">

      {/* Page Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Add New Resource</h2>
        <p className="text-slate-500 mt-1 text-sm">Register a new facility or asset into the campus portfolio.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT PANEL: Details ──────────────────────────────────────────── */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-7 space-y-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
              Resource Details
            </h3>

            {/* Resource Name */}
            <Field label="Resource Name" required error={errors.name?.message} icon={<Building2 size={14} />}>
              <input
                {...register('name')}
                type="text"
                className={inputCls(!!errors.name)}
                placeholder="e.g. Main Auditorium"
                autoFocus
              />
            </Field>

            {/* Type + Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Facility Type" required error={errors.type?.message} icon={<Building2 size={14} />}>
                <select {...register('type')} className={inputCls(!!errors.type)}>
                  <option value="">— Select type —</option>
                  <option value="Hall">Lecture Hall</option>
                  <option value="Lab">Laboratory</option>
                  <option value="Library">Library</option>
                  <option value="Sports">Sports Facility</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Capacity (Persons)" required error={errors.capacity?.message} icon={<Users size={14} />}>
                <input
                  {...register('capacity')}
                  type="number"
                  min={1}
                  className={inputCls(!!errors.capacity)}
                  placeholder="e.g. 150"
                />
              </Field>
            </div>

            {/* Location */}
            <Field label="Location / Building" required error={errors.location?.message} icon={<MapPin size={14} />}>
              <input
                {...register('location')}
                type="text"
                className={inputCls(!!errors.location)}
                placeholder="e.g. Science Block, Room 101"
              />
            </Field>

            {/* Availability Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Available From" required error={errors.availableFrom?.message} icon={<Clock size={14} />}>
                <input
                  {...register('availableFrom')}
                  type="time"
                  className={inputCls(!!errors.availableFrom)}
                />
              </Field>

              <Field label="Available To" required error={errors.availableTo?.message} icon={<Clock size={14} />}>
                <input
                  {...register('availableTo')}
                  type="time"
                  className={inputCls(!!errors.availableTo)}
                />
              </Field>
            </div>

            {/* Status */}
            <Field label="Initial Status" required error={errors.status?.message} icon={<ShieldCheck size={14} />}>
              <select {...register('status')} className={inputCls(!!errors.status)}>
                <option value="ACTIVE">✅ Active — Ready for use</option>
                <option value="MAINTENANCE">🔧 Under Maintenance</option>
                <option value="OUT_OF_SERVICE">🚫 Out of Service</option>
              </select>
            </Field>

            {/* Description */}
            <Field label="Description" error={errors.description?.message} icon={<AlignLeft size={14} />}>
              <textarea
                {...register('description')}
                rows={4}
                className={`${inputCls(!!errors.description)} resize-none`}
                placeholder="Briefly describe this facility — features, rules, notes…"
              />
              <p className={`text-xs mt-1 text-right ${descValue.length > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                {descValue.length} / 500
              </p>
            </Field>
          </div>

          {/* ── RIGHT PANEL: Image + Actions ─────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Image Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-5">
                Resource Image
              </h3>

              {/* Drop Zone */}
              <div
                onClick={() => !imagePreview && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl overflow-hidden border-2 border-dashed transition-all duration-200 cursor-pointer
                  ${imagePreview ? 'border-slate-200 cursor-default' : 'hover:border-blue-400 hover:bg-blue-50/30'}
                  ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 bg-slate-50'}
                `}
                style={{ minHeight: '220px' }}
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-56 object-cover"
                    />
                    {/* Overlay info */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/70 to-transparent px-4 py-3">
                      <p className="text-white text-xs font-semibold truncate">{selectedFile?.name}</p>
                      <p className="text-slate-300 text-xs">{selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}</p>
                    </div>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearImage(); }}
                      className="absolute top-3 right-3 bg-slate-900/60 hover:bg-red-600 backdrop-blur-sm text-white p-1.5 rounded-full transition-colors shadow"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors
                      ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white border border-slate-200 text-slate-400 shadow-sm'}`}>
                      {isDragging ? <Upload size={26} /> : <ImagePlus size={26} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        {isDragging ? 'Drop it here!' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">PNG, JPG — max 5 MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={handleFileInput}
              />

              {imageError && (
                <p className="mt-2.5 text-xs font-medium text-red-500 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {imageError}
                </p>
              )}

              {!imagePreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 w-full py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                >
                  Browse Files
                </button>
              )}
            </div>

            {/* Tips card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-700 space-y-2">
              <p className="font-bold text-blue-800">📋 Quick Tips</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-blue-600">
                <li>Use landscape images for best display.</li>
                <li>Set status to <strong>Maintenance</strong> if unavailable.</li>
                <li>Capacity should reflect max safe occupancy.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Action Bar ─────────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={16} />
                Save Resource
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
