import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { statisticsAPI, bookingsAPI, customersAPI, courtsAPI } from '../../api';
import {
  TrendingUp, Activity, DollarSign, Calendar, ArrowUpRight,
  Trophy, Clock, Building2, Flame, CalendarCheck, Users,
  Sparkles, PlusCircle, ArrowRight, CheckCircle2, AlertCircle, XCircle,
  Sunrise, Sun, Moon, MessageSquare, Phone, Search, Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Skeleton, Button } from '../../components/ui';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import './Dashboard.css';

const BAR_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

/* ── Custom tooltip ─────────────────────────────── */
function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  const isHour = typeof label === 'string' && label.includes(':');
  const labelDisplay = isHour ? `Khung giờ ${label}` : `Ngày ${label}`;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.5rem 0.9rem', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#475569', margin: '0 0 4px', fontWeight: 600 }}>{labelDisplay}</p>
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

/* ── Format money accurately (Standard VNĐ) ─────── */
const formatMoney = (amount) => {
  if (amount == null) return '0đ';
  return `${Number(amount).toLocaleString('vi-VN')}đ`;
};

/* ── Format local date YYYY-MM-DD ────────────────── */
const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/* ── Sport Metadata Helper (Icons, Badges, Colors) ─ */
const getSportMeta = (courtName = '', typeName = '') => {
  const text = `${courtName} ${typeName}`.toLowerCase();
  if (text.includes('bóng đá') || text.includes('bóng a') || text.includes('bóng b') || text.includes('futsal')) {
    return { icon: '⚽', sport: 'Bóng đá', badgeColor: '#16A34A', badgeBg: '#DCFCE7', border: '#86EFAC' };
  }
  if (text.includes('cầu lông')) {
    return { icon: '🏸', sport: 'Cầu lông', badgeColor: '#0284C7', badgeBg: '#E0F2FE', border: '#7DD3FC' };
  }
  if (text.includes('bóng chuyền') || text.includes('chuyền')) {
    return { icon: '🏐', sport: 'Bóng chuyền', badgeColor: '#9333EA', badgeBg: '#F3E8FF', border: '#D8B4FE' };
  }
  if (text.includes('pickle') || text.includes('picker')) {
    return { icon: '🏓', sport: 'Pickleball', badgeColor: '#EA580C', badgeBg: '#FFEDD5', border: '#FDBA74' };
  }
  if (text.includes('tennis')) {
    return { icon: '🎾', sport: 'Tennis', badgeColor: '#0D9488', badgeBg: '#CCFBF1', border: '#5EEAD4' };
  }
  if (text.includes('rổ') || text.includes('basketball')) {
    return { icon: '🏀', sport: 'Bóng rổ', badgeColor: '#C2410C', badgeBg: '#FFEDD5', border: '#FED7AA' };
  }
  return { icon: '🏟️', sport: 'Sân tập', badgeColor: '#475569', badgeBg: '#F1F5F9', border: '#CBD5E1' };
};

