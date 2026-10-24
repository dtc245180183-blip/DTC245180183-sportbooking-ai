# BÁO CÁO ĐỒ ÁN CUỐI KỲ: HỆ THỐNG QUẢN LÝ SÂN THỂ THAO TÍCH HỢP AI

**Học phần:** AIA331 – Ứng dụng trí tuệ nhân tạo | Mã số: 80302  
**Thành viên:** Nhóm 14 (3 thành viên)  
**Công nghệ sử dụng:** FastAPI (Backend), React/Vite (Frontend), SQLite (CSDL), Gemini API (AI Engine).

---

## 1. MÔ TẢ BÀI TOÁN
Quản lý các cơ sở cho thuê sân thể thao (sân bóng, sân cầu lông, sân tennis...) thường gặp các vấn đề khó khăn như:
- Trùng lịch do nhiều nhân viên xếp lịch đồng thời.
- Việc kiểm tra khung giờ trống tốn thời gian khi khách hàng có các yêu cầu đặc thù.
- Khó khăn trong việc soạn thảo và gửi tin nhắn xác nhận chuẩn xác cho từng khách hàng.
- Thiếu các thống kê nhanh gọn, trực quan về công suất lấp đầy để có phương án giảm giá/khuyến mại.

Hệ thống của nhóm được thiết kế để giải quyết các vấn đề trên thông qua nghiệp vụ đặt sân tối ưu (xử lý concurrency chặt chẽ) và đặc biệt là **tích hợp Trí Tuệ Nhân Tạo (Gemini)** vào lõi hệ thống.

---

## 2. KIẾN TRÚC HỆ THỐNG
Hệ thống tuân theo kiến trúc Client - Server với sự phân tách rõ ràng:
- **Frontend (Client):** Xây dựng bằng ReactJS, giao diện Glassmorphism hiện đại. Giao tiếp với Server qua REST API, sử dụng JWT để duy trì phiên đăng nhập.
- **Backend (Server):** Xây dựng bằng FastAPI (Python). Cung cấp các RESTful API. Áp dụng Dependency Injection để quản lý phiên kết nối Database và xác thực quyền người dùng.
- **AI Service:** Tích hợp `google-generativeai` kết nối tới Gemini 2.0 Flash. Xử lý các tác vụ suy luận văn bản, dữ liệu dựa trên prompt template định nghĩa sẵn ở backend.

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU
Hệ thống bao gồm các bảng chính:
- **users**: Lưu thông tin admin/nhân viên, phân quyền.
- **customers**: Lưu thông tin khách hàng, số điện thoại (có validate format VN).
- **court_types** & **courts**: Quản lý thông tin sân, giá thuê theo loại sân.
- **time_slots**: Lưu danh sách các khung giờ của từng sân theo ngày. 
- **bookings**: Ghi nhận giao dịch đặt sân.
- **payments**: Ghi nhận lịch sử thanh toán (tiền cọc, tiền trả đủ).
- **maintenance_schedules**: Lịch bảo trì sân (tự động khóa sân khi bảo trì).
- **ai_logs**: (Bảng minh chứng) Lưu toàn bộ lịch sử input/output khi gọi Gemini API.

**Cơ chế khóa chống trùng lịch:**
Khi 2 request đến cùng lúc, backend sử dụng `SELECT ... FOR UPDATE` (thông qua `with_for_update()` của SQLAlchemy) để chiếm *Exclusive Lock* trên dòng `time_slot`. Request đến sau sẽ phải đợi request trước commit/rollback, đảm bảo không bao giờ có chuyện 2 khách hàng chiếm cùng 1 sân.

---

## 4. CHỨC NĂNG QUẢN LÝ (CRUD & NGHIỆP VỤ)
1. **Quản lý sân và loại sân**: Thêm, sửa, xóa (soft delete), thay đổi trạng thái (active/inactive).
2. **Quản lý khách hàng**: Tra cứu thông tin khách hàng, lịch sử đặt sân của họ.
3. **Quản lý đặt lịch**: Tạo booking với tiền cọc, hủy lịch (tạo payment giả lập hoàn tiền). Tiền tổng `total_amount` được tính an toàn từ phía Server (giá sân).
4. **Quản lý thanh toán**: Cập nhật trạng thái booking tự động thành `confirmed` ngay khi tổng số tiền đã trả (`paid`) lớn hơn hoặc bằng tổng tiền sân.
5. **Bảo trì**: Khi chuyển trạng thái lịch bảo trì sang `in_progress`, hệ thống tự động đổi trạng thái của sân tương ứng thành `maintenance` (khóa đặt sân).

