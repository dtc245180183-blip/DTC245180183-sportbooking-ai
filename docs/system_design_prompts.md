# BỘ 3 PROMPT CHI TIẾT THIẾT KẾ HỆ THỐNG QUẢN LÝ SÂN THỂ THAO TÍCH HỢP AI
## Dự án: SportBooking Pro | Môn học: Ứng dụng Trí tuệ Nhân tạo (AIA331) - Nhóm 14

> **Mục đích:** Bộ prompt này được chuẩn hóa chuyên sâu theo quy trình kỹ nghệ phần mềm, sẵn sàng sử dụng để yêu cầu các mô hình AI cao cấp (như Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro) thiết kế trọn vẹn từ Kiến trúc tổng thể, Cơ sở dữ liệu đến Tích hợp AI và Giao diện UI/UX cho hệ thống SportBooking Pro.

---

## PROMPT 1: THIẾT KẾ KIẾN TRÚC HỆ THỐNG & LUỒNG NGHIỆP VỤ CỐT LÕI
### (System Architecture, Concurrency Control & Core Business Workflows)

```markdown
Bạn là một Kiến trúc sư Hệ thống Phần mềm Cấp cao (Senior Software Architect) với hơn 10 năm kinh nghiệm thiết kế các hệ thống đặt chỗ thời gian thực (Real-time Booking & Reservation Systems) và hệ thống tài chính phân tán.

Hãy thiết kế bản đặc tả kiến trúc kỹ thuật chi tiết cho dự án: "Hệ thống Quản lý Sân Thể Thao Tích Hợp AI (SportBooking Pro)" với các yêu cầu cụ thể sau:

1. BỐI CẢNH & CÔNG NGHỆ CHÍNH:
   - Backend: FastAPI (Python 3.11), SQLAlchemy ORM, Pydantic v2, Alembic.
   - Frontend: React 18 (Vite, TailwindCSS, Lucide Icons, Axios, React Router v6).
   - Cơ sở dữ liệu: SQLite (cho môi trường Dev/Demo) và PostgreSQL (cho Production).
   - Xác thực: JWT (JSON Web Token) kết hợp băm mật khẩu Bcrypt.
   - Phân quyền (RBAC): 2 vai trò Quản trị viên (Admin) và Nhân viên Lễ tân (Staff).

2. YÊU CẦU THIẾT KẾ KIẾN TRÚC & LUỒNG DỮ LIỆU:
   a. Thiết kế sơ đồ kiến trúc tổng thể (Layered Architecture): Presentation Layer, API Routing Layer, Service/Business Logic Layer, Data Access Layer (Repository/ORM), và Third-party Integration Layer (Google Gemini API).
   b. Cơ chế xử lý tranh chấp & chống trùng lịch đồng thời (Concurrency Control):
      - Trình bày chi tiết giải pháp khóa bi quan (Pessimistic Locking) trong CSDL bằng câu lệnh `SELECT ... FOR UPDATE` (với SQLAlchemy: `.with_for_update()`).
      - Phân tích kịch bản 2 nhân viên cùng bấm đặt 1 khung giờ tại cùng 1 mili-giây: cơ chế bắt lỗi `HTTP 409 Conflict`, tự động rollback transaction và điều hướng người dùng sang trợ lý AI gợi ý khung giờ thay thế.
   c. Luồng nghiệp vụ tài chính & Quản lý tiền cọc (Financial & Deposit Settlement Workflow):
      - Luồng 1: Khách đặt sân có cọc (deposit_amount > 0) -> Trạng thái đơn `pending`.
      - Luồng 2: Xác nhận đơn (`pending` -> `confirmed`).
      - Luồng 3: Quyết toán khi khách trả sân -> Thu nốt số tiền còn lại. Khi `tổng tiền đã thu + tiền cọc >= tổng giá trị sân` -> Tự động chuyển đơn sang `completed`.
      - Luồng 4: Chặn thu vượt quá số tiền còn nợ (Overpayment Prevention) và chặn thu tiền cho đơn đã bị hủy.
      - Luồng 5: Hủy đặt sân linh hoạt:
        + Tùy chọn 1 (Giữ cọc): Nếu khách hủy sát giờ -> Đơn chuyển `cancelled`, khung giờ được giải phóng (`available`), tiền cọc chuyển vào danh mục cọc giữ sau hủy để tính vào doanh thu giữ lại.
        + Tùy chọn 2 (Hoàn cọc): Nếu khách hủy có lý do chính đáng (mưa bão, sự cố kỹ thuật) -> Tự động sinh giao dịch hoàn tiền (`refunded`), hoàn trả cọc cho khách, khấu trừ doanh thu.

3. YÊU CẦU ĐẦU RA:
   - Sơ đồ kiến trúc Mermaid (C4 Model Context & Container Diagram).
   - Sequence Diagram (Mermaid) cho luồng Đặt sân có khóa Concurrency và luồng Quyết toán hoàn cọc.
   - Bảng quy định mã trạng thái HTTP, cấu trúc chuẩn của API Response và Error Handling chuẩn RESTful.
```

