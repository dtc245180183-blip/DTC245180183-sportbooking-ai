import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Lock,
  User,
  ShieldCheck,
  UserCheck,
  Zap,
  Trophy,
  Clock,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import './Login.css';

const FEATURES = [
  { icon: Trophy, text: 'Quản lý sân chuyên nghiệp' },
  { icon: Zap,    text: 'Đặt lịch realtime' },
  { icon: Clock,  text: 'AI gợi ý khung giờ' },
  { icon: Users,  text: 'Phân quyền linh hoạt' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const doLogin = async (u, p) => {
    setLoading(true);
    setError('');
    try {
      await login(u, p);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Sai tên đăng nhập hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ===== LEFT: FORM PANEL ===== */}
      <div className="login-form-panel">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <Trophy size={22} color="#FFFFFF" />
          </div>
          <div className="login-brand-text">
            <div className="login-brand-name">
              SportBooking <span className="login-brand-badge">PRO</span>
            </div>
            <div className="login-brand-tag">Hệ thống quản lý sân thể thao</div>
          </div>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>Chào mừng trở lại</h1>
          <p>Đăng nhập để quản lý và vận hành hệ thống sân thể thao</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-error-alert" role="alert">
            <AlertCircle size={18} className="login-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={e => { e.preventDefault(); doLogin(username, password); }} className="login-form">
          {/* Username Input */}
          <div className="login-field-group">
            <label className="login-label" htmlFor="username">
              Tên đăng nhập
            </label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <User size={18} />
              </span>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="Nhập tên đăng nhập của bạn..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="login-field-group">
            <label className="login-label" htmlFor="password">
              Mật khẩu
            </label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`login-submit-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập hệ thống</span>
                <ArrowRight size={18} className="login-btn-icon" />
              </>
            )}
          </button>
        </form>

        {/* Quick login divider */}
        <div className="lf-divider">
          <span>Hoặc đăng nhập nhanh</span>
        </div>

        {/* Quick login cards */}
        <div className="lf-quick-grid">
          <button
            type="button"
            className="lf-quick-card admin"
            onClick={() => doLogin('admin', 'admin123')}
            disabled={loading}
          >
            <div className="lf-quick-icon">
              <ShieldCheck size={20} />
            </div>
            <div className="lf-quick-info">
              <div className="lf-quick-role">Quản lý (Admin)</div>
              <div className="lf-quick-cred">admin / admin123</div>
            </div>
            <div className="lf-quick-action">
              <Zap size={13} />
              <span>Dùng thử</span>
            </div>
          </button>

          <button
            type="button"
            className="lf-quick-card staff"
            onClick={() => doLogin('staff', 'staff123')}
            disabled={loading}
          >
            <div className="lf-quick-icon">
              <UserCheck size={20} />
            </div>
            <div className="lf-quick-info">
              <div className="lf-quick-role">Nhân viên (Staff)</div>
              <div className="lf-quick-cred">staff / staff123</div>
            </div>
            <div className="lf-quick-action">
              <Zap size={13} />
              <span>Dùng thử</span>
            </div>
          </button>
        </div>

        <p className="login-copy">© 2025 SportBooking Pro · Thực hiện bởi Nhóm 14</p>
      </div>

      {/* ===== RIGHT: VISUAL PANEL ===== */}
      <div className="login-visual-panel">
        {/* Background image */}
        <img src="/login_bg.jpg" alt="Sports facility banner" className="login-bg-img" />

        {/* High-contrast multi-layer overlay */}
        <div className="login-visual-overlay" />

        {/* Content on top of image */}
        <div className="login-visual-content">
          <div className="lv-badge">
            <Sparkles size={14} className="lv-badge-icon" />
            <span>Hệ thống thông minh thế hệ mới</span>
          </div>

          <h2 className="lv-title">
            Quản lý sân thể thao
            <span className="lv-title-gradient">chuyên nghiệp hơn</span>
          </h2>

          <p className="lv-subtitle">
            Tích hợp AI đề xuất khung giờ thông minh · Đặt lịch realtime · Phân tích doanh thu chuyên sâu
          </p>

          <div className="lv-features">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="lv-feat">
                <div className="lv-feat-icon">
                  <Icon size={16} />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Floating stats cards */}
          <div className="lv-stats">
            <div className="lv-stat-card">
              <div className="lv-stat-val">99.9%</div>
              <div className="lv-stat-lbl">Uptime</div>
            </div>
            <div className="lv-stat-card">
              <div className="lv-stat-val">AI</div>
              <div className="lv-stat-lbl">Tích hợp</div>
            </div>
            <div className="lv-stat-card">
              <div className="lv-stat-val">24/7</div>
              <div className="lv-stat-lbl">Khung giờ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
