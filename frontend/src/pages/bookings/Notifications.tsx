import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, CheckCircle2, XCircle, Ban } from 'lucide-react';
import {
  getUserNotifications,
  markAsRead,
  type Notification,
} from '../../api/notificationApi';
import { useAuth } from '../../contexts/AuthContext';

type NotificationWithRead = Notification & {
  isRead?: boolean;
};

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithRead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getUserNotifications(user.id);

      const normalized = (Array.isArray(data) ? data : []).map((n: any) => ({
        ...n,
        read: n.read ?? n.isRead ?? false,
        isRead: n.isRead ?? n.read ?? false,
      }));

      setNotifications(normalized);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, isRead: true } : n
        )
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const getIcon = (type: string) => {
    switch ((type || '').toUpperCase()) {
      case 'BOOKING_APPROVED':
        return <CheckCircle2 className="text-green-500" />;
      case 'BOOKING_REJECTED':
        return <XCircle className="text-red-500" />;
      case 'BOOKING_CANCELLED':
        return <Ban className="text-gray-500" />;
      default:
        return <Bell className="text-indigo-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500 mb-2">
            Booking Notifications
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
            My Notifications
          </h1>
          <p className="mt-2 text-slate-500 text-sm md:text-base">
            View booking approval, rejection, and cancellation updates.
          </p>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-xl font-black text-slate-800">Notification List</h2>
              <p className="text-sm text-slate-500 mt-1">
                Updates related to your booking activities will appear here.
              </p>
            </div>

            {!loading && (
              <div className="hidden md:flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  {notifications.length} Notifications
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="px-8 py-10 text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="px-8 py-14 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <Bell size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No notifications yet</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-md">
                Booking approval, rejection, and cancellation updates will show here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => {
                const unread = !(n.isRead ?? n.read);

                return (
                  <div
                    key={n.id}
                    className={`px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                      unread ? 'bg-indigo-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        {getIcon(n.type)}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {n.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>

                    {unread && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-semibold transition"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};