---

## PROMPT 2: THIẾT KẾ CƠ SỞ DỮ LIỆU, TOÀN VẸN DỮ LIỆU & BÁO CÁO TÀI CHÍNH
### (Database Schema Design, Constraints, Relations & Financial Analytics)

```markdown
Bạn là một Chuyên gia Cơ sở Dữ liệu & Thiết kế Hệ thống Dữ liệu (Lead Database Architect & Data Engineer).

Hãy thiết kế bản đặc tả Cơ sở Dữ liệu quan hệ hoàn chỉnh (Relational Database Specification) cho hệ thống "SportBooking Pro" nhằm đáp ứng đầy đủ tính toàn vẹn dữ liệu, hiệu năng truy vấn cao và phục vụ bóc tách tài chính chính xác.

YÊU CẦU THIẾT KẾ CHI TIẾT:

1. THIẾT KẾ CÁC THỰC THỂ & BẢNG DỮ LIỆU (SCHEMA DESIGN):
   - `users`: id, username, email, hashed_password, full_name, role ('admin' | 'staff'), is_active, created_at.
   - `court_types`: id, name (Sân bóng đá mini, Sân cầu lông, Sân tennis,...), description.
   - `courts`: id, court_type_id, name, price_per_hour, status ('active' | 'maintenance' | 'inactive'), image_url, created_at.
   - `time_slots`: id, court_id, date, start_time, end_time, price, status ('available' | 'booked' | 'blocked'). Đảm bảo composite unique index (court_id, date, start_time).
   - `customers`: id, full_name, phone (unique, index), email, notes, created_at.
   - `bookings`: id, customer_id, court_id, time_slot_id, staff_id, status ('pending' | 'confirmed' | 'completed' | 'cancelled'), deposit_amount, total_amount, note, created_at, updated_at.
   - `payments`: id, booking_id, amount, method ('cash' | 'transfer' | 'momo'), status ('paid' | 'refunded' | 'pending'), paid_at, note.
   - `maintenance_schedules`: id, court_id, start_date, end_date, reason, status ('scheduled' | 'in_progress' | 'completed'), created_by.
   - `ai_logs`: id, user_id, feature_type ('suggest_slot' | 'generate_message' | 'business_insights'), input_prompt, raw_response, response_time_ms, created_at.

2. CÁC RÀNG BUỘC TOÀN VẸN & INDEX:
   - Khóa chính, Khóa ngoại với hành vi `ON DELETE RESTRICT` / `ON DELETE CASCADE` phù hợp để chống mồ côi dữ liệu.
   - Ràng buộc kiểm tra (Check Constraints): `deposit_amount >= 0`, `total_amount >= 0`, `amount > 0` trong bảng payments.
   - Ràng buộc logic thời gian: `end_time > start_time`, `end_date >= start_date`.
   - Chiến lược đánh chỉ mục (Indexes) để tối ưu truy vấn: tìm kiếm khách theo SĐT, lọc slot theo ngày và sân, tính toán thống kê doanh thu theo khoảng ngày `paid_at`.

3. CÔNG THỨC & LOGIC TRUY VẤN BÁO CÁO TÀI CHÍNH:
   - Tổng Doanh Thu Thực Thu:
     Formula = (Tổng Payments có status='paid') + (Tổng deposit_amount của mọi booking) - (Tổng Payments có status='refunded').
   - Phân Tách Minh Bạch Tiền Cọc Đang Giữ (Deposit Breakdown):
     + Cọc đơn hoạt động (`deposit_from_active`): Thuộc các booking đang ở trạng thái `pending` hoặc `confirmed`.
     + Cọc giữ lại sau hủy (`deposit_from_cancelled`): Thuộc các booking có status=`cancelled`, có `deposit_amount > 0` nhưng CHƯA phát sinh giao dịch hoàn tiền (`refunded`).
   - Tỷ lệ lấp đầy sân (Occupancy Rate) theo từng khung giờ và theo từng sân.

4. YÊU CẦU ĐẦU RA:
   - Sơ đồ quan hệ thực thể ERD bằng cú pháp Mermaid.
   - Câu lệnh DDL hoàn chỉnh (SQL DDL Scripts chuẩn PostgreSQL / SQLite).
   - Các câu truy vấn mẫu (Analytical SQL Queries) để lấy số liệu Dashboard tổng quan.
```

