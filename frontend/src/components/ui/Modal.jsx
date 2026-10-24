import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal component — dùng React Portal để render ra ngoài DOM tree,
 * tránh bị ảnh hưởng bởi overflow:hidden/auto của container cha.
 * @param {boolean} open
 * @param {function} onClose
 * @param {string} title
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {ReactNode} children
 * @param {ReactNode} footer
 */
export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}) {
  /* ESC để đóng */
  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape' && open) onClose?.(); },
    [open, onClose]
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* Khoá scroll body khi mở */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const maxWidths = { sm: 420, md: 560, lg: 672, xl: 896 };
  const maxW = maxWidths[size] ?? maxWidths.md;

  const modalContent = (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.93) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Backdrop — fixed trực tiếp vào viewport qua Portal */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          boxSizing: 'border-box',
        }}
      >
        {/* Modal box */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: maxW,
            maxHeight: 'calc(100vh - 32px)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 16,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            animation: 'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          {title !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.125rem 1.5rem',
                borderBottom: '1px solid #E2E8F0',
                background: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: '6px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s, background 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#0F172A';
                  e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#64748B';
                  e.currentTarget.style.background = 'none';
                }}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Body — cuộn riêng bên trong modal */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              color: '#1E293B',
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E1 transparent',
            }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                flexShrink: 0,
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Render ra document.body qua Portal — thoát khỏi overflow:hidden/auto của container cha
  return createPortal(modalContent, document.body);
}
