# THIẾT KẾ UI/UX TỔNG QUAN
## Hệ thống Quản lý Sân Thể Thao Cho Thuê Tích Hợp AI

> File này dùng để: (1) thống nhất giao diện giữa các thành viên trước khi code frontend,
> (2) làm ngữ cảnh dán cho Gemini khi yêu cầu code từng màn hình, (3) làm tài liệu cho báo cáo/demo.

---

## 1. NGUYÊN TẮC THIẾT KẾ CHUNG

- **Đối tượng dùng chính:** Nhân viên/quản lý sân — thao tác nhanh, nhiều trong ngày, không phải người rành công nghệ. Ưu tiên **rõ ràng, ít click, phản hồi tức thì** hơn là hoa mỹ.
- **Layout chuẩn:** Sidebar cố định bên trái + Topbar trên cùng + vùng nội dung chính (kiểu dashboard admin quen thuộc).
- **Responsive:** Ưu tiên desktop/tablet (máy tính quầy lễ tân), vẫn cần chạy được trên mobile ở mức xem cơ bản (không bắt buộc tối ưu 100%).
- **Trạng thái luôn phải nhìn thấy bằng màu sắc** (khung giờ trống/đã đặt/bảo trì, booking pending/confirmed/cancelled...) — không chỉ dựa vào chữ.
- **AI luôn được đánh dấu rõ ràng** (icon ✨ hoặc badge "AI gợi ý") để người dùng phân biệt đâu là dữ liệu hệ thống, đâu là output của AI — quan trọng để giám khảo thấy rõ phần tích hợp AI khi demo.

---

## 2. DESIGN SYSTEM (Style Guide)

### 2.1. Bảng màu

| Vai trò | Màu | Mã hex gợi ý | Ý nghĩa dùng |
|---|---|---|---|
| Primary | Xanh dương đậm | `#1E40AF` | Nút chính, sidebar active, link |
| Primary hover | Xanh dương nhạt hơn | `#2563EB` | Hover state |
| Success | Xanh lá | `#16A34A` | Khung giờ available, booking confirmed, payment paid |
| Warning | Vàng cam | `#F59E0B` | Booking pending, deposit chưa đủ, sắp hết hạn |
| Danger | Đỏ | `#DC2626` | Khung giờ booked/đã đặt, cancelled, lỗi |
| Neutral (bảo trì) | Xám | `#6B7280` | Sân đang bảo trì, blocked |
| AI accent | Tím | `#7C3AED` | Mọi thành phần liên quan AI (badge, nút, khung chat) — để tách biệt hoàn toàn khỏi dữ liệu hệ thống thường |
| Background | Xám rất nhạt | `#F9FAFB` | Nền trang |
| Surface (card) | Trắng | `#FFFFFF` | Card, bảng, modal |
| Text chính | Xám đậm | `#111827` | Chữ nội dung |
| Text phụ | Xám nhạt | `#6B7280` | Chữ ghi chú, placeholder |

### 2.2. Typography

- Font: **Inter** hoặc **Be Vietnam Pro** (hỗ trợ tiếng Việt có dấu tốt, phong cách hiện đại)
- Heading trang (H1): 24px, bold
- Heading khu vực (H2): 18px, semibold
- Nội dung: 14px, regular
- Ghi chú/label nhỏ: 12px, medium, màu text phụ

### 2.3. Component chuẩn dùng lại nhiều nơi

| Component | Mô tả | Dùng ở đâu |
|---|---|---|
| `StatusBadge` | Badge màu tròn theo status (map theo bảng màu 2.1) | Bảng booking, lịch sân, thanh toán |
| `SlotCell` | Ô vuông nhỏ trong lưới lịch, đổi màu theo status, click để đặt | Trang Lịch đặt sân |
| `AICard` | Khung viền tím, icon ✨, dùng bọc mọi output từ Gemini | Gợi ý khung giờ, tin nhắn xác nhận, báo cáo công suất |
| `DataTable` | Bảng có sort, filter, phân trang, nút hành động cuối dòng | Sân, khách hàng, booking, thanh toán, bảo trì |
| `ConfirmModal` | Modal xác nhận hành động nguy hiểm (hủy lịch, xóa sân) | Toàn hệ thống |
| `StatCard` | Thẻ số liệu lớn (doanh thu, tổng booking...) trên Dashboard | Dashboard, Thống kê |
| `EmptyState` | Hình minh họa + text khi bảng/danh sách rỗng | Mọi danh sách |

