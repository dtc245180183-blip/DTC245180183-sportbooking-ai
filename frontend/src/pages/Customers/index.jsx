import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersAPI, bookingsAPI } from '../../api';
import { 
  Plus, Search, History, Edit, Trash2, Phone, Mail, MapPin,
  Crown, Star, User, Users, Sparkles, TrendingUp, Download,
  Copy, Check, Calendar, ArrowRight, X, FileText, Zap, ChevronRight, RotateCcw
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { 
  Button, 
  Card, 
  Badge, 
  Modal, 
  Input, 
  Table, 
  EmptyState, 
  ConfirmModal,
  CustomerAvatar,
  Pagination 
} from '../../components/ui';
import { DEFAULT_AVATARS } from '../../components/ui/CustomerAvatar';
import { getCustomerTier, computeCustomerFinancials } from '../../components/ui/CustomerPopover';
import { useDebounce } from '../../utils/useDebounce';
import './Customers.css';

const formatMoney = (amount) => {
  if (amount == null || isNaN(amount)) return '0đ';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
};

export default function Customers() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [rawCustomers, setRawCustomers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [segmentTab, setSegmentTab] = useState('all'); // 'all' | 'vip' | 'returning' | 'new'
  const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'spent_desc' | 'bookings_desc' | 'name_asc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form Modal state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    full_name: '', 
    phone: '', 
    email: '', 
    address: '', 
    note: '', 
    avatar_url: '' 
  });
  const [editId, setEditId] = useState(null);
  const [phoneError, setPhoneError] = useState('');

  // 360 Drawer state
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Delete state
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Copy phone state
  const [copiedId, setCopiedId] = useState(null);

  // Fetch customers and bookings
  const loadData = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const [custRes, bookRes] = await Promise.all([
        customersAPI.getAll({ q, limit: 1000 }).catch(() => []),
        bookingsAPI.getAll({ limit: 1000 }).catch(() => [])
      ]);
      setRawCustomers(Array.isArray(custRes) ? custRes : []);
      setAllBookings(Array.isArray(bookRes) ? bookRes : []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu khách hàng:', err);
      showToast({ type: 'error', message: 'Không thể tải danh sách khách hàng' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setCurrentPage(1);
    loadData(debouncedSearch);
  }, [debouncedSearch, loadData]);

  // Enrich customers with bookings statistics (count, spent, tier, last active)
  const enrichedCustomers = useMemo(() => {
    return rawCustomers.map(c => {
      const customerBookings = allBookings.filter(b => b.customer_id === c.id);
      const financials = computeCustomerFinancials(customerBookings);

      return {
        ...c,
        booking_count: financials.bookingCount,
        completed_count: financials.completedCount,
        cancelled_count: financials.cancelledCount,
        total_spent: financials.totalSpent,
        last_booking_date: financials.lastBookingDate,
        bookings: customerBookings,
        tier: financials.tier
      };
    });
  }, [rawCustomers, allBookings]);

  // Executive KPI summary calculations
  const kpiStats = useMemo(() => {
    const total = enrichedCustomers.length;
    const vip = enrichedCustomers.filter(c => c.tier.id === 'vip').length;
    const returning = enrichedCustomers.filter(c => c.completed_count >= 2).length;
    const returningPct = total > 0 ? Math.round((returning / total) * 100) : 0;
    const newCust = enrichedCustomers.filter(c => c.completed_count < 2 && c.tier.id !== 'vip').length;
    const totalRevenue = enrichedCustomers.reduce((sum, c) => sum + c.total_spent, 0);

    return { total, vip, returning, returningPct, newCust, totalRevenue };
  }, [enrichedCustomers]);

  // Filter by Segment Tab & Sort
  const filteredAndSortedCustomers = useMemo(() => {
    let list = [...enrichedCustomers];

    // Filter by segment
    if (segmentTab === 'vip') {
      list = list.filter(c => c.tier.id === 'vip');
    } else if (segmentTab === 'returning') {
      list = list.filter(c => c.completed_count >= 2);
    } else if (segmentTab === 'new') {
      list = list.filter(c => c.completed_count < 2 && c.tier.id !== 'vip');
    }

    // Sort
    if (sortBy === 'spent_desc') {
      list.sort((a, b) => b.total_spent - a.total_spent);
    } else if (sortBy === 'bookings_desc') {
      list.sort((a, b) => (b.completed_count - a.completed_count) || (b.booking_count - a.booking_count));
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else {
      // Latest created / id desc
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [enrichedCustomers, segmentTab, sortBy]);

  // Paginated data for Table
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedCustomers.slice(start, start + pageSize);
  }, [filteredAndSortedCustomers, currentPage, pageSize]);

  // Handle Form submit (Create / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');
    if (!/^0\d{9}$/.test(formData.phone)) {
      setPhoneError('SĐT phải bắt đầu bằng 0 và có đúng 10 chữ số');
      return;
    }
    try {
      if (editId) {
        await customersAPI.update(editId, formData);
        showToast({ type: 'success', message: 'Cập nhật thông tin khách hàng thành công' });
      } else {
        await customersAPI.create(formData);
        showToast({ type: 'success', message: 'Thêm khách hàng mới thành công' });
      }
      setShowForm(false);
      setFormData({ full_name: '', phone: '', email: '', address: '', note: '', avatar_url: '' });
      setEditId(null);
      loadData(debouncedSearch);
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
    }
  };

  const handleEdit = (c) => {
    setFormData({
      full_name: c.full_name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      note: c.note || '',
      avatar_url: c.avatar_url || ''
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setCustomerToDelete(id);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      await customersAPI.delete(customerToDelete);
      showToast({ type: 'success', message: 'Đã xóa khách hàng thành công' });
      setCustomerToDelete(null);
      if (drawerCustomer?.id === customerToDelete) {
        setDrawerCustomer(null);
      }
      loadData(debouncedSearch);
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xóa thất bại (khách đã có lịch sử đặt sân)' });
    } finally {
      setDeleting(false);
    }
  };

  // Open 360 Customer Profile Drawer
  const handleOpenDrawer = async (c) => {
    setDrawerCustomer(c);
    setDrawerLoading(true);
    try {
      const detail = await customersAPI.getOne(c.id);
      const customerBookings = detail.bookings || [];
      const financials = computeCustomerFinancials(customerBookings);

      setDrawerCustomer({
        ...detail,
        booking_count: financials.bookingCount,
        completed_count: financials.completedCount,
        cancelled_count: financials.cancelledCount,
        total_spent: financials.totalSpent,
        last_booking_date: financials.lastBookingDate,
        bookings: customerBookings,
        tier: financials.tier
      });
    } catch (err) {
      console.error('Lỗi tải chi tiết khách:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Quick Book for customer
  const handleQuickBook = (c) => {
    navigate(`/schedule?customerId=${c.id}&customerName=${encodeURIComponent(c.full_name)}`);
  };

  // Copy phone number
  const handleCopyPhone = (phone, id) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    showToast({ type: 'info', message: `Đã sao chép SĐT: ${phone}` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (enrichedCustomers.length === 0) {
      showToast({ type: 'warning', message: 'Không có dữ liệu để xuất' });
      return;
    }
    const headers = [
      'Mã KH', 
      'Họ và tên', 
      'Số điện thoại', 
      'Email', 
      'Địa chỉ', 
      'Hạng hội viên', 
      'Tổng ca đặt',
      'Số ca đã chơi', 
      'Số ca đã hủy',
      'Tổng thực chi (VNĐ)', 
      'Lần đặt cuối',
      'Ghi chú'
    ];
    const rows = enrichedCustomers.map(c => [
      `#${c.id}`,
      `"${c.full_name || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.address || ''}"`,
      `"${c.tier?.label || 'Khách mới'}"`,
      c.booking_count || 0,
      c.completed_count || 0,
      c.cancelled_count || 0,
      c.total_spent || 0,
      `"${c.last_booking_date || 'Chưa đặt'}"`,
      `"${(c.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_khach_hang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ type: 'success', message: 'Đã xuất file CSV thành công!' });
  };

  // Table columns definition
  const columns = [
    { 
      key: 'id', 
      label: '#', 
      width: '65px', 
      render: (v) => <span className="crm-id-tag">#{v}</span> 
    },
    {
      key: 'full_name',
      label: 'Khách hàng',
      render: (_, row) => (
        <div 
          className="crm-customer-cell" 
          onClick={() => handleOpenDrawer(row)}
          title="Nhấn để xem hồ sơ 360° khách hàng"
        >
          <CustomerAvatar 
            customer={row} 
            size={42} 
            showBadge={true} 
            stats={{ completedCount: row.completed_count, totalSpent: row.total_spent }} 
          />
          <div className="crm-customer-meta">
            <h4 className="crm-customer-name">{row.full_name}</h4>
            <div className="crm-customer-sub">
              <span 
                className="crm-tier-pill" 
                style={{ 
                  color: row.tier.color, 
                  background: row.tier.bg, 
                  borderColor: row.tier.border 
                }}
              >
                <span>{row.tier.icon}</span>
                <span>{row.tier.label}</span>
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Liên hệ',
      render: (_, row) => (
        <div>
          <div className="crm-phone-cell">
            <span className="crm-phone-num">{row.phone}</span>
            <button 
              type="button" 
              className="crm-copy-btn" 
              title={copiedId === row.id ? "Đã sao chép!" : "Sao chép SĐT"}
              onClick={(e) => { e.stopPropagation(); handleCopyPhone(row.phone, row.id); }}
            >
              {copiedId === row.id ? <Check size={12} color="#059669" /> : <Copy size={12} />}
            </button>
            <a 
              href={`tel:${row.phone}`} 
              className="crm-copy-btn" 
              title="Gọi điện thoại"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={12} color="#2563EB" />
            </a>
          </div>
          {row.email && (
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mail size={11} /> {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'booking_count',
      label: 'Số ca đã chơi',
      render: (_, row) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
            {row.completed_count} ca
          </span>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 2 }}>
            {row.cancelled_count > 0 
              ? `${row.last_booking_date ? `Gần nhất: ${row.last_booking_date} · ` : ''}(${row.cancelled_count} ca hủy)`
              : (row.last_booking_date ? `Gần nhất: ${row.last_booking_date}` : 'Chưa có ca chơi')}
          </div>
        </div>
      ),
    },
    {
      key: 'total_spent',
      label: 'Tổng chi tiêu',
      render: (_, row) => (
        <div>
          <span className="crm-spent-val">{formatMoney(row.total_spent)}</span>
          <p className="crm-spent-sub">
            {row.total_spent > 0 
              ? `${row.completed_count} ca hoàn tất` 
              : 'Chưa phát sinh'}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <div className="crm-action-buttons">
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<History size={13} />} 
            onClick={(e) => { e.stopPropagation(); handleOpenDrawer(row); }}
            title="Xem hồ sơ & lịch sử chi tiết"
          >
            Hồ sơ
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<Edit size={13} />} 
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            title="Chỉnh sửa thông tin"
          >
            Sửa
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            icon={<Trash2 size={13} />} 
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            title="Xóa hồ sơ"
          >
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="customers-page-container">
      {/* 1. HEADER SECTION */}
      <div className="crm-header">
        <div className="crm-header-left">
          <h1>Quản lý Khách hàng</h1>
          <p>Hồ sơ thành viên 360°, phân cấp thẻ VIP và lịch sử giao dịch toàn diện</p>
        </div>
        <div className="crm-header-actions">
          <Button 
            variant="secondary" 
            icon={<Download size={15} />} 
            onClick={handleExportCSV}
          >
            Xuất Excel / CSV
          </Button>
          <Button 
            variant="primary" 
            icon={<Plus size={15} />} 
            onClick={() => {
              setEditId(null);
              setFormData({ full_name: '', phone: '', email: '', address: '', note: '', avatar_url: '' });
              setShowForm(true);
            }}
          >
            Thêm khách hàng
          </Button>
        </div>
      </div>

      {/* 2. 3 EXECUTIVE KPI STRIP CARDS */}
      <div className="crm-kpi-grid">
        <div className="crm-kpi-card">
          <div className="crm-kpi-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Users size={22} />
          </div>
          <div className="crm-kpi-content">
            <p className="crm-kpi-label">Tổng hội viên</p>
            <p className="crm-kpi-val" style={{ color: '#2563EB' }}>{kpiStats.total} khách</p>
            <p className="crm-kpi-sub">Dữ liệu lưu trữ hệ thống</p>
          </div>
        </div>

        <div className="crm-kpi-card">
          <div className="crm-kpi-icon-box" style={{ background: '#FEF3C7', color: '#B45309' }}>
            <Crown size={22} />
          </div>
          <div className="crm-kpi-content">
            <p className="crm-kpi-label">Khách hàng VIP</p>
            <p className="crm-kpi-val" style={{ color: '#B45309' }}>{kpiStats.vip} khách</p>
            <p className="crm-kpi-sub">
              Chi tiêu &gt;500k hoặc &gt;=4 ca
            </p>
          </div>
        </div>

        <div className="crm-kpi-card">
          <div className="crm-kpi-icon-box" style={{ background: '#FAF5FF', color: '#7C3AED' }}>
            <RotateCcw size={22} />
          </div>
          <div className="crm-kpi-content">
            <p className="crm-kpi-label">Khách quay lại</p>
            <p className="crm-kpi-val" style={{ color: '#7C3AED' }}>
              {kpiStats.returning} khách{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#A855F7' }}>
                ({kpiStats.returningPct}%)
              </span>
            </p>
            <p className="crm-kpi-sub">Hội viên chơi từ 2 ca trở lên</p>
          </div>
        </div>
      </div>

      {/* 3. SEGMENTS & FILTER CONTROLS */}
      <div className="crm-controls-card">
        {/* Row 1: Segment Tabs */}
        <div className="crm-tabs-row">
          <div className="crm-segment-tabs">
            <button
              type="button"
              className={`crm-tab-btn ${segmentTab === 'all' ? 'active' : ''}`}
              onClick={() => { setSegmentTab('all'); setCurrentPage(1); }}
            >
              <Users size={14} />
              <span>Tất cả</span>
              <span className="crm-tab-count">{kpiStats.total}</span>
            </button>
            <button
              type="button"
              className={`crm-tab-btn ${segmentTab === 'vip' ? 'active' : ''}`}
              onClick={() => { setSegmentTab('vip'); setCurrentPage(1); }}
            >
              <span>👑</span>
              <span>Khách VIP</span>
              <span className="crm-tab-count">{kpiStats.vip}</span>
            </button>
            <button
              type="button"
              className={`crm-tab-btn ${segmentTab === 'returning' ? 'active' : ''}`}
              onClick={() => { setSegmentTab('returning'); setCurrentPage(1); }}
            >
              <span>🔄</span>
              <span>Khách quay lại</span>
              <span className="crm-tab-count">{kpiStats.returning}</span>
            </button>
            <button
              type="button"
              className={`crm-tab-btn ${segmentTab === 'new' ? 'active' : ''}`}
              onClick={() => { setSegmentTab('new'); setCurrentPage(1); }}
            >
              <span>👤</span>
              <span>Khách mới</span>
              <span className="crm-tab-count">{kpiStats.newCust}</span>
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
            Hiển thị <strong>{filteredAndSortedCustomers.length}</strong> khách hàng
          </div>
        </div>

        {/* Row 2: Search Box & Sort Selection */}
        <div className="crm-search-filter-row">
          <div className="crm-search-wrap">
            <Search size={16} color="#059669" style={{ flexShrink: 0 }} />
            <input
              type="text"
              className="crm-search-input"
              placeholder="Tìm kiếm theo tên, số điện thoại hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="crm-sort-wrap">
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Sắp xếp:</span>
            <select
              className="crm-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">Mới tham gia nhất</option>
              <option value="spent_desc">Chi tiêu nhiều nhất (Top Spenders)</option>
              <option value="bookings_desc">Đặt sân nhiều nhất (Tần suất cao)</option>
              <option value="name_asc">Tên A → Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. MAIN DATA TABLE */}
      <Card padding="none">
        {filteredAndSortedCustomers.length === 0 && !loading ? (
          <EmptyState
            title="Không tìm thấy khách hàng phù hợp"
            description={debouncedSearch ? `Không có khách hàng nào khớp với từ khóa "${debouncedSearch}".` : "Chưa có khách hàng trong phân khúc này."}
            action={{
              label: 'Thêm khách hàng mới',
              icon: <Plus size={14} />,
              onClick: () => {
                setEditId(null);
                setFormData({ full_name: '', phone: '', email: '', address: '', note: '', avatar_url: '' });
                setShowForm(true);
              }
            }}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={paginatedCustomers}
              loading={loading}
              emptyText="Không có dữ liệu khách hàng"
            />
            {filteredAndSortedCustomers.length > 0 && (
              <div style={{ padding: '0.65rem 1.25rem' }}>
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredAndSortedCustomers.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* 5. MODAL: THÊM / SỬA KHÁCH HÀNG (KÈM BỘ CHỌN AVATAR) */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'Sửa thông tin khách hàng' : 'Thêm hồ sơ khách hàng mới'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button variant="primary" type="submit" form="customer-form">
              {editId ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
            </Button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit}>
          {/* Avatar Picker Section */}
          <div className="avatar-picker-wrap">
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
              Ảnh đại diện khách hàng
            </label>
            <div className="avatar-picker-preview-row">
              <CustomerAvatar
                name={formData.full_name || 'Khách'}
                avatarUrl={formData.avatar_url}
                size={58}
              />
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Hoặc dán URL ảnh đại diện tùy chọn..."
                  value={formData.avatar_url}
                  onChange={(e) => setFormData(p => ({ ...p, avatar_url: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '0.8rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
                <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#64748B' }}>
                  Chọn nhanh 1 trong các avatar mẫu bên dưới hoặc dán link ảnh cá nhân.
                </p>
              </div>
            </div>

            {/* Avatar presets grid */}
            <div className="avatar-presets-grid">
              {DEFAULT_AVATARS.map((url, idx) => (
                <div
                  key={idx}
                  className={`avatar-preset-item ${formData.avatar_url === url ? 'selected' : ''}`}
                  onClick={() => setFormData(p => ({ ...p, avatar_url: url }))}
                  title={`Chọn avatar mẫu #${idx + 1}`}
                >
                  <img src={url} alt={`Avatar preset ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Input fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Input 
              label="Họ và tên *" 
              required 
              placeholder="Ví dụ: Nguyễn Văn Khách"
              value={formData.full_name} 
              onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} 
            />
            <Input 
              label="Số điện thoại *" 
              required 
              placeholder="Ví dụ: 0901234567"
              value={formData.phone} 
              error={phoneError}
              onChange={e => { setFormData(p => ({ ...p, phone: e.target.value })); setPhoneError(''); }} 
            />
            <Input 
              label="Email" 
              type="email" 
              placeholder="email@example.com"
              value={formData.email} 
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} 
            />
            <Input 
              label="Địa chỉ" 
              placeholder="Quận/Huyện, Tỉnh/TP"
              value={formData.address} 
              onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} 
            />
          </div>

          <div style={{ marginTop: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Ghi chú nội bộ / Thói quen đặt sân
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Thích sân số 2, hay đi theo nhóm 6 người, mượn bóng..."
              value={formData.note}
              onChange={e => setFormData(p => ({ ...p, note: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.85rem',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </form>
      </Modal>

      {/* 6. DRAWER (CUSTOMER 360° PROFILE SLIDE-OVER) */}
      {drawerCustomer && (
        <div className="crm-drawer-overlay" onClick={() => setDrawerCustomer(null)}>
          <div className="crm-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="crm-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                  Hồ sơ hội viên 360°
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerCustomer(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="crm-drawer-body">
              {/* Profile Card */}
              <div className="crm-profile-card">
                <CustomerAvatar
                  customer={drawerCustomer}
                  size={64}
                  showBadge={true}
                  stats={{ total: drawerCustomer.booking_count, totalSpent: drawerCustomer.total_spent }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                      {drawerCustomer.full_name}
                    </h3>
                    <span 
                      className="crm-tier-pill" 
                      style={{ 
                        color: drawerCustomer.tier.color, 
                        background: drawerCustomer.tier.bg, 
                        borderColor: drawerCustomer.tier.border 
                      }}
                    >
                      {drawerCustomer.tier.icon} {drawerCustomer.tier.label}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 6px', fontSize: '0.78rem', color: '#64748B' }}>
                    Mã hội viên: <strong>#{drawerCustomer.id}</strong>
                  </p>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    <button
                      type="button"
                      className="crm-quick-book-btn"
                      onClick={() => handleQuickBook(drawerCustomer)}
                    >
                      <Zap size={13} /> Đặt sân ngay
                    </button>
                    <a
                      href={`tel:${drawerCustomer.phone}`}
                      className="crm-copy-btn"
                      style={{ width: 'auto', padding: '0 8px', gap: 4, height: 26, fontSize: '0.72rem', textDecoration: 'none' }}
                    >
                      <Phone size={12} color="#059669" /> Gọi điện
                    </a>
                  </div>
                </div>
              </div>

              {/* 4 Metric Boxes */}
              <div className="crm-drawer-metrics">
                <div className="crm-drawer-metric-box">
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>TỔNG CA ĐẶT</p>
                  <p style={{ margin: '3px 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#2563EB' }}>
                    {drawerCustomer.booking_count || 0}
                  </p>
                </div>
                <div className="crm-drawer-metric-box">
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>CA HOÀN THÀNH</p>
                  <p style={{ margin: '3px 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                    {drawerCustomer.completed_count || 0}
                  </p>
                </div>
                <div className="crm-drawer-metric-box">
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>CA ĐÃ HỦY</p>
                  <p style={{ margin: '3px 0 0', fontSize: '1.35rem', fontWeight: 800, color: drawerCustomer.cancelled_count > 0 ? '#EF4444' : '#64748B' }}>
                    {drawerCustomer.cancelled_count || 0}
                  </p>
                </div>
                <div className="crm-drawer-metric-box">
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>TỔNG THỰC CHI</p>
                  <p style={{ margin: '3px 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                    {formatMoney(drawerCustomer.total_spent)}
                  </p>
                </div>
              </div>

              {/* Contact & Information Details */}
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                  Thông tin liên hệ
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={14} color="#64748B" />
                    <strong>{drawerCustomer.phone}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} color="#64748B" />
                    <span>{drawerCustomer.email || 'Chưa cập nhật email'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} color="#64748B" />
                    <span>{drawerCustomer.address || 'Chưa cập nhật địa chỉ'}</span>
                  </div>
                  {drawerCustomer.note && (
                    <div style={{ marginTop: 4, padding: '6px 8px', background: '#FFFBEB', borderRadius: 6, border: '1px solid #FDE68A', color: '#92400E', fontSize: '0.78rem' }}>
                      <strong>Ghi chú:</strong> {drawerCustomer.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline of recent bookings */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={15} color="#2563EB" /> Lịch sử đặt sân gần đây ({drawerCustomer.bookings?.length || 0})
                </p>

                {drawerLoading ? (
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Đang tải lịch sử...</p>
                ) : drawerCustomer.bookings?.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', background: '#F8FAFC', borderRadius: 10 }}>
                    Khách hàng này chưa có ca đặt sân nào.
                  </div>
                ) : (
                  drawerCustomer.bookings.map(b => (
                    <div key={b.id} className="crm-timeline-item">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB' }}>#{b.id}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                            {b.time_slot ? `${b.time_slot.start_time?.slice(0, 5)} - ${b.time_slot.end_time?.slice(0, 5)}` : '18:00 - 19:00'}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748B' }}>
                          {b.time_slot?.date || '—'} · {b.court?.name || 'Sân thể thao'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#059669' }}>
                          {formatMoney(b.total_amount)}
                        </span>
                        <div>
                          <Badge 
                            status={b.status} 
                            label={
                              b.status === 'completed' ? 'Hoàn thành' :
                              b.status === 'confirmed' ? 'Đã xác nhận' :
                              b.status === 'cancelled' ? 'Đã hủy' : 'Chờ xử lý'
                            } 
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={confirmDeleteCustomer}
        title="Xác nhận xóa hồ sơ khách hàng"
        message="Bạn có chắc chắn muốn xóa khách hàng này? Lưu ý: Không thể xóa khách hàng nếu đã có lịch sử đặt sân trong hệ thống."
        confirmText="Xóa khách hàng"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
