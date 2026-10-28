import { useState, useEffect } from 'react';
import { X, Sparkles, Clock, AlertCircle, Info, RefreshCw, Lock } from 'lucide-react';
import { aiAPI, courtTypesAPI } from '../../api';
import AICard from '../../components/AICard';
import { Button, Input, Select } from '../../components/ui';
import { todayVN } from '../../utils/datetime';

/**
 * Modal AI gợi ý khung giờ trống (AI-1)
 * Props:
 *   isOpen: bool
 *   onClose: fn
 *   onSelectSlot: fn({ court_id, time_slot_id, date, court_name, start_time, end_time })
 *     -> callback điền sẵn form đặt sân chính
 */
export default function AISuggestModal({ isOpen, onClose, onSelectSlot }) {
  const [courtTypes, setCourtTypes] = useState([]);
  const [form, setForm] = useState(() => ({
    court_type_id: '',
    preferred_date: todayVN(),
    preferred_start_time: '',
    preferred_end_time: '',
  }));

  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null); // { suggestions_text, matched_slots, message, is_fallback }
  const [aiError, setAiError]   = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setAiError('');
    setIsRetrying(false);
    courtTypesAPI.getAll().then(data => {
      setCourtTypes(data);
      if (data.length > 0) setForm(f => ({ ...f, court_type_id: String(data[0].id) }));
    }).catch(() => {});
  }, [isOpen]);

  const executeSearch = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setAiError('');
    try {
      const payload = {
        court_type_id: parseInt(form.court_type_id),
        preferred_date: form.preferred_date,
      };
      if (form.preferred_start_time) payload.preferred_start_time = form.preferred_start_time + ':00';
      if (form.preferred_end_time)   payload.preferred_end_time   = form.preferred_end_time   + ':00';
      const data = await aiAPI.suggestSlot(payload);
      setResult(data);
    } catch (err) {
      let msg = 'Chưa thể lấy gợi ý khung giờ lúc này. Vui lòng thử lại.';
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string' && detail.trim() && !detail.includes('<html') && !detail.toLowerCase().includes('status code') && !detail.toLowerCase().includes('504')) {
        msg = detail;
      }
      setAiError(msg);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsRetrying(false);
    executeSearch();
  };

  const handleRetry = () => {
    setIsRetrying(true);
    executeSearch();
  };

  const handleSelectSlot = (slot) => {
    onSelectSlot({
      slot_id:    slot.slot_id,
      court_name: slot.court_name,
      start_time: slot.start_time,
      end_time:   slot.end_time,
      preferred_date: form.preferred_date,
    });
    onClose();
  };

  if (!isOpen) return null;

  const hasResult = result !== null;
  const isEmpty   = hasResult && result.matched_slots.length === 0 && (!result.booked_slots || result.booked_slots.length === 0) && !result.suggestions_text;

  return (
    /* Backdrop */
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 2000,
               display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      {/* Modal container — Modern Enterprise Light Mode */}
      <div
        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0',
                 borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh',
                 overflow: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1.25rem 1.5rem',
                      borderBottom: '1px solid #E2E8F0',
                      background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: '#4F46E5', fontWeight: 700, fontSize: '1.05rem' }}>
            <Sparkles size={20} style={{ color: '#6366F1' }} />
            Trợ lý AI Gợi ý Khung giờ
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B',
                     padding: 6, borderRadius: 8, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.background = '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'none'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Form ── */}
        <div style={{ padding: '1.5rem' }}>
          {/* Quick Prompt Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gợi ý nhanh:
            </span>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, preferred_start_time: '17:00', preferred_end_time: '21:00' }))}
              style={{
                background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 999,
                padding: '4px 10px', fontSize: '0.76rem', color: '#7C3AED', fontWeight: 600, cursor: 'pointer'
              }}
            >
              ⚡ 3 khung giờ tối đẹp nhất (17h-21h)
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, preferred_start_time: '06:00', preferred_end_time: '09:00' }))}
              style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 999,
                padding: '4px 10px', fontSize: '0.76rem', color: '#059669', fontWeight: 600, cursor: 'pointer'
              }}
            >
              ⚡ Sáng sớm (6h-9h)
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Select
                  label="Loại sân"
                  value={form.court_type_id}
                  options={courtTypes.map(ct => ({ value: ct.id, label: ct.name }))}
                  onChange={e => setForm(f => ({ ...f, court_type_id: e.target.value }))}
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Input
                  label="Ngày mong muốn"
                  type="date"
                  value={form.preferred_date}
                  min={todayVN()}
                  onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                                letterSpacing: '0.05em', color: '#475569', display: 'block', marginBottom: 6 }}>
                  Khoảng giờ mong muốn (không bắt buộc)
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Input type="time" value={form.preferred_start_time}
                    onChange={e => setForm(f => ({ ...f, preferred_start_time: e.target.value }))}
                    placeholder="Từ giờ" />
                  <span style={{ color: '#64748B', fontSize: '0.9rem', flexShrink: 0, fontWeight: 500 }}>đến</span>
                  <Input type="time" value={form.preferred_end_time}
                    onChange={e => setForm(f => ({ ...f, preferred_end_time: e.target.value }))}
                    placeholder="Đến giờ" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={<Sparkles size={16} />}
              style={{ width: '100%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}
            >
              {loading ? 'AI đang phân tích khung giờ trống...' : 'Tìm gợi ý AI'}
            </Button>
          </form>

          {/* ── Thông báo đang thử lại ── */}
          {isRetrying && loading && (
            <div style={{
              marginTop: '1rem',
              padding: '0.625rem 0.875rem',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              color: '#1D4ED8',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span className="ai-spinner" style={{ width: 14, height: 14 }} />
              <span>Hệ thống đang thử lại tìm kiếm khung giờ...</span>
            </div>
          )}

          {/* ── Thông báo lỗi và nút thử lại ── */}
          {aiError && !loading && (
            <div style={{
              marginTop: '1rem',
              padding: '0.875rem 1rem',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B91C1C', fontSize: '0.875rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{aiError}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          )}

          {/* ── Kết quả ── */}
          {(loading || hasResult) && (
            <div style={{ marginTop: '1.5rem' }}>
              {result?.is_fallback && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '8px',
                  color: '#92400E',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  lineHeight: 1.5
                }}>
                  <Info size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#B45309', display: 'block', marginBottom: '2px' }}>
                      Gợi ý dự phòng từ hệ thống:
                    </strong>
                    Dịch vụ AI phản hồi chậm hoặc tạm thời gián đoạn. Các khung giờ dưới đây là gợi ý dự phòng được rà soát trực tiếp từ các khung giờ thực tế đang còn trống trong cơ sở dữ liệu.
                  </div>
                </div>
              )}

              <AICard loading={loading} title={result?.is_fallback ? 'Gợi ý dự phòng từ hệ thống' : 'Gợi ý từ Trợ lý AI'}>
                {hasResult && (
                  <>
                    {isEmpty ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748B' }}>
                        <Sparkles size={32} style={{ color: '#8B5CF6', marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                        <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>{result.message || 'Hiện không còn khung giờ trống phù hợp.'}</p>
                      </div>
                    ) : (
                      <>
                        {result.suggestions_text && (
                          <p className="ai-card-text" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed #E2E8F0', color: '#1E293B', fontSize: '0.92rem', lineHeight: 1.6 }}>
                            {result.suggestions_text}
                          </p>
                        )}

                        {result.matched_slots.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 700,
                                        color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Sparkles size={13} style={{ color: '#6366F1' }} /> Các khung giờ phù hợp
                            </p>
                            {result.matched_slots.map(slot => (
                              <div key={slot.slot_id}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                         background: '#FAF5FF',
                                         border: '1px solid #E9D5FF',
                                         borderRadius: 12, padding: '0.875rem 1rem',
                                         boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                         transition: 'border-color 0.15s' }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>
                                    {slot.court_name}
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: '#4F46E5', marginTop: 3, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={13} style={{ color: '#6366F1' }} /> {slot.start_time} – {slot.end_time}
                                    <span style={{ color: '#CBD5E1' }}>·</span>
                                    <span style={{ color: '#059669', fontWeight: 600 }}>
                                      {new Intl.NumberFormat('vi-VN').format(slot.price)}đ/h
                                    </span>
                                  </div>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleSelectSlot(slot)}
                                  style={{ flexShrink: 0, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                                  Đặt ngay
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 🔒 Danh sách các khung giờ đã có người đặt */}
                        {result.booked_slots && result.booked_slots.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: result.matched_slots.length > 0 ? '1.25rem' : '0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 0.35rem 0' }}>
                              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700,
                                          color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Lock size={13} style={{ color: '#EF4444' }} /> Khung giờ đã có người đặt
                              </p>
                              <span style={{ fontSize: '0.72rem', color: '#991B1B', background: '#FEE2E2', border: '1px solid #FECACA', padding: '1px 8px', borderRadius: 999, fontWeight: 700 }}>
                                {result.booked_slots.length} khung giờ đã kín
                              </span>
                            </div>

                            {result.booked_slots.map((b, idx) => (
                              <div key={b.slot_id || idx}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                         background: '#FFF5F5',
                                         border: '1px solid #FED7D7',
                                         borderRadius: 12, padding: '0.75rem 1rem',
                                         boxShadow: '0 1px 2px rgba(220, 38, 38, 0.04)' }}>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{b.court_name}</span>
                                    <span style={{ fontSize: '0.68rem', background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                      🔒 Đã đặt
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.82rem', color: '#7F1D1D', marginTop: 4, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                      <Clock size={13} style={{ color: '#DC2626' }} /> {b.start_time} – {b.end_time}
                                    </span>
                                    <span style={{ color: '#FCA5A5' }}>·</span>
                                    <span>Khách đặt: <strong style={{ color: '#991B1B' }}>{b.customer_name || 'Khách'}</strong></span>
                                    {b.booking_id && (
                                      <span style={{ background: '#FFFFFF', border: '1px solid #FCA5A5', padding: '1px 5px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
                                        #{b.booking_id}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: '#DC2626',
                                    background: '#FFFFFF',
                                    border: '1px solid #FCA5A5',
                                    borderRadius: 6,
                                    padding: '3px 8px',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    Đã có khách
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </AICard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
