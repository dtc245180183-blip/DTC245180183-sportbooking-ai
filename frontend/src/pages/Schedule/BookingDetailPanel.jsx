import { useState, useEffect } from 'react';
import { X, Calendar, User, Clock, Phone, Sparkles, Copy, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { bookingsAPI, aiAPI } from '../../api';
import RescheduleModal from './RescheduleModal';
import { useToast } from '../../components/ui/Toast';
import './Schedule.css';

export default function BookingDetailPanel({ isOpen, onClose, slot, court, courts, onStatusChange }) {
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  useEffect(() => {
    if (isOpen && slot && slot.status === 'booked') {
      fetchBookingDetails();
    }
  }, [isOpen, slot]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    setError('');
    setAiMessage('');
    setCopied(false);
    try {
      const dayBookings = await bookingsAPI.getAll({ date_from: slot.date, date_to: slot.date, limit: 1000 });
      const foundBooking = dayBookings.find(b => b.time_slot_id === slot.id && b.status !== 'cancelled');
      
      if (foundBooking) {
        setBooking(foundBooking);
      } else {
        setError('Không tìm thấy thông tin đặt sân cho khung giờ này.');
      }
    } catch (err) {
      setError('Lỗi tải thông tin: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch này?')) return;
    setCancelling(true);
    try {
      await bookingsAPI.cancel(booking.id);
      onStatusChange();
      onClose();
    } catch (err) {
      showToast({ type: 'error', message: 'Lỗi hủy lịch: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setCancelling(false);
    }
  };

  const handleGenerateMessage = async (type = 'confirmation') => {
    if (!booking) return;
    setGeneratingAI(true);
    setAiMessage('');
    setCopied(false);
    try {
      const res = await aiAPI.generateMessage(booking.id + `?message_type=${type}`);
      setAiMessage(res.message);
    } catch (err) {
      showToast({ type: 'error', message: 'Lỗi sinh tin nhắn AI: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRescheduleSuccess = () => {
    setIsRescheduleOpen(false);
    onStatusChange();
    onClose();
  };

  if (!isOpen || !slot || !court) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Chi tiết Đặt sân</h2>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
          
          <div className="modal-body">
            {loading ? (
              <p>Đang tải thông tin...</p>
            ) : error ? (
              <div className="error-message" style={{ color: 'var(--danger-color)' }}>{error}</div>
            ) : booking ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{court.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <Calendar size={14} /> {slot.date}
                      <Clock size={14} style={{ marginLeft: '0.5rem' }} /> {String(slot.start_time).substring(0,5)} - {String(slot.end_time).substring(0,5)}
                    </div>
                  </div>
                  <div className={`status-badge ${booking.status}`}>
                    {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Thông tin khách hàng</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={14} className="text-secondary" /> <b>{booking.customer?.full_name || 'Khách hàng ID ' + booking.customer_id}</b></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} className="text-secondary" /> {booking.customer?.phone || 'N/A'}</div>
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Thanh toán</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-secondary">Tổng tiền:</span>
                        {booking.status === 'cancelled' ? (
                          <span style={{ color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                            {new Intl.NumberFormat('vi-VN').format(booking.total_amount)}đ
                          </span>
                        ) : (
                          <b style={{ color: 'var(--primary-color)' }}>{new Intl.NumberFormat('vi-VN').format(booking.total_amount)}đ</b>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-secondary">Đã cọc:</span>
                        <b style={{ color: '#16A34A' }}>{new Intl.NumberFormat('vi-VN').format(booking.deposit_amount)}đ</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                        <span className="text-secondary">Còn lại:</span>
                        <b style={{ color: '#DC2626' }}>{new Intl.NumberFormat('vi-VN').format(booking.total_amount - booking.deposit_amount)}đ</b>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Section */}
                <div style={{ marginTop: '1rem', border: '1px solid #c4b5fd', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div style={{ background: 'rgba(124, 58, 237, 0.05)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #c4b5fd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7C3AED', fontWeight: 600, fontSize: '0.9rem' }}>
                      <Sparkles size={16} /> Trợ lý AI
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#7C3AED', borderColor: '#7C3AED' }} onClick={() => handleGenerateMessage('confirmation')} disabled={generatingAI}>
                        {generatingAI ? 'Đang tạo...' : 'Tạo TN xác nhận'}
                      </button>
                      <button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#7C3AED', borderColor: '#7C3AED' }} onClick={() => handleGenerateMessage('reminder')} disabled={generatingAI}>
                        {generatingAI ? 'Đang tạo...' : 'Tạo TN nhắc lịch'}
                      </button>
                    </div>
                  </div>
                  {aiMessage && (
                    <div style={{
                      padding: '1rem', position: 'relative',
                      background: '#F5F3FF',
                      border: '1px solid #DDD6FE',
                      borderRadius: 10,
                    }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap', paddingRight: '2rem',
                                  color: '#1E293B' }}>
                        {aiMessage}
                      </p>
                      <button
                        onClick={handleCopy}
                        title="Sao chép"
                        style={{ position: 'absolute', top: '0.75rem', right: '0.75rem',
                                 background: 'none', border: 'none', cursor: 'pointer',
                                 color: copied ? '#10b981' : '#64748B' }}
                      >
                        {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : null}
          </div>
          
          <div className="modal-footer">
            {booking && booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <>
                <button type="button" className="btn-outline" onClick={() => setIsRescheduleOpen(true)}>
                  <ArrowLeftRight size={16} style={{marginRight: 4}}/> Đổi lịch
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={cancelling}
                  style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', opacity: cancelling ? 0.6 : 1, cursor: cancelling ? 'not-allowed' : 'pointer' }}
                  onClick={handleCancelBooking}
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy lịch'}
                </button>
              </>
            )}
            <button type="button" className="btn-primary" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>

      <RescheduleModal 
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        booking={booking}
        courts={courts}
        onSuccess={handleRescheduleSuccess}
      />
    </>
  );
}
