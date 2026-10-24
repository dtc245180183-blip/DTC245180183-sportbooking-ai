import { forwardRef } from 'react';

/**
 * Input form control chuẩn
 * @param {string} label
 * @param {string} error
 * @param {ReactNode} icon — icon bên trái (optional)
 * @param {string} hint — text gợi ý nhỏ bên dưới
 */
const Input = forwardRef(function Input(
  { label, error, icon, hint, className = '', id, style, ...rest },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#475569',
            display: 'block',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748B',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={className}
          style={{
            width: '100%',
            borderRadius: 10,
            fontSize: '0.875rem',
            color: '#0F172A',
            background: '#FFFFFF',
            border: `1px solid ${error ? '#EF4444' : '#CBD5E1'}`,
            padding: icon ? '10px 14px 10px 40px' : '10px 14px',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            ...style,
          }}
          onFocus={e => {
            e.target.style.borderColor = error ? '#EF4444' : '#10B981';
            e.target.style.boxShadow = error
              ? '0 0 0 3px rgba(239,68,68,0.15)'
              : '0 0 0 3px rgba(16,185,129,0.12)';
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? '#EF4444' : '#CBD5E1';
            e.target.style.boxShadow = 'none';
          }}
          {...rest}
        />
      </div>
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: 0 }}>{error}</p>
      )}
      {hint && !error && (
        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>{hint}</p>
      )}
    </div>
  );
});

export default Input;
