import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { addTicketComment, deleteTicket, deleteTicketComment, getTicketById, updateTicket, updateTicketComment } from '../../api/ticketApi';
import { Ticket } from '../../types/ticket';
import { PriorityBadge, StatusPill } from '../../components/incidents/TicketVisuals';
import { formatDuration, getSlaState, getTicketAgeMs } from '../../utils/ticketUx';

export const IncidentTicketDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTicket, setEditingTicket] = useState(false);
  const [savingTicket, setSavingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    location: '',
    category: '',
    description: '',
    contactName: '',
    contactNumber: '',
  });
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
    if (!ticket) return;
    setTicketForm({
      location: ticket.location ?? '',
      category: ticket.category ?? '',
      description: ticket.description ?? '',
      contactName: ticket.contactName ?? '',
      contactNumber: ticket.contactNumber ?? '',
    });
  }, [ticket]);

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

  const isOwner = !!user?.id && !!ticket && Number(user.id) === ticket.reporterUserId;

  const onSaveTicket = async () => {
    if (!ticket || !user?.id) return;
    const payload = {
      location: ticketForm.location.trim(),
      category: ticketForm.category.trim(),
      description: ticketForm.description.trim(),
      contactName: ticketForm.contactName.trim(),
      contactNumber: ticketForm.contactNumber.trim(),
      actorUserId: Number(user.id),
      actorRole: user.role,
    };
    if (!payload.location || !payload.category || !payload.description) {
      toast.error('Location, category and description are required');
      return;
    }

    setSavingTicket(true);
    try {
      await updateTicket(ticket.id, payload);
      setEditingTicket(false);
      toast.success('Ticket updated');
      load();
    } catch (error: any) {
      const backendError = error?.response?.data?.error;
      toast.error(typeof backendError === 'string' ? backendError : 'Failed to update ticket');
    } finally {
      setSavingTicket(false);
    }
  };

  const onDeleteTicket = async () => {
    if (!ticket || !user?.id) return;
    const confirmed = window.confirm('Delete this ticket permanently? This cannot be undone.');
    if (!confirmed) return;
    try {
      await deleteTicket(ticket.id, { actorUserId: Number(user.id) });
      toast.success('Ticket deleted');
      navigate('/app/user/incidents');
    } catch (error: any) {
      const backendError = error?.response?.data?.error;
      toast.error(typeof backendError === 'string' ? backendError : 'Failed to delete ticket');
    }
  };

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  if (error) return <div className="p-8 text-sm text-rose-600">{error}</div>;
  if (!ticket) return <div className="p-8 text-sm text-slate-500">Ticket not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-indigo-50 to-sky-50 px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-3xl border border-indigo-100 bg-white/95 p-6 sm:p-7 shadow-md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 font-semibold">TKT-{ticket.id}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{ticket.category} Incident</h1>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
          {isOwner && (
            <div className="mt-4 flex flex-wrap gap-2">
              {!editingTicket ? (
                <>
                  <button
                    onClick={() => setEditingTicket(true)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Edit Ticket
                  </button>
                  <button
                    onClick={onDeleteTicket}
                    className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Delete Ticket
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onSaveTicket}
                    disabled={savingTicket}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingTicket ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingTicket(false)}
                    disabled={savingTicket}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
          <div className="mt-4 text-xs flex items-center justify-between">
            <span className="text-slate-500">Ticket Age: {formatDuration(getTicketAgeMs(ticket))}</span>
            <span className={`font-semibold ${getSlaState(ticket) === 'breached' ? 'text-rose-600' : getSlaState(ticket) === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
              SLA {getSlaState(ticket) === 'breached' ? 'Breached' : getSlaState(ticket) === 'warning' ? 'At Risk' : 'On Track'}
            </span>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-sm font-medium text-slate-900 mb-1">Description</p>
            {editingTicket ? (
              <textarea
                value={ticketForm.description}
                onChange={(e) => setTicketForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={4}
              />
            ) : (
              <p className="text-slate-700 text-sm leading-relaxed">{ticket.description}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-sm">
            <Info
              label="Campus location"
              value={ticket.location}
              editable={editingTicket}
              inputValue={ticketForm.location}
              onInputChange={(value) => setTicketForm((prev) => ({ ...prev, location: value }))}
            />
            <Info
              label="Category"
              value={ticket.category}
              editable={editingTicket}
              inputValue={ticketForm.category}
              onInputChange={(value) => setTicketForm((prev) => ({ ...prev, category: value }))}
            />
            <Info
              label="Contact name"
              value={ticket.contactName || '—'}
              editable={editingTicket}
              inputValue={ticketForm.contactName}
              onInputChange={(value) => setTicketForm((prev) => ({ ...prev, contactName: value }))}
            />
            <Info
              label="Contact number"
              value={ticket.contactNumber || '—'}
              editable={editingTicket}
              inputValue={ticketForm.contactNumber}
              onInputChange={(value) => setTicketForm((prev) => ({ ...prev, contactNumber: value }))}
            />
            <Info label="Assigned staff" value={ticket.assignedStaffProfile?.fullName || (ticket.assignedStaffId ? `User #${ticket.assignedStaffId}` : 'Unassigned')} />
            <Info label="Created" value={new Date(ticket.createdAt).toLocaleString()} />
            {ticket.pinLatitude != null && ticket.pinLongitude != null ? (
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Pinned map location</p>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${ticket.pinLatitude}&mlon=${ticket.pinLongitude}&zoom=18`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                >
                  Open pin on map ({ticket.pinLatitude.toFixed(5)}, {ticket.pinLongitude.toFixed(5)})
                </a>
              </div>
            ) : null}
          </div>
          {ticket.assignedStaffProfile && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Assigned Technician</p>
                  <h3 className="text-lg font-semibold text-slate-900 mt-1">{ticket.assignedStaffProfile.fullName}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {ticket.assignedStaffProfile.qualification} · {ticket.assignedStaffProfile.yearsOfExperience} years experience
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/80 border border-emerald-200 text-emerald-700">
                  Staff ID: {ticket.assignedStaffProfile.userId}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfilePill label="Contact Number" value={ticket.assignedStaffProfile.contactNumber} />
                <ProfilePill label="Age" value={`${ticket.assignedStaffProfile.age}`} />
                <ProfilePill label="Specialist Skills" value={ticket.assignedStaffProfile.specialistSkills} />
                <ProfilePill label="Supported Categories" value={ticket.assignedStaffProfile.supportedCategories} />
              </div>
            </div>
          )}
          {!!ticket.resolutionNotes && <InfoBlock label="Resolution Notes" value={ticket.resolutionNotes} />}
          {!!ticket.rejectionReason && <InfoBlock label="Rejection Reason" value={ticket.rejectionReason} />}
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-white/95 p-6 sm:p-7 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">Activity Timeline</h2>
          <div className="mt-3 space-y-3">
            <TimelineEvent title="Ticket Created" time={ticket.createdAt} />
            <TimelineEvent title={`Status: ${ticket.status.replace('_', ' ')}`} time={ticket.updatedAt} />
            {(ticket.comments || []).map((c) => (
              <TimelineEvent key={c.id} title={`Comment by ${c.authorRole}`} time={c.createdAt} detail={c.content} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-white/95 p-6 sm:p-7 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">Attachments</h2>
          {!ticket.attachments?.length ? (
            <p className="text-sm text-slate-500 mt-2">No attachments.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              {ticket.attachments.map((a) => (
                <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 hover:shadow-sm transition">
                  <img src={a.fileUrl} alt={a.originalFileName} className="w-full h-32 object-cover" />
                  <p className="text-xs p-2 truncate text-slate-600">{a.originalFileName}</p>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-white/95 p-6 sm:p-7 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">Comments</h2>
          <div className="mt-3 space-y-3">
            {ticket.comments?.map((c) => (
              <div key={c.id} className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>{c.authorRole} · User #{c.authorUserId}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <textarea className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
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

const Info: React.FC<{
  label: string;
  value: string;
  editable?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
}> = ({ label, value, editable = false, inputValue = '', onInputChange }) => (
  <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    {editable && onInputChange ? (
      <input
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    ) : (
      <p className="text-sm text-slate-800 mt-1 font-medium">{value}</p>
    )}
  </div>
);

const InfoBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-slate-800 mt-1">{value}</p>
  </div>
);

const TimelineEvent: React.FC<{ title: string; time: string; detail?: string }> = ({ title, time, detail }) => (
  <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
    <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
    <div>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="text-xs text-slate-500">{new Date(time).toLocaleString()}</p>
      {detail && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{detail}</p>}
    </div>
  </div>
);

const ProfilePill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2.5">
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
  </div>
);
