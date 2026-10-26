import { useState, useEffect } from 'react';
import { usersAPI, authAPI } from '../../api';
import { Shield, Plus, UserCog, UserMinus, Users as UsersIcon } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Table, ConfirmModal } from '../../components/ui';
import './Users.css';

export default function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', full_name: '', role: 'staff', password: '' });
  const [editId, setEditId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const updateData = { full_name: formData.full_name, role: formData.role };
        if (formData.password) updateData.password = formData.password;
        await usersAPI.update(editId, updateData);
        showToast({ type: 'success', message: 'Cập nhật thông tin nhân viên thành công' });
      } else {
        await authAPI.register({ ...formData, role: 'staff' });
        showToast({ type: 'success', message: 'Thêm tài khoản nhân viên thành công' });
      }
      setShowForm(false);
      setFormData({ username: '', full_name: '', role: 'staff', password: '' });
      setEditId(null);
      fetchUsers();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
    }
  };

  const handleEdit = (user) => {
    setFormData({ username: user.username, full_name: user.full_name, role: user.role, password: '' });
    setEditId(user.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setUserToDelete(id);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await usersAPI.delete(userToDelete);
      showToast({ type: 'success', message: 'Đã xóa nhân viên thành công' });
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xóa thất bại' });
    } finally {
      setDeleting(false);
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const staffCount = users.filter(u => u.role !== 'admin').length;

  const columns = [
    { key: 'id',         label: '#',         width: '60px',  render: (v) => `#${v}` },
    { key: 'username',   label: 'Username',   render: (v) => <strong style={{ color: '#0F172A' }}>{v}</strong> },
    { key: 'full_name',  label: 'Họ và tên',  render: (v) => <span style={{ color: '#334155', fontWeight: 500 }}>{v}</span> },
    { key: 'role',       label: 'Vai trò',   render: (v) => <Badge status={v === 'admin' ? 'admin' : 'staff'} /> },
    { key: 'created_at', label: 'Ngày tạo',  render: (v) => <span style={{ color: '#64748B' }}>{new Date(v).toLocaleDateString('vi-VN')}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" icon={<UserCog size={13} />} onClick={() => handleEdit(row)} style={{ color: '#059669', borderColor: '#BBF7D0', background: '#F0FDF4' }}>Sửa</Button>
          <Button variant="danger" size="sm" icon={<UserMinus size={13} />} onClick={() => handleDelete(row.id)}>Xóa</Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nhân viên &amp; Phân quyền</h1>
          <p className="page-subtitle">Quản lý tài khoản hệ thống và vai trò vận hành</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => { setEditId(null); setFormData({ username: '', full_name: '', role: 'staff', password: '' }); setShowForm(p => !p); }}>
          Thêm nhân viên
        </Button>
      </div>

      {/* Stats row */}
      <div className="users-stats">
        <div className="user-stat-card">
          <div className="user-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <UsersIcon size={22} />
          </div>
          <div className="user-stat-info">
            <p>Tổng tài khoản</p>
            <strong>{users.length}</strong>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="user-stat-icon" style={{ background: '#FAF5FF', color: '#7E22CE' }}>
            <Shield size={22} />
          </div>
          <div className="user-stat-info">
            <p>Quản lý (Admin)</p>
            <strong style={{ color: '#7E22CE' }}>{adminCount}</strong>
          </div>
        </div>
        <div className="user-stat-card">
          <div className="user-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
            <UserCog size={22} />
          </div>
          <div className="user-stat-info">
            <p>Nhân viên (Staff)</p>
            <strong style={{ color: '#059669' }}>{staffCount}</strong>
          </div>
        </div>
      </div>

      <Card padding="none">
        <Table columns={columns} data={users} loading={loading} emptyText="Chưa có nhân viên nào" />
      </Card>

      {/* ── MODAL: Form ── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'Sửa thông tin nhân viên' : 'Thêm tài khoản nhân viên'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button variant="primary" type="submit" form="user-form">Lưu thông tin</Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="Tên đăng nhập" required value={formData.username} disabled={!!editId}
            onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} />
          <Input label="Họ và tên" required value={formData.full_name}
            onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} />
          <Input
            label="Vai trò"
            value={formData.role === 'admin' ? 'Quản lý (Admin)' : 'Nhân viên (Staff)'}
            disabled
            hint={!editId ? 'Mặc định là tài khoản Nhân viên vận hành' : undefined}
          />
          <Input
            label={editId ? 'Mật khẩu (trống = không đổi)' : 'Mật khẩu'}
            type="password"
            required={!editId}
            minLength={6}
            value={formData.password}
            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
          />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Xác nhận xóa nhân viên"
        message="Bạn có chắc chắn muốn xóa tài khoản nhân viên này không? Hành động này không thể hoàn tác."
        confirmText="Xóa nhân viên"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
