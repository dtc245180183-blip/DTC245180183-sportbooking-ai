import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Send, MessageSquare, Copy, Check, ExternalLink,
  Clock, TrendingUp, Calendar, ShieldCheck
} from 'lucide-react';
import { aiAPI, courtTypesAPI, bookingsAPI } from '../../api';
import { Card, Button, Input } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import './AIAssistant.css';

export default function AIAssistant() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  /* ─────────────────────────────────────────────────────────────
     PHÂN HỆ ADMIN: CHỈ HIỂN THỊ DUY NHẤT UC-12 (TÓM TẮT CÔNG SUẤT)
     ───────────────────────────────────────────────────────────── */
  const todayStr = new Date().toISOString().slice(0, 10);
  const fourteenDaysAgo = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(fourteenDaysAgo);
  const [toDate, setToDate]     = useState(todayStr);
  const [preset, setPreset]     = useState('14');
  const [occLoading, setOccLoading] = useState(false);
  const [occSummary, setOccSummary] = useState('');
  const [occRawData, setOccRawData] = useState(null);
  const [occError, setOccError]     = useState('');
  const [occCopied, setOccCopied]   = useState(false);

  const applyPreset = (days) => {
    setPreset(String(days));
    const to = todayStr;
    const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
    setFromDate(from);
    setToDate(to);
  };

  const handleRunOccupancySummary = async () => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      showToast({ type: 'warning', message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' });
      return;
    }
    if (diffDays > 30) {
      showToast({ type: 'warning', message: 'Khoảng thời gian phân tích tối đa là 30 ngày (theo quy định hệ thống)' });
      return;
    }

    setOccLoading(true);
    setOccError('');
    setOccSummary('');
    setOccRawData(null);

    try {
      const data = await aiAPI.occupancySummary({ from_date: fromDate, to_date: toDate });
      setOccSummary(data.summary);
      setOccRawData(data.raw_data);
      showToast({ type: 'success', message: 'AI đã hoàn thành phân tích công suất!' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Không thể tạo báo cáo phân tích AI.';
      setOccError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setOccLoading(false);
    }
  };

  const handleCopyOccupancy = () => {
    if (!occSummary) return;
    navigator.clipboard.writeText(occSummary);
    setOccCopied(true);
    showToast({ type: 'success', message: 'Đã sao chép đề xuất chiến lược của AI!' });
    setTimeout(() => setOccCopied(false), 2000);
  };

  /* ─────────────────────────────────────────────────────────────
     PHÂN HỆ STAFF: CHỈ HIỂN THỊ UC-10 & UC-11 (TÁC NGHIỆP TRỰC QUẦY)
     ───────────────────────────────────────────────────────────── */
  const [staffTab, setStaffTab] = useState('uc10'); // 'uc10' | 'uc11'

  // UC-11 State
  const [bookingId, setBookingId]             = useState('');
  const [msgType, setMsgType]                 = useState('confirmation');
  const [confirmMsg, setConfirmMsg]           = useState('');
  const [confirmLoading, setConfirmLoading]   = useState(false);
  const [confirmError, setConfirmError]       = useState('');
  const [msgCopied, setMsgCopied]             = useState(false);
  const [quickBookings, setQuickBookings]     = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      bookingsAPI.getAll({ limit: 5 })
        .then(res => {
          if (Array.isArray(res)) setQuickBookings(res.slice(0, 5));
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleGenerateMessage = async (e) => {
    e?.preventDefault();
    if (!bookingId) {
      showToast({ type: 'warning', message: 'Vui lòng nhập Booking ID' });
      return;
    }
    setConfirmLoading(true);
    setConfirmError('');
    setConfirmMsg('');

    try {
      const data = await aiAPI.generateMessage(parseInt(bookingId, 10) + `?message_type=${msgType}`);
      setConfirmMsg(data.message);
      showToast({ type: 'success', message: 'Đã tạo tin nhắn AI thành công!' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Không thể tạo tin nhắn. Kiểm tra lại Booking ID.';
      setConfirmError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCopyMessage = () => {
    if (!confirmMsg) return;
    navigator.clipboard.writeText(confirmMsg);
    setMsgCopied(true);
    showToast({ type: 'success', message: 'Đã sao chép tin nhắn vào clipboard!' });
    setTimeout(() => setMsgCopied(false), 2000);
  };

  // UC-10 State
  const [courtTypes, setCourtTypes]           = useState([]);
  const [suggestForm, setSuggestForm]         = useState({
    court_type_id: '',
    preferred_date: todayStr,
    preferred_start_time: '',
    preferred_end_time: '',
  });
  const [suggestLoading, setSuggestLoading]   = useState(false);
  const [suggestError, setSuggestError]       = useState('');
  const [suggestResult, setSuggestResult]     = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      courtTypesAPI.getAll()
        .then(data => {
          if (Array.isArray(data)) {
            setCourtTypes(data);
            if (data.length > 0 && !suggestForm.court_type_id) {
              setSuggestForm(p => ({ ...p, court_type_id: data[0].id }));
            }
          }
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleSuggestSlots = async (e) => {
    e?.preventDefault();
    if (!suggestForm.court_type_id) {
      showToast({ type: 'warning', message: 'Vui lòng chọn loại sân' });
      return;
    }

    setSuggestLoading(true);
    setSuggestError('');
    setSuggestResult(null);

    try {
      const payload = {
        court_type_id: parseInt(suggestForm.court_type_id, 10),
        preferred_date: suggestForm.preferred_date,
      };
      if (suggestForm.preferred_start_time) {
        payload.preferred_start_time = suggestForm.preferred_start_time.includes(':')
          ? `${suggestForm.preferred_start_time}:00`
          : suggestForm.preferred_start_time;
      }
      if (suggestForm.preferred_end_time) {
        payload.preferred_end_time = suggestForm.preferred_end_time.includes(':')
          ? `${suggestForm.preferred_end_time}:00`
          : suggestForm.preferred_end_time;
      }

      const res = await aiAPI.suggestSlot(payload);
      setSuggestResult(res);
      showToast({ type: 'success', message: 'Đã tìm thấy gợi ý khung giờ từ AI!' });
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi gọi AI gợi ý khung giờ.';
      setSuggestError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setSuggestLoading(false);
    }
  };

  /* =========================================================================
     1. GIAO DIỆN DÀNH CHO ADMIN: CHỈ DUY NHẤT UC-12
     ========================================================================= */
  if (isAdmin) {
    return (
      <div className="ai-assistant-page">
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="ai-title-icon-box" style={{ background: '#FEF3C7', borderColor: '#FDE68A' }}>
                <TrendingUp size={22} color="#D97706" />
              </div>
              <span>Trợ lý AI — Phân tích Công suất &amp; Khuyến mại</span>
            </h1>
            <p className="page-subtitle">
              Nghiệp vụ Quản trị &amp; Chiến lược (UC-12): Gemini AI tổng hợp dữ liệu ca đặt, nhận diện giờ thấp điểm và đề xuất chiến lược ưu đãi tối ưu hóa doanh thu.
            </p>
          </div>
        </div>

        {/* UC-12 Card */}
        <Card padding="lg" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16 }}>
          <div className="ai-card-hero">
            <div className="ai-card-hero-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  UC-12: AI Tóm tắt công suất &amp; Gợi ý khuyến mại giờ thấp điểm
                </h2>
                <span className="badge-admin-tag">
                  <ShieldCheck size={11} style={{ display: 'inline', marginRight: 3 }} />
                  Quản lý &amp; Chiến lược
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0', lineHeight: 1.6 }}>
                Hệ thống tổng hợp dữ liệu tỷ lệ lấp đầy theo từng khung giờ trong ngày, nhận diện các khung giờ vắng khách (thấp điểm) và ứng dụng Gemini AI đề xuất các chương trình kích cầu, giảm giá linh hoạt nhằm gia tăng doanh thu.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="ai-controls-box">
            {/* Quick Prompt Chips */}
            <div className="quick-prompts-bar">
              <span className="quick-prompts-label">Gợi ý tác vụ:</span>
              <button
                type="button"
                className="prompt-chip prompt-chip-amber"
                onClick={() => applyPreset(14)}
                title="Tự động chọn 14 ngày qua để AI tóm tắt công suất và giờ thấp điểm"
              >
                ⚡ Tóm tắt công suất &amp; giờ thấp điểm (14 ngày)
              </button>
              <button
                type="button"
                className="prompt-chip prompt-chip-amber"
                onClick={() => applyPreset(30)}
                title="Tự động chọn 30 ngày qua để phân tích toàn diện"
              >
                ⚡ Đề xuất khuyến mại kích cầu (30 ngày)
              </button>
              <button
                type="button"
                className="prompt-chip prompt-chip-amber"
                onClick={() => applyPreset(7)}
                title="Đánh giá hiệu suất 7 ngày gần nhất"
              >
                ⚡ Báo cáo nhanh tuần qua (7 ngày)
              </button>
            </div>

            <div className="ai-presets-row">
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Khoảng thời gian:</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className={`preset-btn ${preset === '7' ? 'active' : ''}`}
                  onClick={() => applyPreset(7)}
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  className={`preset-btn ${preset === '14' ? 'active' : ''}`}
                  onClick={() => applyPreset(14)}
                >
                  14 ngày qua (Khuyên dùng)
                </button>
                <button
                  type="button"
                  className={`preset-btn ${preset === '30' ? 'active' : ''}`}
                  onClick={() => applyPreset(30)}
                >
                  30 ngày qua (Tối đa)
                </button>
              </div>
            </div>

            <div className="ai-date-inputs-row">
              <Input
                label="Từ ngày"
                type="date"
                value={fromDate}
                max={toDate}
                onChange={e => { setFromDate(e.target.value); setPreset('custom'); }}
                style={{ width: 155 }}
              />
              <Input
                label="Đến ngày"
                type="date"
                value={toDate}
                min={fromDate}
                onChange={e => { setToDate(e.target.value); setPreset('custom'); }}
                style={{ width: 155 }}
              />
              <Button
                variant="primary"
                icon={<Sparkles size={16} />}
                loading={occLoading}
                onClick={handleRunOccupancySummary}
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                  padding: '10px 20px',
                  fontWeight: 700,
                  alignSelf: 'flex-end',
                }}
              >
                {occLoading ? 'AI đang phân tích...' : 'Phân tích & Đề xuất khuyến mại'}
              </Button>
            </div>
          </div>

          {/* Results */}
          {occError && (
            <div className="ai-alert-error">
              <p>{occError}</p>
            </div>
          )}

          {occSummary && (
            <div className="ai-result-panel animate-fade-in">
              <div className="ai-result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} color="#D97706" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400E', margin: 0 }}>
                    Kết quả phân tích từ Gemini AI ({fromDate} → {toDate})
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={occCopied ? <Check size={13} /> : <Copy size={13} />}
                    onClick={handleCopyOccupancy}
                    style={{ background: '#FFFFFF', border: '1px solid #FDE68A', color: occCopied ? '#059669' : '#B45309' }}
                  >
                    {occCopied ? 'Đã sao chép' : 'Sao chép nội dung'}
                  </Button>
                  <Link to="/reports" style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>
                      Đến trang Báo cáo &amp; Thống kê
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="ai-summary-content">
                {occSummary.split('\n\n').map((para, idx) => (
                  <p key={idx} style={{ margin: '0 0 0.85rem', lineHeight: 1.75 }}>
                    {para}
                  </p>
                ))}
              </div>

              {/* Raw Data Chips */}
              {occRawData && Object.keys(occRawData).length > 0 && (
                <div className="ai-metrics-section">
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Tỉ lệ lấp đầy theo từng khung giờ trong giai đoạn:
                  </h4>
                  <div className="occupancy-chips-grid">
                    {Object.entries(occRawData)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([hour, data]) => {
                        const rate = data.occupancy_rate_percent ?? 0;
                        const isLow = rate < 30;
                        const isHigh = rate >= 70;
                        return (
                          <div
                            key={hour}
                            className={`occ-chip ${isLow ? 'occ-chip-low' : isHigh ? 'occ-chip-high' : 'occ-chip-mid'}`}
                          >
                            <div className="occ-chip-hour">{hour}</div>
                            <div className="occ-chip-rate">{rate}%</div>
                            <div className="occ-chip-label">
                              {isLow ? 'Thấp điểm (cần KM)' : isHigh ? 'Cao điểm' : 'Trung bình'}
                            </div>
                            <div className="occ-chip-detail">
                              {data.booked}/{data.total} ca
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Standardized Disclaimer */}
              <div style={{
                marginTop: '1.25rem',
                padding: '0.625rem 1rem',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 8,
                fontSize: '0.8rem',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>⚠️ Kết quả AI chỉ mang tính tham khảo. Vui lòng kiểm tra tính chính xác và xác nhận trước khi sử dụng hoặc thực hiện hành động liên quan đến khách hàng.</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  /* =========================================================================
     2. GIAO DIỆN DÀNH CHO NHÂN VIÊN (STAFF): CHỈ HIỂN THỊ UC-10 VÀ UC-11
     ========================================================================= */
  return (
    <div className="ai-assistant-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ai-title-icon-box">
              <Sparkles size={22} color="#6366F1" />
            </div>
            <span>Trợ lý AI — Tác nghiệp Trực quầy</span>
          </h1>
          <p className="page-subtitle">
            Hỗ trợ Nhân viên lễ tân trực quầy tư vấn khung giờ trống cho khách (UC-10) và tự động sinh tin nhắn xác nhận / nhắc lịch gửi Zalo/SMS (UC-11).
          </p>
        </div>
      </div>

      {/* Staff Tabs: Chỉ có UC-10 và UC-11 */}
      <div className="ai-tabs-container">
        <button
          type="button"
          className={`ai-tab-button ${staffTab === 'uc10' ? 'active' : ''}`}
          onClick={() => setStaffTab('uc10')}
        >
          <div className="ai-tab-icon-wrap" style={staffTab === 'uc10' ? { background: '#ECFDF5', color: '#059669' } : undefined}>
            <Clock size={18} />
          </div>
          <div className="ai-tab-text">
            <div className="ai-tab-title">UC-10: Gợi ý khung giờ còn trống</div>
            <div className="ai-tab-tag">Tư vấn trực quầy</div>
          </div>
        </button>

        <button
          type="button"
          className={`ai-tab-button ${staffTab === 'uc11' ? 'active' : ''}`}
          onClick={() => setStaffTab('uc11')}
        >
          <div className="ai-tab-icon-wrap" style={staffTab === 'uc11' ? { background: '#EEF2FF', color: '#4F46E5' } : undefined}>
            <MessageSquare size={18} />
          </div>
          <div className="ai-tab-text">
            <div className="ai-tab-title">UC-11: Soạn tin nhắn khách hàng</div>
            <div className="ai-tab-tag">Xác nhận &amp; Nhắc lịch</div>
          </div>
        </button>
      </div>

      {/* TAB 1: UC-10 GỢI Ý KHUNG GIỜ CÒN TRỐNG */}
      {staffTab === 'uc10' && (
        <div className="ai-tab-pane animate-fade-in">
          <Card padding="lg" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16 }}>
            <div className="ai-card-hero">
              <div className="ai-card-hero-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    UC-10: AI Gợi ý khung giờ còn trống phù hợp
                  </h2>
                  <span className="badge-staff-tag">Nghiệp vụ trực quầy</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0', lineHeight: 1.6 }}>
                  Khi khách hỏi ca trống hoặc muốn tìm giờ đá bóng/tennis/cầu lông thích hợp, AI sẽ quét thời khóa biểu thực tế trên toàn hệ thống (tự động loại trừ các sân đang bảo trì) để tư vấn các khung giờ tối ưu nhất.
                </p>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="quick-prompts-bar" style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>
              <span className="quick-prompts-label">Gợi ý tác vụ:</span>
              <button
                type="button"
                className="prompt-chip prompt-chip-emerald"
                onClick={() => setSuggestForm(p => ({ ...p, preferred_date: todayStr, preferred_start_time: '17:00', preferred_end_time: '21:00' }))}
                title="Tự động điền khung giờ cao điểm buổi tối hôm nay"
              >
                ⚡ Gợi ý 3 khung giờ trống đẹp nhất (17h-21h)
              </button>
              <button
                type="button"
                className="prompt-chip prompt-chip-emerald"
                onClick={() => setSuggestForm(p => ({ ...p, preferred_start_time: '06:00', preferred_end_time: '09:00' }))}
                title="Tự động điền khung giờ sáng sớm"
              >
                ⚡ Khung giờ sáng sớm (6h-9h)
              </button>
              <button
                type="button"
                className="prompt-chip prompt-chip-emerald"
                onClick={() => setSuggestForm(p => ({ ...p, preferred_start_time: '15:00', preferred_end_time: '18:00' }))}
                title="Tự động điền khung giờ chiều"
              >
                ⚡ Khung giờ chiều (15h-18h)
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSuggestSlots} style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', display: 'block', marginBottom: 6 }}>
                    Loại sân
                  </label>
                  <select
                    value={suggestForm.court_type_id}
                    onChange={e => setSuggestForm({ ...suggestForm, court_type_id: e.target.value })}
                    style={{
                      width: '100%', background: '#FFFFFF', border: '1px solid #CBD5E1',
                      borderRadius: 12, color: '#0F172A', padding: '9px 14px', fontSize: '0.875rem'
                    }}
                    required
                  >
                    {courtTypes.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Input
                    label="Ngày khách mong muốn"
                    type="date"
                    value={suggestForm.preferred_date}
                    onChange={e => setSuggestForm({ ...suggestForm, preferred_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Từ giờ (Tùy chọn)"
                    type="time"
                    value={suggestForm.preferred_start_time}
                    onChange={e => setSuggestForm({ ...suggestForm, preferred_start_time: e.target.value })}
                  />
                </div>

                <div>
                  <Input
                    label="Đến giờ (Tùy chọn)"
                    type="time"
                    value={suggestForm.preferred_end_time}
                    onChange={e => setSuggestForm({ ...suggestForm, preferred_end_time: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Link to="/schedule" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" icon={<Calendar size={14} />}>
                    Mở Sơ đồ Lịch đặt sân
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  icon={<Sparkles size={15} />}
                  loading={suggestLoading}
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    padding: '10px 22px',
                    fontWeight: 700,
                  }}
                >
                  Tìm khung giờ với AI
                </Button>
              </div>
            </form>

            {/* Error */}
            {suggestError && (
              <div className="ai-alert-error" style={{ marginTop: '1.25rem' }}>
                <p>{suggestError}</p>
              </div>
            )}

            {/* Suggestions result */}
            {suggestResult && (
              <div className="ai-result-panel animate-fade-in" style={{ marginTop: '1.5rem', background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <div className="ai-result-header" style={{ borderBottomColor: '#DCFCE7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} color="#059669" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#065F46', margin: 0 }}>
                      Gợi ý khung giờ từ Trợ lý AI
                    </h3>
                  </div>
                  <Link to="/schedule" style={{ textDecoration: 'none' }}>
                    <Button variant="ghost" size="sm" icon={<ExternalLink size={12} />} style={{ color: '#059669', background: '#FFFFFF' }}>
                      Xem trên Lịch
                    </Button>
                  </Link>
                </div>

                <p style={{ margin: '0 0 1rem', fontSize: '0.92rem', color: '#166534', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {suggestResult.suggestions_text || suggestResult.message}
                </p>

                {suggestResult.matched_slots && suggestResult.matched_slots.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#14532D', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Các khung giờ khả dụng ({suggestResult.matched_slots.length} ca trống):
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                      {suggestResult.matched_slots.map(s => (
                        <div
                          key={s.slot_id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #86EFAC',
                            borderRadius: 12,
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>{s.court_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, marginTop: 2 }}>
                              {s.start_time} - {s.end_time}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                              {s.price ? `${Number(s.price).toLocaleString()}đ/giờ` : '—'}
                            </div>
                          </div>
                          <Link to={`/schedule?date=${suggestForm.preferred_date}`} style={{ textDecoration: 'none' }}>
                            <Button variant="secondary" size="sm" style={{ borderColor: '#86EFAC', color: '#059669' }}>
                              Đặt ca này
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standardized Disclaimer */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.625rem 1rem',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  color: '#B45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>⚠️ Kết quả AI chỉ mang tính tham khảo. Vui lòng kiểm tra tính chính xác và xác nhận trước khi sử dụng hoặc thực hiện hành động liên quan đến khách hàng.</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: UC-11 SOẠN TIN NHẮN KHÁCH HÀNG */}
      {staffTab === 'uc11' && (
        <div className="ai-tab-pane animate-fade-in">
          <Card padding="lg" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16 }}>
            <div className="ai-card-hero">
              <div className="ai-card-hero-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    UC-11: AI Sinh tin nhắn khách hàng (Xác nhận &amp; Nhắc lịch)
                  </h2>
                  <span className="badge-staff-tag">Nghiệp vụ trực quầy</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0', lineHeight: 1.6 }}>
                  Nhập mã đơn đặt (Booking ID) để Gemini AI tự động trích xuất thông tin khách hàng, sân, ngày giờ, số tiền cọc &amp; số tiền còn lại và biên soạn tin nhắn lịch sự, chuẩn mực sẵn sàng gửi qua Zalo hoặc SMS.
                </p>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="quick-prompts-bar" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
              <span className="quick-prompts-label">Gợi ý tác vụ:</span>
              <button
                type="button"
                className={`prompt-chip ${msgType === 'reminder' ? 'active' : ''}`}
                onClick={() => setMsgType('reminder')}
                title="Chuyển mục đích sang tin nhắn nhắc lịch"
              >
                ⚡ Soạn tin nhắc lịch cho khách
              </button>
              <button
                type="button"
                className={`prompt-chip ${msgType === 'confirmation' ? 'active' : ''}`}
                onClick={() => setMsgType('confirmation')}
                title="Chuyển mục đích sang tin nhắn xác nhận đặt sân"
              >
                ⚡ Soạn tin xác nhận đặt sân
              </button>
            </div>

            {/* Quick booking selector buttons */}
            {quickBookings.length > 0 && (
              <div className="quick-booking-bar">
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Chọn nhanh đơn gần nhất:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {quickBookings.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBookingId(String(b.id))}
                      className={`quick-id-btn ${String(bookingId) === String(b.id) ? 'active' : ''}`}
                    >
                      #{b.id} - {b.customer?.full_name || 'Khách'} ({b.court?.name || 'Sân'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleGenerateMessage} style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: 160 }}>
                  <Input
                    label="Mã đơn đặt sân (Booking ID)"
                    type="number"
                    value={bookingId}
                    onChange={e => setBookingId(e.target.value)}
                    placeholder="VD: 1, 2, 42..."
                    required
                  />
                </div>
                <div style={{ flex: '1.2', minWidth: 200 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', display: 'block', marginBottom: 6 }}>
                    Mục đích tin nhắn
                  </label>
                  <select
                    value={msgType}
                    onChange={e => setMsgType(e.target.value)}
                    style={{
                      width: '100%', background: '#FFFFFF', border: '1px solid #CBD5E1',
                      borderRadius: 12, color: '#0F172A', padding: '9px 14px', fontSize: '0.875rem'
                    }}
                  >
                    <option value="confirmation">Xác nhận đặt sân (gửi ngay sau khi xác nhận đặt sân)</option>
                    <option value="reminder">Nhắc lịch thi đấu (gửi trước giờ thi đấu)</option>
                  </select>
                </div>
                <Button
                  variant="primary"
                  icon={<Send size={15} />}
                  loading={confirmLoading}
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                    padding: '10px 22px',
                    fontWeight: 700,
                  }}
                >
                  Tạo tin nhắn AI
                </Button>
              </div>
            </form>

            {/* Result */}
            {confirmError && (
              <div className="ai-alert-error" style={{ marginTop: '1.25rem' }}>
                <p>{confirmError}</p>
              </div>
            )}

            {confirmMsg && (
              <div className="ai-message-bubble-wrap animate-fade-in">
                <div className="ai-message-header">
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4338CA' }}>
                    Nội dung tin nhắn sẵn sàng gửi (Zalo / SMS):
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={msgCopied ? <Check size={13} /> : <Copy size={13} />}
                    onClick={handleCopyMessage}
                    style={{ background: '#FFFFFF', border: '1px solid #C7D2FE', color: msgCopied ? '#059669' : '#4F46E5' }}
                  >
                    {msgCopied ? 'Đã sao chép!' : 'Sao chép tin nhắn'}
                  </Button>
                </div>
                <div className="ai-message-text">{confirmMsg}</div>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Được tối ưu theo thông tin đơn #{bookingId}
                  </span>
                  <Link to="/bookings" style={{ fontSize: '0.78rem', color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
                    Xem đơn tại Danh sách đặt →
                  </Link>
                </div>

                {/* Standardized Disclaimer */}
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 0.85rem',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  color: '#B45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>⚠️ Kết quả AI chỉ mang tính tham khảo. Vui lòng kiểm tra tính chính xác và xác nhận trước khi sử dụng hoặc thực hiện hành động liên quan đến khách hàng.</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