---

## PROMPT 3: THIẾT KẾ TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI ENGINE) & GIAO DIỆN NGƯỜI DÙNG (UI/UX)
### (AI Integration, Prompt Engineering, Anti-Hallucination & Premium UI/UX System)

```markdown
Bạn là sự kết hợp giữa một Kỹ sư AI Thực hành (AI/Prompt Engineer) và Chuyên gia Thiết kế Trải nghiệm Người dùng (Product Design / UI-UX Lead).

Hãy thiết kế giải pháp tích hợp Trí tuệ Nhân tạo (Google Gemini) và Hệ thống Giao diện Người dùng (Design System) cho "SportBooking Pro".

YÊU CẦU THIẾT KẾ CHI TIẾT:

1. THIẾT KẾ CÁC TÍNH NĂNG TÍCH HỢP AI (GEMINI SERVICE):
   a. Tính năng 1: Gợi ý Khung Giờ Trống Thông Minh (Smart Slot Suggestion):
      - Kịch bản: Khách muốn đặt sân nhưng khung giờ mong muốn đã kín.
      - Thiết kế Prompt chống bịa đặt (Anti-Hallucination): Backend truy vấn trước các slot đang `available` từ CSDL, sau đó đưa danh sách slot thật này vào System Context để Gemini chỉ được phép chọn và gợi ý trong tập dữ liệu đó.
      - Cơ chế ngắn mạch (Short-circuit optimization): Nếu ngày kiểm tra kín 100% sân, Backend trả về ngay thông báo hết sân, tuyệt đối KHÔNG gọi API Gemini để tiết kiệm token và chi phí.
   b. Tính năng 2: Trợ lý Sinh Tin Nhắn CSKH Tự Động (AI Customer Notification):
      - Loại 1: Tin nhắn xác nhận đặt sân & cọc tiền (Confirmation).
      - Loại 2: Tin nhắn nhắc lịch thi đấu trước giờ bóng lăn (Reminder).
      - Prompt Template: Lấy dữ liệu thật từ booking (Tên khách, Sân, Giờ bắt đầu, Giờ kết thúc, Tiền đã cọc, Tiền còn thiếu, Hotline sân) -> Gemini sinh văn phong lịch sự, ngắn gọn, chuẩn emoji thể thao, tối ưu hiển thị trên Zalo/SMS/Messenger, hỗ trợ nút "Sao chép 1-Click".
   c. Tính năng 3: Nhận Định Chiến Lược Kinh Doanh (AI Business Insights):
      - Backend tổng hợp tỷ lệ lấp đầy (%) theo từng khung giờ từ 06:00 đến 23:00 và doanh thu theo sân.
      - Gemini đóng vai trò Cố vấn Chiến lược: Phân tích khung giờ vàng (Peak hours), khung giờ thấp điểm (Off-peak hours) và đề xuất 2 chương trình khuyến mại/gói hội viên kích cầu doanh số cụ thể.
   d. Cơ chế Giám sát & Ghi Log (AI Audit Logging):
      - Thiết kế middleware tự động ghi nhận vào bảng `ai_logs` (function_name, prompt, response, latency, token_usage) phục vụ nghiệm thu và đánh giá đề tài học phần AIA331.

2. THIẾT KẾ HỆ THỐNG GIAO DIỆN NGƯỜI DÙNG (UI/UX DESIGN SYSTEM):
   - Phong cách: Hiện đại, thể thao cao cấp, tông màu Navy Blue (#1B365D), Accent Blue (#2B6CB0), Emerald Green (#10B981) cho trạng thái Trống, Amber (#F59E0B) cho Đang chờ/Đã cọc, Red (#EF4444) cho Đã đặt/Đã khóa.
   - Các màn hình cốt lõi cần đặc tả layout và tương tác:
     1. Lưới Lịch Đặt Sân (Calendar Grid): Trục ngang là các sân, trục dọc là các khung giờ; hiển thị trạng thái bằng màu sắc trực quan, click vào slot trống mở modal đặt sân siêu tốc.
     2. Bảng Thanh Toán & Đặt Cọc (2 Tab):
        + Tab 1: Thanh toán & Giao dịch (hiển thị danh sách phiếu thu, hình thức, số tiền).
        + Tab 2: Chi tiết thanh toán (bóc tách rõ từng đơn: Tổng tiền, Đã cọc bao nhiêu, Đã thu bao nhiêu, Còn lại phải thu bao nhiêu, badge trạng thái cọc).
     3. Modal Hủy Sân Thông Minh: Cho phép nhân viên lựa chọn "Giữ cọc" hoặc "Hoàn cọc", chọn hình thức hoàn, nhập lý do hủy.
     4. Popup Thống Kê Chi Tiết Tiền Cọc: Khi click vào card "Tiền cọc đang giữ", hiển thị popup phân tách: Cọc từ đơn đang hoạt động vs Cọc phạt giữ lại sau khi hủy.
     5. Bảng Điều Khiển AI (AI Assistant Widget): Khung hội thoại gợi ý slot và xem phân tích biểu đồ doanh thu.

3. YÊU CẦU ĐẦU RA:
   - System Prompts hoàn chỉnh (kèm các biến placeholder `{customer_name}`, `{slot_time}`,...) cho từng use case của Gemini.
   - Thiết kế luồng xử lý lỗi (Error handling) khi API Gemini gặp sự cố (Fallback mechanism).
   - Mô tả chi tiết Component Architecture của Frontend React.
```

---

## HƯỚNG DẪN SỬ DỤNG BỘ PROMPT

1. **Prompt 1 (Kiến trúc & Nghiệp vụ):** Dùng khi cần sinh tài liệu kiến trúc phần mềm, thuyết minh đồ án chương 2 hoặc lập trình khung khung sườn Backend (FastAPI Routers, Services, Concurrency Locking).
2. **Prompt 2 (Cơ sở dữ liệu & Báo cáo):** Dùng khi thiết kế sơ đồ CSDL, sinh các file migration Alembic, viết file schema SQLAlchemy và xây dựng các câu query tính doanh thu, tiền cọc.
3. **Prompt 3 (AI & UI/UX):** Dùng khi cấu hình tích hợp Google Gemini API, viết System Prompt cho backend AI router và thiết kế giao diện người dùng React TailwindCSS.
