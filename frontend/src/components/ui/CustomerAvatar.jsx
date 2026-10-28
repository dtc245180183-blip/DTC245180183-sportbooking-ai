import { useState, useMemo } from 'react';
import { getCustomerTier } from './CustomerPopover';

export const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=160&h=160&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&h=160&q=80',
];

export function getDefaultAvatar(seed) {
  if (!seed) return DEFAULT_AVATARS[0];
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEFAULT_AVATARS.length;
  return DEFAULT_AVATARS[index];
}

const AVATAR_PALETTES = [
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  { bg: '#FFF7ED', text: '#EA580C', border: '#FFEDD5' },
  { bg: '#ECFEFF', text: '#0891B2', border: '#CFFAFE' },
  { bg: '#FDF2F8', text: '#DB2777', border: '#FCE7F3' },
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
  avatarUrl,
  src,
  customer,
  size = 40, 
  stats = null, 
  showBadge = false,
  className = '',
  style = {} 
}) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name || customer?.full_name);
  const palette = getPalette(name || customer?.full_name);
  const tier = stats ? getCustomerTier(stats) : null;

  // Resolved image URL
  const resolvedImg = useMemo(() => {
    if (src) return src;
    if (avatarUrl) return avatarUrl;
    if (customer?.avatar_url) return customer.avatar_url;
    // Tự động phân bổ ảnh đại diện chất lượng cao theo tên hoặc ID khách hàng
    const seed = customer?.id || customer?.phone || name || 'customer';
    return getDefaultAvatar(seed);
  }, [src, avatarUrl, customer, name]);

  const hasImage = Boolean(resolvedImg && !imgError);

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full font-semibold select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.38)),
        backgroundColor: palette.bg,
        color: palette.text,
        border: `2px solid ${palette.border}`,
        boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
        position: 'relative',
        flexShrink: 0,
        overflow: 'visible',
        ...style
      }}
      title={name || customer?.full_name || 'Khách hàng'}
    >
      {hasImage ? (
        <img
          src={resolvedImg}
          alt={name || customer?.full_name || 'Khách hàng'}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '9999px',
            display: 'block'
          }}
        />
      ) : (
        <span>{initials}</span>
      )}

      {showBadge && tier && (
        <span 
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: Math.max(16, Math.round(size * 0.42)),
            height: Math.max(16, Math.round(size * 0.42)),
            fontSize: Math.max(9, Math.round(size * 0.26)),
            borderRadius: '9999px',
            backgroundColor: tier.bg,
            border: `1.5px solid ${tier.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
            zIndex: 2,
          }}
          title={tier.label}
        >
          {tier.icon}
        </span>
      )}
    </div>
  );
}
