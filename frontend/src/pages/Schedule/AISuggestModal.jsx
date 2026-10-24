import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) {
      loadCourtTypes();
      setResult(null);
      setError('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setError(err.response?.data?.detail || err.message || 'Lỗi khi gọi AI');
    } finally {
      setLoading(false);
    }
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
              <button type="submit" className="btn-primary" style={{ width: '100%', background: '#7C3AED', borderColor: '#7C3AED' }} disabled={loading}>
                {loading ? 'Đang phân tích...' : 'Tìm khung giờ trống'}
              </button>
            </div>
          </form>

          {error && <div className="error-message" style={{ color: 'var(--danger-color)' }}>{error}</div>}

          {result && (
            <AICard title="Gợi ý từ Trợ lý">
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
            </AICard>
          )}
        </div>
      </div>
    </div>
  );
}
