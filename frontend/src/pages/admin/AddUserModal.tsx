import React, { useState, useEffect } from 'react';
import {
  X, User, Mail, Lock, Eye, EyeOff,
  ShieldCheck, GraduationCap, CheckCircle2, XCircle, UserPlus,
  BookOpen, Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createUser, CreateUserPayload, UserRole } from '../../api/userApi';
import { checkEmailExists } from '../../api/authApi';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type FieldStatus = 'idle' | 'valid' | 'invalid';

const FieldIcon: React.FC<{ status: FieldStatus }> = ({ status }) => {
  if (status === 'valid')   return <CheckCircle2 size={15} className="text-emerald-500" />;
  if (status === 'invalid') return <XCircle size={15} className="text-red-500" />;
  return null;
};

const inputClass = (status: FieldStatus) => {
  const base = 'w-full pl-10 pr-10 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2';
  if (status === 'invalid') return `${base} border-red-300 bg-red-50 focus:ring-red-200`;
  if (status === 'valid')   return `${base} border-emerald-300 bg-emerald-50/30 focus:ring-emerald-200`;
  return `${base} border-slate-200 bg-slate-50 focus:ring-indigo-200 focus:border-indigo-400 focus:bg-white`;
};

const SLIIT_REGEX = /^[a-zA-Z0-9._%+\-]+@my\.sliit\.lk$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RoleConfig {
  value: UserRole;
  label: string;
  sub: string;
  icon: React.ReactNode;
  activeClass: string;
  iconActiveClass: string;
  textActiveClass: string;
  checkClass: string;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    value: 'USER',
    label: 'Student',
    sub: '@my.sliit.lk only',
    icon: <GraduationCap size={18} />,
    activeClass: 'border-emerald-500 bg-emerald-50',
    iconActiveClass: 'bg-emerald-100 text-emerald-600',
    textActiveClass: 'text-emerald-700',
    checkClass: 'text-emerald-500',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    sub: 'Any email',
    icon: <ShieldCheck size={18} />,
    activeClass: 'border-indigo-500 bg-indigo-50',
    iconActiveClass: 'bg-indigo-100 text-indigo-600',
    textActiveClass: 'text-indigo-700',
    checkClass: 'text-indigo-500',
  },
  {
    value: 'LECTURER',
    label: 'Lecturer',
    sub: 'Any email',
    icon: <BookOpen size={18} />,
    activeClass: 'border-amber-500 bg-amber-50',
    iconActiveClass: 'bg-amber-100 text-amber-600',
    textActiveClass: 'text-amber-700',
    checkClass: 'text-amber-500',
  },
  {
    value: 'MAINTENANCE_STAFF',
    label: 'Maintenance',
    sub: 'Any email',
    icon: <Wrench size={18} />,
    activeClass: 'border-cyan-500 bg-cyan-50',
    iconActiveClass: 'bg-cyan-100 text-cyan-600',
    textActiveClass: 'text-cyan-700',
    checkClass: 'text-cyan-500',
  },
];

const emailPlaceholder = (role: UserRole) =>
  role === 'USER' ? 'it23145870@my.sliit.lk' : 'user@example.com';

const emailLabel = (role: UserRole) =>
  role === 'USER' ? 'SLIIT Student Email' : 'Email Address';

