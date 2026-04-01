import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, User, UserRole } from '../contexts/AuthContext';
import { Building2, Lock, Mail, ArrowRight, Eye, EyeOff, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { getNavConfig } from '../config/navigation';
import { loginUser } from '../api/authApi';
import { LoginSuccessPopup } from '../components/common/LoginSuccessPopup';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Success popup state
  const [successData, setSuccessData] = useState<{
    name: string;
    message: string;
    role: UserRole;
    defaultRoute: string;
  } | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ── Real-time email validation ────────────────────────────────────────────
  const validateEmail = (val: string) => {
    if (!val) {
      setEmailError('');
      return;
    }
    // Admin can use any corporate email; student must use @my.sliit.lk
    const studentRegex = /^[a-zA-Z0-9._%+\-]+@my\.sliit\.lk$/;
    const adminRegex   = /^[a-zA-Z0-9._%+\-]+@smartcampus\.edu$/;
    if (!studentRegex.test(val) && !adminRegex.test(val)) {
      setEmailError('Use your SLIIT student email (it23145870@my.sliit.lk)');
    } else {
      setEmailError('');
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    validateEmail(val);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError) return;
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      const userObj: User = {
        id:    data.id,
        name:  data.fullName,
        email: data.email,
        role:  data.role as UserRole,
      };

      login(userObj, data.token);

      const navConfig = getNavConfig(userObj.role);

      // Show success popup, then navigate
      setSuccessData({
        name:         data.fullName,
        message:      data.message,
        role:         userObj.role,
        defaultRoute: navConfig.defaultRoute,
      });

    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Login failed. Please check your credentials.';
      if (msg.includes('already exists') || msg.includes('register first')) {
        toast.error(msg, { duration: 5000, icon: '⚠️' });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── After popup closes ────────────────────────────────────────────────────
  const handlePopupClose = () => {
    if (successData) {
      navigate(successData.defaultRoute, { replace: true });
    }
    setSuccessData(null);
  };

  return (
    <>
      {/* ── Success Popup ─────────────────────────────────────────────────── */}
      {successData && (
        <LoginSuccessPopup
          userName={successData.name}
          message={successData.message}
          onClose={handlePopupClose}
        />
      )}

      {/* ── Login Page ────────────────────────────────────────────────────── */}
      <div
        className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm z-0" />

        {/* Brand header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up">
          <div className="flex justify-center mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              <Building2 size={34} className="text-white" />
            </div>
          </div>
          <h1 className="text-center text-3xl font-black text-white tracking-tight">Smart Campus</h1>
          <p className="mt-1.5 text-center text-xs text-indigo-300 uppercase tracking-widest font-bold">
            Operations Hub · SLIIT
          </p>
        </div>

        {/* Card */}
        <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Card top accent */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #059669)' }} />

            <div className="px-8 py-8">
              {/* Heading */}
              <div className="mb-7">
                <h2 className="text-2xl font-black text-slate-800">Welcome back</h2>
                <p className="text-sm text-slate-500 mt-1">Sign in to access your campus portal</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email field */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="it23145870@my.sliit.lk"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        emailError
                          ? 'border-red-300 bg-red-50 focus:ring-red-200'
                          : 'border-slate-200 bg-slate-50 focus:ring-indigo-200 focus:border-indigo-400 focus:bg-white'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <span>⚠</span> {emailError}
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading || !!emailError}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in to Account <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">New to Smart Campus?</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Register link */}
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 font-bold text-sm hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
              >
                <GraduationCap size={16} />
                Register with SLIIT Email
              </Link>

              {/* Admin note */}
              <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  <span className="font-bold text-slate-700">Admin?</span> Use your{' '}
                  <code className="bg-slate-100 px-1 rounded text-indigo-600">@smartcampus.edu</code> account.
                  <br />
                  Students use their <code className="bg-slate-100 px-1 rounded text-emerald-600">@my.sliit.lk</code> student ID email.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            SLIIT Smart Campus Operations Hub · Secure Access
          </p>
        </div>
      </div>
    </>
  );
};
