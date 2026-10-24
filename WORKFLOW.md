# WORKFLOW DỰ ÁN: Hệ thống Quản lý Sân Thể Thao Cho Thuê Tích Hợp AI
**Học phần:** AIA331 – Ứng dụng trí tuệ nhân tạo | Mã số: 80302
**Số thành viên:** 3
**AI hỗ trợ code:** Gemini 3.1 Pro (kết hợp làm AI Engine trong hệ thống)

> File này dùng để: (1) chia việc cho 3 thành viên, (2) làm "kịch bản prompt" đưa cho Gemini
> theo từng bước để code đúng trọng tâm, tránh lan man, (3) làm khung để viết báo cáo cuối kỳ.

---

## 0. QUY ƯỚC CHUNG TRƯỚC KHI CODE

### 0.1. Stack chốt (nhóm cần chọn 1 phương án rồi ghi vào đây, đừng đổi giữa chừng)
| Thành phần | Lựa chọn đề xuất | Lý do |
|---|---|---|
| Backend | **FastAPI** (Python) | Dễ sinh code với AI, tự động OpenAPI docs, async tốt cho AI call |
| Frontend | **React (Vite)** | Tách biệt rõ với backend, dễ AI sinh component |
| CSDL | **SQLite** (dev) → có thể nâng cấp PostgreSQL | Không cần cài server, phù hợp đồ án |
| ORM | **SQLAlchemy** | Chuẩn với FastAPI |
| AI Engine | **Gemini API** (model Gemini) | Đồng bộ với AI dùng để code |
| Auth | JWT (access token) | Đơn giản, đủ cho phân quyền quản lý/nhân viên |
| Test | **pytest** (backend), **Vitest** (frontend) | Yêu cầu đề bắt buộc có test |

### 0.2. Nguyên tắc làm việc với Gemini khi code
1. **Không đưa cả đề bài vào 1 prompt duy nhất** để bảo AI "code hết đi" — sẽ ra code rời rạc, khó ghép.
2. Luôn đưa cho Gemini theo thứ tự: **Schema CSDL → API từng module → Frontend từng màn hình → AI feature → Test**.
3. Mỗi lần yêu cầu Gemini code 1 module, **dán kèm schema CSDL hiện tại** và **danh sách API đã có** để AI không tạo trùng/lệch tên bảng, tên field.
4. Sau mỗi module Gemini sinh ra, **chạy thử ngay**, không dồn nhiều module rồi mới test.
5. Lưu tất cả prompt đã dùng vào thư mục `docs/ai-prompts/` để phục vụ báo cáo (giảng viên yêu cầu "Dùng AI trong SDLC").

### 0.3. Cấu trúc thư mục đề xuất
```
sport-court-booking/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # courts, slots, bookings, customers, payments, maintenance, auth, ai
│   │   ├── services/        # business logic (booking_service, ai_service...)
│   │   ├── ai/              # gemini_client.py, prompts.py
│   │   └── database.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── App.jsx
│   └── package.json
├── docs/
│   ├── ai-prompts/          # log toàn bộ prompt đã dùng với Gemini
│   ├── er-diagram.png
│   └── bao-cao-cuoi-ky.docx
└── WORKFLOW.md
```

---

## 1. PHÂN CÔNG 3 THÀNH VIÊN

| Thành viên | Vai trò | Phụ trách chính |
|---|---|---|
| **A** | Backend Core & CSDL | Auth, phân quyền, quản lý sân/loại sân/bảng giá, khung giờ, bảo trì |
| **B** | Backend Nghiệp vụ + AI | Đặt sân/đổi/hủy lịch, thanh toán, tích hợp Gemini (3 chức năng AI), thống kê |
| **C** | Frontend + Test + Tài liệu | Toàn bộ UI, viết test tích hợp, tổng hợp báo cáo, chuẩn bị demo |

> Ghi chú: A và B có thể đổi vai cho nhau tùy năng lực, nhưng **giữ nguyên ranh giới module** để tránh conflict code (mỗi router/model do đúng 1 người sửa).

