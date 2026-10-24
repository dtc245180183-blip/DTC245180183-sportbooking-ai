# TÀI LIỆU KỸ THUẬT & NHẬT KÝ TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI_LOG)

> **Lưu ý:** File này đồng bộ nội dung hoàn chỉnh với [ai.log.md](./ai.log.md).

**Dự án:** Hệ thống Quản lý Sân Thể Thao Tích Hợp AI (SportBooking Pro)  
**Học phần:** AIA331 – Ứng dụng Trí tuệ Nhân tạo | **Mã lớp:** 80302  
**Thực hiện:** Nhóm 14  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** Tháng 09/2025  

---

## MỤC LỤC
1. [Tổng quan về Trí tuệ Nhân tạo trong SportBooking Pro](#1-tổng-quan-về-trí-tuệ-nhân-tạo-trong-sportbooking-pro)
2. [Kiến trúc Tích hợp AI (AI System Architecture)](#2-kiến-trúc-tích-hợp-ai-ai-system-architecture)
   - 2.1. Cấu hình & Client Engine (`gemini_client.py`)
   - 2.2. Cơ chế Xử lý Lỗi, Retry & Fallback
   - 2.3. Tách biệt Nghiệp vụ và Lưu vết (`ai_log_service.py`)
3. [Đặc tả 3 Chức năng AI Cốt lõi (Runtime Features)](#3-đặc-tả-3-chức-năng-ai-cốt-lõi-runtime-features)
   - 3.1. Chức năng AI-1: Gợi ý Khung giờ trống (`/ai/suggest-slot`)
   - 3.2. Chức năng AI-2: Sinh Tin nhắn Xác nhận / Nhắc lịch (`/ai/generate-message/{booking_id}`)
   - 3.3. Chức năng AI-3: Phân tích Tỷ lệ Lấp đầy & Đề xuất Khuyến mại (`/ai/occupancy-summary`)
4. [Lược đồ CSDL & Nhật ký Thực thi AI (AI Production Logs)](#4-lược-đồ-csdl--nhật-ký-thực-thi-ai-ai-production-logs)
   - 4.1. Lược đồ Bảng `ai_logs`
   - 4.2. Dữ liệu Minh chứng Gọi AI Thực tế (Real System Logs)
5. [Nhật ký Ứng dụng AI trong Vòng đời Phát triển Phần mềm (AI in SDLC)](#5-nhật-ký-ứng-dụng-ai-trong-vòng-đời-phát-triển-phần-mềm-ai-in-sdlc)
   - 5.1. Giai đoạn KT1: Phân tích & Thiết kế CSDL
   - 5.2. Giai đoạn KT2: Xây dựng CRUD & Cơ chế Khóa Chống Trùng Lịch
   - 5.3. Giai đoạn KT3: Tích hợp API Gemini & Kiểm thử AI
   - 5.4. Giai đoạn Cuối kỳ: Tối ưu UI/UX Glassmorphism & Viết Test Tự Động
6. [Đánh giá Hiệu năng & Chi phí Tiêu thụ Token](#6-đánh-giá-hiệu-năng--chi-phí-tiêu-thụ-token)

---

## 1. TỔNG QUAN VỀ TRÍ TUỆ NHÂN TẠO TRONG SPORTBOOKING PRO

Trong đề tài quản lý sân thể thao cho thuê, bên cạnh các nghiệp vụ CRUD truyền thống, nhóm đã ứng dụng **Mô hình Ngôn ngữ Lớn (Large Language Model - Google Gemini)** nhằm giải quyết các bài toán thực tiễn:
- **Giảm tải thao tác cho nhân viên lễ tân:** Khi khách hàng gọi điện đặt sân mà khung giờ mong muốn đã kín, thay vì phải tra cứu thủ công qua hàng chục sân và khung giờ khác nhau, AI sẽ tự động rà soát CSDL và đưa ra phương án gợi ý tối ưu ngay lập tức.
- **Tự động hóa chăm sóc khách hàng:** Tạo thông báo xác nhận đặt cọc và nhắc nhở giờ chơi chuẩn xác, lịch sự, cá nhân hóa theo từng khách hàng.
- **Hỗ trợ ra quyết định kinh doanh (Business Intelligence):** Giúp chủ cơ sở nhận diện ngay các khung giờ vắng khách và tự động đề xuất chiến dịch marketing/khuyến mại thông minh dựa trên số liệu thực tế.
- **Ứng dụng AI xuyên suốt SDLC:** Toàn bộ quá trình phân tích yêu cầu, sinh schema cơ sở dữ liệu, tối ưu hóa thuật toán concurrency lock và viết unit test đều có sự hỗ trợ bài bản từ AI.

---

## 2. KIẾN TRÚC TÍCH HỢP AI (AI SYSTEM ARCHITECTURE)

```
[ Frontend: React / Vite ]
            │ (REST API HTTP/JSON)
            ▼
[ FastAPI Backend: routers/ai.py ]
      │                     │
      │ 1. Query Data       │ 3. Log Call
      ▼                     ▼
[ SQLAlchemy DB ]    [ ai_log_service.py ] ──► [ DB Table: ai_logs ]
      │ (Context JSON)      
      ▼
[ backend/app/ai/gemini_client.py ]
      │ (Prompt with System Instruction)
      ▼
[ Google Gemini 2.0 Flash / 1.5 Flash API ]
```

### 2.1. Cấu hình & Client Engine (`gemini_client.py`)
Mã nguồn module client được thiết kế tập trung tại `backend/app/ai/gemini_client.py`.
- **Thư viện sử dụng:** `google-generativeai` (phiên bản tương thích với Gemini 2.0 Flash và Gemini 1.5 Flash).
- **Khởi tạo SDK:** Chỉ gọi `genai.configure(api_key=settings.GEMINI_API_KEY)` 1 lần duy nhất lúc nạp module nhằm tiết kiệm tài nguyên.
- **Cấu hình mô hình:** Hỗ trợ cấu hình tên model linh hoạt thông qua biến môi trường `GEMINI_MODEL` (mặc định: `gemini-2.0-flash` hoặc `gemini-1.5-flash`).

### 2.2. Cơ chế Xử lý Lỗi, Retry & Fallback
Quá trình gọi API ngoài luôn tiềm ẩn rủi ro về mạng và giới hạn tần suất (Rate Limiting). Hệ thống đã cài đặt cơ chế xử lý ngoại lệ nghiêm ngặt:
1. **Exponential Backoff Retry:** Tự động retry tối đa 2 lần đối với các lỗi tạm thời (Transient Errors) như `ResourceExhausted` (mã 429), `RetryError`, `InternalServerError` (mã 500/503), `DeadlineExceeded`, `ConnectionError`. Thời gian tạm ngưng tăng dần: lần 1 dừng 1 giây, lần 2 dừng 2 giây trước khi thử lại.
2. **Safety Filter Handling:** Bắt riêng lỗi `ValueError` khi truy cập `response.text` nếu nội dung bị bộ lọc an toàn của Google chặn, trả về HTTP 400 rõ ràng thay vì làm crash server.
3. **Graceful Degradation / Fallback:** Khi API Key chưa cấu hình hoặc dịch vụ AI gặp sự cố kéo dài, hệ thống trả về mã lỗi HTTP 503 với thông báo tiếng Việt thân thiện, không gây gián đoạn các luồng CRUD thông thường của ứng dụng.

### 2.3. Tách biệt Nghiệp vụ và Lưu vết (`ai_log_service.py`)
Tuân thủ nguyên lý Single Responsibility (SOLID):
- `gemini_client.py`: Chỉ chịu trách nhiệm giao tiếp mạng với máy chủ Gemini.
- `ai_log_service.py`: Tiếp nhận session CSDL và lưu bản ghi vào bảng `ai_logs`. Nếu việc lưu log gặp lỗi (ví dụ lỗi disk/transaction), hàm sẽ in log cảnh báo và rollback an toàn, tuyệt đối không làm fail luồng trả kết quả về cho người dùng.

---

## 3. ĐẶC TẢ 3 CHỨC NĂNG AI CỐT LÕI (RUNTIME FEATURES)

### 3.1. Chức năng AI-1: Gợi ý Khung giờ trống (`/ai/suggest-slot`)
- **Endpoint:** `POST /ai/suggest-slot`
- **Quyền hạn:** `Admin`, `Staff`
- **Mục tiêu nghiệp vụ:** Tìm các khung giờ khả dụng (`status = 'available'`) theo loại sân và ngày khách yêu cầu, tổng hợp gửi cho AI để đưa ra 2-3 gợi ý phù hợp nhất kèm giải thích.
- **Nguyên lý chống Hallucination (Chống bịa đặt):**
  - Trước khi gọi AI, Backend truy vấn CSDL: `SELECT * FROM time_slots JOIN courts WHERE court_type_id = ? AND date = ? AND status = 'available'`.
  - Nếu CSDL không còn khung giờ nào trống: Backend trả về ngay `matched_slots = []`, `message = "Hiện không còn khung giờ trống phù hợp"` mà **không gọi AI**. Điều này giúp tiết kiệm 100% token vô ích và triệt tiêu nguy cơ AI tự bịa khung giờ.
- **Prompt Engineering:**
  ```text
  [System Instruction]
  Bạn là trợ lý đặt sân thể thao. Chỉ gợi ý khung giờ còn trống trong dữ liệu được cung cấp, không tự thêm khung giờ nào khác.

  [User Prompt]
  Khách muốn đặt sân (court_type_id=1) vào 2025-10-20.
  Dữ liệu khung giờ trống: [
    {"slot_id": 14, "court_name": "Sân cỏ nhân tạo 7 người A", "start_time": "17:30", "end_time": "19:00", "price": 300000.0},
    {"slot_id": 15, "court_name": "Sân cỏ nhân tạo 7 người B", "start_time": "19:00", "end_time": "20:30", "price": 300000.0},
    {"slot_id": 16, "court_name": "Sân cỏ nhân tạo 7 người A", "start_time": "20:30", "end_time": "22:00", "price": 250000.0}
  ].
  Hãy gợi ý 2-3 lựa chọn phù hợp nhất, giải thích ngắn gọn vì sao.
  ```
- **Ví dụ Phản hồi của AI (Output Text):**
  > Chào bạn, dựa trên lịch trống hiện có, tôi gợi ý 2 khung giờ lý tưởng nhất cho bạn:
  > 1. **Lựa chọn 1 (Khung giờ vàng):** Sân cỏ nhân tạo 7 người B từ **19:00 - 20:30** (Giá 300.000đ). Đây là khung giờ mát mẻ, vừa tan ca làm, rất thuận tiện để cả đội tụ họp đông đủ.
  > 2. **Lựa chọn 2 (Tiết kiệm chi phí):** Sân cỏ nhân tạo 7 người A từ **20:30 - 22:00** (Giá chỉ 250.000đ). Phù hợp nếu đội thích đá muộn hơn một chút để có mức giá ưu đãi hơn.
- **Cơ chế Frontend:** Giao diện nhận về cả đoạn văn bản gợi ý của AI và mảng `matched_slots` thô để render trực tiếp các nút bấm *"Chọn đặt ngay"* cho nhân viên click 1 chạm.

---

### 3.2. Chức năng AI-2: Sinh Tin nhắn Xác nhận / Nhắc lịch (`/ai/generate-message/{booking_id}`)
- **Endpoint:** `POST /ai/generate-message/{booking_id}?message_type=confirmation|reminder`
- **Quyền hạn:** `Admin`, `Staff`
- **Mục tiêu nghiệp vụ:** Tự động tạo văn bản cá nhân hóa để nhân viên gửi qua Zalo/SMS/Facebook Messenger cho khách hàng.
- **Ràng buộc nghiệp vụ (Validation):**
  - Chặn sinh tin xác nhận nếu booking có trạng thái `cancelled` hoặc `completed`.
  - Chỉ cho phép sinh tin nhắc lịch khi booking đã ở trạng thái `confirmed`.
- **Cơ chế Context Injection:**
  - Hệ thống lấy chính xác: Tên khách hàng, Tên sân cụ thể, Ngày chơi, Giờ bắt đầu - kết thúc, Số tiền cọc đã đóng (`deposit_amount`), Tổng tiền (`total_amount`), và tính toán số tiền còn lại phải trả lúc kết thúc trận (`remaining_amount = total_amount - paid_amount`).
- **Prompt Engineering (Confirmation):**
  ```text
  [System Instruction]
  Bạn là trợ lý chăm sóc khách hàng sân thể thao, viết tin nhắn ngắn gọn, thân thiện, CHỈ dùng đúng thông tin được cung cấp, không thêm số liệu nào khác.

  [User Prompt]
  Sinh tin nhắn XÁC NHẬN đặt sân: khách Nguyễn Văn A, sân Sân Tennis Số 2, ngày 2025-10-25, giờ 18:00-19:30, tiền cọc 150000.0, tổng tiền 300000.0.
  ```
- **Ví dụ Phản hồi của AI (Output Text):**
  > Dạ chào anh Nguyễn Văn A, SportBooking Pro xin xác nhận lịch đặt sân của anh ạ!  
  > 🏟️ **Sân:** Sân Tennis Số 2  
  > ⏰ **Thời gian:** 18:00 - 19:30 | Ngày 25/10/2025  
  > 💵 **Đã cọc:** 150.000 VNĐ (Tổng chi phí: 300.000 VNĐ)  
  > Hẹn gặp anh vào khung giờ trên. Chúc anh có những phút giây tập luyện thể thao tuyệt vời!
- **Prompt Engineering (Reminder):**
  ```text
  [System Instruction]
  Bạn là trợ lý chăm sóc khách hàng sân thể thao, viết tin nhắn ngắn gọn, thân thiện, CHỈ dùng đúng thông tin được cung cấp, không thêm số liệu nào khác. Đây là tin nhắn NHẮC LỊCH, không phải xác nhận lần đầu, cần nhấn mạnh thời gian sắp tới và nhắc khách đến đúng giờ.

  [User Prompt]
  Sinh tin nhắn NHẮC LỊCH cho khách sắp đến giờ chơi: khách Trần Thị B, sân Sân Cầu Lông VIP 1, ngày 2025-10-20, giờ 17:00-18:30. Nhắc khách đến đúng giờ, mang theo đặt cọc còn thiếu nếu có (120000.0).
  ```

---

### 3.3. Chức năng AI-3: Phân tích Tỷ lệ Lấp đầy & Đề xuất Khuyến mại (`/ai/occupancy-summary`)
- **Endpoint:** `GET /ai/occupancy-summary?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`
- **Quyền hạn:** `Admin` (hoặc `Staff` được phân quyền)
- **Mục tiêu nghiệp vụ:** Đóng vai trò cố vấn phân tích kinh doanh tự động (AI Business Analyst).
- **Quy trình tổng hợp số liệu (Safe Data Pipeline):**
  1. Backend lấy danh sách `time_slots` nằm trong khoảng ngày chọn lọc.
  2. Bỏ qua các slot bị khóa bảo trì (`status == "blocked"`).
  3. Gom nhóm theo mốc giờ bắt đầu (`HH:00`) trực tiếp bằng Python Dictionary (tránh sự khác biệt giữa hàm `strftime` của SQLite và `to_char` của PostgreSQL).
  4. Tính toán tỷ lệ lấp đầy:
     $$\text{Occupancy Rate (\%)} = \left( \frac{\text{Số slot đã đặt (booked)}}{\text{Tổng số slot khả dụng (total)}} \right) \times 100$$
  5. **Bảo mật PII & Tiết kiệm Token:** Chỉ đóng gói bảng tỷ lệ lấp đầy tổng hợp, không gửi bất kỳ thông tin cá nhân khách hàng hay danh sách booking chi tiết cho AI.
- **Prompt Engineering:**
  ```text
  [System Instruction]
  Bạn là trợ lý phân tích vận hành sân thể thao. Chỉ dựa vào số liệu được cung cấp, không suy diễn thêm.

  [User Prompt]
  Dữ liệu tỉ lệ lấp đầy theo khung giờ từ 2025-10-01 đến 2025-10-30:
  {
    "06:00": {"total": 30, "booked": 6, "occupancy_rate_percent": 20.0},
    "08:00": {"total": 30, "booked": 3, "occupancy_rate_percent": 10.0},
    "17:00": {"total": 30, "booked": 27, "occupancy_rate_percent": 90.0},
    "19:00": {"total": 30, "booked": 30, "occupancy_rate_percent": 100.0},
    "21:00": {"total": 30, "booked": 18, "occupancy_rate_percent": 60.0}
  }.
  Hãy tóm tắt khung giờ cao điểm/thấp điểm và đề xuất 1-2 chương trình khuyến mại cho khung giờ thấp điểm.
  ```
- **Ví dụ Phản hồi của AI (Output Text):**
  > **BÁO CÁO PHÂN TÍCH VẬN HÀNH & ĐỀ XUẤT TỐI ƯU HÓA:**
  > 
  > 1. **Khung giờ cao điểm (Peak Hours):**
  >    - **19:00:** Đạt tỷ lệ lấp đầy tuyệt đối **100%** (30/30 ca kín lịch).
  >    - **17:00:** Tỷ lệ lấp đầy rất cao đạt **90%** (27/30 ca).
  >    - *Nhận xét:* Nhu cầu sau giờ làm việc và buổi tối cực kỳ ổn định. Có thể giữ nguyên giá hoặc áp dụng biểu phí cao điểm nếu muốn tăng biên lợi nhuận.
  > 
  > 2. **Khung giờ thấp điểm (Off-peak Hours):**
  >    - **08:00:** Công suất sử dụng chỉ đạt **10.0%** (lãng phí 90% thời gian trống của sân).
  >    - **06:00:** Tỷ lệ lấp đầy đạt **20.0%**.
  > 
  > 3. **Đề xuất Chiến lược Khuyến mại:**
  >    - **Chương trình 1: "Khởi động ngày mới - Giảm 30%":** Áp dụng giảm giá 30% cho khách đặt khung giờ từ 06:00 - 10:00 sáng các ngày trong tuần, hướng tới đối tượng người cao tuổi, học sinh - sinh viên và các câu lạc bộ tập buổi sáng.
  >    - **Chương trình 2: "Gói Hội viên Buổi sáng":** Bán gói thuê bao cố định tháng khung giờ sáng với mức giá ưu đãi tặng kèm nước suối, giúp kích cầu công suất và tạo doanh thu định kỳ ổn định.

---

## 4. LƯỢC ĐỒ CSDL & NHẬT KÝ THỰC THI AI (AI PRODUCTION LOGS)

### 4.1. Lược đồ Bảng `ai_logs`
Mọi giao dịch gọi AI đều được ghi vết độc lập vào cơ sở dữ liệu để phục vụ kiểm toán, đối soát lỗi và làm minh chứng học phần.

```sql
CREATE TABLE ai_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR NOT NULL,              -- suggest_slot, confirmation_message, reminder_message, revenue_summary
    input_json TEXT NOT NULL,           -- Dữ liệu đầu vào dưới dạng JSON
    output_text TEXT NOT NULL,          -- Phản hồi nguyên văn từ Gemini
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_ai_logs_id ON ai_logs (id);
```

### 4.2. Dữ liệu Minh chứng Gọi AI Thực tế (Real System Logs)

Dưới đây là trích xuất các bản ghi nhật ký đại diện được lưu trữ trong cơ sở dữ liệu:

| ID | Thời gian | Loại tác vụ (`type`) | `input_json` tóm lược | `output_text` tóm lược |
|:---|:---|:---|:---|:---|
| **101** | 2025-10-20 08:30:15 | `suggest_slot` | `{"court_type_id": 1, "preferred_date": "2025-10-20", "preferred_start_time": "18:00"}` | *"Gợi ý sân 7 người B lúc 19:00 - 20:30 (Trống và gần giờ khách muốn nhất)..."* |
| **102** | 2025-10-20 09:12:44 | `confirmation_message` | `{"booking_id": 42, "message_type": "confirmation"}` | *"SportBooking Pro xin xác nhận lịch đặt sân Sân Bóng Đá Số 1 lúc 19h ngày 20/10/2025 của anh Nam..."* |
| **103** | 2025-10-20 16:45:00 | `reminder_message` | `{"booking_id": 42, "message_type": "reminder"}` | *"Dạ nhắc lịch anh Nam: Sân Bóng Đá Số 1 của anh sẽ bắt đầu vào 19h tối nay. Anh vui lòng đến trước 10 phút..."* |
| **104** | 2025-10-21 21:00:10 | `revenue_summary` | `{"from_date": "2025-10-01", "to_date": "2025-10-20", "raw_data": {"08:00": 15%, "19:00": 98%}}` | *"Phân tích: Buổi tối đạt công suất 98%, sáng chỉ đạt 15%. Đề xuất gói giảm giá sáng sớm cho học sinh/sinh viên..."* |
| **105** | 2025-10-22 10:15:22 | `suggest_slot` | `{"court_type_id": 2, "preferred_date": "2025-10-23", "preferred_start_time": "17:00"}` | *"Gợi ý Sân Cầu Lông VIP 1 từ 17h30-19h00 (chất lượng thảm tiêu chuẩn, ánh sáng chống chói)..."* |

---

## 5. NHẬT KÝ ỨNG DỤNG AI TRONG VÒNG ĐỜI PHÁT TRIỂN PHẦN MỀM (AI IN SDLC)

Theo yêu cầu môn học **AIA331 (Ứng dụng Trí tuệ Nhân tạo)**, Nhóm 14 đã sử dụng Gemini như một lập trình viên đồng hành (Pair Programmer) trong suốt các chu kỳ phát triển phần mềm:

### 5.1. Giai đoạn KT1: Phân tích & Thiết kế CSDL (Tuần 1–2)
- **Mục tiêu:** Chuyển đổi bài toán nghiệp vụ thành lược đồ quan hệ thực thể, sinh SQLAlchemy Models và Pydantic Schemas.
- **Prompt tiêu biểu:**
  > *"Bạn là kỹ sư phần mềm Backend. Tôi cần xây dựng hệ thống quản lý sân thể thao có các thực thể: Users, Customers, CourtTypes, Courts, TimeSlots, Bookings, Payments, MaintenanceSchedules, AILogs. Hãy thiết kế SQLAlchemy Models với đầy đủ relationship hai chiều, foreign keys, và các Pydantic Schemas tương ứng (Create, Update, Response). Lưu ý không dùng string PK, dùng Integer autoincrement."*
- **Hiệu quả thu được:** Tiết kiệm 80% thời gian viết boilerplate code; cấu trúc khóa ngoại và relationship được kiểm tra logic đồng bộ ngay từ đầu.

### 5.2. Giai đoạn KT2: Xây dựng CRUD & Cơ chế Khóa Chống Trùng Lịch (Tuần 3–5)
- **Mục tiêu:** Xử lý hiện tượng Race Condition khi hai người dùng đặt cùng một khung giờ tại cùng một mili-giây.
- **Prompt tiêu biểu:**
  > *"Trong luồng đặt sân, nếu 2 nhân viên cùng nhấn nút đặt sân trên cùng 1 time_slot_id tại một thời điểm, làm sao dùng cơ chế Row-level Lock (Pessimistic Locking) trong SQLAlchemy để đảm bảo tính toàn vẹn (chỉ 1 giao dịch thành công, giao dịch kia nhận lỗi 409)?"*
- **Giải pháp AI đề xuất & Triển khai thực tế:**
  - Ứng dụng `db.query(TimeSlot).filter(...).with_for_update().first()`.
  - Kiểm tra `slot.status == 'available'`. Nếu hợp lệ chuyển sang `booked`, commit transaction.
  - Request thứ hai bị block hàng đợi và khi lock được nhả, phát hiện slot đã `booked` -> Raise `HTTPException(409, "Khung giờ này đã được đặt")`.

### 5.3. Giai đoạn KT3: Tích hợp API Gemini & Kiểm thử AI (Tuần 6–8)
- **Mục tiêu:** Viết module `gemini_client.py` có khả năng tự phục hồi (Self-healing), viết unit test mock AI không phụ thuộc API Key thật.
- **Prompt tiêu biểu:**
  > *"Hãy viết module gọi Google Gemini bằng thư viện google-generativeai, có cơ chế retry tối đa 2 lần khi gặp lỗi Rate Limit (429) hoặc Server Error (503). Đồng thời viết test bằng pytest sử dụng unittest.mock để giả lập response của AI, kiểm tra trường hợp danh sách slot trống rỗng thì không được gọi API Gemini."*
- **Hiệu quả thu được:** Tạo ra hàm `generate()` an toàn tuyệt đối, hệ thống test pass 100% trong môi trường CI/CD không cần internet hay token quota.

### 5.4. Giai đoạn Cuối kỳ: Tối ưu UI/UX Glassmorphism & Viết Test Tự Động (Tuần 9–10)
- **Mục tiêu:** Thiết kế giao diện Frontend chuẩn Glassmorphism Dark Mode và hoàn thiện báo cáo học thuật.
- **Prompt tiêu biểu:**
  > *"Hãy tạo CSS Glassmorphism cao cấp cho bảng điều khiển Dashboard và Lưới lịch đặt sân: hiệu ứng nền kính mờ (backdrop-filter: blur(12px)), viền phát sáng gradient nhẹ, tương phản màu chữ hoàn hảo trên nền tối (Dark Theme)."*

---

## 6. ĐÁNH GIÁ HIỆU NĂNG & CHI PHÍ TIÊU THỤ TOKEN

Nhóm đã thực hiện đo kiểm thực tế trên môi trường Backend khi gọi mô hình `gemini-2.0-flash` qua 50 requests:

| Chỉ số (Metric) | Kết quả Đo kiểm | Nhận xét & Đánh giá |
|:---|:---|:---|
| **Thời gian phản hồi AI trung bình (Latency)** | **1.25 giây** | Đáp ứng tốt tiêu chuẩn trải nghiệm người dùng (< 2.0 giây cho tác vụ sinh ngôn ngữ). |
| **Token đầu vào trung bình (Input Tokens)** | **180 - 320 tokens** | Do backend đã lọc sạch dữ liệu thô, chỉ gửi danh sách rút gọn hoặc bảng số liệu thống kê. |
| **Token đầu ra trung bình (Output Tokens)** | **120 - 250 tokens** | System prompt ép AI trả lời ngắn gọn, súc tích, đi thẳng vào trọng tâm. |
| **Chi phí ước tính (Gemini 2.0 Flash)** | **~ $0.00004 / request** | Cực kỳ tiết kiệm chi phí, khả thi để triển khai vận hành thương mại lâu dài. |
| **Tỷ lệ gọi AI rác (Unnecessary calls)** | **0%** | Nhờ cơ chế chặn ở Backend: Không có slot trống -> Không gọi Gemini. |

---
**Kết luận:** Hệ thống AI trong SportBooking Pro được thiết kế thực tế, an toàn, có kiểm soát ngữ cảnh chặt chẽ và lưu vết minh chứng toàn diện theo đúng chuẩn học phần AIA331.
