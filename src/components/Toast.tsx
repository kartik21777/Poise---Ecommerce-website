import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

// ─── Single Toast Item ────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />,
  error:   <XCircle    className="w-5 h-5 text-red-500    dark:text-red-400    flex-shrink-0 mt-0.5" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-500  dark:text-amber-400  flex-shrink-0 mt-0.5" />,
  info:    <Info        className="w-5 h-5 text-blue-500   dark:text-blue-400   flex-shrink-0 mt-0.5" />,
};

const PROGRESS_COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 4000;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(duration);

  // Animate in
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Progress bar countdown
  const startTimer = useCallback(() => {
    const tick = 30;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, remainingRef.current - elapsed);
      setProgress((remaining / duration) * 100);
      if (remaining === 0) {
        clearInterval(intervalRef.current!);
        setVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
      }
    }, tick);
  }, [toast.id, duration, onDismiss]);

  const pauseTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startRef.current));
  }, []);

  const resumeTimer = useCallback(() => {
    startRef.current = Date.now();
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startTimer]);

  const handleDismiss = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`relative flex items-start gap-3 w-full max-w-sm pointer-events-auto
        rounded-xl border overflow-hidden
        bg-white dark:bg-gray-900
        border-gray-200 dark:border-gray-700
        shadow-lg dark:shadow-gray-950/60
        backdrop-blur-sm
        px-4 py-3
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
      `}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      role="alert"
    >
      {/* Icon */}
      {ICONS[toast.type]}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-0.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 transition-all ease-linear ${PROGRESS_COLORS[toast.type]}`}
        style={{ width: `${progress}%`, transitionDuration: '30ms' }}
      />
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...opts, id }]);
  }, []);

  const value: ToastContextValue = {
    toast,
    success: (title, message) => toast({ type: 'success', title, message }),
    error:   (title, message) => toast({ type: 'error',   title, message }),
    warning: (title, message) => toast({ type: 'warning', title, message }),
    info:    (title, message) => toast({ type: 'info',    title, message }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container — bottom-right */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
