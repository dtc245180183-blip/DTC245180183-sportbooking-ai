import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import './Topbar.css';

const VN_TZ = 'Asia/Ho_Chi_Minh';

const PAGE_LABELS = {
  '/':            'Dashboard',
  '/schedule':    'Lịch Đặt Sân',
  '/bookings':    'Quản lý Đặt lịch',
  '/courts':      'Quản lý Sân',
  '/time-slots':  'Tạo Khung giờ',
  '/customers':   'Khách hàng',
  '/payments':    'Thanh toán & Cọc',
  '/maintenance': 'Bảo trì Sân',
  '/reports':     'Báo cáo & Thống kê',
  '/users':       'Nhân viên & Quyền',
  '/ai-assistant':'Trợ lý AI',
};

function getNowVN() {
  return new Date();
}

function getGreetingVN(date) {
  const h = parseInt(date.toLocaleString('en-US', { timeZone: VN_TZ, hour: 'numeric', hour12: false }));
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const currentPage = PAGE_LABELS[location.pathname] || 'SportBooking';

  const [now, setNow] = useState(getNowVN());

  // Cập nhật đồng hồ mỗi giây — theo giờ Việt Nam
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr  = now.toLocaleDateString('vi-VN', { timeZone: VN_TZ, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr  = now.toLocaleTimeString('vi-VN', { timeZone: VN_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <header className="topbar">
      {/* Left: Breadcrumb / page title */}
      <div className="topbar-left">
        <div className="topbar-page-title">{currentPage}</div>
        <div className="topbar-date">
          {dateStr}
          <span style={{ marginLeft: '0.5rem', fontVariantNumeric: 'tabular-nums',
                         color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {timeStr}
          </span>
        </div>
      </div>

      {/* Right: Actions + User */}
      <div className="topbar-right">
        <div className="topbar-greeting">
          <span className="greeting-text">{getGreetingVN(now)}, <strong>{user?.full_name?.split(' ').pop()}</strong> 👋</span>
        </div>
        <button className="topbar-icon-btn" title="Thông báo">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>
        <div className="topbar-avatar" style={{
          background: user?.role === 'admin'
            ? 'linear-gradient(135deg, #f97316, #ef4444)'
            : 'linear-gradient(135deg, #3b82f6, #6366f1)'
        }}>
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
