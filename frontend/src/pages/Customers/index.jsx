import { useState, useEffect, useMemo } from 'react';
import { customersAPI } from '../../api';
import { Plus, Search, History, Edit, Trash2, Phone, Mail } from 'lucide-react';
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
  CustomerPopover,
  Pagination 
} from '../../components/ui';
import { useDebounce } from '../../utils/useDebounce';

export default function Customers() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', address: '' });
  const [editId, setEditId] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 on search change
  useEffect(() => {
    setCurrentPage(1);
    fetchCustomers(debouncedSearch);
  }, [debouncedSearch]);

  const fetchCustomers = async (q = '') => {
    setLoading(true);
    try {
      const data = await customersAPI.getAll({ q });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải danh sách khách hàng:', err);
      showToast({ type: 'error', message: 'Không thể tải danh sách khách hàng' });
    } finally {
      setLoading(false);
    }
  };

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
      setFormData({ full_name: '', phone: '', email: '', address: '' });
      setEditId(null);
      fetchCustomers(debouncedSearch);
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
    }
  };

  const handleEdit = (c) => {
    setFormData({ full_name: c.full_name, phone: c.phone, email: c.email || '', address: c.address || '' });
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
      fetchCustomers(debouncedSearch);
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xóa thất bại' });
    } finally {
      setDeleting(false);
    }
  };

  const handleViewHistory = async (c) => {
    try {
      const detail = await customersAPI.getOne(c.id);
      setHistoryCustomer(detail);
    } catch (err) {
      console.error('Lỗi tải lịch sử khách hàng:', err);
      showToast({ type: 'error', message: 'Không thể tải lịch sử khách hàng' });
    }
  };

  const STATUS_MAP = {
    pending:   { label: 'Chờ xử lý',  color: '#f59e0b' },
    confirmed: { label: 'Xác nhận',   color: '#22c55e' },
    cancelled: { label: 'Hủy',        color: '#dc2626' },
    completed: { label: 'Hoàn thành', color: '#3b82f6' },
  };

  const getHistoryStats = (bookings = []) => ({
    total: bookings.length,
    totalSpent: bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.total_amount || 0), 0),
  });

  // Client-side pagination
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return customers.slice(start, start + pageSize);
  }, [customers, currentPage, pageSize]);

  const columns = [
    { key: 'id', label: '#', width: '60px', render: (v) => `#${v}` },
    {
      key: 'full_name',
      label: 'Khách hàng',
      render: (_, row) => (
        <CustomerPopover customer={row}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <CustomerAvatar name={row.full_name} size={36} showBadge={true} />
            <div>
              <strong style={{ color: '#0F172A', display: 'block', fontSize: '0.88rem' }}>
                {row.full_name}
              </strong>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                ID: #{row.id}
              </span>
            </div>
          </div>
        </CustomerPopover>
      ),
    },
    { key: 'phone', label: 'Số điện thoại', render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span> },
    { key: 'email', label: 'Email', render: (v) => v || '—' },
    { key: 'address', label: 'Địa chỉ', render: (v) => v || '—' },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" icon={<History size={13} />} onClick={() => handleViewHistory(row)}>Lịch sử</Button>
          <Button variant="secondary" size="sm" icon={<Edit size={13} />} onClick={() => handleEdit(row)}>Sửa</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(row.id)}>Xóa</Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Khách hàng</h1>
          <p className="page-subtitle">Thông tin chi tiết, phân loại thẻ khách và lịch sử đặt sân</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => { setEditId(null); setFormData({ full_name: '', phone: '', email: '', address: '' }); setShowForm(p => !p); }}>
          Thêm khách hàng
        </Button>
      </div>

      {/* Search Hero */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '0.875rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <Search size={18} style={{ color: '#059669', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại hoặc email khách hàng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontSize: '0.9rem', color: '#0F172A', letterSpacing: '0.01em',
            }}
          />
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>
            {customers.length > 0 ? `${customers.length} khách hàng trong hệ thống` : 'Nhập để tìm kiếm'}
            {debouncedSearch && ` · Lọc theo: "${debouncedSearch}"`}
          </p>
        </div>
        {search && (
          <button 
            type="button"
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ✕
          </button>
        )}
      </div>

      <Card padding="none">
        {customers.length === 0 && !loading ? (
          <EmptyState
            title="Chưa có khách hàng"
            description={debouncedSearch ? `Không tìm thấy khách hàng nào khớp với "${debouncedSearch}"` : "Bắt đầu thêm hồ sơ khách hàng mới để quản lý đặt sân và tích lũy chi tiêu."}
            action={{
              label: 'Thêm khách hàng mới',
              icon: <Plus size={14} />,
              onClick: () => { setEditId(null); setFormData({ full_name: '', phone: '', email: '', address: '' }); setShowForm(true); }
            }}
          />
        ) : (
          <>
            <Table 
              columns={columns} 
              data={paginatedCustomers} 
              loading={loading}
              emptyText="Không tìm thấy khách hàng nào" 
            />
            {customers.length > 0 && (
              <div style={{ padding: '0.5rem 1.25rem' }}>
                <Pagination
                  currentPage={currentPage}
                  totalItems={customers.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── MODAL: Form thêm/sửa ── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button variant="primary" type="submit" form="customer-form">Lưu thông tin</Button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="Họ và tên *" required value={formData.full_name} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} />
          <Input label="Số điện thoại *" required value={formData.phone} error={phoneError}
            onChange={e => { setFormData(p => ({ ...p, phone: e.target.value })); setPhoneError(''); }} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
          <Input label="Địa chỉ" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
        </form>
      </Modal>

      {/* ── MODAL: Lịch sử đặt sân ── */}
      <Modal
        open={!!historyCustomer}
        onClose={() => setHistoryCustomer(null)}
        title={historyCustomer ? `Lịch sử đặt sân — ${historyCustomer.full_name}` : ''}
        size="lg"
      >
        {historyCustomer && (() => {
          const stats = getHistoryStats(historyCustomer.bookings);
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#475569', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={14} className="text-secondary" /> {historyCustomer.phone}</span>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={14} className="text-secondary" /> {historyCustomer.email || '—'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <Card padding="sm" style={{ textAlign: 'center', background: '#F8FAFC' }}>
                  <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', margin: 0 }}>{stats.total}</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0', fontWeight: 500 }}>Lượt đặt</p>
                </Card>
                <Card padding="sm" style={{ textAlign: 'center', background: '#F8FAFC' }}>
                  <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: 0 }}>{stats.totalSpent.toLocaleString()}đ</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0', fontWeight: 500 }}>Tổng chi tiêu</p>
                </Card>
              </div>
              {historyCustomer.bookings?.length === 0
                ? <EmptyState title="Chưa có lịch sử đặt sân" description="Khách hàng này chưa thực hiện lượt đặt sân nào." />
                : historyCustomer.bookings?.map(b => {
                  const st = STATUS_MAP[b.status] || STATUS_MAP.pending;
                  return (
                    <div key={b.id} style={{ border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>#{b.id}</span>
                        {b.time_slot && <span style={{ marginLeft: '0.5rem', fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>{b.time_slot.date} | {b.time_slot.start_time?.slice(0,5)} – {b.time_slot.end_time?.slice(0,5)}</span>}
                        {b.court && <span style={{ marginLeft: '0.5rem', color: '#64748B', fontSize: '0.82rem' }}>@ {b.court.name}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 700, color: '#059669' }}>{b.total_amount?.toLocaleString()}đ</span>
                        <Badge status={b.status} label={st.label} />
                      </div>
                    </div>
                  );
                })
              }
            </>
          );
        })()}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={confirmDeleteCustomer}
        title="Xác nhận xóa khách hàng"
        message="Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác nếu khách hàng đã có lịch sử đặt sân."
        confirmText="Xóa khách hàng"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
