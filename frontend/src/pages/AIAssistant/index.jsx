import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Send, MessageSquare, Copy, Check, ExternalLink,
  Clock, TrendingUp, Calendar, ShieldCheck, Flame, Tag, AlertCircle,
  BarChart3, Sun, Moon, Sunset, RefreshCw, Zap, Award, CheckCircle2,
  User
} from 'lucide-react';
import { aiAPI, courtTypesAPI, bookingsAPI } from '../../api';
import { Card, Button, Input } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { todayVN, addDays } from '../../utils/datetime';
import './AIAssistant.css';

/** Lấy class màu slot theo giờ bắt đầu */
function getSlotTimeClass(startTime) {
  if (!startTime) return '';
  const h = parseInt(startTime.split(':')[0], 10);
  if (h >= 6 && h <= 11) return 'ai-slot-morning';
  if (h >= 12 && h <= 16) return 'ai-slot-afternoon';
  return 'ai-slot-evening';
}

/** Timestamp hiện tại dạng HH:MM */
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  /* ─────────────────────────────────────────────────────────────
     PHÂN HỆ ADMIN: CHỈ HIỂN THỊ DUY NHẤT UC-12 (TÓM TẮT CÔNG SUẤT)
     ───────────────────────────────────────────────────────────── */
  const todayStr = todayVN();
  const fourteenDaysAgo = addDays(todayStr, -13);

  const [fromDate, setFromDate] = useState(fourteenDaysAgo);
  const [toDate, setToDate]     = useState(todayStr);
  const [preset, setPreset]     = useState('14');
  const [occLoading, setOccLoading] = useState(false);
  const [occSummary, setOccSummary] = useState('');
  const [occRawData, setOccRawData] = useState(null);
  const [occError, setOccError]     = useState('');
  const [occCopied, setOccCopied]   = useState(false);
  const [promoCopied, setPromoCopied] = useState('');

  const fetchOccupancy = async (from = fromDate, to = toDate) => {
    const start = new Date(from);
    const end = new Date(to);
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

    try {
      const data = await aiAPI.occupancySummary({ from_date: from, to_date: to });
      setOccSummary(data.summary);
      setOccRawData(data.raw_data);
      showToast({ type: 'success', message: 'AI đã hoàn thành phân tích công suất & khuyến mại!' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Không thể tạo báo cáo phân tích AI.';
      setOccError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setOccLoading(false);
    }
  };

  const applyPreset = (days, autoRun = false) => {
    setPreset(String(days));
    const to = todayStr;
    const from = addDays(todayStr, -(days - 1));
    setFromDate(from);
    setToDate(to);
    if (autoRun) fetchOccupancy(from, to);
  };

  const handleRunOccupancySummary = () => fetchOccupancy(fromDate, toDate);

  const handleCopyOccupancy = () => {
    if (!occSummary) return;
    navigator.clipboard.writeText(occSummary);
    setOccCopied(true);
    showToast({ type: 'success', message: 'Đã sao chép đề xuất chiến lược của AI!' });
    setTimeout(() => setOccCopied(false), 2000);
  };

  const handleCopyPromo = (text, promoId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setPromoCopied(promoId);
    showToast({ type: 'success', message: 'Đã sao chép nội dung chương trình khuyến mại!' });
    setTimeout(() => setPromoCopied(''), 2000);
  };

  // Tính toán các chỉ số thống kê thực tế từ occRawData
  const stats = useMemo(() => {
    if (!occRawData || Object.keys(occRawData).length === 0) {
      return {
        totalSlots: 0, bookedSlots: 0, avgRate: 0,
        topPeakHour: '—', topPeakRate: 0, topLowHour: '—',
        morning: { booked: 0, total: 0, rate: 0 },
        afternoon: { booked: 0, total: 0, rate: 0 },
        evening: { booked: 0, total: 0, rate: 0 },
      };
    }

    const entries = Object.entries(occRawData);
    let totalSlots = 0, bookedSlots = 0;
    let morningBooked = 0, morningTotal = 0;
    let afternoonBooked = 0, afternoonTotal = 0;
    let eveningBooked = 0, eveningTotal = 0;

    entries.forEach(([hour, d]) => {
      totalSlots += d.total || 0;
      bookedSlots += d.booked || 0;
      const h = parseInt(hour.split(':')[0], 10);
      if (h >= 6 && h <= 11) { morningBooked += d.booked || 0; morningTotal += d.total || 0; }
      else if (h >= 12 && h <= 16) { afternoonBooked += d.booked || 0; afternoonTotal += d.total || 0; }
      else if (h >= 17 && h <= 23) { eveningBooked += d.booked || 0; eveningTotal += d.total || 0; }
    });

    const avgRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 1000) / 10 : 0;
    const morningRate = morningTotal > 0 ? Math.round((morningBooked / morningTotal) * 100) : 0;
    const afternoonRate = afternoonTotal > 0 ? Math.round((afternoonBooked / afternoonTotal) * 100) : 0;
    const eveningRate = eveningTotal > 0 ? Math.round((eveningBooked / eveningTotal) * 100) : 0;

    const sortedByRateDesc = [...entries].sort((a, b) => (b[1].occupancy_rate_percent || 0) - (a[1].occupancy_rate_percent || 0));
    const peakEntries = sortedByRateDesc.filter(([, d]) => (d.occupancy_rate_percent || 0) > 0);
    const topPeakHour = peakEntries.length > 0 ? peakEntries.slice(0, 2).map(([h]) => h).join(', ') : 'Chưa có ca đặt';
    const topPeakRate = peakEntries.length > 0 ? peakEntries[0][1].occupancy_rate_percent : 0;

    const lowEntries = [...entries]
      .filter(([, d]) => d.total > 0 && (d.occupancy_rate_percent || 0) < 30)
      .sort((a, b) => (a[1].occupancy_rate_percent || 0) - (b[1].occupancy_rate_percent || 0))
      .slice(0, 3).map(([h]) => h);
    const topLowHour = lowEntries.length > 0 ? lowEntries.join(', ') : (totalSlots > 0 ? 'Tất cả ca đều đạt' : '—');

    return {
      totalSlots, bookedSlots, avgRate, topPeakHour, topPeakRate, topLowHour,
      morning: { booked: morningBooked, total: morningTotal, rate: morningRate },
      afternoon: { booked: afternoonBooked, total: afternoonTotal, rate: afternoonRate },
      evening: { booked: eveningBooked, total: eveningTotal, rate: eveningRate },
    };
  }, [occRawData]);

  // Trích xuất hoặc sinh đề xuất khuyến mại thực tế từ nhận định của Gemini AI
  const actionablePromotions = useMemo(() => {
    if (!occSummary) return [];
    const promos = [];
    const lines = occSummary.split('\n');
    let inPromoSection = false;
    let curPromo = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (/Đề xuất chương trình khuyến mại|Chương trình khuyến mại|Kế hoạch khuyến mại/i.test(line)) {
        inPromoSection = true; continue;
      }
      if (inPromoSection) {
        const match = line.match(/^(\d+[\.)]|\*|\-)\s*\*\*(.*?)\*\*[:\-—]?\s*(.*)$/);
        if (match) {
          if (curPromo) promos.push(curPromo);
          const rawTitle = match[2].replace(/^Chương trình\s*["""]?/i, '').replace(/["""]?$/i, '').trim();
          curPromo = { id: `promo_${promos.length + 1}`, title: rawTitle, body: match[3].trim(), tag: '🎯 Gemini AI đề xuất trực tiếp' };
        } else if (curPromo && line && !line.startsWith('#') && !line.startsWith('---')) {
          curPromo.body += (curPromo.body ? ' ' : '') + line;
        }
      }
    }
    if (curPromo) promos.push(curPromo);

    if (promos.length === 0) {
      const lowHours = stats.topLowHour !== '—' && stats.topLowHour !== 'Tất cả ca đều đạt' ? stats.topLowHour : 'các ca sáng và trưa';
      const peakHours = stats.topPeakHour !== '—' && stats.topPeakHour !== 'Chưa có ca đặt' ? stats.topPeakHour : 'ca tối (18:00 - 21:00)';
      promos.push({ id: 'promo_1', title: `Kích cầu giờ thấp điểm (${lowHours})`, body: `Dựa trên dữ liệu lấp đầy thực tế, khung giờ ${lowHours} đang vắng khách. Đề xuất giảm 15% - 20% giá thuê sân hoặc tặng kèm nước khoáng miễn phí cho các lượt đặt từ Thứ 2 đến Thứ 6.`, tag: `🎯 Kích cầu giờ vắng: ${lowHours}`, copyText: `[ƯU ĐÃI GIỜ VÀNG] Giảm ngay 15-20% tiền thuê sân vào các khung giờ ${lowHours}! Áp dụng từ Thứ 2 đến Thứ 6. Đặt sân ngay để nhận ưu đãi!` });
      promos.push({ id: 'promo_2', title: 'Gói Đặt Sân Cố Định Hội Viên (Team Pass)', body: `Cam kết đặt sân cố định hàng tuần theo tháng cho các khung giờ còn trống (${stats.totalSlots - stats.bookedSlots} ca khả dụng trong kỳ), áp dụng chiết khấu 10% tổng hóa đơn tháng và tặng bóng thi đấu.`, tag: '🎯 Khách đoàn & Doanh nghiệp', copyText: `[GÓI HỘI VIÊN TEAM PASS] Đăng ký lịch sân cố định theo tháng để nhận ưu đãi giảm 10% tổng chi phí + Miễn phí bóng thi đấu và nước uống mỗi trận!` });
      promos.push({ id: 'promo_3', title: `Chính sách Cọc & Bảo vệ Doanh thu (${peakHours})`, body: `Khung giờ ${peakHours} đang có nhu cầu đặt sân cao nhất. Áp dụng mức đặt cọc tối thiểu 50% và quy định xác nhận trước 12 tiếng để tối ưu doanh thu và chống hủy phút chót.`, tag: `🎯 Giờ cao điểm: ${peakHours}`, copyText: `[QUY ĐỊNH ĐẶT SÂN GIỜ VÀNG] Các ca thi đấu khung giờ ${peakHours} yêu cầu hoàn tất cọc 50% trước giờ thi đấu ít nhất 12h để đảm bảo giữ sân.` });
    }
    return promos;
  }, [occSummary, stats]);

  /* ─────────────────────────────────────────────────────────────
     PHÂN HỆ STAFF: CHỈ HIỂN THỊ UC-10 & UC-11 (TÁC NGHIỆP TRỰC QUẦY)
     ───────────────────────────────────────────────────────────── */
  const [staffTab, setStaffTab] = useState('uc10');

  // UC-11 State
  const [bookingId, setBookingId]           = useState('');
  const [msgType, setMsgType]               = useState('confirmation');
  const [confirmMsg, setConfirmMsg]         = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError]     = useState('');
  const [msgCopied, setMsgCopied]           = useState(false);
  const [quickBookings, setQuickBookings]   = useState([]);
  const [uc11ResultTime, setUc11ResultTime] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      bookingsAPI.getAll({ limit: 5 })
        .then(res => { if (Array.isArray(res)) setQuickBookings(res.slice(0, 5)); })
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleGenerateMessage = async (e) => {
    e?.preventDefault();
    if (!bookingId) { showToast({ type: 'warning', message: 'Vui lòng nhập Booking ID' }); return; }
    setConfirmLoading(true);
    setConfirmError('');
    setConfirmMsg('');
    try {
      const data = await aiAPI.generateMessage(parseInt(bookingId, 10) + `?message_type=${msgType}`);
      setConfirmMsg(data.message);
      setUc11ResultTime(nowHHMM());
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
  const [courtTypes, setCourtTypes]     = useState([]);
  const [suggestForm, setSuggestForm]   = useState({
    court_type_id: '', preferred_date: todayStr,
    preferred_start_time: '', preferred_end_time: '',
  });
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError]     = useState('');
  const [suggestResult, setSuggestResult]   = useState(null);
  const [uc10ResultTime, setUc10ResultTime] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      courtTypesAPI.getAll()
        .then(data => {
          if (Array.isArray(data)) {
            setCourtTypes(data);
            if (data.length > 0 && !suggestForm.court_type_id)
              setSuggestForm(p => ({ ...p, court_type_id: data[0].id }));
          }
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleSuggestSlots = async (e) => {
    e?.preventDefault();
    if (!suggestForm.court_type_id) { showToast({ type: 'warning', message: 'Vui lòng chọn loại sân' }); return; }
    setSuggestLoading(true);
    setSuggestError('');
    setSuggestResult(null);
    try {
      const payload = { court_type_id: parseInt(suggestForm.court_type_id, 10), preferred_date: suggestForm.preferred_date };
      if (suggestForm.preferred_start_time) payload.preferred_start_time = suggestForm.preferred_start_time.includes(':') ? `${suggestForm.preferred_start_time}:00` : suggestForm.preferred_start_time;
      if (suggestForm.preferred_end_time) payload.preferred_end_time = suggestForm.preferred_end_time.includes(':') ? `${suggestForm.preferred_end_time}:00` : suggestForm.preferred_end_time;
      const res = await aiAPI.suggestSlot(payload);
      setSuggestResult(res);
      setUc10ResultTime(nowHHMM());
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
        {/* ── Hero Banner (Admin) ─────────────────────────── */}
        <div className="ai-hero-banner">
          <div className="ai-hero-left">
            <div className="ai-hero-icon-ring ai-hero-icon-ring-amber">
              <TrendingUp size={24} color="#F59E0B" className="ai-sparkle-animate" />
            </div>
            <div className="ai-hero-text-block">
              <h1 className="ai-hero-title">Trợ lý AI — Phân tích Công suất &amp; Khuyến mại</h1>
              <p className="ai-hero-subtitle">
                Nghiệp vụ Quản trị &amp; Chiến lược (UC-12): Gemini AI tổng hợp dữ liệu ca đặt thực tế, nhận diện giờ thấp điểm và đề xuất chiến lược ưu đãi tối ưu hóa doanh thu.
              </p>
            </div>
          </div>
          <div className="ai-hero-right">
            <div className="ai-live-badge">
              <span className="ai-live-dot" />
              Gemini 1.5 Pro · Trực tuyến
            </div>
            <div className="ai-user-chip">
              <User size={12} />
              {user?.full_name || user?.username || 'Quản lý'}
            </div>
          </div>
        </div>

        {/* 4 AI Executive KPI Cards */}
        {occRawData && Object.keys(occRawData).length > 0 && (
          <div className="ai-kpi-grid">
            <div className="ai-kpi-card">
              <div className="ai-kpi-card-top">
                <span className="ai-kpi-card-title">Tỷ lệ lấp đầy TB</span>
                <div className="ai-kpi-card-icon" style={{ background: stats.avgRate >= 50 ? '#ECFDF5' : '#FEF3C7', color: stats.avgRate >= 50 ? '#059669' : '#D97706' }}>
                  <BarChart3 size={20} />
                </div>
              </div>
              <div className="ai-kpi-card-val" style={{ color: stats.avgRate >= 50 ? '#059669' : '#D97706' }}>{stats.avgRate}%</div>
              <div className="ai-kpi-card-sub"><CheckCircle2 size={12} color="#059669" /><span>{stats.bookedSlots} đặt / {stats.totalSlots} ca</span></div>
            </div>

            <div className="ai-kpi-card">
              <div className="ai-kpi-card-top">
                <span className="ai-kpi-card-title">Khung giờ cao điểm</span>
                <div className="ai-kpi-card-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}><Flame size={20} /></div>
              </div>
              <div className="ai-kpi-card-val" style={{ fontSize: '1.15rem', color: '#DC2626' }}>{stats.topPeakHour}</div>
              <div className="ai-kpi-card-sub"><span>Lấp đầy cao nhất: {stats.topPeakRate}%</span></div>
            </div>

            <div className="ai-kpi-card">
              <div className="ai-kpi-card-top">
                <span className="ai-kpi-card-title">Giờ vắng (cần cứu)</span>
                <div className="ai-kpi-card-icon" style={{ background: '#FFFBEB', color: '#D97706' }}><AlertCircle size={20} /></div>
              </div>
              <div className="ai-kpi-card-val" style={{ fontSize: '1.15rem', color: '#D97706' }}>{stats.topLowHour}</div>
              <div className="ai-kpi-card-sub"><span>Tỷ lệ lấp đầy dưới 30%</span></div>
            </div>

            <div className="ai-kpi-card">
              <div className="ai-kpi-card-top">
                <span className="ai-kpi-card-title">Cơ hội kích cầu</span>
                <div className="ai-kpi-card-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}><Zap size={20} /></div>
              </div>
              <div className="ai-kpi-card-val" style={{ color: '#7C3AED' }}>{stats.totalSlots - stats.bookedSlots} ca</div>
              <div className="ai-kpi-card-sub"><span>Happy Hours giảm 15-20%</span></div>
            </div>
          </div>
        )}

        {/* Main UC-12 Control Card */}
        <Card padding="lg" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 18 }}>
          <div className="ai-card-hero">
            <div className="ai-card-hero-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  UC-12: AI Tóm tắt công suất &amp; Gợi ý khuyến mại giờ thấp điểm
                </h2>
                <span className="badge-admin-tag">
                  <ShieldCheck size={11} style={{ display: 'inline', marginRight: 3 }} />
                  Quản lý &amp; Chiến lược
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '4px 0 0', lineHeight: 1.6 }}>
                Hệ thống tổng hợp dữ liệu tỷ lệ lấp đầy theo từng khung giờ, nhận diện giờ vắng khách và ứng dụng Gemini AI đề xuất các chương trình kích cầu, giảm giá linh hoạt nhằm gia tăng doanh thu.
              </p>
            </div>
          </div>

          {/* Controls Box */}
          <div className="ai-controls-box">
            {/* Quick Prompt Chips */}
            <div className="quick-prompts-bar">
              <span className="quick-prompts-label">Gợi ý tác vụ:</span>
              <button type="button" className={`prompt-chip prompt-chip-amber ${preset === '14' ? 'active' : ''}`} onClick={() => applyPreset(14, false)} title="Chọn 14 ngày qua">
                ⚡ Tóm tắt công suất &amp; giờ thấp điểm (14 ngày)
              </button>
              <button type="button" className={`prompt-chip prompt-chip-amber ${preset === '30' ? 'active' : ''}`} onClick={() => applyPreset(30, false)} title="Chọn 30 ngày qua">
                ⚡ Đề xuất khuyến mại kích cầu (30 ngày)
              </button>
              <button type="button" className={`prompt-chip prompt-chip-amber ${preset === '7' ? 'active' : ''}`} onClick={() => applyPreset(7, false)} title="Chọn 7 ngày qua">
                ⚡ Báo cáo nhanh tuần qua (7 ngày)
              </button>
            </div>

            <div className="ai-presets-row">
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Khoảng thời gian:</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[7, 14, 30].map(d => (
                  <button key={d} type="button" className={`preset-btn ${preset === String(d) ? 'active' : ''}`} onClick={() => applyPreset(d)}>
                    {d} ngày qua{d === 14 ? ' (Khuyên dùng)' : d === 30 ? ' (Tối đa)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="ai-date-inputs-row">
              <Input label="Từ ngày" type="date" value={fromDate} max={toDate} onChange={e => { setFromDate(e.target.value); setPreset('custom'); }} style={{ width: 155 }} />
              <Input label="Đến ngày" type="date" value={toDate} min={fromDate} onChange={e => { setToDate(e.target.value); setPreset('custom'); }} style={{ width: 155 }} />
              <Button
                variant="primary"
                icon={<Sparkles size={16} />}
                loading={occLoading}
                onClick={handleRunOccupancySummary}
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 12px rgba(217,119,6,0.25)', padding: '10px 20px', fontWeight: 700, alignSelf: 'flex-end' }}
              >
                {occLoading ? 'AI đang phân tích...' : 'Phân tích & Đề xuất khuyến mại'}
              </Button>
            </div>
          </div>

          {/* Error */}
          {occError && (
            <div className="ai-alert-error"><AlertCircle size={16} style={{ flexShrink: 0 }} /><p>{occError}</p></div>
          )}

          {/* Loading Skeleton */}
          {occLoading && (
            <div className="ai-skeleton-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <Sparkles size={18} color="#D97706" className="ai-sparkle-animate" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#B45309' }}>
                  Gemini AI đang phân tích dữ liệu ca đặt và tổng hợp chiến lược ưu đãi...
                </span>
              </div>
              <div className="ai-skeleton-line" style={{ width: '85%' }} />
              <div className="ai-skeleton-line" style={{ width: '92%' }} />
              <div className="ai-skeleton-line" style={{ width: '70%' }} />
              <div className="ai-skeleton-line" style={{ width: '60%' }} />
            </div>
          )}

          {/* Empty State */}
          {!occLoading && !occSummary && !occRawData && (
            <div style={{ marginTop: '1.25rem', padding: '3rem 1.5rem', textAlign: 'center', background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: '0 0 0.4rem' }}>Sẵn sàng phân tích công suất &amp; đề xuất khuyến mại</h3>
              <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
                Vui lòng chọn khoảng thời gian bạn muốn đánh giá ở trên (hoặc bấm chọn nhanh 7 / 14 / 30 ngày), sau đó bấm nút <strong>"Phân tích &amp; Đề xuất khuyến mại"</strong> để Gemini AI bắt đầu tổng hợp dữ liệu.
              </p>
            </div>
          )}

          {/* Results */}
          {!occLoading && (occSummary || occRawData) && (
            <div className="ai-result-panel">
              <div className="ai-result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} color="#D97706" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400E', margin: 0 }}>
                    Kết quả phân tích &amp; Chiến lược từ Gemini AI ({fromDate} → {toDate})
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="ghost" size="sm" icon={occCopied ? <Check size={13} /> : <Copy size={13} />} onClick={handleCopyOccupancy} style={{ background: '#FFFFFF', border: '1px solid #FDE68A', color: occCopied ? '#059669' : '#B45309' }}>
                    {occCopied ? 'Đã sao chép' : 'Sao chép toàn bộ'}
                  </Button>
                  <Link to="/reports" style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>Đến Báo cáo Doanh thu</Button>
                  </Link>
                </div>
              </div>

              {/* 3 Ca trong ngày */}
              <div className="ai-sessions-bar">
                {[
                  { icon: <Sun size={14} color="#F59E0B" />, label: 'Ca Sáng (06:00 - 11:00)', data: stats.morning },
                  { icon: <Sunset size={14} color="#D97706" />, label: 'Ca Chiều (12:00 - 16:00)', data: stats.afternoon },
                  { icon: <Flame size={14} color="#DC2626" />, label: 'Ca Tối Giờ Vàng (17:00 - 23:00)', data: stats.evening, alwaysGreen: true },
                ].map(({ icon, label, data, alwaysGreen }) => (
                  <div key={label} className="ai-session-card">
                    <div className="ai-session-header">
                      <span className="ai-session-title">{icon} {label}</span>
                      <span className="ai-session-badge" style={{ background: alwaysGreen ? '#ECFDF5' : (data.rate < 30 ? '#FEF2F2' : '#EFF6FF'), color: alwaysGreen ? '#059669' : (data.rate < 30 ? '#DC2626' : '#2563EB') }}>
                        {data.rate}% Lấp đầy
                      </span>
                    </div>
                    <div className="ai-session-progress">
                      <div className="ai-session-progress-fill" style={{ width: `${data.rate}%`, background: alwaysGreen ? '#10B981' : (data.rate < 30 ? '#EF4444' : '#3B82F6') }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Đã đặt {data.booked}/{data.total} ca khả dụng</div>
                  </div>
                ))}
              </div>

              {/* Occupancy Heatmap */}
              {occRawData && Object.keys(occRawData).length > 0 && (
                <div className="ai-metrics-section" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 6 }}>
                    <h4 style={{ fontSize: '0.83rem', fontWeight: 700, color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Biểu đồ nhiệt công suất 24 khung giờ ({fromDate} → {toDate}):
                    </h4>
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.72rem', color: '#64748B' }}>
                      {[['#10B981', 'Cao điểm (>60%)'], ['#3B82F6', 'Trung bình (30-60%)'], ['#EF4444', 'Thấp điểm (<30%)']].map(([c, l]) => (
                        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="occupancy-chips-grid">
                    {Object.entries(occRawData).sort(([a], [b]) => a.localeCompare(b)).map(([hour, data]) => {
                      const rate = data.occupancy_rate_percent ?? 0;
                      const cls = rate < 30 ? 'occ-chip-low' : rate >= 60 ? 'occ-chip-high' : 'occ-chip-mid';
                      return (
                        <div key={hour} className={`occ-chip ${cls}`}>
                          <div className="occ-chip-hour">{hour}</div>
                          <div className="occ-chip-rate">{rate}%</div>
                          <div className="occ-chip-label">{rate < 30 ? 'Thấp điểm' : rate >= 60 ? 'Cao điểm' : 'Ổn định'}</div>
                          <div className="occ-chip-detail">{data.booked}/{data.total} ca</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full Summary Text */}
              {occSummary && (
                <div style={{ marginTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.83rem', fontWeight: 700, color: '#92400E', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nhận định phân tích từ Gemini AI:
                  </h4>
                  <div className="ai-summary-content">
                    {occSummary.split('\n\n').map((para, idx) => (
                      <p key={idx} style={{ margin: '0 0 0.85rem', lineHeight: 1.75 }}>{para}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Promotion Cards */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={16} color="#D97706" />
                  Đề xuất Chương trình Khuyến mại Tối ưu Doanh thu từ AI ({actionablePromotions.length} chiến lược thực thi)
                </h4>
                <div className="ai-actionable-grid">
                  {actionablePromotions.map((p, idx) => {
                    const cardBorder = idx === 0 ? '#FDE68A' : idx === 1 ? '#C7D2FE' : '#FECACA';
                    const iconBg = idx === 0 ? '#FEF3C7' : idx === 1 ? '#EEF2FF' : '#FEF2F2';
                    const iconColor = idx === 0 ? '#D97706' : idx === 1 ? '#4F46E5' : '#DC2626';
                    const IconComp = idx === 0 ? Sun : idx === 1 ? Tag : Flame;
                    return (
                      <div key={p.id || idx} className="ai-actionable-card" style={{ borderColor: cardBorder }}>
                        <div>
                          <div className="ai-actionable-card-header">
                            <div className="ai-actionable-card-icon" style={{ background: iconBg, color: iconColor }}><IconComp size={20} /></div>
                            <div>
                              <h5 className="ai-actionable-card-title">{p.title}</h5>
                              <span className="ai-actionable-card-tag" style={{ color: iconColor }}>{p.tag}</span>
                            </div>
                          </div>
                          <div className="ai-actionable-card-body">{p.body}</div>
                        </div>
                        <div className="ai-actionable-card-footer">
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Chiến lược AI</span>
                          <Button variant="ghost" size="sm" icon={promoCopied === (p.id || `p${idx}`) ? <Check size={12} /> : <Copy size={12} />} onClick={() => handleCopyPromo(p.copyText || p.body, p.id || `p${idx}`)} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                            {promoCopied === (p.id || `p${idx}`) ? 'Đã chép' : 'Sao chép CT'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ai-disclaimer">
                <span>⚠️ Kết quả AI được trích xuất từ CSDL vận hành thực tế. Quản lý vui lòng đối chiếu khả năng đáp ứng của sân bãi trước khi ban hành chương trình khuyến mại.</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  /* =========================================================================
     2. GIAO DIỆN DÀNH CHO NHÂN VIÊN (STAFF): UC-10 VÀ UC-11
     ========================================================================= */
  return (
    <div className="ai-assistant-page">

      {/* ── Hero Banner (Staff) ─────────────────────────── */}
      <div className="ai-hero-banner">
        <div className="ai-hero-left">
          <div className="ai-hero-icon-ring">
            <Sparkles size={24} color="#A5B4FC" className="ai-sparkle-animate" />
          </div>
          <div className="ai-hero-text-block">
            <h1 className="ai-hero-title">Trợ lý AI — Tác nghiệp Trực quầy</h1>
            <p className="ai-hero-subtitle">
              Hỗ trợ tư vấn khung giờ trống cho khách (UC-10) và tự động soạn tin nhắn xác nhận / nhắc lịch gửi Zalo/SMS (UC-11).
            </p>
          </div>
        </div>
        <div className="ai-hero-right">
          <div className="ai-live-badge">
            <span className="ai-live-dot" />
            Gemini AI · Trực tuyến
          </div>
          <div className="ai-user-chip">
            <User size={12} />
            {user?.full_name || user?.username || 'Nhân viên'}
          </div>
        </div>
      </div>

      {/* ── Pill Segment Tabs ───────────────────────────── */}
      <div className="ai-pill-nav">
        <button
          type="button"
          className={`ai-pill-btn uc10 ${staffTab === 'uc10' ? 'active' : ''}`}
          onClick={() => setStaffTab('uc10')}
        >
          <div className="ai-pill-icon">
            <Clock size={16} />
          </div>
          <div className="ai-pill-label-wrap">
            <span className="ai-pill-label-title">UC-10: Gợi ý Khung Giờ</span>
            <span className="ai-pill-label-sub">Tư vấn ca trống phù hợp</span>
          </div>
        </button>

        <button
          type="button"
          className={`ai-pill-btn uc11 ${staffTab === 'uc11' ? 'active' : ''}`}
          onClick={() => setStaffTab('uc11')}
        >
          <div className="ai-pill-icon">
            <MessageSquare size={16} />
          </div>
          <div className="ai-pill-label-wrap">
            <span className="ai-pill-label-title">
              UC-11: Soạn Tin Nhắn
              {quickBookings.length > 0 && (
                <span style={{ marginLeft: 6, background: '#4F46E5', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>
                  {quickBookings.length}
                </span>
              )}
            </span>
            <span className="ai-pill-label-sub">Xác nhận &amp; Nhắc lịch Zalo/SMS</span>
          </div>
        </button>
      </div>

      {/* ── TAB 1: UC-10 GỢI Ý KHUNG GIỜ ─────────────── */}
      {staffTab === 'uc10' && (
        <div className="animate-fade-in">
          <div className="ai-content-card">
            {/* Section Hero */}
            <div className="ai-section-hero">
              <div className="ai-section-hero-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                <Clock size={24} />
              </div>
              <div className="ai-section-hero-text">
                <h2>
                  UC-10: AI Gợi ý khung giờ còn trống phù hợp
                  <span className="badge-staff-tag">Nghiệp vụ trực quầy</span>
                </h2>
                <p>
                  Khi khách hỏi ca trống hoặc muốn tìm giờ đá bóng / tennis / cầu lông thích hợp, AI sẽ quét thời khóa biểu thực tế trên toàn hệ thống (tự động loại trừ các sân đang bảo trì) để tư vấn các khung giờ tối ưu nhất.
                </p>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="quick-prompts-bar">
              <span className="quick-prompts-label">Gợi ý tác vụ:</span>
              <button
                type="button"
                className="prompt-chip prompt-chip-amber"
                onClick={() => setSuggestForm(p => ({ ...p, preferred_date: todayStr, preferred_start_time: '17:00', preferred_end_time: '21:00' }))}
                title="Khung giờ cao điểm buổi tối hôm nay"
              >
                ⚡ Gợi ý 3 khung giờ trống đẹp nhất (17h-21h)
              </button>
              <button
                type="button"
                className="prompt-chip prompt-chip-sky"
                onClick={() => setSuggestForm(p => ({ ...p, preferred_start_time: '06:00', preferred_end_time: '09:00' }))}
                title="Khung giờ sáng sớm"
              >
                🌅 Khung giờ sáng sớm (6h-9h)
              </button>
              <button
                type="button"
                className="prompt-chip prompt-chip-emerald"
                onClick={() => setSuggestForm(p => ({ ...p, preferred_start_time: '15:00', preferred_end_time: '18:00' }))}
                title="Khung giờ chiều"
              >
                ☀️ Khung giờ chiều (15h-18h)
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSuggestSlots}>
              <div className="ai-form-grid">
                {/* Loại sân — dùng select HTML (giống pattern hiện tại) */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', display: 'block', marginBottom: 6 }}>
                    Loại sân
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={suggestForm.court_type_id}
                      onChange={e => setSuggestForm({ ...suggestForm, court_type_id: e.target.value })}
                      style={{ width: '100%', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, color: '#0F172A', padding: '10px 36px 10px 14px', fontSize: '0.875rem', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
                      required
                    >
                      {courtTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B', display: 'flex', alignItems: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                  </div>
                </div>

                <Input label="Ngày khách mong muốn" type="date" value={suggestForm.preferred_date} onChange={e => setSuggestForm({ ...suggestForm, preferred_date: e.target.value })} required />
                <Input label="Từ giờ (Tùy chọn)" type="time" value={suggestForm.preferred_start_time} onChange={e => setSuggestForm({ ...suggestForm, preferred_start_time: e.target.value })} />
                <Input label="Đến giờ (Tùy chọn)" type="time" value={suggestForm.preferred_end_time} onChange={e => setSuggestForm({ ...suggestForm, preferred_end_time: e.target.value })} />
              </div>

              <div className="ai-form-actions">
                <Link to="/schedule" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" icon={<Calendar size={14} />}>Mở Sơ đồ Lịch đặt sân</Button>
                </Link>
                <Button
                  variant="primary"
                  icon={<Sparkles size={15} />}
                  loading={suggestLoading}
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.28)', padding: '10px 24px', fontWeight: 700 }}
                >
                  Tìm khung giờ với AI
                </Button>
              </div>
            </form>

            {/* Error */}
            {suggestError && (
              <div className="ai-alert-error"><AlertCircle size={16} style={{ flexShrink: 0 }} /><p>{suggestError}</p></div>
            )}

            {/* ── Typing Indicator (loading) ── */}
            {suggestLoading && (
              <div className="ai-typing-wrap">
                <div className="ai-chat-avatar uc10">
                  <Sparkles size={16} color="#fff" />
                </div>
                <div className="ai-typing-bubble">
                  <div className="ai-typing-dots">
                    <span /><span /><span />
                  </div>
                  <span className="ai-typing-label">Gemini AI đang quét lịch trống...</span>
                </div>
              </div>
            )}

            {/* ── Chat Bubble Result (UC-10) ── */}
            {suggestResult && !suggestLoading && (
              <div className="ai-chat-result-wrap">
                <div className="ai-chat-bubble-row">
                  <div className="ai-chat-avatar uc10">
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <div className="ai-chat-bubble-content">
                    <div className="ai-chat-bubble-header">
                      <span className="ai-chat-bubble-name">
                        <CheckCircle2 size={13} color="#059669" />
                        Trợ lý AI · UC-10 Gợi ý Khung Giờ
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="ai-chat-bubble-time">{uc10ResultTime}</span>
                        <Link to="/schedule" style={{ textDecoration: 'none' }}>
                          <Button variant="ghost" size="sm" icon={<ExternalLink size={12} />} style={{ color: '#059669', background: '#ECFDF5', padding: '4px 10px' }}>
                            Xem trên Lịch
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="ai-chat-bubble">
                      <p className="ai-chat-bubble-text">
                        {suggestResult.suggestions_text || suggestResult.message}
                      </p>

                      {/* Slot Cards */}
                      {suggestResult.matched_slots && suggestResult.matched_slots.length > 0 && (
                        <>
                          <div className="ai-slots-heading">
                            <Calendar size={13} />
                            Các khung giờ khả dụng ({suggestResult.matched_slots.length} ca trống):
                          </div>
                          <div className="ai-slots-grid">
                            {suggestResult.matched_slots.map(s => (
                              <div key={s.slot_id} className={`ai-slot-card ${getSlotTimeClass(s.start_time)}`}>
                                <div className="ai-slot-info">
                                  <div className="ai-slot-court">{s.court_name}</div>
                                  <div className="ai-slot-time">{s.start_time} — {s.end_time}</div>
                                  <div className="ai-slot-price">{s.price ? `${Number(s.price).toLocaleString('vi-VN')}đ/giờ` : '—'}</div>
                                </div>
                                <Link to={`/schedule?date=${suggestForm.preferred_date}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                                  <Button variant="secondary" size="sm" style={{ borderColor: '#86EFAC', color: '#059669', whiteSpace: 'nowrap' }}>
                                    Đặt ca này
                                  </Button>
                                </Link>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="ai-disclaimer" style={{ marginTop: '0.85rem' }}>
                        <span>⚠️ Kết quả AI chỉ mang tính tham khảo. Vui lòng kiểm tra tính chính xác và xác nhận trước khi thực hiện hành động liên quan đến khách hàng.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: UC-11 SOẠN TIN NHẮN ───────────────── */}
      {staffTab === 'uc11' && (
        <div className="animate-fade-in">
          <div className="ai-content-card">
            {/* Section Hero */}
            <div className="ai-section-hero">
              <div className="ai-section-hero-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                <MessageSquare size={24} />
              </div>
              <div className="ai-section-hero-text">
                <h2>
                  UC-11: AI Sinh tin nhắn khách hàng
                  <span className="badge-staff-tag">Nghiệp vụ trực quầy</span>
                </h2>
                <p>
                  Nhập mã đơn đặt (Booking ID) để Gemini AI tự động trích xuất thông tin khách hàng, sân, ngày giờ, số tiền cọc &amp; số dư còn lại và biên soạn tin nhắn lịch sự, chuẩn mực sẵn sàng gửi qua Zalo hoặc SMS.
                </p>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="quick-prompts-bar">
              <span className="quick-prompts-label">Gợi ý tác vụ:</span>
              <button
                type="button"
                className={`prompt-chip prompt-chip-indigo ${msgType === 'confirmation' ? 'active' : ''}`}
                onClick={() => setMsgType('confirmation')}
                title="Tin xác nhận đặt sân"
              >
                ✅ Soạn tin xác nhận đặt sân
              </button>
              <button
                type="button"
                className={`prompt-chip prompt-chip-sky ${msgType === 'reminder' ? 'active' : ''}`}
                onClick={() => setMsgType('reminder')}
                title="Tin nhắc lịch thi đấu"
              >
                🔔 Soạn tin nhắc lịch cho khách
              </button>
            </div>

            {/* Quick Booking Selector */}
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
                      #{b.id} — {b.customer?.full_name || 'Khách'} ({b.court?.name || 'Sân'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleGenerateMessage} style={{ marginTop: '1.1rem' }}>
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
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', display: 'block', marginBottom: 6 }}>
                    Mục đích tin nhắn
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={msgType}
                      onChange={e => setMsgType(e.target.value)}
                      style={{ width: '100%', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, color: '#0F172A', padding: '10px 36px 10px 14px', fontSize: '0.875rem', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
                    >
                      <option value="confirmation">Xác nhận đặt sân (gửi ngay sau khi xác nhận)</option>
                      <option value="reminder">Nhắc lịch thi đấu (gửi trước giờ thi đấu)</option>
                    </select>
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B', display: 'flex', alignItems: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  icon={<Send size={15} />}
                  loading={confirmLoading}
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,0.28)', padding: '10px 22px', fontWeight: 700 }}
                >
                  Tạo tin nhắn AI
                </Button>
              </div>
            </form>

            {/* Error */}
            {confirmError && (
              <div className="ai-alert-error"><AlertCircle size={16} style={{ flexShrink: 0 }} /><p>{confirmError}</p></div>
            )}

            {/* ── Typing Indicator (loading) ── */}
            {confirmLoading && (
              <div className="ai-typing-wrap">
                <div className="ai-chat-avatar uc11">
                  <Sparkles size={16} color="#fff" />
                </div>
                <div className="ai-typing-bubble">
                  <div className="ai-typing-dots">
                    <span /><span /><span />
                  </div>
                  <span className="ai-typing-label">Gemini AI đang soạn tin nhắn...</span>
                </div>
              </div>
            )}

            {/* ── Chat Bubble Result (UC-11) ── */}
            {confirmMsg && !confirmLoading && (
              <div className="ai-chat-result-wrap">
                <div className="ai-chat-bubble-row">
                  <div className="ai-chat-avatar uc11">
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <div className="ai-chat-bubble-content">
                    <div className="ai-chat-bubble-header">
                      <span className="ai-chat-bubble-name">
                        <CheckCircle2 size={13} color="#4F46E5" />
                        Trợ lý AI · UC-11 Tin nhắn khách hàng
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="ai-chat-bubble-time">{uc11ResultTime}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={msgCopied ? <Check size={13} /> : <Copy size={13} />}
                          onClick={handleCopyMessage}
                          style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: msgCopied ? '#059669' : '#4F46E5', padding: '4px 10px' }}
                        >
                          {msgCopied ? 'Đã sao chép!' : 'Sao chép tin nhắn'}
                        </Button>
                      </div>
                    </div>

                    <div className="ai-chat-bubble uc11">
                      <p style={{ fontSize: '0.82rem', color: '#4338CA', margin: '0 0 0.5rem', fontWeight: 600 }}>
                        📱 Nội dung tin nhắn sẵn sàng gửi (Zalo / SMS):
                      </p>
                      <div className="ai-message-box">{confirmMsg}</div>
                      <div className="ai-message-footer">
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Được tối ưu theo thông tin đơn #{bookingId}
                        </span>
                        <Link to="/bookings" style={{ fontSize: '0.78rem', color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
                          Xem đơn tại Danh sách đặt →
                        </Link>
                      </div>
                      <div className="ai-disclaimer" style={{ marginTop: '0.75rem' }}>
                        <span>⚠️ Kết quả AI chỉ mang tính tham khảo. Vui lòng kiểm tra tính chính xác và xác nhận trước khi gửi tin nhắn đến khách hàng.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
