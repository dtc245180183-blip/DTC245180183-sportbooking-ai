import { useState, useEffect, useMemo, useCallback } from 'react';
import { bookingsAPI, customersAPI, courtsAPI, timeSlotsAPI, paymentsAPI } from '../../api';
import { CalendarCheck, X, RefreshCw, RotateCcw, CreditCard, ArrowLeftRight, Sparkles, Eye, Plus, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Select, Table, ConfirmModal, CustomerAvatar, CustomerPopover, Pagination } from '../../components/ui';
import { useDebounce } from '../../utils/useDebounce';
import AISuggestModal from './AISuggestModal';
import BookingDetailModal from './BookingDetailModal';

const STATUS_MAP = {
  pending:   { label: 'Chờ xử lý', status: 'pending'   },
  confirmed: { label: 'Xác nhận',  status: 'confirmed' },
  cancelled: { label: 'Đã hủy',    status: 'cancelled' },
  completed: { label: 'Hoàn thành',status: 'completed' },
};

const PAYMENT_METHODS = [
  { value: 'cash',     label: 'Tiền mặt'     },
  { value: 'transfer', label: 'Chuyển khoản' },
  { value: 'momo',     label: 'MoMo'         },
];

export default function Bookings() {
  const { user: _currentUser } = useAuth();
  const { showToast } = useToast();
  const [confirmBookingId, setConfirmBookingId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [bookings, setBookings]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [courts, setCourts]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [cancellingId, setCancellingId] = useState(null); // id booking đang bị hủy

  // Filters & Search
  const [searchTerm, setSearchTerm]     = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCourt, setFilterCourt]   = useState('');
  const [filterDate, setFilterDate]     = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ customer_id: '', court_id: '', time_slot_id: '', deposit_amount: '', note: '' });
  const [availableSlots, setAvailableSlots]   = useState([]);
  const [createDate, setCreateDate]           = useState(new Date().toISOString().slice(0, 10));

  // Reschedule
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ court_id: '', date: new Date().toISOString().slice(0, 10), new_time_slot_id: '' });
  const [rescheduleSlots, setRescheduleSlots]     = useState([]);

  // Payment
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [paymentForm, setPaymentForm]       = useState({ amount: '', method: 'cash', status: 'paid' });

  // Detail / AI
  const [aiSuggestOpen, setAiSuggestOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);

  // Cancel with deposit options
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelForm, setCancelForm] = useState({ refund_deposit: false, refund_method: 'cash', reason: '' });

  // Refund deposit for already-cancelled booking
  const [refundModalBooking, setRefundModalBooking] = useState(null);
  const [refundForm, setRefundForm] = useState({ method: 'cash', reason: '' });

  /* ── Data fetching ────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filterStatus) params.status    = filterStatus;
    if (filterCourt)  params.court_id  = filterCourt;
    if (filterDate)   { params.date_from = filterDate; params.date_to = filterDate; }
    try {
      const data = await bookingsAPI.getAll(params);
      setBookings(Array.isArray(data) ? [...data].reverse() : []);
    } catch (e) {
      console.error('Lỗi tải danh sách đặt sân:', e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCourt, filterDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    customersAPI.getAll({}).then(setCustomers).catch(() => {});
    courtsAPI.getAll({}).then(setCourts).catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, filterCourt, filterDate]);

  const fetchAvailableSlots = useCallback(() => {
    if (createForm.court_id && createDate) {
      timeSlotsAPI.getAll({ court_id: createForm.court_id, filter_date: createDate, status: 'available' })
        .then(setAvailableSlots).catch(() => setAvailableSlots([]));
    } else { setAvailableSlots([]); }
  }, [createForm.court_id, createDate]);

  useEffect(() => { 
    fetchAvailableSlots(); 
  }, [fetchAvailableSlots]);

  const fetchRescheduleSlots = useCallback(() => {
    if (rescheduleForm.court_id && rescheduleForm.date) {
      timeSlotsAPI.getAll({ court_id: rescheduleForm.court_id, filter_date: rescheduleForm.date, status: 'available' })
        .then(setRescheduleSlots).catch(() => setRescheduleSlots([]));
    } else { setRescheduleSlots([]); }
  }, [rescheduleForm.court_id, rescheduleForm.date]);

  useEffect(() => { 
    fetchRescheduleSlots(); 
  }, [fetchRescheduleSlots]);

  /* ── Handlers ─────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    const selectedCourt = courts.find(c => c.id === parseInt(createForm.court_id));
    const courtPrice = selectedCourt?.price_per_hour || 0;
    const dep = parseFloat(createForm.deposit_amount) || 0;

    if (dep < 0) {
      showToast({ type: 'warning', message: 'Tiền đặt cọc không được nhỏ hơn 0đ.' });
      return;
    }
    if (courtPrice > 0 && dep > courtPrice) {
      showToast({
        type: 'warning',
        message: `Tiền cọc (${dep.toLocaleString()}đ) không được lớn hơn giá sân (${courtPrice.toLocaleString()}đ).`
      });
      return;
    }

    try {
      await bookingsAPI.create({
        customer_id:    parseInt(createForm.customer_id),
        time_slot_id:   parseInt(createForm.time_slot_id),
        deposit_amount: dep,
        note:           createForm.note,
      });
      setShowCreateModal(false);
      fetchAll();
      showToast({ type: 'success', message: 'Đặt sân thành công!' });
    } catch (err) {
      if (err.response?.status === 409) {
        showToast({ type: 'warning', message: err.response.data.detail || 'Khung giờ vừa được đặt, vui lòng chọn khung giờ khác.' });
        fetchAvailableSlots();
        setCreateForm(p => ({ ...p, time_slot_id: '' }));
      } else {
        showToast({ type: 'error', message: err.response?.data?.detail || 'Đặt sân thất bại' });
      }
    }
  };

  const handleConfirmSubmit = async () => {
    if (!confirmBookingId) return;
    setConfirmLoading(true);
    try {
      await bookingsAPI.confirm(confirmBookingId);
      showToast({ type: 'success', message: 'Đã xác nhận lịch đặt' });
      setConfirmBookingId(null);
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xác nhận thất bại' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleOpenCancel = (b) => {
    setCancelModalBooking(b);
    setCancelForm({
      refund_deposit: false,
      refund_method: 'cash',
      reason: '',
    });
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelModalBooking) return;
    setCancellingId(cancelModalBooking.id);
    try {
      await bookingsAPI.cancel(cancelModalBooking.id, {
        refund_deposit: cancelForm.refund_deposit,
        refund_method: cancelForm.refund_method,
        reason: cancelForm.reason || undefined,
      });
      showToast({
        type: 'success',
        message: cancelForm.refund_deposit
          ? `Đã hủy lịch đặt #${cancelModalBooking.id} và hoàn cọc ${(cancelModalBooking.deposit_amount || 0).toLocaleString()}đ!`
          : `Đã hủy lịch đặt #${cancelModalBooking.id} (giữ lại tiền cọc)!`
      });
      setCancelModalBooking(null);
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Hủy thất bại' });
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenRefund = (b) => {
    setRefundModalBooking(b);
    setRefundForm({
      method: 'cash',
      reason: 'Hoàn tiền cọc theo thỏa thuận',
    });
  };

  const handleConfirmRefund = async (e) => {
    e.preventDefault();
    if (!refundModalBooking) return;
    const refundPayment = refundModalBooking.payments?.find(p => p.status === 'refunded');
    const refundAmount = (refundModalBooking.deposit_amount && refundModalBooking.deposit_amount > 0)
      ? refundModalBooking.deposit_amount
      : (refundPayment?.amount || 0);

    try {
      await paymentsAPI.create({
        booking_id: refundModalBooking.id,
        amount: refundAmount,
        method: refundForm.method,
        status: 'refunded',
        note: refundForm.reason || 'Hoàn cọc cho đơn đã hủy',
      });
      showToast({
        type: 'success',
        message: `Đã ghi nhận hoàn cọc ${refundAmount.toLocaleString()}đ cho khách!`
      });
      setRefundModalBooking(null);
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Hoàn cọc thất bại' });
    }
  };

  const handleAISuggestSelect = (slotData) => {
    setAiSuggestOpen(false);
    setCreateForm({ customer_id: '', court_id: slotData.court_id, time_slot_id: slotData.slot_id, deposit_amount: '', note: 'AI Gợi ý' });
    setCreateDate(slotData.date);
    setShowCreateModal(true);
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      const res = await bookingsAPI.reschedule(rescheduleBooking.id, { new_time_slot_id: parseInt(rescheduleForm.new_time_slot_id) });
      setRescheduleBooking(null);
      fetchAll();
      showToast({ type: 'success', message: res.message || 'Đổi lịch thành công' });
    } catch (err) {
      if (err.response?.status === 409) {
        showToast({ type: 'warning', message: err.response.data.detail || 'Khung giờ mới đã được đặt hoặc không khả dụng.' });
        fetchRescheduleSlots();
        setRescheduleForm(p => ({ ...p, new_time_slot_id: '' }));
      } else {
        showToast({ type: 'error', message: err.response?.data?.detail || 'Đổi lịch thất bại' });
      }
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await paymentsAPI.create({
        booking_id: paymentBooking.id,
        amount:     parseFloat(paymentForm.amount),
        method:     paymentForm.method,
        status:     'paid',
        paid_at:    new Date().toISOString(),
      });
      setPaymentBooking(null);
      showToast({ type: 'success', message: 'Thanh toán thành công' });
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thanh toán thất bại' });
    }
  };

  const getCustomerName  = (id) => customers.find(c => c.id === id)?.full_name || `KH#${id}`;
  const getCustomerPhone = (id) => customers.find(c => c.id === id)?.phone     || '';
  const getCourtName     = (id) => courts.find(c    => c.id === id)?.name      || `Sân#${id}`;

  /* ── Filtered bookings & Summary stats ────────── */
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!debouncedSearch) return true;
      const term = debouncedSearch.toLowerCase().trim();
      const custName = (b.customer?.full_name || getCustomerName(b.customer_id) || '').toLowerCase();
      const custPhone = (b.customer?.phone || getCustomerPhone(b.customer_id) || '').toLowerCase();
      const note = (b.note || '').toLowerCase();
      const courtName = (b.court?.name || getCourtName(b.court_id) || '').toLowerCase();
      const idStr = `#${b.id}`;
      return custName.includes(term) || custPhone.includes(term) || note.includes(term) || courtName.includes(term) || idStr.includes(term) || String(b.id) === term;
    });
  }, [bookings, debouncedSearch, customers, courts]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  /* ── Table columns ────────────────────────────── */
  const columns = [
    { key: 'id', label: '#', width: '60px', render: v => <span style={{ fontWeight: 600, color: '#64748B' }}>#{v}</span> },
    { key: 'customer_id', label: 'Khách hàng', render: (v, row) => {
      const custObj = row.customer || customers.find(c => c.id === v) || { id: v, full_name: getCustomerName(v), phone: getCustomerPhone(v) };
      const name = custObj.full_name || getCustomerName(v);
      const phone = custObj.phone || getCustomerPhone(v);
      return (
        <CustomerPopover customer={custObj} customerId={v}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <CustomerAvatar name={name} size={34} showBadge={true} />
            <div>
              <strong style={{ color: '#0F172A', fontSize: '0.88rem', display: 'block' }}>{name}</strong>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>{phone}</div>
            </div>
          </div>
        </CustomerPopover>
      );
    }},
    { key: 'court_id', label: 'Sân', render: (v, row) => <span style={{ color: '#1E293B', fontWeight: 600 }}>{row.court?.name || getCourtName(v)}</span> },
    { key: 'time_slot', label: 'Ngày & Giờ', render: (v) => v ? (
      <div>
        <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 600 }}>{v.date}</div>
        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{v.start_time?.slice(0,5)} – {v.end_time?.slice(0,5)}</div>
      </div>
    ) : '—' },
    { key: 'total_amount', label: 'GIÁ SÂN & THỰC THU', align: 'right',
      render: (v, row) => {
        const total = Number(v || 0);
        const dep = Number(row.deposit_amount || 0);

        // 1. Đơn HOÀN THÀNH (completed)
        if (row.status === 'completed') {
          return (
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.95rem' }}>
                {total.toLocaleString()}đ
              </span>
              <div style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 600, marginTop: 2 }}>
                ✓ Thực thu: {total.toLocaleString()}đ (Đủ)
              </div>
            </div>
          );
        }

        // 2. Đơn ĐÃ HỦY (cancelled)
        if (row.status === 'cancelled') {
          const hasRefund = row.payments?.some(p => p.status === 'refunded');
          const refundPayment = row.payments?.find(p => p.status === 'refunded');
          const actualDep = dep > 0 ? dep : (refundPayment?.amount || 0);

          if (actualDep > 0 && !hasRefund) {
            return (
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#94A3B8', textDecoration: 'line-through', fontSize: '0.82rem', display: 'block' }}>
                  {total.toLocaleString()}đ
                </span>
                <span style={{ color: '#D97706', fontWeight: 700, fontSize: '0.88rem' }}>
                  Thu cọc: {actualDep.toLocaleString()}đ
                </span>
              </div>
            );
          }

          return (
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600, fontSize: '0.88rem' }}>
                {total.toLocaleString()}đ
              </span>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500, marginTop: 2 }}>
                Thực thu: 0đ
              </div>
            </div>
          );
        }

        // 3. Đơn ĐÃ XÁC NHẬN / ĐÃ ĐẶT (confirmed - khách chưa đến đá)
        if (row.status === 'confirmed') {
          const remaining = Math.max(0, total - dep);
          return (
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '0.95rem' }}>
                {total.toLocaleString()}đ
              </span>
              <div style={{ fontSize: '0.74rem', color: remaining > 0 ? '#2563EB' : '#16A34A', fontWeight: 600, marginTop: 2 }}>
                Còn phải thu: {remaining.toLocaleString()}đ
              </div>
            </div>
          );
        }

        // 4. Đơn CHỜ XỬ LÝ (pending)
        const remaining = Math.max(0, total - dep);
        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#334155', fontWeight: 600, fontSize: '0.9rem' }}>
              {total.toLocaleString()}đ
            </span>
            <div style={{ fontSize: '0.74rem', color: '#D97706', fontWeight: 500, marginTop: 2 }}>
              Còn phải thu: {remaining.toLocaleString()}đ
            </div>
          </div>
        );
      }
    },
    { key: 'deposit_amount', label: 'ĐẶT CỌC', align: 'right', width: '160px', padding: '12px 24px 12px 12px',
      render: (v, b) => {
        const hasRefund = b.payments?.some(p => p.status === 'refunded');
        const refundPayment = b.payments?.find(p => p.status === 'refunded');
        const dep = (v && v > 0) ? v : (refundPayment?.amount || 0);

        // Đơn HOÀN THÀNH
        if (b.status === 'completed') {
          if (dep > 0) {
            return (
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.88rem' }}>
                  {dep.toLocaleString()}đ
                </span>
                <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 500, marginTop: 1 }}>
                  Đã tính vào tổng thu
                </div>
              </div>
            );
          }
          return (
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#94A3B8', fontSize: '0.76rem', fontStyle: 'italic' }}>
                Không cọc (TT 100%)
              </span>
            </div>
          );
        }

        // Đơn ĐÃ HỦY
        if (b.status === 'cancelled') {
          if (hasRefund) {
            return (
              <div style={{ textAlign: 'right' }}>
                <span style={{ textDecoration: 'line-through', color: '#94A3B8', fontSize: '0.85rem' }}>
                  {dep.toLocaleString()}đ
                </span>
                <div style={{ marginTop: 2 }}>
                  <Badge status="completed" label="Đã hoàn cọc" />
                </div>
              </div>
            );
          }
          if (dep > 0) {
            return (
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#D97706', fontWeight: 600, fontSize: '0.85rem' }}>
                  {dep.toLocaleString()}đ
                </span>
                <div style={{ marginTop: 2 }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#B45309',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    padding: '1px 6px',
                    borderRadius: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    <ShieldCheck size={11} /> Cọc giữ lại
                  </span>
                </div>
              </div>
            );
          }
          return <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>Không cọc</span>;
        }

        // Đơn CONFIRMED hoặc PENDING
        if (dep > 0) {
          return (
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#2563EB', fontWeight: 600, fontSize: '0.88rem' }}>
                {dep.toLocaleString()}đ
              </span>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 1 }}>
                Đã thu cọc
              </div>
            </div>
          );
        }
        return <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>Chưa cọc</span>;
      }
    },
    { key: 'status', label: 'Trạng thái', width: '150px', padding: '12px 12px 12px 24px',
      render: v => <Badge status={STATUS_MAP[v]?.status || 'pending'} label={STATUS_MAP[v]?.label || v} /> },
    { key: 'actions', label: 'THAO TÁC', align: 'right',
      render: (_, b) => {
        const slot = b.time_slot;
        const hasRefund = b.payments?.some(p => p.status === 'refunded');
        const refundPayment = b.payments?.find(p => p.status === 'refunded');
        const depAmount = (b.deposit_amount && b.deposit_amount > 0)
          ? b.deposit_amount
          : (refundPayment?.amount || 0);

        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="ghost" size="sm" icon={<Eye size={12} />}
              onClick={() => setDetailBooking(b)}
              title="Xem thông tin chi tiết đơn">
              Chi tiết
            </Button>

            {/* Nút Hoàn cọc cho đơn đã hủy mà còn cọc giữ lại */}
            {b.status === 'cancelled' && depAmount > 0 && !hasRefund && (
              <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />}
                style={{ color: '#0284C7', borderColor: '#BAE6FD', background: '#F0F9FF' }}
                onClick={() => handleOpenRefund(b)}
                title="Tùy lý do, bạn có quyền hoàn lại cọc cho khách">
                Hoàn cọc
              </Button>
            )}

            {/* Nút Xác nhận — chỉ hiện khi booking đang pending */}
            {b.status === 'pending' && (
              <Button variant="ghost" size="sm" icon={<CheckCircle size={12} />}
                style={{ color: '#15803D', borderColor: '#BBF7D0', background: '#F0FDF4', fontWeight: 600 }}
                onClick={() => setConfirmBookingId(b.id)}>
                Xác nhận
              </Button>
            )}

            {/* Các đơn confirmed hoặc pending: đổi lịch và hủy lịch */}
            {(b.status === 'confirmed' || b.status === 'pending') && (
              <>
                <Button variant="ghost" size="sm" icon={<ArrowLeftRight size={12} />}
                  onClick={() => {
                    setRescheduleBooking(b);
                    setRescheduleForm({
                      court_id: b.court_id,
                      date: slot?.date || new Date().toISOString().slice(0,10),
                      new_time_slot_id: ''
                    });
                  }}
                  title="Đổi sang sân hoặc khung giờ khác">
                  Đổi lịch
                </Button>
                <Button variant="danger" size="sm" icon={<X size={12} />}
                  onClick={() => handleOpenCancel(b)}
                  title="Hủy đơn đặt sân này">
                  Hủy lịch
                </Button>
              </>
            )}
          </div>
        );
      }
    },
  ];

  /* ── Slot options helper ──────────────────────── */
  const slotOption = s => ({ value: s.id, label: `${s.start_time.slice(0,5)} – ${s.end_time.slice(0,5)}` });

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đặt lịch</h1>
          <p className="page-subtitle">Đặt sân, đổi lịch và hủy lịch</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" icon={<Sparkles size={15} />}
            style={{ background: '#FAF5FF', border: '1px solid #DDD6FE', color: '#6D28D9' }}
            onClick={() => setAiSuggestOpen(true)}>
            Nhờ AI gợi ý khung giờ
          </Button>
          <Button variant="primary" icon={<Plus size={15} />}
            onClick={() => { setShowCreateModal(true); setCreateForm({ customer_id: '', court_id: '', time_slot_id: '', deposit_amount: '', note: '' }); }}>
            Đặt sân mới
          </Button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <Card padding="md" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 220 }}>
            <Input
              label="Tìm kiếm nhanh"
              placeholder="Tìm theo tên khách hoặc SĐT..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Select label="Trạng thái" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              options={[{ value: '', label: 'Tất cả trạng thái' }, ...Object.entries(STATUS_MAP).map(([k,v]) => ({ value: k, label: v.label }))]} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Select label="Sân" value={filterCourt} onChange={e => setFilterCourt(e.target.value)}
              options={[{ value: '', label: 'Tất cả sân' }, ...courts.map(c => ({ value: c.id, label: c.name }))]} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Input label="Lọc theo ngày" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
          {(filterStatus || filterCourt || filterDate || searchTerm) && (
            <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />}
              onClick={() => { setFilterStatus(''); setFilterCourt(''); setFilterDate(''); setSearchTerm(''); }}
              style={{ color: '#64748B', height: 38 }}>
              Đặt lại
            </Button>
          )}
        </div>
      </Card>

      {/* ── Table ── */}
      <Card padding="none">
        <Table columns={columns} data={paginatedBookings} loading={loading}
          emptyText={debouncedSearch ? "Không tìm thấy lịch đặt phù hợp" : "Chưa có lịch đặt nào"} />
        {filteredBookings.length > 0 && (
          <div style={{ padding: '0.5rem 1.25rem' }}>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredBookings.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
            />
          </div>
        )}
      </Card>

      {/* ── MODAL: Đặt sân mới ── */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Đặt sân mới"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit" form="create-booking-form" icon={<CalendarCheck size={14} />}>
              Ghi nhận thông tin
            </Button>
          </>
        }
      >
        {(() => {
          const selectedCourtObj = courts.find(c => c.id === parseInt(createForm.court_id));
          const selectedCourtPrice = selectedCourtObj?.price_per_hour || 0;

          return (
            <form id="create-booking-form" onSubmit={handleCreate}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <Select label="Khách hàng" required value={createForm.customer_id}
                  placeholder="-- Chọn khách hàng --"
                  options={customers.map(c => ({ value: c.id, label: `${c.full_name} (${c.phone})` }))}
                  onChange={e => setCreateForm(p => ({ ...p, customer_id: e.target.value }))} />
              </div>
              <Select label="Sân" required value={createForm.court_id}
                placeholder="-- Chọn sân --"
                options={courts.filter(c => c.status === 'active').map(c => ({ value: c.id, label: c.name }))}
                onChange={e => setCreateForm(p => ({ ...p, court_id: e.target.value, time_slot_id: '' }))} />
              <Input label="Ngày đặt" type="date" value={createDate}
                onChange={e => setCreateDate(e.target.value)} />

              {/* Hộp thông tin giá sân niêm yết */}
              {selectedCourtObj && (
                <div style={{
                  gridColumn: '1/-1',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 10,
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ color: '#166534', fontWeight: 500 }}>
                    🏟️ Giá sân niêm yết (<strong>{selectedCourtObj.name}</strong>):
                  </span>
                  <strong style={{ color: '#15803D', fontSize: '0.98rem' }}>
                    {selectedCourtPrice.toLocaleString()}đ/giờ
                  </strong>
                </div>
              )}

              <div style={{ gridColumn: '1/-1' }}>
                <Select label="Khung giờ trống" required value={createForm.time_slot_id}
                  placeholder={!createForm.court_id || !createDate ? 'Chọn sân và ngày trước' : availableSlots.length === 0 ? 'Không còn khung giờ trống' : '-- Chọn khung giờ --'}
                  options={availableSlots.map(slotOption)}
                  onChange={e => setCreateForm(p => ({ ...p, time_slot_id: e.target.value }))}
                  disabled={!createForm.court_id || !createDate || availableSlots.length === 0} />
              </div>

              {/* Ô tiền đặt cọc có các nút chọn nhanh */}
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    Tiền đặt cọc (VNĐ)
                  </label>
                  {selectedCourtPrice > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="quick-dep-btn"
                        onClick={() => setCreateForm(p => ({ ...p, deposit_amount: 0 }))}
                      >
                        Không cọc (0đ)
                      </button>
                      <button
                        type="button"
                        className="quick-dep-btn"
                        onClick={() => setCreateForm(p => ({ ...p, deposit_amount: Math.round(selectedCourtPrice * 0.5) }))}
                      >
                        Cọc 50% ({Math.round(selectedCourtPrice * 0.5).toLocaleString()}đ)
                      </button>
                      <button
                        type="button"
                        className="quick-dep-btn"
                        onClick={() => setCreateForm(p => ({ ...p, deposit_amount: selectedCourtPrice }))}
                      >
                        Thu đủ 100% ({selectedCourtPrice.toLocaleString()}đ)
                      </button>
                    </div>
                  )}
                </div>
                <Input
                  type="number"
                  min={0}
                  max={selectedCourtPrice > 0 ? selectedCourtPrice : undefined}
                  value={createForm.deposit_amount}
                  onChange={e => setCreateForm(p => ({ ...p, deposit_amount: e.target.value }))}
                  placeholder="0"
                />
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 4 }}>
                  * Quy định: Tiền cọc từ 0đ đến tối đa bằng giá sân {selectedCourtPrice > 0 ? `(${selectedCourtPrice.toLocaleString()}đ)` : ''}.
                </div>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <Input label="Ghi chú" value={createForm.note}
                  onChange={e => setCreateForm(p => ({ ...p, note: e.target.value }))} placeholder="Ghi chú thêm..." />
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* ── MODAL: Đổi lịch ── */}
      <Modal
        open={!!rescheduleBooking}
        onClose={() => setRescheduleBooking(null)}
        title={`Đổi lịch đặt sân #${rescheduleBooking?.id}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRescheduleBooking(null)}>Hủy</Button>
            <Button variant="primary" type="submit" form="reschedule-form" icon={<RefreshCw size={14} />}>
              Xác nhận đổi lịch
            </Button>
          </>
        }
      >
        {rescheduleBooking && (() => {
          const currentCourt = courts.find(c => c.id === rescheduleBooking.court_id);
          const targetCourtId = parseInt(rescheduleForm.court_id) || rescheduleBooking.court_id;
          const targetCourt = courts.find(c => c.id === targetCourtId);
          const priceDiff = (targetCourt?.price_per_hour || 0) - (currentCourt?.price_per_hour || 0);

          return (
            <form id="reschedule-form" onSubmit={handleReschedule}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <p style={{ gridColumn: '1/-1', fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
                Đang đổi lịch cho: <strong style={{ color: '#0F172A' }}>
                  {rescheduleBooking.customer?.full_name || getCustomerName(rescheduleBooking.customer_id)}
                </strong> tại <strong style={{ color: '#0F172A' }}>
                  {rescheduleBooking.court?.name || getCourtName(rescheduleBooking.court_id)}
                </strong> ({currentCourt?.price_per_hour?.toLocaleString()}đ/h)
              </p>
              <Select label="Sân mới" value={rescheduleForm.court_id}
                placeholder="-- Giữ sân cũ --"
                options={courts.filter(c => c.status === 'active').map(c => ({ value: c.id, label: c.name }))}
                onChange={e => setRescheduleForm(p => ({ ...p, court_id: e.target.value, new_time_slot_id: '' }))} />
              <Input label="Ngày mới" type="date" value={rescheduleForm.date}
                onChange={e => setRescheduleForm(p => ({ ...p, date: e.target.value, new_time_slot_id: '' }))} />

              {/* Thông tin giá sân mới & chênh lệch */}
              {targetCourt && (
                <div style={{
                  gridColumn: '1/-1',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#475569' }}>
                    Giá sân mới (<strong>{targetCourt.name}</strong>):
                  </span>
                  <strong style={{ color: priceDiff > 0 ? '#C2410C' : priceDiff < 0 ? '#0284C7' : '#059669' }}>
                    {targetCourt.price_per_hour.toLocaleString()}đ/giờ
                    {priceDiff > 0 && ` (Khách trả thêm: +${priceDiff.toLocaleString()}đ)`}
                    {priceDiff < 0 && ` (Hoàn lại cho khách: ${Math.abs(priceDiff).toLocaleString()}đ)`}
                  </strong>
                </div>
              )}

              <div style={{ gridColumn: '1/-1' }}>
                <Select label="Khung giờ trống mới" required value={rescheduleForm.new_time_slot_id}
                  placeholder={!rescheduleForm.court_id || !rescheduleForm.date ? 'Chọn sân và ngày trước' : rescheduleSlots.length === 0 ? 'Không còn khung giờ trống' : '-- Chọn khung giờ --'}
                  options={rescheduleSlots.map(slotOption)}
                  onChange={e => setRescheduleForm(p => ({ ...p, new_time_slot_id: e.target.value }))}
                  disabled={!rescheduleForm.court_id || !rescheduleForm.date || rescheduleSlots.length === 0} />
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* ── MODAL: Thu tiền ── */}
      <Modal
        open={!!paymentBooking}
        onClose={() => setPaymentBooking(null)}
        title={`Thu tiền đặt sân #${paymentBooking?.id}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPaymentBooking(null)}>Hủy</Button>
            <Button variant="primary" type="submit" form="payment-quick-form" icon={<CreditCard size={14} />}>
              Xác nhận thanh toán
            </Button>
          </>
        }
      >
        {paymentBooking && (
          <form id="payment-quick-form" onSubmit={handlePayment}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1/-1', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#64748B' }}>Khách: </span>
              <strong style={{ color: '#0F172A' }}>
                {paymentBooking.customer?.full_name || getCustomerName(paymentBooking.customer_id)}
              </strong>
              &ensp;|&ensp;
              <span style={{ color: '#64748B' }}>Tổng: </span>
              <strong style={{ color: '#059669' }}>{paymentBooking.total_amount?.toLocaleString()}đ</strong>
              &ensp;|&ensp;
              <span style={{ color: '#64748B' }}>Đã cọc: </span>
              <strong style={{ color: '#2563EB' }}>{paymentBooking.deposit_amount?.toLocaleString()}đ</strong>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Số tiền thu (VNĐ)" type="number" required min={1}
                value={paymentForm.amount}
                onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                placeholder={`Còn lại: ${((paymentBooking.total_amount || 0) - (paymentBooking.deposit_amount || 0)).toLocaleString()}đ`} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Select label="Phương thức thanh toán" value={paymentForm.method}
                options={PAYMENT_METHODS}
                onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value }))} />
            </div>
          </form>
        )}
      </Modal>

      {/* ── MODAL: Hủy lịch đặt (Tùy chọn xử lý cọc) ── */}
      <Modal
        open={!!cancelModalBooking}
        onClose={() => setCancelModalBooking(null)}
        title={`Xác nhận hủy lịch đặt #${cancelModalBooking?.id}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelModalBooking(null)}>Đóng</Button>
            <Button variant="danger" type="submit" form="cancel-booking-form" loading={cancellingId === cancelModalBooking?.id}>
              Xác nhận hủy
            </Button>
          </>
        }
      >
        {cancelModalBooking && (
          <form id="cancel-booking-form" onSubmit={handleConfirmCancel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#64748B' }}>Khách hàng: </span><strong style={{ color: '#0F172A' }}>{cancelModalBooking.customer?.full_name || getCustomerName(cancelModalBooking.customer_id)}</strong></div>
              <div style={{ marginTop: 4 }}><span style={{ color: '#64748B' }}>Sân: </span><strong style={{ color: '#0F172A' }}>{cancelModalBooking.court?.name || getCourtName(cancelModalBooking.court_id)}</strong></div>
              <div style={{ marginTop: 4 }}><span style={{ color: '#64748B' }}>Tổng tiền: </span><strong style={{ color: '#059669' }}>{cancelModalBooking.total_amount?.toLocaleString()}đ</strong></div>
            </div>

            {(cancelModalBooking.deposit_amount || 0) > 0 ? (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#B45309', fontSize: '0.9rem' }}>
                  Lưu ý: Đơn này có tiền cọc {cancelModalBooking.deposit_amount.toLocaleString()}đ
                </p>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#64748B' }}>
                  Do bạn nắm quyền giao dịch, bạn có thể quyết định giữ cọc hoặc hoàn lại cọc tùy theo lý do:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#0F172A' }}>
                    <input
                      type="radio"
                      name="refund_opt"
                      checked={!cancelForm.refund_deposit}
                      onChange={() => setCancelForm(p => ({ ...p, refund_deposit: false }))}
                    />
                    <span><strong>Giữ lại cọc</strong> (Không hoàn tiền, tính vào doanh thu giữ cọc của sân)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#0F172A' }}>
                    <input
                      type="radio"
                      name="refund_opt"
                      checked={cancelForm.refund_deposit}
                      onChange={() => setCancelForm(p => ({ ...p, refund_deposit: true }))}
                    />
                    <span><strong>Hoàn lại cọc</strong> (Tạo ngay giao dịch hoàn tiền {cancelModalBooking.deposit_amount.toLocaleString()}đ cho khách)</span>
                  </label>
                </div>

                {cancelForm.refund_deposit && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #FDE68A' }}>
                    <Select
                      label="Phương thức hoàn tiền"
                      value={cancelForm.refund_method}
                      options={PAYMENT_METHODS}
                      onChange={e => setCancelForm(p => ({ ...p, refund_method: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            ) : null}

            <Input
              label="Lý do hủy / Ghi chú"
              value={cancelForm.reason}
              onChange={e => setCancelForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="Nhập lý do hủy (ví dụ: Khách bận đột xuất, lỗi do thời tiết, v.v.)..."
            />
          </form>
        )}
      </Modal>

      {/* ── MODAL: Hoàn cọc cho đơn đã hủy ── */}
      <Modal
        open={!!refundModalBooking}
        onClose={() => setRefundModalBooking(null)}
        title={`Hoàn tiền cọc cho đơn #${refundModalBooking?.id}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRefundModalBooking(null)}>Đóng</Button>
            <Button variant="primary" type="submit" form="refund-deposit-form" icon={<RefreshCw size={13} />}>
              Xác nhận hoàn tiền
            </Button>
          </>
        }
      >
        {refundModalBooking && (
          <form id="refund-deposit-form" onSubmit={handleConfirmRefund} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Khách hàng:</span>
                <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>
                  {refundModalBooking.customer?.full_name || getCustomerName(refundModalBooking.customer_id)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Sân đặt:</span>
                <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>
                  {refundModalBooking.court?.name || getCourtName(refundModalBooking.court_id)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed #BAE6FD' }}>
                <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Số tiền cọc hoàn lại:</span>
                <strong style={{ color: '#0284C7', fontSize: '1.1rem' }}>
                  {((refundModalBooking.deposit_amount && refundModalBooking.deposit_amount > 0)
                    ? refundModalBooking.deposit_amount
                    : (refundModalBooking.payments?.find(p => p.status === 'refunded')?.amount || 0)).toLocaleString()}đ
                </strong>
              </div>
            </div>

            <Select
              label="Phương thức hoàn tiền"
              value={refundForm.method}
              options={PAYMENT_METHODS}
              onChange={e => setRefundForm(p => ({ ...p, method: e.target.value }))}
            />

            <Input
              label="Lý do hoàn cọc / Ghi chú"
              value={refundForm.reason}
              onChange={e => setRefundForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="Nhập lý do hoàn cọc (ví dụ: Khách báo sớm, lý do chính đáng...)"
            />
          </form>
        )}
      </Modal>

      {/* ── AI Modals ── */}
      <AISuggestModal
        isOpen={aiSuggestOpen}
        onClose={() => setAiSuggestOpen(false)}
        onSelectSlot={handleAISuggestSelect}
      />
      <BookingDetailModal
        booking={detailBooking}
        onClose={() => setDetailBooking(null)}
        onRefund={(b) => {
          setDetailBooking(null);
          handleOpenRefund(b);
        }}
      />

      {/* ── Modal xác nhận chuẩn giao diện hiện đại ── */}
      <ConfirmModal
        open={!!confirmBookingId}
        onClose={() => setConfirmBookingId(null)}
        onConfirm={handleConfirmSubmit}
        loading={confirmLoading}
        title="Xác nhận đơn đặt sân"
        message={`Bạn có chắc chắn muốn xác nhận đơn đặt sân #${confirmBookingId}?`}
        confirmText="Xác nhận"
        variant="primary"
      />
    </div>
  );
}
