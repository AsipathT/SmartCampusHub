import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { addTicketComment, assignTicket, getTicketById, listAssignableStaff, updateTicket } from '../../api/ticketApi';
import { IncidentAssigneeOption, Ticket, TicketPriority, TicketStatus } from '../../types/ticket';
import { PriorityBadge, StatusPill } from '../../components/incidents/TicketVisuals';
import { formatDuration, getSlaState, getTicketAgeMs } from '../../utils/ticketUx';
import {
  Activity,
  ArrowLeft,
  Award,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileImage,
  FileText,
  Hash,
  Loader2,
  MapPin,
  MessageCircle,
  Paperclip,
  Phone,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  User2,
  Users2,
  XCircle,
} from 'lucide-react';

export const AdminTicketDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [assignId, setAssignId] = useState<string>('');
  const [assigneeOptions, setAssigneeOptions] = useState<IncidentAssigneeOption[]>([]);
  const [status, setStatus] = useState<TicketStatus>('OPEN');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id || !user?.id) return;
    setLoading(true);
    setError(null);
    getTicketById(Number(id), Number(user.id))
      .then((t) => {
        setTicket(t);
        setAssignId(t.assignedStaffId ? String(t.assignedStaffId) : '');
        setStatus(t.status);
        setPriority(t.priority);
        setResolutionNotes(t.resolutionNotes || '');
        setRejectionReason(t.rejectionReason || '');
        listAssignableStaff(t.category)
          .then(setAssigneeOptions)
          .catch(() => setAssigneeOptions([]));
      })
      .catch(() => {
        setError('Failed to load ticket details.');
        toast.error('Failed to load ticket');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id, user?.id]);

  const onSaveOps = async () => {
    if (!ticket) return;
    if (!user?.id || user.role !== 'ADMIN') {
      toast.error('Only admins can update status and priority');
      return;
    }
    const normalizedAssignId = assignId.trim();
    const hasAssigneeInput = normalizedAssignId.length > 0;
    if (hasAssigneeInput && !/^\d+$/.test(normalizedAssignId)) {
      toast.error('Please select a valid assignee');
      return;
    }
    const nextAssignedStaffId = hasAssigneeInput ? Number(normalizedAssignId) : null;
    if (nextAssignedStaffId !== null && nextAssignedStaffId <= 0) {
      toast.error('Please select a valid assignee');
      return;
    }

    try {
      setSaving(true);
      await updateTicket(ticket.id, {
        status,
        priority,
        resolutionNotes,
        rejectionReason,
        actorUserId: Number(user.id),
        actorRole: user.role,
      });
      if (nextAssignedStaffId !== null && nextAssignedStaffId !== ticket.assignedStaffId) {
        if (!user?.id) {
          toast.error('Unable to identify admin user');
          return;
        }
        await assignTicket(ticket.id, {
          assignedStaffId: nextAssignedStaffId,
          actorUserId: Number(user.id),
          actorRole: user.role,
        });
      }
      toast.success('Ticket updated');
      load();
    } catch (error: any) {
      const backendError = error?.response?.data?.error;
      const validationError =
        !backendError && error?.response?.data && typeof error.response.data === 'object'
          ? Object.values(error.response.data)[0]
          : null;
      toast.error(
        typeof backendError === 'string'
          ? backendError
          : typeof validationError === 'string'
            ? validationError
            : 'Failed to update ticket'
      );
    } finally {
      setSaving(false);
    }
  };

  const onAddComment = async () => {
    if (!ticket || !user?.id || !comment.trim()) return;
    try {
      await addTicketComment(ticket.id, {
        authorUserId: Number(user.id),
        authorRole: user.role,
        content: comment.trim(),
      });
      setComment('');
      load();
    } catch (error: any) {
      const backendError = error?.response?.data?.error;
      const validationError =
        !backendError && error?.response?.data && typeof error.response.data === 'object'
          ? Object.values(error.response.data)[0]
          : null;
      toast.error(
        typeof backendError === 'string'
          ? backendError
          : typeof validationError === 'string'
            ? validationError
            : 'Failed to add comment'
      );
    }
  };

  const selectedAssignee = useMemo(
    () => assigneeOptions.find((option) => String(option.userId) === assignId),
    [assigneeOptions, assignId]
  );
  const isAdmin = user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 max-w-md text-center">
          <ShieldAlert className="text-rose-500 mx-auto mb-3" size={28} />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Link to="/app/admin/incidents/manage" className="text-sm text-indigo-600 hover:underline mt-3 inline-block">
            Back to tickets
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center">
        <p className="text-sm text-slate-500">Ticket not found.</p>
      </div>
    );
  }

  const sla = getSlaState(ticket);
  const age = formatDuration(getTicketAgeMs(ticket));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Breadcrumb ── */}
        <div className="animate-card-enter">
          <Link
            to="/app/admin/incidents/manage"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Manage Incident Tickets
          </Link>
        </div>

        {/* ── Hero + Operations (unified) ── */}
        <div className="relative z-20 rounded-3xl border border-slate-200/60 bg-white/95 shadow-sm animate-card-enter" style={{ animationDelay: '40ms' }}>

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 sm:gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 ring-1 ring-slate-200">
                    <Hash size={11} />
                    TKT-{ticket.id}
                  </span>
                  <StatusPill status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 leading-tight text-slate-900 break-words">
                  {ticket.category}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} />
                    Reported {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} />
                    Age {age}
                  </span>
                </div>
              </div>
              <div className="self-start xl:self-center">
                <SlaIndicator sla={sla} />
              </div>
            </div>

            {/* ── Inline operations row ── */}
            <div className="mt-6 rounded-2xl bg-slate-50/70 border border-slate-200/70 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <Sparkles size={14} className="text-indigo-500" />
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Manage Incident
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-5 items-end">
                <div className="lg:col-span-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                    <Clock size={13} className="text-slate-400" />
                    Status
                  </label>
                  <StatusSelect value={status} onChange={setStatus} disabled={!isAdmin} />
                </div>

                <div className="lg:col-span-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                    <Award size={13} className="text-slate-400" />
                    Priority
                  </label>
                  <PrioritySelect value={priority} onChange={setPriority} disabled={!isAdmin} />
                </div>

                <div className="lg:col-span-4">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                    <Users2 size={13} className="text-slate-400" />
                    Assign technician
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({assigneeOptions.length} available for this category)
                    </span>
                  </label>
                  <TechnicianCombobox
                    value={assignId}
                    options={assigneeOptions}
                    disabled={!isAdmin}
                    onChange={setAssignId}
                  />
                </div>

              </div>
              <div className="mt-4 sm:mt-5 flex justify-start">
                <button
                  onClick={onSaveOps}
                  disabled={saving || !isAdmin}
                  className="min-w-[140px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200/60 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save
                    </>
                  )}
                </button>
              </div>
              {!isAdmin && (
                <p className="text-xs text-rose-600 mt-3">
                  Only admins can update status, priority, or technician assignment.
                </p>
              )}

              {/* ── Conditional note fields ── */}
              {status === 'RESOLVED' && (
                <div className="mt-5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    Resolution notes
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Summarize what was done to resolve the incident..."
                    className="w-full bg-emerald-50/40 border border-emerald-100 rounded-xl p-3.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all resize-none"
                  />
                </div>
              )}

              {status === 'REJECTED' && (
                <div className="mt-5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                    <XCircle size={13} className="text-rose-500" />
                    Rejection reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this ticket is being rejected..."
                    className="w-full bg-rose-50/40 border border-rose-100 rounded-xl p-3.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all resize-none"
                  />
                </div>
              )}

              {/* ── Assignee profile card ── */}
              {selectedAssignee && (
                <div className="mt-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 border border-indigo-100 p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={selectedAssignee.fullName} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 truncate">{selectedAssignee.fullName}</h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-100 text-indigo-700 rounded-md px-2 py-0.5">
                          <Award size={11} />
                          {selectedAssignee.yearsOfExperience} yrs exp
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/70 text-slate-600 rounded-md px-2 py-0.5 ring-1 ring-slate-200/70">
                          Age {selectedAssignee.age}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 inline-flex items-center gap-1.5">
                        <Briefcase size={12} className="text-slate-400" />
                        {selectedAssignee.qualification}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <ProfileField icon={<Sparkles size={13} />} label="Specialist skills" value={selectedAssignee.specialistSkills} />
                        <ProfileField icon={<ShieldAlert size={13} />} label="Supported categories" value={selectedAssignee.supportedCategories} />
                        <ProfileField icon={<Phone size={13} />} label="Contact" value={selectedAssignee.contactNumber} />
                        <ProfileField icon={<Hash size={13} />} label="Staff ID" value={`#${selectedAssignee.userId}`} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Description + Details ── */}
        <section
          className="relative z-0 bg-white/95 backdrop-blur-sm border border-slate-200/70 rounded-3xl shadow-sm overflow-hidden animate-card-enter"
          style={{ animationDelay: '100ms' }}
        >
          {/* Header */}
          <header className="relative px-6 sm:px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Incident Report</h2>
                  <p className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1.5">
                    <MapPin size={11} className="text-slate-400" />
                    {ticket.location}
                    <span className="text-slate-300">·</span>
                    Reported by User #{ticket.reporterUserId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {ticket.attachmentCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-100 rounded-full px-2.5 py-1">
                    <Paperclip size={11} />
                    {ticket.attachmentCount} attached
                  </span>
                )}
                {ticket.commentCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-100 rounded-full px-2.5 py-1">
                    <MessageCircle size={11} />
                    {ticket.commentCount} comments
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="p-6 sm:p-7 space-y-7">
            {/* Description block */}
            <div className="relative rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/70 p-5 sm:p-6">
              <span
                aria-hidden
                className="absolute -top-0.5 left-4 text-6xl leading-none text-indigo-200/70 font-serif select-none pointer-events-none"
              >
                “
              </span>
              <p className="relative pl-7 sm:pl-8 pr-2 text-[15px] leading-relaxed text-slate-700 whitespace-pre-line">
                {ticket.description}
              </p>
            </div>

            {/* Section heading */}
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Key Information
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <DetailItem tone="indigo" icon={<MapPin size={16} />} label="Campus location" value={ticket.location} />
              <DetailItem tone="slate" icon={<User2 size={16} />} label="Reporter" value={`User #${ticket.reporterUserId}`} />
              <DetailItem tone="violet" icon={<User2 size={16} />} label="Contact name" value={ticket.contactName || '—'} />
              <DetailItem tone="emerald" icon={<Phone size={16} />} label="Contact number" value={ticket.contactNumber || '—'} />
              <DetailItem
                tone="sky"
                icon={<Users2 size={16} />}
                label="Currently assigned"
                value={ticket.assignedStaffId ? `Staff #${ticket.assignedStaffId}` : 'Unassigned'}
              />
              <DetailItem
                tone="amber"
                icon={<Calendar size={16} />}
                label="Created"
                value={new Date(ticket.createdAt).toLocaleString()}
              />
            </div>

            {/* Pinned location callout */}
            {ticket.pinLatitude != null && ticket.pinLongitude != null && (
              <div className="relative rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-sky-50/60 p-4 sm:p-5 flex items-center gap-4 flex-wrap">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white text-indigo-600 ring-1 ring-indigo-100 shadow-sm shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-indigo-500">Pinned location</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 font-mono">
                    {ticket.pinLatitude.toFixed(5)}, {ticket.pinLongitude.toFixed(5)}
                  </p>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${ticket.pinLatitude}&mlon=${ticket.pinLongitude}&zoom=18`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-semibold px-3.5 py-2 rounded-xl ring-1 ring-indigo-200 shadow-sm transition-colors"
                >
                  <ExternalLink size={13} />
                  Open on map
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── Timeline + Attachments ── */}
        <div className="relative z-0 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 sm:p-7 shadow-sm animate-card-enter" style={{ animationDelay: '140ms' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-50 text-violet-600">
                <Activity size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Activity Timeline</h2>
            </div>
            <div className="relative ml-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-300 via-slate-200 to-transparent" />
              <div className="space-y-5">
                <TimelineEvent title="Ticket Created" time={ticket.createdAt} dotColor="bg-indigo-500" />
                <TimelineEvent
                  title={`Status: ${ticket.status.replace('_', ' ')}`}
                  time={ticket.updatedAt}
                  dotColor="bg-blue-500"
                />
                {(ticket.comments || []).map((c) => (
                  <TimelineEvent
                    key={c.id}
                    title={`Comment by ${c.authorRole}`}
                    time={c.createdAt}
                    detail={c.content}
                    dotColor="bg-violet-500"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-5 sm:p-5 shadow-sm animate-card-enter" style={{ animationDelay: '160ms' }}>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="flex items-center justify-center w-8.5 h-8.5 rounded-lg bg-amber-50 text-amber-600">
                <Paperclip size={16} />
              </div>
              <h2 className="text-[17px] font-bold text-slate-900">Attachments</h2>
              {ticket.attachments?.length ? (
                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {ticket.attachments.length}
                </span>
              ) : null}
            </div>
            {!ticket.attachments?.length ? (
              <div className="text-center py-5">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mb-2">
                  <FileImage size={18} />
                </div>
                <p className="text-xs text-slate-500">No attachments uploaded</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {ticket.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block border border-slate-200/70 rounded-xl overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all bg-white"
                  >
                    <img src={a.fileUrl} alt={a.originalFileName} className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                      <ExternalLink size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                    <div className="p-2.5 border-t border-slate-100">
                      <p className="text-xs truncate text-slate-700 font-medium">{a.originalFileName}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Comments ── */}
        <div className="relative z-0 bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 sm:p-7 shadow-sm animate-card-enter" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600">
              <MessageCircle size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Comments</h2>
            {ticket.comments?.length ? (
              <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {ticket.comments.length}
              </span>
            ) : null}
          </div>

          {ticket.comments?.length ? (
            <div className="space-y-3 mb-5">
              {ticket.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-xs font-bold ring-2 ring-white shadow-sm ${
                    c.authorRole === 'ADMIN'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {c.authorRole === 'ADMIN' ? 'A' : 'U'}
                  </div>
                  <div className="flex-1 bg-slate-50/80 border border-slate-200/50 rounded-2xl p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">{c.authorRole}</span>
                      <span className="text-[10px] text-slate-400">User #{c.authorUserId}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-5">No comments yet. Start the conversation below.</p>
          )}

          <div className="border-t border-slate-100 pt-4">
            <textarea
              rows={3}
              placeholder="Write a comment..."
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              onClick={onAddComment}
              disabled={!comment.trim()}
              className="mt-3 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200/50 transition-all"
            >
              <Send size={14} />
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusSelect: React.FC<{ value: TicketStatus; onChange: (s: TicketStatus) => void; disabled?: boolean }> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const options: { value: TicketStatus; label: string }[] = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'REJECTED', label: 'Rejected' },
  ];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TicketStatus)}
        disabled={disabled}
        className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
};

const PrioritySelect: React.FC<{ value: TicketPriority; onChange: (p: TicketPriority) => void; disabled?: boolean }> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const options: { value: TicketPriority; label: string }[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
  ];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TicketPriority)}
        disabled={disabled}
        className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
};

const TechnicianCombobox: React.FC<{
  value: string;
  options: IncidentAssigneeOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}> = ({ value, options, disabled = false, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => options.find((option) => String(option.userId) === value) || null,
    [options, value]
  );

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((o) => !o);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center gap-3 bg-slate-50/80 border rounded-xl pl-2 pr-10 py-2 text-sm text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          open ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selected ? (
          <>
            <MiniAvatar name={selected.fullName} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate text-slate-900 font-semibold">{selected.fullName}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-md px-1.5 py-0.5 shrink-0">
                  <Award size={10} />
                  {selected.yearsOfExperience}y
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{selected.qualification}</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-slate-400 border border-slate-200 shrink-0">
              <Users2 size={15} />
            </div>
            <span className="flex-1 text-slate-500">Select technician...</span>
          </>
        )}
        <ChevronDown
          size={15}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-[80] mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 overflow-hidden animate-card-enter">
          <div className="max-h-80 overflow-y-auto py-1.5">
            {value && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-rose-600 px-3 py-2 transition-colors"
              >
                <XCircle size={13} />
                Clear selection
              </button>
            )}
            {options.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mb-2">
                  <Users2 size={16} />
                </div>
                <p className="text-xs text-slate-500">No technicians available</p>
              </div>
            ) : (
              options.map((option) => {
                const isSelected = String(option.userId) === value;
                return (
                  <button
                    key={option.userId}
                    type="button"
                    onClick={() => handleSelect(String(option.userId))}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <MiniAvatar name={option.fullName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 truncate">{option.fullName}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-md px-1.5 py-0.5">
                          <Award size={10} />
                          {option.yearsOfExperience}y exp
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-md px-1.5 py-0.5">
                          Age {option.age}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 inline-flex items-center gap-1">
                        <Briefcase size={11} className="text-slate-400" />
                        <span className="truncate">{option.qualification}</span>
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 flex-wrap text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Sparkles size={10} className="text-indigo-400" />
                          <span className="truncate max-w-[220px]">{option.specialistSkills}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone size={10} className="text-slate-400" />
                          {option.contactNumber}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white shrink-0 mt-1">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>{options.length} technicians</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-semibold">Esc</kbd>
              to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const MiniAvatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-[11px] shrink-0 shadow-sm ring-2 ring-white">
      {initials || '?'}
    </div>
  );
};

const SlaIndicator: React.FC<{ sla: 'ok' | 'warning' | 'breached' }> = ({ sla }) => {
  const cfg = {
    ok:       { bg: 'bg-emerald-50 ring-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'SLA On Track' },
    warning:  { bg: 'bg-amber-50 ring-amber-200',     text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'SLA At Risk' },
    breached: { bg: 'bg-rose-50 ring-rose-200',       text: 'text-rose-700',    dot: 'bg-rose-500',    label: 'SLA Breached' },
  }[sla];
  return (
    <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ring-1 ${cfg.bg}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
};

const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('');
  return (
    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-sm shrink-0 shadow-md shadow-indigo-200/60 ring-2 ring-white">
      {initials || '?'}
    </div>
  );
};

const ProfileField: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl bg-white/70 border border-white/80 ring-1 ring-indigo-100/50 p-2.5">
    <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 inline-flex items-center gap-1">
      <span className="text-indigo-500">{icon}</span>
      {label}
    </p>
    <p className="text-xs text-slate-800 mt-0.5 font-medium leading-snug">{value}</p>
  </div>
);

type DetailTone = 'slate' | 'indigo' | 'emerald' | 'violet' | 'sky' | 'amber' | 'rose';

const toneMap: Record<DetailTone, { iconBg: string; iconText: string; ring: string; hover: string }> = {
  slate:   { iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   ring: 'ring-slate-200',   hover: 'hover:border-slate-300' },
  indigo:  { iconBg: 'bg-indigo-50',   iconText: 'text-indigo-600',  ring: 'ring-indigo-100',  hover: 'hover:border-indigo-200' },
  emerald: { iconBg: 'bg-emerald-50',  iconText: 'text-emerald-600', ring: 'ring-emerald-100', hover: 'hover:border-emerald-200' },
  violet:  { iconBg: 'bg-violet-50',   iconText: 'text-violet-600',  ring: 'ring-violet-100',  hover: 'hover:border-violet-200' },
  sky:     { iconBg: 'bg-sky-50',      iconText: 'text-sky-600',     ring: 'ring-sky-100',     hover: 'hover:border-sky-200' },
  amber:   { iconBg: 'bg-amber-50',    iconText: 'text-amber-600',   ring: 'ring-amber-100',   hover: 'hover:border-amber-200' },
  rose:    { iconBg: 'bg-rose-50',     iconText: 'text-rose-600',    ring: 'ring-rose-100',    hover: 'hover:border-rose-200' },
};

const DetailItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: DetailTone;
}> = ({ icon, label, value, tone = 'slate' }) => {
  const t = toneMap[tone];
  return (
    <div className={`group relative flex items-start gap-3.5 bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm ${t.hover} hover:shadow-md transition-all`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${t.iconBg} ${t.iconText} ring-1 ${t.ring} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-1 break-words leading-snug">{value}</p>
      </div>
    </div>
  );
};

const TimelineEvent: React.FC<{ title: string; time: string; detail?: string; dotColor?: string }> = ({
  title,
  time,
  detail,
  dotColor = 'bg-blue-500',
}) => (
  <div className="relative flex gap-4 pl-2">
    <div className="relative z-10 mt-1.5">
      <span className={`block w-[15px] h-[15px] rounded-full border-[3px] border-white shadow-sm ${dotColor}`} />
    </div>
    <div className="pb-1">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{new Date(time).toLocaleString()}</p>
      {detail && (
        <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 border border-slate-100 rounded-lg p-2.5 line-clamp-2">
          {detail}
        </p>
      )}
    </div>
  </div>
);
