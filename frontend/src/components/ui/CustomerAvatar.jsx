import { getCustomerTier } from './CustomerPopover';

const AVATAR_PALETTES = [
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }, // emerald
  { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }, // blue
  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' }, // purple
  { bg: '#FFF7ED', text: '#EA580C', border: '#FFEDD5' }, // orange
  { bg: '#ECFEFF', text: '#0891B2', border: '#CFFAFE' }, // cyan
  { bg: '#FDF2F8', text: '#DB2777', border: '#FCE7F3' }, // pink
];

export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getPalette(name) {
  if (!name) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export default function CustomerAvatar({ 
  name, 
  size = 36, 
  stats = null, 
  showBadge = false,
  className = '',
  style = {} 
}) {
  const initials = getInitials(name);
  const palette = getPalette(name);
  const tier = stats ? getCustomerTier(stats) : null;

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full font-semibold select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.38)),
        backgroundColor: palette.bg,
        color: palette.text,
        border: `1.5px solid ${palette.border}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        ...style
      }}
      title={name || 'Khách hàng'}
    >
      <span>{initials}</span>

      {showBadge && tier && (
        <span 
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: Math.max(14, Math.round(size * 0.42)),
            height: Math.max(14, Math.round(size * 0.42)),
            fontSize: Math.max(8, Math.round(size * 0.26)),
            borderRadius: '9999px',
            backgroundColor: tier.bg,
            border: `1px solid ${tier.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
          title={tier.label}
        >
          {tier.icon}
        </span>
      )}
    </div>
  );
}
