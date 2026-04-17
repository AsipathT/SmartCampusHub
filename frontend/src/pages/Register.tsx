import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, User, UserRole } from '../contexts/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  GraduationCap,
  User as UserIcon,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { registerStudent, checkEmailExists, googleLogin } from '../api/authApi';
import { getNavConfig } from '../config/navigation';
import { LoginSuccessPopup } from '../components/common/LoginSuccessPopup';

// ── Password Strength ─────────────────────────────────────────────────────────

interface PasswordStrength {
  score: number;      // 0–4
  label: string;
  color: string;
  barColor: string;
}

const evaluatePassword = (password: string): PasswordStrength => {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: PasswordStrength[] = [
    { score: 0, label: '',        color: 'text-slate-400', barColor: '#e2e8f0' },
    { score: 1, label: 'Weak',    color: 'text-red-500',   barColor: '#ef4444' },
    { score: 2, label: 'Fair',    color: 'text-orange-500',barColor: '#f97316' },
    { score: 3, label: 'Good',    color: 'text-yellow-500',barColor: '#eab308' },
    { score: 4, label: 'Strong',  color: 'text-emerald-500',barColor: '#10b981' },
    { score: 5, label: 'Very Strong', color: 'text-emerald-600', barColor: '#059669' },
  ];
  return levels[Math.min(score, 5)];
};

// ── Validation Status Icon ─────────────────────────────────────────────────────
const FieldIcon: React.FC<{ status: 'idle' | 'valid' | 'invalid' }> = ({ status }) => {
  if (status === 'valid')   return <CheckCircle2 size={15} className="text-emerald-500" />;
  if (status === 'invalid') return <XCircle size={15} className="text-red-500" />;
  return null;
};

// ── Validation Rules Display (At least 8 charcters and one upper case letter───────────────────────────────────────────────────
const Rule: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <li className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
    {met ? <CheckCircle2 size={11} /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
    {text}
  </li>
);