---

## 3. SITEMAP (Danh sách toàn bộ trang)

```
/login                          Đăng nhập
/dashboard                      Trang tổng quan (Dashboard)
/courts                         Quản lý sân + loại sân
/schedule                       Lịch đặt sân (trang trung tâm, dùng nhiều nhất)
/bookings                       Danh sách & chi tiết đặt sân
/customers                      Quản lý khách hàng
/payments                       Quản lý thanh toán
/maintenance                    Lịch bảo trì sân
/reports                        Báo cáo & thống kê (có tích hợp AI tóm tắt)
/ai-assistant                   Trợ lý AI (chat gợi ý khung giờ) — có thể nhúng dạng widget nổi thay vì trang riêng
/settings/users                 Quản lý người dùng (chỉ admin)
```

> Gợi ý: `/ai-assistant` nên làm dạng **widget chat nổi góc màn hình** (giống chat bubble) xuất hiện ở mọi trang, thay vì bắt người dùng phải chuyển trang riêng — trải nghiệm tự nhiên hơn và dễ demo hơn.

---

## 4. BỐ CỤC KHUNG CHUNG (Layout Shell)

```
┌─────────────────────────────────────────────────────────┐
│  Topbar: [Logo]      [Tên trang hiện tại]   [User ▾][🔔] │
├───────────┬─────────────────────────────────────────────┤
│           │                                             │
│ Sidebar   │              Vùng nội dung chính             │
│ - Dashboard│                                            │
│ - Lịch sân │                                            │
│ - Đặt sân  │                                            │
│ - Khách hàng│                                           │
│ - Thanh toán│                                           │
│ - Bảo trì  │                                            │
│ - Báo cáo  │                                            │
│ - (Users)  │ admin only                                 │
│           │                                             │
└───────────┴─────────────────────────────────────────────┘
                                          [💬 AI Assistant] ← nổi góc phải dưới
```

- Sidebar: highlight mục đang active bằng nền `Primary` nhạt + chữ `Primary`.
- Topbar bên phải: dropdown user (tên, role, nút đăng xuất).
- Nếu role = `staff`: ẩn mục "Quản lý người dùng" và các nút sửa giá/xóa sân.

---

## 5. THIẾT KẾ CHI TIẾT TỪNG TRANG

### 5.1. `/login` — Đăng nhập
- Layout căn giữa màn hình, form đơn giản: username, password, nút "Đăng nhập".
- Logo + tên hệ thống phía trên form.
- Thông báo lỗi inline dưới field khi sai tài khoản/mật khẩu (không dùng alert popup).

### 5.2. `/dashboard` — Tổng quan
**Mục đích:** cái nhìn nhanh khi vừa đăng nhập.

- Hàng `StatCard` trên cùng (4 thẻ): Tổng booking hôm nay, Doanh thu hôm nay, Sân đang hoạt động/tổng sân, Tỉ lệ lấp đầy hôm nay.
- Biểu đồ nhỏ: Doanh thu 7 ngày gần nhất (line chart).
- Danh sách "Booking sắp diễn ra trong 2 giờ tới" (để nhân viên chuẩn bị sân).
- Khối `AICard`: "Gợi ý hôm nay" — tóm tắt ngắn từ AI-3 (occupancy-summary) dạng rút gọn, có nút "Xem báo cáo đầy đủ" dẫn sang `/reports`.

### 5.3. `/schedule` — Lịch đặt sân (trang quan trọng nhất, dùng nhiều nhất)
**Mục đích:** xem nhanh khung giờ trống/đã đặt, đặt sân trực tiếp từ lưới.

- Bố cục dạng **lưới lịch (calendar grid)**:
  - Cột: từng sân (Sân 1, Sân 2, Sân cầu lông A...)
  - Hàng: khung giờ trong ngày (06:00 - 22:00, mỗi ô 1 tiếng theo thiết kế `time_slots`)
  - Mỗi ô (`SlotCell`) tô màu theo status: xanh lá = available, đỏ = booked, xám = maintenance/blocked
