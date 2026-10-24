import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { statisticsAPI, bookingsAPI, customersAPI } from '../../api';
import {
  TrendingUp, Activity, DollarSign, Calendar, ArrowUpRight,
  Trophy, Clock, Building2, Flame, CalendarCheck, Users,
  Sparkles, PlusCircle, ArrowRight, CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Skeleton, Button } from '../../components/ui';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts';
import './Dashboard.css';

const BAR_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

/* ── Custom tooltip ─────────────────────────────── */
function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.5rem 0.9rem', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#475569', margin: '0 0 4px', fontWeight: 600 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || '#10B981', fontWeight: 700, margin: 0 }}>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/* ── KPI Sparkline (Pure SVG, zero layout shift) ─ */
function MiniSparkline({ data, color = '#10B981' }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => Number(d.value || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 84;
  const height = 28;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
  const gradId = `spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div style={{ width, height, overflow: 'hidden', marginLeft: 'auto', flexShrink: 0 }} title="Xu hướng chuỗi thời gian">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ── Format money accurately ────────────────────── */
const formatMoney = (amount) => {
  if (amount == null) return '—';
  return `${Number(amount).toLocaleString('en-US')} đ`;
};

/* ── Format local date YYYY-MM-DD ────────────────── */
const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/* ── Main Dashboard ──────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [overview, setOverview]         = useState(null);
  const [revenue, setRevenue]           = useState([]);
  const [allRevenue, setAllRevenue]     = useState([]);
  const [peakHours, setPeakHours]       = useState([]);
  const [courtOcc, setCourtOcc]         = useState([]);
  const [chartDays, setChartDays]       = useState('all'); // 'all' | 7 | 14 | 30
  const [recentBookings, setRecentBookings] = useState([]);
  const [customerCount, setCustomerCount]   = useState(0);
  const [loading, setLoading]           = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchRevenue = useCallback(async (days) => {
    if (!isAdmin) return;
    setChartLoading(true);
    try {
      let rev;
      if (days === 'all') {
        rev = await statisticsAPI.getRevenueChart({ all_time: true });
        setAllRevenue(rev);
      } else {
        const daysNum = parseInt(days, 10);
        const now = new Date();
        const to_date = formatLocalDate(now);
        const fromDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysNum - 1));
        const from_date = formatLocalDate(fromDateObj);
        rev = await statisticsAPI.getRevenueChart({ from_date, to_date });
      }
      setRevenue(Array.isArray(rev) ? rev : []);
    } catch (e) {
      console.error('Failed to load revenue chart data', e);
    } finally {
      setChartLoading(false);
    }
  }, [isAdmin]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch overview (áp dụng cho cả admin và staff)
      const ovPromise = statisticsAPI.getOverview();

      if (isAdmin) {
        // Admin: Load biểu đồ doanh thu, giờ cao điểm, công suất sân
        let revPromise;
        if (chartDays === 'all') {
          revPromise = statisticsAPI.getRevenueChart({ all_time: true });
        } else {
          const daysNum = parseInt(chartDays, 10);
          const now = new Date();
          const to_date = formatLocalDate(now);
          const fromDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysNum - 1));
          const from_date = formatLocalDate(fromDateObj);
          revPromise = statisticsAPI.getRevenueChart({ from_date, to_date });
        }

        const [ov, rev, peak, occ] = await Promise.all([
          ovPromise,
          revPromise,
          statisticsAPI.getPeakHours({ all_time: true }),
          statisticsAPI.getCourtOccupancy({ all_time: true }),
        ]);

        setOverview(ov);
        const safeRev = Array.isArray(rev) ? rev : [];
        setRevenue(safeRev);
        if (chartDays === 'all') {
          setAllRevenue(safeRev);
        } else {
          statisticsAPI.getRevenueChart({ all_time: true }).then(r => setAllRevenue(Array.isArray(r) ? r : [])).catch(() => {});
        }
        setPeakHours(Array.isArray(peak) ? peak : []);
        setCourtOcc(Array.isArray(occ) ? occ : []);
      } else {
        // Staff: Không gọi API doanh thu/báo cáo chuyên sâu, chỉ tải danh sách tác nghiệp và khách hàng
        const [ov, bookingsRes, custRes] = await Promise.all([
          ovPromise,
          bookingsAPI.getAll({ limit: 8 }),
          customersAPI.getAll({}),
        ]);

        setOverview(ov);
        // Sắp xếp đơn đặt mới nhất lên đầu
        const sorted = Array.isArray(bookingsRes)
          ? [...bookingsRes].sort((a, b) => b.id - a.id).slice(0, 8)
          : [];
        setRecentBookings(sorted);
        setCustomerCount(Array.isArray(custRes) ? custRes.length : 0);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, chartDays]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleChartDaysChange = (e) => {
    const val = e.target.value;
    setChartDays(val);
    fetchRevenue(val);
  };

  /* ── Peak hours list for Admin ── */
  const topPeakHours = [...peakHours]
    .filter(h => h.booked_slots > 0)
    .sort((a, b) => {
      if (b.booked_slots !== a.booked_slots) return b.booked_slots - a.booked_slots;
      const hA = parseInt(a.hour, 10);
      const hB = parseInt(b.hour, 10);
      const isPrimeA = hA >= 17 && hA <= 22 ? 1 : 0;
      const isPrimeB = hB >= 17 && hB <= 22 ? 1 : 0;
      if (isPrimeB !== isPrimeA) return isPrimeB - isPrimeA;
      return hA - hB;
    })
    .slice(0, 3);

  /* ── KPI Cards for Admin ── */
  const adminKpiCards = [
    {
      icon: DollarSign,
      label: 'Tổng doanh thu',
      value: overview ? formatMoney(overview.total_revenue) : '—',
      sub: 'Toàn bộ thời gian',
      color: '#059669',
      bg: '#DCFCE7',
      sparklineData: (allRevenue.length > 0 ? allRevenue : revenue).map(r => ({ value: r.revenue })),
    },
    {
      icon: TrendingUp,
      label: 'Doanh thu gần đây',
      value: overview ? formatMoney(overview.today_revenue) : '—',
      sub: new Date().toLocaleDateString('vi-VN'),
      color: '#2563EB',
      bg: '#DBEAFE',
      sparklineData: (allRevenue.length > 0 ? allRevenue : revenue).slice(-7).map(r => ({ value: r.revenue })),
    },
    {
      icon: Activity,
      label: 'Công suất TB',
      value: overview ? `${overview.avg_occupancy_rate}%` : '—',
      sub: 'Toàn bộ thời gian',
      color: '#D97706',
      bg: '#FEF3C7',
      sparklineData: courtOcc.map(c => ({ value: c.occupancy_rate })),
    },
    {
      icon: Calendar,
      label: 'Lịch đặt hôm nay',
      value: overview?.today_bookings != null ? `${overview.today_bookings} ca` : '—',
      sub: `Công suất: ${overview?.today_occupancy_rate ?? 0}%`,
      color: '#7C3AED',
      bg: '#F3E8FF',
      sparklineData: peakHours.map(p => ({ value: p.booked_slots })),
    },
  ];

  /* ── KPI Cards for Staff (Tác nghiệp quầy, không lộ tổng doanh thu) ── */
  const staffKpiCards = [
    {
      icon: CalendarCheck,
      label: 'Tổng lịch đặt',
      value: overview ? `${overview.total_bookings} lượt` : '—',
      sub: 'Tất cả các sân',
      color: '#2563EB',
      bg: '#DBEAFE',
      sparklineData: recentBookings.slice(0, 7).reverse().map(b => ({ value: b.total_amount || 1 })),
    },
    {
      icon: Building2,
      label: 'Sân đang hoạt động',
      value: overview ? `${overview.active_courts}/${overview.total_courts}` : '—',
      sub: 'Sẵn sàng phục vụ',
      color: '#059669',
      bg: '#DCFCE7',
    },
    {
      icon: Clock,
      label: 'Lịch đặt hôm nay',
      value: overview?.today_bookings != null ? `${overview.today_bookings} ca` : '—',
      sub: `Công suất: ${overview?.today_occupancy_rate ?? 0}%`,
      color: '#7C3AED',
      bg: '#F3E8FF',
    },
    {
      icon: Users,
      label: 'Khách hàng',
      value: `${customerCount} khách`,
      sub: 'Hồ sơ lưu trữ',
      color: '#D97706',
      bg: '#FEF3C7',
    },
  ];

  const currentKpiCards = isAdmin ? adminKpiCards : staffKpiCards;

  /* ── Chart Y-axis formatters ── */
  const maxRev = Math.max(...revenue.map(r => r.revenue || 0), 0);
  const yDomain = maxRev > 0 ? [0, 'auto'] : [0, 500000];
  const yTicks = maxRev === 0 ? [0, 100000, 200000, 300000, 500000] : undefined;

  const formatRevenueYAxis = (v) => {
    if (v === 0) return '0đ';
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    return `${(v / 1000).toFixed(0)}K`;
  };

  return (
    <div className="dashboard-page animate-fade-in">
      {/* === HERO BANNER === */}
      <div className="dashboard-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">
            <Trophy size={13} />
            <span>SportBooking Pro • {isAdmin ? 'Quản lý sân' : 'Nhân viên trực quầy'}</span>
          </div>
          <h1 className="hero-title">
            Chào mừng trở lại, <span style={{ color: '#059669' }}>{user?.full_name || 'Bạn'}!</span>
          </h1>
          <p className="hero-subtitle">
            {isAdmin
              ? 'Hệ thống quản trị sân thông minh — giám sát doanh thu, công suất và điều hành hoạt động kinh doanh thể thao.'
              : 'Giao diện tác nghiệp quầy — kiểm tra lịch trống, tiếp nhận đặt sân và hỗ trợ khách hàng nhanh chóng.'}
          </p>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{overview?.total_bookings ?? '—'}</span>
              <span className="hero-stat-label">Lịch đặt</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">{overview?.avg_occupancy_rate ?? '—'}%</span>
              <span className="hero-stat-label">Công suất</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">{overview?.active_courts ?? '—'}/{overview?.total_courts ?? '—'}</span>
              <span className="hero-stat-label">Sân hoạt động</span>
            </div>
          </div>
        </div>

        {/* Clear and sharp background image on the right */}
        <div className="hero-image-side">
          <img src="/sports_hero.jpg" alt="Sports facility" className="hero-img" />
        </div>
      </div>

      {/* === STAFF ACTION SHORTCUTS (Lối tắt thao tác nhanh dành cho nhân viên) === */}
      {!isAdmin && (
        <div className="staff-actions-bar">
          <Link to="/schedule" className="staff-action-card">
            <div className="staff-action-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Calendar size={22} />
            </div>
            <div className="staff-action-info">
              <h4 className="staff-action-title">Lịch đặt sân</h4>
              <p className="staff-action-desc">Xem sơ đồ ca &amp; trạng thái sân trực quan</p>
            </div>
            <ArrowRight size={16} color="#94A3B8" />
          </Link>

          <Link to="/bookings" className="staff-action-card">
            <div className="staff-action-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <PlusCircle size={22} />
            </div>
            <div className="staff-action-info">
              <h4 className="staff-action-title">Đặt sân mới</h4>
              <p className="staff-action-desc">Tạo phiếu đặt &amp; ghi nhận tiền cọc</p>
            </div>
            <ArrowRight size={16} color="#94A3B8" />
          </Link>

          <Link to="/schedule" className="staff-action-card">
            <div className="staff-action-icon" style={{ background: '#FAF5FF', color: '#7C3AED' }}>
              <Sparkles size={22} />
            </div>
            <div className="staff-action-info">
              <h4 className="staff-action-title">Nhờ AI gợi ý khung giờ</h4>
              <p className="staff-action-desc">Tìm ca trống nhanh chóng cho khách (UC-10)</p>
            </div>
            <ArrowRight size={16} color="#94A3B8" />
          </Link>
        </div>
      )}

      {/* === KPI CARDS === */}
      <div className="kpi-grid">
        {loading
          ? [1, 2, 3, 4].map(i => <Skeleton key={i} height="106px" variant="rect" style={{ borderRadius: 16 }} />)
          : currentKpiCards.map(card => (
            <div key={card.label} className="kpi-card">
              <div className="kpi-icon-box" style={{ background: card.bg }}>
                <card.icon size={22} color={card.color} />
              </div>
              <div className="kpi-body">
                <p className="kpi-label">{card.label}</p>
                <p className="kpi-value" style={{ color: card.color }}>{card.value}</p>
                <p className="kpi-sub">{card.sub}</p>
              </div>
              {card.sparklineData && card.sparklineData.length >= 2 ? (
                <MiniSparkline data={card.sparklineData} color={card.color} />
              ) : (
                <ArrowUpRight size={17} className="kpi-arrow" style={{ color: card.color }} />
              )}
            </div>
          ))}
      </div>

      {/* =======================================================
          ADMIN VIEW: BIỂU ĐỒ DOANH THU & GIỜ CAO ĐIỂM + CÔNG SUẤT
          ======================================================= */}
      {isAdmin && (
        <>
          <div className="charts-grid">
            {/* Revenue AreaChart */}
            <Card padding="md" style={{ borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={16} color="#059669" /> Doanh thu theo ngày
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>Đơn vị: VNĐ</p>
                </div>
                <select
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, color: '#0F172A', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
                  value={chartDays} onChange={handleChartDaysChange}
                >
                  <option value="all">Toàn thời gian (Tất cả)</option>
                  <option value="7">7 ngày qua</option>
                  <option value="14">14 ngày qua</option>
                  <option value="30">30 ngày qua</option>
                </select>
              </div>
              {chartLoading || loading ? (
                <Skeleton height="180px" variant="rect" style={{ borderRadius: 12 }} />
              ) : revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={revenue} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => v.slice(5)}
                    />
                    <YAxis
                      domain={yDomain}
                      ticks={yTicks}
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatRevenueYAxis}
                      width={46}
                    />
                    <Tooltip content={<CustomTooltip formatter={v => `${v.toLocaleString('vi-VN')} đ`} />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fill="url(#revGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">Chưa có dữ liệu doanh thu</div>
              )}
            </Card>

            {/* Peak Hours BarChart */}
            <Card padding="md" style={{ borderRadius: 16 }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color="#D97706" /> Lượt đặt theo giờ
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>Tất cả các ca đã đặt (Đơn vị: lượt đặt)</p>
              </div>
              {loading ? (
                <Skeleton height="180px" variant="rect" style={{ borderRadius: 12 }} />
              ) : peakHours.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={peakHours} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={{ fill: '#64748B', fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        width={26}
                        allowDecimals={false}
                        tickFormatter={v => `${v}`}
                      />
                      <Tooltip content={<CustomTooltip formatter={v => `${v} lượt`} />} />
                      <Bar dataKey="booked_slots" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                  {topPeakHours.length > 0 && (
                    <div className="peak-hours-row">
                      <div className="peak-hours-label">
                        <Flame size={14} />
                        <span>Giờ cao điểm:</span>
                      </div>
                      <div className="peak-badges-list">
                        {topPeakHours.map(h => (
                          <div key={h.hour} className="peak-badge">
                            <span className="peak-time">{h.hour}</span>
                            <span className="peak-count">{h.booked_slots} lượt</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="chart-empty">Chưa có dữ liệu</div>
              )}
            </Card>
          </div>

          {/* Court Occupancy Grid */}
          {(loading || courtOcc.length > 0) && (
            <div className="dashboard-section-card">
              <div className="section-header">
                <h3 className="section-title">
                  <Building2 size={18} color="#059669" />
                  <span>Công suất khai thác từng sân</span>
                  <span className="section-subtitle">(Toàn thời gian vận hành)</span>
                </h3>
              </div>
              {loading ? (
                <div className="court-occupancy-grid">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} height="110px" variant="rect" style={{ borderRadius: 12 }} />
                  ))}
                </div>
              ) : (
                <div className="court-occupancy-grid">
                  {courtOcc.map((c, i) => {
                    const color = BAR_COLORS[i % BAR_COLORS.length];
                    return (
                      <div key={c.court_id} className="court-mini-card">
                        <div className="court-mini-header">
                          <div className="court-mini-title-wrap">
                            <div className="court-dot" style={{ background: color }} />
                            <span className="court-name">{c.court_name}</span>
                          </div>
                          <span
                            className="court-rate-badge"
                            style={{
                              color: color,
                              background: `${color}18`,
                              border: `1px solid ${color}35`,
                            }}
                          >
                            {c.occupancy_rate.toFixed(1)}%
                          </span>
                        </div>

                        {/* Progress track */}
                        <div className="court-progress-track">
                          <div
                            className="court-progress-bar"
                            style={{
                              width: `${Math.min(c.occupancy_rate, 100)}%`,
                              background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                            }}
                          />
                        </div>

                        <div className="court-mini-footer">
                          <span className="court-revenue">
                            Doanh thu: <strong style={{ color }}>{c.total_revenue.toLocaleString('vi-VN')}đ</strong>
                          </span>
                          <span className="court-slots">
                            {c.booked_slots}/{c.total_slots} ca
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* =======================================================
          STAFF VIEW: BẢNG DANH SÁCH LỊCH ĐẶT GẦN NHẤT
          ======================================================= */}
      {!isAdmin && (
        <div className="staff-bookings-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarCheck size={18} color="#2563EB" /> Lịch đặt sân gần nhất
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '3px 0 0' }}>
                Danh sách các yêu cầu đặt sân mới nhất cần theo dõi &amp; phục vụ
              </p>
            </div>
            <Link to="/bookings" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                Xem tất cả lịch đặt
              </Button>
            </Link>
          </div>

          <div className="staff-bookings-table-wrap">
            {loading ? (
              <div style={{ padding: '1rem 0' }}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} height="40px" variant="rect" style={{ borderRadius: 8, marginBottom: 8 }} />)}
              </div>
            ) : recentBookings.length > 0 ? (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Sân</th>
                    <th>Thời gian</th>
                    <th>Tiền cọc</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map(b => {
                    const statusClass = b.status === 'completed'
                      ? 'status-completed'
                      : b.status === 'confirmed'
                      ? 'status-confirmed'
                      : b.status === 'cancelled'
                      ? 'status-cancelled'
                      : 'status-pending';

                    const statusLabel = b.status === 'completed'
                      ? 'Hoàn thành'
                      : b.status === 'confirmed'
                      ? 'Đã xác nhận'
                      : b.status === 'cancelled'
                      ? 'Đã hủy'
                      : 'Chờ xử lý';

                    return (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 700, color: '#2563EB' }}>#{b.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{b.customer?.full_name || 'Khách vãng lai'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{b.customer?.phone || '—'}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#1E293B' }}>{b.court?.name || '—'}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{b.time_slot?.date || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {b.time_slot?.start_time ? String(b.time_slot.start_time).slice(0, 5) : ''}
                            {b.time_slot?.end_time ? ` - ${String(b.time_slot.end_time).slice(0, 5)}` : ''}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: '#2563EB' }}>
                          {formatMoney(b.deposit_amount || 0)}
                        </td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>
                          {formatMoney(b.total_amount)}
                        </td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>
                            {b.status === 'completed' && <CheckCircle2 size={11} />}
                            {b.status === 'confirmed' && <CheckCircle2 size={11} />}
                            {b.status === 'cancelled' && <XCircle size={11} />}
                            {b.status === 'pending' && <AlertCircle size={11} />}
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="chart-empty" style={{ margin: '1rem 0' }}>
                Chưa có đơn đặt sân nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
