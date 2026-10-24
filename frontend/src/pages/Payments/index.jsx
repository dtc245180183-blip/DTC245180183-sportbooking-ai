import { useState, useEffect, useMemo } from 'react';
import { paymentsAPI, bookingsAPI, customersAPI, courtsAPI } from '../../api';
import { CreditCard, RefreshCw, Calendar, Filter, X, AlertCircle, ChevronDown, ChevronUp, Trash2, List, Info, ShieldCheck, CheckCircle, Clock, XCircle, Lock, Wallet } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Select, Table } from '../../components/ui';
import { formatVNDateTime, todayVN } from '../../utils/datetime';

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

  // Tabs
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'detail'

  // Filters
  const [filterDate,   setFilterDate]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [showDebtList, setShowDebtList] = useState(true); // mở/đóng bảng nợ

  // Filter cho tab chi tiết
  const [detailFilterDeposit, setDetailFilterDeposit] = useState(''); // '' | 'has_deposit' | 'no_deposit' | 'paid_full' | 'need_pay'
  const [detailFilterStatus,  setDetailFilterStatus]  = useState(''); // '' | 'confirmed' | 'pending' | 'cancelled'

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
   * Tổng tiền đã thu của 1 booking = tiền cọc (deposit_amount) + tổng payments đã 'paid'
   * deposit_amount lưu trực tiếp trong booking, không tạo payment record riêng
   */
  const paidForBooking = (bookingId) => {
    const b = bookings.find(bk => bk.id === bookingId);
    const deposit      = b?.deposit_amount || 0;
    const paymentsPaid = payments
      .filter(p => p.booking_id === bookingId && p.status === 'paid')
      .reduce((s, p) => s + p.amount, 0);
    return deposit + paymentsPaid;
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
  // Tổng cọc tất cả booking đã ghi nhận vào quỹ
  const totalAllDeposits = useMemo(() => {
    return bookings.reduce((s, b) => s + (b.deposit_amount || 0), 0);
  }, [bookings]);

  // Cọc giữ lại từ các booking đã hủy (chưa có giao dịch refunded)
  const retainedDeposits = useMemo(() => {
    return bookings
      .filter(b => b.status === 'cancelled' && (b.deposit_amount || 0) > 0)
      .reduce((s, b) => {
        const hasRefund = payments.some(p => p.booking_id === b.id && p.status === 'refunded');
        return hasRefund ? s : s + (b.deposit_amount || 0);
      }, 0);
  }, [bookings, payments]);

  // Danh sách các booking đã hủy đang giữ cọc
  const cancelledBookingsWithDeposit = useMemo(() => {
    return bookings.filter(b => {
      if (b.status !== 'cancelled' || !(b.deposit_amount > 0)) return false;
      return !payments.some(p => p.booking_id === b.id && p.status === 'refunded');
    });
  }, [bookings, payments]);

  // Tổng thanh toán paid từ bảng payments
  const totalPaymentsPaid = useMemo(() => {
    return payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  }, [payments]);

  // Đã thu (tổng) = thanh toán paid + tổng cọc ban đầu
  const totalPaid = totalPaymentsPaid + totalAllDeposits;

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
      return true;
    });
  }, [payments, filterDate, filterStatus, filterMethod]);

  const hasFilter = filterDate || filterStatus || filterMethod;
  const clearFilters = () => { setFilterDate(''); setFilterStatus(''); setFilterMethod(''); };

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

  const handleDelete = async (id) => {
    if (!confirm('Xóa giao dịch này? Thao tác không thể hoàn tác.')) return;
    try {
      await paymentsAPI.delete(id);
      showToast({ type: 'success', message: 'Đã xóa giao dịch' });
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Không thể xóa giao dịch' });
    }
  };

  const handleRefund = async (id) => {
    if (!confirm('Xác nhận hoàn tiền cho giao dịch này?')) return;
    try {
      await paymentsAPI.update(id, { status: 'refunded' });
      showToast({ type: 'success', message: 'Đã ghi nhận hoàn tiền' });
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
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
        tag = hasRefund ? ' [Đã hủy - Đã hoàn cọc]' : (dep > 0 ? ` [Đã hủy - Cọc giữ lại: ${dep.toLocaleString()}đ]` : ' [Đã hủy]');
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
          </div>
        );
      }
    },
    { key: 'paid',       label: 'Đã thu tổng', align: 'right',
      render: (v, r) => {
        const paidFromPayments = v - r.deposit;
        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>{v.toLocaleString()}đ</span>
            {r.deposit > 0 && (
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 1 }}>
                {paidFromPayments > 0
                  ? `cọc ${r.deposit.toLocaleString()} + TT ${paidFromPayments.toLocaleString()}`
                  : `chỉ cọc ${r.deposit.toLocaleString()}đ`}
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
          if (r.deposit > 0 && !r.hasRefund) {
            return (
              <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />}
                style={{ borderColor: '#FDE68A', color: '#B45309', background: '#FEF3C7', fontSize: '0.75rem' }}
                onClick={() => openRefundForCancelled(r)}>
                Hoàn cọc
              </Button>
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
        const deposit      = r.deposit_amount || 0;
        const paymentsPaid = v - deposit;  // v = paid đã bao gồm deposit
        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>{v.toLocaleString()}đ</span>
            {deposit > 0 && (
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 1 }}>
                {paymentsPaid > 0
                  ? `cọc ${deposit.toLocaleString()} + TT ${paymentsPaid.toLocaleString()}`
                  : `cọc ${deposit.toLocaleString()}đ`
                }
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
          </div>
        );
      })()}

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Đã thu */}
        <Card padding="md" style={{ borderTop: '3px solid #10B981' }}>
          <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <CheckCircle size={14} style={{ color: '#10B981' }} /> Đã thu (tổng)
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{totalPaid.toLocaleString()}đ</p>
          <div style={{ marginTop: 4 }}>
            <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '2px 0 0' }}>
              Gồm TT: {totalPaymentsPaid.toLocaleString()}đ + Cọc: {totalAllDeposits.toLocaleString()}đ
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

      {/* ── Banner: Các đơn hủy đang giữ cọc (cho phép người quản lý hoàn tiền cọc bất cứ lúc nào) ── */}
      {cancelledBookingsWithDeposit.length > 0 && (
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
                <Button
                  key={cb.id}
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw size={12} />}
                  style={{ borderColor: '#FCD34D', color: '#92400E', background: '#FEF3C7', fontSize: '0.78rem' }}
                  onClick={() => openRefundForCancelled(cb)}
                >
                  Hoàn cọc #{cb.id} ({(cb.deposit_amount || 0).toLocaleString()}đ)
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ── Danh sách booking còn nợ ── */}
      {debtBookings.length > 0 && showDebtList && (
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
              <div style={{ flex: '1 1 150px', minWidth: 140 }}>
                <Input label="Theo ngày" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
              <div style={{ flex: '1 1 150px', minWidth: 140 }}>
                <Select label="Trạng thái" value={filterStatus} placeholder="Tất cả"
                  options={[{ value: 'paid', label: 'Đã thanh toán' }, { value: 'pending', label: 'Chờ thanh toán' }, { value: 'refunded', label: 'Đã hoàn tiền' }]}
                  onChange={e => setFilterStatus(e.target.value)} />
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 130 }}>
                <Select label="Phương thức" value={filterMethod} placeholder="Tất cả"
                  options={[{ value: 'cash', label: 'Tiền mặt' }, { value: 'transfer', label: 'Chuyển khoản' }, { value: 'momo', label: 'MoMo' }]}
                  onChange={e => setFilterMethod(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingBottom: 1 }}>
                <Button variant={filterDate === todayVN() ? 'primary' : 'secondary'} size="sm"
                  icon={<Calendar size={13} />} onClick={() => setFilterDate(filterDate === todayVN() ? '' : todayVN())}>
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
              </div>
            )}
          </Card>

          {/* ── Lịch sử giao dịch ── */}
          <Card padding="none">
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>Lịch sử giao dịch</span>
            </div>
            <Table columns={columns} data={filtered} loading={loading}
              emptyText={hasFilter ? 'Không có giao dịch nào khớp với bộ lọc' : 'Chưa có giao dịch nào'} />
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
            <Table columns={bookingDetailColumns} data={filteredBookingDetails} loading={loading}
              emptyText="Không có đơn nào phù hợp với bộ lọc" />
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
                          (Nếu có sự cố phát sinh, bạn vẫn có thể chọn loại giao dịch "Hoàn tiền").
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
    </div>
  );
}