---

## 5. CHỨC NĂNG TRÍ TUỆ NHÂN TẠO (AI)

Hệ thống tích hợp 3 tính năng AI sâu vào luồng nghiệp vụ. Toàn bộ tính năng đều lọc dữ liệu trong nội bộ CSDL để xây dựng ngữ cảnh (context) trước khi gọi Gemini, tránh hiện tượng AI bịa thông tin.

### 5.1. Gợi ý Khung giờ trống (AI-1)
- **Hoạt động:** Khi khách yêu cầu tìm sân, nhân viên điền loại sân và ngày. Backend truy vấn CSDL lấy danh sách các khung giờ còn trạng thái `available`, đóng gói thành JSON và gửi cho AI.
- **Input System Prompt:** "Bạn là trợ lý đặt sân... Chỉ gợi ý khung giờ còn trống trong dữ liệu được cung cấp..."
- **Hiệu quả:** AI phân tích và trả lời tự nhiên cho nhân viên, gợi ý 2 lựa chọn phù hợp nhất, giải thích tại sao. Frontend tự động parse danh sách slot khả dụng thành các nút bấm "Đặt ngay".

### 5.2. Sinh tin nhắn xác nhận / nhắc lịch (AI-2)
- **Hoạt động:** Chạy tại màn hình Trợ lý AI hoặc trang Chi tiết Booking. Lấy dữ liệu thật của khách hàng (Tên, SĐT, Sân, Giờ, Tiền).
- **Input System Prompt:** "Bạn là trợ lý CSKH... CHỈ dùng đúng thông tin được cung cấp, viết thân thiện..."
- **Hiệu quả:** Tự động tạo ra tin nhắn cá nhân hóa chuẩn xác, hỗ trợ nhân viên copy nhanh để gửi Zalo/SMS cho khách.

### 5.3. Phân tích công suất & Gợi ý khuyến mại (AI-3)
- **Hoạt động:** Lấy dữ liệu 30 ngày gần nhất, group dữ liệu theo từng giờ trong ngày để tính Tỉ lệ lấp đầy (Occupancy Rate). Dữ liệu sau khi xử lý (ví dụ: `19:00 - 100%, 14:00 - 15%`) được đưa cho AI.
- **Input System Prompt:** "Dữ liệu tỉ lệ lấp đầy... Hãy tóm tắt khung giờ cao điểm/thấp điểm và đề xuất 1-2 chương trình khuyến mại."
- **Hiệu quả:** Đóng vai trò phân tích kinh doanh, giúp chủ cơ sở ngay lập tức biết điểm nóng của sân và nhận được lời khuyên về giá/voucher cho các khung giờ vắng khách.

---

## 6. KẾT QUẢ KIỂM THỬ (TESTING)
Dự án được bảo vệ chất lượng bằng bộ unit test viết trên thư viện `pytest`:
- **test_booking**: Pass 100%. Chứng minh cơ chế lock DB hoạt động tốt khi dùng `threading` giả lập 2 khách đặt trùng slot.
- **test_payment**: Pass 100%. Booking tự động đổi trạng thái chính xác.
- **test_ai**: Pass 100%. Sử dụng `unittest.mock.patch` để mock `gemini_client.generate`. Xác nhận AI không bị gọi thừa thãi khi không có slot trống (tiết kiệm chi phí API).

---

## 7. HƯỚNG PHÁT TRIỂN
- Nâng cấp SQLite lên PostgreSQL để triển khai thực tế trên server (đảm bảo row-level lock tốt hơn).
- Tích hợp cổng thanh toán VNPay/Momo thực tế, gọi webhook xử lý payment.
- Tự động hóa gửi tin nhắn xác nhận qua Zalo ZNS API dựa trên text AI sinh ra.
