import { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Info, RefreshCw, Lock, Clock } from 'lucide-react';
import { aiAPI, courtTypesAPI } from '../../api';
import AICard from '../../components/AICard';

export default function AISuggestModal({ isOpen, onClose, onSelectSlot }) {
  const [courtTypes, setCourtTypes] = useState([]);
  const [formData, setFormData] = useState({
    court_type_id: '',
    preferred_date: new Date().toISOString().split('T')[0],
    preferred_start_time: '',
    preferred_end_time: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCourtTypes();
      setResult(null);
      setError('');
      setIsRetrying(false);
    }
  }, [isOpen]);

  const loadCourtTypes = async () => {
    try {
      const data = await courtTypesAPI.getAll();
      setCourtTypes(data);
      if (data.length > 0 && !formData.court_type_id) {
        setFormData(p => ({ ...p, court_type_id: data[0].id }));
      }
    } catch (err) {
      console.error('Lỗi tải loại sân', err);
    }
  };

  const executeSearch = async () => {
    if (loading) return; // Ngăn gửi lặp request
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        court_type_id: parseInt(formData.court_type_id),
        preferred_date: formData.preferred_date,
      };
      if (formData.preferred_start_time) payload.preferred_start_time = formData.preferred_start_time + ':00';
      if (formData.preferred_end_time) payload.preferred_end_time = formData.preferred_end_time + ':00';

      const data = await aiAPI.suggestSlot(payload);
      setResult(data);
    } catch (err) {
      let msg = 'Chưa thể lấy gợi ý khung giờ lúc này. Vui lòng thử lại.';
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string' && detail.trim() && !detail.includes('<html') && !detail.toLowerCase().includes('status code') && !detail.toLowerCase().includes('504')) {
        msg = detail;
      }
      setError(msg);
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header" style={{ borderBottom: '1px solid #c4b5fd', background: 'rgba(124, 58, 237, 0.05)' }}>
          <h2 style={{ color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} /> AI Gợi ý Khung giờ
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          {/* Quick Prompt Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gợi ý nhanh:
            </span>
            <button
              type="button"
              onClick={() => setFormData(f => ({ ...f, preferred_start_time: '17:00', preferred_end_time: '21:00' }))}
              style={{
                background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 999,
                padding: '4px 10px', fontSize: '0.76rem', color: '#7C3AED', fontWeight: 600, cursor: 'pointer'
              }}
            >
              ⚡ 3 khung giờ tối đẹp nhất (17h-21h)
            </button>
            <button
              type="button"
              onClick={() => setFormData(f => ({ ...f, preferred_start_time: '06:00', preferred_end_time: '09:00' }))}
              style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 999,
                padding: '4px 10px', fontSize: '0.76rem', color: '#059669', fontWeight: 600, cursor: 'pointer'
              }}
            >
              ⚡ Sáng sớm (6h-9h)
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Loại sân</label>
              <select 
                className="input-field" 
                value={formData.court_type_id} 
                onChange={e => setFormData({...formData, court_type_id: e.target.value})}
                required
              >
                {courtTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Ngày mong muốn</label>
              <input 
                type="date" 
                className="input-field" 
                value={formData.preferred_date} 
                onChange={e => setFormData({...formData, preferred_date: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Từ giờ (Tùy chọn)</label>
              <input 
                type="time" 
                className="input-field" 
                value={formData.preferred_start_time} 
                onChange={e => setFormData({...formData, preferred_start_time: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Đến giờ (Tùy chọn)</label>
              <input 
                type="time" 
                className="input-field" 
                value={formData.preferred_end_time} 
                onChange={e => setFormData({...formData, preferred_end_time: e.target.value})}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  background: '#7C3AED',
                  borderColor: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="ai-spinner" style={{ width: 16, height: 16, borderTopColor: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }} />
                    <span>Đang tìm kiếm khung giờ trống...</span>
                  </>
                ) : (
                  'Tìm khung giờ trống'
                )}
              </button>
            </div>
          </form>

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

          {error && !loading && (
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
                <span>{error}</span>
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

          {result && (
            <div style={{ marginTop: '1.25rem' }}>
              {result.is_fallback && (
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

              <AICard title={result.is_fallback ? 'Gợi ý dự phòng từ hệ thống' : 'Gợi ý từ Trợ lý AI'}>
                <p style={{ margin: '0 0 1rem 0', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {result.suggestions_text || result.message}
                </p>
                
                {result.matched_slots && result.matched_slots.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.5rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#1E293B', letterSpacing: '0.04em', fontWeight: 700 }}>
                      CÁC KHUNG GIỜ PHÙ HỢP ({result.matched_slots.length} ca trống):
                    </strong>
                    {result.matched_slots.map(s => (
                      <div key={s.slot_id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#FFFFFF',
                        border: '1px solid #C7D2FE',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        padding: '0.875rem 1rem', borderRadius: '10px'
                      }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>{s.court_name}</span>
                          <span style={{ margin: '0 0.5rem', color: '#94A3B8' }}>·</span>
                          <span style={{ color: '#4338CA', fontWeight: 600, fontSize: '0.9rem' }}>{s.start_time} - {s.end_time}</span>
                          {s.price && (
                            <span style={{ marginLeft: '0.5rem', color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                              ({Number(s.price).toLocaleString()}đ/giờ)
                            </span>
                          )}
                        </div>
                        <button
                          style={{ padding: '6px 14px', background: '#6366F1', color: '#ffffff',
                                   border: 'none', borderRadius: 8,
                                   fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s' }}
                          onClick={() => { onSelectSlot(s.slot_id); onClose(); }}
                        >
                          Chọn đặt
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 🔒 Danh sách khung giờ đã có người đặt */}
                {result.booked_slots && result.booked_slots.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#DC2626', letterSpacing: '0.04em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Lock size={14} style={{ color: '#EF4444' }} /> KHUNG GIỜ ĐÃ CÓ NGƯỜI ĐẶT ({result.booked_slots.length} ca kín):
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#991B1B', background: '#FEE2E2', border: '1px solid #FECACA', padding: '1px 8px', borderRadius: 999, fontWeight: 700 }}>
                        Đã kín
                      </span>
                    </div>

                    {result.booked_slots.map((b, idx) => (
                      <div key={b.slot_id || idx} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#FFF5F5',
                        border: '1px solid #FED7D7',
                        boxShadow: '0 1px 3px rgba(220, 38, 38, 0.04)',
                        padding: '0.75rem 1rem', borderRadius: '10px'
                      }}>
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
                    ))}
                  </div>
                )}
              </AICard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
