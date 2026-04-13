import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, markAllAsRead, markAsReadForUser } from '../../api/notificationApi';
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronDown,
  Filter,
  Inbox,
  MessageSquare,
  ShieldCheck,
  ShieldX,
  TicketCheck,
} from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/20 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-card-enter">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-200/50">
              <Bell size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
              <p className="text-sm text-slate-500 mt-0.5">Incident and booking updates for operations</p>
            </div>
          </div>
          <button
            onClick={markAll}
            disabled={unread === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-slate-700 px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <CheckCheck size={16} className="text-indigo-500" />
            Mark all as read
          </button>
        </div>

        {/* ── Stats banner ── */}
        <div className="grid grid-cols-2 gap-4 animate-card-enter" style={{ animationDelay: '60ms' }}>
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 shadow-lg shadow-indigo-200/40">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-200 uppercase tracking-widest">Unread</p>
                <p className="text-3xl font-extrabold text-white mt-1 animate-pop-in">{unread}</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm">
                <Bell size={22} className="text-white" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
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

        {/* ── Filter ── */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 shadow-sm animate-card-enter" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-3">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Type</span>
            <div className="relative flex-1 max-w-xs">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="BOOKING_APPROVED">Booking Approved</option>
                <option value="BOOKING_REJECTED">Booking Rejected</option>
                <option value="TICKET_STATUS_CHANGED">Ticket Status Changed</option>
                <option value="TICKET_NEW_COMMENT">Ticket New Comment</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Notification list ── */}
        <div className="space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl skeleton-shimmer" style={{ animationDelay: `${i * 80}ms` }} />
            ))
          ) : error ? (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5">
              <BellOff className="text-rose-500 shrink-0" size={20} />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Inbox size={24} />
              </div>
              <p className="text-sm text-slate-500 font-medium">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            items.map((n, i) => (
              <div
                key={n.id}
                className={`group relative rounded-2xl p-5 transition-all duration-200 animate-card-enter ${
                  n.read
                    ? 'bg-white/70 border border-slate-200/50 hover:border-slate-300/60'
                    : 'bg-gradient-to-r from-indigo-50/80 to-violet-50/60 border border-indigo-200/60 hover:border-indigo-300 shadow-sm shadow-indigo-100/30'
                }`}
                style={{ animationDelay: `${Math.min(i, 12) * 50 + 180}ms` }}
              >
                {!n.read && (
                  <div className="absolute top-5 left-5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5 ${
                    n.read ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-semibold truncate ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                          {n.title || 'Notification'}
                        </p>
                        <p className={`text-sm mt-1 line-clamp-2 ${n.read ? 'text-slate-500' : 'text-slate-600'}`}>
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markOne(n.id)}
                          className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2.5">
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
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const NotifIcon: React.FC<{ type?: string }> = ({ type }) => {
  switch (type) {
    case 'BOOKING_APPROVED':  return <ShieldCheck size={18} />;
    case 'BOOKING_REJECTED':  return <ShieldX size={18} />;
    case 'TICKET_STATUS_CHANGED': return <TicketCheck size={18} />;
    case 'TICKET_NEW_COMMENT':    return <MessageSquare size={18} />;
    default: return <Bell size={18} />;
  }
};
