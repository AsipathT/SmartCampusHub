import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, Sparkles } from 'lucide-react';

interface LoginSuccessPopupProps {
  userName: string;
  message?: string;
  onClose: () => void;
  autoCloseSecs?: number;
}

/**
 * LoginSuccessPopup
 * ─────────────────────────────────────────────────────────────────────────────
 * Animated full-screen celebration popup shown after a successful login.
 * Auto-closes after `autoCloseSecs` seconds (default 4).
 */
export const LoginSuccessPopup: React.FC<LoginSuccessPopupProps> = ({
  userName,
  message,
  onClose,
  autoCloseSecs = 4,
}) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // Fade-in on mount
  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(showTimer);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    const totalMs = autoCloseSecs * 1000;
    const interval = 50;
    const step = (interval / totalMs) * 100;

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return p - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        transition: 'opacity 0.3s ease',
        opacity: visible ? 1 : 0,
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Popup Card */}
      <div
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Top gradient banner */}
        <div
          className="relative h-36 flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #059669 100%)' }}
        >
          {/* Animated rings */}
          <div className="absolute w-32 h-32 rounded-full border-4 border-white/20 animate-ping" />
          <div className="absolute w-24 h-24 rounded-full border-2 border-white/30 animate-pulse" />

          {/* Success icon */}
          <div className="relative z-10 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/40 shadow-xl">
            <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
          </div>

          {/* Sparkles decoration */}
          <Sparkles size={18} className="absolute top-4 right-8 text-white/60 animate-pulse" />
          <Sparkles size={12} className="absolute bottom-6 left-12 text-white/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-6 text-center">
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            Login Successful! 🎉
          </h2>

          <p className="text-base font-semibold text-indigo-600 mb-3">
            Welcome back, <span className="text-indigo-700">{userName}</span>!
          </p>

          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            {message || `You have successfully logged into the Smart Campus Hub.`}
          </p>

          {/* Progress bar (auto-close countdown) */}
          <div className="mb-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-none"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #4f46e5, #10b981)',
                transition: 'width 0.05s linear',
              }}
            />
          </div>

          <p className="text-xs text-slate-400 mb-5">
            Redirecting to your dashboard in {autoCloseSecs}s…
          </p>

          <button
            onClick={handleClose}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            Continue to Dashboard →
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