- Thanh điều khiển trên cùng: chọn ngày (date picker + nút "Hôm nay"), filter theo loại sân.
- **Click vào ô trống** → mở modal "Đặt sân nhanh" (chọn khách hàng có sẵn hoặc tạo mới, nhập tiền cọc, xác nhận).
- **Click vào ô đã đặt** → mở panel chi tiết booking (thông tin khách, trạng thái, nút Hủy/Đổi lịch/Xem thanh toán).
- Nút nổi góc trên: **"✨ Nhờ AI gợi ý khung giờ"** → mở modal nhập nhu cầu (loại sân, ngày, khung giờ mong muốn) → gọi AI-1 → hiển thị kết quả trong `AICard` kèm danh sách slot có nút "Đặt ngay" (bấm là điền sẵn form đặt sân nhanh).

### 5.4. `/bookings` — Danh sách đặt sân
- `DataTable`: cột Mã booking, Khách hàng, Sân, Ngày giờ, Trạng thái (`StatusBadge`), Tiền cọc, Tổng tiền, Hành động.
- Filter: theo trạng thái, khoảng ngày, sân.
- Click vào 1 dòng → trang/modal chi tiết booking:
  - Thông tin đầy đủ + lịch sử thanh toán liên quan
  - Nút "Xác nhận" (pending → confirmed), "Hủy lịch", "Đổi lịch"
  - Nút **"✨ Sinh tin nhắn xác nhận"** → gọi AI-2 → hiển thị kết quả trong `AICard` với nút "Sao chép" để nhân viên gửi thủ công qua Zalo/SMS.

### 5.5. `/courts` — Quản lý sân
- Tab con: "Danh sách sân" / "Loại sân".
- Danh sách sân dạng `DataTable` hoặc dạng thẻ (card) hiển thị ảnh minh họa (placeholder), tên sân, loại, giá/giờ, trạng thái.
- Form thêm/sửa sân: tên, loại sân (dropdown), giá theo giờ, trạng thái.
- Chỉ role `admin` thấy nút Thêm/Sửa/Xóa; `staff` chỉ xem.

### 5.6. `/customers` — Quản lý khách hàng
- `DataTable`: tên, sđt, email, tổng số lần đặt, nút xem chi tiết.
- Trang chi tiết khách hàng: thông tin cơ bản + `DataTable` lịch sử booking của riêng khách đó.
- Tìm kiếm nhanh theo tên/số điện thoại ở đầu trang (dùng nhiều khi khách gọi điện đặt sân).

### 5.7. `/payments` — Thanh toán
- `DataTable`: Mã booking, Khách hàng, Số tiền, Phương thức, Trạng thái, Ngày thanh toán.
- Nút "Ghi nhận thanh toán" mở modal: chọn booking, nhập số tiền, phương thức, trạng thái.
- Hiển thị rõ **số tiền còn thiếu** so với `total_amount` của booking (progress bar nhỏ: đã cọc/đã trả trên tổng cần trả).

### 5.8. `/maintenance` — Lịch bảo trì
- Dạng danh sách hoặc mini-calendar theo sân.
- Form: chọn sân, ngày bắt đầu/kết thúc, lý do, trạng thái.
- Cảnh báo (banner vàng) nếu khoảng bảo trì trùng với booking đã confirmed sẵn trên sân đó — nhắc nhân viên xử lý trước khi lưu.

### 5.9. `/reports` — Báo cáo & Thống kê
**Mục đích:** trang thể hiện rõ nhất giá trị AI mang lại — nên đầu tư kỹ vì đây là điểm nhấn khi demo/chấm điểm.

- Bộ lọc khoảng ngày ở trên cùng.
- Biểu đồ cột: Doanh thu theo ngày/tuần.
- Biểu đồ nhiệt (heatmap) hoặc bar chart: Tỉ lệ lấp đầy theo từng khung giờ trong ngày (dữ liệu `raw_data` từ AI-3) — đây là biểu đồ do **hệ thống tự vẽ** từ số liệu thật.
- Khối `AICard` lớn bên dưới biểu đồ: **"✨ AI tóm tắt & đề xuất khuyến mại"** — nút "Tạo báo cáo AI" gọi AI-3, hiển thị đoạn text phân tích khung giờ cao/thấp điểm + gợi ý khuyến mại.
- Nút "Xuất báo cáo" (tùy chọn nâng cao, không bắt buộc): xuất PDF/Excel.

