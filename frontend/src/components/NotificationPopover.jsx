import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Clock, 
  AlertCircle, 
  Wrench, 
  CheckCheck, 
  CheckCircle, 
  RotateCw, 
  X, 
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Flame
} from 'lucide-react';
import { bookingsAPI, maintenanceAPI, courtsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/Toast';
import './NotificationPopover.css';

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function NotificationPopover({ isOpen, onClose, onCountChange }) {
  const navigate = useNavigate();
  const popoverRef = useRef(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const storageKey = `sportbooking_read_notifications_${user?.id || user?.role || 'default'}`;

  const [rawBookings, setRawBookings] = useState([]);
  const [rawMaintenance, setRawMaintenance] = useState([]);
  const [rawCourts, setRawCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'

  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setReadIds(saved ? JSON.parse(saved) : []);
    } catch {
      setReadIds([]);
    }
  }, [storageKey]);

  // Lưu readIds vào localStorage
  const markAsRead = (id) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem(storageKey, JSON.stringify(allIds));
  };

  // Tải dữ liệu từ APIs
  const fetchNotificationData = async () => {
    setLoading(true);
    try {
      const [bData, mData, cData] = await Promise.all([
        bookingsAPI.getAll().catch(() => []),
        maintenanceAPI.getAll().catch(() => []),
        courtsAPI.getAll().catch(() => [])
      ]);
      setRawBookings(Array.isArray(bData) ? bData : []);
      setRawMaintenance(Array.isArray(mData) ? mData : []);
      setRawCourts(Array.isArray(cData) ? cData : []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu thông báo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationData();
    // Tự động kiểm tra làm mới dữ liệu mỗi 60 giây
    const interval = setInterval(fetchNotificationData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Xử lý nút hành động trực tiếp của Admin (Chuyển sang Đang sửa hoặc Hoàn tất)
  const handleActionUpdateStatus = async (e, scheduleId, newStatus, courtName) => {
    e.stopPropagation();
    setUpdatingId(scheduleId);
    try {
      await maintenanceAPI.update(scheduleId, { status: newStatus });
      showToast({
        type: 'success',
        message: newStatus === 'in_progress'
          ? `Đã chuyển sân "${courtName}" sang trạng thái Đang bảo trì!`
          : `Đã hoàn tất bảo trì cho sân "${courtName}"!`
      });
      // Clear all maintenance-related read IDs for this schedule so next phase alerts trigger cleanly
      setReadIds((prev) => {
        const filtered = prev.filter(id => !id.includes(`-${scheduleId}`));
        localStorage.setItem(storageKey, JSON.stringify(filtered));
        return filtered;
      });
      await fetchNotificationData();
    } catch (err) {
      showToast({
        type: 'error',
        message: err.response?.data?.detail?.message || err.response?.data?.detail || 'Thao tác cập nhật thất bại'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Xử lý tạo danh sách thông báo theo phân quyền và nghiệp vụ thời gian thực
  const notifications = useMemo(() => {
    const list = [];
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

    const sevenDaysAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = `${sevenDaysAgoDate.getFullYear()}-${String(sevenDaysAgoDate.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgoDate.getDate()).padStart(2, '0')}`;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const courtsMap = (rawCourts || []).reduce((acc, c) => {
      acc[c.id] = c.name;
      return acc;
    }, {});

    // ==========================================
    // 1. THÔNG BÁO BẢO TRÌ SÂN (MAINTENANCE):
    // Phục vụ cả Quản trị viên (có nút thao tác 1-Click) và Nhân viên (có thông tin cảnh báo)
    // ==========================================
    rawMaintenance.forEach((mItem) => {
      const courtName = mItem.court_name || mItem.court?.name || courtsMap[mItem.court_id] || `Sân #${mItem.court_id}`;

      // 1.1 Đang ở trạng thái KẾ HOẠCH (planned):
      if (mItem.status === 'planned') {
        // A) Bắt đầu hôm nay
        if (mItem.start_date === todayStr) {
          list.push({
            id: `maint-start-today-${mItem.id}`,
            type: 'maint_start',
            title: `⚡ ${courtName} bắt đầu bảo trì hôm nay`,
            desc: `Kế hoạch thi công (${formatDateVN(mItem.start_date)} đến ${formatDateVN(mItem.end_date)}): ${mItem.reason || 'Bảo dưỡng định kỳ'}. ${isAdmin ? 'Bấm nút bên dưới để chuyển sang "Đang sửa" và khóa sân.' : 'Lễ tân lưu ý không nhận lịch đặt sân!'}`,
            timeBadge: 'Bắt đầu hôm nay',
            severity: 'warning',
            link: '/maintenance',
            createdAt: mItem.start_date,
            action: isAdmin ? {
              label: 'Chuyển sang Đang bảo trì',
              icon: 'wrench',
              status: 'in_progress',
              scheduleId: mItem.id,
              courtName,
              variant: 'warning'
            } : null,
            planData: !isAdmin ? {
              courtName,
              startDate: mItem.start_date,
              endDate: mItem.end_date,
              reason: mItem.reason || 'Bảo dưỡng định kỳ',
              status: 'Kế hoạch bảo trì'
            } : null
          });
        }
        // B) Quá hạn ngày bắt đầu mà chưa kích hoạt
        else if (mItem.start_date < todayStr) {
          list.push({
            id: `maint-start-overdue-${mItem.id}`,
            type: 'maint_overdue_start',
            title: `🚨 ${courtName} đã quá hạn bắt đầu bảo trì!`,
            desc: `Lịch dự kiến bắt đầu từ ${formatDateVN(mItem.start_date)} nhưng chưa được kích hoạt thi công. ${isAdmin ? 'Vui lòng bấm kích hoạt thi công ngay hoặc dời ngày.' : 'Lễ tân chú ý kiểm tra tình trạng sân.'}`,
            timeBadge: 'Quá hạn bắt đầu',
            severity: 'danger',
            link: '/maintenance',
            createdAt: mItem.start_date,
            action: isAdmin ? {
              label: 'Bắt đầu bảo trì ngay',
              icon: 'wrench',
              status: 'in_progress',
              scheduleId: mItem.id,
              courtName,
              variant: 'warning'
            } : null
          });
        }
        // C) Bắt đầu ngày mai
        else if (mItem.start_date === tomorrowStr) {
          list.push({
            id: `maint-tomorrow-${mItem.id}`,
            type: 'maint_tomorrow',
            title: `🔔 Ngày mai: ${courtName} bắt đầu bảo dưỡng`,
            desc: `Dự kiến bảo trì từ ngày mai (${formatDateVN(mItem.start_date)}) đến ${formatDateVN(mItem.end_date)}: ${mItem.reason || 'Bảo dưỡng định kỳ'}. Chuẩn bị kỹ thuật & ngừng nhận khách.`,
            timeBadge: 'Ngày mai',
            severity: 'info',
            link: '/maintenance',
            createdAt: mItem.start_date,
            planData: {
              courtName,
              startDate: mItem.start_date,
              endDate: mItem.end_date,
              reason: mItem.reason || 'Bảo dưỡng định kỳ',
              status: 'Kế hoạch ngày mai'
            }
          });
        }
        // D) Kế hoạch sắp tới trong tương lai
        else if (mItem.start_date > tomorrowStr) {
          list.push({
            id: `maint-upcoming-${mItem.id}`,
            type: 'maint_upcoming',
            title: `Kế hoạch bảo trì: ${courtName}`,
            desc: `Dự kiến bảo dưỡng từ ${formatDateVN(mItem.start_date)} đến ${formatDateVN(mItem.end_date)}: ${mItem.reason || 'Bảo dưỡng định kỳ'}.`,
            timeBadge: `Từ ${formatDateVN(mItem.start_date)}`,
            severity: 'info',
            link: '/maintenance',
            createdAt: mItem.start_date,
            planData: {
              courtName,
              startDate: mItem.start_date,
              endDate: mItem.end_date,
              reason: mItem.reason || 'Bảo dưỡng định kỳ',
              status: 'Kế hoạch tương lai'
            }
          });
        }
      }

      // 1.2 Đang ở trạng thái THI CÔNG (in_progress):
      else if (mItem.status === 'in_progress') {
        // A) Đến hạn kết thúc hôm nay
        if (mItem.end_date === todayStr) {
          list.push({
            id: `maint-due-today-${mItem.id}`,
            type: 'maint_due',
            title: `🏁 ${courtName} đến hạn kết thúc bảo trì hôm nay`,
            desc: `Lịch bảo trì (${formatDateVN(mItem.start_date)} đến ${formatDateVN(mItem.end_date)}) đã đến hạn xong. ${isAdmin ? 'Vui lòng nghiệm thu và bấm nút để mở lại sân đón khách.' : 'Chờ quản lý nghiệm thu mở lại sân.'}`,
            timeBadge: 'Đến hạn xong',
            severity: 'warning',
            link: '/maintenance',
            createdAt: mItem.end_date,
            action: isAdmin ? {
              label: 'Nghiệm thu & Mở sân',
              icon: 'check',
              status: 'done',
              scheduleId: mItem.id,
              courtName,
              variant: 'success'
            } : null
          });
        }
        // B) ĐÃ QUÁ HẠN KẾT THÚC (end_date < todayStr)
        else if (mItem.end_date < todayStr) {
          list.push({
            id: `maint-overdue-due-${mItem.id}`,
            type: 'maint_overdue',
            title: `🚨 CẢNH BÁO: ${courtName} đã quá hạn bảo trì!`,
            desc: `Lịch bảo dưỡng dự kiến xong ngày ${formatDateVN(mItem.end_date)}. Sân vẫn đang bị khóa thi công. ${isAdmin ? 'Bấm nút để hoàn tất nghiệm thu và mở lại sân ngay!' : 'Sân đang quá hạn thi công.'}`,
            timeBadge: 'Quá hạn mở sân',
            severity: 'danger',
            link: '/maintenance',
            createdAt: mItem.end_date,
            action: isAdmin ? {
              label: 'Nghiệm thu & Mở sân ngay',
              icon: 'check',
              status: 'done',
              scheduleId: mItem.id,
              courtName,
              variant: 'success'
            } : null
          });
        }
        // C) Đang thi công bình thường (end_date > todayStr)
        else {
          list.push({
            id: `maint-active-${mItem.id}`,
            type: 'maintenance',
            title: `🔧 ${courtName} đang trong thời gian bảo trì`,
            desc: `Đang sửa từ ${formatDateVN(mItem.start_date)} đến ${formatDateVN(mItem.end_date)}: ${mItem.reason || 'Bảo dưỡng định kỳ'}. Sân đang tạm khóa.`,
            timeBadge: 'Đang bảo trì',
            severity: 'info',
            link: '/maintenance',
            createdAt: mItem.start_date,
            planData: {
              courtName,
              startDate: mItem.start_date,
              endDate: mItem.end_date,
              reason: mItem.reason || 'Bảo dưỡng định kỳ',
              status: 'Đang bảo dưỡng'
            }
          });
        }
      }

      // 1.3 Đã hoàn thành bảo trì trong 7 ngày gần đây
      else if (['done', 'completed'].includes(mItem.status) && mItem.end_date >= sevenDaysAgo) {
        list.push({
          id: `maint-done-${mItem.id}`,
          type: 'maint_done',
          title: `✅ ${courtName} đã bảo trì xong & mở lại`,
          desc: `Lịch bảo dưỡng (kết thúc ${formatDateVN(mItem.end_date)}) đã nghiệm thu hoàn tất. Sân sẵn sàng tiếp nhận khách đặt!`,
          timeBadge: 'Đã xong',
          severity: 'success',
          link: '/schedule',
          createdAt: mItem.end_date
        });
      }
    });

    // ==========================================
    // 2. THÔNG BÁO ĐƠN ĐẶT SÂN & THU TIỀN (BOOKINGS):
    // Chỉ dành riêng cho Nhân viên Lễ tân (Staff) trực tiếp điều phối và thu tiền
    // Admin không trực tiếp thu ngân nên không hiển thị nhóm này
    // ==========================================
    if (!isAdmin) {
      rawBookings.forEach((b) => {
        const slot = b.time_slot;
        const courtName = b.court?.name || courtsMap[b.court_id] || `Sân #${b.court_id}`;
        const customerName = b.customer?.full_name || 'Khách đặt';
        const slotDate = slot?.date || '';
        const startTime = slot?.start_time?.slice(0, 5) || '';
        const endTime = slot?.end_time?.slice(0, 5) || '';

        let isPast = false;
        let slotStartMinutes = 0;
        if (slotDate && startTime) {
          if (slotDate < todayStr) {
            isPast = true;
          } else if (slotDate === todayStr) {
            const [sh, sm] = startTime.split(':').map(Number);
            slotStartMinutes = sh * 60 + sm;
            if (slotStartMinutes <= currentMinutes) {
              isPast = true;
            }
          }
        }

        // 2.1 Đơn chờ duyệt (Pending)
        if (b.status === 'pending') {
          if (isPast) {
            list.push({
              id: `booking-overdue-${b.id}`,
              type: 'overdue',
              title: `Đơn #${b.id} đã quá giờ chơi chưa duyệt`,
              desc: `${courtName} • Khung ${startTime} - ${endTime} (${formatDateVN(slotDate)}) chưa xác nhận`,
              timeBadge: 'Quá hạn',
              severity: 'danger',
              link: '/bookings',
              createdAt: b.created_at || slotDate
            });
          } else {
            list.push({
              id: `booking-pending-${b.id}`,
              type: 'pending',
              title: `Đơn đặt sân mới chờ xác nhận #${b.id}`,
              desc: `${customerName} đặt ${courtName} lúc ${startTime} - ${endTime} (${formatDateVN(slotDate)})`,
              timeBadge: 'Chờ duyệt',
              severity: 'warning',
              link: '/bookings',
              createdAt: b.created_at || slotDate
            });
          }
        }

        // 2.2 Trận đấu hôm nay (Confirmed)
        if (b.status === 'confirmed' && slotDate === todayStr && !isPast) {
          const [sh, sm] = startTime.split(':').map(Number);
          const slotStartMin = sh * 60 + sm;
          const diffMinutes = slotStartMin - currentMinutes;

          // A) SÁT GIỜ CHƠI (Trong vòng 60 phút tới): ID MỚI ĐỂ CHUÔNG TỰ ĐỘNG BẬT CHẤM ĐỎ LẠI!
          if (diffMinutes > 0 && diffMinutes <= 60) {
            list.push({
              id: `booking-imminent-${b.id}`,
              type: 'imminent',
              title: `🔥 Sắp bắt đầu sau ${diffMinutes} phút: ${courtName}`,
              desc: `Trận đấu của ${customerName} (${startTime} - ${endTime}) sắp diễn ra! Vui lòng chuẩn bị sân, bật đèn và đón khách.`,
              timeBadge: `Còn ${diffMinutes}p`,
              severity: 'imminent',
              link: '/schedule',
              createdAt: b.created_at || slotDate
            });
          }
          // B) Trận đấu hôm nay nhưng còn xa (> 60 phút)
          else if (diffMinutes > 60) {
            list.push({
              id: `booking-today-${b.id}`,
              type: 'today_upcoming',
              title: `Lịch đấu hôm nay: ${courtName} lúc ${startTime}`,
              desc: `${customerName} • Trận đấu diễn ra lúc ${startTime} - ${endTime} hôm nay.`,
              timeBadge: `Hôm nay ${startTime}`,
              severity: 'info',
              link: '/schedule',
              createdAt: b.created_at || slotDate
            });
          }
        }

        // 2.3 Sân đã hoàn thành trận đấu nhưng CHƯA THU ĐỦ TIỀN
        let isEnded = false;
        if (slotDate && endTime) {
          if (slotDate < todayStr) {
            isEnded = true;
          } else if (slotDate === todayStr) {
            const [eh, em] = endTime.split(':').map(Number);
            const slotEndMinutes = eh * 60 + em;
            if (slotEndMinutes <= currentMinutes) {
              isEnded = true;
            }
          }
        }

        const paidPayments = b.payments?.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0) || 0;
        const totalPaid = paidPayments + (b.deposit_amount || 0);
        const remainingAmount = Math.max(0, (b.total_amount || 0) - totalPaid);

        if (b.status === 'confirmed' && isEnded && remainingAmount > 0) {
          list.push({
            id: `booking-collect-${b.id}`,
            type: 'collect',
            title: `${courtName} đã kết thúc • Cần thu tiền`,
            desc: `Khách: ${customerName} (Trận ${startTime} - ${endTime}). Còn thiếu: ${remainingAmount.toLocaleString('vi-VN')}đ`,
            timeBadge: 'Cần thu tiền',
            severity: 'collect',
            link: '/payments',
            createdAt: b.created_at || slotDate
          });
        }
      });
    }

    return list;
  }, [isAdmin, rawBookings, rawMaintenance, rawCourts]);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  useEffect(() => {
    onCountChange?.(unreadCount);
  }, [unreadCount, onCountChange]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !readIds.includes(n.id));
    }
    return notifications;
  }, [notifications, activeTab, readIds]);

  const handleItemClick = (item) => {
    markAsRead(item.id);
    if (item.planData) {
      setSelectedPlanModal(item.planData);
      return;
    }
    onClose();
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleGoToSchedulePlan = (plan) => {
    onClose();
    setSelectedPlanModal(null);
    navigate(`/schedule?date=${plan.startDate}`);
  };

  if (!isOpen && !selectedPlanModal) return null;

  return (
    <>
      {isOpen && (
        <div className="notif-popover-overlay" onClick={onClose}>
          <div 
            className="notif-popover-card" 
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="notif-header">
              <div className="notif-header-left">
                <div className="notif-header-icon">
                  <Bell size={17} />
                </div>
                <div>
                  <h3 className="notif-title">
                    {isAdmin ? 'Thông báo quản trị' : 'Thông báo hệ thống'}
                  </h3>
                  <p className="notif-subtitle">
                    {unreadCount > 0 ? `${unreadCount} thông báo mới cần chú ý` : 'Không có thông báo chưa đọc'}
                  </p>
                </div>
              </div>
              <div className="notif-header-actions">
                <button 
                  className="notif-tool-btn" 
                  onClick={fetchNotificationData} 
                  title="Làm mới dữ liệu"
                  disabled={loading}
                >
                  <RotateCw size={14} className={loading ? 'spin' : ''} />
                </button>
                {unreadCount > 0 && (
                  <button 
                    className="notif-tool-btn" 
                    onClick={markAllAsRead} 
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck size={15} />
                  </button>
                )}
                <button className="notif-tool-btn" onClick={onClose} title="Đóng">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="notif-tabs">
              <button 
                className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tất cả <span className="tab-count">{notifications.length}</span>
              </button>
              <button 
                className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                Chưa đọc <span className="tab-count unread">{unreadCount}</span>
              </button>
            </div>

            {/* List Content */}
            <div className="notif-body">
              {filteredNotifications.length === 0 ? (
                <div className="notif-empty">
                  <div className="notif-empty-icon">
                    <CheckCheck size={28} />
                  </div>
                  <p className="notif-empty-title">Không có thông báo nào</p>
                  <p className="notif-empty-desc">
                    {activeTab === 'unread' 
                      ? 'Bạn đã đọc tất cả thông báo.' 
                      : (isAdmin 
                          ? 'Hiện không có lịch bảo trì nào đến hạn cần duyệt.' 
                          : 'Mọi hoạt động sân và lịch đặt đều đang được xử lý tốt!')}
                  </p>
                </div>
              ) : (
                <div className="notif-list">
                  {filteredNotifications.map((item) => {
                    const isRead = readIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`notif-item ${isRead ? 'read' : 'unread'} ${item.severity}`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className={`notif-item-icon ${item.severity}`}>
                          {item.severity === 'imminent' && <Flame size={16} />}
                          {item.severity === 'warning' && <Clock size={16} />}
                          {item.severity === 'success' && <CheckCircle size={16} />}
                          {item.severity === 'danger' && <AlertCircle size={16} />}
                          {item.severity === 'info' && <Wrench size={16} />}
                          {item.severity === 'collect' && <CreditCard size={16} />}
                        </div>

                        <div className="notif-item-content">
                          <div className="notif-item-header">
                            <span className="notif-item-title">{item.title}</span>
                            <span className="notif-item-badge">{item.timeBadge}</span>
                          </div>
                          <p className="notif-item-desc">{item.desc}</p>

                          {/* Action Button dành cho Admin (Bắt đầu / Hoàn tất bảo trì) */}
                          {item.action && (
                            <div className="notif-item-actions">
                              <button
                                type="button"
                                className={`notif-action-btn ${item.action.variant || 'warning'}`}
                                disabled={updatingId === item.action.scheduleId}
                                onClick={(e) => handleActionUpdateStatus(e, item.action.scheduleId, item.action.status, item.action.courtName)}
                              >
                                {item.action.icon === 'check' ? <CheckCircle size={13} /> : <Wrench size={13} />}
                                {updatingId === item.action.scheduleId ? 'Đang cập nhật...' : item.action.label}
                              </button>
                            </div>
                          )}

                          {/* Nút Xem chi tiết kế hoạch dành cho Lễ tân */}
                          {item.planData && (
                            <div className="notif-item-actions">
                              <button
                                type="button"
                                className="notif-action-btn primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(item.id);
                                  setSelectedPlanModal(item.planData);
                                }}
                              >
                                <Calendar size={13} />
                                Xem chi tiết kế hoạch ngày
                              </button>
                            </div>
                          )}
                        </div>

                        {!isRead && <span className="notif-unread-dot" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Kế hoạch Bảo trì cho Lễ tân */}
      {selectedPlanModal && (
        <div className="maint-plan-modal-overlay" onClick={() => setSelectedPlanModal(null)}>
          <div className="maint-plan-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="maint-plan-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: '#FEF3C7', color: '#D97706',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                    Kế hoạch Bảo trì Sân
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Thông tin hiển thị cho Lễ tân điều phối sân
                  </span>
                </div>
              </div>
              <button 
                className="notif-tool-btn" 
                onClick={() => setSelectedPlanModal(null)}
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            <div className="maint-plan-modal-body">
              <div className="maint-plan-info-box">
                <div className="maint-plan-info-row">
                  <span className="maint-plan-label">Sân bảo trì:</span>
                  <span className="maint-plan-val" style={{ fontSize: '0.92rem', color: '#0F172A' }}>
                    {selectedPlanModal.courtName}
                  </span>
                </div>
                <div className="maint-plan-info-row">
                  <span className="maint-plan-label">Thời gian bắt đầu:</span>
                  <span className="maint-plan-val">{formatDateVN(selectedPlanModal.startDate)}</span>
                </div>
                <div className="maint-plan-info-row">
                  <span className="maint-plan-label">Thời gian kết thúc:</span>
                  <span className="maint-plan-val">{formatDateVN(selectedPlanModal.endDate)}</span>
                </div>
                <div className="maint-plan-info-row">
                  <span className="maint-plan-label">Lý do bảo dưỡng:</span>
                  <span className="maint-plan-val">{selectedPlanModal.reason}</span>
                </div>
                <div className="maint-plan-info-row">
                  <span className="maint-plan-label">Trạng thái:</span>
                  <span className="maint-plan-val" style={{ color: '#D97706' }}>
                    {selectedPlanModal.status}
                  </span>
                </div>
              </div>

              <div className="maint-plan-alert">
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1, color: '#DC2626' }} />
                <div>
                  <strong>Lưu ý nghiệp vụ lễ tân:</strong>
                  <div style={{ marginTop: 2 }}>
                    Trong khoảng thời gian từ ngày <strong>{formatDateVN(selectedPlanModal.startDate)}</strong> đến <strong>{formatDateVN(selectedPlanModal.endDate)}</strong>, sân <strong>{selectedPlanModal.courtName}</strong> sẽ tạm ngưng phục vụ để bảo dưỡng. Vui lòng không nhận lịch đặt sân mới hoặc chuyển khách sang sân khác.
                  </div>
                </div>
              </div>
            </div>

            <div className="maint-plan-modal-footer">
              <button
                type="button"
                className="notif-tool-btn"
                style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 600 }}
                onClick={() => setSelectedPlanModal(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="notif-action-btn primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                onClick={() => handleGoToSchedulePlan(selectedPlanModal)}
              >
                <span>Xem lịch ngày {formatDateVN(selectedPlanModal.startDate)}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
