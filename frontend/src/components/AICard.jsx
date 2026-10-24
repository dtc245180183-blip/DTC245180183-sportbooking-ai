import { Sparkles } from 'lucide-react';
import './AICard.css';

/**
 * AICard - Component dùng chung cho tất cả tính năng AI
 * Props:
 *   loading: bool - hiển thị skeleton khi đang chờ AI
 *   title: string - tiêu đề card (optional)
 *   children: ReactNode - nội dung kết quả AI
 *   error: string - thông báo lỗi (nếu có)
 */
export default function AICard({ loading = false, title, children, error }) {
  return (
    <div className="ai-card">
      <div className="ai-card-header">
        <Sparkles size={16} className="ai-card-icon" />
        <span className="ai-card-title">✨ {title || 'Trợ lý AI'}</span>
      </div>

      <div className="ai-card-body">
        {loading ? (
          <div className="ai-card-loading">
            <div className="ai-spinner" />
            <span>AI đang xử lý...</span>
          </div>
        ) : error ? (
          <div className="ai-card-error">{error}</div>
        ) : (
          children
        )}
      </div>

      <div className="ai-card-footer">
        ⚠️ Kết quả AI chỉ mang tính tham khảo. Vui lòng kiểm tra tính chính xác và xác nhận trước khi sử dụng hoặc thực hiện hành động liên quan đến khách hàng.
      </div>
    </div>
  );
}
