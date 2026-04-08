import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { addTicketComment, deleteTicketComment, getTicketById, updateTicketComment } from '../../api/ticketApi';
import { Ticket } from '../../types/ticket';
import { PriorityBadge, StatusPill } from '../../components/incidents/TicketVisuals';
import { formatDuration, getSlaState, getTicketAgeMs } from '../../utils/ticketUx';

export const IncidentTicketDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id || !user?.id) return;
    setLoading(true);
    setError(null);
    getTicketById(Number(id), Number(user.id))
      .then(setTicket)
      .catch(() => {
        setError('Failed to load ticket details.');
        toast.error('Failed to load ticket');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id, user?.id]);

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

  const onSaveEdit = async () => {
    if (!ticket || !editingId || !user?.id || !editingText.trim()) return;
    try {
      await updateTicketComment(ticket.id, editingId, {
        actorUserId: Number(user.id),
        actorRole: user.role,
        content: editingText.trim(),
      });
      setEditingId(null);
      setEditingText('');
      load();
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const onDelete = async (commentId: number) => {
    if (!ticket || !user?.id) return;
    try {
      await deleteTicketComment(ticket.id, commentId, {
        actorUserId: Number(user.id),
        actorRole: user.role,
      });
      load();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  if (error) return <div className="p-8 text-sm text-rose-600">{error}</div>;
  if (!ticket) return <div className="p-8 text-sm text-slate-500">Ticket not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-sky-50 to-slate-50 px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 font-semibold">TKT-{ticket.id}</p>
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
          <p className="text-slate-700 mt-4">{ticket.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
            <Info label="Location" value={ticket.location} />
            <Info label="Preferred Contact" value={ticket.preferredContactDetails} />
            <Info label="Assigned Staff" value={ticket.assignedStaffId ? `User #${ticket.assignedStaffId}` : 'Unassigned'} />
            <Info label="Created" value={new Date(ticket.createdAt).toLocaleString()} />
          </div>
          {!!ticket.resolutionNotes && <InfoBlock label="Resolution Notes" value={ticket.resolutionNotes} />}
          {!!ticket.rejectionReason && <InfoBlock label="Rejection Reason" value={ticket.rejectionReason} />}
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
                <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
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
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>{c.authorRole} · User #{c.authorUserId}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={onSaveEdit} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700">{c.content}</p>
                )}
                {c.owner && editingId !== c.id && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setEditingText(c.content);
                      }}
                      className="text-xs text-blue-600"
                    >
                      Edit
                    </button>
                    <button onClick={() => onDelete(c.id)} className="text-xs text-rose-600">Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
              rows={3}
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button onClick={onAddComment} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl">
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-slate-800 mt-1">{value}</p>
  </div>
);

const InfoBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-slate-800 mt-1">{value}</p>
  </div>
);

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
