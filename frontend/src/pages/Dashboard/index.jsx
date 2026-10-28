import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { statisticsAPI, bookingsAPI, customersAPI, courtsAPI, paymentsAPI } from '../../api';
import {
  TrendingUp, Activity, DollarSign, Calendar, ArrowUpRight, ArrowDownRight,
  Trophy, Clock, Building2, Flame, CalendarCheck, Users,
  Sparkles, PlusCircle, ArrowRight, ChevronRight, CheckCircle2, AlertCircle, XCircle,
  Sunrise, Sun, Moon, MessageSquare, Phone, Search, Eye,
  ShieldAlert, RefreshCw, Lock, PieChart as PieIcon, BarChart3,
  AlertTriangle, ShieldCheck, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Skeleton, Button } from '../../components/ui';
import { todayVN, getSlotMatchStatus } from '../../utils/datetime';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
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

/* ── Time Session Helper (Sáng, Trưa, Chiều, Tối, Đêm) ── */
export const getTimeSessionLabel = (timeStr) => {
  if (!timeStr) return '';
  const hour = parseInt(String(timeStr).slice(0, 2), 10);
  if (isNaN(hour)) return '';
  if (hour >= 4 && hour < 11) return 'Sáng';
  if (hour >= 11 && hour < 13) return 'Trưa';
  if (hour >= 13 && hour < 18) return 'Chiều';
  if (hour >= 18 && hour < 23) return 'Tối';
  return 'Đêm';
};

