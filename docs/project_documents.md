# BÁO CÁO ĐỒ ÁN: HỆ THỐNG QUẢN LÝ SÂN THỂ THAO TÍCH HỢP AI (SPORTBOOKING PRO)

---

## 1. AI LOG (NHẬT KÝ & TÍCH HỢP TRÍ TUỆ NHÂN TẠO)

Trong bối cảnh chuyển đổi số, hệ thống SportBooking Pro không chỉ quản lý dữ liệu thuần túy mà còn tích hợp Trí tuệ nhân tạo (AI - thông qua các mô hình ngôn ngữ lớn như Gemini/OpenAI) nhằm tối ưu hóa quy trình vận hành và hỗ trợ ra quyết định.

### 1.1. Các tính năng AI cốt lõi
1. **AI Booking Suggestion (Trợ lý Gợi ý đặt lịch):** 
   - **Ngữ cảnh:** Khi nhân viên hoặc khách hàng muốn đặt sân vào một khung giờ nhưng đã bị kín lịch (conflict).
   - **Hoạt động:** Trợ lý AI sẽ đọc dữ liệu lịch trống hiện tại của tất cả các sân tương đương, kết hợp với thói quen đặt sân để gợi ý 3-5 khung giờ thay thế tối ưu nhất. 
2. **AI Business Insights (Cố vấn Phân tích Doanh thu):**
   - **Ngữ cảnh:** Quản lý cần đánh giá tình hình kinh doanh cuối tháng.
   - **Hoạt động:** Hệ thống tổng hợp số liệu thô (doanh thu, tỷ lệ lấp đầy, sân được chuộng nhất) và gửi prompt cho AI. AI sẽ tự động phân tích và sinh ra một bản báo cáo tự nhiên, phân tích điểm mạnh/yếu và đưa ra chiến lược kinh doanh cho tháng tới (ví dụ: chạy khuyến mãi vào giờ thấp điểm).

### 1.2. Cơ chế AI Log (Theo dõi và đánh giá)
Để đảm bảo AI hoạt động ổn định và chính xác, toàn bộ tương tác đều được lưu lại (AI Log):
- **Request/Response Log:** Lưu lại nguyên văn Prompt gửi đi và kết quả AI trả về để đối soát.
- **Performance Metrics:** Đo lường độ trễ (Latency - thường yêu cầu < 2 giây cho một tác vụ suy luận) và lượng token tiêu thụ để dự toán chi phí API.
- **Fallback Mechanism:** Ghi nhận các trường hợp AI phản hồi lỗi (timeout, bad request) để hệ thống tự động chuyển về chế độ xử lý truyền thống (không dùng AI) nhằm đảm bảo không gián đoạn dịch vụ.

---

## 2. DATABASE DESIGN (THIẾT KẾ CƠ SỞ DỮ LIỆU)

Cơ sở dữ liệu được thiết kế theo mô hình quan hệ (RDBMS) và thao tác qua **SQLAlchemy ORM**, đảm bảo tính toàn vẹn dữ liệu (ACID) và dễ dàng mở rộng.

### 2.1. Lược đồ các thực thể chính (Entities)

| Bảng (Table) | Mô tả & Cấu trúc (Schema) | Ràng buộc (Constraints) & Quan hệ (Relations) |
| :--- | :--- | :--- |
| **`Users`** | Quản lý tài khoản đăng nhập (Admin, Staff, Customer).<br>• `id` (PK)<br>• `username` (String, Unique)<br>• `password_hash` (String)<br>• `role` (Enum: ADMIN, STAFF)<br>• `created_at` (DateTime) | - Mật khẩu được mã hóa Bcrypt.<br>- Quan hệ `1-N` với bảng `Bookings`. |
| **`Courts`** | Lưu trữ danh mục các sân thể thao.<br>• `id` (PK)<br>• `name` (String)<br>• `type` (String: Bóng đá, Cầu lông...)<br>• `price_per_hour` (Float)<br>• `status` (Enum: ACTIVE, MAINTENANCE) | - `status` quyết định sân có được phép đặt hay không.<br>- Quan hệ `1-N` với `Bookings` và `Maintenances`. |
| **`Bookings`** | Quản lý các giao dịch đặt sân.<br>• `id` (PK)<br>• `user_id` (FK)<br>• `court_id` (FK)<br>• `start_time` (DateTime)<br>• `end_time` (DateTime)<br>• `total_price` (Float)<br>• `status` (Enum: PENDING, CONFIRMED) | - `start_time` và `end_time` phải logic.<br>- Check conflict: Tránh 2 booking trùng thời gian trên cùng 1 sân.<br>- Quan hệ `1-1` với `Payments`. |
| **`Payments`** | Theo dõi hóa đơn và thanh toán.<br>• `id` (PK)<br>• `booking_id` (FK)<br>• `amount` (Float)<br>• `method` (String: CASH, TRANSFER)<br>• `status` (Enum: PAID, UNPAID) | - Ràng buộc khóa ngoại chặt chẽ với `Bookings`. |
| **`Maintenances`**| Lịch trình bảo trì sân bãi.<br>• `id` (PK)<br>• `court_id` (FK)<br>• `description` (Text)<br>• `start_date` (DateTime)<br>• `end_date` (DateTime) | - Khi có record bảo trì, hệ thống tự động khóa sân trong khoảng `start_date` đến `end_date`. |

---

## 3. REQUIREMENTS (YÊU CẦU HỆ THỐNG - SRS)

### 3.1. Yêu cầu chức năng (Functional Requirements)
1. **Module Phân quyền & Bảo mật (Auth & RBAC):**
   - Đăng nhập/Đăng xuất bằng cơ chế bảo mật JWT Token.
   - Admin: Có toàn quyền quản lý nhân sự, hệ thống sân, tài chính.
   - Staff (Nhân viên): Quyền hạn tập trung vào vận hành (tạo booking, thanh toán).
