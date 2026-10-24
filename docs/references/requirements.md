# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)

**Dự án:** Hệ thống Quản lý Sân Thể Thao Tích Hợp AI (SportBooking Pro)  
**Học phần:** AIA331 – Ứng dụng Trí tuệ Nhân tạo | **Mã lớp:** 80302  
**Thực hiện:** Nhóm 14  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** Tháng 09/2025  

---

## MỤC LỤC
1. [Giới thiệu Dự án](#1-giới-thiệu-dự-án)
   - 1.1. Bối cảnh & Lý do chọn đề tài
   - 1.2. Mục tiêu hệ thống
   - 1.3. Phạm vi sản phẩm (Scope)
2. [Các Bên liên quan & Đối tượng Người dùng (Stakeholders & Actors)](#2-các-bên-liên-quan--đối-tượng-người-dùng-stakeholders--actors)
3. [Yêu cầu Chức năng Chi tiết (Functional Requirements - FR)](#3-yêu-cầu-chức-năng-chi-tiết-functional-requirements---fr)
   - 3.1. Phân hệ 1: Xác thực & Phân quyền (Auth & RBAC)
   - 3.2. Phân hệ 2: Quản lý Sân & Khung giờ (Courts & Time Slots)
   - 3.3. Phân hệ 3: Quản lý Đặt sân & Chống trùng lịch (Booking & Concurrency)
   - 3.4. Phân hệ 4: Quản lý Khách hàng (Customer Management)
   - 3.5. Phân hệ 5: Quản lý Thanh toán & Công nợ (Billing & Payments)
   - 3.6. Phân hệ 6: Quản lý Lịch Bảo trì (Maintenance Schedules)
   - 3.7. Phân hệ 7: Báo cáo Thống kê Doanh thu (Statistics & Reporting)
   - 3.8. Phân hệ 8: Trợ lý Trí tuệ Nhân tạo (AI Assistant Features)
4. [Ma trận Phân quyền Người dùng (RBAC Matrix)](#4-ma-trận-phân-quyền-người-dùng-rbac-matrix)
5. [Yêu cầu Phi chức năng Chi tiết (Non-Functional Requirements - NFR)](#5-yêu-cầu-phi-chức-năng-chi-tiết-non-functional-requirements---nfr)
   - 5.1. Hiệu năng & Khả năng đáp ứng (Performance)
   - 5.2. Bảo mật & An toàn Dữ liệu (Security)
   - 5.3. Độ tin cậy & Toàn vẹn Giao dịch (Reliability & ACID)
   - 5.4. Giao diện & Trải nghiệm Người dùng (UI/UX Usability)
   - 5.5. Khả năng Mở rộng & Tương thích (Scalability & Portability)
6. [Ràng buộc Kỹ thuật & Môi trường Triển khai](#6-ràng-buộc-kỹ-thuật--môi-trường-triển-khai)

---

## 1. GIỚI THIỆU DỰ ÁN

### 1.1. Bối cảnh & Lý do chọn đề tài
Phong trào rèn luyện thể dục thể thao (bóng đá, cầu lông, tennis, pickleball) tại các đô thị phát triển mạnh mẽ dẫn đến sự bùng nổ của các cụm sân thể thao cho thuê. Tuy nhiên, đa số cơ sở hiện nay vẫn quản lý bằng sổ tay hoặc file Excel truyền thống, dẫn đến:
- **Tình trạng trùng lịch (Overbooking):** Hai nhân viên cùng nhận cọc của hai đội bóng cho cùng một sân và một khung giờ vàng.
- **Mất thời gian tư vấn:** Khách hàng hỏi dồn dập vào giờ cao điểm, nhân viên lúng túng khi phải kiểm tra thủ công xem sân nào còn trống vào các khung giờ lân cận.
- **Soạn thảo tin nhắn thủ công:** Dễ sai sót thông tin giờ giấc, tiền cọc khi nhắn qua Zalo/SMS cho khách.
- **Thiếu chiến lược kinh doanh dựa trên dữ liệu:** Sân thường bị bỏ trống lãng phí vào khung giờ sáng hoặc trưa, trong khi buổi tối lại quá tải.

### 1.2. Mục tiêu hệ thống
**SportBooking Pro** ra đời nhằm số hóa toàn diện quy trình vận hành của các cụm sân thể thao, nổi bật với cơ chế **Khóa bi quan chống trùng lịch tuyệt đối** và ứng dụng **Trí tuệ nhân tạo (Google Gemini)** vào trực tiếp các khâu tư vấn, chăm sóc khách hàng và phân tích chiến lược doanh thu.

### 1.3. Phạm vi sản phẩm (Scope)
- Quản lý tập trung mọi danh mục sân bãi, phân loại sân, biểu giá theo giờ.
- Hiển thị trực quan trạng thái đặt sân theo lưới thời gian thực (Interactive Calendar Grid).
- Hỗ trợ tạo đơn đặt sân, thu cọc, thanh toán kết thúc trận và hoàn cọc khi hủy hợp lệ.
- Lên lịch bảo trì kỹ thuật và tự động khóa sân trên hệ thống.
- Cung cấp 3 tính năng AI lõi: Gợi ý khung giờ thông minh, Sinh tin nhắn xác nhận/nhắc lịch, Phân tích tỷ lệ lấp đầy & tư vấn khuyến mại giờ thấp điểm.

---

## 2. CÁC BÊN LIÊN QUAN & ĐỐI TƯỢNG NGƯỜI DÙNG (STAKEHOLDERS & ACTORS)

| Tác nhân (Actor) | Mô tả vai trò | Trách nhiệm chính trong hệ thống |
|:---|:---|:---|
| **Chủ cơ sở / Quản lý (Admin)** | Người có toàn quyền quản trị cao nhất của hệ thống. | - Quản lý tài khoản nhân viên.<br>- Cấu hình danh mục sân, giá tiền mỗi giờ.<br>- Lên lịch bảo trì sân định kỳ.<br>- Xem biểu đồ doanh thu và nhận định kinh doanh từ AI. |
| **Nhân viên Lễ tân (Staff)** | Người trực tiếp vận hành tại quầy lễ tân của cơ sở thể thao. | - Tiếp nhận yêu cầu đặt sân của khách (trực tiếp hoặc qua điện thoại).<br>- Sử dụng AI để tìm khung giờ trống tối ưu cho khách.<br>- Thu tiền cọc, xuất tin nhắn xác nhận Zalo qua AI.<br>- Thu tiền thanh toán khi khách chơi xong. |
| **Khách hàng (Customer)** | Người thuê sân thể thao để tập luyện, thi đấu. | - Đối tượng thụ hưởng: nhận thông tin xác nhận/nhắc lịch chính xác, được tư vấn khung giờ phù hợp. |
| **AI Engine (Gemini Service)** | Đơn vị trí tuệ nhân tạo đóng vai trò hệ thống ngoài (External System). | - Xử lý ngôn ngữ tự nhiên, suy luận và phản hồi các yêu cầu từ Backend. |

---

## 3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS - FR)

### 3.1. Phân hệ 1: Xác thực & Phân quyền (Auth & RBAC)
- **FR-1.1:** Hệ thống phải cho phép người dùng đăng nhập bằng `username` và `password`.
- **FR-1.2:** Mật khẩu phải được mã hóa một chiều bằng giải thuật `Bcrypt` an toàn trước khi lưu vào CSDL.
- **FR-1.3:** Sau khi đăng nhập thành công, hệ thống phải cấp phát `JWT (JSON Web Token)` chứa thông tin định danh và vai trò (`role: admin | staff`).
- **FR-1.4:** Các API nhạy cảm phải bắt buộc kiểm tra Access Token qua tiêu đề `Authorization: Bearer <token>`.
- **FR-1.5:** Phân quyền nghiêm ngặt: Các route liên quan đến xóa sân, đổi giá tiền, phân tích doanh thu AI cấp quản lý chỉ cho phép vai trò `Admin` thực hiện.

### 3.2. Phân hệ 2: Quản lý Sân & Khung giờ (Courts & Time Slots)
- **FR-2.1:** Cho phép xem danh sách tất cả các loại sân (Court Types) và danh sách sân cụ thể (Courts).
- **FR-2.2:** Cho phép `Admin` thêm mới, cập nhật thông tin sân (tên sân, loại sân, giá/giờ, trạng thái `active | maintenance | inactive`, ảnh chụp sân).
- **FR-2.3:** Cho phép `Admin` thực hiện xóa mềm (Soft Delete) sân bằng cách chuyển trạng thái sang `inactive`, không làm mất dữ liệu lịch sử các hóa đơn cũ.
- **FR-2.4:** Hệ thống tự động quản lý các khung giờ (`time_slots`) của từng sân theo từng ngày với các trạng thái rõ ràng:
  - `available`: Sân đang trống, sẵn sàng cho thuê.
  - `booked`: Khung giờ đã có khách đặt.
  - `blocked`: Khung giờ bị khóa tạm thời do bảo trì hoặc chủ sân giữ chỗ riêng.
- **FR-2.5:** Cung cấp API tải danh sách khung giờ theo ngày và loại sân phục vụ hiển thị lịch trực quan trên Frontend.

### 3.3. Phân hệ 3: Quản lý Đặt sân & Chống trùng lịch (Booking & Concurrency)
- **FR-3.1:** Cho phép nhân viên tạo phiếu đặt sân (`Booking`) gồm: Khách hàng, Sân, Khung giờ (`time_slot_id`), Số tiền cọc (`deposit_amount`), Ghi chú.
- **FR-3.2 (Yêu cầu Trọng tâm):** Hệ thống **bắt buộc** phải có cơ chế ngăn chặn xung đột lịch khi 2 người cùng thao tác đặt 1 khung giờ tại một thời điểm:
  - Phải sử dụng giao dịch CSDL (Transaction) kết hợp Khóa dòng (`SELECT ... FOR UPDATE`).
  - Request đầu tiên thành công đổi trạng thái slot thành `booked` và trả về mã HTTP 201.
  - Request thứ hai bị từ chối ngay lập tức và trả về mã lỗi HTTP 409 Conflict với thông báo rõ ràng.
- **FR-3.3:** Tổng số tiền thuê sân (`total_amount`) phải được tính toán tự động từ phía máy chủ dựa trên đơn giá giờ của sân (`price_per_hour`) và thời lượng của ca chơi, ngăn chặn việc can thiệp giá từ client.
- **FR-3.4:** Cung cấp chức năng xem chi tiết đơn đặt, danh sách các đợt thanh toán liên quan và công nợ còn thiếu.
- **FR-3.5:** Cho phép Hủy đặt sân (`cancelled`): Khi hủy hợp lệ, hệ thống giải phóng khung giờ trở lại trạng thái `available` và tạo bản ghi hoàn tiền nếu đủ điều kiện.

### 3.4. Phân hệ 4: Quản lý Khách hàng (Customer Management)
- **FR-4.1:** Cho phép lưu trữ thông tin khách hàng gồm: Họ tên, Số điện thoại, Email, Ghi chú đặc biệt.
- **FR-4.2:** Khi tạo booking, hệ thống tự động tìm kiếm khách hàng theo số điện thoại; nếu chưa có thì tạo mới hồ sơ khách hàng ngay lập tức.
- **FR-4.3:** Cho phép nhân viên tra cứu danh sách khách hàng và lịch sử toàn bộ các lần đặt sân trước đây của khách.

### 3.5. Phân hệ 5: Quản lý Thanh toán & Công nợ (Billing & Payments)
- **FR-5.1:** Ghi nhận các khoản thanh toán gắn liền với phiếu đặt sân (`booking_id`).
- **FR-5.2:** Hỗ trợ các phương thức thanh toán: Tiền mặt (`cash`), Chuyển khoản ngân hàng (`transfer`), Ví điện tử (`momo`).
- **FR-5.3:** Tự động kiểm tra: Khi tổng số tiền thanh toán thực tế của các bản ghi `payments` có trạng thái `paid` đạt hoặc vượt `total_amount`, hệ thống tự động chuyển trạng thái booking sang `confirmed` (nếu trước đó là cọc) hoặc `completed` (khi kết thúc trận).
- **FR-5.4:** Hiển thị minh bạch số tiền đã cọc, số tiền còn thiếu cần thu khi khách đến nhận sân.

### 3.6. Phân hệ 6: Quản lý Lịch Bảo trì (Maintenance Schedules)
- **FR-6.1:** Cho phép `Admin` lên lịch bảo dưỡng kỹ thuật cho từng sân (ngày bắt đầu, ngày kết thúc, lý do bảo trì).
- **FR-6.2:** Khi trạng thái lịch bảo dưỡng chuyển sang `in_progress`, hệ thống tự động đổi trạng thái của sân tương ứng sang `maintenance`.
- **FR-6.3:** Hệ thống tự động khóa toàn bộ các khung giờ (`time_slots`) của sân đó trong khoảng thời gian bảo dưỡng thành `blocked`, ngăn ngừa tuyệt đối việc khách đặt nhầm vào sân đang sửa chữa.
- **FR-6.4:** Cảnh báo cho quản lý nếu thời gian bảo trì dự kiến bị trùng với các đơn đặt sân đã được xác nhận trước đó để chủ động dời lịch cho khách.

### 3.7. Phân hệ 7: Báo cáo Thống kê Doanh thu (Statistics & Reporting)
- **FR-7.1:** Hiển thị số liệu tổng quan trên Dashboard: Doanh thu thực nhận hôm nay, Tổng số lượt đặt sân, Tỷ lệ sân đang hoạt động.
- **FR-7.2:** Cung cấp biểu đồ trực quan (Bar Chart / Line Chart) thống kê doanh thu theo các mốc thời gian (7 ngày gần nhất, theo tháng).
- **FR-7.3:** Thống kê tỷ lệ lấp đầy công suất (Occupancy Rate %) của từng sân và từng khung giờ trong ngày.

### 3.8. Phân hệ 8: Trợ lý Trí tuệ Nhân tạo (AI Assistant Features)
- **FR-8.1 (AI-1: Smart Slot Suggestion):** Cung cấp API `POST /ai/suggest-slot`:
  - Tiếp nhận loại sân, ngày mong muốn, khoảng giờ ưu tiên.
  - Lọc dữ liệu slot trống thật trong CSDL đưa vào Prompt ngữ cảnh.
  - AI phân tích và đưa ra 2-3 gợi ý tối ưu kèm lý do, Frontend sinh nút bấm đặt ngay.
  - Nếu CSDL không còn khung giờ nào, trả về thông báo hết chỗ mà **không gọi API AI** để tiết kiệm tài nguyên.
- **FR-8.2 (AI-2: Notification Generator):** Cung cấp API `POST /ai/generate-message/{booking_id}`:
  - Sinh tin nhắn Xác nhận cọc (`confirmation`) hoặc Nhắc lịch (`reminder`).
  - Đưa thông tin cá nhân hóa (Tên khách, Sân, Giờ, Tiền cọc, Tiền còn lại) vào prompt.
  - Văn phong lịch sự, chuẩn xác, sẵn sàng sao chép gửi Zalo/SMS.
- **FR-8.3 (AI-3: Business Occupancy & Strategy Insights):** Cung cấp API `GET /ai/occupancy-summary`:
  - Tổng hợp tỷ lệ lấp đầy theo giờ trong khoảng ngày chỉ định.
  - AI nhận diện các khung giờ cao điểm và thấp điểm, đưa ra 2 chương trình khuyến mại cụ thể để tăng công suất giờ vắng.
- **FR-8.4 (AI Audit Logging):** Toàn bộ các yêu cầu gọi AI phải được lưu trữ chi tiết vào bảng `ai_logs` trong CSDL để phục vụ kiểm tra và báo cáo học phần.

---

## 4. MA TRẬN PHÂN QUYỀN NGƯỜI DÙNG (RBAC MATRIX)

| Mã yêu cầu | Chức năng chi tiết | Quản trị viên (Admin) | Nhân viên lễ tân (Staff) |
|:---|:---|:---:|:---:|
| **FR-1.x** | Đăng nhập / Lấy JWT Token | Cho phép | Cho phép |
| **FR-2.1** | Xem danh mục sân & Lưới lịch | Cho phép | Cho phép |
| **FR-2.2** | Thêm mới, sửa đổi thông tin sân & giá | **Toàn quyền** | Chỉ xem |
| **FR-2.3** | Xóa / Ngưng hoạt động sân | **Toàn quyền** | Không có quyền |
| **FR-3.x** | Tạo đơn đặt sân & Chống trùng lịch | Cho phép | Cho phép |
| **FR-3.5** | Hủy đơn đặt sân & Hoàn cọc | Cho phép | Cho phép |
| **FR-4.x** | Quản lý hồ sơ & Lịch sử khách hàng | Cho phép | Cho phép |
| **FR-5.x** | Thu tiền cọc & Thanh toán hóa đơn | Cho phép | Cho phép |
| **FR-6.x** | Lên lịch bảo trì & Khóa sân | **Toàn quyền** | Chỉ xem |
| **FR-7.x** | Xem Báo cáo & Biểu đồ doanh thu | **Toàn quyền** | Bị giới hạn |
| **FR-8.1** | AI Gợi ý khung giờ trống | Cho phép | Cho phép |
| **FR-8.2** | AI Sinh tin nhắn xác nhận / nhắc lịch | Cho phép | Cho phép |
| **FR-8.3** | AI Phân tích công suất & Tư vấn giá | **Toàn quyền** | Không có quyền |

---

## 5. YÊU CẦU PHI CHỨC NĂNG CHI TIẾT (NON-FUNCTIONAL REQUIREMENTS - NFR)

### 5.1. Hiệu năng & Khả năng đáp ứng (Performance)
- **NFR-1.1:** Thời gian phản hồi của các API đọc/ghi dữ liệu thông thường (CRUD Sân, Khung giờ, Booking) phải dưới **300ms** trong điều kiện mạng nội bộ tiêu chuẩn.
- **NFR-1.2:** Thời gian phản hồi cho các tác vụ gọi Trí tuệ nhân tạo (Gemini API) phải dưới **2.5 giây**.
- **NFR-1.3:** Hệ thống phải xử lý an toàn tối thiểu **50 yêu cầu đồng thời (Concurrent Requests)** mà không xảy ra hiện tượng deadlock hay ghi đè trùng lặp dữ liệu.

### 5.2. Bảo mật & An toàn Dữ liệu (Security)
- **NFR-2.1:** Toàn bộ mật khẩu người dùng phải được băm bằng thuật toán `Bcrypt` với độ phức tạp (Salt rounds) tiêu chuẩn; tuyệt đối không lưu plain-text.
- **NFR-2.2:** Token xác thực JWT phải có thời hạn sống hợp lý (Access Token Expiration) và được ký bằng khóa bí mật (`SECRET_KEY`) an toàn.
- **NFR-2.3:** API Key của Google Gemini phải được lưu trữ trong tệp môi trường `.env`, tuyệt đối không commit lên Git repository công khai.
- **NFR-2.4:** Dữ liệu gửi sang AI phải được loại bỏ các thông tin nhạy cảm không cần thiết (chỉ gửi số liệu thống kê tổng hợp hoặc thông tin tối thiểu của từng ca đặt).

### 5.3. Độ tin cậy & Toàn vẹn Giao dịch (Reliability & ACID)
- **NFR-3.1:** Đảm bảo 100% tính chất ACID trong các giao dịch đặt sân và thanh toán tài chính. Nếu có bất kỳ lỗi nào xảy ra giữa chừng, toàn bộ transaction phải được Rollback về trạng thái ban đầu.
- **NFR-3.2:** Hệ thống AI phải có cơ chế tự động thử lại (Retry) tối đa 2 lần khi gặp sự cố mạng hoặc nghẽn dịch vụ từ nhà cung cấp.

### 5.4. Giao diện & Trải nghiệm Người dùng (UI/UX Usability)
- **NFR-4.1:** Thiết kế theo phong cách hiện đại **Glassmorphism Dark Mode** (nền kính mờ sang trọng, viền phát sáng tinh tế, chống mỏi mắt cho nhân viên làm việc ca tối).
- **NFR-4.2:** Giao diện Responsive hoàn hảo trên màn hình Desktop máy tính bàn, Laptop và Tablet tại bàn lễ tân.
- **NFR-4.3:** Thời gian để một nhân viên lễ tân tạo thành công một đơn đặt sân qua giao diện không quá **15 giây**.

### 5.5. Khả năng Mở rộng & Tương thích (Scalability & Portability)
- **NFR-5.1:** Mã nguồn Backend được tổ chức theo cấu trúc phân lớp sạch sẽ: `models`, `schemas`, `routers`, `services`, `ai`.
- **NFR-5.2:** Cơ sở dữ liệu dễ dàng chuyển dịch từ SQLite sang PostgreSQL phục vụ môi trường sản xuất thực tế chỉ bằng việc thay đổi chuỗi kết nối `DATABASE_URL`.

---

## 6. RÀNG BUỘC KỸ THUẬT & MÔI TRƯỜNG TRIỂN KHAI

- **Ngôn ngữ & Nền tảng Backend:** Python 3.10+, FastAPI framework, Uvicorn ASGI server.
- **Thư viện ORM & Validation:** SQLAlchemy 2.0, Pydantic v2.
- **Mô hình Trí tuệ Nhân tạo:** Google Gemini API (`gemini-2.0-flash` / `gemini-1.5-flash`), thư viện `google-generativeai`.
- **Ngôn ngữ & Nền tảng Frontend:** JavaScript (ES6+), React 18, Vite Build Tool, Vanilla CSS Glassmorphism, thư viện biểu tượng `lucide-react`.
- **Hệ quản trị CSDL:** SQLite 3 (Dev/Test) / PostgreSQL 15+ (Production).
- **Môi trường Kiểm thử:** Framework `pytest` kiểm thử tự động tầng Backend.

---
**Kết luận:** Bản đặc tả yêu cầu phần mềm SRS này cung cấp tiêu chuẩn đầy đủ và chuẩn mực để đối soát chức năng, kiểm thử chất lượng và phục vụ công tác chấm thi học phần AIA331.