---

## 2. THIẾT KẾ CSDL (chốt trước khi code, đưa nguyên bản này cho Gemini)

```
users (id, username, password_hash, full_name, role[admin|staff], created_at)

customers (id, full_name, phone, email, note, created_at)

court_types (id, name, description)   -- vd: sân bóng 7 người, sân cầu lông, sân tennis

courts (id, name, court_type_id FK, price_per_hour, status[active|maintenance|inactive])

time_slots (id, court_id FK, date, start_time, end_time, status[available|booked|blocked])

bookings (id, customer_id FK, court_id FK, time_slot_id FK, staff_id FK(users),
          status[pending|confirmed|cancelled|completed], deposit_amount,
          total_amount, created_at, note)

payments (id, booking_id FK, amount, method[cash|transfer|momo...],
          status[pending|paid|refunded], paid_at)

maintenance_schedules (id, court_id FK, start_date, end_date, reason, status[planned|in_progress|done])

ai_logs (id, type[suggest_slot|notify_message|revenue_summary], input_json,
         output_text, created_at)   -- phục vụ minh chứng "dùng AI trong hệ thống"
```

**Quan hệ chính:** `courts 1-n time_slots`, `time_slots 1-1 bookings`, `bookings 1-n payments`,
`courts 1-n maintenance_schedules`, `customers 1-n bookings`.

---

## 3. WORKFLOW THEO GIAI ĐOẠN SDLC (bám sát yêu cầu đề bài KT1 → KT2 → KT3 → Cuối kỳ)

### GIAI ĐOẠN KT1 — Phân tích & Thiết kế CSDL (Tuần 1–2)
**Người phụ trách:** Cả nhóm (A chủ trì)

**Việc cần làm:**
- [ ] Vẽ ERD từ schema ở mục 2 (dùng dbdiagram.io hoặc draw.io)
- [ ] Viết đặc tả use-case: Đặt sân, Đổi lịch, Hủy lịch, Thanh toán, Bảo trì
- [ ] Khởi tạo repo (git), cấu trúc thư mục như mục 0.3
- [ ] Setup FastAPI + SQLAlchemy + SQLite, tạo migration đầu tiên

**Prompt mẫu gửi Gemini (dùng để phân tích + sinh model):**
```
Bạn là kỹ sư backend. Tôi có schema CSDL sau cho hệ thống quản lý sân thể thao:
[dán nguyên schema mục 2]

Yêu cầu:
1. Sinh SQLAlchemy models (models/court.py, models/booking.py, ... tách file theo bảng)
2. Sinh Pydantic schemas tương ứng (Create, Update, Response) cho từng bảng
3. Không dùng SQLite mặc định string PK, dùng Integer autoincrement
4. Thêm relationship() đầy đủ hai chiều giữa các bảng liên quan
5. Giải thích ngắn gọn các ràng buộc khóa ngoại quan trọng
```

---

### GIAI ĐOẠN KT2 — CRUD & Xử lý trùng lịch (Tuần 3–5)
**Người phụ trách:** A (sân/khung giờ/bảo trì), B (đặt sân/thanh toán)

**Việc cần làm:**
- [ ] CRUD: courts, court_types, time_slots, maintenance_schedules (A)
- [ ] CRUD + logic: bookings, payments, customers (B)
- [ ] **Logic chống trùng lịch** (quan trọng nhất, giảng viên nhấn mạnh): khi đặt sân, kiểm tra
      `time_slot.status == available` trong transaction, khóa slot ngay khi tạo booking `pending`
- [ ] Debug các case: 2 người đặt cùng lúc 1 khung giờ, hủy lịch trả slot về available, đổi lịch (huỷ slot cũ + giữ slot mới)
- [ ] Auth JWT + phân quyền admin/staff (A)

