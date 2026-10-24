import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Send, Copy, Check, ExternalLink, MessageSquare, Zap } from 'lucide-react';
import { aiAPI } from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Floating AI Chat Bubble — fixed bottom-right, dùng Portal
 * Hiện ở mọi trang trong layout ProtectedRoute
 */
export default function AIFloatingButton() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [open,    setOpen]    = useState(false);
  const [tab,     setTab]     = useState(isAdmin ? 'links' : 'message'); // 'message' | 'links'
  const [bookingId, setBookingId] = useState('');
  const [msgType, setMsgType] = useState('confirmation');
  const [result,  setResult]  = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const inputRef = useRef(null);

  // Cập nhật tab khi role thay đổi
  useEffect(() => {
    if (isAdmin) setTab('links');
  }, [isAdmin]);

  // Focus input khi mở tab message
  useEffect(() => {
    if (open && tab === 'message') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, tab]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!bookingId) return;
    setLoading(true); setError(''); setResult('');
    try {
      const data = await aiAPI.generateMessage(parseInt(bookingId) + `?message_type=${msgType}`);
      setResult(data.message);
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể tạo tin nhắn. Kiểm tra Booking ID.');
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggle = () => {
    setOpen(v => !v);
    if (!open) { setResult(''); setError(''); }
  };

  const panel = (
    <>
      <style>{`
        @keyframes aiBubbleIn {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes aiBubblePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.5); }
          50%       { box-shadow: 0 0 0 10px rgba(139,92,246,0); }
        }
      `}</style>

      {/* ── Floating Button ── */}
      <button
        onClick={toggle}
        title="Trợ lý AI"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 8000,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: open
            ? 'linear-gradient(135deg,#4c1d95,#7c3aed)'
            : 'linear-gradient(135deg,#7c3aed,#a855f7)',
          boxShadow: open
            ? '0 8px 30px rgba(124,58,237,0.5)'
            : '0 4px 20px rgba(124,58,237,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          animation: open ? 'none' : 'aiBubblePulse 2.5s ease-in-out infinite',
          transform: open ? 'rotate(0deg) scale(1)' : 'scale(1)',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {open
          ? <X size={20} color="#fff" />
          : <Sparkles size={22} color="#fff" />
        }
      </button>

      {/* ── Panel trượt lên ── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 92,
            right: 28,
            zIndex: 7999,
            width: 340,
            borderRadius: 16,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            animation: 'aiBubbleIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '0.875rem 1rem 0.75rem',
            background: '#F5F3FF',
            borderBottom: '1px solid #EDE9FE',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>Trợ lý AI</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#6366F1', fontWeight: 500 }}>Powered by Gemini</p>
            </div>
            <Link
              to="/ai-assistant"
              title="Mở trang AI đầy đủ"
              style={{ marginLeft: 'auto', color: '#6366F1', display: 'flex', alignItems: 'center' }}
              onClick={() => setOpen(false)}
            >
              <ExternalLink size={15} />
            </Link>
          </div>

          {/* Tabs: Staff có 2 tab, Admin chỉ có tab Tiện ích */}
          {!isAdmin && (
            <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9' }}>
              {[
                { key: 'message', icon: <MessageSquare size={13} />, label: 'Tạo tin nhắn (UC-11)' },
                { key: 'links',   icon: <Zap size={13} />,           label: 'Tính năng AI' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  flex: 1, padding: '0.55rem', border: 'none', cursor: 'pointer',
                  background: tab === t.key ? '#F5F3FF' : 'transparent',
                  color: tab === t.key ? '#4F46E5' : '#64748B',
                  fontSize: '0.76rem', fontWeight: tab === t.key ? 600 : 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  borderBottom: tab === t.key ? '2px solid #6366F1' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab: Tạo tin nhắn (Chỉ dành cho Nhân viên Staff) */}
          {!isAdmin && tab === 'message' && (
            <div style={{ padding: '0.875rem' }}>
              <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <input
                  ref={inputRef}
                  type="number"
                  placeholder="Nhập Booking ID (vd: 5)"
                  value={bookingId}
                  min={1}
                  onChange={e => setBookingId(e.target.value)}
                  required
                  style={{
                    width: '100%', background: '#FFFFFF',
                    border: '1px solid #CBD5E1', borderRadius: 8,
                    color: '#0F172A', padding: '8px 12px', fontSize: '0.85rem',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#6366F1'; }}
                  onBlur={e =>  { e.target.style.borderColor = '#CBD5E1'; }}
                />
                <select
                  value={msgType}
                  onChange={e => setMsgType(e.target.value)}
                  style={{
                    width: '100%', background: '#FFFFFF',
                    border: '1px solid #CBD5E1', borderRadius: 8,
                    color: '#0F172A', padding: '8px 12px', fontSize: '0.85rem',
                    boxSizing: 'border-box', outline: 'none',
                  }}
                >
                  <option value="confirmation">Xác nhận đặt sân</option>
                  <option value="reminder">Nhắc lịch sắp tới</option>
                </select>
                <button type="submit" disabled={loading || !bookingId} style={{
                  width: '100%', padding: '8px', borderRadius: 8, border: 'none',
                  background: loading || !bookingId
                    ? '#E2E8F0'
                    : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  color: loading || !bookingId ? '#94A3B8' : '#fff',
                  cursor: loading || !bookingId ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}>
                  {loading
                    ? 'Đang tạo...'
                    : <><Send size={13} /> Tạo tin nhắn</>
                  }
                </button>
              </form>

              {/* Kết quả */}
              {error && (
                <div style={{ marginTop: '0.625rem', padding: '0.625rem', background: '#FEF2F2',
                              border: '1px solid #FECACA', borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#DC2626' }}>{error}</p>
                </div>
              )}
              {result && (
                <div style={{ marginTop: '0.625rem', padding: '0.75rem',
                              background: '#F8FAFC', border: '1px solid #E2E8F0',
                              borderRadius: 8, maxHeight: 180, overflowY: 'auto' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#1E293B',
                               whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{result}</p>
                  <button onClick={handleCopy} style={{
                    background: copied ? '#DCFCE7' : '#FFFFFF',
                    border: `1px solid ${copied ? '#BBF7D0' : '#CBD5E1'}`,
                    color: copied ? '#15803D' : '#475569',
                    borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                    fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}>
                    {copied ? <><Check size={11} /> Đã sao chép!</> : <><Copy size={11} /> Sao chép</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab: Links tính năng AI (Phân tách theo Actor) */}
          {(isAdmin || tab === 'links') && (
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(isAdmin ? [
                { to: '/ai-assistant', icon: '📈', title: 'Phân tích công suất AI (UC-12)', desc: 'Tóm tắt công suất & gợi ý khuyến mại' },
                { to: '/reports',      icon: '📊', title: 'Báo cáo & Thống kê AI',         desc: 'Xem báo cáo doanh thu & tỷ lệ lấp đầy' },
              ] : [
                { to: '/schedule',     icon: '📅', title: 'Gợi ý khung giờ AI (UC-10)',   desc: 'Dùng nút "Nhờ AI gợi ý" ở trang Lịch' },
                { to: '/ai-assistant', icon: '✨', title: 'Soạn tin nhắn khách (UC-11)',   desc: 'Xác nhận & nhắc lịch tự động' },
              ]).map(item => (
                <Link key={item.to + item.title} to={item.to} onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '0.625rem 0.75rem', borderRadius: 8,
                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}>{item.title}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>{item.desc}</p>
                    </div>
                    <ExternalLink size={12} color="#64748B" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '0.5rem 0.875rem', borderTop: '1px solid #F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
              Gemini AI — SportBooking Pro
            </span>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(panel, document.body);
}