// ── Main Registration Page ─────────────────────────────────────────────────────
export const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form state(save user input)
  const [fullName, setFullName]             = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [googleLoading, setGoogleLoading]     = useState(false);
  const [emailChecking, setEmailChecking]     = useState(false);

  // Field validation statuses
  const [nameStatus,    setNameStatus]    = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [emailStatus,   setEmailStatus]   = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [emailError,    setEmailError]    = useState('');
  const [confirmStatus, setConfirmStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Success popup state
  const [successData, setSuccessData] = useState<{
    name: string;
    message: string;
    defaultRoute: string;
  } | null>(null);

  const passwordStrength = evaluatePassword(password);

  // ── Validators ──────────────────────────────────────────────────────────────

  const validateName = (val: string) => {
    setFullName(val);
    setNameStatus(val.trim().length >= 2 ? 'valid' : val.length > 0 ? 'invalid' : 'idle');
  };

  const SLIIT_REGEX = /^[a-zA-Z0-9._%+\-]+@my\.sliit\.lk$/;

  // Debounced email check with backend
  let emailCheckTimer: ReturnType<typeof setTimeout>;
  const handleEmailChange = (val: string) => {
    setEmail(val);
    setEmailError('');
    setEmailStatus('idle');

    clearTimeout(emailCheckTimer);

    if (!val) return;

    if (!SLIIT_REGEX.test(val)) {
      setEmailStatus('invalid');
      setEmailError('Must be a valid SLIIT student email (e.g. it23145870@my.sliit.lk)');
      return;
    }

    // Format is valid — now check backend for duplicates
    setEmailChecking(true);
    emailCheckTimer = setTimeout(async () => {
      try {
        const result = await checkEmailExists(val);
        if (result.exists) {
          setEmailStatus('invalid');
          setEmailError('This email is already registered. Please login instead.');
        } else {
          setEmailStatus('valid');
          setEmailError('');
        }
      } catch {
        // Network error — don't block the user
        setEmailStatus('valid');
      } finally {
        setEmailChecking(false);
      }
    }, 600);
  };

  const handleConfirmChange = (val: string) => {
    setConfirmPassword(val);
    if (!val) { setConfirmStatus('idle'); return; }
    setConfirmStatus(val === password ? 'valid' : 'invalid');
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (emailStatus === 'invalid') return;
    if (!SLIIT_REGEX.test(email)) {
      toast.error('Please use a valid SLIIT student email');
      return;
    }

    setLoading(true);
    try {
      const data = await registerStudent({ fullName, email, password, confirmPassword });

      const userObj: User = {
        id:    data.id,
        name:  data.fullName,
        email: data.email,
        role:  data.role as UserRole,
      };

      login(userObj, data.token);

      const navConfig = getNavConfig(userObj.role);
      setSuccessData({
        name:         data.fullName,
        message:      data.message,
        defaultRoute: navConfig.defaultRoute,
      });

    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed. Please try again.';
      // If duplicate email, suggest login
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('login instead')) {
        toast.error(msg, {
          duration: 6000,
          icon: '⚠️',
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    if (successData) navigate(successData.defaultRoute, { replace: true });
    setSuccessData(null);
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credential: string) => {
    setGoogleLoading(true);
    try {
      const data = await googleLogin(credential);
      const userObj: User = {
        id:    data.id,
        name:  data.fullName,
        email: data.email,
        role:  data.role as UserRole,
      };
      login(userObj, data.token);
      const navConfig = getNavConfig(userObj.role);
      setSuccessData({
        name:         data.fullName,
        message:      data.message,
        defaultRoute: navConfig.defaultRoute,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Google sign-in failed. Please try again.';
      toast.error(msg, { duration: 5000 });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Password rule checks
  const rules = [
    { met: password.length >= 8,       text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password),     text: 'One uppercase letter' },
    { met: /[0-9]/.test(password),     text: 'One number' },
    { met: /[^A-Za-z0-9]/.test(password), text: 'One special character' },
  ];

  return (
    <>
      {successData && (
        <LoginSuccessPopup
          userName={successData.name}
          message={successData.message}
          onClose={handlePopupClose}
          autoCloseSecs={5}
        />
      )}

      <div
        className="min-h-screen flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-0" />

        {/* Brand */}
        <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 animate-fade-in-up">
          <div className="flex justify-center mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              <GraduationCap size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-center text-2xl font-black text-white tracking-tight">
            Join Smart Campus Hub
          </h1>
          <p className="mt-1 text-center text-xs text-indigo-300 uppercase tracking-widest font-bold">
            SLIIT Student Registration
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4 sm:px-0 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Top accent */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #059669)' }} />

            <div className="px-8 py-8">
              {/* Heading */}
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Create your account</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Use your SLIIT student email to register
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100">
                  <GraduationCap size={13} className="text-indigo-500" />
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">SLIIT Only</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => validateName(e.target.value)}
                      placeholder="Kasun Perera"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        nameStatus === 'invalid'
                          ? 'border-red-300 bg-red-50 focus:ring-red-200'
                          : nameStatus === 'valid'
                          ? 'border-emerald-300 bg-emerald-50/30 focus:ring-emerald-200'
                          : 'border-slate-200 bg-slate-50 focus:ring-indigo-200 focus:border-indigo-400 focus:bg-white'
                      }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <FieldIcon status={nameStatus} />
                    </span>
                  </div>
                  {nameStatus === 'invalid' && (
                    <p className="mt-1.5 text-xs text-red-500">Name must be at least 2 characters</p>
                  )}
                </div>

                {/* Student Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    SLIIT Student Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="it23145870@my.sliit.lk"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        emailStatus === 'invalid'
                          ? 'border-red-300 bg-red-50 focus:ring-red-200'
                          : emailStatus === 'valid'
                          ? 'border-emerald-300 bg-emerald-50/30 focus:ring-emerald-200'
                          : 'border-slate-200 bg-slate-50 focus:ring-indigo-200 focus:border-indigo-400 focus:bg-white'
                      }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {emailChecking ? (
                        <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <FieldIcon status={emailStatus} />
                      )}
                    </span>
                  </div>

                  {emailError ? (
                    <div className="mt-1.5 flex items-start gap-1.5">
                      <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-500">
                        {emailError}
                        {emailError.includes('login instead') && (
                          <> <Link to="/login" className="underline font-bold">Login here</Link></>
                        )}
                      </p>
                    </div>
                  ) : emailStatus === 'valid' ? (
                    <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={11} /> SLIIT email verified · Available for registration
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Only <code className="bg-slate-100 px-1 rounded">@my.sliit.lk</code> emails are accepted
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-password"
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {password && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">Password strength</span>
                        <span className={`text-xs font-bold ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="flex-1 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              background: i <= passwordStrength.score
                                ? passwordStrength.barColor
                                : '#e2e8f0',
                            }}
                          />
                        ))}
                      </div>
                      {/* Rules */}
                      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                        {rules.map((r) => <Rule key={r.text} {...r} />)}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => handleConfirmChange(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        confirmStatus === 'invalid'
                          ? 'border-red-300 bg-red-50 focus:ring-red-200'
                          : confirmStatus === 'valid'
                          ? 'border-emerald-300 bg-emerald-50/30 focus:ring-emerald-200'
                          : 'border-slate-200 bg-slate-50 focus:ring-indigo-200 focus:border-indigo-400 focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmStatus === 'invalid' && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <XCircle size={11} /> Passwords do not match
                    </p>
                  )}
                  {confirmStatus === 'valid' && (
                    <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  id="reg-submit"
                  type="submit"
                  disabled={loading || emailStatus === 'invalid' || emailChecking}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating your account…
                    </>
                  ) : (
                    <>
                      <GraduationCap size={16} />
                      Create SLIIT Account
                    </>
                  )}
                </button>
              </form>

              {/* Google Sign-Up divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or sign up with Google</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google Sign-In button */}
              <div className="w-full mb-2">
                {googleLoading ? (
                  <div className="w-full py-3 rounded-xl border-2 border-slate-200 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                    <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing up with Google…
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                          handleGoogleSuccess(credentialResponse.credential);
                        }
                      }}
                      onError={() => toast.error('Google sign-in was cancelled or failed.')}
                      theme="outline"
                      size="large"
                      width="368"
                      text="signup_with"
                      shape="rectangular"
                    />
                  </div>
                )}
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Auto-registers your <code className="bg-slate-100 px-1 rounded text-emerald-600">@my.sliit.lk</code> account instantly
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">Already have an account?</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                <ArrowLeft size={15} />
                Back to Login
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            Restricted to SLIIT students · @my.sliit.lk emails only
          </p>
        </div>
      </div>
    </>
  );
};
