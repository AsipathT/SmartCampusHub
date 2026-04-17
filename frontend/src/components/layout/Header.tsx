import React, { useEffect, useState } from 'react';
import { Bell, Search, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, getUnreadCount, markAsReadForUser, Notification } from '../../api/notificationApi';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle, mobileMenuOpen }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [recent, setRecent] = useState<Notification[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const refreshUnread = () => {
    if (!user?.id) return;
    getUnreadCount(user.id)
      .then(setNotifCount)
      .catch(() => setNotifCount(0));
  };

  useEffect(() => {
    refreshUnread();
    const interval = setInterval(refreshUnread, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!notifOpen || !user?.id) return;
    setRecentLoading(true);
    getNotifications(user.id)
      .then((list) => setRecent(list.slice(0, 5)))
      .catch(() => setRecent([]))
      .finally(() => setRecentLoading(false));
    refreshUnread();
  }, [notifOpen, user?.id]);

  const openFromBell = async (n: Notification) => {
    if (!user?.id) return;
    if (!n.read) {
      try {
        await markAsReadForUser(n.id, user.id);
        setRecent((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setNotifCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    setNotifOpen(false);
    if (n.relatedEntityType === 'TICKET' && n.relatedEntityId) {
      if (isAdmin && n.type === 'TICKET_DELETED') {
        navigate('/app/admin/incidents/manage');
      } else {
        navigate(isAdmin ? `/app/admin/incidents/${n.relatedEntityId}` : `/app/user/incidents/${n.relatedEntityId}`);
      }
    } else {
      navigate(isAdmin ? '/app/admin/incidents/notifications' : '/app/user/notifications');
    }
  };

  const emojiFor = (type?: string) => {
    switch (type) {
      case 'TICKET_CREATED':          return '🆕';
      case 'TICKET_UPDATED':          return '✏️';
      case 'TICKET_DELETED':          return '🗑️';
      case 'TICKET_STATUS_CHANGED':   return '🛠️';
      case 'TICKET_PRIORITY_CHANGED': return '⚡';
      case 'TICKET_ASSIGNED':         return '👷';
      case 'TICKET_NEW_COMMENT':      return '💬';
      case 'BOOKING_APPROVED':        return '✅';
      case 'BOOKING_REJECTED':        return '🚫';
      default: return '🔔';
    }
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 flex-shrink-0">
      {/* Mobile hamburger + Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          id="mobile-menu-toggle"
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          onClick={onMobileMenuToggle}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="relative w-full max-w-sm hidden md:flex items-center">
          <Search className="absolute left-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search facilities, resources..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Role indicator chip */}
        {isAdmin && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
            <Shield size={12} className="text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Admin</span>
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="notification-bell"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            aria-label={`${notifCount} notifications`}
          >
            <Bell size={19} />
            {notifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm">
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="font-bold text-slate-800 text-sm">Notifications</p>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {notifCount} new
                </span>
              </div>
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {recentLoading ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">Loading...</div>
                ) : recent.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">You're all caught up.</div>
                ) : (
                  recent.map((n) => (
                    <NotifItem
                      key={n.id}
                      icon={emojiFor(n.type)}
                      title={n.title || 'Notification'}
                      body={n.message}
                      time={relativeTime(n.createdAt)}
                      unread={!n.read}
                      onClick={() => openFromBell(n)}
                    />
                  ))
                )}
              </div>
              <div className="px-4 py-3 bg-slate-50">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    navigate(isAdmin ? '/app/admin/incidents/notifications' : '/app/user/notifications');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors w-full text-center"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar strip */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name || 'Guest'}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)' }}
          >
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      </div>
    </header>
  );
};

// ── Small notification item ───────────────────────────────────────────────────
const NotifItem: React.FC<{
  icon: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  onClick?: () => void;
}> = ({ icon, title, body, time, unread, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
      unread ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-slate-50'
    }`}
  >
    <div className="flex items-start gap-3">
      <span className="text-xl leading-none mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{body}</p>
      </div>
      <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">{time}</span>
    </div>
  </button>
);
