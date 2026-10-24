/**
 * Skeleton loading placeholder — dạng shimmer
 * @param {number} count — số dòng (dùng cho variant text)
 * @param {string} height — chiều cao (css value)
 * @param {string} width  — chiều rộng (css value, mặc định 100%)
 * @param {'text'|'rect'|'circle'} variant
 * @param {string} className
 */
export default function Skeleton({
  count = 1,
  height = '1rem',
  width = '100%',
  variant = 'rect',
  className = '',
}) {
  const base =
    'bg-slate-200 animate-pulse overflow-hidden relative ' +
    'before:absolute before:inset-0 ' +
    'before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent ' +
    'before:animate-[shimmer_1.6s_infinite]';

  const shapeClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded-md'
      : 'rounded-xl';

  const items = Array.from({ length: count });

  if (count === 1) {
    return (
      <div
        className={`${base} ${shapeClass} ${className}`}
        style={{ height, width }}
      />
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${base} ${shapeClass}`}
          style={{
            height,
            width: i === items.length - 1 ? '70%' : width,
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
