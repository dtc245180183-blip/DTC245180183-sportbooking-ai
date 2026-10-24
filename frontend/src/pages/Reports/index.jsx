import { useState, useEffect } from 'react';
import { statisticsAPI, aiAPI } from '../../api';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, CalendarCheck, DollarSign, Sparkles, Clock, BarChart3 } from 'lucide-react';
import { Card, Badge, Skeleton, Button, Input } from '../../components/ui';
import AICard from '../../components/AICard';
import './Reports.css';

/* ── Custom Tooltip ─────────────────────────────── */
function ChartTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.5rem 0.85rem', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#64748B', margin: '0 0 4px', fontWeight: 500 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || '#2563EB', fontWeight: 700, margin: 0 }}>
          {format ? format(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function Reports() {
  const [overview, setOverview]     = useState(null);
  const [revenueData, setRevenue]   = useState([]);
  const [peakHours, setPeakHours]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [aiSummary, setAiSummary]   = useState('');
  const [aiRawData, setAiRawData]   = useState(null);
  const [aiError, setAiError]       = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showDepositDetail, setShowDepositDetail] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = '2026-09-01'; // Mặc định hiển thị toàn bộ khoảng phát sinh giao dịch mẫu
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate]     = useState(today);
  const [activePreset, setActivePreset] = useState('all');

  const applyPreset = (preset) => {
    setActivePreset(preset);
    if (preset === 'all') {
      setFromDate('2026-09-01');
      setToDate(today);
    } else if (preset === '30') {
      const from = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
      setFromDate(from);
      setToDate(today);
    } else if (preset === '7') {
      const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
      setFromDate(from);
      setToDate(today);
    }
  };

  useEffect(() => { fetchData(); }, [fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, rev, peak] = await Promise.all([
        statisticsAPI.getOverview(),
        statisticsAPI.getRevenueChart({ from_date: fromDate, to_date: toDate }),
        statisticsAPI.getPeakHours({ from_date: fromDate, to_date: toDate }),
      ]);
      setOverview(ov);
      setRevenue(rev.map(r => ({ ...r, dateLabel: r.date.slice(5) })));
      setPeakHours(peak);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true); setAiSummary(''); setAiRawData(null); setAiError('');
    try {
      const res = await aiAPI.occupancySummary({ from_date: fromDate, to_date: toDate });
      setAiSummary(res.summary); setAiRawData(res.raw_data);
    } catch (err) {
      setAiError(err.response?.data?.detail || 'Lỗi không xác định khi gọi AI.');
    } finally { setGeneratingAI(false); }
  };

  const fmt = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  const kpis = [
    { id: 'revenue',  icon: DollarSign,    label: 'Doanh thu (đã thu)',   value: overview ? fmt(overview.total_revenue)        : '—', color: '#059669', bg: '#DCFCE7' },
    { id: 'deposit',  icon: TrendingUp,    label: 'Tiền cọc (đang giữ)',  value: overview ? fmt(overview.total_deposit)        : '—', color: '#2563EB', bg: '#DBEAFE', clickable: true },
    { id: 'bookings', icon: CalendarCheck, label: 'Tổng lượt đặt',        value: overview ? `${overview.total_bookings} lượt` : '—', color: '#7C3AED', bg: '#F3E8FF' },
    { id: 'occ',      icon: Users,         label: 'Tỉ lệ lấp đầy TB',    value: overview ? `${overview.avg_occupancy_rate}%` : '—', color: '#D97706', bg: '#FEF3C7' },
  ];

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Báo cáo &amp; Thống kê</h1>
          <p className="page-subtitle">Tổng quan hoạt động kinh doanh và hiệu suất vận hành sân</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', background: '#FFFFFF', padding: '0.6rem 1rem', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '0.4rem', marginRight: '0.25rem' }}>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                background: activePreset === 'all' ? '#059669' : '#F1F5F9',
                color: activePreset === 'all' ? '#FFFFFF' : '#475569',
                border: 'none', transition: 'all 0.15s'
              }}
            >
              Toàn thời gian
            </button>
            <button
              type="button"
              onClick={() => applyPreset('30')}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                background: activePreset === '30' ? '#059669' : '#F1F5F9',
                color: activePreset === '30' ? '#FFFFFF' : '#475569',
                border: 'none', transition: 'all 0.15s'
              }}
            >
              30 ngày qua
            </button>
            <button
              type="button"
              onClick={() => applyPreset('7')}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                background: activePreset === '7' ? '#059669' : '#F1F5F9',
                color: activePreset === '7' ? '#FFFFFF' : '#475569',
                border: 'none', transition: 'all 0.15s'
              }}
            >
              7 ngày qua
            </button>
          </div>
          <Input label="Từ ngày" type="date" value={fromDate} max={toDate} onChange={e => { setFromDate(e.target.value); setActivePreset('custom'); }} style={{ width: 140 }} />
          <Input label="Đến ngày" type="date" value={toDate} min={fromDate} onChange={e => { setToDate(e.target.value); setActivePreset('custom'); }} style={{ width: 140 }} />
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {loading
          ? [1,2,3,4].map(i => <Skeleton key={i} height="90px" variant="rect" style={{ borderRadius: 12 }} />)
          : kpis.map(k => (
          <div key={k.label || k.id} style={{ position: 'relative' }}>
            <Card
              padding="md"
              style={{
                borderTop: `3px solid ${k.color}`,
                cursor: k.clickable ? 'pointer' : 'default',
                transition: 'transform 0.15s, box-shadow 0.15s',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderTopWidth: 3,
                borderTopColor: k.color,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              onClick={k.clickable ? () => setShowDepositDetail(v => !v) : undefined}
              onMouseEnter={k.clickable ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px rgba(0,0,0,0.07)`; } : undefined}
              onMouseLeave={k.clickable ? e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; } : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <k.icon size={20} color={k.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 3px', fontWeight: 600 }}>
                    {k.label}
                    {k.clickable && <span style={{ marginLeft: 5, fontSize: '0.65rem', color: '#2563EB' }}>▼ chi tiết</span>}
                  </p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.value}</p>
                </div>
              </div>
            </Card>

            {/* Deposit detail dropdown */}
            {k.clickable && showDepositDetail && overview && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
                background: '#FFFFFF',
                border: '1px solid #BFDBFE',
                borderRadius: 12,
                padding: '0.875rem 1rem',
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
              }}>
                {/* Arrow */}
                <div style={{
                  position: 'absolute', top: -7, left: 20,
                  width: 13, height: 13, background: '#FFFFFF',
                  border: '1px solid #BFDBFE',
                  borderRight: 'none', borderBottom: 'none',
                  transform: 'rotate(45deg)',
                }} />

                <p style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.625rem', fontWeight: 700 }}>
                  Phân tích cọc đang giữ
                </p>

                {/* Row 1: cọc từ đơn hoạt động */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: '0.78rem', color: '#334155' }}>Đơn đang hoạt động</span>
                    <span style={{ fontSize: '0.68rem', color: '#64748B' }}>(pending / confirmed)</span>
                  </div>
                  <strong style={{ fontSize: '0.88rem', color: '#059669' }}>{fmt(overview.deposit_from_active ?? 0)}</strong>
                </div>

                {/* Row 2: cọc giữ sau hủy */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: '0.78rem', color: '#334155' }}>Cọc giữ sau hủy</span>
                    <span style={{ fontSize: '0.68rem', color: '#64748B' }}>(chưa hoàn trả)</span>
                  </div>
                  <strong style={{ fontSize: '0.88rem', color: '#D97706' }}>{fmt(overview.deposit_from_cancelled ?? 0)}</strong>
                </div>

                {/* Divider + Total */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Tổng đang giữ</span>
                  <strong style={{ fontSize: '0.95rem', color: '#2563EB' }}>{fmt(overview.total_deposit)}</strong>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); setShowDepositDetail(false); }}
                  style={{ marginTop: '0.5rem', display: 'block', width: '100%', background: 'none', border: 'none', color: '#64748B', fontSize: '0.72rem', cursor: 'pointer', textAlign: 'right', fontWeight: 500 }}>
                  × Đóng
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 2-column layout: Charts | AI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.25rem', alignItems: 'start' }}>

        {/* LEFT: charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Revenue AreaChart */}
          <Card padding="md">
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} style={{ color: '#2563EB' }} /> Doanh thu theo ngày
            </h3>
            {loading ? <Skeleton height="220px" variant="rect" /> : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="dateLabel" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} width={40} />
                  <Tooltip content={<ChartTooltip format={v => `${v.toLocaleString()}đ`} />} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revG)" dot={false} activeDot={{ r: 4, fill: '#2563EB' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p style={{ color: '#64748B', textAlign: 'center', padding: '3rem 0' }}>Không có dữ liệu trong khoảng này</p>}
          </Card>

          {/* Peak Hours BarChart */}
          <Card padding="md">
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} style={{ color: '#7C3AED' }} /> Lượt đặt theo khung giờ
            </h3>
            {loading ? <Skeleton height="220px" variant="rect" /> : peakHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={peakHours} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="peakG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={v => `${v}`} width={28} />
                  <Tooltip content={<ChartTooltip format={v => `${v} lượt`} />} />
                  <Bar dataKey="booked_slots" fill="url(#peakG)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ color: '#64748B', textAlign: 'center', padding: '3rem 0' }}>Không có dữ liệu trong khoảng này</p>}
          </Card>

          {/* AI raw data chart — hiển thị khi đã chạy AI */}
          {aiRawData && Object.keys(aiRawData).length > 0 && (
            <Card padding="md">
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#6D28D9', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> Dữ liệu phân tích AI (lấp đầy theo giờ)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={Object.entries(aiRawData).sort(([a],[b]) => a.localeCompare(b)).map(([hour, d]) => ({ hour, rate: d.occupancy_rate_percent }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" domain={[0,100]} width={34} />
                  <Tooltip content={<ChartTooltip format={v => `${v}%`} />} />
                  <Bar dataKey="rate" fill="#8B5CF6" radius={[4,4,0,0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* RIGHT: AI section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>
          <Card padding="md" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#6D28D9', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} /> AI Phân tích &amp; Gợi ý
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
              AI sẽ phân tích dữ liệu từ <strong style={{ color: '#0F172A' }}>{fromDate}</strong> đến <strong style={{ color: '#0F172A' }}>{toDate}</strong> và gợi ý chiến lược khuyến mại.
            </p>
            <Button
              variant="primary"
              icon={<Sparkles size={14} />}
              loading={generatingAI}
              style={{ width: '100%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}
              onClick={handleGenerateAI}
            >
              {generatingAI ? 'AI đang phân tích...' : 'Tạo báo cáo AI'}
            </Button>
            {(aiSummary || aiError) && (
              <button
                onClick={() => { setAiSummary(''); setAiRawData(null); setAiError(''); }}
                style={{ marginTop: 8, background: 'none', border: 'none', color: '#64748B', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Xóa kết quả
              </button>
            )}
          </Card>

          {(generatingAI || aiSummary || aiError) && (
            <AICard loading={generatingAI} title="Phân tích công suất & Gợi ý khuyến mại" error={aiError}>
              {aiSummary && <p className="ai-card-text">{aiSummary}</p>}
            </AICard>
          )}
        </div>
      </div>
    </div>
  );
}
