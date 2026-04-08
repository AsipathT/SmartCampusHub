import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { addTicketComment, assignTicket, getTicketById, updateTicket } from '../../api/ticketApi';
import { Ticket, TicketStatus } from '../../types/ticket';
import { PriorityBadge, StatusPill } from '../../components/incidents/TicketVisuals';
import { formatDuration, getSlaState, getTicketAgeMs } from '../../utils/ticketUx';

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

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading ticket...</div>;
  if (error) return <div className="p-8 text-sm text-rose-600">{error}</div>;
  if (!ticket) return <div className="p-8 text-sm text-slate-500">Ticket not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-sky-50 to-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">TKT-{ticket.id}</p>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">{ticket.category} Incident</h1>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
          <div className="mt-3 text-xs flex items-center justify-between">
            <span className="text-slate-500">Ticket Age: {formatDuration(getTicketAgeMs(ticket))}</span>
            <span className={`font-semibold ${getSlaState(ticket) === 'breached' ? 'text-rose-600' : getSlaState(ticket) === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
              SLA {getSlaState(ticket) === 'breached' ? 'Breached' : getSlaState(ticket) === 'warning' ? 'At Risk' : 'On Track'}
            </span>
          </div>
            <p className="text-sm text-slate-700 mt-4">{ticket.description}</p>
            <div className="mt-4 text-sm text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-3">
              <p><strong>Location:</strong> {ticket.location}</p>
              <p><strong>Reporter:</strong> User #{ticket.reporterUserId}</p>
              <p><strong>Assigned:</strong> {ticket.assignedStaffId ? `User #${ticket.assignedStaffId}` : 'Unassigned'}</p>
              <p><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-slate-900">Activity Timeline</h2>
            <div className="mt-3 space-y-3">
              <TimelineEvent title="Ticket Created" time={ticket.createdAt} />
              <TimelineEvent title={`Status: ${ticket.status.replace('_', ' ')}`} time={ticket.updatedAt} />
              {(ticket.comments || []).map((c) => (
                <TimelineEvent key={c.id} title={`Comment by ${c.authorRole}`} time={c.createdAt} detail={c.content} />
              ))}
            </div>
          </div>

          <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Attachments</h2>
            {!ticket.attachments?.length ? (
              <p className="text-sm text-slate-500 mt-2">No attachments.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                {ticket.attachments.map((a) => (
                  <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-xl overflow-hidden">
                    <img src={a.fileUrl} alt={a.originalFileName} className="w-full h-32 object-cover" />
                    <p className="text-xs p-2 truncate text-slate-600">{a.originalFileName}</p>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Comments</h2>
            <div className="mt-3 space-y-3">
              {ticket.comments?.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{c.authorRole} · User #{c.authorUserId}</p>
                  <p className="text-sm text-slate-800 mt-1">{c.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button onClick={onAddComment} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl">Add Comment</button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Operations</h2>
            <label className="block mt-3">
              <span className="text-xs font-medium text-slate-600">Assign Staff ID</span>
              <input value={assignId} onChange={(e) => setAssignId(e.target.value)} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </label>
            <label className="block mt-3">
              <span className="text-xs font-medium text-slate-600">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label className="block mt-3">
              <span className="text-xs font-medium text-slate-600">Resolution Notes</span>
              <textarea rows={3} value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </label>
            <label className="block mt-3">
              <span className="text-xs font-medium text-slate-600">Rejection Reason</span>
              <textarea rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </label>
            <button
              onClick={onSaveOps}
              disabled={saving}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineEvent: React.FC<{ title: string; time: string; detail?: string }> = ({ title, time, detail }) => (
  <div className="flex gap-3">
    <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
    <div>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="text-xs text-slate-500">{new Date(time).toLocaleString()}</p>
      {detail && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{detail}</p>}
    </div>
  </div>
);
