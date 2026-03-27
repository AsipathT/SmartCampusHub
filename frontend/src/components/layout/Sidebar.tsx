import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, PlusCircle, Settings, Box, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();
  const [facilitiesOpen, setFacilitiesOpen] = useState(true);

  const navItems = [
    { label: 'Dashboard', path: '/app/facilities/dashboard', icon: LayoutDashboard },
    { label: 'Resource List', path: '/app/facilities/resources', icon: Box, exact: true },
    { label: 'My Bookings', path: '/app/facilities/bookings/my', icon: Box },
    { label: 'Add Resource', path: '/app/facilities/resources/add', icon: PlusCircle },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Manage Resources', path: '/app/facilities/resources/manage', icon: Settings });
    navItems.push({ label: 'Manage Bookings', path: '/app/facilities/bookings/manage', icon: Settings });
  }

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-full shadow-xl z-20 transition-all fixed pt-16 mt-0.5 md:pt-0 md:mt-0 md:relative">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-wide">Smart Campus</h1>
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Operations Hub</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
          Core Modules
        </div>
        
        <div className="space-y-2">
          {/* Main Menu Toggle */}
          <button 
            onClick={() => setFacilitiesOpen(!facilitiesOpen)}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
              facilitiesOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 font-semibold text-sm tracking-wide">
              <Building2 size={18} className={facilitiesOpen ? 'text-blue-500' : ''} />
              Facilities & Assets
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${facilitiesOpen ? 'rotate-180 text-blue-500' : ''}`} />
          </button>

          {/* Collapsible Submenu */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${facilitiesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <nav className="pl-5 pr-2 py-2 space-y-1 relative before:absolute before:inset-y-0 before:left-7 before:w-px before:bg-slate-800">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  end={item.exact}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 before:absolute before:left-[-9px] before:w-2 before:h-2 before:bg-blue-500 before:rounded-full'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
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
