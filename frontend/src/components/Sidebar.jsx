import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarCheck, Calendar, Building2, Users,
  Wrench, LogOut, Sparkles, ChevronRight, Clock, CreditCard,
  ShieldCheck, PieChart, PanelLeftClose, PanelLeftOpen, Trophy,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

// 1. Menu dành cho Quản lý (Admin) — Chỉ giữ lại các chức năng Quản trị & Chiến lược đúng vai trò
const ADMIN_NAV_GROUPS = [
  {
    label: 'QUẢN TRỊ & CHIẾN LƯỢC',
    items: [
      { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/courts',       icon: Building2,       label: 'Quản lý sân' },
      { to: '/time-slots',   icon: Clock,           label: 'Tạo khung giờ' },
      { to: '/maintenance',  icon: Wrench,          label: 'Bảo trì sân' },
      { to: '/reports',      icon: PieChart,        label: 'Báo cáo & Thống kê' },
      { to: '/users',        icon: ShieldCheck,     label: 'Nhân viên & Quyền' },
      { to: '/ai-assistant', icon: Sparkles,        label: 'Trợ lý AI', ai: true },
    ],
  },
];

// 2. Menu dành cho Nhân viên (Staff - Lễ tân trực quầy) — Chỉ hiển thị nghiệp vụ trực quầy
const STAFF_NAV_GROUPS = [
  {
    label: 'NGHIỆP VỤ TRỰC QUẦY',
    items: [
      { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/schedule',     icon: Calendar,        label: 'Lịch đặt sân' },
      { to: '/bookings',     icon: CalendarCheck,   label: 'Danh sách đặt' },
      { to: '/customers',    icon: Users,           label: 'Khách hàng' },
      { to: '/payments',     icon: CreditCard,      label: 'Thanh toán & Cọc' },
      { to: '/ai-assistant', icon: Sparkles,        label: 'Trợ lý AI', ai: true },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === 'admin';
  const navGroups = isAdmin ? ADMIN_NAV_GROUPS : STAFF_NAV_GROUPS;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Logo + Toggle */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon"><Trophy size={18} /></div>
          {!collapsed && (
            <div>
              <div className="logo-text">SportBooking</div>
              <div className="logo-tagline">Pro Management</div>
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(p => !p)}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.label} className="nav-group-section">
            {!collapsed && <div className="nav-section-label">{group.label}</div>}
            {group.items.map(({ to, icon: Icon, label, ai }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive ? ' active' : ''}${ai ? ' ai-item' : ''}${collapsed ? ' collapsed-item' : ''}`
                }
              >
                <div className="nav-icon-wrap"><Icon size={15} /></div>
                {!collapsed && <span>{label}</span>}
                {!collapsed && <ChevronRight size={13} className="nav-arrow" />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div
            className="user-avatar"
            style={{
              background: isAdmin
                ? 'linear-gradient(135deg,#f97316,#ef4444)'
                : 'linear-gradient(135deg,#3b82f6,#6366f1)'
            }}
            title={collapsed ? `${user?.full_name} (${isAdmin ? 'Admin' : 'Staff'})` : undefined}
          >
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p className="user-name">{user?.full_name}</p>
              <p className="user-role" style={{ color: isAdmin ? '#D97706' : '#2563EB' }}>
                {isAdmin ? 'Quản lý (Admin)' : 'Lễ tân trực quầy'}
              </p>
            </div>
          )}
        </div>
        <button
          className="btn-logout"
          onClick={handleLogout}
          title="Đăng xuất"
          style={collapsed ? { margin: 'auto' } : undefined}
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}
