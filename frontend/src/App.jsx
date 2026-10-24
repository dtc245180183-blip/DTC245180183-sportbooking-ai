import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Courts from './pages/Courts';
import Customers from './pages/Customers';
import Maintenance from './pages/Maintenance';
import Payments from './pages/Payments';
import TimeSlots from './pages/TimeSlots';
import Users from './pages/Users';
import AIAssistant from './pages/AIAssistant';
import Schedule from './pages/Schedule';
import Reports from './pages/Reports';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import AIFloatingButton from './components/AIFloatingButton';

const ProtectedRoute = ({ children, adminOnly = false, staffOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
      Đang tải...
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  if (staffOnly && user.role === 'admin') return <Navigate to="/" />;

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-body">
          {children}
        </div>
      </div>
      <AIFloatingButton />
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Phân hệ Vận hành trực quầy (Dành riêng cho Nhân viên Staff - UC-03, 04, 05, 06, 07) */}
            <Route path="/schedule" element={<ProtectedRoute staffOnly={true}><Schedule /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute staffOnly={true}><Bookings /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute staffOnly={true}><Customers /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute staffOnly={true}><Payments /></ProtectedRoute>} />

            {/* Phân hệ Quản trị & Chiến lược (Dành riêng cho Quản lý Admin - UC-01, 02, 03, 08, 09) */}
            <Route path="/courts" element={<ProtectedRoute adminOnly={true}><Courts /></ProtectedRoute>} />
            <Route path="/time-slots" element={<ProtectedRoute adminOnly={true}><TimeSlots /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute adminOnly={true}><Maintenance /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute adminOnly={true}><Reports /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly={true}><Users /></ProtectedRoute>} />

            {/* Phân hệ Trợ lý AI (Giao diện hiển thị rạch ròi theo vai trò: Admin -> UC-12; Staff -> UC-10, 11) */}
            <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            <Route path="/ai" element={<Navigate to="/ai-assistant" replace />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
