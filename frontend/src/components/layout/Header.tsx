import React, { useEffect, useState } from 'react';
import { Bell, Search, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUnreadCount } from '../../api/notificationApi';
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

  useEffect(() => {
    if (!user?.id) return;
    getUnreadCount(user.id)
      .then(setNotifCount)
      .catch(() => setNotifCount(0));
  }, [user?.id]);

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
              <div className="divide-y divide-slate-50">
                {isAdmin ? (
                  <>
                    <NotifItem icon="🔧" title="Maintenance request" body="Lab A-301 reported AC issue" time="5m ago" />
                    <NotifItem icon="📦" title="Resource added" body="New projector added to inventory" time="1h ago" />
                    <NotifItem icon="📋" title="Daily report ready" body="Download the utilization summary" time="3h ago" />
                  </>
                ) : (
                  <NotifItem icon="🎓" title="Campus update" body="Library hours extended this week" time="2h ago" />
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
}> = ({ icon, title, body, time }) => (
  <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
    <div className="flex items-start gap-3">
      <span className="text-xl leading-none mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{body}</p>
      </div>
      <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">{time}</span>
    </div>
  </div>
);
