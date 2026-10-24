/**
 * Card component — khung card chuẩn với glassmorphism
 * 100% inline styles, không phụ thuộc Tailwind scan
 * @param {'none'|'sm'|'md'|'lg'} padding
 * @param {boolean} glow — thêm glow effect màu teal
 * @param {boolean} hoverable — thêm hover lift effect
 */
export default function Card({
  children,
  className = '',
  padding = 'md',
  glow = false,
  hoverable = false,
  style,
  ...rest
}) {
  const paddings = { none: 0, sm: 16, md: 20, lg: 24 };
  const pad = paddings[padding] ?? paddings.md;

  const baseStyle = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    boxShadow: glow
      ? '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(16,185,129,0.2)'
      : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
    padding: pad === 0 ? undefined : pad,
    transition: hoverable ? 'transform 0.2s, box-shadow 0.2s' : undefined,
    cursor: hoverable ? 'pointer' : undefined,
    ...style,
  };

  return (
    <div
      className={className}
      style={baseStyle}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)';
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = glow
          ? '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(16,185,129,0.2)'
          : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)';
      } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
