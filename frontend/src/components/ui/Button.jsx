import { forwardRef } from 'react';

/**
 * Button component — 100% inline styles, không phụ thuộc Tailwind scan
 * @param {'primary'|'secondary'|'danger'|'ghost'|'ai'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {ReactNode} icon  — icon ở bên trái
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    children,
    className = '',
    type = 'button',
    style: styleProp,
    onMouseEnter,
    onMouseLeave,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  /* ── Size tokens ── */
  const sizeStyles = {
    sm: { fontSize: '0.75rem',   padding: '6px 12px',  gap: 4  },
    md: { fontSize: '0.875rem',  padding: '10px 16px', gap: 6  },
    lg: { fontSize: '1rem',      padding: '12px 24px', gap: 8  },
  };
  const sz = sizeStyles[size] ?? sizeStyles.md;

  /* ── Variant base styles ── */
  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #10B981, #059669)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 2px 6px rgba(16,185,129,0.25)',
    },
    secondary: {
      background: '#FFFFFF',
      color: '#334155',
      border: '1px solid #CBD5E1',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    danger: {
      background: '#FEE2E2',
      color: '#DC2626',
      border: '1px solid #FECACA',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: '#64748B',
      border: 'none',
      boxShadow: 'none',
    },
    ai: {
      background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
    },
  };
  const vStyle = variantStyles[variant] ?? variantStyles.primary;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sz.gap,
    fontSize: sz.fontSize,
    padding: sz.padding,
    fontWeight: 600,
    borderRadius: 10,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    transition: 'transform 0.18s, box-shadow 0.18s, background 0.18s, border-color 0.18s, color 0.18s',
    opacity: isDisabled ? 0.55 : 1,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    ...vStyle,
    ...styleProp,
  };

  const handleMouseEnter = (e) => {
    if (!isDisabled) {
      if (variant === 'primary') {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.35)';
      } else if (variant === 'ai') {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.35)';
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = '#F8FAFC';
        e.currentTarget.style.borderColor = '#94A3B8';
        e.currentTarget.style.color = '#0F172A';
      } else if (variant === 'danger') {
        e.currentTarget.style.background = '#FCA5A5';
        e.currentTarget.style.color = '#B91C1C';
      } else if (variant === 'ghost') {
        e.currentTarget.style.color = '#0F172A';
        e.currentTarget.style.background = '#F1F5F9';
      }
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e) => {
    if (!isDisabled) {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = vStyle.boxShadow ?? '';
      e.currentTarget.style.background = vStyle.background ?? '';
      e.currentTarget.style.borderColor = vStyle.border ? vStyle.border.replace('1px solid ', '') : '';
      e.currentTarget.style.color = vStyle.color ?? '';
    }
    onMouseLeave?.(e);
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={className}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {loading ? (
        /* Spinner */
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'btn-spin 0.7s linear infinite',
            flexShrink: 0,
          }}
        />
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      ) : null}
      {children}
      <style>{`@keyframes btn-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
});

export default Button;
