import { forwardRef } from 'react';

/**
 * Select form control chuẩn
 * @param {string} label
 * @param {{value: string|number, label: string}[]} options
 * @param {string} error
 * @param {string} placeholder — option trống đầu tiên
 */
const Select = forwardRef(function Select(
  { label, options = [], error, placeholder, className = '', id, style, ...rest },
  ref
) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          htmlFor={selectId}
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
        <select
          ref={ref}
          id={selectId}
          className={className}
          style={{
            width: '100%',
            borderRadius: 10,
            fontSize: '0.875rem',
            color: '#0F172A',
            background: '#FFFFFF',
            border: `1px solid ${error ? '#EF4444' : '#CBD5E1'}`,
            padding: '10px 36px 10px 14px',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            cursor: 'pointer',
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
        >
          {placeholder && (
            <option value="" style={{ background: '#FFFFFF', color: '#64748B' }}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ background: '#FFFFFF', color: '#0F172A' }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <span
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: 0 }}>{error}</p>
      )}
    </div>
  );
});

export default Select;