/* ── Main Dashboard Component ────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [overview, setOverview]               = useState(null);
  const [revenue, setRevenue]                 = useState([]);
  const [allRevenue, setAllRevenue]           = useState([]);
  const [peakHours, setPeakHours]             = useState([]);
  const [courtOcc, setCourtOcc]               = useState([]);
  const [chartDays, setChartDays]             = useState('all');
  const [peakDays, setPeakDays]               = useState('all');
  const [recentBookings, setRecentBookings]   = useState([]);
  const [customerCount, setCustomerCount]     = useState(0);
  const [courts, setCourts]                   = useState([]);
  const [bookingFilter, setBookingFilter]     = useState('all'); // 'all' | 'today' | 'confirmed' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery]         = useState('');
  const [loading, setLoading]                 = useState(true);
  const [chartLoading, setChartLoading]       = useState(false);
  const [peakLoading, setPeakLoading]         = useState(false);

  const getDateRangeParams = useCallback((days) => {
    if (days === 'all') return { all_time: true };
    const daysNum = parseInt(days, 10);
    const now = new Date();
    const to_date = formatLocalDate(now);
    const fromDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysNum - 1));
    const from_date = formatLocalDate(fromDateObj);
    return { from_date, to_date };
  }, []);

  const fetchRevenue = useCallback(async (days) => {
    if (!isAdmin) return;
    setChartLoading(true);
    try {
      const params = getDateRangeParams(days);
      const rev = await statisticsAPI.getRevenueChart(params);
      const safeRev = Array.isArray(rev) ? rev : [];
      setRevenue(safeRev);
      if (days === 'all') {
        setAllRevenue(safeRev);
      }
    } catch (e) {
      console.error('Failed to load revenue chart data', e);
    } finally {
      setChartLoading(false);
    }
  }, [isAdmin, getDateRangeParams]);

  const fetchPeakHours = useCallback(async (days) => {
    if (!isAdmin) return;
    setPeakLoading(true);
    try {
      const params = getDateRangeParams(days);
      const peak = await statisticsAPI.getPeakHours(params);
      setPeakHours(Array.isArray(peak) ? peak : []);
    } catch (e) {
      console.error('Failed to load peak hours data', e);
    } finally {
      setPeakLoading(false);
    }
  }, [isAdmin, getDateRangeParams]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const ovPromise = statisticsAPI.getOverview();

      if (isAdmin) {
        const [ov, rev, peak, occ] = await Promise.all([
          ovPromise,
          statisticsAPI.getRevenueChart(getDateRangeParams(chartDays)),
          statisticsAPI.getPeakHours(getDateRangeParams(peakDays)),
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
        // Staff View: Tải danh sách đơn đặt, khách hàng và danh sách sân hiện có
        const [ov, bookingsRes, custRes, courtsRes] = await Promise.all([
          ovPromise,
          bookingsAPI.getAll({ limit: 25 }),
          customersAPI.getAll({}),
          courtsAPI.getAll({}),
        ]);

        setOverview(ov);
        const sorted = Array.isArray(bookingsRes)
          ? [...bookingsRes].sort((a, b) => b.id - a.id)
          : [];
        setRecentBookings(sorted);
        setCustomerCount(Array.isArray(custRes) ? custRes.length : 0);
        setCourts(Array.isArray(courtsRes) ? courtsRes : []);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, chartDays, peakDays, getDateRangeParams]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleChartDaysChange = (e) => {
    const val = e.target.value;
    setChartDays(val);
    fetchRevenue(val);
  };

  const handlePeakDaysChange = (e) => {
    const val = e.target.value;
    setPeakDays(val);
    fetchPeakHours(val);
  };

  /* ── Ca trực theo thời gian thực ── */
  const currentHour = new Date().getHours();
  let greetingTimeText = 'Chào buổi sáng';
  let shiftLabel = 'Ca Sáng (06:00 - 12:00)';
  if (currentHour >= 12 && currentHour < 18) {
    greetingTimeText = 'Chào buổi chiều';
    shiftLabel = 'Ca Chiều (12:00 - 18:00)';
  } else if (currentHour >= 18 || currentHour < 6) {
    greetingTimeText = 'Chào buổi tối';
    shiftLabel = 'Ca Tối (18:00 - 23:00)';
  }

  /* ── Phân tích lượt đặt theo 3 Ca/Buổi trong ngày (Admin) ── */
  const sessionStats = useMemo(() => {
    let morningBooked = 0, morningTotal = 0;
    let afternoonBooked = 0, afternoonTotal = 0;
    let eveningBooked = 0, eveningTotal = 0;

    peakHours.forEach(h => {
      const hourNum = parseInt(h.hour, 10);
      const b = Number(h.booked_slots || 0);
      const t = Number(h.total_slots || 0);
      if (hourNum < 12) {
        morningBooked += b;
        morningTotal += t;
      } else if (hourNum < 17) {
        afternoonBooked += b;
        afternoonTotal += t;
      } else {
        eveningBooked += b;
        eveningTotal += t;
      }
    });

    const totalBooked = morningBooked + afternoonBooked + eveningBooked;

    const sessions = [
      {
        id: 'morning',
        name: 'Buổi Sáng',
        timeRange: '06:00 - 12:00',
        icon: Sunrise,
        color: '#059669',
        bg: '#D1FAE5',
        barColor: '#10B981',
        booked: morningBooked,
        total: morningTotal,
        pct: totalBooked > 0 ? Math.round((morningBooked / totalBooked) * 100) : 0,
        tag: morningBooked > 0 ? 'Ổn định' : null,
      },
      {
        id: 'afternoon',
        name: 'Buổi Chiều',
        timeRange: '12:00 - 17:00',
        icon: Sun,
        color: '#EA580C',
        bg: '#FFEDD5',
        barColor: '#FB923C',
        booked: afternoonBooked,
        total: afternoonTotal,
        pct: totalBooked > 0 ? Math.round((afternoonBooked / totalBooked) * 100) : 0,
        tag: afternoonBooked === 0 ? 'Vắng khách' : null,
      },
      {
        id: 'evening',
        name: 'Buổi Tối',
        timeRange: '17:00 - 23:00',
        icon: Moon,
        color: '#6366F1',
        bg: '#EEF2FF',
        barColor: '#4F46E5',
        booked: eveningBooked,
        total: eveningTotal,
        pct: totalBooked > 0 ? Math.round((eveningBooked / totalBooked) * 100) : 0,
        tag: 'Giờ Vàng 🔥',
      },
    ];

    const busiest = [...sessions].sort((a, b) => b.booked - a.booked)[0];
    return { sessions, totalBooked, busiest };
  }, [peakHours]);

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

  /* ── KPI Cards for Staff (Hiện đại, trực quan, chuyên sâu tác nghiệp) ── */
  const staffKpiCards = [
    {
      icon: CalendarCheck,
      label: 'Tổng lịch đặt',
      value: overview ? `${overview.total_bookings} lượt` : '—',
      sub: 'Toàn bộ các sân',
      color: '#2563EB',
      bg: '#EFF6FF',
      sparklineData: recentBookings.slice(0, 7).reverse().map(b => ({ value: b.total_amount || 1 })),
    },
    {
      icon: Building2,
      label: 'Sân đang hoạt động',
      value: overview ? `${overview.active_courts}/${overview.total_courts} sân` : '—',
      sub: '100% sẵn sàng đón khách',
      color: '#059669',
      bg: '#ECFDF5',
      badge: 'Sẵn sàng',
    },
    {
      icon: Clock,
      label: 'Lịch đặt hôm nay',
      value: overview?.today_bookings != null ? `${overview.today_bookings} ca` : '0 ca',
      sub: `Công suất khai thác: ${overview?.today_occupancy_rate ?? 0}%`,
      color: '#7C3AED',
      bg: '#FAF5FF',
      badge: `${overview?.today_occupancy_rate ?? 0}% CS`,
    },
    {
      icon: Users,
      label: 'Hồ sơ khách hàng',
      value: `${customerCount} khách`,
      sub: 'Dữ liệu thành viên lưu trữ',
      color: '#D97706',
      bg: '#FFFBEB',
      badge: 'Thành viên',
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

  /* ── Filter & Search Logic for Staff Bookings ── */
  const todayStr = formatLocalDate(new Date());

  const bookingCounts = useMemo(() => {
    return {
      all: recentBookings.length,
      today: recentBookings.filter(b => b.time_slot?.date === todayStr).length,
      confirmed: recentBookings.filter(b => b.status === 'confirmed').length,
      completed: recentBookings.filter(b => b.status === 'completed').length,
      cancelled: recentBookings.filter(b => b.status === 'cancelled').length,
    };
  }, [recentBookings, todayStr]);

  const filteredBookings = useMemo(() => {
    let list = recentBookings;
    if (bookingFilter === 'today') {
      list = list.filter(b => b.time_slot?.date === todayStr);
    } else if (bookingFilter === 'confirmed') {
      list = list.filter(b => b.status === 'confirmed');
    } else if (bookingFilter === 'completed') {
      list = list.filter(b => b.status === 'completed');
    } else if (bookingFilter === 'cancelled') {
      list = list.filter(b => b.status === 'cancelled');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(b =>
        String(b.id).includes(q) ||
        (b.customer?.full_name || '').toLowerCase().includes(q) ||
        (b.customer?.phone || '').includes(q) ||
        (b.court?.name || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [recentBookings, bookingFilter, searchQuery, todayStr]);

  return (
    <div className="dashboard-page animate-fade-in">
      {/* =======================================================
          1. HERO BANNER — CÔNG NGHỆ CAO & MỀM MẠI (SOFT MODERN)
          ======================================================= */}
      <div className="dashboard-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-beacon-dot" />
            <Trophy size={13} />
            <span>SportBooking Pro • {isAdmin ? 'Quản lý điều hành' : 'Lễ tân trực quầy'}</span>
            {!isAdmin && (
              <span className="hero-shift-tag">{shiftLabel}</span>
            )}
          </div>

          <h1 className="hero-title">
            {greetingTimeText}, <span className="hero-title-name">{user?.full_name || 'Bạn'}!</span>
          </h1>

          <p className="hero-subtitle">
            {isAdmin
              ? 'Hệ thống quản trị sân thông minh — giám sát doanh thu, công suất và điều hành hoạt động kinh doanh thể thao.'
              : 'Bảng điều khiển tác nghiệp quầy — kiểm tra lịch trống, đón tiếp khách hàng và xử lý đặt sân nhanh chóng.'}
          </p>

          <div className="hero-stats">
            <div className="hero-stat-pill">
              <span className="hero-stat-value">{overview?.total_bookings ?? '—'}</span>
              <span className="hero-stat-label">Lịch đặt</span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-value">{overview?.avg_occupancy_rate ?? '—'}%</span>
              <span className="hero-stat-label">Công suất</span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-value">{overview?.active_courts ?? '—'}/{overview?.total_courts ?? '—'}</span>
              <span className="hero-stat-label">Sân sẵn sàng</span>
            </div>
          </div>
        </div>

        {/* Clear and sharp background image on the right */}
        <div className="hero-image-side">
          <img src="/sports_hero.jpg" alt="Sports facility" className="hero-img" />
        </div>
      </div>



      {/* =======================================================
          3. KPI METRIC CARDS (4 CHỈ SỐ HOẠT ĐỘNG CHUẨN DOANH NGHIỆP)
          ======================================================= */}
      <div className="kpi-grid">
        {loading
          ? [1, 2, 3, 4].map(i => <Skeleton key={i} height="110px" variant="rect" style={{ borderRadius: 16 }} />)
          : currentKpiCards.map(card => (
            <div key={card.label} className="kpi-card">
              <div className="kpi-icon-box" style={{ background: card.bg }}>
                <card.icon size={22} color={card.color} />
              </div>
              <div className="kpi-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <p className="kpi-label">{card.label}</p>
                  {card.badge && (
                    <span className="kpi-status-tag" style={{ color: card.color, background: card.bg }}>
                      {card.badge}
                    </span>
                  )}
                </div>
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
          4. STAFF: SƠ ĐỒ HIỆN TRẠNG 7 SÂN HÔM NAY (LIVE COURT STATUS)
          ======================================================= */}
      {!isAdmin && courts.length > 0 && (
        <div className="live-courts-card">
          <div className="live-courts-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="live-beacon-pulse" />
              <div>
                <h3 className="live-courts-title">
                  Hiện trạng hoạt động các sân ({overview?.active_courts ?? courts.length}/{overview?.total_courts ?? courts.length} sân sẵn sàng)
                </h3>
                <p className="live-courts-subtitle">Kiểm tra nhanh tình trạng từng sân trước khi tư vấn khách</p>
              </div>
            </div>
            <Link to="/schedule" className="live-courts-link">
              <span>Xem sơ đồ chi tiết</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="live-courts-grid">
            {courts.map(court => {
              const sport = getSportMeta(court.name, court.court_type?.name);
              const isMaint = court.status === 'maintenance';
              return (
                <Link
                  key={court.id}
                  to="/schedule"
                  className={`live-court-pill ${isMaint ? 'maint' : 'active'}`}
                  title={`Bấm để mở sơ đồ đặt sân cho ${court.name}`}
                >
                  <div className="live-court-emoji" style={{ background: sport.badgeBg }}>
                    <span>{sport.icon}</span>
                  </div>
                  <div className="live-court-details">
                    <span className="live-court-name">{court.name}</span>
                    <span className="live-court-price">
                      {court.price_per_hour ? `${Number(court.price_per_hour).toLocaleString('vi-VN')}đ/h` : '—'}
                    </span>
                  </div>
                  <span className={`live-court-badge ${isMaint ? 'maint' : 'active'}`}>
                    <span className="court-dot-indicator" />
                    {isMaint ? 'Bảo trì' : 'Sẵn sàng'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
                  <option value="1">1 ngày (Hôm nay)</option>
                  <option value="7">7 ngày qua</option>
                  <option value="14">14 ngày qua</option>
                  <option value="30">30 ngày qua</option>
                  <option value="all">Toàn thời gian (Tất cả)</option>
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
                      tickFormatter={v => v.includes(':') ? v : v.slice(5)}
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
                      dot={revenue.length === 1 ? { r: 5, fill: '#10B981' } : false}
                      activeDot={{ r: 5, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">Chưa có dữ liệu doanh thu trong khoảng thời gian này</div>
              )}
            </Card>

            {/* Phân bố lượt đặt theo ca / buổi trong ngày */}
            <Card padding="md" style={{ borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} color="#D97706" /> Phân bố lượt đặt theo buổi
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>
                    Tỷ lệ mật độ khách theo các khung ca trong ngày
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {sessionStats.totalBooked > 0 && (
                    <span className="session-total-badge">
                      Tổng: <strong>{sessionStats.totalBooked}</strong> lượt
                    </span>
                  )}
                  <select
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, color: '#0F172A', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
                    value={peakDays} 
                    onChange={handlePeakDaysChange}
                  >
                    <option value="1">1 ngày (Hôm nay)</option>
                    <option value="7">7 ngày qua</option>
                    <option value="14">14 ngày qua</option>
                    <option value="30">30 ngày qua</option>
                    <option value="all">Toàn thời gian (Tất cả)</option>
                  </select>
                </div>
              </div>

              {peakLoading || loading ? (
                <Skeleton height="180px" variant="rect" style={{ borderRadius: 12 }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  {sessionStats.totalBooked > 0 && (
                    <div className="session-stacked-bar" title="Tỷ lệ phân bố lượt đặt trong ngày">
                      {sessionStats.sessions.map(s => s.pct > 0 && (
                        <div 
                          key={s.id} 
                          style={{ width: `${s.pct}%`, background: s.barColor }} 
                          className="session-stacked-segment"
                          title={`${s.name}: ${s.booked} lượt (${s.pct}%)`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="session-list">
                    {sessionStats.sessions.map((s) => {
                      const IconComp = s.icon;
                      return (
                        <div key={s.id} className="session-item">
                          <div className="session-item-header">
                            <div className="session-item-left">
                              <div className="session-icon-box" style={{ background: s.bg, color: s.color }}>
                                <IconComp size={15} />
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span className="session-name">{s.name}</span>
                                  <span className="session-timerange">{s.timeRange}</span>
                                  {s.tag && (
                                    <span className={`session-tag ${s.id === 'evening' ? 'gold' : 'dim'}`}>
                                      {s.tag}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="session-item-right">
                              <span className="session-count"><strong>{s.booked}</strong> lượt</span>
                              <span className="session-pct" style={{ color: s.color }}>{s.pct}%</span>
                            </div>
                          </div>

                          <div className="session-progress-bg">
                            <div 
                              className="session-progress-fill" 
                              style={{ 
                                width: `${Math.max(s.pct, s.booked > 0 ? 5 : 0)}%`, 
                                background: s.barColor 
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="session-insight-box">
                    <div className="session-insight-icon">
                      <Flame size={15} color="#D97706" />
                    </div>
                    <div className="session-insight-text">
                      {sessionStats.totalBooked > 0 ? (
                        <>
                          Giờ cao điểm tập trung ở <strong>{sessionStats.busiest.name} ({sessionStats.busiest.timeRange})</strong> với <strong>{sessionStats.busiest.booked} lượt đặt</strong> (chiếm {sessionStats.busiest.pct}%).
                        </>
                      ) : (
                        <>Hệ thống chưa ghi nhận lượt đặt sân nào trong khung thời gian này.</>
                      )}
                    </div>
                  </div>
                </div>
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
          5. STAFF VIEW: BẢNG LỊCH ĐẶT SÂN GẦN NHẤT (OPERATIONAL TABLE)
          ======================================================= */}
      {!isAdmin && (
        <div className="staff-bookings-card">
          <div className="staff-bookings-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarCheck size={20} color="#2563EB" />
                <h3 className="staff-bookings-title">Lịch đặt sân gần nhất</h3>
              </div>
              <p className="staff-bookings-subtitle">
                Danh sách các yêu cầu đặt sân mới nhất cần theo dõi &amp; phục vụ tại quầy
              </p>
            </div>

            <div className="staff-bookings-controls">
              {/* Search input */}
              <div className="staff-search-box">
                <Search size={14} className="staff-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm khách, SĐT, mã đơn..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="staff-search-input"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    className="staff-search-clear"
                  >
                    ×
                  </button>
                )}
              </div>

              <Link to="/bookings" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="staff-filter-tabs">
            <button
              type="button"
              className={`staff-filter-tab ${bookingFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBookingFilter('all')}
            >
              Tất cả <span className="tab-count">{bookingCounts.all}</span>
            </button>
            <button
              type="button"
              className={`staff-filter-tab ${bookingFilter === 'today' ? 'active' : ''}`}
              onClick={() => setBookingFilter('today')}
            >
              🔥 Hôm nay <span className="tab-count today">{bookingCounts.today}</span>
            </button>
            <button
              type="button"
              className={`staff-filter-tab ${bookingFilter === 'confirmed' ? 'active' : ''}`}
              onClick={() => setBookingFilter('confirmed')}
            >
              Đã xác nhận <span className="tab-count">{bookingCounts.confirmed}</span>
            </button>
            <button
              type="button"
              className={`staff-filter-tab ${bookingFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setBookingFilter('completed')}
            >
              Hoàn thành <span className="tab-count">{bookingCounts.completed}</span>
            </button>
            <button
              type="button"
              className={`staff-filter-tab ${bookingFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setBookingFilter('cancelled')}
            >
              Đã hủy <span className="tab-count">{bookingCounts.cancelled}</span>
            </button>
          </div>

          <div className="staff-bookings-table-wrap">
            {loading ? (
              <div style={{ padding: '1rem 0' }}>
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height="52px" variant="rect" style={{ borderRadius: 10, marginBottom: 8 }} />)}
              </div>
            ) : filteredBookings.length > 0 ? (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Sân &amp; Bộ môn</th>
                    <th>Thời gian thi đấu</th>
                    <th>Tiền cọc</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(b => {
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

                    const sport = getSportMeta(b.court?.name, b.court?.court_type?.name);
                    const isTodayMatch = b.time_slot?.date === todayStr;

                    return (
                      <tr key={b.id}>
                        <td>
                          <span className="booking-id-pill">#{b.id}</span>
                        </td>
                        <td>
                          <div className="customer-name-cell">{b.customer?.full_name || 'Khách vãng lai'}</div>
                          {b.customer?.phone && (
                            <div className="customer-phone-cell">
                              <Phone size={11} />
                              <span>{b.customer.phone}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="court-cell-wrap">
                            <span 
                              className="sport-badge-pill" 
                              style={{ background: sport.badgeBg, color: sport.badgeColor, borderColor: sport.border }}
                            >
                              <span>{sport.icon}</span>
                              <span>{sport.sport}</span>
                            </span>
                            <span className="court-name-text">{b.court?.name || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="match-date-text">{b.time_slot?.date || '—'}</span>
                            {isTodayMatch && (
                              <span className="match-today-pill">Hôm nay</span>
                            )}
                          </div>
                          <div className="match-time-range">
                            <Clock size={11} color="#64748B" />
                            <span>
                              {b.time_slot?.start_time ? String(b.time_slot.start_time).slice(0, 5) : ''}
                              {b.time_slot?.end_time ? ` - ${String(b.time_slot.end_time).slice(0, 5)}` : ''}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`deposit-amount-cell ${Number(b.deposit_amount) > 0 ? 'has-deposit' : 'zero'}`}>
                            {formatMoney(b.deposit_amount || 0)}
                          </span>
                        </td>
                        <td>
                          <span className="total-amount-cell">
                            {formatMoney(b.total_amount)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>
                            <span className="status-dot-pulse" />
                            {b.status === 'completed' && <CheckCircle2 size={11} />}
                            {b.status === 'confirmed' && <CheckCircle2 size={11} />}
                            {b.status === 'cancelled' && <XCircle size={11} />}
                            {b.status === 'pending' && <AlertCircle size={11} />}
                            <span>{statusLabel}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="row-actions-group">
                            <Link 
                              to="/bookings" 
                              className="row-action-btn view" 
                              title="Xem chi tiết đơn trong danh sách"
                            >
                              <Eye size={13} />
                              <span>Chi tiết</span>
                            </Link>
                            <Link 
                              to="/ai-assistant" 
                              className="row-action-btn ai" 
                              title="Soạn tin nhắn Zalo/SMS bằng AI cho đơn này"
                            >
                              <Sparkles size={13} />
                              <span>Nhắn AI</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="staff-empty-state">
                <div className="staff-empty-icon">📅</div>
                <h4 style={{ margin: '0 0 4px', color: '#0F172A', fontWeight: 600 }}>Không tìm thấy đơn đặt sân phù hợp</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.8rem' }}>
                  {searchQuery ? 'Thử tìm với từ khóa khác hoặc xóa bộ lọc tìm kiếm' : 'Chưa có yêu cầu đặt sân nào trong danh mục này.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
