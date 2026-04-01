import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User, UserRole } from '../contexts/AuthContext';
import { Building2, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getNavConfig } from '../config/navigation';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER'); // Temporary mock role selector
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API Call — replace with real API call when backend auth is ready
      await new Promise((resume) => setTimeout(resume, 800));

      if (email && password) {
        const mockUser: User = {
          id: role === 'ADMIN' ? 'admin-001' : 'usr-1234',
          name: email.split('@')[0],
          email: email,
          role: role as UserRole,
        };
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock'; // Dummy token

        login(mockUser, mockToken);
        toast.success(`Welcome back, ${mockUser.name}! 👋`);

        // ── Role-aware redirect using centralized nav config ──────────────
        const navConfig = getNavConfig(mockUser.role);
        navigate(navConfig.defaultRoute, { replace: true });
      } else {
        toast.error('Please enter your email and password.');
      }
    } catch (err) {
      toast.error('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')"}}>
      {/* Light Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Building2 size={36} />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-white tracking-tight">
          Smart Campus
        </h2>
        <p className="mt-2 text-center text-sm text-blue-200 uppercase tracking-widest font-semibold font-mono">
          Operations Hub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800">Sign in to your account</h3>
            <p className="text-sm text-slate-500 mt-1">Facilities & Assets Catalogue access.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2.5 bg-slate-50 border focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="admin@smartcampus.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-2.5 bg-slate-50 border focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Development Mock Role Selector */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
               <div className="flex gap-2 items-center">
                 <CheckCircle2 size={16} className="text-blue-500" />
                 <span className="text-xs font-semibold text-blue-800 uppercase">Mock Login Role</span>
               </div>
               <select 
                 className="text-xs font-medium bg-white border border-blue-200 rounded px-2 py-1 text-slate-700 outline-none"
                 value={role}
                 onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
               >
                 <option value="USER">Base User</option>
                 <option value="ADMIN">System Admin</option>
               </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in to Account <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