2. **Module Quản lý Vận hành (Operations):**
   - Xem tổng quan các sân dưới dạng lưới/bảng (Dashboard) theo thời gian thực.
   - Đặt sân, hủy sân, thay đổi thời gian (Kèm kiểm tra chống trùng lịch).
   - Đánh dấu trạng thái hỏng hóc, bảo trì của sân bãi.
3. **Module Tài chính (Billing & Reports):**
   - Tính tiền sân tự động dựa trên tổng thời gian và đơn giá giờ.
   - Tổng hợp doanh thu theo ngày/tuần/tháng bằng biểu đồ trực quan.
   - Sử dụng AI để xuất báo cáo đánh giá hiệu quả kinh doanh.

### 3.2. Yêu cầu phi chức năng (Non-Functional Requirements)
- **Công nghệ (Tech Stack):** 
  - Frontend: ReactJS, Vite (tốc độ build nhanh, HMR mượt mà).
  - Backend: FastAPI (Python) cho hiệu suất cao, hỗ trợ Async cực tốt.
- **Giao diện (UI/UX):** 
  - Áp dụng triết lý thiết kế **Premium Dark Mode**, kết hợp hiệu ứng **Glassmorphism** (kính mờ).
  - Giao diện phải tương thích (Responsive) để có thể dùng trên tablet tại quầy lễ tân.
- **Hiệu năng & Bảo mật:**
  - Thời gian phản hồi của các API (đặc biệt là API check lịch trống) phải dưới 300ms.
  - Toàn bộ mật khẩu phải băm (hash) 1 chiều. Các route nhạy cảm đều yêu cầu Bearer Token hợp lệ.

---

## 4. USE CASES (CÁC CA SỬ DỤNG CHI TIẾT)

Dưới đây là đặc tả (Specification) cho các Ca sử dụng (Use Case) trọng tâm nhất của hệ thống nhằm chứng minh luồng nghiệp vụ thực tế.

### UC-01: Quản lý Đặt sân (Create Booking)
- **Actor (Người thực hiện):** Staff (Nhân viên lễ tân).
- **Tiền điều kiện:** Nhân viên đã đăng nhập thành công.
- **Luồng sự kiện chính (Normal Flow):**
  1. Khách hàng yêu cầu đặt sân A từ 18:00 đến 19:30.
  2. Nhân viên mở giao diện Lịch, chọn Sân A và click vào khung giờ tương ứng.
  3. Hệ thống quét database để kiểm tra xung đột (conflict). Nếu sân trống, hệ thống hiển thị form điền thông tin (Tên khách, SĐT).
  4. Nhân viên xác nhận. Hệ thống lưu `Booking`, tạm tính `total_price` và chuyển trạng thái sân sang "Đã đặt".
- **Luồng phụ (AI Gợi ý):**
  - Tại bước 3, nếu sân A đã có người đặt từ 18:00 - 19:00, hệ thống báo lỗi trùng lịch.
  - Lúc này, nhân viên nhấn nút "AI Gợi ý". AI sẽ trả về các lựa chọn: *"Gợi ý 1: Chuyển sang Sân B (đang trống)"* hoặc *"Gợi ý 2: Đặt sân A từ 19:30 - 21:00"*.

### UC-02: Phân tích Kinh doanh bằng AI (Business Analytics)
- **Actor:** Admin (Người quản lý).
- **Tiền điều kiện:** Hệ thống có dữ liệu phát sinh (booking) trong tháng.
- **Luồng sự kiện chính:**
  1. Admin truy cập tab "Báo cáo Doanh thu".
  2. Hệ thống hiển thị biểu đồ Bar/Line chart thống kê số liệu.
  3. Admin nhấn nút **"Nhận định từ AI"**.
  4. Backend đóng gói toàn bộ metadata (Top sân đặt nhiều nhất, tổng doanh thu, số ca hủy) gửi sang Engine AI.
  5. AI phân tích và trả về giao diện một đoạn văn bản tóm tắt chiến lược, ví dụ: *"Sân bóng đá số 1 mang lại 60% doanh thu nhưng tỷ lệ trống vào buổi sáng (8h-11h) rất cao. Đề xuất: Khuyến mãi giảm giá 20% cho học sinh/sinh viên vào khung giờ sáng"*.

### UC-03: Xử lý Thanh toán (Process Payment)
- **Actor:** Staff.
- **Luồng sự kiện chính:**
  1. Khách hàng sử dụng xong dịch vụ và ra quầy thanh toán.
  2. Nhân viên mở phiếu `Booking` tương ứng, hệ thống hiển thị tổng tiền (đã bao gồm thời gian phát sinh nếu có).
  3. Nhân viên chọn phương thức thanh toán (Tiền mặt/Chuyển khoản).
  4. Hệ thống cập nhật bảng `Payments` thành PAID và đổi trạng thái `Booking` thành COMPLETED.

### UC-04: Đóng sân để Bảo trì (Maintenance Lock)
- **Actor:** Admin / Cán bộ kỹ thuật.
- **Luồng sự kiện chính:**
  1. Phát hiện lưới chắn sân Bị rách, cần 2 ngày để sửa.
  2. Admin chọn Sân B, thêm bản ghi Bảo trì (Maintenances) từ ngày X đến ngày Y.
  3. Hệ thống kiểm tra xem trong giai đoạn X->Y có khách nào đã đặt sân B chưa. Nếu có, báo động để nhân viên dời lịch cho khách.
  4. Trạng thái sân B tự động chuyển thành MAINTENANCE, hệ thống khóa toàn bộ thao tác đặt sân B trong giai đoạn này.
