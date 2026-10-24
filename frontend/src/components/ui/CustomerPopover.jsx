import { useState, useRef, useEffect } from 'react';
import { Phone, Mail, MapPin, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { customersAPI } from '../../api';

/**
 * Determine customer tier based on bookings count and spent
 * Thresholds: VIP (>= 500k VNĐ or >= 3 bookings), Loyal (>= 2 bookings), New (0-1 booking)
 */
export function getCustomerTier(stats) {
  const total = stats?.total || stats?.booking_count || 0;
  const spent = stats?.totalSpent || stats?.total_spent || 0;

  if (spent >= 500000 || total >= 3) {
    return { id: 'vip', label: 'Khách VIP', icon: '👑', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
  }
  if (total >= 2) {
    return { id: 'loyal', label: 'Thân thiết', icon: '⭐', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
  }
  return { id: 'new', label: 'Khách mới', icon: '👤', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
}

export default function CustomerPopover({
  customer,
  customerId,
  children,
  trigger = 'hover', // 'hover' | 'click'
  align = 'top',    // 'top' | 'bottom'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(customer || null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  // Sync incoming customer prop
  useEffect(() => {
    if (customer) {
      setData(customer);
      if (customer.bookings) {
        const valid = customer.bookings.filter(b => b.status !== 'cancelled');
        setStats({
          total: customer.bookings.length,
          totalSpent: valid.reduce((sum, b) => sum + (b.total_amount || 0), 0)
        });
      }
    }
  }, [customer]);

  const loadDetails = async () => {
    const targetId = customer?.id || customerId;
    if (!targetId || stats) return;
    setLoading(true);
    try {
      const res = await customersAPI.getOne(targetId);
      setData(res);
      const bookings = res.bookings || [];
      const valid = bookings.filter(b => b.status !== 'cancelled');
      setStats({
        total: bookings.length,
        totalSpent: valid.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      });
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsOpen(true);
        loadDetails();
      }, 150);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 200);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const next = !isOpen;
    setIsOpen(next);
    if (next) loadDetails();
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const tier = getCustomerTier(stats || { total: 0, totalSpent: 0 });

  return (
    <div 
      className="relative inline-flex items-center" 
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={trigger === 'click' ? handleClick : undefined}
      onFocus={() => { setIsOpen(true); loadDetails(); }}
      onBlur={() => {
        timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
      }}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {children}

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            zIndex: 999,
            width: '280px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            padding: '1rem',
            animation: 'fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'auto',
            textAlign: 'left',
            ...(align === 'top' 
              ? { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }
              : { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }
            )
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: 700 }}>
              {data?.full_name || 'Khách hàng'}
            </strong>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: tier.bg,
              color: tier.color,
              border: `1px solid ${tier.border}`
            }}>
              <span>{tier.icon}</span>
              <span>{tier.label}</span>
            </span>
          </div>

          {/* Contact details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: '#475569', marginBottom: '0.75rem' }}>
            {data?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{data.phone}</span>
              </div>
            )}
            {data?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} style={{ color: '#3B82F6', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.email}</span>
              </div>
            )}
            {data?.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} style={{ color: '#F59E0B', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.address}</span>
              </div>
            )}
          </div>

          {/* Metrics summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            padding: '0.5rem 0.625rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid #F1F5F9',
            fontSize: '0.75rem'
          }}>
            <div>
              <div style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Calendar size={11} /> Tổng đơn
              </div>
              <strong style={{ color: '#0F172A', fontSize: '0.85rem' }}>
                {loading ? '...' : `${stats?.total ?? 0} lượt`}
              </strong>
            </div>

            <div>
              <div style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <CreditCard size={11} /> Đã chi trả
              </div>
              <strong style={{ color: '#059669', fontSize: '0.85rem' }}>
                {loading ? '...' : `${new Intl.NumberFormat('vi-VN').format(stats?.totalSpent ?? 0)}đ`}
              </strong>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '0.7rem', color: '#94A3B8' }}>
            <Sparkles size={11} style={{ marginRight: '3px', color: '#8B5CF6' }} />
            <span>Xác minh theo dữ liệu thật</span>
          </div>
        </div>
      )}
    </div>
  );
}
