import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { addTicketComment, assignTicket, getTicketById, updateTicket } from '../../api/ticketApi';
import { Ticket, TicketStatus } from '../../types/ticket';
import { PriorityBadge, StatusPill } from '../../components/incidents/TicketVisuals';
import { formatDuration, getSlaState, getTicketAgeMs } from '../../utils/ticketUx';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  FileImage,
  Loader2,
  MapPin,
  MessageCircle,
  Paperclip,
  Save,
  Send,
  ShieldAlert,
  User2,
  Users2,
  Activity,
} from 'lucide-react';

export const AdminTicketDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [assignId, setAssignId] = useState('');
  const [status, setStatus] = useState<TicketStatus>('OPEN');
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
        setResolutionNotes(t.resolutionNotes || '');
        setRejectionReason(t.rejectionReason || '');
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
    try {
      setSaving(true);
      await updateTicket(ticket.id, {
        status,
        resolutionNotes,
        rejectionReason,
      });
      if (assignId && Number(assignId) !== ticket.assignedStaffId) {
        await assignTicket(ticket.id, Number(assignId));
      }
      toast.success('Ticket updated');
      load();
    } catch {
      toast.error('Failed to update ticket');
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
    } catch {
      toast.error('Failed to add comment');
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Breadcrumb ── */}
        <div className="mb-6 animate-card-enter">
          <Link
            to="/app/admin/incidents/manage"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Manage Tickets
          </Link>
        </div>

        {/* ── Title bar ── */}
        <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 shadow-sm mb-6 animate-card-enter" style={{ animationDelay: '40ms' }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-200/50">
                <ShieldAlert size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 tracking-wider">TKT-{ticket.id}</span>
                  <StatusPill status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">{ticket.category} Incident</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SlaIndicator sla={sla} age={formatDuration(getTicketAgeMs(ticket))} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* ── Details card ── */}
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-card-enter" style={{ animationDelay: '80ms' }}>
              <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={<MapPin size={15} />} label="Location" value={ticket.location} />
                <DetailItem icon={<User2 size={15} />} label="Reporter" value={`User #${ticket.reporterUserId}`} />
                <DetailItem icon={<Users2 size={15} />} label="Assigned" value={ticket.assignedStaffId ? `Staff #${ticket.assignedStaffId}` : 'Unassigned'} />
                <DetailItem icon={<Calendar size={15} />} label="Created" value={new Date(ticket.createdAt).toLocaleString()} />
              </div>
            </div>

            {/* ── Activity Timeline ── */}
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-card-enter" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-50 text-violet-600">
                  <Activity size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Activity Timeline</h2>
              </div>
              <div className="relative ml-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-300 via-slate-200 to-transparent" />
                <div className="space-y-5">
                  <TimelineEvent
                    title="Ticket Created"
                    time={ticket.createdAt}
                    dotColor="bg-indigo-500"
                  />
                  <TimelineEvent
                    title={`Status changed to ${ticket.status.replace('_', ' ')}`}
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

            {/* ── Attachments ── */}
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-card-enter" style={{ animationDelay: '160ms' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 text-amber-600">
                  <Paperclip size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Attachments</h2>
                {ticket.attachments?.length ? (
                  <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {ticket.attachments.length}
                  </span>
                ) : null}
              </div>
              {!ticket.attachments?.length ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mb-2">
                    <FileImage size={20} />
                  </div>
                  <p className="text-sm text-slate-500">No attachments uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ticket.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative block border border-slate-200/60 rounded-2xl overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all"
                    >
                      <img src={a.fileUrl} alt={a.originalFileName} className="w-full h-36 object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ExternalLink size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs truncate text-slate-600 font-medium">{a.originalFileName}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ── Comments section ── */}
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-sm animate-card-enter" style={{ animationDelay: '200ms' }}>
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
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-xs font-bold ${
                        c.authorRole === 'ADMIN'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.authorRole === 'ADMIN' ? 'A' : 'U'}
                      </div>
                      <div className="flex-1 bg-slate-50/80 border border-slate-200/50 rounded-xl p-3.5">
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

          {/* ── Right column: Operations panel ── */}
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden sticky top-8 animate-card-enter" style={{ animationDelay: '100ms' }}>
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm">
                    <ShieldAlert size={18} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Operations</h2>
                </div>
                <p className="text-xs text-indigo-200 mt-2">Manage ticket status and assignment</p>
              </div>

              <div className="p-5 space-y-4">
                <FieldGroup label="Assign Staff ID" icon={<Users2 size={14} />}>
                  <input
                    value={assignId}
                    onChange={(e) => setAssignId(e.target.value)}
                    placeholder="Enter staff ID..."
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  />
                </FieldGroup>

                <FieldGroup label="Status" icon={<Clock size={14} />}>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TicketStatus)}
                      className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer"
                    >
                      {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </FieldGroup>

                <FieldGroup label="Resolution Notes" icon={<MessageCircle size={14} />}>
                  <textarea
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add resolution details..."
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all resize-none"
                  />
                </FieldGroup>

                <FieldGroup label="Rejection Reason" icon={<ShieldAlert size={14} />}>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide reason if rejecting..."
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all resize-none"
                  />
                </FieldGroup>

                <button
                  onClick={onSaveOps}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-200/40 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SlaIndicator: React.FC<{ sla: 'ok' | 'warning' | 'breached'; age: string }> = ({ sla, age }) => {
  const cfg = {
    ok:       { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'SLA On Track' },
    warning:  { bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   label: 'SLA At Risk' },
    breached: { bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    label: 'SLA Breached' },
  }[sla];
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${cfg.bg}`}>
      <Clock size={16} className={cfg.text} />
      <div>
        <p className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</p>
        <p className="text-[11px] text-slate-500">Age: {age}</p>
      </div>
    </div>
  );
};

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-slate-500 border border-slate-200/50 shrink-0 mt-0.5">
      {icon}
    </div>
    <div>
      <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
    </div>
  </div>
);

const FieldGroup: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
    </div>
    {children}
  </div>
);

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
