import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUnreadCount } from '../../api/notificationApi';
import { getNavConfig, NavGroup } from '../../config/navigation';
import { UserRole } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// ── Role Badge ─────────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const styles: Record<UserRole, string> = {
    ADMIN: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    USER: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  const labels: Record<UserRole, string> = {
    ADMIN: 'Admin',
    USER: 'Student',
  };

  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles[role]}`}
    >
      {labels[role]}
    </span>
  );
};

// ── Collapsible Nav Group ──────────────────────────────────────────────────────
const SidebarGroup: React.FC<{ group: NavGroup }> = ({ group }) => {
  const location = useLocation();
  const isAnyActive = group.items.some((item) => location.pathname.startsWith(item.path));
  const [open, setOpen] = useState(group.defaultOpen ?? true);

  useEffect(() => {
    if (isAnyActive) setOpen(true);
  }, [isAnyActive]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
          open ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3 font-semibold text-sm tracking-wide">
          <group.icon
            size={17}
            className={open ? 'text-indigo-400' : 'text-slate-500'}
          />
          {group.label}
        </div>
        <ChevronDown
          size={15}
          className={`transition-transform duration-300 ${
            open ? 'rotate-180 text-indigo-400' : 'text-slate-500'
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="pl-4 pr-2 py-1.5 space-y-0.5 relative before:absolute before:inset-y-0 before:left-6 before:w-px before:bg-slate-700/60">
          {group.items.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.exact}
              title={item.description}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 before:absolute before:left-[-9px] before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-indigo-400 before:rounded-full before:shadow-[0_0_6px_2px_rgba(99,102,241,0.5)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`
              }
            >
              <item.icon size={15} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navConfig = getNavConfig(user?.role as UserRole);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user?.id) {
      getUnreadCount(user.id)
        .then(setUnreadCount)
        .catch(() => console.error('Failed to fetch unread notifications'));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const sidebarContent = (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-full shadow-2xl z-20">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 22V12h6v10M9 12h6M3 9h18" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none tracking-wide">Smart Campus</p>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest mt-0.5">
              Operations Hub
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Strip */}
      <div
        onClick={() => navigate('/app/profile')}
        className="px-4 py-4 border-b border-slate-800 bg-slate-950/30 flex-shrink-0 cursor-pointer hover:bg-slate-800/40 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name || 'User'}
              className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-slate-600 group-hover:border-indigo-400 transition-colors shadow-md"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center flex-shrink-0 border border-slate-600 group-hover:border-indigo-400 transition-colors shadow-md">
              <UserIcon size={16} className="text-slate-300 group-hover:text-indigo-300 transition-colors" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
              {user?.name || 'Guest'}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <RoleBadge role={(user?.role || 'USER') as UserRole} />
            {unreadCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shadow-sm animate-pulse">
                <Bell size={10} />
                <span>{unreadCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 custom-scrollbar">
        <div className="px-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
            Navigation
          </p>
          <div className="space-y-2">
            {navConfig.groups.map((group) => (
              <SidebarGroup key={group.id} group={group} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium group"
        >
          <LogOut size={15} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          <span>Sign Out</span>
        </button>
        <p className="text-[10px] text-slate-600 text-center mt-3">
          SmartCampusHub · v1.0.0
        </p>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex h-full">
        {sidebarContent}
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};