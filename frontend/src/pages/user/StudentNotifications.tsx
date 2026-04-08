import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getNotifications, markAllAsRead, markAsReadForUser } from '../../api/notificationApi';
import { useAuth } from '../../contexts/AuthContext';

type TypeFilter = 'ALL' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'TICKET_STATUS_CHANGED' | 'TICKET_NEW_COMMENT';

export const StudentNotifications: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    getNotifications(user.id, typeFilter === 'ALL' ? undefined : typeFilter)
      .then(setItems)
      .catch(() => {
        setError('Could not load notifications.');
        toast.error('Failed to load notifications');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user?.id, typeFilter]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const onMarkRead = async (id: number) => {
    if (!user?.id) return;
    try {
      await markAsReadForUser(id, user.id);
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, read: true } : p)));
    } catch {
      toast.error('Could not mark as read');
    }
  };

  const onMarkAll = async () => {
    if (!user?.id) return;
    try {
      await markAllAsRead(user.id);
      setItems((prev) => prev.map((p) => ({ ...p, read: true })));
    } catch {
      toast.error('Could not mark all as read');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-indigo-50 to-slate-50 px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500 mt-1">Booking decisions, ticket updates, and ticket comments.</p>
          </div>
          <button onClick={onMarkAll} className="text-sm px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
            Mark all as read
          </button>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white border border-indigo-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <p className="text-sm text-indigo-100">Unread notifications</p>
          <span className="text-xl font-bold text-white">{unreadCount}</span>
        </div>

        <div className="bg-white border border-indigo-100 rounded-2xl p-3 shadow-sm">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="BOOKING_APPROVED">Booking Approved</option>
            <option value="BOOKING_REJECTED">Booking Rejected</option>
            <option value="TICKET_STATUS_CHANGED">Ticket Status Changed</option>
            <option value="TICKET_NEW_COMMENT">Ticket New Comment</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center text-rose-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">No notifications yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <div key={n.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${n.read ? 'border-indigo-100' : 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{n.title || 'Notification'}</p>
                    <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                    <p className="text-xs text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.read && (
                    <button onClick={() => onMarkRead(n.id)} className="text-xs text-blue-600 font-semibold">
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
