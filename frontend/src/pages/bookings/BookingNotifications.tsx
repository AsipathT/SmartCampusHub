import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Ban,
  Clock3,
  BellRing,
  CheckCheck,
} from 'lucide-react';
import {
  getBookingNotifications,
  markBookingNotificationAsRead,
  type BookingNotification,
} from '../../api/bookingNotificationApi';
import { useAuth } from '../../contexts/AuthContext';

export const BookingNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getBookingNotifications(user.id);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load booking notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkAsRead = async (id: number) => {
    try {
      await markBookingNotificationAsRead(id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);

    if (unreadNotifications.length === 0) {
      toast('No unread notifications');
      return;
    }

    try {
      await Promise.all(
        unreadNotifications.map((notification) =>
          markBookingNotificationAsRead(notification.id)
        )
      );

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationStyle = (type: string) => {
    switch ((type || '').toUpperCase()) {
      case 'BOOKING_CREATED':
        return {
          icon: <Clock3 size={20} />,
          badge: 'Submitted',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          badgeBg: 'bg-amber-100 text-amber-700',
          border: 'border-amber-200',
        };
      case 'BOOKING_APPROVED':
        return {
          icon: <CheckCircle2 size={20} />,
          badge: 'Approved',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          badgeBg: 'bg-emerald-100 text-emerald-700',
          border: 'border-emerald-200',
        };
      case 'BOOKING_REJECTED':
        return {
          icon: <XCircle size={20} />,
          badge: 'Rejected',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          badgeBg: 'bg-red-100 text-red-700',
          border: 'border-red-200',
        };
      case 'BOOKING_CANCELLED':
        return {
          icon: <Ban size={20} />,
          badge: 'Cancelled',
          iconBg: 'bg-slate-200',
          iconColor: 'text-slate-600',
          badgeBg: 'bg-slate-200 text-slate-700',
          border: 'border-slate-300',
        };
      default:
        return {
          icon: <Bell size={20} />,
          badge: 'Update',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          badgeBg: 'bg-indigo-100 text-indigo-700',
          border: 'border-indigo-200',
        };
    }
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return 'Just now';

    return new Date(dateTime).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-[28px] bg-white/90 backdrop-blur border border-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg">
                  <BellRing size={28} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-100">
                    Booking Center
                  </p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">
                    My Notifications
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-indigo-100 md:text-base">
                    Track booking submissions, approvals, rejections, and cancellations in one place.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/15 px-4 py-3 text-white shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">
                    Total
                  </p>
                  <p className="text-2xl font-black">{notifications.length}</p>
                </div>

                <div className="rounded-2xl bg-white/15 px-4 py-3 text-white shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-indigo-100">
                    Unread
                  </p>
                  <p className="text-2xl font-black">{unreadCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-b border-slate-100 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Booking Updates
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Only booking-related notifications are shown here.
              </p>
            </div>

            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <CheckCheck size={18} />
              Mark All as Read
            </button>
          </div>

          {loading ? (
            <div className="space-y-4 px-6 py-8 md:px-8">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-4 w-40 rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-16 text-center md:px-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 shadow-sm">
                <Bell size={34} />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-800">
                No notifications yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                When you submit a booking or when an admin approves, rejects, or cancels it,
                the update will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4 bg-slate-50 px-6 py-6 md:px-8">
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                const unread = !notification.read;

                return (
                  <div
                    key={notification.id}
                    className={`group relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:p-6 ${
                      unread
                        ? `${style.border} ring-1 ring-indigo-100`
                        : 'border-slate-200'
                    }`}
                  >
                    {unread && (
                      <div className="absolute right-4 top-4 h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_0_6px_rgba(99,102,241,0.12)]" />
                    )}

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${style.iconBg} ${style.iconColor}`}
                        >
                          {style.icon}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-800 md:text-lg">
                              {style.badge}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${style.badgeBg}`}
                            >
                              {unread ? 'Unread' : 'Read'}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-[15px]">
                            {notification.message}
                          </p>

                          <p className="mt-4 text-xs font-medium text-slate-400">
                            {formatDateTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      {unread && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="inline-flex h-fit items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
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