**Prompt mẫu gửi Gemini (sinh CRUD):**
```
Dựa trên models sau: [dán models đã có]
Hãy sinh router FastAPI cho "courts" gồm: GET list (có filter theo court_type),
GET by id, POST, PUT, DELETE (soft delete bằng status=inactive).
Dùng dependency injection cho DB session và cho current_user (JWT), chỉ role
"admin" mới được xóa/sửa giá sân.
```

**Prompt mẫu debug trùng lịch:**
```
Đây là logic đặt sân hiện tại: [dán code booking_service.py]
Có bug: khi 2 request đặt cùng time_slot_id gửi gần như đồng thời, cả 2 đều
tạo được booking. Hãy sửa để dùng transaction + row lock (SELECT ... FOR UPDATE
hoặc kiểm tra lại status trong cùng transaction trước khi commit) để chỉ 1
request thành công, request còn lại trả lỗi 409 "Khung giờ vừa được đặt".
```

---

### GIAI ĐOẠN KT3 — Tích hợp AI (Tuần 6–8)
**Người phụ trách:** B chủ trì, C hỗ trợ frontend hiển thị kết quả AI

**3 chức năng AI cần code đúng theo đề:**

#### AI-1: Gợi ý khung giờ trống
```
System: Bạn là trợ lý đặt sân thể thao. Chỉ gợi ý khung giờ còn trống trong dữ liệu,
không tự bịa thêm khung giờ không có trong danh sách.

User: Khách muốn đặt sân bóng 7 người tối thứ Sáu. Dữ liệu khung giờ trống:
{{available_slots}}. Hãy gợi ý 2-3 lựa chọn phù hợp, giải thích ngắn gọn vì sao phù hợp.
```
**Việc cần code:** endpoint `POST /ai/suggest-slot` nhận `{court_type, preferred_time, date}`
→ backend tự truy vấn `time_slots WHERE status=available` phù hợp điều kiện → nhét vào
`{{available_slots}}` → gọi Gemini → trả JSON gợi ý → lưu vào `ai_logs`.

#### AI-2: Sinh tin nhắn xác nhận/nhắc lịch
```
System: Bạn là trợ lý chăm sóc khách hàng sân thể thao, viết tin nhắn ngắn gọn,
thân thiện, đúng thông tin được cung cấp, không thêm số liệu không có.

User: Sinh tin nhắn xác nhận đặt sân với thông tin: khách {{customer_name}},
sân {{court_name}}, ngày {{date}}, giờ {{time}}, tiền cọc {{deposit}}.
```
**Việc cần code:** trigger tự động khi `booking.status = confirmed` → gọi Gemini
sinh nội dung → lưu vào `ai_logs` + hiển thị/gửi cho khách (email hoặc hiển thị UI, đồ án
không bắt buộc gửi SMS thật).

#### AI-3: Tóm tắt công suất & gợi ý khuyến mại giờ thấp điểm
```
System: Bạn là trợ lý phân tích vận hành sân thể thao. Chỉ dựa vào số liệu được cung cấp.

User: Dữ liệu công suất sử dụng sân theo khung giờ trong tuần: {{occupancy_data}}.
Hãy tóm tắt khung giờ cao điểm/thấp điểm và đề xuất 1-2 chương trình khuyến mại
cho khung giờ thấp điểm.
```
**Việc cần code:** endpoint `GET /ai/occupancy-summary?from=&to=` → backend tính tỉ lệ
lấp đầy từng khung giờ từ bảng `bookings` → gửi số liệu tổng hợp (không gửi dữ liệu thô
toàn bộ khách hàng) cho Gemini → trả về báo cáo dạng text.

**Prompt mẫu gửi Gemini để code phần tích hợp:**
```
Hãy viết module ai/gemini_client.py cho FastAPI, dùng thư viện google-generativeai
(hoặc REST API Gemini), có hàm generate(system_prompt, user_prompt) trả về text,
có xử lý lỗi (timeout, rate limit) và retry tối đa 2 lần. Sau đó viết router
/ai/suggest-slot theo mô tả sau: [dán mô tả AI-1 ở trên]. Lưu input/output vào
bảng ai_logs qua service riêng, không lưu trực tiếp trong router.
```

