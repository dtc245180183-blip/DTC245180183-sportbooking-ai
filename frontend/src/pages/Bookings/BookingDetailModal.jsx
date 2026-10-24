import { useState } from 'react';
import { X, Copy, CheckCircle, Sparkles, RefreshCw } from 'lucide-react';
import { aiAPI } from '../../api';
import AICard from '../../components/AICard';
import { Button, Badge } from '../../components/ui';

const STATUS_MAP = {
  pending:   { label: 'Chờ xử lý',  color: '#f59e0b', status: 'pending'   },
  confirmed: { label: 'Đã xác nhận', color: '#22c55e', status: 'confirmed' },
  cancelled: { label: 'Đã hủy',      color: '#ef4444', status: 'cancelled' },
  completed: { label: 'Hoàn thành',  color: '#3b82f6', status: 'completed' },
};

/**
 * Modal chi tiết booking + 2 nút AI sinh tin nhắn (AI-2)
 * Props:
 *   booking: object
 *   onClose: fn
 *   onRefund: fn
 */
export default function BookingDetailModal({ booking, onClose, onRefund }) {
  const [aiMessage, setAiMessage]   = useState('');
  const [aiMsgType, setAiMsgType]   = useState('');
  const [aiLoading, setAiLoading]   = useState(null); // 'confirmation' | 'reminder' | null
  const [aiError, setAiError]       = useState('');
  const [copied, setCopied]         = useState(false);

  if (!booking) return null;

  const st     = booking.time_slot;
  const cust   = booking.customer;
  const court  = booking.court;
  const status = STATUS_MAP[booking.status] || STATUS_MAP.pending;

  const isConfirmDisabled  = ['cancelled', 'completed'].includes(booking.status);
  const isReminderDisabled = booking.status !== 'confirmed';

  const handleGenerateMessage = async (messageType) => {
    setAiLoading(messageType);
    setAiMessage(''); setAiMsgType(''); setAiError(''); setCopied(false);
    try {
      const res = await aiAPI.generateMessage(`${booking.id}?message_type=${messageType}`);
      setAiMessage(res.message);
      setAiMsgType(messageType);
    } catch (err) {
      setAiError(err.response?.data?.detail || 'Lỗi không xác định khi gọi AI.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 2000,
               display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
               backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Modal — Enterprise Light */}
      <div
        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0',
                 borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh',
                 overflow: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1.25rem 1.5rem',
                      borderBottom: '1px solid #E2E8F0',
                      background: '#FFFFFF' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            Chi tiết Lịch đặt <span style={{ color: '#059669' }}>#{booking.id}</span>
          </h3>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, borderRadius: 6 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Thông tin booking */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <InfoRow label="Khách hàng"    value={cust?.full_name || `KH#${booking.customer_id}`} />
            <InfoRow label="Số điện thoại" value={cust?.phone || '—'} />
            <InfoRow label="Sân"           value={court?.name || `Sân#${booking.court_id}`} />
            <InfoRow label="Ngày chơi"     value={st?.date || '—'} />
            <InfoRow label="Giờ"           value={st ? `${String(st.start_time).slice(0,5)} – ${String(st.end_time).slice(0,5)}` : '—'} />
            <InfoRow label="Trạng thái"    value={<Badge status={status.status} label={status.label} />} />
            <InfoRow label="Tiền cọc"      value={
              (() => {
                const hasRefund = booking.payments?.some(p => p.status === 'refunded');
                const refundPayment = booking.payments?.find(p => p.status === 'refunded');
                const dep = (booking.deposit_amount && booking.deposit_amount > 0)
                  ? booking.deposit_amount
                  : (refundPayment?.amount || 0);

                if (dep <= 0) return <span style={{ color: '#64748B' }}>0đ (Không có cọc)</span>;

                if (booking.status === 'cancelled') {
                  if (hasRefund) {
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ textDecoration: 'line-through', color: '#94A3B8', fontWeight: 600 }}>
                          {dep.toLocaleString('vi-VN')}đ
                        </span>
                        <Badge status="completed" label="Đã hoàn cọc" />
                      </div>
                    );
                  }
                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#D97706', fontWeight: 700 }}>{dep.toLocaleString('vi-VN')}đ</span>
                        <span style={{
                          fontSize: '0.72rem',
                          color: '#B45309',
                          background: '#FEF3C7',
                          border: '1px solid #FDE68A',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: 600
                        }}>
                          Cọc giữ lại
                        </span>
                      </div>
                      {onRefund && (
                        <div style={{ marginTop: 6 }}>
                          <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />}
                            style={{ color: '#0284C7', borderColor: '#BAE6FD', background: '#F0F9FF', fontSize: '0.75rem', padding: '2px 8px' }}
                            onClick={() => onRefund(booking)}>
                            Hoàn cọc cho khách
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                }
                return `${dep.toLocaleString('vi-VN')}đ`;
              })()
            } />
            <InfoRow label="Tổng tiền"     value={
              (() => {
                const total = booking.total_amount || 0;
                if (booking.status === 'cancelled') {
                  const hasRefund = booking.payments?.some(p => p.status === 'refunded');
                  const refundPayment = booking.payments?.find(p => p.status === 'refunded');
                  const dep = (booking.deposit_amount && booking.deposit_amount > 0)
                    ? booking.deposit_amount
                    : (refundPayment?.amount || 0);

                  if (dep > 0 && !hasRefund) {
                    return (
                      <div>
                        <span style={{ color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600, marginRight: 8 }}>
                          {total.toLocaleString('vi-VN')}đ
                        </span>
                        <span style={{ color: '#D97706', fontWeight: 700 }}>
                          (Thu cọc: {dep.toLocaleString('vi-VN')}đ)
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div>
                      <span style={{ color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                        {total.toLocaleString('vi-VN')}đ
                      </span>
                      <span style={{ marginLeft: 6, fontSize: '0.78rem', color: '#94A3B8', fontWeight: 500 }}>
                        (Thu 0đ)
                      </span>
                    </div>
                  );
                }
                return <span style={{ color: '#059669', fontWeight: 700 }}>{total.toLocaleString('vi-VN')}đ</span>;
              })()
            } />
            {booking.note && <InfoRow label="Ghi chú" value={booking.note} style={{ gridColumn: '1 / -1' }} />}
          </div>

          {/* Phần AI */}
          <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '1.25rem' }}>
            <p style={{ margin: '0 0 0.875rem 0', fontSize: '0.8rem', fontWeight: 700,
                        color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.08em',
                        display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} />
              Trợ lý AI – Sinh tin nhắn
            </p>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <Button
                variant="ai"
                size="sm"
                icon={<Sparkles size={13} />}
                disabled={isConfirmDisabled || aiLoading !== null}
                onClick={() => handleGenerateMessage('confirmation')}
                title={isConfirmDisabled ? 'Không thể sinh tin nhắn xác nhận cho booking đã hủy/hoàn tất' : ''}
              >
                {aiLoading === 'confirmation' ? 'Đang sinh...' : 'Tin xác nhận'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles size={13} />}
                style={{ borderColor: '#CBD5E1', color: '#4F46E5' }}
                disabled={isReminderDisabled || aiLoading !== null}
                onClick={() => handleGenerateMessage('reminder')}
                title={isReminderDisabled ? 'Chỉ nhắc lịch cho booking đã xác nhận' : ''}
              >
                {aiLoading === 'reminder' ? 'Đang sinh...' : 'Tin nhắc lịch'}
              </Button>
            </div>

            {/* AICard kết quả */}
            {(aiLoading !== null || aiMessage || aiError) && (
              <AICard
                loading={aiLoading !== null}
                title={aiMsgType === 'reminder' ? 'Tin nhắn Nhắc lịch' : 'Tin nhắn Xác nhận'}
                error={aiError}
              >
                {aiMessage && (
                  <>
                    <p className="ai-card-text">{aiMessage}</p>
                    <button className={`ai-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                      {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                      {copied ? 'Đã sao chép!' : 'Sao chép tin nhắn'}
                    </button>
                  </>
                )}
              </AICard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function InfoRow({ label, value, style }) {
  return (
    <div style={style}>
      <div style={{ fontSize: '0.73rem', color: '#64748B', marginBottom: 3, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>
        {value}
      </div>
    </div>
  );
}
