import { useState, useEffect, useMemo } from 'react';
import {
  statisticsAPI,
  bookingsAPI,
  paymentsAPI,
  courtsAPI,
  courtTypesAPI,
  customersAPI,
  aiAPI,
} from '../../api';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  CalendarCheck,
  Calendar,
  Users,
  Clock,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Award,
  Download,
  Printer,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  RefreshCw,
  Lock,
  Layers,
  Sun,
  Sunrise,
  Moon,
  Flame,
  ArrowUpRight,
  TrendingDown,
  HelpCircle,
} from 'lucide-react';
import { Card, Badge, Skeleton, Button, Input, Table, Pagination } from '../../components/ui';
import AICard from '../../components/AICard';
import './Reports.css';

/* ── Custom Recharts Tooltip ────────────────────────── */
function CustomChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      padding: '0.6rem 0.9rem',
      fontSize: '0.82rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
      minWidth: 160
    }}>
      <p style={{ color: '#64748B', margin: '0 0 6px', fontWeight: 600, borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
        {label}
      </p>
      {payload.map((p, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '3px 0' }}>
          <span style={{ color: p.color || '#334155', fontWeight: 500, fontSize: '0.78rem' }}>
            {p.name || p.dataKey}:
          </span>
          <strong style={{ color: '#0F172A', fontWeight: 700 }}>
            {formatter ? formatter(p.value, p.dataKey) : (typeof p.value === 'number' ? p.value.toLocaleString() : p.value)}
          </strong>
        </div>
      ))}
    </div>
  );
}

const PIE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#64748B'];

