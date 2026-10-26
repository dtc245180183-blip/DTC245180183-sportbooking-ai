import { useState, useEffect, useMemo } from 'react';
import { paymentsAPI, bookingsAPI, customersAPI, courtsAPI } from '../../api';
import { CreditCard, RefreshCw, Calendar, Filter, X, AlertCircle, ChevronDown, ChevronUp, Trash2, List, Info, ShieldCheck, CheckCircle, Clock, XCircle, Lock, Wallet, Shield, TrendingUp, BarChart2, PieChart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Cell, CartesianGrid } from 'recharts';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Select, Table, ConfirmModal, Pagination } from '../../components/ui';
import { formatVNDateTime, todayVN } from '../../utils/datetime';
import { useDebounce } from '../../utils/useDebounce';

const METHOD_MAP   = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', momo: 'MoMo', refund: 'Hoàn tiền' };
const P_BADGE      = { paid: 'paid', pending: 'unpaid', refunded: 'completed' };
const P_LABEL      = { paid: 'Đã thanh toán', pending: 'Chờ thanh toán', refunded: 'Hoàn tiền' };


export default function Payments() {
  const { showToast } = useToast();
  const [payments,  setPayments]  = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [courts,    setCourts]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ booking_id: '', amount: '', method: 'cash', status: 'paid' });

  // Confirmation modals
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [paymentToRefund, setPaymentToRefund] = useState(null);
  const [actionLoading,   setActionLoading]   = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'detail'

  // Search & Filters
  const [search, setSearch]             = useState('');
  const debouncedSearch                 = useDebounce(search, 300);
  const [filterDate,   setFilterDate]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [showDebtList, setShowDebtList] = useState(true); // mở/đóng bảng nợ

  // Filter cho tab chi tiết
  const [detailFilterDeposit, setDetailFilterDeposit] = useState(''); // '' | 'has_deposit' | 'no_deposit' | 'paid_full' | 'need_pay'
  const [detailFilterStatus,  setDetailFilterStatus]  = useState(''); // '' | 'confirmed' | 'pending' | 'cancelled'

  // Filter cho tab sổ quỹ tiền cọc
  const [depositSearch, setDepositSearch] = useState('');
  const debouncedDepositSearch = useDebounce(depositSearch, 300);
  const [depositFilterStatus, setDepositFilterStatus] = useState('');
  const [depositPage, setDepositPage] = useState(1);
  const [depositPageSize, setDepositPageSize] = useState(10);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(10);

  useEffect(() => {
    fetchAll();
    bookingsAPI.getAll({}).then(data => setBookings(data)).catch(() => {});
    customersAPI.getAll({}).then(setCustomers).catch(() => {});
    courtsAPI.getAll({}).then(setCourts).catch(() => {});
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await paymentsAPI.getAll({});
      setPayments(data.reverse());
    } catch (e) {}
    finally { setLoading(false); }
  };

  // ── Helpers ──────────────────────────────────────────
  const getCustomerName = (bookingId) => {
    const b = bookings.find(b => b.id === bookingId);
    if (!b) return `Booking#${bookingId}`;
    const c = customers.find(c => c.id === b.customer_id);
    return c?.full_name || b.customer?.full_name || `KH#${b.customer_id}`;
  };
  const getCourtName = (bookingId) => {
    const b = bookings.find(b => b.id === bookingId);
    if (!b) return '—';
    const c = courts.find(c => c.id === b.court_id);
    return c?.name || b.court?.name || `Sân#${b.court_id}`;
  };
  /**
   * Tổng tiền đã thu của 1 booking = tổng payments đã 'paid'
   * (nếu chưa có payment nào mà booking có deposit_amount thì fallback sang deposit_amount)
   */
  const paidForBooking = (bookingId) => {
    const b = bookings.find(bk => bk.id === bookingId);
    const paymentsPaid = payments
      .filter(p => p.booking_id === bookingId && p.status === 'paid')
      .reduce((s, p) => s + p.amount, 0);
    if (paymentsPaid > 0) return paymentsPaid;
    return b?.deposit_amount || 0;
  };

  // ── "Booking còn nợ" ─────────────────────────────────
  // Tất cả booking chưa bị hủy, chưa thanh toán đủ
  const debtBookings = useMemo(() => {
    return bookings
      .filter(b => b.status !== 'cancelled')
      .map(b => {
        const paid       = paidForBooking(b.id);
        const total      = b.total_amount || 0;
        const outstanding = Math.max(0, total - paid);
        return { ...b, paid, outstanding };
      })
      .filter(b => b.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [bookings, payments]);

  // ── Chi tiết thanh toán tất cả booking ───────────────
  const allBookingDetails = useMemo(() => {
    return bookings.map(b => {
      const deposit    = b.deposit_amount || 0;
      const paid       = paidForBooking(b.id);
      const total      = b.total_amount || 0;
      const remaining  = Math.max(0, total - paid);
      const hasDeposit = deposit > 0;
      const isFullPaid = paid >= total && total > 0;
      const hasRefund  = payments.some(p => p.booking_id === b.id && p.status === 'refunded');
      return { ...b, deposit, paid, remaining, hasDeposit, isFullPaid, hasRefund };
    });
  }, [bookings, payments]);

  const filteredBookingDetails = useMemo(() => {
    return allBookingDetails.filter(b => {
      if (detailFilterStatus && b.status !== detailFilterStatus) return false;
      if (detailFilterDeposit === 'has_deposit'  && !b.hasDeposit)  return false;
      if (detailFilterDeposit === 'no_deposit'   && b.hasDeposit)   return false;
      if (detailFilterDeposit === 'paid_full'    && !b.isFullPaid)  return false;
      if (detailFilterDeposit === 'need_pay'     && (b.remaining === 0 || b.status === 'cancelled')) return false;
      return true;
    });
  }, [allBookingDetails, detailFilterDeposit, detailFilterStatus]);

  // ── Summary tổng (toàn bộ, không theo filter) ────────
  // Danh sách các booking đã hủy đang giữ cọc (chưa hoàn tiền và chưa chốt phạt cọc)
  const cancelledBookingsWithDeposit = useMemo(() => {
    return bookings.filter(b => {
      if (b.status !== 'cancelled' || !(b.deposit_amount > 0) || b.deposit_forfeited) return false;
      return !payments.some(p => p.booking_id === b.id && p.status === 'refunded');
    });
  }, [bookings, payments]);

  // Cọc giữ lại từ các booking đã hủy (chưa có giao dịch refunded và chưa chốt)
  const retainedDeposits = useMemo(() => {
    return cancelledBookingsWithDeposit.reduce((s, b) => s + (b.deposit_amount || 0), 0);
  }, [cancelledBookingsWithDeposit]);

  // Tổng thanh toán paid từ bảng payments
  const totalPaymentsPaid = useMemo(() => {
    return payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  }, [payments]);

  // Tổng cọc tất cả booking đã ghi nhận vào quỹ
  const totalAllDeposits = useMemo(() => {
    return bookings.reduce((s, b) => s + (b.deposit_amount || 0), 0);
  }, [bookings]);

  // Khoản cọc của các đơn cũ chưa sync payment
  const unrecordedDeposits = useMemo(() => {
    return bookings.reduce((sum, b) => {
      const hasPayment = payments.some(p => p.booking_id === b.id && p.status === 'paid');
      return (!hasPayment && b.deposit_amount > 0) ? sum + b.deposit_amount : sum;
    }, 0);
  }, [bookings, payments]);

  // Đã thu (tổng) = thanh toán paid (đã bao gồm cọc) + cọc cũ chưa sync
  const totalPaid = totalPaymentsPaid + unrecordedDeposits;

  // Đã hoàn trả (tổng) = các giao dịch refunded
  const totalRefunded = useMemo(() => {
    return payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);
  }, [payments]);

  // Thực thu = Đã thu − Hoàn trả
  const netRevenue = Math.max(0, totalPaid - totalRefunded);
  const totalOutstanding = debtBookings.reduce((s, b) => s + b.outstanding, 0);


  // ── Filter bảng giao dịch ────────────────────────────
  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (filterDate) {
        const payDate = p.paid_at ? p.paid_at.slice(0, 10) : null;
        if (payDate !== filterDate) return false;
      }
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterMethod && p.method !== filterMethod) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase().trim();
        const cust = (getCustomerName(p.booking_id) || '').toLowerCase();
        const court = (getCourtName(p.booking_id) || '').toLowerCase();
        const idMatch = String(p.id) === q || `#${p.id}` === q || String(p.booking_id) === q || `#${p.booking_id}` === q;
        if (!cust.includes(q) && !court.includes(q) && !idMatch) return false;
      }
      return true;
    });
  }, [payments, filterDate, filterStatus, filterMethod, debouncedSearch, bookings]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const paginatedDetails = useMemo(() => {
    const start = (detailPage - 1) * detailPageSize;
    return filteredBookingDetails.slice(start, start + detailPageSize);
  }, [filteredBookingDetails, detailPage, detailPageSize]);

  // ── Sổ quỹ tiền cọc & Phân tích xu hướng ───────────────────
  const depositLedger = useMemo(() => {
    return bookings
      .filter(b => (b.deposit_amount || 0) > 0)
      .map(b => {
        const dep = b.deposit_amount || 0;
        const refundPayment = payments.find(p => p.booking_id === b.id && p.status === 'refunded');
        const hasRefund = Boolean(refundPayment);
        
        let depositStatus = 'pending_active';
        let depositStatusLabel = 'Đang giữ (Chờ giờ chơi)';
        let depositBadgeColor = '#7C3AED';
        let depositBadgeBg = '#F5F3FF';
        let depositBadgeBorder = '#DDD6FE';

        if (b.status === 'completed') {
          depositStatus = 'completed';
          depositStatusLabel = 'Kết chuyển tiền sân';
          depositBadgeColor = '#15803D';
          depositBadgeBg = '#DCFCE7';
          depositBadgeBorder = '#BBF7D0';
        } else if (b.status === 'cancelled') {
          if (hasRefund) {
            depositStatus = 'refunded';
            depositStatusLabel = 'Đã hoàn trả khách';
            depositBadgeColor = '#1D4ED8';
            depositBadgeBg = '#DBEAFE';
            depositBadgeBorder = '#BFDBFE';
          } else if (b.deposit_forfeited) {
            depositStatus = 'forfeited';
            depositStatusLabel = 'Đã giữ lại (Phạt hủy)';
            depositBadgeColor = '#B45309';
            depositBadgeBg = '#FEF3C7';
            depositBadgeBorder = '#FDE68A';
          } else {
            depositStatus = 'pending_decision';
            depositStatusLabel = 'Đang giữ (Chờ xử lý)';
            depositBadgeColor = '#D97706';
            depositBadgeBg = '#FFFBEB';
            depositBadgeBorder = '#FCD34D';
          }
        }

        return {
          ...b,
          deposit: dep,
          hasRefund,
          refundPayment,
          depositStatus,
          depositStatusLabel,
          depositBadgeColor,
          depositBadgeBg,
          depositBadgeBorder,
          createdDate: b.created_at ? b.created_at.slice(0, 10) : '',
        };
      })
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [bookings, payments]);

  const depositStats = useMemo(() => {
    let totalAmount = 0;
    let completedAmount = 0;
    let refundedAmount = 0;
    let forfeitedAmount = 0;
    let pendingDecisionAmount = 0;
    let activePendingAmount = 0;

    let completedCount = 0;
    let refundedCount = 0;
    let forfeitedCount = 0;
    let pendingDecisionCount = 0;
    let activePendingCount = 0;

    depositLedger.forEach(item => {
      totalAmount += item.deposit;
      if (item.depositStatus === 'completed') {
        completedAmount += item.deposit;
        completedCount++;
      } else if (item.depositStatus === 'refunded') {
        refundedAmount += item.deposit;
        refundedCount++;
      } else if (item.depositStatus === 'forfeited') {
        forfeitedAmount += item.deposit;
        forfeitedCount++;
      } else if (item.depositStatus === 'pending_decision') {
        pendingDecisionAmount += item.deposit;
        pendingDecisionCount++;
      } else {
        activePendingAmount += item.deposit;
        activePendingCount++;
      }
    });

    return {
      totalAmount,
      totalCount: depositLedger.length,
      completedAmount,
      completedCount,
      refundedAmount,
      refundedCount,
      forfeitedAmount,
      forfeitedCount,
      pendingDecisionAmount,
      pendingDecisionCount,
      activePendingAmount,
      activePendingCount,
      completedRate: totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0,
      refundedRate: totalAmount > 0 ? Math.round((refundedAmount / totalAmount) * 100) : 0,
      forfeitedRate: totalAmount > 0 ? Math.round((forfeitedAmount / totalAmount) * 100) : 0,
      pendingRate: totalAmount > 0 ? Math.round(((pendingDecisionAmount + activePendingAmount) / totalAmount) * 100) : 0,
    };
  }, [depositLedger]);

  const depositCategoryData = useMemo(() => {
    return [
      { name: 'Đã hoàn trả', amount: depositStats.refundedAmount, count: depositStats.refundedCount, color: '#3B82F6' },
      { name: 'Đã giữ lại (phạt)', amount: depositStats.forfeitedAmount, count: depositStats.forfeitedCount, color: '#F59E0B' },
      { name: 'Kết chuyển sân', amount: depositStats.completedAmount, count: depositStats.completedCount, color: '#10B981' },
      ...(depositStats.pendingDecisionAmount > 0 ? [{ name: 'Chờ xử lý', amount: depositStats.pendingDecisionAmount, count: depositStats.pendingDecisionCount, color: '#EF4444' }] : []),
    ];
  }, [depositStats]);

  const filteredDepositLedger = useMemo(() => {
    return depositLedger.filter(item => {
      if (depositFilterStatus && item.depositStatus !== depositFilterStatus) return false;
      if (debouncedDepositSearch) {
        const q = debouncedDepositSearch.toLowerCase().trim();
        const cust = (getCustomerName(item.id) || '').toLowerCase();
        const court = (getCourtName(item.id) || '').toLowerCase();
        const idMatch = String(item.id) === q || `#${item.id}` === q;
        if (!cust.includes(q) && !court.includes(q) && !idMatch) return false;
      }
      return true;
    });
  }, [depositLedger, depositFilterStatus, debouncedDepositSearch, customers, courts]);

  const paginatedDepositLedger = useMemo(() => {
    const start = (depositPage - 1) * depositPageSize;
    return filteredDepositLedger.slice(start, start + depositPageSize);
  }, [filteredDepositLedger, depositPage, depositPageSize]);

  const hasFilter = Boolean(filterDate || filterStatus || filterMethod || debouncedSearch);
  const clearFilters = () => { 
    setFilterDate(''); 
    setFilterStatus(''); 
    setFilterMethod(''); 
    setSearch('');
    setCurrentPage(1);
  };

  // ── Filtered summary (theo filter) ───────────────────
  const fPaid     = filtered.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const fRefunded = filtered.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);

  // ── Handlers ─────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.booking_id) return;
    const b = bookings.find(x => x.id === parseInt(form.booking_id));

    // Chặn thu thêm nếu booking đã đủ tiền
    if (b && form.status === 'paid') {
      if (b.status === 'cancelled') {
        showToast({ type: 'warning', message: 'Không thể thu tiền cho đơn đã hủy. Bạn chỉ có thể tạo giao dịch hoàn tiền.' });
        return;
      }
      const paid = paidForBooking(parseInt(form.booking_id));
      if (paid >= (b.total_amount || 0)) {
        showToast({ type: 'warning', message: `Booking #${b.id} (${getCustomerName(b.id)}) đã thanh toán đủ ${b.total_amount?.toLocaleString()}đ rồi!` });
        return;
      }
      const remaining = Math.max(0, (b.total_amount || 0) - paid);
      if (parseFloat(form.amount) > remaining) {
        showToast({ type: 'warning', message: `Số tiền nhập (${parseFloat(form.amount).toLocaleString()}đ) vượt quá số tiền còn thiếu (${remaining.toLocaleString()}đ)!` });
        return;
      }
    }

    // Chặn hoàn tiền vượt quá số tiền khách đã thực trả
    if (b && form.status === 'refunded') {
      const paid = paidForBooking(parseInt(form.booking_id));
      const refunded = payments.filter(p => p.booking_id === parseInt(form.booking_id) && p.status === 'refunded').reduce((s, p) => s + p.amount, 0);
      const maxRefundable = Math.max(0, paid - refunded);
      if (parseFloat(form.amount) > maxRefundable) {
        showToast({ type: 'warning', message: `Số tiền hoàn (${parseFloat(form.amount).toLocaleString()}đ) vượt quá số tiền tối đa có thể hoàn (${maxRefundable.toLocaleString()}đ)!` });
        return;
      }
    }

    try {
      await paymentsAPI.create({
        booking_id: parseInt(form.booking_id),
        amount:     parseFloat(form.amount),
        method:     form.method,
        status:     form.status,
        paid_at:    (form.status === 'paid' || form.status === 'refunded') ? new Date().toISOString() : null,
      });
      showToast({ type: 'success', message: form.status === 'refunded' ? 'Đã ghi nhận hoàn tiền thành công' : 'Tạo giao dịch thành công' });
      setShowModal(false);
      fetchAll();
      bookingsAPI.getAll({}).then(setBookings).catch(() => {});
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
    }
  };

  const handleForfeitDeposit = async (bookingId) => {
    try {
      await bookingsAPI.forfeitDeposit(bookingId);
      showToast({ type: 'success', message: `Đã chốt giữ cọc cho đơn #${bookingId} vào doanh thu!` });
      fetchAll();
      bookingsAPI.getAll({}).then(setBookings).catch(() => {});
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
    }
  };

  const handleDelete = (id) => {
    setPaymentToDelete(id);
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    setActionLoading(true);
    try {
      await paymentsAPI.delete(paymentToDelete);
      showToast({ type: 'success', message: 'Đã xóa giao dịch thành công' });
      setPaymentToDelete(null);
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Không thể xóa giao dịch' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = (id) => {
    setPaymentToRefund(id);
  };

  const confirmRefundPayment = async () => {
    if (!paymentToRefund) return;
    setActionLoading(true);
    try {
      await paymentsAPI.update(paymentToRefund, { status: 'refunded' });
      showToast({ type: 'success', message: 'Đã ghi nhận hoàn tiền thành công' });
      setPaymentToRefund(null);
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
    } finally {
      setActionLoading(false);
    }
  };

  const openPayModal = (booking) => {
    const paid    = paidForBooking(booking.id);
    const missing = Math.max(0, (booking.total_amount || 0) - paid);
    setForm({ booking_id: String(booking.id), amount: missing || '', method: 'cash', status: 'paid' });
    setShowModal(true);
  };

  const openRefundForCancelled = (booking) => {
    setForm({
      booking_id: String(booking.id),
      amount: booking.deposit_amount || '',
      method: 'cash',
      status: 'refunded',
    });
    setShowModal(true);
  };

  // Danh sách booking trong dropdown (gồm booking chưa hủy + booking đã hủy còn cọc)
  const selectableBookings = useMemo(() => {
    return bookings.map(b => {
      const isCancelled = b.status === 'cancelled';
      const hasRefund = payments.some(p => p.booking_id === b.id && p.status === 'refunded');
      const refundPayment = payments.find(p => p.booking_id === b.id && p.status === 'refunded');
      const dep = (b.deposit_amount && b.deposit_amount > 0) ? b.deposit_amount : (refundPayment?.amount || 0);
      let tag = '';
      if (isCancelled) {
        tag = hasRefund
          ? ' [Đã hủy - Đã hoàn cọc]'
          : (b.deposit_forfeited
              ? ` [Đã hủy - Đã giữ cọc: ${dep.toLocaleString()}đ]`
              : (dep > 0 ? ` [Đã hủy - Cọc giữ lại: ${dep.toLocaleString()}đ]` : ' [Đã hủy]'));
      }
      return {
        value: b.id,
        label: `#${b.id} | ${getCustomerName(b.id)} | ${getCourtName(b.id)} | ${(b.total_amount || 0).toLocaleString()}đ${tag}`,
        isCancelled,
        dep,
        hasRefund,
      };
    });
  }, [bookings, payments]);

  // ── Table columns ────────────────────────────────────
  const columns = [
    { key: 'id',          label: '#',           width: '60px',  render: v => `#${v}` },
    { key: 'booking_id',  label: 'Booking',     width: '80px',  render: v => `#${v}` },
    { key: 'bk_customer', label: 'Khách hàng',                  render: (_, r) => getCustomerName(r.booking_id) },
    { key: 'bk_court',    label: 'Sân',                         render: (_, r) => getCourtName(r.booking_id) },
    { key: '_deposit_info', label: 'Cọc',
      render: (_, r) => {
        const b = bookings.find(bk => bk.id === r.booking_id);
        const dep = b?.deposit_amount || 0;
        if (dep > 0) {
          return (
            <span style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#B45309',
              border: '1px solid #FDE68A', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
              <Lock size={11} /> {dep.toLocaleString()}đ
            </span>
          );
        }
        return <span style={{ fontSize: '0.75rem', color: '#64748B' }}>—</span>;
      }
    },
    { key: 'amount',      label: 'Số tiền',     align: 'right',
      render: (v, r) => <strong style={{ color: r.status === 'refunded' ? '#2563EB' : '#059669' }}>{v?.toLocaleString()}đ</strong> },
    { key: 'method',      label: 'Phương thức',                 render: v => METHOD_MAP[v] || v },
    { key: 'paid_at',     label: 'Thời gian',                   render: v => formatVNDateTime(v) },
    { key: 'status',      label: 'Trạng thái',                  render: v => <Badge status={P_BADGE[v] || 'pending'} label={P_LABEL[v] || v} /> },
    { key: 'actions', label: '', align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
          {r.status === 'paid' && (
            <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={() => handleRefund(r.id)}>Hoàn tiền</Button>
          )}
          <button
            onClick={() => handleDelete(r.id)}
            title="Xóa giao dịch"
            style={{
              background: '#FFFFFF', border: '1px solid #FECACA',
              color: '#DC2626', borderRadius: 6, padding: '4px 8px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: 4, fontSize: '0.78rem', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
          >
            <Trash2 size={12} /> Xóa
          </button>
        </div>
      )
    },
  ];

  // ── Chi tiết booking columns ─────────────────────────
  const bookingDetailColumns = [
    { key: 'id',         label: 'Booking', width: '70px',  render: v => `#${v}` },
    { key: '_customer',  label: 'Khách hàng',              render: (_, r) => getCustomerName(r.id) },
    { key: '_court',     label: 'Sân',                     render: (_, r) => getCourtName(r.id) },
    { key: 'status',     label: 'Đơn hàng',
      render: v => {
        const cfg = {
          confirmed:  { color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0', icon: CheckCircle, label: 'Xác nhận' },
          pending:    { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: Clock, label: 'Chờ xử lý' },
          cancelled:  { color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA', icon: XCircle, label: 'Đã hủy' },
        }[v] || { color: '#475569', bg: '#F1F5F9', border: '#E2E8F0', icon: Info, label: v };
        const IconComp = cfg.icon;
        return (
          <span style={{ fontSize: '0.75rem', background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border}`, borderRadius: 6, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
            <IconComp size={11} /> {cfg.label}
          </span>
        );
      }
    },
    { key: 'total_amount', label: 'Tổng tiền', align: 'right', render: v => `${(v||0).toLocaleString()}đ` },
    { key: 'deposit',    label: 'Tiền cọc', align: 'right',
      render: (v, r) => {
        if (!v || v === 0) return <span style={{ color: '#64748B', fontSize: '0.82rem' }}>Chưa cọc</span>;
        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{ background: '#FEF3C7', color: '#B45309',
              border: '1px solid #FDE68A', borderRadius: 6,
              padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Lock size={11} /> {v.toLocaleString()}đ
            </span>
            {r.hasRefund && (
              <div style={{ fontSize: '0.7rem', color: '#2563EB', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                <RefreshCw size={10} /> Đã hoàn
              </div>
            )}
            {r.status === 'cancelled' && r.deposit_forfeited && !r.hasRefund && (
              <div style={{ fontSize: '0.7rem', color: '#B45309', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                <Lock size={10} /> Đã giữ cọc
              </div>
            )}
          </div>
        );
      }
    },
    { key: 'paid',       label: 'Đã thu tổng', align: 'right',
      render: (v, r) => {
        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>{(v || 0).toLocaleString()}đ</span>
            {r.status === 'cancelled' && r.deposit > 0 && !r.hasRefund && (
              <div style={{ fontSize: '0.7rem', color: '#B45309', marginTop: 1 }}>
                ({r.deposit_forfeited ? 'cọc đã giữ' : 'cọc giữ lại'})
              </div>
            )}
          </div>
        );
      }
    },
    { key: 'remaining',  label: 'Còn thiếu', align: 'right',
      render: (v, r) => {
        if (r.status === 'cancelled') {
          return <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Đã hủy</span>;
        }
        if (v === 0) {
          return (
            <span style={{ background: '#DCFCE7', color: '#15803D',
              border: '1px solid #BBF7D0', borderRadius: 6,
              padding: '2px 8px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle size={11} /> Đủ tiền
            </span>
          );
        }
        return <strong style={{ color: '#D97706' }}>{v.toLocaleString()}đ</strong>;
      }
    },
    { key: '_action',    label: '', align: 'right',
      render: (_, r) => {
        if (r.status === 'cancelled') {
          if (r.deposit > 0) {
            if (r.hasRefund) {
              return (
                <span style={{ fontSize: '0.75rem', color: '#1D4ED8', background: '#DBEAFE', border: '1px solid #BFDBFE', borderRadius: 6, padding: '3px 8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={11} /> Đã hoàn cọc
                </span>
              );
            }
            if (r.deposit_forfeited) {
              return (
                <span style={{ fontSize: '0.75rem', color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '3px 8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={11} /> Đã giữ cọc
                </span>
              );
            }
            return (
              <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />}
                  style={{ borderColor: '#BAE6FD', color: '#0284C7', background: '#F0F9FF', fontSize: '0.75rem' }}
                  onClick={() => openRefundForCancelled(r)}>
                  Hoàn cọc
                </Button>
                <Button variant="secondary" size="sm" icon={<Lock size={12} />}
                  style={{ borderColor: '#FDE68A', color: '#B45309', background: '#FEF3C7', fontSize: '0.75rem' }}
                  onClick={() => handleForfeitDeposit(r.id)}
                  title="Chốt giữ cọc vào doanh thu sân">
                  Giữ cọc
                </Button>
              </div>
            );
          }
          return null;
        }
        if (r.remaining > 0) {
          return (
            <Button variant="primary" size="sm" icon={<CreditCard size={12} />} onClick={() => openPayModal(r)}>
              Thu tiền
            </Button>
          );
        }
        return (
          <span style={{ fontSize: '0.75rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
            <CheckCircle size={12} /> Hoàn tất
          </span>
        );
      }
    },
  ];

  // ── Debt table columns ───────────────────────────────
  const debtColumns = [
    { key: 'id',          label: 'Booking', width: '80px',   render: v => `#${v}` },
    { key: '_customer',   label: 'Khách hàng',               render: (_, r) => getCustomerName(r.id) },
    { key: '_court',      label: 'Sân',                      render: (_, r) => getCourtName(r.id) },
    { key: 'status',      label: 'Trạng thái',               render: v => <Badge status={v === 'confirmed' ? 'confirmed' : 'pending'} label={v === 'confirmed' ? 'Xác nhận' : 'Chờ xử lý'} /> },
    { key: 'total_amount',label: 'Tổng tiền',  align: 'right', render: v => `${(v || 0).toLocaleString()}đ` },
    { key: 'paid',        label: 'Đã thu',     align: 'right',
      render: (v, r) => {
        const deposit = r.deposit_amount || 0;
        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>{(v || 0).toLocaleString()}đ</span>
            {deposit > 0 && (
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 1 }}>
                (đã gồm cọc {deposit.toLocaleString()}đ)
              </div>
            )}
          </div>
        );
      }
    },
    { key: 'outstanding', label: 'Còn thiếu',  align: 'right',
      render: v => <strong style={{ color: '#D97706', fontSize: '0.95rem' }}>{v.toLocaleString()}đ</strong> },
    { key: '_action',     label: '', align: 'right',
      render: (_, r) => (
        <Button variant="primary" size="sm" icon={<CreditCard size={12} />} onClick={() => openPayModal(r)}>
          Thu tiền
        </Button>
      )},
  ];

  // ── Deposit columns ──────────────────────────────────
  const depositColumns = [
    { key: 'id', label: 'Booking', width: '85px', render: v => <strong style={{ color: '#0F172A' }}>#{v}</strong> },
    { key: '_customer', label: 'Khách hàng', render: (_, r) => getCustomerName(r.id) },
    { key: '_court', label: 'Sân', render: (_, r) => getCourtName(r.id) },
    { key: 'total_amount', label: 'Tổng tiền đơn', align: 'right', render: v => `${(v || 0).toLocaleString()}đ` },
    { key: 'deposit', label: 'Tiền cọc', align: 'right',
      render: v => (
        <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A',
          borderRadius: 6, padding: '2px 8px', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Lock size={11} /> {v.toLocaleString()}đ
        </span>
      )
    },
    { key: 'created_at', label: 'Ngày cọc', render: v => formatVNDateTime(v) },
    { key: 'depositStatus', label: 'Trạng thái cọc',
      render: (_, r) => (
        <span style={{
          background: r.depositBadgeBg, color: r.depositBadgeColor, border: `1px solid ${r.depositBadgeBorder}`,
          borderRadius: 6, padding: '3px 9px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
        }}>
          {r.depositStatus === 'completed' && <CheckCircle size={12} />}
          {r.depositStatus === 'refunded' && <RefreshCw size={12} />}
          {r.depositStatus === 'forfeited' && <Lock size={12} />}
          {r.depositStatus === 'pending_decision' && <AlertCircle size={12} />}
          {r.depositStatus === 'pending_active' && <Clock size={12} />}
          {r.depositStatusLabel}
        </span>
      )
    },
    { key: '_actions', label: '', align: 'right',
      render: (_, r) => {
        if (r.depositStatus === 'pending_decision') {
          return (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" icon={<RefreshCw size={11} />}
                style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#DBEAFE', color: '#1D4ED8', borderColor: '#BFDBFE' }}
                onClick={() => openRefundForCancelled(r)}>
                Hoàn cọc
              </Button>
              <Button variant="secondary" size="sm" icon={<Lock size={11} />}
                style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#FEF3C7', color: '#B45309', borderColor: '#FDE68A' }}
                onClick={() => handleForfeitDeposit(r.id)}>
                Chốt cọc
              </Button>
            </div>
          );
        }
        if (r.depositStatus === 'refunded') {
          return (
            <span style={{ fontSize: '0.75rem', color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
              <RefreshCw size={11} /> Đã hoàn
            </span>
          );
        }
        if (r.depositStatus === 'forfeited') {
          return (
            <span style={{ fontSize: '0.75rem', color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
              <Lock size={11} /> Đã giữ
            </span>
          );
        }
        return (
          <span style={{ fontSize: '0.75rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
            <CheckCircle size={11} /> Đã kết chuyển
          </span>
        );
      }
    }
  ];


  return (
    <div style={{ maxWidth: 1200 }}>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Thanh toán & Đặt cọc</h1>
          <p className="page-subtitle">Theo dõi thu tiền và đặt cọc cho các lịch đặt sân</p>
        </div>
        <Button variant="primary" icon={<CreditCard size={15} />}
          onClick={() => { setForm({ booking_id: '', amount: '', method: 'cash', status: 'paid' }); setShowModal(true); }}>
          Tạo giao dịch
        </Button>
      </div>

      {/* ── Tabs ── */}
      {(() => {
        const tabStyle = (active) => ({
          padding: '0.5rem 1.25rem',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: active ? '#ECFDF5' : 'transparent',
          color:      active ? '#059669' : '#64748B',
          borderBottom: active ? '2px solid #10B981' : '2px solid transparent',
        });
        return (
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem',
            borderBottom: '1px solid #E2E8F0', paddingBottom: '0.125rem' }}>
            <button style={tabStyle(activeTab === 'transactions')} onClick={() => setActiveTab('transactions')}>
              <List size={14} /> Lịch sử giao dịch
            </button>
            <button style={tabStyle(activeTab === 'detail')} onClick={() => setActiveTab('detail')}>
              <Info size={14} /> Chi tiết thanh toán đơn
              {allBookingDetails.filter(b => b.remaining > 0 && b.status !== 'cancelled').length > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', borderRadius: 999,
                  padding: '0 6px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {allBookingDetails.filter(b => b.remaining > 0 && b.status !== 'cancelled').length}
                </span>
              )}
            </button>
            <button style={tabStyle(activeTab === 'deposits')} onClick={() => setActiveTab('deposits')}>
              <ShieldCheck size={14} /> Sổ quỹ & Xu hướng tiền cọc
              <span style={{ background: '#F59E0B', color: '#fff', borderRadius: 999,
                padding: '0 6px', fontSize: '0.7rem', fontWeight: 700 }}>
                {depositLedger.length}
              </span>
            </button>
          </div>
        );
      })()}

      {/* ── Summary cards (chỉ hiển thị ở tab Giao dịch & Chi tiết đơn, ẩn ở mục đặt cọc) ── */}
      {activeTab !== 'deposits' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Đã thu */}
        <Card padding="md" style={{ borderTop: '3px solid #10B981' }}>
          <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <CheckCircle size={14} style={{ color: '#10B981' }} /> Đã thu (tổng)
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{totalPaid.toLocaleString()}đ</p>
          <div style={{ marginTop: 4 }}>
            <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '2px 0 0' }}>
              Dòng tiền từ {payments.filter(p => p.status === 'paid').length} giao dịch đã thanh toán
            </p>
            {retainedDeposits > 0 && (
              <p style={{ fontSize: '0.74rem', color: '#B45309', fontWeight: 600, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}
                 title="Tiền cọc của các đơn đã hủy được giữ lại (chưa hoàn trả)">
                <ShieldCheck size={13} /> Cọc giữ lại (đơn hủy): {retainedDeposits.toLocaleString()}đ
              </p>
            )}
          </div>
          {hasFilter && <p style={{ fontSize: '0.75rem', color: '#059669', opacity: 0.9, margin: '4px 0 0', fontWeight: 500 }}>Theo filter: {fPaid.toLocaleString()}đ</p>}
        </Card>

        {/* Còn nợ — TÍNH ĐÚNG từ booking */}
        <Card padding="md" style={{ borderTop: '3px solid #F59E0B' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                <AlertCircle size={14} style={{ color: '#F59E0B' }} />
                Chưa thu đủ ({debtBookings.length} booking)
              </p>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#D97706', margin: 0 }}>{totalOutstanding.toLocaleString()}đ</p>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '2px 0 0' }}>
                = Tổng tiền booking − Đã thu
              </p>
            </div>
            {debtBookings.length > 0 && (
              <button onClick={() => setShowDebtList(v => !v)}
                style={{ background: '#FEF3C7', border: '1px solid #FDE68A',
                         color: '#B45309', borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
                         fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, fontWeight: 600 }}>
                {showDebtList ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showDebtList ? 'Ẩn' : 'Xem'}
              </button>
            )}
          </div>
        </Card>

        {/* Đã hoàn trả */}
        <Card padding="md" style={{ borderTop: '3px solid #3B82F6' }}>
          <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <RefreshCw size={14} style={{ color: '#3B82F6' }} /> Đã hoàn trả (tổng)
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2563EB', margin: 0 }}>{totalRefunded.toLocaleString()}đ</p>
          <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '2px 0 0' }}>
            Bao gồm hoàn cọc và hoàn thanh toán
          </p>
          {hasFilter && <p style={{ fontSize: '0.75rem', color: '#2563EB', opacity: 0.9, margin: '4px 0 0', fontWeight: 500 }}>Theo filter: {fRefunded.toLocaleString()}đ</p>}
        </Card>

        {/* Thực thu = Đã thu − Hoàn trả */}
        <Card padding="md" style={{ borderTop: '3px solid #8B5CF6',
          background: 'linear-gradient(135deg, #FAF5FF, #FFFFFF)' }}>
          <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <Wallet size={14} style={{ color: '#8B5CF6' }} /> Thực thu (sau hoàn trả)
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#7C3AED', margin: 0 }}>
            {netRevenue.toLocaleString()}đ
          </p>
          <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '2px 0 0' }}>
            = {totalPaid.toLocaleString()} − {totalRefunded.toLocaleString()}
          </p>
        </Card>
      </div>
      )}

      {/* ── Banner: Các đơn hủy đang giữ cọc (cho phép người quản lý hoàn tiền cọc bất cứ lúc nào) ── */}
      {activeTab !== 'deposits' && cancelledBookingsWithDeposit.length > 0 && (
        <Card padding="md" style={{ marginBottom: '1.5rem', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={24} style={{ color: '#D97706', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#92400E', fontSize: '0.9rem' }}>
                  Có {cancelledBookingsWithDeposit.length} đơn đã hủy đang giữ lại cọc (Tổng: {retainedDeposits.toLocaleString()}đ)
                </strong>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#B45309' }}>
                  Tùy lý do, người quản lý giao dịch có quyền hoàn lại cọc cho khách bất cứ lúc nào.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {cancelledBookingsWithDeposit.map(cb => (
                <div key={cb.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '2px 6px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw size={12} />}
                    style={{ color: '#92400E', fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => openRefundForCancelled(cb)}
                    title="Hoàn trả tiền cọc cho khách"
                  >
                    Hoàn cọc #{cb.id} ({(cb.deposit_amount || 0).toLocaleString()}đ)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: '#B45309', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.4rem', borderLeft: '1px solid #FDE68A' }}
                    onClick={() => handleForfeitDeposit(cb.id)}
                    title="Chốt phạt cọc và đóng hồ sơ"
                  >
                    Chốt cọc
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ── Danh sách booking còn nợ ── */}
      {activeTab !== 'deposits' && debtBookings.length > 0 && showDebtList && (
        <Card padding="none" style={{ marginBottom: '1.5rem', border: '1px solid #FDE68A' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #FEF3C7', background: '#FFFBEB',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} style={{ color: '#D97706' }} />
              <span style={{ fontWeight: 600, color: '#92400E', fontSize: '0.9rem' }}>
                Booking chưa thanh toán đủ
              </span>
              <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A',
                             borderRadius: 999, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                {debtBookings.length}
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#78350F' }}>
              Tổng còn thiếu: <strong style={{ color: '#D97706' }}>{totalOutstanding.toLocaleString()}đ</strong>
            </span>
          </div>
          <Table columns={debtColumns} data={debtBookings} emptyText="Không có booking nào còn nợ" />
        </Card>
      )}

      {activeTab === 'transactions' && (
        <>
          {/* ── Filter bar ── */}
          <Card padding="md" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569',
                            fontSize: '0.82rem', fontWeight: 600, paddingBottom: 2, flexShrink: 0 }}>
                <Filter size={14} /> Lọc giao dịch
              </div>
              <div style={{ flex: '1 1 200px', minWidth: 180 }}>
                <Input 
                  label="Tìm kiếm" 
                  placeholder="Mã đơn, khách, sân..." 
                  value={search} 
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
                />
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 130 }}>
                <Input label="Theo ngày" type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }} />
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 130 }}>
                <Select label="Trạng thái" value={filterStatus} placeholder="Tất cả"
                  options={[{ value: 'paid', label: 'Đã thanh toán' }, { value: 'pending', label: 'Chờ thanh toán' }, { value: 'refunded', label: 'Đã hoàn tiền' }]}
                  onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} />
              </div>
              <div style={{ flex: '1 1 130px', minWidth: 120 }}>
                <Select label="Phương thức" value={filterMethod} placeholder="Tất cả"
                  options={[{ value: 'cash', label: 'Tiền mặt' }, { value: 'transfer', label: 'Chuyển khoản' }, { value: 'momo', label: 'MoMo' }]}
                  onChange={e => { setFilterMethod(e.target.value); setCurrentPage(1); }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingBottom: 1 }}>
                <Button variant={filterDate === todayVN() ? 'primary' : 'secondary'} size="sm"
                  icon={<Calendar size={13} />} onClick={() => { setFilterDate(filterDate === todayVN() ? '' : todayVN()); setCurrentPage(1); }}>
                  Hôm nay
                </Button>
                {hasFilter && <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={clearFilters}>Xoá lọc</Button>}
                <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={fetchAll}>Tải lại</Button>
              </div>
            </div>
            {hasFilter && (
              <div style={{ marginTop: '0.625rem', fontSize: '0.8rem', color: '#64748B',
                            borderTop: '1px solid #E2E8F0', paddingTop: '0.625rem' }}>
                Hiển thị <strong style={{ color: '#0F172A' }}>{filtered.length}</strong> / {payments.length} giao dịch
                {debouncedSearch && ` · Khớp với: "${debouncedSearch}"`}
              </div>
            )}
          </Card>

          {/* ── Lịch sử giao dịch ── */}
          <Card padding="none">
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>Lịch sử giao dịch</span>
            </div>
            <Table columns={columns} data={paginatedTransactions} loading={loading}
              emptyText={hasFilter ? 'Không có giao dịch nào khớp với bộ lọc' : 'Chưa có giao dịch nào'} />
            {filtered.length > 0 && (
              <div style={{ padding: '0.5rem 1.25rem' }}>
                <Pagination
                  currentPage={currentPage}
                  totalItems={filtered.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                />
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'detail' && (
        <>
          {/* ── Filter chi tiết ── */}
          <Card padding="md" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569',
                             fontSize: '0.82rem', fontWeight: 600, paddingBottom: 2, flexShrink: 0 }}>
                <Filter size={14} /> Lọc đơn
              </div>
              <div style={{ flex: '1 1 160px', minWidth: 150 }}>
                <Select label="Trạng thái cọc" value={detailFilterDeposit} placeholder="Tất cả"
                  options={[
                    { value: 'has_deposit',  label: 'Đã có cọc' },
                    { value: 'no_deposit',   label: 'Chưa cọc' },
                    { value: 'need_pay',     label: 'Còn thiếu tiền' },
                    { value: 'paid_full',    label: 'Đã thanh toán đủ' },
                  ]}
                  onChange={e => setDetailFilterDeposit(e.target.value)} />
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 130 }}>
                <Select label="Trạng thái đơn" value={detailFilterStatus} placeholder="Tất cả"
                  options={[
                    { value: 'confirmed', label: 'Xác nhận' },
                    { value: 'pending',   label: 'Chờ xử lý' },
                    { value: 'cancelled', label: 'Đã hủy' },
                  ]}
                  onChange={e => setDetailFilterStatus(e.target.value)} />
              </div>
              {(detailFilterDeposit || detailFilterStatus) && (
                <div style={{ paddingBottom: 1 }}>
                  <Button variant="ghost" size="sm" icon={<X size={13} />}
                    onClick={() => { setDetailFilterDeposit(''); setDetailFilterStatus(''); }}>
                    Xoá lọc
                  </Button>
                </div>
              )}
            </div>
            {(detailFilterDeposit || detailFilterStatus) && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748B',
                            borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem' }}>
                Hiển thị <strong style={{ color: '#0F172A' }}>{filteredBookingDetails.length}</strong> / {allBookingDetails.length} đơn
              </div>
            )}
          </Card>

          {/* Gợi ý nhanh */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[
              { label: 'Có cọc', value: 'has_deposit',  color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
              { label: 'Chưa cọc', value: 'no_deposit', color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' },
              { label: 'Còn thiếu', value: 'need_pay',  color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA' },
              { label: 'Đủ tiền', value: 'paid_full',   color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0' },
            ].map(chip => (
              <button key={chip.value}
                onClick={() => setDetailFilterDeposit(detailFilterDeposit === chip.value ? '' : chip.value)}
                style={{
                  padding: '4px 14px', borderRadius: 999, border: `1px solid ${detailFilterDeposit === chip.value ? chip.color : chip.border}`,
                  background: detailFilterDeposit === chip.value ? chip.bg : '#FFFFFF',
                  color: detailFilterDeposit === chip.value ? chip.color : '#64748B',
                  fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s', fontWeight: 600,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                {chip.label}
              </button>
            ))}
          </div>

          {/* ── Bảng chi tiết ── */}
          <Card padding="none">
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #E2E8F0',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>
                Chi tiết thanh toán theo từng đơn đặt sân
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {filteredBookingDetails.filter(b => b.remaining > 0 && b.status !== 'cancelled').length} đơn cần thu thêm
              </span>
            </div>
            <Table columns={bookingDetailColumns} data={paginatedDetails} loading={loading}
              emptyText="Không có đơn nào phù hợp với bộ lọc" />
            {filteredBookingDetails.length > 0 && (
              <div style={{ padding: '0.5rem 1.25rem' }}>
                <Pagination
                  currentPage={detailPage}
                  totalItems={filteredBookingDetails.length}
                  pageSize={detailPageSize}
                  onPageChange={setDetailPage}
                  onPageSizeChange={(sz) => { setDetailPageSize(sz); setDetailPage(1); }}
                />
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── TAB 3: Sổ quỹ & Xu hướng tiền cọc ── */}
      {activeTab === 'deposits' && (
        <>
          {/* ── 4 KPI Cards for Deposit ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <Card padding="md" style={{ borderTop: '3px solid #6366F1' }}>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                <Shield size={14} style={{ color: '#6366F1' }} /> Tổng cọc phát sinh
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {depositStats.totalAmount.toLocaleString()}đ
              </p>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '4px 0 0' }}>
                Từ {depositStats.totalCount} đơn đặt sân có cọc
              </p>
            </Card>

            <Card padding="md" style={{ borderTop: '3px solid #3B82F6' }}>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                <RefreshCw size={14} style={{ color: '#3B82F6' }} /> Cọc đã hoàn trả
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563EB', margin: 0 }}>
                {depositStats.refundedAmount.toLocaleString()}đ
              </p>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '4px 0 0' }}>
                {depositStats.refundedCount} đơn hủy đã hoàn lại khách ({depositStats.refundedRate}%)
              </p>
            </Card>

            <Card padding="md" style={{ borderTop: '3px solid #F59E0B' }}>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                <Lock size={14} style={{ color: '#F59E0B' }} /> Cọc đã giữ lại (phạt)
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D97706', margin: 0 }}>
                {depositStats.forfeitedAmount.toLocaleString()}đ
              </p>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '4px 0 0' }}>
                {depositStats.forfeitedCount} đơn hủy phạt cọc ({depositStats.forfeitedRate}%)
              </p>
            </Card>

            <Card padding="md" style={{ borderTop: '3px solid #10B981' }}>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                <CheckCircle size={14} style={{ color: '#10B981' }} /> Kết chuyển tiền sân
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', margin: 0 }}>
                {depositStats.completedAmount.toLocaleString()}đ
              </p>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '4px 0 0' }}>
                {depositStats.completedCount} đơn chơi thành công ({depositStats.completedRate}%)
              </p>
            </Card>
          </div>

          {/* ── Visual Ratio Bar & Chart Grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <Card padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={15} style={{ color: '#059669' }} /> Cơ cấu phân bổ tiền cọc
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Tổng quỹ: <strong style={{ color: '#0F172A' }}>{depositStats.totalAmount.toLocaleString()}đ</strong>
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 14, borderRadius: 7, overflow: 'hidden', display: 'flex', background: '#F1F5F9', marginBottom: '1rem' }}>
                <div style={{ width: `${depositStats.completedRate}%`, background: '#10B981', transition: 'width 0.4s' }}
                     title={`Kết chuyển sân: ${depositStats.completedAmount.toLocaleString()}đ (${depositStats.completedRate}%)`} />
                <div style={{ width: `${depositStats.refundedRate}%`, background: '#3B82F6', transition: 'width 0.4s' }}
                     title={`Đã hoàn trả: ${depositStats.refundedAmount.toLocaleString()}đ (${depositStats.refundedRate}%)`} />
                <div style={{ width: `${depositStats.forfeitedRate}%`, background: '#F59E0B', transition: 'width 0.4s' }}
                     title={`Đã giữ lại phạt: ${depositStats.forfeitedAmount.toLocaleString()}đ (${depositStats.forfeitedRate}%)`} />
                {depositStats.pendingRate > 0 && (
                  <div style={{ width: `${depositStats.pendingRate}%`, background: '#EF4444', transition: 'width 0.4s' }}
                       title={`Chờ xử lý: ${depositStats.pendingDecisionAmount.toLocaleString()}đ (${depositStats.pendingRate}%)`} />
                )}
              </div>

              {/* Legend rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                    <span style={{ color: '#475569' }}>Cọc kết chuyển doanh thu sân (đơn đã chơi):</span>
                  </span>
                  <strong style={{ color: '#059669' }}>{depositStats.completedAmount.toLocaleString()}đ ({depositStats.completedRate}%)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #F1F5F9' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B82F6' }} />
                    <span style={{ color: '#475569' }}>Cọc đã hoàn trả lại cho khách (đơn hủy):</span>
                  </span>
                  <strong style={{ color: '#2563EB' }}>{depositStats.refundedAmount.toLocaleString()}đ ({depositStats.refundedRate}%)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                    <span style={{ color: '#475569' }}>Cọc thu phạt giữ lại quỹ (đơn hủy trễ/mất cọc):</span>
                  </span>
                  <strong style={{ color: '#D97706' }}>{depositStats.forfeitedAmount.toLocaleString()}đ ({depositStats.forfeitedRate}%)</strong>
                </div>
              </div>
            </Card>

            {/* Biểu đồ Recharts */}
            <Card padding="md">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart2 size={15} style={{ color: '#6366F1' }} /> So sánh số tiền cọc theo nhóm
              </h3>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={depositCategoryData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={v => `${v/1000}k`} />
                    <ChartTooltip formatter={v => [`${v.toLocaleString()}đ`, 'Số tiền']} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {depositCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ── Filter bar cho Sổ quỹ cọc ── */}
          <Card padding="md" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569',
                            fontSize: '0.82rem', fontWeight: 600, paddingBottom: 2, flexShrink: 0 }}>
                <Filter size={14} /> Lọc quỹ cọc
              </div>
              <div style={{ flex: '1 1 200px', minWidth: 180 }}>
                <Input
                  label="Tìm kiếm"
                  placeholder="Mã đơn, tên khách, sân..."
                  value={depositSearch}
                  onChange={e => { setDepositSearch(e.target.value); setDepositPage(1); }}
                />
              </div>
              <div style={{ flex: '1 1 180px', minWidth: 160 }}>
                <Select
                  label="Trạng thái cọc"
                  value={depositFilterStatus}
                  placeholder="Tất cả trạng thái"
                  options={[
                    { value: 'completed', label: 'Kết chuyển tiền sân' },
                    { value: 'refunded', label: 'Đã hoàn trả khách' },
                    { value: 'forfeited', label: 'Đã giữ lại (Phạt)' },
                    { value: 'pending_decision', label: 'Chờ xử lý (Đơn hủy)' },
                  ]}
                  onChange={e => { setDepositFilterStatus(e.target.value); setDepositPage(1); }}
                />
              </div>
              {(depositSearch || depositFilterStatus) && (
                <div style={{ paddingBottom: 1 }}>
                  <Button variant="ghost" size="sm" icon={<X size={13} />}
                    onClick={() => { setDepositSearch(''); setDepositFilterStatus(''); setDepositPage(1); }}>
                    Xóa lọc
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* ── Bảng Sổ quỹ cọc ── */}
          <Card padding="none">
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #E2E8F0',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>
                Danh sách chi tiết các khoản tiền cọc
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Hiển thị <strong style={{ color: '#0F172A' }}>{filteredDepositLedger.length}</strong> / {depositLedger.length} đơn có cọc
              </span>
            </div>
            <Table columns={depositColumns} data={paginatedDepositLedger} emptyText="Không tìm thấy khoản tiền cọc nào" />
            {filteredDepositLedger.length > depositPageSize && (
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid #E2E8F0' }}>
                <Pagination
                  currentPage={depositPage}
                  totalItems={filteredDepositLedger.length}
                  pageSize={depositPageSize}
                  onPageChange={setDepositPage}
                  onPageSizeChange={s => { setDepositPageSize(s); setDepositPage(1); }}
                />
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── MODAL: Tạo giao dịch ── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Tạo giao dịch thanh toán"
        footer={
          (() => {
            const b = form.booking_id ? bookings.find(x => x.id === parseInt(form.booking_id)) : null;
            const isFullyPaid = b && paidForBooking(b.id) >= (b.total_amount || 0);
            const isCancelled = b && b.status === 'cancelled';
            const disableSubmit = !form.booking_id || !form.amount || (isCancelled && form.status === 'paid') || (isFullyPaid && form.status === 'paid');
            return (
              <>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button variant="primary" type="submit" form="payment-form" disabled={disableSubmit}>
                  Xác nhận giao dịch
                </Button>
              </>
            );
          })()
        }
      >
        <form id="payment-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <Select label="Đơn đặt sân" required value={form.booking_id} placeholder="-- Chọn đơn đặt sân --"
              options={selectableBookings}
              onChange={e => {
                const bId = e.target.value;
                if (!bId) {
                  setForm(p => ({ ...p, booking_id: '', amount: '' }));
                  return;
                }
                const b = bookings.find(x => x.id === parseInt(bId));
                if (b) {
                  if (b.status === 'cancelled') {
                    const dep = b.deposit_amount || 0;
                    setForm(p => ({
                      ...p,
                      booking_id: bId,
                      status: 'refunded',
                      amount: dep > 0 ? dep : '',
                    }));
                  } else {
                    const paid    = paidForBooking(parseInt(bId));
                    const missing = Math.max(0, b.total_amount - paid);
                    setForm(p => ({
                      ...p,
                      booking_id: bId,
                      status: 'paid',
                      amount: missing > 0 ? missing : '',
                    }));
                  }
                }
              }}
            />
            {form.booking_id && (() => {
              const b = bookings.find(x => x.id === parseInt(form.booking_id));
              if (!b) return null;

              if (b.status === 'cancelled') {
                const hasRefund = payments.some(p => p.booking_id === b.id && p.status === 'refunded');
                return (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Info size={18} style={{ color: '#0284C7', flexShrink: 0 }} />
                      <div>
                        <strong style={{ color: '#0369A1', fontSize: '0.88rem' }}>
                          Đơn đặt sân #{b.id} đã hủy
                        </strong>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#075985' }}>
                          {hasRefund
                            ? 'Đơn này đã được ghi nhận hoàn cọc trước đó.'
                            : (b.deposit_amount > 0
                              ? `Tiền cọc đang giữ lại: ${b.deposit_amount.toLocaleString()}đ. Bạn có thể tạo giao dịch hoàn tiền cọc cho khách.`
                              : 'Đơn này không có tiền cọc.')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              const paid  = paidForBooking(b.id);
              const total = b.total_amount || 0;
              const pct   = total > 0 ? Math.min(100, Math.round(paid / total * 100)) : 0;
              const done  = paid >= total;
              return (
                <div style={{ marginTop: '0.625rem' }}>
                  {/* Banner cảnh báo khi đã đủ tiền */}
                  {done && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: 10,
                      marginBottom: '0.625rem',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <CheckCircle size={20} style={{ color: '#16A34A', flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#15803D', fontSize: '0.9rem' }}>
                          Booking này đã thanh toán đủ!
                        </p>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534' }}>
                          {getCustomerName(b.id)} — {getCourtName(b.id)} đã nộp đủ {total.toLocaleString()}đ.
                          (Nếu có sự cố phát sinh, bạn vẫn có thể chọn loại giao dịch &quot;Hoàn tiền&quot;).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 5 }}>
                    <span style={{ color: '#64748B' }}>Đã thu: <strong style={{ color: done ? '#059669' : '#D97706' }}>{paid.toLocaleString()}đ</strong></span>
                    <span style={{ color: '#64748B' }}>Cần thu: <strong style={{ color: '#0F172A' }}>{total.toLocaleString()}đ</strong></span>
                  </div>
                  <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, transition: 'width 0.5s',
                      background: done ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#F59E0B,#D97706)' }} />
                  </div>
                  {!done && (
                    <p style={{ fontSize: '0.75rem', color: '#D97706', marginTop: 4, fontWeight: 500 }}>
                      Còn thiếu: {(total - paid).toLocaleString()}đ ({100 - pct}%)
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Form nhập giao dịch */}
          {(() => {
            const b = form.booking_id ? bookings.find(x => x.id === parseInt(form.booking_id)) : null;
            const isCancelled = b && b.status === 'cancelled';
            const isFullyPaid = b && !isCancelled && paidForBooking(b.id) >= (b.total_amount || 0);

            // Tùy chọn trạng thái giao dịch
            let statusOptions = [
              { value: 'paid', label: 'Thu tiền (Thanh toán)' },
              { value: 'pending', label: 'Ghi nhận tiền cọc' },
              { value: 'refunded', label: 'Hoàn tiền' }
            ];
            if (isCancelled) {
              statusOptions = [{ value: 'refunded', label: 'Hoàn tiền cọc / Hoàn trả' }];
            } else if (isFullyPaid) {
              statusOptions = [{ value: 'refunded', label: 'Hoàn tiền cho khách' }];
            }

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Select label="Loại giao dịch" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    options={statusOptions} />
                  <Select label="Phương thức" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}
                    options={[{ value: 'cash', label: 'Tiền mặt' }, { value: 'transfer', label: 'Chuyển khoản' }, { value: 'momo', label: 'MoMo' }]} />
                </div>
                <Input label="Số tiền (VNĐ)" type="number" required min={1} value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
              </>
            );
          })()}
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(paymentToDelete)}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={confirmDeletePayment}
        title="Xác nhận xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch thanh toán này? Thao tác này sẽ không thể hoàn tác."
        confirmText="Xóa giao dịch"
        confirmVariant="danger"
        isLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={Boolean(paymentToRefund)}
        onClose={() => setPaymentToRefund(null)}
        onConfirm={confirmRefundPayment}
        title="Xác nhận hoàn tiền"
        message="Bạn có chắc chắn muốn ghi nhận hoàn tiền cho giao dịch này không?"
        confirmText="Xác nhận hoàn tiền"
        confirmVariant="warning"
        isLoading={actionLoading}
      />
    </div>
  );
}
