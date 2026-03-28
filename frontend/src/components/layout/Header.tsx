import React from 'react';
import { Bell, Search, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search Bar Placeholder */}
      <div className="flex-1 flex justify-start">
        <div className="relative w-full max-w-sm hidden md:flex items-center">
          <Search className="absolute left-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search resources, facilities..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5">
        <button className="relative text-slate-500 hover:text-blue-600 transition-colors p-1">
          <Bell size={20} />
          <span className="absolute top-0.5 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.name || 'Guest'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || 'User'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
            <UserIcon size={18} />
          </div>

          <button 
            onClick={handleLogout}
            className="ml-2 text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
