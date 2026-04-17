import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, ChevronRight, Inbox, MessageSquare, ShieldCheck, ShieldX, TicketCheck, UserCheck, Zap, Pencil } from 'lucide-react';
import { getNotifications, markAllAsRead, markAsReadForUser, Notification } from '../../api/notificationApi';
import { useAuth } from '../../contexts/AuthContext';

type TypeFilter =
  | 'ALL'
  | 'TICKET_STATUS_CHANGED'
  | 'TICKET_PRIORITY_CHANGED'
  | 'TICKET_NEW_COMMENT'
  | 'TICKET_ASSIGNED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED';

export const StudentNotifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
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

  const openNotification = async (n: Notification) => {
    if (!n.read) {
      onMarkRead(n.id);
    }
    if (n.relatedEntityType === 'TICKET' && n.relatedEntityId) {
      navigate(`/app/user/incidents/${n.relatedEntityId}`);
    } else if (n.relatedEntityType === 'BOOKING' && n.relatedEntityId) {
      navigate('/app/user/bookings');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-card-enter">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-sm text-slate-500 mt-0.5">Stay on top of your incident tickets and booking decisions.</p>
          </div>
          <button
            onClick={onMarkAll}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-slate-700 px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            Mark all as read
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 animate-card-enter" style={{ animationDelay: '60ms' }}>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Unread</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{unreadCount}</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 text-slate-500">
                <Bell size={22} />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{items.length}</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 text-slate-500">
                <Inbox size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 shadow-sm animate-card-enter" style={{ animationDelay: '120ms' }}>
          <div className="relative max-w-xs">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="TICKET_STATUS_CHANGED">Ticket Status Updates</option>
              <option value="TICKET_PRIORITY_CHANGED">Ticket Priority Updates</option>
              <option value="TICKET_ASSIGNED">Technician Assigned</option>
              <option value="TICKET_NEW_COMMENT">Ticket Comments</option>
              <option value="BOOKING_APPROVED">Booking Approved</option>
              <option value="BOOKING_REJECTED">Booking Rejected</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center text-rose-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <Inbox size={24} />
            </div>
            <p className="text-sm text-slate-500 font-medium">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">We'll drop you a line when something happens on your tickets.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => {
              const canOpen = n.relatedEntityType === 'TICKET' && !!n.relatedEntityId;
              return (
                <button
                  type="button"
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={`group w-full text-left bg-white border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    n.read
                      ? 'border-indigo-100'
                      : 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5 ${
                      n.read ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      <NotifIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{n.title || 'Notification'}</p>
                          <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                        </div>
                        {!n.read && (
                          <span
                            onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                            role="button"
                            className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Mark read
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          n.read
                            ? 'bg-slate-50 text-slate-500 border-slate-200'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        }`}>
                          {(n.type || 'GENERAL').replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                        {canOpen && (
                          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Open ticket <ChevronRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const NotifIcon: React.FC<{ type?: string }> = ({ type }) => {
  switch (type) {
    case 'TICKET_STATUS_CHANGED':   return <TicketCheck size={18} />;
    case 'TICKET_PRIORITY_CHANGED': return <Zap size={18} />;
    case 'TICKET_NEW_COMMENT':      return <MessageSquare size={18} />;
    case 'TICKET_ASSIGNED':         return <UserCheck size={18} />;
    case 'TICKET_UPDATED':          return <Pencil size={18} />;
    case 'BOOKING_APPROVED':        return <ShieldCheck size={18} />;
    case 'BOOKING_REJECTED':        return <ShieldX size={18} />;
    default: return <Bell size={18} />;
  }
};
