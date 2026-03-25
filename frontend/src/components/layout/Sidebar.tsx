import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, PlusCircle, Settings, Box } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Resource List', path: '/resources', icon: Box },
    { label: 'Add Resource', path: '/resources/new', icon: PlusCircle },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Manage Resources', path: '/resources/manage', icon: Settings });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-full shadow-xl z-20 transition-all fixed pt-16 mt-0.5 md:pt-0 md:mt-0 md:relative">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-wide">Smart Campus</h1>
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Facilities & Assets</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
          Core Modules
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive || location.pathname.startsWith(item.path) && item.path !== '/dashboard'
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      
      {/* Bottom Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
         <div className="text-xs text-slate-500 text-center">
           Module Version 1.0.0
         </div>
      </div>
    </aside>
  );
};
