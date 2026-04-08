import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, markAllAsRead, markAsReadForUser } from '../../api/notificationApi';

export const AdminNotifications: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('ALL');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    getNotifications(user.id, type === 'ALL' ? undefined : type)
      .then(setItems)
      .catch(() => {
        setError('Could not load notifications.');
        toast.error('Failed to load notifications');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user?.id, type]);

  const unread = useMemo(() => items.filter((x) => !x.read).length, [items]);

  const markOne = async (id: number) => {
    if (!user?.id) return;
    try {
      await markAsReadForUser(id, user.id);
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, read: true } : p)));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAll = async () => {
    if (!user?.id) return;
    try {
      await markAllAsRead(user.id);
      setItems((prev) => prev.map((p) => ({ ...p, read: true })));
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-indigo-50 to-slate-50 px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Notifications</h1>
            <p className="text-sm text-slate-500 mt-1">Incident and booking updates for operations.</p>
          </div>
          <button onClick={markAll} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl">
            Mark all as read
          </button>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white border border-indigo-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <p className="text-sm text-indigo-100">Unread</p>
          <p className="text-2xl font-bold text-white">{unread}</p>
        </div>

        <div className="bg-white border border-indigo-100 rounded-2xl p-3 shadow-sm">
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
            <option value="ALL">All Types</option>
            <option value="BOOKING_APPROVED">Booking Approved</option>
            <option value="BOOKING_REJECTED">Booking Rejected</option>
            <option value="TICKET_STATUS_CHANGED">Ticket Status Changed</option>
            <option value="TICKET_NEW_COMMENT">Ticket New Comment</option>
          </select>
        </div>

        <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 border border-slate-200 rounded-xl animate-pulse" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications.</p>
          ) : (
            <div className="space-y-3">
              {items.map((n) => (
                <div key={n.id} className={`border rounded-xl p-4 ${n.read ? 'border-indigo-100' : 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{n.title || 'Notification'}</p>
                      <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                      <p className="text-xs text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.read && <button onClick={() => markOne(n.id)} className="text-xs font-semibold text-blue-600">Mark read</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
