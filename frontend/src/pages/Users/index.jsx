import { useState, useEffect, useMemo } from 'react';
import { usersAPI, authAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Table, ConfirmModal } from '../../components/ui';
import {
  Shield, ShieldCheck, Plus, UserCog, UserMinus, Users as UsersIcon,
  Search, X, RefreshCw, KeyRound, UserCheck, Eye, EyeOff, Layers,
  CheckCircle2, XCircle, AlertCircle, Building2, Calendar,
  CreditCard, PieChart, Sparkles, Clock, Lock, Check
} from 'lucide-react';
import './Users.css';

/* ── Initials Avatar Generator ── */
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── RBAC Matrix Definition ── */
const RBAC_MODULES = [
  {
    category: '1. Quản lý Sân & Loại hình thể thao',
    icon: Building2,
    items: [
      { name: 'Xem danh mục sân & trạng thái hoạt động', admin: 'full', staff: 'full', desc: 'Kiểm tra sơ đồ sân trực quan' },
      { name: 'Thêm mới, chỉnh sửa thông tin sân', admin: 'full', staff: 'none', desc: 'Đổi tên sân, gán loại hình thể thao' },
      { name: 'Xóa hoặc ngưng hoạt động sân', admin: 'full', staff: 'none', desc: 'Vô hiệu hóa sân tạm thời hoặc vĩnh viễn' },
      { name: 'Cấu hình đơn giá theo giờ & khung giờ vàng', admin: 'full', staff: 'none', desc: 'Thiết lập bảng giá thuê sân theo từng loại' },
    ]
  },
  {
    category: '2. Khung giờ & Lịch bảo trì',
    icon: Clock,
    items: [
      { name: 'Tạo khung giờ đặt sân cố định', admin: 'full', staff: 'view', desc: 'Khởi tạo slot hoạt động 06:00 - 23:00' },
      { name: 'Khóa / Mở khóa khung giờ thủ công', admin: 'full', staff: 'none', desc: 'Chủ động điều phối slot trống' },
      { name: 'Lên lịch bảo trì sân & Khóa sân tự động', admin: 'full', staff: 'view', desc: 'Bảo dưỡng mặt sân cỏ, hệ thống chiếu sáng' },
    ]
  },
  {
    category: '3. Nghiệp vụ Lịch & Đặt sân',
    icon: Calendar,
    items: [
      { name: 'Xem sơ đồ lịch đặt thời gian thực', admin: 'full', staff: 'full', desc: 'Theo dõi timeline các sân trong ngày' },
      { name: 'Tạo lịch đặt tại quầy (Khách lẻ & Định kỳ)', admin: 'full', staff: 'full', desc: 'Nhập thông tin khách, xếp sân, giữ chỗ' },
      { name: 'Chuyển sân, đổi giờ, dời lịch đặt', admin: 'full', staff: 'full', desc: 'Linh hoạt hỗ trợ khách khi còn khung giờ trống' },
      { name: 'Hủy lịch đặt sân & Hoàn cọc', admin: 'full', staff: 'desk', desc: 'Admin toàn quyền duyệt, Staff áp dụng theo chính sách quầy' },
    ]
  },
  {
    category: '4. Khách hàng & Thanh toán',
    icon: CreditCard,
    items: [
      { name: 'Quản lý danh bạ & Lịch sử khách hàng', admin: 'full', staff: 'full', desc: 'Tìm kiếm khách quen, số điện thoại, lịch sử đặt' },
      { name: 'Thu tiền cọc & Quyết toán hóa đơn tại quầy', admin: 'full', staff: 'full', desc: 'Thu tiền mặt hoặc quét mã QR chuyển khoản' },
      { name: 'In hóa đơn / Phiếu xác nhận đặt sân', admin: 'full', staff: 'full', desc: 'Cung cấp phiếu xác nhận giữ chỗ cho khách hàng' },
    ]
  },
  {
    category: '5. Báo cáo tài chính & Thống kê kinh doanh',
    icon: PieChart,
    items: [
      { name: 'Xem tổng doanh thu & Dòng tiền thực tế', admin: 'full', staff: 'none', desc: 'Bảo mật tuyệt đối số liệu tài chính doanh nghiệp' },
      { name: 'Biểu đồ khung giờ cao điểm & Tỷ lệ lấp đầy', admin: 'full', staff: 'none', desc: 'Phân tích hiệu suất khai thác cụm sân' },
      { name: 'Xuất báo cáo tài chính & Thống kê đối soát', admin: 'full', staff: 'none', desc: 'Dữ liệu kế toán và kết toán cuối tháng' },
    ]
  },
  {
    category: '6. Tài khoản & Phân quyền hệ thống',
    icon: ShieldCheck,
    items: [
      { name: 'Tạo tài khoản & Cấp quyền nhân viên', admin: 'full', staff: 'none', desc: 'Chỉ Quản lý (Admin) mới có quyền cấp tài khoản' },
      { name: 'Chỉnh sửa, đổi mật khẩu & Xóa tài khoản', admin: 'full', staff: 'none', desc: 'Quản lý vòng đời tài khoản nhân sự nội bộ' },
    ]
  },
  {
    category: '7. Trợ lý Trí tuệ Nhân tạo (Gemini AI)',
    icon: Sparkles,
    items: [
      { name: 'AI gợi ý khung giờ trống & Chống trùng lịch', admin: 'full', staff: 'full', desc: 'Tư vấn thông minh cho khách hàng tức thì' },
      { name: 'AI sinh tin nhắn thông báo xác nhận/nhắc lịch', admin: 'full', staff: 'full', desc: 'Tự động soạn tin nhắn Zalo/SMS chuẩn văn phong' },
      { name: 'AI nhận định chiến lược kinh doanh & Doanh thu', admin: 'full', staff: 'none', desc: 'Trợ lý phân tích dữ liệu chuyên sâu cho cấp quản trị' },
    ]
  }
];