export const AddUserModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [role, setRole]               = useState<UserRole>('USER');
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);

  const [nameStatus,    setNameStatus]    = useState<FieldStatus>('idle');
  const [emailStatus,   setEmailStatus]   = useState<FieldStatus>('idle');
  const [emailError,    setEmailError]    = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [pwStatus,      setPwStatus]      = useState<FieldStatus>('idle');
  const [confirmStatus, setConfirmStatus] = useState<FieldStatus>('idle');

  useEffect(() => {
    setEmail('');
    setEmailStatus('idle');
    setEmailError('');
  }, [role]);

  const validateName = (val: string) => {
    setFullName(val);
    setNameStatus(val.trim().length >= 2 ? 'valid' : val.length > 0 ? 'invalid' : 'idle');
  };

  let emailTimer: ReturnType<typeof setTimeout>;
  const handleEmailChange = (val: string) => {
    setEmail(val);
    setEmailError('');
    setEmailStatus('idle');
    clearTimeout(emailTimer);
    if (!val) return;

    if (role === 'USER' && !SLIIT_REGEX.test(val)) {
      setEmailStatus('invalid');
      setEmailError('Must be a valid SLIIT student email (e.g. it23145870@my.sliit.lk)');
      return;
    }
    if (role !== 'USER' && !EMAIL_REGEX.test(val)) {
      setEmailStatus('invalid');
      setEmailError('Enter a valid email address');
      return;
    }

    setEmailChecking(true);
    emailTimer = setTimeout(async () => {
      try {
        const result = await checkEmailExists(val);
        if (result.exists) {
          setEmailStatus('invalid');
          setEmailError('This email is already registered.');
        } else {
          setEmailStatus('valid');
          setEmailError('');
        }
      } catch {
        setEmailStatus('valid');
      } finally {
        setEmailChecking(false);
      }
    }, 500);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setPwStatus(val.length >= 8 ? 'valid' : val.length > 0 ? 'invalid' : 'idle');
    if (confirmPw) setConfirmStatus(val === confirmPw ? 'valid' : 'invalid');
  };

  const handleConfirmChange = (val: string) => {
    setConfirmPw(val);
    if (!val) { setConfirmStatus('idle'); return; }
    setConfirmStatus(val === password ? 'valid' : 'invalid');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameStatus === 'invalid' || !fullName.trim()) { toast.error('Enter a valid full name'); return; }
    if (emailStatus !== 'valid') { toast.error('Enter a valid, available email'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPw) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const payload: CreateUserPayload = {
        fullName: fullName.trim(), email, password, confirmPassword: confirmPw, role,
      };
      await createUser(payload);
      toast.success(`"${fullName.trim()}" created successfully`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    nameStatus === 'valid' && emailStatus === 'valid' &&
    pwStatus === 'valid' && confirmStatus === 'valid' &&
    !loading && !emailChecking;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="h-1.5 w-full rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #059669)' }} />

        <div className="px-8 py-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><UserPlus size={22} /></div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Add New User</h2>
                <p className="text-xs text-slate-500 mt-0.5">Create a system account</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role selector — 2×2 grid */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                User Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_CONFIGS.map(cfg => {
                  const active = role === cfg.value;
                  return (
                    <button
                      key={cfg.value}
                      type="button"
                      onClick={() => setRole(cfg.value)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                        active ? cfg.activeClass : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-xl flex-shrink-0 ${active ? cfg.iconActiveClass : 'bg-slate-100 text-slate-500'}`}>
                        {cfg.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${active ? cfg.textActiveClass : 'text-slate-700'}`}>
                          {cfg.label}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{cfg.sub}</p>
                      </div>
                      {active && <CheckCircle2 size={16} className={`ml-auto flex-shrink-0 ${cfg.checkClass}`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" required value={fullName}
                  onChange={e => validateName(e.target.value)}
                  placeholder="Kasun Perera"
                  className={inputClass(nameStatus)}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2"><FieldIcon status={nameStatus} /></span>
              </div>
              {nameStatus === 'invalid' && <p className="mt-1.5 text-xs text-red-500">Name must be at least 2 characters</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                {emailLabel(role)}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" required value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  placeholder={emailPlaceholder(role)}
                  className={inputClass(emailStatus)}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {emailChecking ? (
                    <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : <FieldIcon status={emailStatus} />}
                </span>
              </div>
              {emailError ? (
                <p className="mt-1.5 text-xs text-red-500">{emailError}</p>
              ) : emailStatus === 'valid' ? (
                <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> Email available</p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">
                  {role === 'USER'
                    ? <>Only <code className="bg-slate-100 px-1 rounded">@my.sliit.lk</code> emails accepted</>
                    : 'Enter a valid email address'}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  placeholder="••••••••" className={inputClass(pwStatus)}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwStatus === 'invalid' && <p className="mt-1.5 text-xs text-red-500">Password must be at least 8 characters</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'} required value={confirmPw}
                  onChange={e => handleConfirmChange(e.target.value)}
                  placeholder="••••••••" className={inputClass(confirmStatus)}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmStatus === 'invalid' && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} /> Passwords do not match</p>}
              {confirmStatus === 'valid'   && <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> Passwords match</p>}
            </div>

            {/* Username preview */}
            {emailStatus === 'valid' && email && (
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs text-slate-500 font-medium">Username will be:</span>
                <code className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                  {email.split('@')[0].toLowerCase()}
                </code>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={!canSubmit}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                {loading ? (
                  <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Creating…</>
                ) : (
                  <><UserPlus size={16} />Create User</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
