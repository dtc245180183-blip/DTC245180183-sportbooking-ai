import { useState, useEffect } from 'react';
import { customersAPI } from '../../api';
import { Plus, Search, History, Edit, Trash2, Users, Phone, Mail } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Table, EmptyState } from '../../components/ui';

export default function Customers() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', address: '' });
  const [editId, setEditId] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [historyCustomer, setHistoryCustomer] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = async (q = '') => {
    setLoading(true);
    try {
      const data = await customersAPI.getAll({ q });
      setCustomers(data);
    } catch (e) {}
    finally { setLoading(false); }
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
      fetchCustomers(search);
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
    }
  };

  const handleEdit = (c) => {
    setFormData({ full_name: c.full_name, phone: c.phone, email: c.email || '', address: c.address || '' });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa khách hàng này?')) return;
    try {
      await customersAPI.delete(id);
      showToast({ type: 'success', message: 'Đã xóa khách hàng' });
      fetchCustomers(search);
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xóa thất bại' });
    }
  };

  const handleViewHistory = async (c) => {
    try {
      const detail = await customersAPI.getOne(c.id);
      setHistoryCustomer(detail);
    } catch (e) {}
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

  const columns = [
    { key: 'id',        label: '#',             width: '60px',  render: (v) => `#${v}` },
    { key: 'full_name', label: 'Tên khách hàng', render: (v) => <strong style={{ color: '#0F172A' }}>{v}</strong> },
    { key: 'phone',     label: 'SĐT' },
    { key: 'email',     label: 'Email',   render: (v) => v || '—' },
    { key: 'address',   label: 'Địa chỉ', render: (v) => v || '—' },
    {
      key: 'actions', label: '', align: 'right',
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
          <p className="page-subtitle">Thông tin và lịch sử đặt sân của khách</p>
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
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
            {customers.length > 0 ? `${customers.length} khách hàng` : 'Nhập để tìm kiếm'}
            {search && ` · Tìm kiếm: "${search}"`}
          </p>
        </div>
        {search && (
          <button onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '1.1rem' }}>
            ✕
          </button>
        )}
      </div>

      <Card padding="none">
        <Table columns={columns} data={customers} loading={loading}
          emptyText="Không tìm thấy khách hàng nào" />
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
                ? <p style={{ color: '#64748B' }}>Chưa có lịch sử đặt sân.</p>
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
    </div>
  );
}