export default function Users() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'matrix' | 'roles'
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'staff'

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', full_name: '', role: 'staff', password: '' });
  const [editId, setEditId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Không thể tải danh sách tài khoản' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
      await new Promise(r => setTimeout(r, 450));
      showToast({ type: 'success', message: 'Đã làm mới danh sách tài khoản thành công!' });
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: 'Không thể tải danh sách tài khoản' });
    } finally {
      setLoading(false);
    }
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
    setShowPassword(false);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (id === currentUser?.id) {
      showToast({ type: 'warning', message: 'Bạn không thể tự xóa tài khoản của chính mình' });
      return;
    }
    setUserToDelete(id);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await usersAPI.delete(userToDelete);
      showToast({ type: 'success', message: 'Đã xóa tài khoản nhân viên thành công' });
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xóa thất bại' });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q));
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, searchQuery]);

  const adminCount = users.filter(u => u.role === 'admin').length;
  const staffCount = users.filter(u => u.role !== 'admin').length;

  const columns = [
    {
      key: 'id',
      label: '#',
      width: '65px',
      render: (v) => <span style={{ color: '#94A3B8', fontWeight: 600 }}>#{String(v).padStart(2, '0')}</span>
    },
    {
      key: 'identity',
      label: 'Nhân sự & Định danh',
      render: (_, row) => {
        const isAdmin = row.role === 'admin';
        const isCurrent = row.id === currentUser?.id;
        const initials = getInitials(row.full_name || row.username);
        return (
          <div className="user-identity-cell">
            <div className={`user-avatar-badge ${isAdmin ? 'avatar-admin' : 'avatar-staff'}`}>
              {initials}
            </div>
            <div className="user-identity-text">
              <div className="user-full-name">
                {row.full_name}
                {isCurrent && <span className="user-current-tag">Bạn</span>}
              </div>
              <span className="user-username-tag">@{row.username}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'role',
      label: 'Vai trò & Phân quyền',
      render: (v) => {
        const isAdmin = v === 'admin';
        return (
          <div className="role-badge-box">
            <span className={`role-badge-tag ${isAdmin ? 'role-tag-admin' : 'role-tag-staff'}`}>
              {isAdmin ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
              {isAdmin ? 'Quản lý (Admin)' : 'Lễ tân trực quầy'}
            </span>
            <span className="role-badge-desc">
              {isAdmin ? 'Toàn quyền cấu hình & chiến lược' : 'Nghiệp vụ quầy & đặt sân'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: () => (
        <span className="status-active-pill">
          <span className="status-pulse-dot" />
          Đang hoạt động
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Ngày kích hoạt',
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: '0.82rem', fontWeight: 500 }}>
          <Calendar size={13} style={{ color: '#94A3B8' }} />
          {new Date(v).toLocaleDateString('vi-VN')}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'right',
      render: (_, row) => {
        const isCurrent = row.id === currentUser?.id;
        return (
          <div className="user-actions-group">
            <button
              className="user-action-btn btn-act-view"
              title="Xem ma trận quyền hạn của nhân viên này"
              onClick={() => setSelectedUserForPerms(row)}
            >
              <Eye size={13} />
              Quyền hạn
            </button>
            <button
              className="user-action-btn btn-act-edit"
              title="Chỉnh sửa thông tin"
              onClick={() => handleEdit(row)}
            >
              <UserCog size={13} />
              Sửa
            </button>
            <button
              className="user-action-btn btn-act-delete"
              title={isCurrent ? 'Không thể xóa chính mình' : 'Xóa tài khoản'}
              disabled={isCurrent}
              onClick={() => handleDelete(row.id)}
            >
              <UserMinus size={13} />
              Xóa
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="users-page">
      {/* ── Top Header ── */}
      <div className="users-header">
        <div className="users-header-title-group">
          <h1>
            <ShieldCheck size={26} style={{ color: '#10B981' }} />
            Nhân viên &amp; Phân quyền
          </h1>
          <p>Cấu trúc tổ chức, phân quyền truy cập RBAC và quản lý tài khoản vận hành hệ thống</p>
        </div>
        <div className="users-header-actions">
          <Button
            variant="ghost"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={handleManualRefresh}
            disabled={loading}
          >
            Làm mới
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => {
              setEditId(null);
              setFormData({ username: '', full_name: '', role: 'staff', password: '' });
              setShowPassword(false);
              setShowForm(true);
            }}
          >
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ── */}
      <div className="users-stats-grid">
        <div className="user-kpi-card kpi-blue">
          <div className="kpi-top-row">
            <div className="kpi-icon-wrap">
              <UsersIcon size={22} />
            </div>
            <span className="kpi-chip">Khả dụng</span>
          </div>
          <div className="kpi-meta">
            <h3>Tổng số tài khoản</h3>
            <div className="kpi-value-row">
              <strong>{users.length}</strong>
              <span className="kpi-subtext">Đang hoạt động</span>
            </div>
          </div>
        </div>

        <div className="user-kpi-card kpi-purple">
          <div className="kpi-top-row">
            <div className="kpi-icon-wrap">
              <ShieldCheck size={22} />
            </div>
            <span className="kpi-chip">Toàn quyền</span>
          </div>
          <div className="kpi-meta">
            <h3>Quản lý (Admin)</h3>
            <div className="kpi-value-row">
              <strong style={{ color: '#7C3AED' }}>{adminCount}</strong>
              <span className="kpi-subtext">Quản trị &amp; Chiến lược</span>
            </div>
          </div>
        </div>

        <div className="user-kpi-card kpi-emerald">
          <div className="kpi-top-row">
            <div className="kpi-icon-wrap">
              <UserCheck size={22} />
            </div>
            <span className="kpi-chip">Trực quầy</span>
          </div>
          <div className="kpi-meta">
            <h3>Nhân viên (Staff)</h3>
            <div className="kpi-value-row">
              <strong style={{ color: '#059669' }}>{staffCount}</strong>
              <span className="kpi-subtext">Vận hành booking</span>
            </div>
          </div>
        </div>

        <div className="user-kpi-card kpi-amber">
          <div className="kpi-top-row">
            <div className="kpi-icon-wrap">
              <KeyRound size={22} />
            </div>
            <span className="kpi-chip">Bảo mật</span>
          </div>
          <div className="kpi-meta">
            <h3>Cơ chế bảo vệ</h3>
            <div className="kpi-value-row">
              <strong style={{ color: '#D97706', fontSize: '1.45rem' }}>RBAC 2.0</strong>
              <span className="kpi-subtext">Mã hóa mật khẩu</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="users-tabs-container">
        <div className="users-tabs-nav">
          <button
            className={`users-tab-item ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            <UsersIcon size={16} />
            Danh sách nhân viên
            <span className="users-tab-badge">{users.length}</span>
          </button>
          <button
            className={`users-tab-item ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            <Shield size={16} />
            Ma trận phân quyền (RBAC Matrix)
            <span className="users-tab-badge">Chuẩn hóa</span>
          </button>
          <button
            className={`users-tab-item ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <Layers size={16} />
            Chi tiết vai trò &amp; Trách nhiệm
          </button>
        </div>
      </div>

      {/* ── TAB 1: Danh sách nhân viên ── */}
      {activeTab === 'accounts' && (
        <Card padding="none" style={{ borderRadius: 14, overflow: 'hidden' }}>
          {/* Table Toolbar */}
          <div className="users-table-toolbar">
            <div className="users-search-wrap">
              <Search size={15} className="users-search-icon" />
              <input
                type="text"
                className="users-search-input"
                placeholder="Tìm kiếm theo họ tên, username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="users-search-clear" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div className="users-filter-pills">
                <button
                  className={`filter-pill-btn ${roleFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('all')}
                >
                  Tất cả ({users.length})
                </button>
                <button
                  className={`filter-pill-btn ${roleFilter === 'admin' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('admin')}
                >
                  Quản lý ({adminCount})
                </button>
                <button
                  className={`filter-pill-btn ${roleFilter === 'staff' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('staff')}
                >
                  Lễ tân ({staffCount})
                </button>
              </div>

              <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 500 }}>
                Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} tài khoản
              </span>
            </div>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            data={filteredUsers}
            loading={loading}
            emptyText={
              searchQuery || roleFilter !== 'all'
                ? 'Không tìm thấy tài khoản nhân viên nào khớp với bộ lọc'
                : 'Chưa có tài khoản nào trong hệ thống'
            }
          />
        </Card>
      )}

      {/* ── TAB 2: Ma trận phân quyền (RBAC Matrix) ── */}
      {activeTab === 'matrix' && (
        <div className="rbac-matrix-card">
          <div className="rbac-matrix-header">
            <div className="rbac-matrix-title">
              <h2>
                <ShieldCheck size={18} style={{ color: '#10B981' }} />
                Ma trận kiểm soát truy cập dựa trên vai trò (RBAC Matrix)
              </h2>
              <p>Quy định chi tiết phạm vi quyền hạn và thẩm quyền của từng vị trí trong doanh nghiệp</p>
            </div>
            <div className="rbac-legend">
              <span className="rbac-legend-item access-full">
                <CheckCircle2 size={14} /> Toàn quyền (Full Access)
              </span>
              <span className="rbac-legend-item access-desk">
                <UserCheck size={14} /> Nghiệp vụ quầy (Desk Only)
              </span>
              <span className="rbac-legend-item access-view">
                <Eye size={14} /> Chỉ xem (View Only)
              </span>
              <span className="rbac-legend-item access-none">
                <XCircle size={14} /> Bị khóa (No Access)
              </span>
            </div>
          </div>

          <table className="rbac-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Phân hệ &amp; Tính năng nghiệp vụ</th>
                <th style={{ width: '27%' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7E22CE' }}>
                    <ShieldCheck size={15} /> Quản lý (Admin)
                  </span>
                </th>
                <th style={{ width: '28%' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1D4ED8' }}>
                    <UserCheck size={15} /> Lễ tân (Staff)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {RBAC_MODULES.map((module) => (
                <tbody key={module.category}>
                  <tr className="rbac-category-row">
                    <td colSpan={3}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <module.icon size={14} style={{ color: '#059669' }} />
                        {module.category}
                      </span>
                    </td>
                  </tr>
                  {module.items.map((item) => (
                    <tr key={item.name}>
                      <td>
                        <strong style={{ color: '#0F172A', display: 'block', marginBottom: 2 }}>{item.name}</strong>
                        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>{item.desc}</span>
                      </td>
                      <td>
                        {item.admin === 'full' && (
                          <span className="rbac-access-cell access-full">
                            <CheckCircle2 size={16} /> Toàn quyền
                          </span>
                        )}
                      </td>
                      <td>
                        {item.staff === 'full' && (
                          <span className="rbac-access-cell access-full">
                            <CheckCircle2 size={16} /> Toàn quyền
                          </span>
                        )}
                        {item.staff === 'desk' && (
                          <span className="rbac-access-cell access-desk">
                            <UserCheck size={16} /> Theo quy trình quầy
                          </span>
                        )}
                        {item.staff === 'view' && (
                          <span className="rbac-access-cell access-view">
                            <Eye size={16} /> Chỉ xem lịch
                          </span>
                        )}
                        {item.staff === 'none' && (
                          <span className="rbac-access-cell access-none">
                            <XCircle size={16} /> Không có quyền
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 3: Chi tiết vai trò & Trách nhiệm ── */}
      {activeTab === 'roles' && (
        <div className="role-profiles-grid">
          {/* Card Admin */}
          <div className="role-profile-card card-admin">
            <div>
              <div className="role-profile-header">
                <div className="role-profile-icon">
                  <ShieldCheck size={26} />
                </div>
                <span className="kpi-chip" style={{ background: '#FAF5FF', color: '#6D28D9' }}>
                  Cấp quản trị cao nhất
                </span>
              </div>
              <h2 className="role-profile-name">Quản lý (Administrator)</h2>
              <p className="role-profile-desc">
                Chịu trách nhiệm toàn diện về quản trị chiến lược, hạ tầng cụm sân thể thao, chính sách giá và kiểm soát doanh thu tài chính.
              </p>
              <ul className="role-features-list">
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#7C3AED' }} />
                  <span>Toàn quyền cấu hình danh mục sân, loại sân và bảng giá linh hoạt theo giờ vàng.</span>
                </li>
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#7C3AED' }} />
                  <span>Xem báo cáo tài chính, biểu đồ giờ cao điểm và thống kê dòng tiền thực tế.</span>
                </li>
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#7C3AED' }} />
                  <span>Cấp mới tài khoản, phân quyền, đổi mật khẩu và quản lý danh bạ nhân sự.</span>
                </li>
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#7C3AED' }} />
                  <span>Khai thác Trợ lý Trí tuệ Nhân tạo (Gemini AI) để nhận định hiệu suất kinh doanh.</span>
                </li>
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#7C3AED' }} />
                  <span>Thiết lập lịch bảo trì định kỳ, tự động khóa sân tránh trùng lịch.</span>
                </li>
              </ul>
            </div>
            <div className="role-footer-stat">
              <span>Số tài khoản đang nắm quyền:</span>
              <strong style={{ color: '#7C3AED', fontSize: '1rem' }}>{adminCount} Quản trị viên</strong>
            </div>
          </div>

          {/* Card Staff */}
          <div className="role-profile-card card-staff">
            <div>
              <div className="role-profile-header">
                <div className="role-profile-icon">
                  <UserCheck size={26} />
                </div>
                <span className="kpi-chip" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                  Vận hành quầy trực tiếp
                </span>
              </div>
              <h2 className="role-profile-name">Nhân viên Lễ tân (Front Desk Staff)</h2>
              <p className="role-profile-desc">
                Chịu trách nhiệm vận hành tại quầy lễ tân, tiếp đón khách hàng, tư vấn khung giờ trống, xếp lịch sân và thu tiền quyết toán hóa đơn.
              </p>
              <ul className="role-features-list">
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#059669' }} />
                  <span>Trực quầy tiếp đón khách, tạo lịch đặt sân theo thời gian thực (khách lẻ / vãng lai).</span>
                </li>
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#059669' }} />
                  <span>Sử dụng Trợ lý AI để gợi ý slot trống thông minh và tự động soạn tin nhắn Zalo/SMS.</span>
                </li>
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#059669' }} />
                  <span>Thu tiền cọc, quyết toán hóa đơn khi khách chơi xong, in phiếu giữ chỗ.</span>
                </li>
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#059669' }} />
                  <span>Quản lý danh bạ khách hàng, hỗ trợ đổi giờ hoặc chuyển sân linh hoạt khi có sự cố.</span>
                </li>
                <li className="role-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#059669' }} />
                  <span>Bảo mật dữ liệu: Không có quyền truy cập vào báo cáo doanh thu tài chính tổng.</span>
                </li>
              </ul>
            </div>
            <div className="role-footer-stat">
              <span>Số tài khoản đang vận hành:</span>
              <strong style={{ color: '#059669', fontSize: '1rem' }}>{staffCount} Nhân viên trực quầy</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Thêm / Sửa nhân viên ── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'Chỉnh sửa thông tin nhân viên' : 'Thêm tài khoản nhân viên mới'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button variant="primary" type="submit" form="user-form">
              {editId ? 'Cập nhật thay đổi' : 'Tạo tài khoản'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
              Vai trò &amp; Quyền hạn vận hành <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div className="role-select-grid">
              <div
                className={`role-select-box ${formData.role === 'staff' ? 'selected-staff' : ''}`}
                onClick={() => setFormData(p => ({ ...p, role: 'staff' }))}
              >
                <div className="role-select-header">
                  <div className="role-select-title">
                    <UserCheck size={16} style={{ color: '#059669' }} />
                    Lễ tân trực quầy (Staff)
                  </div>
                  {formData.role === 'staff' && <Check size={16} style={{ color: '#059669' }} />}
                </div>
                <p>Nghiệp vụ đặt sân, tư vấn khách, thu cọc và in hóa đơn tại quầy.</p>
              </div>

              <div
                className={`role-select-box ${formData.role === 'admin' ? 'selected-admin' : ''} ${!editId ? 'disabled' : ''}`}
                onClick={() => {
                  if (editId) {
                    setFormData(p => ({ ...p, role: 'admin' }));
                  } else {
                    showToast({ type: 'warning', message: 'Tài khoản mới chỉ được tạo với vai trò Nhân viên để đảm bảo an toàn.' });
                  }
                }}
              >
                <div className="role-select-header">
                  <div className="role-select-title">
                    <ShieldCheck size={16} style={{ color: '#7C3AED' }} />
                    Quản lý (Admin)
                  </div>
                  {formData.role === 'admin' && <Check size={16} style={{ color: '#7C3AED' }} />}
                </div>
                <p>Toàn quyền quản trị, xem doanh thu tài chính và cấu hình hệ thống.</p>
              </div>
            </div>
            {!editId && (
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={13} style={{ color: '#3B82F6' }} />
                Chuẩn an toàn: Tài khoản nhân viên mới được tạo ở cấp bậc trực quầy vận hành.
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Tên đăng nhập (Username)"
              required
              value={formData.username}
              disabled={!!editId}
              placeholder="vd: staff_lananh"
              onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
            />
            <Input
              label="Họ và tên nhân viên"
              required
              value={formData.full_name}
              placeholder="vd: Lê Lan Anh"
              onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
            />
          </div>

          <Input
            label={editId ? 'Mật khẩu mới (bỏ trống nếu không thay đổi)' : 'Mật khẩu bảo mật'}
            type={showPassword ? 'text' : 'password'}
            required={!editId}
            minLength={6}
            placeholder={showPassword ? 'Nhập mật khẩu...' : '••••••••'}
            value={formData.password}
            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
            hint="Khuyến nghị đặt mật khẩu có chữ và số để tăng cường bảo mật"
            icon={<Lock size={15} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  color: showPassword ? '#10B981' : '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  transition: 'color 0.15s ease'
                }}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
        </form>
      </Modal>

      {/* ── MODAL: Xem ma trận quyền hạn cá nhân ── */}
      <Modal
        open={Boolean(selectedUserForPerms)}
        onClose={() => setSelectedUserForPerms(null)}
        title="Chi tiết thẩm quyền &amp; Phân hệ truy cập"
        footer={<Button variant="primary" onClick={() => setSelectedUserForPerms(null)}>Đóng lại</Button>}
      >
        {selectedUserForPerms && (
          <div>
            <div className="perm-detail-modal-user">
              <div className={`user-avatar-badge ${selectedUserForPerms.role === 'admin' ? 'avatar-admin' : 'avatar-staff'}`} style={{ width: 48, height: 48, fontSize: '1.1rem' }}>
                {getInitials(selectedUserForPerms.full_name || selectedUserForPerms.username)}
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  {selectedUserForPerms.full_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>
                  <span>@{selectedUserForPerms.username}</span>
                  <span>•</span>
                  <span className={`role-badge-tag ${selectedUserForPerms.role === 'admin' ? 'role-tag-admin' : 'role-tag-staff'}`} style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                    {selectedUserForPerms.role === 'admin' ? 'Quản lý (Admin)' : 'Lễ tân trực quầy'}
                  </span>
                </div>
              </div>
            </div>

            <div className="perm-detail-groups">
              {RBAC_MODULES.map(group => {
                const isUserAdmin = selectedUserForPerms.role === 'admin';
                return (
                  <div key={group.category} className="perm-group-box">
                    <div className="perm-group-title">
                      <group.icon size={14} style={{ color: '#059669' }} />
                      {group.category}
                    </div>
                    {group.items.map(item => {
                      const hasAccess = isUserAdmin ? item.admin === 'full' : (item.staff === 'full' || item.staff === 'desk' || item.staff === 'view');
                      const accessText = isUserAdmin
                        ? 'Toàn quyền'
                        : (item.staff === 'full' ? 'Toàn quyền' : (item.staff === 'desk' ? 'Quy trình quầy' : (item.staff === 'view' ? 'Chỉ xem' : 'Không có quyền')));
                      return (
                        <div key={item.name} className="perm-item-row">
                          {hasAccess ? (
                            <CheckCircle2 size={15} style={{ color: '#059669', flexShrink: 0 }} />
                          ) : (
                            <XCircle size={15} style={{ color: '#94A3B8', flexShrink: 0 }} />
                          )}
                          <span style={{ flex: 1, color: hasAccess ? '#0F172A' : '#94A3B8' }}>{item.name}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: hasAccess ? '#059669' : '#94A3B8' }}>
                            {accessText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: Xác nhận xóa an toàn ── */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Xác nhận xóa tài khoản nhân viên"
        message="Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống? Nhân viên này sẽ không thể đăng nhập và truy cập vào SportBooking Pro nữa."
        confirmText="Xác nhận xóa"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