**Việc cần làm:**
- [ ] Module `ai/gemini_client.py`
- [ ] 3 endpoint AI như trên
- [ ] Test AI với: dữ liệu hết sân (rỗng) → AI phải trả lời "không còn khung giờ trống", không bịa
- [ ] Test AI với dữ liệu thiếu field → không crash, trả lỗi rõ ràng

---

### GIAI ĐOẠN CUỐI KỲ — Hoàn thiện, Test, Tài liệu (Tuần 9–10)
**Người phụ trách:** C chủ trì, A/B hỗ trợ fix bug

**Việc cần làm:**
- [ ] Frontend đầy đủ: Đăng nhập, Dashboard, Quản lý sân, Đặt lịch (dạng lịch/calendar),
      Khách hàng, Thanh toán, Bảo trì, Thống kê, Trợ lý AI (chat gợi ý khung giờ)
- [ ] Viết test:
  - `test_booking.py`: đặt sân thành công, đặt trùng slot phải fail
  - `test_payment.py`: tạo thanh toán, cập nhật trạng thái booking khi thanh toán đủ
  - `test_ai.py`: mock Gemini response, test case hết sân / dữ liệu thiếu
- [ ] Viết báo cáo cuối kỳ (dùng AI hỗ trợ) gồm: mô tả bài toán, kiến trúc, ERD, API docs,
      minh chứng dùng AI từng giai đoạn (đính kèm log prompt từ `docs/ai-prompts/`), kết quả test
- [ ] Chuẩn bị slide + kịch bản demo (luồng: đăng nhập → tạo sân → khách đặt sân qua gợi ý AI
      → xác nhận → thanh toán → xem báo cáo công suất AI tóm tắt)

**Prompt mẫu gửi Gemini để viết tài liệu:**
```
Dựa trên mô tả hệ thống và các API sau: [dán danh sách endpoint + schema],
hãy viết báo cáo dự án theo cấu trúc: 1. Mô tả bài toán, 2. Kiến trúc hệ thống,
3. Thiết kế CSDL (kèm giải thích), 4. Chức năng quản lý, 5. Chức năng AI
(kèm ví dụ prompt và output thực tế), 6. Kết quả kiểm thử, 7. Hướng phát triển.
Văn phong học thuật, tiếng Việt, có mục lục.
```

---

## 4. CHECKLIST KIỂM THỬ BẮT BUỘC (theo đúng yêu cầu đề bài)

| Nhóm test | Case cần có |
|---|---|
| Đặt sân | Đặt thành công, đặt khi hết slot, đặt sai loại sân |
| Trùng lịch | 2 request đồng thời cùng 1 slot → chỉ 1 thành công |
| Thanh toán | Thanh toán đủ, thanh toán cọc, hoàn cọc khi hủy đúng hạn |
| AI | Hết sân (dữ liệu rỗng), dữ liệu thiếu field, phản hồi đúng định dạng JSON/text |

---

## 5. TIẾN ĐỘ TỔNG QUAN (điền vào khi làm)

| Tuần | Giai đoạn | Trạng thái |
|---|---|---|
| 1–2 | KT1: Phân tích, CSDL, ERD | ☐ Chưa bắt đầu |
| 3–5 | KT2: CRUD, chống trùng lịch, auth | ☐ Chưa bắt đầu |
| 6–8 | KT3: Tích hợp Gemini (3 chức năng AI) | ☐ Chưa bắt đầu |
| 9–10 | Frontend hoàn thiện, test, báo cáo, demo | ☐ Chưa bắt đầu |

---

*File này nên commit vào repo ngay từ đầu (`WORKFLOW.md` ở thư mục gốc) để cả 3 thành viên
và AI (khi được dán ngữ cảnh) đều bám theo cùng 1 kế hoạch, tránh code lệch hướng nhau.*