/* ── Format real-time activity timestamp (Chuẩn múi giờ Việt Nam UTC+7) ─ */
const formatActivityTime = (dateStr) => {
  if (!dateStr) return 'Vừa xong';
  try {
    const s = String(dateStr).trim().replace(' ', 'T');
    // SQLite lưu chuẩn UTC nên cần gắn 'Z' nếu chưa có thông tin timezone
    const isoStr = (s.endsWith('Z') || s.includes('+') || /[-]\d{2}:\d{2}$/.test(s)) ? s : `${s}Z`;
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return 'Vừa xong';

    const options = { timeZone: 'Asia/Ho_Chi_Minh' };
    const dateVN = d.toLocaleDateString('sv-SE', options);
    const todayStr = new Date().toLocaleDateString('sv-SE', options);
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = yestDate.toLocaleDateString('sv-SE', options);

    const timeParts = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);

    const session = getTimeSessionLabel(timeParts);
    const sessionText = session ? ` (${session})` : '';

    if (dateVN === todayStr) {
      return `Hôm nay, ${timeParts}${sessionText}`;
    }
    if (dateVN === yestStr) {
      return `Hôm qua, ${timeParts}${sessionText}`;
    }
    const [y, m, day] = dateVN.split('-');
    return `${day}/${m}, ${timeParts}${sessionText}`;
  } catch {
    return 'Vừa xong';
  }
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
  const [adminBookings, setAdminBookings]     = useState([]);
  const [adminPayments, setAdminPayments]     = useState([]);
  const [recentBookings, setRecentBookings]   = useState([]);
  const [customerCount, setCustomerCount]     = useState(0);
  const [courts, setCourts]                   = useState([]);
  const [courtSportFilter, setCourtSportFilter] = useState('all');
  const [bookingFilter, setBookingFilter]     = useState('all'); // 'all' | 'today' | 'confirmed' | 'completed' | 'cancelled'
  const [sportTimeFilter, setSportTimeFilter] = useState('today'); // 'today' | '7days' | 'all'
  const [searchQuery, setSearchQuery]         = useState('');
  const [loading, setLoading]                 = useState(true);
  const [chartLoading, setChartLoading]       = useState(false);
  const [peakLoading, setPeakLoading]         = useState(false);
  const [timeTick, setTimeTick]               = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

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
  }, [getDateRangeParams]);

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
        const [ov, rev, peak, occ, bks, pms] = await Promise.all([
          ovPromise,
          statisticsAPI.getRevenueChart(getDateRangeParams(chartDays)),
          statisticsAPI.getPeakHours(getDateRangeParams(peakDays)),
          statisticsAPI.getCourtOccupancy({ all_time: true }),
          bookingsAPI.getAll({}).catch(() => []),
          paymentsAPI.getAll({}).catch(() => []),
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
        setAdminBookings(Array.isArray(bks) ? bks : []);
        setAdminPayments(Array.isArray(pms) ? pms : []);
      } else {
        // Staff View: Tải danh sách đơn đặt, biểu đồ doanh thu 7 ngày, khách hàng và danh sách sân hiện có
        const [ov, rev, bookingsRes, custRes, courtsRes] = await Promise.all([
          ovPromise,
          statisticsAPI.getRevenueChart(getDateRangeParams(chartDays)).catch(() => []),
          bookingsAPI.getAll({ limit: 50 }).catch(() => []),
          customersAPI.getAll({}).catch(() => []),
          courtsAPI.getAll({}).catch(() => []),
        ]);

        setOverview(ov);
        setRevenue(Array.isArray(rev) ? rev : []);
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

  /* ── Cơ cấu doanh thu theo Bộ môn thể thao (Donut Chart - Admin) ── */
  const sportBreakdown = useMemo(() => {
    const sportMap = {};
    courtOcc.forEach(c => {
      const meta = getSportMeta(c.court_name);
      const name = meta.sport;
      if (!sportMap[name]) {
        sportMap[name] = {
          name,
          icon: meta.icon,
          color: meta.border || '#10B981',
          fill: meta.badgeColor || '#059669',
          revenue: 0,
          bookedSlots: 0,
          totalSlots: 0,
        };
      }
      sportMap[name].revenue += (c.total_revenue || 0);
      sportMap[name].bookedSlots += (c.booked_slots || 0);
      sportMap[name].totalSlots += (c.total_slots || 0);
    });

    const totalRev = Object.values(sportMap).reduce((s, x) => s + x.revenue, 0);

    const list = Object.values(sportMap)
      .map(item => ({
        ...item,
        pct: totalRev > 0 ? Math.round((item.revenue / totalRev) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return { list, totalRev };
  }, [courtOcc]);

  /* ── Chỉ số Hủy sân & Kiểm soát Rủi ro (Admin) ── */
  const cancellationStats = useMemo(() => {
    const total = adminBookings.length;
    const cancelled = adminBookings.filter(b => b.status === 'cancelled');
    const cancelledCount = cancelled.length;
    const rate = total > 0 ? ((cancelledCount / total) * 100).toFixed(1) : '0.0';

    // Tiền cọc giữ lại phạt hủy sân
    const forfeited = cancelled
      .filter(b => b.deposit_forfeited)
      .reduce((sum, b) => sum + (b.deposit_amount || 0), 0);

    // Tiền hoàn trả khách hủy hợp lệ
    const refunded = adminPayments
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const successfulCount = adminBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
    const numRate = parseFloat(rate);

    let riskLevel = { label: 'Rủi ro thấp • An toàn', color: '#059669', bg: '#DCFCE7', badge: 'An toàn' };
    if (numRate > 30) {
      riskLevel = { label: 'Rủi ro cao • Cần siết cọc', color: '#DC2626', bg: '#FEE2E2', badge: 'Cảnh báo' };
    } else if (numRate > 15) {
      riskLevel = { label: 'Rủi ro trung bình • Cần theo dõi', color: '#D97706', bg: '#FEF3C7', badge: 'Lưu ý' };
    }

    return {
      total,
      cancelledCount,
      successfulCount,
      rate,
      numRate,
      forfeited,
      refunded,
      riskLevel,
    };
  }, [adminBookings, adminPayments]);

  /* ── KPI Cards for Admin (Chuẩn hóa doanh nghiệp, chống cắt cụt chữ) ── */
  const adminKpiCards = [
    {
      icon: DollarSign,
      label: 'Tổng doanh thu',
      value: overview ? formatMoney(overview.total_revenue) : '—',
      sub: 'Thực thu toàn hệ thống',
      badge: 'Chuẩn sổ quỹ',
      color: '#059669',
      bg: '#ECFDF5',
      sparklineData: (allRevenue.length > 0 ? allRevenue : revenue).map(r => ({ value: r.revenue })),
    },
    {
      icon: TrendingUp,
      label: 'Doanh thu hôm nay',
      value: overview ? formatMoney(overview.today_revenue) : '—',
      sub: `Hôm nay, ${new Date().toLocaleDateString('vi-VN')}`,
      badge: 'Trong ngày',
      color: '#2563EB',
      bg: '#EFF6FF',
      sparklineData: (allRevenue.length > 0 ? allRevenue : revenue).slice(-7).map(r => ({ value: r.revenue })),
    },
    {
      icon: Activity,
      label: 'Công suất TB',
      value: overview ? `${overview.avg_occupancy_rate}%` : '—',
      sub: 'Lấp đầy ca toàn kỳ',
      badge: 'Vận hành',
      color: '#D97706',
      bg: '#FFFBEB',
      sparklineData: courtOcc.map(c => ({ value: c.occupancy_rate })),
    },
    {
      icon: Calendar,
      label: 'Lịch đặt hôm nay',
      value: overview?.today_bookings != null ? `${overview.today_bookings} ca` : '0 ca',
      sub: `Công suất: ${overview?.today_occupancy_rate ?? 0}%`,
      badge: 'Hôm nay',
      color: '#7C3AED',
      bg: '#FAF5FF',
      sparklineData: peakHours.map(p => ({ value: p.booked_slots })),
    },
  ];

  /* ── Filter & Search Logic for Staff Bookings ── */
  const todayStr = todayVN();

  const todayBookings = useMemo(() => {
    return recentBookings
      .filter(b => b.time_slot?.date === todayStr)
      .sort((a, b) => {
        const timeA = a.time_slot?.start_time || '';
        const timeB = b.time_slot?.start_time || '';
        return timeA.localeCompare(timeB);
      });
  }, [recentBookings, todayStr]);

  const todayPendingCollection = useMemo(() => {
    return todayBookings.reduce((sum, b) => {
      if (b.status === 'cancelled') {
        // N?u h?y nhung ph?t gi? c?c (deposit_forfeited): ti?n c?c th?c thu v?n du?c tnh vo doanh thu!
        if (b.deposit_forfeited) {
          if (Array.isArray(b.payments) && b.payments.length > 0) {
            const paid = b.payments
              .filter(p => p.status === 'paid')
              .reduce((s, p) => s + Number(p.amount || 0), 0);
            const refunded = b.payments
              .filter(p => p.status === 'refunded')
              .reduce((s, p) => s + Number(p.amount || 0), 0);
            return sum + Math.max(0, paid - refunded);
          }
          return sum + Number(b.deposit_amount || 0);
        }
        return sum;
      }
      const total = Number(b.total_amount || 0);
      const deposit = Number(b.deposit_amount || 0);
      const rem = Math.max(0, total - deposit);
      return sum + rem;
    }, 0);
  }, [todayBookings]);

  /* ── KPI Cards for Staff (Thiết kế tinh gọn, chuẩn hình ảnh mẫu) ── */
  const staffKpiCards = [
    {
      icon: Calendar,
      label: 'Tổng lịch đặt',
      value: overview?.total_bookings != null ? `${overview.total_bookings} lượt` : `${recentBookings.length} lượt`,
      sub: 'Toàn bộ các sân',
      color: '#2563EB',
      bg: '#EFF6FF',
      sparklineData: (allRevenue.length >= 2 ? allRevenue : (revenue.length >= 2 ? revenue : [{ value: 5 }, { value: 9 }, { value: 7 }, { value: 12 }, { value: 10 }, { value: 14 }, { value: 13 }])).slice(-7).map(r => ({ value: r.revenue ?? r.value })),
    },
    {
      icon: Building2,
      label: 'Sân đang hoạt động',
      value: overview ? `${overview.active_courts}/${overview.total_courts} sân` : `${courts.filter(c => c.status !== 'maintenance').length}/${courts.length} sân`,
      sub: '100% sẵn sàng đón khách',
      color: '#059669',
      bg: '#ECFDF5',
      badge: 'Sẵn sàng',
    },
    {
      icon: Clock,
      label: 'Lịch đặt hôm nay',
      value: overview?.today_bookings != null ? `${overview.today_bookings} ca` : `${todayBookings.length} ca`,
      sub: `Công suất khai thác: ${overview?.today_occupancy_rate ?? 0}%`,
      color: '#7C3AED',
      bg: '#FAF5FF',
      badge: `${overview?.today_occupancy_rate ?? 0}% CS`,
    },
    {
      icon: Users,
      label: 'Khách hàng',
      value: `${customerCount} khách`,
      sub: 'Dữ liệu thành viên lưu trữ',
      color: '#EA580C',
      bg: '#FFF7ED',
      badge: 'Thành viên',
    },
  ];

  const currentKpiCards = isAdmin ? adminKpiCards : staffKpiCards;

  /* ── Filter courts by sport type ── */
  const sportTypes = useMemo(() => {
    const set = new Set();
    courts.forEach(c => {
      const s = getSportMeta(c.name, c.court_type?.name).sport;
      if (s) set.add(s);
    });
    return Array.from(set);
  }, [courts]);

  const filteredCourts = useMemo(() => {
    if (courtSportFilter === 'all') return courts;
    return courts.filter(c => getSportMeta(c.name, c.court_type?.name).sport === courtSportFilter);
  }, [courts, courtSportFilter]);

  /* ── Chart Y-axis formatters ── */
  const maxRev = Math.max(...revenue.map(r => r.revenue || 0), 0);
  const yDomain = maxRev > 0 ? [0, 'auto'] : [0, 500000];
  const yTicks = maxRev === 0 ? [0, 100000, 200000, 300000, 500000] : undefined;

  const formatRevenueYAxis = (v) => {
    if (v === 0) return '0đ';
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    return `${(v / 1000).toFixed(0)}K`;
  };

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

  /* ── Calculations for Staff Dashboard (User Mockup Template) ── */
  const cancelledCount = useMemo(() => {
    return recentBookings.filter(b => b.status === 'cancelled').length;
  }, [recentBookings]);

  const todayRevenueVal = useMemo(() => {
    // 1. Nếu overview từ backend đã có dữ liệu, ưu tiên lấy trực tiếp từ overview.today_revenue
    if (overview && overview.today_revenue != null) {
      return Number(overview.today_revenue);
    }

    // 2. Dự phòng: Tính thực thu hôm nay từ danh sách ca đặt hôm nay
    // QUY TẮC THỰC THU:
    // - Chỉ tính tiền khi thanh toán thành công (payments có status === 'paid').
    // - Nếu có đơn cọc: chỉ tính đúng số tiền cọc (deposit_amount).
    // - Nếu đơn chưa thanh toán hoặc chỉ mới xác nhận mà chưa thanh toán: KHÔNG tính vào doanh thu.
    return todayBookings.reduce((sum, b) => {
      if (b.status === 'cancelled') {
        // N?u h?y nhung ph?t gi? c?c (deposit_forfeited): ti?n c?c th?c thu v?n du?c tnh vo doanh thu!
        if (b.deposit_forfeited) {
          if (Array.isArray(b.payments) && b.payments.length > 0) {
            const paid = b.payments
              .filter(p => p.status === 'paid')
              .reduce((s, p) => s + Number(p.amount || 0), 0);
            const refunded = b.payments
              .filter(p => p.status === 'refunded')
              .reduce((s, p) => s + Number(p.amount || 0), 0);
            return sum + Math.max(0, paid - refunded);
          }
          return sum + Number(b.deposit_amount || 0);
        }
        return sum;
      }

      // Nếu có mảng payments đi kèm booking
      if (Array.isArray(b.payments) && b.payments.length > 0) {
        const paid = b.payments
          .filter(p => p.status === 'paid')
          .reduce((s, p) => s + Number(p.amount || 0), 0);
        const refunded = b.payments
          .filter(p => p.status === 'refunded')
          .reduce((s, p) => s + Number(p.amount || 0), 0);
        return sum + Math.max(0, paid - refunded);
      }

      // Nếu đơn đã hoàn thành (completed) -> đã thanh toán đủ tiền
      if (b.status === 'completed') {
        return sum + Number(b.total_amount || 0);
      }

      // Nếu đơn cọc (chưa hoàn thành): chỉ ghi nhận đúng số tiền cọc đã thu
      const dep = Number(b.deposit_amount || 0);
      if (dep > 0) {
        return sum + dep;
      }

      // Đơn mới xác nhận / chờ thanh toán mà chưa trả tiền -> 0đ
      return sum;
    }, 0);
  }, [overview, todayBookings]);

  const now = useMemo(() => new Date(timeTick), [timeTick]);
  const rawDateLong = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedDateLong = rawDateLong.charAt(0).toUpperCase() + rawDateLong.slice(1);
  const currentTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

  const sportStats = useMemo(() => {
    let sourceBookings = recentBookings;
    if (sportTimeFilter === 'today') {
      sourceBookings = recentBookings.filter(b => b.time_slot?.date === todayStr);
    } else if (sportTimeFilter === '7days') {
      const nowObj = new Date();
      const past7Obj = new Date(nowObj.getFullYear(), nowObj.getMonth(), nowObj.getDate() - 6);
      const past7Str = formatLocalDate(past7Obj);
      sourceBookings = recentBookings.filter(b => b.time_slot?.date && b.time_slot.date >= past7Str);
    }

    const counts = {};
    let total = 0;
    sourceBookings.forEach(b => {
      const sport = getSportMeta(b.court?.name, b.court?.court_type?.name).sport || 'Khác';
      counts[sport] = (counts[sport] || 0) + 1;
      total += 1;
    });

    const sportColors = {
      'Cầu lông': '#2563EB',
      'Bóng chuyền': '#8B5CF6',
      'Bóng đá': '#10B981',
      'Bóng rổ': '#F59E0B',
      'Pickleball': '#EA580C',
      'Tennis': '#0D9488',
      'Khác': '#94A3B8',
    };

    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: sportColors[name] || '#06B6D4',
    })).sort((a, b) => b.value - a.value);
  }, [recentBookings, sportTimeFilter, todayStr]);

  const recentActivities = useMemo(() => {
    if (!recentBookings || recentBookings.length === 0) return [];

    const activities = recentBookings.map((b) => {
      const isCancelled = b.status === 'cancelled';
      const isPending = b.status === 'pending';
      const courtName = b.court?.name ? b.court.name.charAt(0).toUpperCase() + b.court.name.slice(1) : 'Sân thể thao';
      const customerName = b.customer?.full_name || 'Khách vãng lai';
      const amountStr = formatMoney(b.total_amount);
      const activityCreatedTime = formatActivityTime(b.created_at);

      const slot = b.time_slot;
      const matchStatus = (!isCancelled && slot)
        ? getSlotMatchStatus(slot.date, slot.start_time, slot.end_time, null, now)
        : (b.status === 'completed' ? 'completed' : 'unknown');

      const isToday = slot?.date === todayStr;
      const startStr = slot?.start_time ? slot.start_time.slice(0, 5) : '';
      const endStr = slot?.end_time ? slot.end_time.slice(0, 5) : '';
      const timeRangeStr = startStr && endStr ? `${startStr} - ${endStr}` : '';
      const sessionLabel = getTimeSessionLabel(startStr);
      const timeRangeWithSession = timeRangeStr 
        ? `Ca ${timeRangeStr}${sessionLabel ? ` (${sessionLabel})` : ''}` 
        : '';

      let type = 'general';
      let title = `Xác nhận đặt đơn #${b.id}`;
      let desc = `Khách hàng: ${customerName}`;
      let meta = `${courtName} • ${amountStr}`;
      let icon = CheckCircle2;
      let iconBg = '#EFF6FF';
      let iconColor = '#2563EB';
      let timeText = activityCreatedTime;
      let timeClass = 'confirmed';
      let isLive = false;
      let priority = 3;

      if (isCancelled) {
        type = 'cancelled';
        title = `Khách hủy đơn đặt #${b.id}`;
        desc = `Khách hàng: ${customerName}`;
        meta = `${courtName}${timeRangeWithSession ? ` • ${timeRangeWithSession}` : ''} • Hủy ca`;
        icon = XCircle;
        iconBg = '#FEF2F2';
        iconColor = '#DC2626';
        timeClass = 'cancelled';
        priority = 5;
      } else if (isToday && matchStatus === 'in_use') {
        type = 'in_use';
        isLive = true;
        title = `Đang diễn ra ca thi đấu #${b.id}`;
        desc = `Khách hàng: ${customerName}`;
        meta = `${courtName} • ${timeRangeWithSession || `Khung giờ ${timeRangeStr}`} • Đang thi đấu`;
        icon = Zap;
        iconBg = '#DCFCE7';
        iconColor = '#16A34A';
        timeText = 'Đang diễn ra';
        timeClass = 'live';
        priority = 1;
      } else if (isToday && matchStatus === 'upcoming') {
        type = 'upcoming';
        title = `Sắp đến giờ nhận sân #${b.id}`;
        desc = `Khách hàng: ${customerName}`;
        meta = `${courtName} • ${timeRangeWithSession || `Bắt đầu lúc ${startStr}`}`;
        icon = Clock;
        iconBg = '#FEF3C7';
        iconColor = '#D97706';
        timeText = `Hôm nay, ${startStr}${sessionLabel ? ` (${sessionLabel})` : ''}`;
        timeClass = 'upcoming';
        priority = 2;
      } else if (matchStatus === 'upcoming') {
        type = 'confirmed';
        title = `Lịch đặt sắp tới #${b.id}`;
        desc = `Khách hàng: ${customerName}`;
        meta = `${courtName} • ${slot?.date ? `${slot.date} • ${timeRangeWithSession}` : amountStr}`;
        icon = CalendarCheck;
        iconBg = '#EFF6FF';
        iconColor = '#2563EB';
        timeText = activityCreatedTime;
        timeClass = 'confirmed';
        priority = 3;
      } else if (matchStatus === 'completed' || b.status === 'completed') {
        type = 'completed';
        title = `Hoàn thành ca thi đấu #${b.id}`;
        desc = `Khách hàng: ${customerName}`;
        meta = `${courtName}${timeRangeWithSession ? ` • ${timeRangeWithSession}` : ''} • Đã thu ${amountStr}`;
        icon = CheckCircle2;
        iconBg = '#ECFDF5';
        iconColor = '#059669';
        timeClass = 'completed';
        priority = 4;
      } else if (isPending) {
        type = 'pending';
        title = `Đơn đặt chờ duyệt #${b.id}`;
        desc = `Khách hàng: ${customerName}`;
        meta = `${courtName}${timeRangeWithSession ? ` • ${timeRangeWithSession}` : ''} • ${amountStr}`;
        icon = AlertCircle;
        iconBg = '#FFFBEB';
        iconColor = '#D97706';
        timeClass = 'upcoming';
        priority = 3;
      } else {
        type = 'confirmed';
        title = `Xác nhận đặt đơn #${b.id}`;
        desc = `Khách hàng: ${customerName}`;
        meta = `${courtName} • ${slot?.date ? `${slot.date} • ${timeRangeWithSession}` : amountStr}`;
        icon = CalendarCheck;
        iconBg = '#EFF6FF';
        iconColor = '#2563EB';
        timeText = activityCreatedTime;
        timeClass = 'confirmed';
        priority = 3;
      }

      return {
        id: b.id,
        type,
        isLive,
        priority,
        title,
        desc,
        meta,
        icon,
        iconBg,
        iconColor,
        time: timeText,
        timeClass,
        rawBooking: b,
      };
    });

    return activities
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return b.id - a.id;
      })
      .slice(0, 5);
  }, [recentBookings, todayStr, now]);

  /* =======================================================
     ADMIN DASHBOARD VIEW (Giữ nguyên 100% dữ liệu & biểu đồ)
     ======================================================= */
  if (isAdmin) {
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
              <span>SportBooking Pro • Quản lý điều hành</span>
            </div>

            <h1 className="hero-title">
              {greetingTimeText}, <span className="hero-title-name">{user?.full_name || 'Quản lý'}!</span>
            </h1>

            <p className="hero-subtitle">
              Hệ thống quản trị sân thông minh — giám sát doanh thu, công suất và điều hành hoạt động kinh doanh thể thao.
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
            2. KPI METRIC CARDS (ADMIN)
            ======================================================= */}
        <div className="kpi-grid">
          {loading
            ? [1, 2, 3, 4].map(i => <Skeleton key={i} height="110px" variant="rect" style={{ borderRadius: 16 }} />)
            : adminKpiCards.map(card => (
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
          {/* HÀNG 1: BIỂU ĐỒ DOANH THU THEO NGÀY (62%) + CƠ CẤU DOANH THU THEO MÔN (38%) */}
          <div className="charts-grid-enterprise">
            {/* 1.1 Doanh thu theo ngày (AreaChart) */}
            <Card padding="md" style={{ borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={16} color="#059669" /> Biến động Doanh thu theo Ngày
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>Theo dõi dòng tiền thực thu (Đơn vị: VNĐ)</p>
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
                <Skeleton height="200px" variant="rect" style={{ borderRadius: 12 }} />
              ) : revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
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

            {/* 1.2 Cơ cấu doanh thu theo Bộ môn thể thao (Donut Chart) */}
            <Card padding="md" style={{ borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PieIcon size={16} color="#3B82F6" /> Cơ cấu Doanh thu theo Môn
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>Tỷ trọng đóng góp dòng tiền của từng bộ môn</p>
                </div>
                {sportBreakdown.totalRev > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: 999 }}>
                    {formatMoney(sportBreakdown.totalRev)}
                  </span>
                )}
              </div>

              {loading ? (
                <Skeleton height="200px" variant="rect" style={{ borderRadius: 12 }} />
              ) : sportBreakdown.list.length > 0 && sportBreakdown.totalRev > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div style={{ height: 145, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sportBreakdown.list.filter(s => s.revenue > 0)}
                          dataKey="revenue"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={65}
                          paddingAngle={3}
                        >
                          {sportBreakdown.list.filter(s => s.revenue > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill || BAR_COLORS[index % BAR_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val, name) => [`${formatMoney(val)}`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center text in Donut */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', lineHeight: 1 }}>Chủ lực</span>
                      <strong style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 800 }}>
                        {sportBreakdown.list[0]?.pct || 0}%
                      </strong>
                    </div>
                  </div>

                  {/* Sport Legend list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    {sportBreakdown.list.map(s => (
                      <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{s.icon}</span>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{s.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#64748B', fontSize: '0.74rem' }}>{formatMoney(s.revenue)}</span>
                          <span style={{ fontWeight: 700, color: s.fill, minWidth: 28, textAlign: 'right' }}>{s.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="chart-empty" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Chưa ghi nhận doanh thu theo bộ môn
                </div>
              )}
            </Card>
          </div>

          {/* HÀNG 2: PHÂN BỐ LƯỢT ĐẶT THEO CA (50%) + TỶ LỆ HỦY SÂN & KIỂM SOÁT RỦI RO (50%) */}
          <div className="charts-grid-risk">
            {/* 2.1 Phân bố lượt đặt theo ca / buổi trong ngày */}
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
                <Skeleton height="200px" variant="rect" style={{ borderRadius: 12 }} />
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

            {/* 2.2 Tỷ lệ hủy sân & Kiểm soát Rủi ro (Cancellation & Risk Tracker) */}
            <Card padding="md" style={{ borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={16} color="#DC2626" /> Tỷ lệ Hủy Sân &amp; Kiểm soát Rủi ro
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>Giám sát tỷ lệ bùng sân và dòng tiền thu hồi phạt hủy</p>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: cancellationStats.riskLevel.color, background: cancellationStats.riskLevel.bg, padding: '2px 8px', borderRadius: 999 }}>
                  {cancellationStats.riskLevel.badge}
                </span>
              </div>

              {loading ? (
                <Skeleton height="200px" variant="rect" style={{ borderRadius: 12 }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '0.85rem' }}>
                  {/* Gauge / Progress Header */}
                  <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Tỷ lệ đơn hủy trên tổng đơn:</span>
                      <strong style={{ fontSize: '1.15rem', color: cancellationStats.riskLevel.color, fontWeight: 800 }}>
                        {cancellationStats.rate}%
                      </strong>
                    </div>

                    <div style={{ width: '100%', height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(cancellationStats.numRate, 100)}%`,
                          height: '100%',
                          background: cancellationStats.riskLevel.color,
                          borderRadius: 999,
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                      <span>Tổng phát sinh: <strong>{cancellationStats.total}</strong> đơn ({cancellationStats.successfulCount} thành công)</span>
                      <span>Đã hủy: <strong>{cancellationStats.cancelledCount}</strong> đơn</span>
                    </div>
                  </div>

                  {/* 2 Thẻ đối soát dòng tiền phạt hủy & hoàn cọc */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.75rem', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#D97706', fontSize: '0.74rem', fontWeight: 700, marginBottom: 2 }}>
                        <Lock size={12} /> Cọc giữ lại phạt hủy
                      </div>
                      <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#92400E' }}>
                        {formatMoney(cancellationStats.forfeited)}
                      </p>
                      <span style={{ fontSize: '0.68rem', color: '#B45309' }}>Thu hồi bù chi phí sân</span>
                    </div>

                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.75rem', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#2563EB', fontSize: '0.74rem', fontWeight: 700, marginBottom: 2 }}>
                        <RefreshCw size={12} /> Tiền đã hoàn trả khách
                      </div>
                      <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1E40AF' }}>
                        {formatMoney(cancellationStats.refunded)}
                      </p>
                      <span style={{ fontSize: '0.68rem', color: '#3B82F6' }}>Hủy hợp lệ trước hạn</span>
                    </div>
                  </div>

                  {/* Operational Callout */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.85rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: '0.76rem', color: '#166534' }}>
                    <ShieldCheck size={16} color="#16A34A" style={{ flexShrink: 0 }} />
                    <span>Chính sách cọc 50% đang bảo vệ an toàn dòng tiền và bù đắp 100% chi phí sân khi có đơn hủy.</span>
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
                    const sportMeta = getSportMeta(c.court_name);
                    return (
                      <div key={c.court_id} className="court-mini-card">
                        <div className="court-mini-header">
                          <div className="court-mini-title-wrap">
                            <span style={{ fontSize: '1rem', lineHeight: 1 }} title={sportMeta.sport}>{sportMeta.icon}</span>
                            <div className="court-dot" style={{ background: color }} />
                            <span className="court-name" title={c.court_name}>{c.court_name}</span>
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
      </div>
    );
  }

  /* =======================================================
     STAFF DASHBOARD VIEW (User Mockup Enterprise Design)
     ======================================================= */
  return (
    <div className="dashboard-page animate-fade-in">
      {/* 1. GREETING HEADER */}
      <div className="staff-mockup-greeting">
        <div className="staff-mockup-greeting-left">
          <h1 className="staff-mockup-greeting-title">
            Xin chào, {user?.full_name || 'Nguyễn Minh Anh'} 👋
          </h1>
          <p className="staff-mockup-greeting-sub">
            Chúc bạn một ngày làm việc hiệu quả!
          </p>
        </div>

        <div className="staff-mockup-greeting-right">
          <div className="staff-mockup-datetime-box">
            <span className="staff-mockup-date">{formattedDateLong}</span>
            <span className="staff-mockup-time">{currentTimeStr}</span>
          </div>

          <div className="staff-mockup-motto-box">
            <span>Cùng nhau mang đến trải nghiệm thể thao tốt nhất!</span>
          </div>
        </div>
      </div>

      {/* 2. 4 KPI STAT CARDS (Form chuẩn theo ảnh) */}
      <div className="staff-mockup-kpi-grid">
        {/* Card 1: Đơn đặt hôm nay */}
        <div className="staff-mockup-kpi-card">
          <div className="staff-mockup-kpi-header">
            <div className="staff-mockup-kpi-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Calendar size={17} />
            </div>
            <span className="staff-mockup-kpi-title">Đơn đặt hôm nay</span>
          </div>
          <div className="staff-mockup-kpi-value-row">
            <span className="staff-mockup-kpi-val">
              {overview?.today_bookings != null ? overview.today_bookings : todayBookings.length}
            </span>
            <div className="staff-mockup-mini-bars">
              <span className="staff-mockup-mini-bar" style={{ height: '40%', background: '#93C5FD' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '65%', background: '#60A5FA' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '50%', background: '#3B82F6' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '90%', background: '#2563EB' }} />
            </div>
          </div>
          <div className="staff-mockup-kpi-footer">
            <span className="staff-mockup-trend-badge green">
              <ArrowUpRight size={12} />
              <span>+{overview?.today_occupancy_rate ?? 0}% công suất</span>
            </span>
          </div>
        </div>

        {/* Card 2: Khách hủy / Hoàn tiền */}
        <div className="staff-mockup-kpi-card">
          <div className="staff-mockup-kpi-header">
            <div className="staff-mockup-kpi-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
              <Clock size={17} />
            </div>
            <span className="staff-mockup-kpi-title">Khách hủy / Hoàn tiền</span>
          </div>
          <div className="staff-mockup-kpi-value-row">
            <span className="staff-mockup-kpi-val">
              {cancelledCount}
            </span>
            <div className="staff-mockup-mini-bars">
              <span className="staff-mockup-mini-bar" style={{ height: '70%', background: '#A7F3D0' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '45%', background: '#6EE7B7' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '30%', background: '#34D399' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '20%', background: '#059669' }} />
            </div>
          </div>
          <div className="staff-mockup-kpi-footer">
            <span className="staff-mockup-trend-badge red">
              <ArrowDownRight size={12} />
              <span>{recentBookings.length > 0 ? Math.round((cancelledCount / recentBookings.length) * 100) : 0}% tỉ lệ hủy</span>
            </span>
          </div>
        </div>

        {/* Card 3: Doanh thu hôm nay */}
        <div className="staff-mockup-kpi-card">
          <div className="staff-mockup-kpi-header">
            <div className="staff-mockup-kpi-icon-wrap" style={{ background: '#FAF5FF', color: '#7C3AED' }}>
              <DollarSign size={17} />
            </div>
            <span className="staff-mockup-kpi-title">Doanh thu hôm nay</span>
          </div>
          <div className="staff-mockup-kpi-value-row">
            <span className="staff-mockup-kpi-val">
              {formatMoney(todayRevenueVal)}
            </span>
            <div className="staff-mockup-mini-bars">
              <span className="staff-mockup-mini-bar" style={{ height: '45%', background: '#D8B4FE' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '60%', background: '#C084FC' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '80%', background: '#A855F7' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '100%', background: '#7C3AED' }} />
            </div>
          </div>
          <div className="staff-mockup-kpi-footer">
            <span className="staff-mockup-trend-badge green">
              <ArrowUpRight size={12} />
              <span>Doanh thu thực tế</span>
            </span>
          </div>
        </div>

        {/* Card 4: Khách hàng */}
        <div className="staff-mockup-kpi-card">
          <div className="staff-mockup-kpi-header">
            <div className="staff-mockup-kpi-icon-wrap" style={{ background: '#FFF7ED', color: '#EA580C' }}>
              <Users size={17} />
            </div>
            <span className="staff-mockup-kpi-title">Khách hàng</span>
          </div>
          <div className="staff-mockup-kpi-value-row">
            <span className="staff-mockup-kpi-val">
              {customerCount}
            </span>
            <div className="staff-mockup-mini-bars">
              <span className="staff-mockup-mini-bar" style={{ height: '35%', background: '#FDBA74' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '55%', background: '#FB923C' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '70%', background: '#F97316' }} />
              <span className="staff-mockup-mini-bar" style={{ height: '85%', background: '#EA580C' }} />
            </div>
          </div>
          <div className="staff-mockup-kpi-footer">
            <span className="staff-mockup-trend-badge green">
              <ArrowUpRight size={12} />
              <span>Hồ sơ thành viên</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. ROW 2: DOANH THU 7 NGÀY GẦN ĐÂY + ĐƠN ĐẶT SÂN GẦN ĐÂY */}
      <div className="staff-mockup-row-mid">
        {/* Left: Doanh thu 7 ngày gần đây */}
        <div className="staff-mockup-card">
          <div className="staff-mockup-card-header">
            <div className="staff-mockup-card-title-wrap">
              <h3 className="staff-mockup-card-title">Doanh thu 7 ngày gần đây</h3>
            </div>
            <select
              className="staff-mockup-select"
              value={chartDays}
              onChange={handleChartDaysChange}
            >
              <option value="7">7 ngày</option>
              <option value="14">14 ngày</option>
              <option value="30">30 ngày</option>
              <option value="all">Tất cả</option>
            </select>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            {chartLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton width="100%" height={230} borderRadius={8} />
              </div>
            ) : revenue.length === 0 ? (
              <div className="chart-empty" style={{ height: '100%' }}>
                <TrendingUp size={36} color="#CBD5E1" />
                <p>Chưa có dữ liệu doanh thu</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="staffRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={v => {
                      if (!v) return '';
                      if (v.includes(':')) return v;
                      const parts = v.split('-');
                      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : v;
                    }}
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    tickFormatter={formatRevenueYAxis}
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={yDomain}
                    ticks={yTicks}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        formatter={v => `${Number(v).toLocaleString('vi-VN')}đ`}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#staffRevenueGrad)"
                    dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#1D4ED8', stroke: '#EFF6FF', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Đơn đặt sân gần đây */}
        <div className="staff-mockup-card">
          <div className="staff-mockup-card-header">
            <div className="staff-mockup-card-title-wrap">
              <h3 className="staff-mockup-card-title">Đơn đặt sân gần đây</h3>
            </div>
            <Link to="/bookings" className="staff-mockup-link">
              <span>Xem tất cả</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="staff-mockup-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sân &amp; Bộ môn</th>
                  <th>Thời gian</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.slice(0, 5).map(b => {
                  const sportInfo = getSportMeta(b.court?.name, b.court?.court_type?.name);
                  const isConfirmed = b.status === 'confirmed';
                  const isCompleted = b.status === 'completed';
                  const isCancelled = b.status === 'cancelled';

                  let statusText = 'Chờ xác nhận';
                  let statusClass = 'pending';
                  if (isCompleted) {
                    statusText = 'Hoàn thành';
                    statusClass = 'completed';
                  } else if (isConfirmed) {
                    statusText = 'Đã xác nhận';
                    statusClass = 'confirmed';
                  } else if (isCancelled) {
                    statusText = 'Đã hủy';
                    statusClass = 'cancelled';
                  }

                  const timeDisplay = b.time_slot
                    ? `${b.time_slot.start_time?.slice(0, 5)} - ${b.time_slot.end_time?.slice(0, 5)}`
                    : '18:00 - 19:00';
                  const dateDisplay = b.time_slot?.date
                    ? new Date(b.time_slot.date).toLocaleDateString('vi-VN')
                    : todayVN();

                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700, color: '#2563EB' }}>#{b.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {b.customer?.full_name || 'Khách vãng lai'}
                        </div>
                        {b.customer?.phone && (
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{b.customer.phone}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {b.court?.name || 'Sân thể thao'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {sportInfo.sport}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{timeDisplay}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{dateDisplay}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>
                        {formatMoney(b.total_amount)}
                      </td>
                      <td>
                        <span className={`staff-mockup-status-pill ${statusClass}`}>
                          <span className="dot" />
                          <span>{statusText}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. ROW 3: THỐNG KÊ ĐẶT SÂN THEO MÔN + TRẠNG THÁI SÂN HIỆN TẠI + HOẠT ĐỘNG GẦN ĐÂY */}
      <div className="staff-mockup-row-bottom">
        {/* Col 1: Thống kê đặt sân theo môn */}
        <div className="staff-mockup-card">
          <div className="staff-mockup-card-header">
            <div className="staff-mockup-card-title-wrap">
              <h3 className="staff-mockup-card-title">Thống kê đặt sân theo môn</h3>
            </div>
            <select
              className="staff-mockup-select"
              value={sportTimeFilter}
              onChange={(e) => setSportTimeFilter(e.target.value)}
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="all">Toàn thời gian</option>
            </select>
          </div>

          {sportStats.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', height: 380 }}>
              <CalendarCheck size={36} color="#CBD5E1" />
              <p style={{ marginTop: '0.5rem', fontWeight: 600, color: '#64748B', fontSize: '0.82rem' }}>
                Chưa có ca đặt nào {sportTimeFilter === 'today' ? 'trong ngày hôm nay' : 'trong khoảng thời gian này'}
              </p>
            </div>
          ) : (
            <div className="staff-donut-content-layout">
              <div className="staff-donut-chart-holder">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={sportStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sportStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="staff-donut-center-badge">
                  <span className="donut-center-number">
                    {sportStats.reduce((sum, s) => sum + s.value, 0)}
                  </span>
                  <span className="donut-center-label">Tổng lượt</span>
                </div>
              </div>

              <div className="staff-donut-legend-list">
                {sportStats.map((item, idx) => (
                  <div key={idx} className="staff-donut-legend-item">
                    <div className="staff-donut-legend-left">
                      <span className="staff-donut-legend-dot" style={{ background: item.color }} />
                      <span className="staff-donut-legend-name">{item.name}</span>
                    </div>
                    <div className="staff-donut-legend-right">
                      <span className="staff-donut-legend-pct">{item.percentage}%</span>
                      <span className="staff-donut-legend-count">({item.value})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Col 2: Trạng thái sân hiện tại */}
        <div className="staff-mockup-card">
          <div className="staff-mockup-card-header">
            <div className="staff-mockup-card-title-wrap">
              <h3 className="staff-mockup-card-title">Trạng thái sân hiện tại</h3>
            </div>
            <Link to="/courts" className="staff-mockup-link">
              <span>Quản lý sân</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="staff-court-items-list">
            {courts.map(c => {
              const meta = getSportMeta(c.name, c.court_type?.name);
              const isActive = c.status !== 'maintenance';

              // Tìm ca đặt hôm nay của sân này
              const courtBookingsToday = recentBookings.filter(
                b => b.court_id === c.id && b.status !== 'cancelled' && b.time_slot?.date === todayStr
              );

              // 1. Kiểm tra có ca đang đá (in_use) không
              const liveBooking = courtBookingsToday.find(
                b => getSlotMatchStatus(b.time_slot?.date, b.time_slot?.start_time, b.time_slot?.end_time, null, now) === 'in_use'
              );

              // 2. Kiểm tra có ca sắp đá (upcoming) không
              const upcomingBooking = !liveBooking
                ? courtBookingsToday.find(
                    b => getSlotMatchStatus(b.time_slot?.date, b.time_slot?.start_time, b.time_slot?.end_time, null, now) === 'upcoming'
                  )
                : null;

              let slotInfo = isActive ? 'Đang trống • Sẵn sàng đón khách' : 'Tạm dừng bảo trì';
              let isCourtLive = false;

              if (liveBooking && liveBooking.time_slot) {
                const sTime = liveBooking.time_slot.start_time?.slice(0, 5);
                const eTime = liveBooking.time_slot.end_time?.slice(0, 5);
                slotInfo = `Đang sử dụng (${sTime} - ${eTime}: ${liveBooking.customer?.full_name || 'Khách'})`;
                isCourtLive = true;
              } else if (upcomingBooking && upcomingBooking.time_slot) {
                const sTime = upcomingBooking.time_slot.start_time?.slice(0, 5);
                const eTime = upcomingBooking.time_slot.end_time?.slice(0, 5);
                slotInfo = `Ca tiếp: ${sTime} - ${eTime} (${upcomingBooking.customer?.full_name || 'Khách'})`;
              }

              const courtDisplayName = c.name ? c.name.charAt(0).toUpperCase() + c.name.slice(1) : 'Sân thể thao';

              return (
                <Link
                  key={c.id}
                  to={`/schedule?courtId=${c.id}`}
                  className="staff-court-item-row"
                >
                  <div className="staff-court-item-left">
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: meta.bg || '#EFF6FF',
                        color: meta.border || '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="staff-court-item-name">{courtDisplayName}</div>
                      <div
                        className={`staff-court-slot-time ${isCourtLive ? 'in-use' : ''}`}
                        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}
                      >
                        {slotInfo}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {isCourtLive ? (
                      <span className="staff-court-badge-inuse">
                        <span className="activity-pulse-dot mini" />
                        <span>Đang có ca</span>
                      </span>
                    ) : isActive ? (
                      <span className="staff-court-badge-active">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                        <span>Sẵn sàng</span>
                      </span>
                    ) : (
                      <span className="staff-court-badge-maint">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} />
                        <span>Đang bảo trì</span>
                      </span>
                    )}
                    <ChevronRight size={15} color="#94A3B8" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Col 3: Hoạt động gần đây */}
        <div className="staff-mockup-card">
          <div className="staff-mockup-card-header">
            <div className="staff-mockup-card-title-wrap">
              <h3 className="staff-mockup-card-title">Hoạt động gần đây</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Thời gian thực</span>
          </div>

          <div className="staff-activity-feed-list">
            {recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                Chưa có hoạt động mới nào
              </div>
            ) : (
              recentActivities.map((act) => {
                const IconComp = act.icon;
                return (
                  <Link
                    key={act.id}
                    to="/bookings"
                    className={`staff-activity-feed-item ${act.isLive ? 'live-item' : ''}`}
                    title={`Xem chi tiết tại Quản lý đơn đặt (Đơn #${act.id})`}
                  >
                    <div className="staff-activity-left">
                      <div
                        className="staff-activity-icon"
                        style={{ background: act.iconBg, color: act.iconColor }}
                      >
                        <IconComp size={15} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="staff-activity-title-row">
                          <span className="staff-activity-title">{act.title}</span>
                          {act.isLive && (
                            <span className="staff-activity-live-pill">
                              <span className="activity-pulse-dot" /> LIVE
                            </span>
                          )}
                        </div>
                        <div className="staff-activity-desc">{act.desc}</div>
                        <div className="staff-activity-meta">{act.meta}</div>
                      </div>
                    </div>
                    <span className={`staff-activity-time ${act.timeClass || ''}`}>
                      {act.isLive && <span className="activity-pulse-dot mini" />}
                      {act.time}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
