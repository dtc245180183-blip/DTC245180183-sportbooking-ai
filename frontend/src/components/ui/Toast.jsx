import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   Context
────────────────────────────────────────────────────────── */
const ToastContext = createContext(null);

/* ──────────────────────────────────────────────────────────
   Config per type
────────────────────────────────────────────────────────── */
const TOAST_CONFIG = {
  success: {
    Icon: CheckCircle,
    bg: '#FFFFFF',
    border: '#BBF7D0',
    color: '#16A34A',
    barColor: '#16A34A',
  },
  error: {
    Icon: XCircle,
    bg: '#FFFFFF',
    border: '#FECACA',
    color: '#DC2626',
    barColor: '#DC2626',
  },
  warning: {
    Icon: AlertTriangle,
    bg: '#FFFFFF',
    border: '#FDE68A',
    color: '#D97706',
    barColor: '#D97706',
  },
  info: {
    Icon: Info,
    bg: '#FFFFFF',
    border: '#BFDBFE',
    color: '#2563EB',
    barColor: '#2563EB',
  },
};

/* ──────────────────────────────────────────────────────────
   Single Toast item
 ────────────────────────────────────────────────────────── */
function ToastItem({ toast, onRemove }) {
  const cfg = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.info;
  const { Icon } = cfg;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderRadius: 14,
        minWidth: 300,
        maxWidth: 400,
        overflow: 'hidden',
        background: '#FFFFFF',
        border: `1px solid ${cfg.border}`,
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
        animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
      role="alert"
    >
      {/* Icon */}
      <Icon size={18} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />

      {/* Message */}
      <p style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: '#0F172A',
                  lineHeight: 1.45, paddingRight: 8, margin: 0 }}>
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer',
                 flexShrink: 0, display: 'flex', alignItems: 'center', padding: 0 }}
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          borderRadius: 999,
          background: cfg.barColor,
          width: '100%',
          animation: `toastBar ${toast.duration ?? 3500}ms linear both`,
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   ToastProvider — wrap App
────────────────────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', message, duration = 3500 }) => {
      const id = ++counterRef.current;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      setTimeout(() => removeToast(id), duration + 300);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — góc dưới phải */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(48px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

/* ──────────────────────────────────────────────────────────
   Hook
────────────────────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