### 5.10. AI Assistant Widget (chat nổi, xuất hiện mọi trang)
- Icon tròn 💬 góc dưới phải, click để mở panel chat nhỏ (giống Messenger).
- Người dùng gõ tự nhiên: *"Tối thứ Sáu có sân bóng 7 người nào trống không?"*
- Hệ thống parse nhu cầu cơ bản (loại sân, ngày, khung giờ mong muốn) → gọi AI-1 → trả lời ngay trong khung chat, kèm nút "Đặt sân này" nếu có gợi ý phù hợp.
- Đây chính là nơi thể hiện trực quan nhất "AI tư vấn khung giờ" theo đúng mô tả đề bài.

### 5.11. `/settings/users` — Quản lý người dùng (admin only)
- `DataTable`: username, họ tên, vai trò, ngày tạo.
- Form thêm nhân viên mới: username, mật khẩu, họ tên, vai trò (dropdown admin/staff).

---

## 6. LUỒNG NGƯỜI DÙNG CHÍNH (User Flows)

### Flow 1: Nhân viên đặt sân cho khách gọi điện tới
```
Đăng nhập → /schedule → chọn ngày → xem lưới, thấy ô trống phù hợp
→ click ô trống → modal đặt nhanh → tìm khách hàng có sẵn (hoặc tạo mới)
→ nhập tiền cọc → Xác nhận → ô chuyển màu đỏ ngay lập tức
→ (tùy chọn) mở chi tiết booking → "✨ Sinh tin nhắn xác nhận"
→ copy tin nhắn gửi Zalo cho khách
```

### Flow 2: Khách không rõ giờ nào trống, cần AI tư vấn
```
Nhân viên mở AI Assistant Widget (hoặc nút "✨ Nhờ AI gợi ý" trên /schedule)
→ nhập nhu cầu (loại sân, ngày, khung giờ mong muốn)
→ AI trả về 2-3 gợi ý kèm giải thích
→ nhân viên bấm "Đặt ngay" trên gợi ý phù hợp → vào thẳng flow đặt sân
```

### Flow 3: Quản lý xem báo cáo cuối tuần
```
Đăng nhập → /reports → chọn khoảng ngày tuần vừa qua
→ xem biểu đồ doanh thu + tỉ lệ lấp đầy theo khung giờ
→ bấm "Tạo báo cáo AI" → đọc tóm tắt khung giờ cao/thấp điểm
→ đọc gợi ý khuyến mại → quyết định áp dụng chương trình giảm giá giờ thấp điểm
```

### Flow 4: Hủy lịch
```
/bookings hoặc /schedule → chọn booking → "Hủy lịch"
→ ConfirmModal cảnh báo rõ (nếu đã thanh toán, hiển thị số tiền cần hoàn)
→ Xác nhận → slot trở về available, booking chuyển "cancelled"
```

---

## 7. QUY TẮC HIỂN THỊ TRẠNG THÁI (áp dụng nhất quán toàn hệ thống)

| Trạng thái | Màu | Icon gợi ý |
|---|---|---|
| `available` (slot) | Xanh lá | — |
| `booked` (slot) | Đỏ | 🔒 |
| `blocked/maintenance` (slot, sân) | Xám | 🛠️ |
| `pending` (booking) | Vàng | ⏳ |
| `confirmed` (booking) | Xanh lá | ✅ |
| `cancelled` (booking) | Đỏ nhạt/gạch ngang | ✖️ |
| `completed` (booking) | Xanh dương nhạt | 🏁 |
| `pending/paid/refunded` (payment) | Vàng/Xanh lá/Xám | — |

---

## 8. GHI CHÚ CHO PHẦN CODE FRONTEND (đưa Gemini khi bắt đầu code từng trang)

- Dùng React Router cho các route ở mục 3.
- State toàn cục cần thiết: current user + token (Context API hoặc Zustand — chọn 1, không dùng Redux cho đồ án nhỏ).
- Gọi API qua 1 module `src/api/client.js` dùng axios, tự đính kèm Bearer token, tự bắt lỗi 401 để redirect về `/login`.
- Mọi màn hình gọi API AI đều phải có **loading state riêng** (không dùng chung loading của trang) vì AI có thể mất 2-5 giây — hiển thị skeleton hoặc "AI đang phân tích..." trong `AICard`.
- Ưu tiên code **`/schedule`** trước tiên (trang lõi, giá trị demo cao nhất), sau đó đến `/bookings`, `/reports`, cuối cùng mới đến các trang quản trị đơn giản (`/customers`, `/courts`, `/maintenance`, `/payments`, `/settings/users`).