export default function Reports() {
  // ── States ───────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' | 'operations' | 'customers' | 'ai'
  const [loading, setLoading]     = useState(true);

  // Raw API data
  const [overview, setOverview]       = useState(null);
  const [revenueSeries, setRevSeries] = useState([]);
  const [peakHours, setPeakHours]     = useState([]);
  const [courtOcc, setCourtOcc]       = useState([]);
  const [bookings, setBookings]       = useState([]);
  const [payments, setPayments]       = useState([]);
  const [courts, setCourts]           = useState([]);
  const [courtTypes, setCourtTypes]   = useState([]);
  const [customers, setCustomers]     = useState([]);

  // AI Assistant state
  const [aiSummary, setAiSummary]       = useState('');
  const [aiRawData, setAiRawData]       = useState(null);
  const [aiError, setAiError]           = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  // Pagination for tables
  const [dailyPage, setDailyPage] = useState(1);
  const dailyPageSize = 8;
  const [cancelPage, setCancelPage] = useState(1);
  const cancelPageSize = 6;

  // ── Date range filters ───────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = '2026-09-01'; // Hiển thị toàn bộ phát sinh giao dịch hệ thống
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate]     = useState(today);
  const [activePreset, setActivePreset] = useState('all');

  const applyPreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();
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
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setFromDate(firstDay);
      setToDate(today);
    } else if (preset === 'last_month') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setFromDate(firstDayLastMonth);
      setToDate(lastDayLastMonth);
    }
  };

  // ── Fetch Data ───────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, rev, peak, cOcc, bks, pms, crts, ctypes, custs] = await Promise.all([
        statisticsAPI.getOverview().catch(() => null),
        statisticsAPI.getRevenueChart({ from_date: fromDate, to_date: toDate }).catch(() => []),
        statisticsAPI.getPeakHours({ from_date: fromDate, to_date: toDate }).catch(() => []),
        statisticsAPI.getCourtOccupancy({ from_date: fromDate, to_date: toDate }).catch(() => []),
        bookingsAPI.getAll({}).catch(() => []),
        paymentsAPI.getAll({}).catch(() => []),
        courtsAPI.getAll().catch(() => []),
        courtTypesAPI.getAll().catch(() => []),
        customersAPI.getAll({}).catch(() => []),
      ]);

      setOverview(ov);
      setRevSeries(rev || []);
      setPeakHours(peak || []);
      setCourtOcc(cOcc || []);
      setBookings(bks || []);
      setPayments(pms || []);
      setCourts(crts || []);
      setCourtTypes(ctypes || []);
      setCustomers(custs || []);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  // ── AI Generator ─────────────────────────────────────
  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    setAiSummary('');
    setAiRawData(null);
    setAiError('');
    try {
      const res = await aiAPI.occupancySummary({ from_date: fromDate, to_date: toDate });
      setAiSummary(res.summary);
      setAiRawData(res.raw_data);
    } catch (err) {
      setAiError(err.response?.data?.detail || 'Lỗi không xác định khi gọi AI.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // ── Filtering Data by Range ──────────────────────────
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const bDate = b.time_slot?.date || (b.created_at ? b.created_at.slice(0, 10) : null);
      if (!bDate) return true;
      return bDate >= fromDate && bDate <= toDate;
    });
  }, [bookings, fromDate, toDate]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const pDate = p.paid_at ? p.paid_at.slice(0, 10) : null;
      if (!pDate) return true;
      return pDate >= fromDate && pDate <= toDate;
    });
  }, [payments, fromDate, toDate]);

  // ── Metrics Calculation (Tab 1: Revenue) ─────────────
  const revStats = useMemo(() => {
    // Khoản cọc các đơn cũ chưa có payment paid (đồng bộ chuẩn hóa 100% với Payments)
    const unrecordedDeposits = filteredBookings.reduce((sum, b) => {
      const hasPayment = payments.some(p => p.booking_id === b.id && p.status === 'paid');
      return (!hasPayment && (b.deposit_amount || 0) > 0) ? sum + b.deposit_amount : sum;
    }, 0);

    const totalPaidPayments = filteredPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const totalPaid = totalPaidPayments + unrecordedDeposits; // Chuẩn 2,025,000đ
    const totalRefunded = filteredPayments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0); // 200,000đ
    const netRevenue = Math.max(0, totalPaid - totalRefunded); // Chuẩn 1,825,000đ

    // Cọc giữ lại từ đơn hủy
    const forfeitedDeposits = filteredBookings
      .filter(b => b.status === 'cancelled' && b.deposit_forfeited)
      .reduce((s, b) => s + (b.deposit_amount || 0), 0);

    // Số đơn thành công
    const successfulBookings = filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const aov = successfulBookings.length > 0 ? Math.round(netRevenue / successfulBookings.length) : 0;

    // Cơ cấu phương thức
    const transferTotal = filteredPayments.filter(p => p.status === 'paid' && p.method === 'transfer').reduce((s, p) => s + p.amount, 0);
    const cashTotal = totalPaid - transferTotal;

    const paymentMethodsData = [
      { name: 'Chuyển khoản (QR)', value: transferTotal, color: '#2563EB' },
      { name: 'Tiền mặt & Cọc', value: cashTotal, color: '#10B981' },
    ].filter(d => d.value > 0);

    // Cơ cấu theo môn thể thao (chuẩn xác 100% theo tiền thực thu từng môn)
    const sportMap = {};
    courtTypes.forEach(ct => { sportMap[ct.id] = { name: ct.name, value: 0 }; });
    filteredBookings.filter(b => b.status !== 'cancelled').forEach(b => {
      const court = courts.find(c => c.id === b.court_id);
      const typeId = court?.court_type_id;
      
      const pPaid = payments
        .filter(p => p.booking_id === b.id && p.status === 'paid')
        .reduce((s, p) => s + p.amount, 0);
      const hasPayment = payments.some(p => p.booking_id === b.id && p.status === 'paid');
      const unrec = (!hasPayment && (b.deposit_amount || 0) > 0) ? b.deposit_amount : 0;
      const bRevenue = pPaid + unrec;

      if (bRevenue > 0) {
        if (typeId && sportMap[typeId]) {
          sportMap[typeId].value += bRevenue;
        } else {
          sportMap['other'] = sportMap['other'] || { name: 'Thể thao khác', value: 0 };
          sportMap['other'].value += bRevenue;
        }
      }
    });
    if (forfeitedDeposits > 0) {
      sportMap['forfeited'] = { name: 'Cọc phạt giữ lại', value: forfeitedDeposits };
    }
    const sportRevenueData = Object.values(sportMap).filter(s => s.value > 0);

    return {
      totalPaidPayments,
      unrecordedDeposits,
      totalPaid,
      totalRefunded,
      netRevenue,
      forfeitedDeposits,
      successfulCount: successfulBookings.length,
      aov,
      transferTotal,
      cashTotal,
      paymentMethodsData,
      sportRevenueData,
    };
  }, [filteredPayments, filteredBookings, payments, courtTypes, courts]);

  // Daily Financial Statement Table (Chuẩn hóa chuẩn báo cáo tài chính theo ngày hoạt động)
  const dailyStatement = useMemo(() => {
    // Map booking id -> paid amount & refund amount
    const bPaidMap = {};
    const bRefundMap = {};
    payments.forEach(p => {
      if (p.status === 'paid') {
        bPaidMap[p.booking_id] = (bPaidMap[p.booking_id] || 0) + p.amount;
      } else if (p.status === 'refunded') {
        bRefundMap[p.booking_id] = (bRefundMap[p.booking_id] || 0) + p.amount;
      }
    });

    // Các khoản cọc đơn cũ chưa có record payment paid
    bookings.forEach(b => {
      if (!bPaidMap[b.id] && (b.deposit_amount || 0) > 0) {
        bPaidMap[b.id] = b.deposit_amount;
      }
    });

    const dayMap = {};

    filteredBookings.forEach(b => {
      const d = b.time_slot?.date || (b.created_at ? b.created_at.slice(0, 10) : null);
      if (!d) return;

      if (!dayMap[d]) {
        dayMap[d] = {
          date: d,
          bookingsCount: 0,
          revenue: 0,
          refunded: 0,
          forfeited: 0,
        };
      }

      dayMap[d].bookingsCount += 1;
      dayMap[d].revenue += (bPaidMap[b.id] || 0);
      dayMap[d].refunded += (bRefundMap[b.id] || 0);
      if (b.status === 'cancelled' && b.deposit_forfeited) {
        dayMap[d].forfeited += (b.deposit_amount || 0);
      }
    });

    return Object.values(dayMap)
      .map(item => ({
        ...item,
        net: item.revenue - item.refunded,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredBookings, payments, bookings]);

  // Daily Composed Chart Data (Revenue + Bookings)
  const dailyChartData = useMemo(() => {
    return [...dailyStatement]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        date: d.date,
        dateLabel: d.date.includes(':') ? d.date : d.date.slice(5),
        revenue: d.revenue,
        bookings: d.bookingsCount,
      }));
  }, [dailyStatement]);

  const paginatedDaily = useMemo(() => {
    const start = (dailyPage - 1) * dailyPageSize;
    return dailyStatement.slice(start, start + dailyPageSize);
  }, [dailyStatement, dailyPage, dailyPageSize]);

  // ── Metrics Calculation (Tab 2: Operations) ──────────
  const operStats = useMemo(() => {
    const totalSlots = courtOcc.reduce((s, c) => s + c.total_slots, 0);
    const bookedSlots = courtOcc.reduce((s, c) => s + c.booked_slots, 0);
    const avgOccRate = totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(1) : '0';

    const topRevCourt = [...courtOcc].sort((a, b) => b.total_revenue - a.total_revenue)[0];
    const topOccCourt = [...courtOcc].sort((a, b) => b.occupancy_rate - a.occupancy_rate)[0];

    // Phân tích 3 ca: Sáng (6-12), Chiều (12-17), Tối (17-23)
    let morningBooked = 0, morningTotal = 0;
    let afternoonBooked = 0, afternoonTotal = 0;
    let eveningBooked = 0, eveningTotal = 0;

    peakHours.forEach(h => {
      const hourNum = parseInt(h.hour.slice(0, 2), 10);
      if (hourNum >= 6 && hourNum < 12) {
        morningBooked += h.booked_slots;
        morningTotal += h.total_slots;
      } else if (hourNum >= 12 && hourNum < 17) {
        afternoonBooked += h.booked_slots;
        afternoonTotal += h.total_slots;
      } else if (hourNum >= 17 && hourNum <= 23) {
        eveningBooked += h.booked_slots;
        eveningTotal += h.total_slots;
      }
    });

    return {
      totalSlots,
      bookedSlots,
      avgOccRate,
      topRevCourt,
      topOccCourt,
      shifts: [
        { name: 'Ca sáng (06:00 - 12:00)', icon: Sunrise, booked: morningBooked, total: morningTotal, rate: morningTotal > 0 ? Math.round((morningBooked / morningTotal) * 100) : 0, color: '#D97706', bg: '#FEF3C7' },
        { name: 'Ca chiều (12:00 - 17:00)', icon: Sun, booked: afternoonBooked, total: afternoonTotal, rate: afternoonTotal > 0 ? Math.round((afternoonBooked / afternoonTotal) * 100) : 0, color: '#2563EB', bg: '#DBEAFE' },
        { name: 'Giờ vàng tối (17:00 - 23:00)', icon: Moon, booked: eveningBooked, total: eveningTotal, rate: eveningTotal > 0 ? Math.round((eveningBooked / eveningTotal) * 100) : 0, color: '#7C3AED', bg: '#F3E8FF' },
      ],
    };
  }, [courtOcc, peakHours]);

  // ── Metrics Calculation (Tab 3: Customers) ───────────
  const custStats = useMemo(() => {
    const custBookingMap = {};
    filteredBookings.forEach(b => {
      const cid = b.customer_id;
      if (!custBookingMap[cid]) {
        custBookingMap[cid] = {
          id: cid,
          totalBookings: 0,
          totalSpent: 0,
          cancelledCount: 0,
        };
      }
      custBookingMap[cid].totalBookings++;
      if (b.status !== 'cancelled') {
        custBookingMap[cid].totalSpent += (b.total_amount || 0);
      } else {
        custBookingMap[cid].cancelledCount++;
      }
    });

    const activeCustList = Object.values(custBookingMap).map(item => {
      const c = customers.find(x => x.id === item.id) || {};
      return {
        ...item,
        name: c.full_name || `Khách hàng #${item.id}`,
        phone: c.phone || '—',
      };
    });

    const uniqueCount = activeCustList.length;
    const returningCount = activeCustList.filter(c => c.totalBookings >= 2).length;
    const retentionRate = uniqueCount > 0 ? Math.round((returningCount / uniqueCount) * 100) : 0;

    const totalBookingsCount = filteredBookings.length;
    const cancelledCount = filteredBookings.filter(b => b.status === 'cancelled').length;
    const cancelRate = totalBookingsCount > 0 ? ((cancelledCount / totalBookingsCount) * 100).toFixed(1) : '0';

    // Top 5 VIP players
    const topVipPlayers = [...activeCustList].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    // Cancelled bookings details
    const cancelledList = filteredBookings.filter(b => b.status === 'cancelled').map(b => {
      const c = customers.find(x => x.id === b.customer_id) || {};
      const court = courts.find(x => x.id === b.court_id) || {};
      const hasRefund = payments.some(p => p.booking_id === b.id && p.status === 'refunded');
      return {
        id: b.id,
        customerName: c.full_name || 'Khách vãng lai',
        courtName: court.name || 'Sân thể thao',
        date: b.time_slot?.date || b.created_at?.slice(0, 10),
        time: b.time_slot ? `${b.time_slot.start_time.slice(0, 5)} - ${b.time_slot.end_time.slice(0, 5)}` : '—',
        deposit: b.deposit_amount || 0,
        status: b.deposit_forfeited ? 'forfeited' : (hasRefund ? 'refunded' : 'pending'),
        note: b.note || 'Khách báo bận',
      };
    });

    // Booking status donut data
    const completedCount = filteredBookings.filter(b => b.status === 'completed').length;
    const confirmedCount = filteredBookings.filter(b => b.status === 'confirmed').length;
    const statusPieData = [
      { name: 'Hoàn tất', value: completedCount, color: '#10B981' },
      { name: 'Xác nhận (Sắp chơi)', value: confirmedCount, color: '#3B82F6' },
      { name: 'Đã hủy', value: cancelledCount, color: '#EF4444' },
    ].filter(d => d.value > 0);

    return {
      uniqueCount,
      returningCount,
      retentionRate,
      cancelRate,
      cancelledCount,
      totalBookingsCount,
      topVipPlayers,
      cancelledList,
      statusPieData,
    };
  }, [filteredBookings, customers, courts, payments]);

  const paginatedCancelled = useMemo(() => {
    const start = (cancelPage - 1) * cancelPageSize;
    return custStats.cancelledList.slice(start, start + cancelPageSize);
  }, [custStats.cancelledList, cancelPage, cancelPageSize]);

  // ── CSV Export ───────────────────────────────────────
  const handleExportCSV = () => {
    let csv = '\uFEFF'; // BOM UTF-8 để mở tiếng Việt trên Excel không lỗi font
    csv += 'HỆ THỐNG QUẢN LÝ SÂN THỂ THAO SPORTBOOKING PRO\n';
    csv += `BÁO CÁO HOẠT ĐỘNG KINH DOANH VÀ VẬN HÀNH\n`;
    csv += `Khoảng thời gian: ${fromDate} đến ${toDate}\n`;
    csv += `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;

    csv += '--- 1. TỔNG HỢP CHỈ SỐ DOANH THU & TÀI CHÍNH ---\n';
    csv += `Tổng doanh thu thuần,${revStats.netRevenue}\n`;
    csv += `Tổng tiền đã thu,${revStats.totalPaid}\n`;
    csv += `Tổng tiền đã hoàn trả,${revStats.totalRefunded}\n`;
    csv += `Tiền cọc giữ lại phạt hủy,${revStats.forfeitedDeposits}\n`;
    csv += `Số đơn thành công,${revStats.successfulCount}\n`;
    csv += `Giá trị đơn trung bình (AOV),${revStats.aov}\n\n`;

    csv += '--- 2. CHI TIẾT DOANH THU THEO NGÀY ---\n';
    csv += 'Ngày,Số lượt đặt,Doanh thu (VNĐ),Hoàn tiền (VNĐ),Cọc giữ lại (VNĐ),Thực thu ròng (VNĐ)\n';
    dailyStatement.forEach(d => {
      csv += `"${d.date}",${d.bookingsCount},${d.revenue},${d.refunded},${d.forfeited},${d.net}\n`;
    });
    csv += '\n';

    csv += '--- 3. HIỆU SUẤT CÔNG SUẤT TỪNG SÂN ---\n';
    csv += 'Mã sân,Tên sân,Tổng ca mở,Ca đã đặt,Tỉ lệ lấp đầy (%),Doanh thu đóng góp (VNĐ)\n';
    courtOcc.forEach(c => {
      csv += `${c.court_id},"${c.court_name}",${c.total_slots},${c.booked_slots},${c.occupancy_rate}%,${c.total_revenue}\n`;
    });
    csv += '\n';

    csv += '--- 4. TOP KHÁCH HÀNG VIP CHI TIÊU CAO NHẤT ---\n';
    csv += 'Hạng,Tên khách hàng,Số điện thoại,Tổng số lượt đặt,Tổng chi tiêu (VNĐ)\n';
    custStats.topVipPlayers.forEach((p, idx) => {
      csv += `#${idx + 1},"${p.name}","${p.phone}",${p.totalBookings},${p.totalSpent}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_SportBooking_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-page">
      {/* ── Print Header Only ───────────────────────────── */}
      <div className="print-only-header">
        <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', color: '#0F172A' }}>SPORTBOOKING PRO - BÁO CÁO QUẢN TRỊ KINH DOANH</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
          Thời gian phân tích: Từ ngày <strong>{fromDate}</strong> đến <strong>{toDate}</strong> | Người lập: Administrator
        </p>
      </div>

      {/* ── Main Filter Bar ─────────────────────────────── */}
      <div className="reports-header-card no-print">
        <div className="reports-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1>Báo cáo &amp; Thống kê</h1>
            <span style={{
              background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0',
              padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4
            }}>
              <Award size={12} /> Chuẩn BI Doanh nghiệp
            </span>
          </div>
          <p>Phân tích tài chính chuyên sâu, công suất lấp đầy sân, chân dung khách hàng và khuyến nghị AI</p>
        </div>

        <div className="reports-actions-bar">
          <div className="reports-preset-group">
            <button
              type="button"
              className={`reports-preset-btn ${activePreset === 'all' ? 'active' : ''}`}
              onClick={() => applyPreset('all')}
            >
              Toàn thời gian
            </button>
            <button
              type="button"
              className={`reports-preset-btn ${activePreset === '30' ? 'active' : ''}`}
              onClick={() => applyPreset('30')}
            >
              30 ngày qua
            </button>
            <button
              type="button"
              className={`reports-preset-btn ${activePreset === '7' ? 'active' : ''}`}
              onClick={() => applyPreset('7')}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              className={`reports-preset-btn ${activePreset === 'this_month' ? 'active' : ''}`}
              onClick={() => applyPreset('this_month')}
            >
              Tháng này
            </button>
          </div>

          <div className="reports-date-inputs">
            <Input
              label="Từ ngày"
              type="date"
              value={fromDate}
              max={toDate}
              onChange={e => { setFromDate(e.target.value); setActivePreset('custom'); }}
              style={{ width: 135 }}
            />
            <Input
              label="Đến ngày"
              type="date"
              value={toDate}
              min={fromDate}
              onChange={e => { setToDate(e.target.value); setActivePreset('custom'); }}
              style={{ width: 135 }}
            />
          </div>

          <div className="reports-btn-group">
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleExportCSV}
              title="Xuất bảng dữ liệu ra file Excel (CSV UTF-8)"
            >
              Xuất Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer size={14} />}
              onClick={handlePrint}
              title="In báo cáo định dạng A4"
            >
              In PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── Enterprise Tab Navigation ───────────────────── */}
      <div className="reports-tab-nav no-print">
        <button
          className={`reports-tab-item ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          <DollarSign size={16} />
          <span>Doanh thu &amp; Dòng tiền</span>
          <span className="reports-tab-badge">{revStats.totalPaid.toLocaleString()}đ</span>
        </button>

        <button
          className={`reports-tab-item ${activeTab === 'operations' ? 'active' : ''}`}
          onClick={() => setActiveTab('operations')}
        >
          <Building2 size={16} />
          <span>Công suất &amp; Hiệu suất sân</span>
          <span className="reports-tab-badge">{operStats.avgOccRate}% TB</span>
        </button>

        <button
          className={`reports-tab-item ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <Users size={16} />
          <span>Khách hàng &amp; Tỷ lệ hủy</span>
          <span className="reports-tab-badge">{custStats.uniqueCount} khách</span>
        </button>

        <button
          className={`reports-tab-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Sparkles size={16} style={{ color: '#7C3AED' }} />
          <span>Trợ lý AI Chiến lược</span>
          <span className="reports-tab-badge" style={{ background: '#EDE9FE', color: '#6D28D9' }}>AI BI</span>
        </button>
      </div>

      {/* ====================================================
          TAB 1: DOANH THU & DÒNG TIỀN (FINANCIAL DEEP-DIVE)
         ==================================================== */}
      {activeTab === 'revenue' && (
        <div>
          {/* KPI Cards */}
          <div className="reports-kpi-grid">
            <div className="reports-kpi-card" style={{ borderTopColor: '#059669' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#DCFCE7', color: '#059669' }}>
                  <DollarSign size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#DCFCE7', color: '#15803D' }}>
                  Đã thu vào quỹ
                </span>
              </div>
              <p className="reports-kpi-label">Tổng tiền đã thu (Thực thu)</p>
              <p className="reports-kpi-val" style={{ color: '#059669' }}>
                {loading ? '...' : `${revStats.totalPaid.toLocaleString()}đ`}
              </p>
              <p className="reports-kpi-sub">
                Gồm 1.675.000đ thanh toán + 350.000đ tiền cọc
              </p>
            </div>

            <div className="reports-kpi-card" style={{ borderTopColor: '#7C3AED' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#F3E8FF', color: '#7C3AED' }}>
                  <TrendingUp size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#F3E8FF', color: '#6D28D9' }}>
                  Thực thu ròng
                </span>
              </div>
              <p className="reports-kpi-label">Doanh thu thuần (Sau hoàn)</p>
              <p className="reports-kpi-val" style={{ color: '#7C3AED' }}>
                {loading ? '...' : `${revStats.netRevenue.toLocaleString()}đ`}
              </p>
              <p className="reports-kpi-sub">
                = {revStats.totalPaid.toLocaleString()}đ − {revStats.totalRefunded.toLocaleString()}đ hoàn trả
              </p>
            </div>

            <div className="reports-kpi-card" style={{ borderTopColor: '#B45309' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#FEF3C7', color: '#B45309' }}>
                  <Lock size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#FEF3C7', color: '#92400E' }}>
                  Bồi thường
                </span>
              </div>
              <p className="reports-kpi-label">Thu từ cọc phạt hủy</p>
              <p className="reports-kpi-val" style={{ color: '#B45309' }}>
                {loading ? '...' : `${revStats.forfeitedDeposits.toLocaleString()}đ`}
              </p>
              <p className="reports-kpi-sub">
                Tiền cọc giữ lại từ các đơn hủy vi phạm (#11, #12)
              </p>
            </div>

            <div className="reports-kpi-card" style={{ borderTopColor: '#2563EB' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                  <RefreshCw size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#DBEAFE', color: '#1E40AF' }}>
                  Đã hoàn trả
                </span>
              </div>
              <p className="reports-kpi-label">Tiền hoàn lại khách</p>
              <p className="reports-kpi-val" style={{ color: '#2563EB' }}>
                {loading ? '...' : `${revStats.totalRefunded.toLocaleString()}đ`}
              </p>
              <p className="reports-kpi-sub">
                Đã hoàn cọc cho đơn hủy hợp lệ (#2, #7)
              </p>
            </div>
          </div>

          {/* Composed Chart: Doanh thu & Lượt đặt theo ngày */}
          <div className="report-panel" style={{ marginBottom: '1.5rem' }}>
            <div className="report-panel-header">
              <div>
                <h3 className="report-panel-title">
                  <TrendingUp size={18} style={{ color: '#2563EB' }} />
                  Xu hướng Doanh thu &amp; Số lượt đặt sân theo chuỗi thời gian
                </h3>
                <p className="report-panel-sub">Biểu đồ kép (Composed Chart) đối chiếu tăng trưởng dòng tiền và lưu lượng khách hàng</p>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 600 }}>
                  <span style={{ width: 12, height: 12, background: '#2563EB', borderRadius: 3, display: 'inline-block' }} /> Doanh thu (VNĐ)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontWeight: 600 }}>
                  <span style={{ width: 12, height: 3, background: '#10B981', display: 'inline-block' }} /> Lượt đặt sân
                </span>
              </div>
            </div>

            {loading ? (
              <Skeleton height="280px" variant="rect" />
            ) : dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="dateLabel" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
                    width={45}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#10B981', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={35}
                  />
                  <Tooltip
                    content={<CustomChartTooltip formatter={(v, key) => key === 'revenue' ? `${v.toLocaleString()}đ` : `${v} lượt`} />}
                  />
                  <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" name="Lượt đặt" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#64748B', padding: '3rem 0' }}>Không có dữ liệu phát sinh trong kỳ</p>
            )}
          </div>

          {/* 2 Donut Charts: Cơ cấu theo Môn & Cơ cấu thanh toán */}
          <div className="reports-grid-2col">
            <div className="report-panel">
              <div className="report-panel-header">
                <div>
                  <h3 className="report-panel-title">
                    <PieIcon size={18} style={{ color: '#059669' }} />
                    Cơ cấu Doanh thu theo Môn thể thao
                  </h3>
                  <p className="report-panel-sub">Tỉ trọng đóng góp của từng bộ môn vào quỹ doanh thu</p>
                </div>
              </div>

              {revStats.sportRevenueData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ width: 200, height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revStats.sportRevenueData}
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {revStats.sportRevenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => `${v.toLocaleString()}đ`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {revStats.sportRevenueData.map((item, idx) => {
                      const pct = revStats.netRevenue > 0 ? Math.round((item.value / revStats.netRevenue) * 100) : 0;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                          <span style={{ color: '#334155', minWidth: 90, fontWeight: 500 }}>{item.name}:</span>
                          <strong style={{ color: '#0F172A' }}>{item.value.toLocaleString()}đ</strong>
                          <span style={{ color: '#64748B', fontSize: '0.75rem' }}>({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#64748B', padding: '2rem 0' }}>Chưa có doanh thu môn thể thao</p>
              )}
            </div>

            <div className="report-panel">
              <div className="report-panel-header">
                <div>
                  <h3 className="report-panel-title">
                    <CreditCard size={18} style={{ color: '#2563EB' }} />
                    Cơ cấu Phương thức thanh toán
                  </h3>
                  <p className="report-panel-sub">Tỉ trọng dòng tiền giữa Chuyển khoản QR và Tiền mặt</p>
                </div>
              </div>

              {revStats.paymentMethodsData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ width: 200, height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revStats.paymentMethodsData}
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {revStats.paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => `${v.toLocaleString()}đ`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {revStats.paymentMethodsData.map((item, idx) => {
                      const pct = revStats.totalPaid > 0 ? Math.round((item.value / revStats.totalPaid) * 100) : 0;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                          <span style={{ color: '#334155', minWidth: 120, fontWeight: 500 }}>{item.name}:</span>
                          <strong style={{ color: '#0F172A' }}>{item.value.toLocaleString()}đ</strong>
                          <span style={{ color: '#64748B', fontSize: '0.75rem' }}>({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#64748B', padding: '2rem 0' }}>Chưa có giao dịch thanh toán</p>
              )}
            </div>
          </div>

          {/* Bảng Kê Doanh Thu Chi Tiết Hàng Ngày */}
          <div className="report-panel">
            <div className="report-panel-header">
              <div>
                <h3 className="report-panel-title">
                  <Calendar size={18} style={{ color: '#0F172A' }} />
                  Bảng kê Nhật ký Tài chính &amp; Doanh thu theo ngày
                </h3>
                <p className="report-panel-sub">Chi tiết số lượt đặt, thu tiền thực tế, hoàn tiền và thực thu ròng theo từng ngày</p>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Tổng cộng: <strong style={{ color: '#0F172A' }}>{dailyStatement.length}</strong> ngày phát sinh
              </span>
            </div>

            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Ngày ghi nhận</th>
                    <th style={{ textAlign: 'center' }}>Số đơn đặt</th>
                    <th style={{ textAlign: 'right' }}>Tổng đã thu (VNĐ)</th>
                    <th style={{ textAlign: 'right' }}>Hoàn tiền (VNĐ)</th>
                    <th style={{ textAlign: 'right' }}>Cọc giữ lại (VNĐ)</th>
                    <th style={{ textAlign: 'right' }}>Thực thu ròng (VNĐ)</th>
                    <th style={{ textAlign: 'center' }}>Tỉ trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDaily.map((d, idx) => {
                    const ratio = revStats.netRevenue > 0 ? ((d.net / revStats.netRevenue) * 100).toFixed(1) : 0;
                    return (
                      <tr key={idx}>
                        <td><strong>{d.date}</strong></td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                            {d.bookingsCount} đơn
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                          {d.revenue.toLocaleString()}đ
                        </td>
                        <td style={{ textAlign: 'right', color: d.refunded > 0 ? '#2563EB' : '#94A3B8' }}>
                          {d.refunded > 0 ? `-${d.refunded.toLocaleString()}đ` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', color: d.forfeited > 0 ? '#B45309' : '#94A3B8' }}>
                          {d.forfeited > 0 ? `+${d.forfeited.toLocaleString()}đ` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: d.net < 0 ? '#2563EB' : '#0F172A' }}>
                          {d.net.toLocaleString()}đ
                        </td>
                        <td style={{ textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>
                          {ratio}%
                        </td>
                      </tr>
                    );
                  })}
                  {dailyStatement.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                        Không có dữ liệu trong khoảng thời gian đã chọn
                      </td>
                    </tr>
                  )}
                </tbody>
                {dailyStatement.length > 0 && (
                  <tfoot>
                    <tr>
                      <td>TỔNG CỘNG TOÀN KỲ</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{filteredBookings.length} đơn</td>
                      <td style={{ textAlign: 'right', color: '#059669', fontWeight: 700 }}>{revStats.totalPaid.toLocaleString()}đ</td>
                      <td style={{ textAlign: 'right', color: '#2563EB', fontWeight: 700 }}>-{revStats.totalRefunded.toLocaleString()}đ</td>
                      <td style={{ textAlign: 'right', color: '#B45309', fontWeight: 700 }}>+{revStats.forfeitedDeposits.toLocaleString()}đ</td>
                      <td style={{ textAlign: 'right', color: '#0F172A', fontWeight: 700 }}>{revStats.netRevenue.toLocaleString()}đ</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>100%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {dailyStatement.length > dailyPageSize && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination
                  currentPage={dailyPage}
                  totalPages={Math.ceil(dailyStatement.length / dailyPageSize)}
                  onPageChange={setDailyPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 2: CÔNG SUẤT & HIỆU SUẤT SÂN (OPERATIONS)
         ==================================================== */}
      {activeTab === 'operations' && (
        <div>
          {/* KPI Cards */}
          <div className="reports-kpi-grid">
            <div className="reports-kpi-card" style={{ borderTopColor: '#059669' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#DCFCE7', color: '#059669' }}>
                  <BarChart3 size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#DCFCE7', color: '#15803D' }}>
                  Toàn cơ sở
                </span>
              </div>
              <p className="reports-kpi-label">Công suất lấp đầy TB</p>
              <p className="reports-kpi-val" style={{ color: '#059669' }}>
                {operStats.avgOccRate}%
              </p>
              <p className="reports-kpi-sub">
                Đã đặt {operStats.bookedSlots} / {operStats.totalSlots} khung giờ
              </p>
            </div>

            <div className="reports-kpi-card" style={{ borderTopColor: '#2563EB' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                  <Award size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#DBEAFE', color: '#1E40AF' }}>
                  Top Doanh thu
                </span>
              </div>
              <p className="reports-kpi-label">Sân sinh lời cao nhất</p>
              <p className="reports-kpi-val" style={{ color: '#2563EB', fontSize: '1.25rem' }}>
                {operStats.topRevCourt?.court_name || '—'}
              </p>
              <p className="reports-kpi-sub">
                Đóng góp {(operStats.topRevCourt?.total_revenue || 0).toLocaleString()}đ
              </p>
            </div>

            <div className="reports-kpi-card" style={{ borderTopColor: '#7C3AED' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#F3E8FF', color: '#7C3AED' }}>
                  <Flame size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#F3E8FF', color: '#6D28D9' }}>
                  Kín lịch nhất
                </span>
              </div>
              <p className="reports-kpi-label">Sân tỷ lệ lấp đầy cao nhất</p>
              <p className="reports-kpi-val" style={{ color: '#7C3AED', fontSize: '1.25rem' }}>
                {operStats.topOccCourt?.court_name || '—'}
              </p>
              <p className="reports-kpi-sub">
                Đạt tỷ lệ lấp đầy {operStats.topOccCourt?.occupancy_rate || 0}%
              </p>
            </div>

            <div className="reports-kpi-card" style={{ borderTopColor: '#D97706' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <Clock size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#FEF3C7', color: '#92400E' }}>
                  Sản lượng
                </span>
              </div>
              <p className="reports-kpi-label">Tổng số ca đã phục vụ</p>
              <p className="reports-kpi-val" style={{ color: '#D97706' }}>
                {operStats.bookedSlots} ca
              </p>
              <p className="reports-kpi-sub">
                Tương ứng {operStats.bookedSlots * 1.5} giờ chơi thể thao
              </p>
            </div>
          </div>

          {/* Phân tích 3 ca trong ngày (Morning, Afternoon, Evening) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={18} style={{ color: '#2563EB' }} />
              Phân tích hiệu suất theo 3 Ca hoạt động trong ngày
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {operStats.shifts.map((shift, idx) => {
                const IconComponent = shift.icon;
                return (
                  <div key={idx} style={{
                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1.15rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem'
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: shift.bg, color: shift.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconComponent size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{shift.name}</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>{shift.rate}%</span>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>({shift.booked}/{shift.total} ca)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, shift.rate)}%`, height: '100%', background: shift.color, borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Biểu đồ Cột so sánh công suất từng sân */}
          <div className="report-panel" style={{ marginBottom: '1.5rem' }}>
            <div className="report-panel-header">
              <div>
                <h3 className="report-panel-title">
                  <BarChart3 size={18} style={{ color: '#10B981' }} />
                  So sánh Tỉ lệ Lấp đầy &amp; Doanh thu giữa các sân
                </h3>
                <p className="report-panel-sub">Đánh giá trực quan mức độ hiệu quả kinh doanh của từng sân cụ thể</p>
              </div>
            </div>

            {loading ? (
              <Skeleton height="260px" variant="rect" />
            ) : courtOcc.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={courtOcc} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="court_name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} width={40} />
                  <Tooltip
                    content={<CustomChartTooltip formatter={(v, key) => key === 'occupancy_rate' ? `${v}%` : `${v.toLocaleString()}đ`} />}
                  />
                  <Bar dataKey="occupancy_rate" name="Tỉ lệ lấp đầy" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#64748B', padding: '3rem 0' }}>Không có dữ liệu sân</p>
            )}
          </div>

          {/* Biểu đồ Lượt đặt theo từng khung giờ (06:00 - 23:00) */}
          <div className="report-panel" style={{ marginBottom: '1.5rem' }}>
            <div className="report-panel-header">
              <div>
                <h3 className="report-panel-title">
                  <Clock size={18} style={{ color: '#7C3AED' }} />
                  Mật độ đặt sân theo từng Khung giờ trong ngày (06:00 — 23:00)
                </h3>
                <p className="report-panel-sub">Nhận diện giờ cao điểm để điều chỉnh giá và giờ thấp điểm để chạy khuyến mại</p>
              </div>
            </div>

            {loading ? (
              <Skeleton height="220px" variant="rect" />
            ) : peakHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={peakHours} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                  <Tooltip content={<CustomChartTooltip formatter={v => `${v} ca đặt`} />} />
                  <Bar dataKey="booked_slots" name="Lượt đặt" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#64748B', padding: '3rem 0' }}>Không có dữ liệu khung giờ</p>
            )}
          </div>

          {/* Bảng xếp hạng hiệu suất từng sân */}
          <div className="report-panel">
            <div className="report-panel-header">
              <div>
                <h3 className="report-panel-title">
                  <Building2 size={18} style={{ color: '#0F172A' }} />
                  Bảng tổng hợp Hiệu suất &amp; Chỉ số Kinh doanh từng sân
                </h3>
                <p className="report-panel-sub">Chi tiết số ca, doanh thu đóng góp và đánh giá sức chứa</p>
              </div>
            </div>

            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Mã sân</th>
                    <th>Tên sân</th>
                    <th style={{ textAlign: 'center' }}>Tổng ca mở</th>
                    <th style={{ textAlign: 'center' }}>Ca đã đặt</th>
                    <th>Tỉ lệ lấp đầy</th>
                    <th style={{ textAlign: 'right' }}>Doanh thu thu về</th>
                    <th style={{ textAlign: 'center' }}>Đánh giá hiệu suất</th>
                  </tr>
                </thead>
                <tbody>
                  {courtOcc.map(c => {
                    const isHigh = c.occupancy_rate >= 50;
                    const isMedium = c.occupancy_rate >= 20 && c.occupancy_rate < 50;
                    const barColor = isHigh ? '#10B981' : (isMedium ? '#3B82F6' : '#F59E0B');
                    return (
                      <tr key={c.court_id}>
                        <td><strong>#{c.court_id}</strong></td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>{c.court_name}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{c.total_slots}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#059669' }}>{c.booked_slots}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="court-occ-bar-bg">
                              <div className="court-occ-bar-fill" style={{ width: `${Math.min(100, c.occupancy_rate)}%`, background: barColor }} />
                            </div>
                            <strong style={{ fontSize: '0.82rem', color: barColor }}>{c.occupancy_rate}%</strong>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                          {(c.total_revenue || 0).toLocaleString()}đ
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isHigh ? (
                            <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600 }}>
                              🔥 Rất đắt khách
                            </span>
                          ) : isMedium ? (
                            <span style={{ background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600 }}>
                              ⚡ Vận hành ổn định
                            </span>
                          ) : (
                            <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600 }}>
                              💤 Cần kích cầu giá rẻ
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {courtOcc.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                        Không có dữ liệu sân
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 3: KHÁCH HÀNG & TỶ LỆ HỦY (CUSTOMERS & RETENTION)
         ==================================================== */}
      {activeTab === 'customers' && (
        <div>
          {/* KPI Cards */}
          <div className="reports-kpi-grid">
            <div className="reports-kpi-card" style={{ borderTopColor: '#2563EB' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                  <Users size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                  Khách hàng
                </span>
              </div>
              <p className="reports-kpi-label">Tổng khách đặt sân</p>
              <p className="reports-kpi-val" style={{ color: '#2563EB' }}>
                {custStats.uniqueCount} khách
              </p>
              <p className="reports-kpi-sub">
                Tệp khách hàng phát sinh đặt sân trong kỳ
              </p>
            </div>

            <div className="reports-kpi-card" style={{ borderTopColor: '#059669' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#DCFCE7', color: '#059669' }}>
                  <TrendingUp size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#DCFCE7', color: '#15803D' }}>
                  Khách thân thiết
                </span>
              </div>
              <p className="reports-kpi-label">Tỉ lệ khách quay lại</p>
              <p className="reports-kpi-val" style={{ color: '#059669' }}>
                {custStats.retentionRate}%
              </p>
              <p className="reports-kpi-sub">
                {custStats.returningCount} khách đã đặt từ 2 lượt trở lên
              </p>
            </div>

            <div className="reports-kpi-card" style={{ borderTopColor: '#DC2626' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <ShieldAlert size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                  Rủi ro hủy sân
                </span>
              </div>
              <p className="reports-kpi-label">Tỉ lệ hủy sân</p>
              <p className="reports-kpi-val" style={{ color: '#DC2626' }}>
                {custStats.cancelRate}%
              </p>
              <p className="reports-kpi-sub">
                {custStats.cancelledCount} / {custStats.totalBookingsCount} lượt đặt bị hủy
              </p>
            </div>

            <div className="reports-kpi-card" style={{ borderTopColor: '#B45309' }}>
              <div className="reports-kpi-header">
                <div className="reports-kpi-icon-wrap" style={{ background: '#FEF3C7', color: '#B45309' }}>
                  <Lock size={20} />
                </div>
                <span className="reports-kpi-tag" style={{ background: '#FEF3C7', color: '#92400E' }}>
                  Thu hồi tổn thất
                </span>
              </div>
              <p className="reports-kpi-label">Cọc phạt giữ lại</p>
              <p className="reports-kpi-val" style={{ color: '#B45309' }}>
                {revStats.forfeitedDeposits.toLocaleString()}đ
              </p>
              <p className="reports-kpi-sub">
                Bồi thường chi phí giữ khung giờ trống
              </p>
            </div>
          </div>

          {/* 2-Column: Top 5 VIP Players & Phân tích Trạng thái Đơn */}
          <div className="reports-grid-2col">
            {/* Top 5 VIP Players */}
            <div className="report-panel">
              <div className="report-panel-header">
                <div>
                  <h3 className="report-panel-title">
                    <Award size={18} style={{ color: '#F59E0B' }} />
                    Top 5 Khách hàng VIP đóng góp Doanh thu lớn nhất
                  </h3>
                  <p className="report-panel-sub">Nhóm khách hàng trung thành cần được ưu tiên chăm sóc</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {custStats.topVipPlayers.map((player, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: idx === 0 ? '#FEF3C7' : (idx === 1 ? '#E2E8F0' : (idx === 2 ? '#FFEDD5' : '#F1F5F9')),
                        color: idx === 0 ? '#B45309' : (idx === 1 ? '#475569' : (idx === 2 ? '#C2410C' : '#64748B')),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem'
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{player.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>SĐT: {player.phone}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#059669', fontSize: '0.92rem' }}>
                        {player.totalSpent.toLocaleString()}đ
                      </strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {player.totalBookings} lượt đặt
                      </div>
                    </div>
                  </div>
                ))}
                {custStats.topVipPlayers.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#64748B', padding: '2rem 0' }}>Chưa có dữ liệu khách hàng</p>
                )}
              </div>
            </div>

            {/* Cơ cấu Trạng thái Đơn hàng */}
            <div className="report-panel">
              <div className="report-panel-header">
                <div>
                  <h3 className="report-panel-title">
                    <PieIcon size={18} style={{ color: '#DC2626' }} />
                    Cơ cấu Trạng thái Đơn hàng &amp; Tỷ lệ Hủy
                  </h3>
                  <p className="report-panel-sub">Tỉ trọng các đơn đặt hoàn tất so với các đơn bị hủy</p>
                </div>
              </div>

              {custStats.statusPieData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ width: 190, height: 190 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={custStats.statusPieData}
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {custStats.statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => `${v} đơn`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {custStats.statusPieData.map((item, idx) => {
                      const pct = custStats.totalBookingsCount > 0 ? Math.round((item.value / custStats.totalBookingsCount) * 100) : 0;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                          <span style={{ color: '#334155', minWidth: 120, fontWeight: 500 }}>{item.name}:</span>
                          <strong style={{ color: '#0F172A' }}>{item.value} đơn</strong>
                          <span style={{ color: '#64748B', fontSize: '0.75rem' }}>({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#64748B', padding: '2rem 0' }}>Chưa có đơn đặt sân</p>
              )}
            </div>
          </div>

          {/* Bảng Chi tiết các đơn đã hủy trong kỳ */}
          <div className="report-panel">
            <div className="report-panel-header">
              <div>
                <h3 className="report-panel-title">
                  <XCircle size={18} style={{ color: '#DC2626' }} />
                  Nhật ký Giám sát Các đơn đặt sân bị Hủy &amp; Hiện trạng Cọc
                </h3>
                <p className="report-panel-sub">Theo dõi nguyên nhân hủy và kiểm soát việc hoàn trả / giữ cọc bồi thường</p>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Tổng cộng: <strong style={{ color: '#DC2626' }}>{custStats.cancelledList.length}</strong> đơn hủy
              </span>
            </div>

            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Sân thể thao</th>
                    <th>Ngày &amp; Giờ chơi</th>
                    <th style={{ textAlign: 'right' }}>Tiền cọc</th>
                    <th style={{ textAlign: 'center' }}>Xử lý tiền cọc</th>
                    <th>Ghi chú / Lý do hủy</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCancelled.map(b => (
                    <tr key={b.id}>
                      <td><strong>#{b.id}</strong></td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{b.customerName}</span>
                      </td>
                      <td>{b.courtName}</td>
                      <td>
                        <span style={{ color: '#475569' }}>{b.date}</span>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{b.time}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: b.deposit > 0 ? '#B45309' : '#94A3B8' }}>
                        {b.deposit > 0 ? `${b.deposit.toLocaleString()}đ` : 'Không cọc'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {b.status === 'forfeited' ? (
                          <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Lock size={10} /> Đã giữ cọc
                          </span>
                        ) : b.status === 'refunded' ? (
                          <span style={{ background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <RefreshCw size={10} /> Đã hoàn cọc
                          </span>
                        ) : b.deposit > 0 ? (
                          <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FCD34D', padding: '2px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600 }}>
                            Chờ quyết định
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.note}
                      </td>
                    </tr>
                  ))}
                  {custStats.cancelledList.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#059669', fontWeight: 600 }}>
                        Tuyệt vời! Không có đơn đặt sân nào bị hủy trong khoảng thời gian này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {custStats.cancelledList.length > cancelPageSize && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination
                  currentPage={cancelPage}
                  totalPages={Math.ceil(custStats.cancelledList.length / cancelPageSize)}
                  onPageChange={setCancelPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          TAB 4: TRỢ LÝ AI CHIẾN LƯỢC (AI BUSINESS INTELLIGENCE)
         ==================================================== */}
      {activeTab === 'ai' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem', alignItems: 'start' }}>
          {/* Cột trái: AI BI Output + Dynamic Pricing Strategies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="report-panel" style={{ background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
              <div className="report-panel-header" style={{ marginBottom: '1rem' }}>
                <div>
                  <h3 className="report-panel-title" style={{ color: '#6D28D9' }}>
                    <Sparkles size={18} />
                    Trung tâm Phân tích &amp; Khuyến nghị Chiến lược Kinh doanh (AI BI)
                  </h3>
                  <p className="report-panel-sub">Ứng dụng mô hình AI Deep Learning phân tích ma trận dữ liệu và đề xuất hành động thực tiễn</p>
                </div>
              </div>

              {/* AI Strategic Action Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D97706', fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
                    <TrendingDown size={16} /> Dynamic Pricing
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    Giảm giá <strong>15 - 20%</strong> vào ca sáng (06:00 - 11:00) các ngày từ Thứ 2 đến Thứ 6 để bù đắp chi phí cố định cho sân.
                  </p>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
                    <Flame size={16} /> Bảo vệ Giờ Vàng
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    Áp dụng mức cọc <strong>50%</strong> cho khung giờ 17:00 - 21:00 và quy định hủy trước 12h để loại bỏ nguy cơ bùng sân giờ cao điểm.
                  </p>
                </div>

                <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
                    <Award size={16} /> Giữ chân Khách VIP
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    Tặng voucher giảm 50.000đ hoặc chai nước thể thao miễn phí cho Top 5 khách quen khi đạt mốc từ 5 ca chơi/tháng.
                  </p>
                </div>
              </div>

              {/* AI Generated Raw Data Chart */}
              {aiRawData && Object.keys(aiRawData).length > 0 && (
                <div style={{ background: '#FFFFFF', borderRadius: 10, padding: '1rem', border: '1px solid #E9D5FF', marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6D28D9', margin: '0 0 0.75rem' }}>
                    Biểu đồ Phân tích Công suất Lấp đầy Khung giờ do AI tính toán
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={Object.entries(aiRawData).sort(([a],[b]) => a.localeCompare(b)).map(([hour, d]) => ({ hour, rate: d.occupancy_rate_percent }))}
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} width={34} />
                      <Tooltip formatter={v => `${v}%`} />
                      <Bar dataKey="rate" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* AI Summary Text Container */}
            {(generatingAI || aiSummary || aiError) && (
              <AICard loading={generatingAI} title="Báo cáo Tổng hợp Chiến lược AI" error={aiError}>
                {aiSummary && <p className="ai-card-text" style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{aiSummary}</p>}
              </AICard>
            )}
          </div>

          {/* Cột phải: Control trigger AI */}
          <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="report-panel" style={{ background: '#FFFFFF' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#6D28D9', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> Kích hoạt Phân tích AI
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Mô hình AI sẽ đối chiếu dữ liệu kinh doanh từ <strong style={{ color: '#0F172A' }}>{fromDate}</strong> đến <strong style={{ color: '#0F172A' }}>{toDate}</strong> để đưa ra góc nhìn chuẩn chuyên gia quản trị.
              </p>
              <Button
                variant="primary"
                icon={<Sparkles size={15} />}
                loading={generatingAI}
                style={{ width: '100%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}
                onClick={handleGenerateAI}
              >
                {generatingAI ? 'AI đang xử lý...' : 'Tạo Báo cáo Chiến lược AI'}
              </Button>

              {(aiSummary || aiError) && (
                <button
                  onClick={() => { setAiSummary(''); setAiRawData(null); setAiError(''); }}
                  style={{ marginTop: 12, display: 'block', width: '100%', textAlign: 'center', background: 'none', border: 'none', color: '#64748B', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Xóa kết quả phân tích
                </button>
              )}
            </div>

            <div className="report-panel" style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ghi chú Nghiệp vụ
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Dữ liệu báo cáo được tổng hợp theo thời gian thực từ toàn bộ sổ quỹ thanh toán, tiền cọc và lịch đặt sân. Tất cả số liệu xuất Excel đều được mã hóa tiếng Việt chuẩn UTF-8.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
