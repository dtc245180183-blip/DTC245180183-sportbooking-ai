# THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN SPECIFICATION)

**Dự án:** Hệ thống Quản lý Sân Thể Thao Tích Hợp AI (SportBooking Pro)  
**Học phần:** AIA331 – Ứng dụng Trí tuệ Nhân tạo | **Mã lớp:** 80302  
**Thực hiện:** Nhóm 14  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** Tháng 09/2025  

---

## MỤC LỤC
1. [Giới thiệu & Triết lý Thiết kế](#1-giới-thiệu--triết-lý-thiết-kế)
2. [Sơ đồ Quan hệ Thực thể (Entity Relationship Diagram - ERD)](#2-sơ-đồ-quan-hệ-thực-thể-entity-relationship-diagram---erd)
3. [Từ điển Dữ liệu Chi tiết (Data Dictionary)](#3-từ-điển-dữ-liệu-chi-tiết-data-dictionary)
   - 3.1. Bảng `users` (Tài khoản & Phân quyền)
   - 3.2. Bảng `court_types` (Danh mục Loại sân)
   - 3.3. Bảng `courts` (Thông tin Sân thể thao)
   - 3.4. Bảng `time_slots` (Khung giờ hoạt động)
   - 3.5. Bảng `customers` (Hồ sơ Khách hàng)
   - 3.6. Bảng `bookings` (Giao dịch Đặt sân)
   - 3.7. Bảng `payments` (Lịch sử Thanh toán & Hóa đơn)
   - 3.8. Bảng `maintenance_schedules` (Lịch trình Bảo trì Sân)
   - 3.9. Bảng `ai_logs` (Nhật ký Tương tác AI)
4. [Chiến lược Kiểm soát Tương tranh & Chống Trùng Lịch (Concurrency Control)](#4-chiến-lược-kiểm-soát-tương-tranh--chống-trùng-lịch-concurrency-control)
   - 4.1. Bài toán Xung đột Khung giờ (Race Condition)
   - 4.2. Cơ chế Khóa Bi quan (Pessimistic Row-Level Lock)
   - 4.3. Quy trình Thực thi Transaction Đặt sân
5. [Chiến lược Đánh Chỉ mục (Indexing Strategy)](#5-chiến-lược-đánh-chỉ-mục-indexing-strategy)
6. [Quy trình Khởi tạo & Dữ liệu Mẫu (Seed Data)](#6-quy-trình-khởi-tạo--dữ-liệu-mẫu-seed-data)

---

## 1. GIỚI THIỆU & TRIẾT LÝ THIẾT KẾ

Cơ sở dữ liệu của **SportBooking Pro** được xây dựng theo mô hình quan hệ (RDBMS) chuẩn hóa (3NF - Third Normal Form), tối ưu hóa cho các thao tác giao dịch (OLTP) có tần suất cao và yêu cầu toàn vẹn dữ liệu nghiêm ngặt.

### 1.1. Công nghệ & Công cụ Quản trị
- **Hệ quản trị CSDL (DBMS):** **SQLite 3** (sử dụng trong môi trường Development và Automated Test do tính nhẹ, không cần cài đặt daemon phức tạp) và hoàn toàn tương thích chuyển đổi sang **PostgreSQL 15+** (cho môi trường Production thực tế).
- **Object-Relational Mapping (ORM):** **SQLAlchemy 2.0** trên nền tảng Python 3.10+. Khai báo theo trường phái Declarative Base, quản lý phiên qua `SessionLocal` và Dependency Injection của FastAPI.
- **Validation tầng ứng dụng:** Sử dụng **Pydantic v2** đồng bộ 1:1 với schema CSDL để xác thực kiểu dữ liệu trước khi thực hiện ghi xuống ổ đĩa.

### 1.2. Triết lý Thiết kế Cốt lõi
1. **Toàn vẹn Dữ liệu (ACID Compliance):** Mọi thao tác tài chính, đặt lịch và thay đổi trạng thái sân đều nằm trong các Database Transaction nguyên tử.
2. **Khóa slot độc quyền (Atomic Slot Reservation):** Ngăn chặn triệt để tình trạng hai người cùng đặt một khung giờ thông qua cơ chế khóa bản ghi.
3. **Minh chứng AI (AI Auditing):** Bảng `ai_logs` lưu giữ toàn bộ dữ liệu đầu vào và đầu ra khi tương tác với LLM, đảm bảo tính minh bạch và phục vụ đánh giá đồ án môn AIA331.

---

## 2. SƠ ĐỒ QUAN HỆ THỰC THỂ (ENTITY RELATIONSHIP DIAGRAM - ERD)

Dưới đây là lược đồ quan hệ thực thể hoàn chỉnh của hệ thống:

```mermaid
erDiagram
    users ||--o{ bookings : "creates (staff)"
    court_types ||--|{ courts : "categorizes"
    courts ||--|{ time_slots : "schedules"
    courts ||--o{ maintenance_schedules : "undergoes"
    customers ||--o{ bookings : "places"
    time_slots ||--o| bookings : "reserved_by (1-1)"
    bookings ||--|{ payments : "paid_through"

    users {
        int id PK
        string username UK
        string password_hash
        string full_name
        string role "admin | staff"
        datetime created_at
    }

    court_types {
        int id PK
        string name
        text description
        string image_url
    }

    courts {
        int id PK
        string name
        int court_type_id FK
        float price_per_hour
        string status "active | maintenance | inactive"
        string image_url
    }

    time_slots {
        int id PK
        int court_id FK
        date date
        time start_time
        time end_time
        string status "available | booked | blocked"
    }

    customers {
        int id PK
        string full_name
        string phone UK_idx
        string email
        text note
        datetime created_at
    }

    bookings {
        int id PK
        int customer_id FK
        int court_id FK
        int time_slot_id FK_UK
        int staff_id FK
        string status "pending | confirmed | cancelled | completed"
        float deposit_amount
        float total_amount
        text note
        datetime created_at
    }

    payments {
        int id PK
        int booking_id FK
        float amount
        string method "cash | transfer | momo"
        string status "pending | paid | refunded"
        datetime paid_at
    }

    maintenance_schedules {
        int id PK
        int court_id FK
        date start_date
        date end_date
        text reason
        string status "planned | in_progress | done"
    }

    ai_logs {
        int id PK
        string type "suggest_slot | confirmation_message | reminder_message | revenue_summary"
        text input_json
        text output_text
        datetime created_at
    }
```

---

## 3. TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATA DICTIONARY)

### 3.1. Bảng `users` (Tài khoản & Phân quyền)
Lưu trữ tài khoản nội bộ sử dụng hệ thống (Ban quản trị và Nhân viên lễ tân).

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|:---|:---|:---|:---|:---|
| `id` | `INTEGER` | `PRIMARY KEY`, Auto Increment | Tự tăng | Khóa chính duy nhất của người dùng |
| `username` | `VARCHAR` | `UNIQUE`, `NOT NULL`, `INDEX` | - | Tên đăng nhập dùng xác thực hệ thống |
| `password_hash` | `VARCHAR` | `NOT NULL` | - | Mật khẩu đã băm bằng thuật toán Bcrypt |
| `full_name` | `VARCHAR` | `NOT NULL` | - | Họ và tên hiển thị trên phần mềm |
| `role` | `VARCHAR` | `NOT NULL`, `CHECK(role IN ('admin', 'staff'))` | - | Phân quyền vai trò: Quản lý hoặc Nhân viên |
| `created_at` | `DATETIME` | `NULLABLE` | `CURRENT_TIMESTAMP` | Thời điểm tạo tài khoản |

---

### 3.2. Bảng `court_types` (Danh mục Loại sân)
Phân loại các môn thể thao và quy mô sân (Ví dụ: Sân bóng đá 7 người, Sân cầu lông tiêu chuẩn, Sân Pickleball, Sân Tennis).

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|:---|:---|:---|:---|:---|
| `id` | `INTEGER` | `PRIMARY KEY`, Auto Increment | Tự tăng | Khóa chính phân loại |
| `name` | `VARCHAR` | `NOT NULL`, `INDEX` | - | Tên phân loại sân |
| `description` | `TEXT` | `NULLABLE` | `NULL` | Mô tả đặc tính mặt sân, ánh sáng, tiêu chuẩn |
| `image_url` | `VARCHAR` | `NULLABLE` | `NULL` | Đường dẫn ảnh đại diện của loại sân |

---

### 3.3. Bảng `courts` (Thông tin Sân thể thao)
Quản lý từng sân cụ thể trong cơ sở thể thao.

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|:---|:---|:---|:---|:---|
| `id` | `INTEGER` | `PRIMARY KEY`, Auto Increment | Tự tăng | Khóa chính định danh sân |
| `name` | `VARCHAR` | `NOT NULL`, `INDEX` | - | Tên định danh (vd: Sân bóng đá 1, Sân VIP 2) |
| `court_type_id` | `INTEGER` | `FOREIGN KEY (court_types.id)`, `NOT NULL` | - | Tham chiếu đến loại sân tương ứng |
| `price_per_hour` | `FLOAT` | `NOT NULL` | - | Đơn giá thuê 1 giờ tiêu chuẩn (VNĐ) |
| `status` | `VARCHAR` | `NOT NULL` | `'active'` | Trạng thái sân (`active`, `maintenance`, `inactive`) |
| `image_url` | `VARCHAR` | `NULLABLE` | `NULL` | Đường dẫn ảnh chụp thực tế của sân |

---

### 3.4. Bảng `time_slots` (Khung giờ hoạt động)
Lưu trữ các block thời gian được chia sẵn theo ngày của từng sân để khách thuê.

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|:---|:---|:---|:---|:---|
| `id` | `INTEGER` | `PRIMARY KEY`, Auto Increment | Tự tăng | Khóa chính khung giờ |
| `court_id` | `INTEGER` | `FOREIGN KEY (courts.id)`, `NOT NULL` | - | Thuộc về sân nào |
| `date` | `DATE` | `NOT NULL`, `INDEX` | - | Ngày diễn ra khung giờ (YYYY-MM-DD) |
| `start_time` | `TIME` | `NOT NULL` | - | Giờ bắt đầu ca chơi (HH:MM:SS) |
| `end_time` | `TIME` | `NOT NULL` | - | Giờ kết thúc ca chơi (HH:MM:SS) |
| `status` | `VARCHAR` | `NOT NULL` | `'available'` | Trạng thái (`available`: trống, `booked`: đã đặt, `blocked`: tạm khóa) |

---

### 3.5. Bảng `customers` (Hồ sơ Khách hàng)
Lưu thông tin khách hàng đặt sân để quản lý công nợ và chăm sóc khách hàng.

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|:---|:---|:---|:---|:---|
| `id` | `INTEGER` | `PRIMARY KEY`, Auto Increment | Tự tăng | Khóa chính khách hàng |
| `full_name` | `VARCHAR` | `NOT NULL` | - | Họ và tên khách hàng / Đội trưởng |
| `phone` | `VARCHAR` | `NOT NULL`, `INDEX` | - | Số điện thoại liên hệ (Format chuẩn VN) |
| `email` | `VARCHAR` | `NULLABLE`, `INDEX` | `NULL` | Hòm thư điện tử (nếu có) |
| `note` | `TEXT` | `NULLABLE` | `NULL` | Ghi chú đặc thù (Khách quen, VIP, nợ xấu...) |
| `created_at` | `DATETIME` | `NULLABLE` | `CURRENT_TIMESTAMP` | Thời điểm tạo hồ sơ khách hàng |

---

### 3.6. Bảng `bookings` (Giao dịch Đặt sân)
Trọng tâm nghiệp vụ hệ thống: lưu giữ thông tin phiếu đặt sân.

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|:---|:---|:---|:---|:---|
| `id` | `INTEGER` | `PRIMARY KEY`, Auto Increment | Tự tăng | Mã số phiếu đặt sân |
| `customer_id` | `INTEGER` | `FOREIGN KEY (customers.id)`, `NOT NULL` | - | Khách hàng sở hữu phiếu đặt |
| `court_id` | `INTEGER` | `FOREIGN KEY (courts.id)`, `NOT NULL` | - | Sân được đặt |
| `time_slot_id` | `INTEGER` | `FOREIGN KEY (time_slots.id)`, `NOT NULL`, `UNIQUE` | - | Khung giờ đặt (Quan hệ 1-1: 1 slot chỉ có 1 booking) |
| `staff_id` | `INTEGER` | `FOREIGN KEY (users.id)`, `NOT NULL` | - | Nhân viên lễ tân tạo đơn |
| `status` | `VARCHAR` | `NOT NULL` | `'pending'` | Trạng thái: `pending`, `confirmed`, `cancelled`, `completed` |
| `deposit_amount`| `FLOAT` | `NOT NULL` | `0.0` | Số tiền đặt cọc trước (VNĐ) |
| `total_amount` | `FLOAT` | `NOT NULL` | - | Tổng tiền tiền sân tính theo đơn giá (VNĐ) |
| `note` | `TEXT` | `NULLABLE` | `NULL` | Yêu cầu thêm (mượn bóng, thuê áo bít...) |
| `created_at` | `DATETIME` | `NULLABLE` | `CURRENT_TIMESTAMP` | Thời điểm tạo đơn đặt |

---

### 3.7. Bảng `payments` (Lịch sử Thanh toán & Hóa đơn)
Ghi nhận từng đợt thanh toán (tiền cọc, thanh toán kết thúc trận, hoàn tiền khi hủy lịch).

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|:---|:---|:---|:---|:---|
| `id` | `INTEGER` | `PRIMARY KEY`, Auto Increment | Tự tăng | Mã giao dịch thanh toán |
| `booking_id` | `INTEGER` | `FOREIGN KEY (bookings.id)`, `NOT NULL` | - | Liên kết với phiếu đặt sân |
| `amount` | `FLOAT` | `NOT NULL` | - | Số tiền thanh toán (VNĐ) |
| `method` | `VARCHAR` | `NOT NULL` | - | Hình thức: `cash` (tiền mặt), `transfer` (chuyển khoản), `momo` |
| `status` | `VARCHAR` | `NOT NULL` | `'pending'` | Trạng thái: `pending`, `paid`, `refunded` |
| `paid_at` | `DATETIME` | `NULLABLE` | `NULL` | Thời điểm xác nhận tiền vào tài khoản |

---

### 3.8. Bảng `maintenance_schedules` (Lịch trình Bảo trì Sân)
Quản lý các đợt bảo dưỡng cỏ, thay đèn, sửa lưới, sơn lại vạch sân.

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|:---|:---|:---|:---|:---|
| `id` | `INTEGER` | `PRIMARY KEY`, Auto Increment | Tự tăng | Mã lịch bảo trì |
| `court_id` | `INTEGER` | `FOREIGN KEY (courts.id)`, `NOT NULL` | - | Sân cần bảo dưỡng |
| `start_date` | `DATE` | `NOT NULL` | - | Ngày bắt đầu bảo trì |
| `end_date` | `DATE` | `NOT NULL` | - | Ngày kết thúc dự kiến |
| `reason` | `TEXT` | `NULLABLE` | `NULL` | Lý do bảo dưỡng cụ thể |
| `status` | `VARCHAR` | `NOT NULL` | `'planned'` | Trạng thái: `planned` (kế hoạch), `in_progress` (đang sửa), `done` (xong) |

---

### 3.9. Bảng `ai_logs` (Nhật ký Tương tác AI)
Lưu trữ phục vụ kiểm toán và minh chứng học phần cho toàn bộ các lượt gọi mô hình Gemini.

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả chi tiết |
|:---|:---|:---|:---|:---|
| `id` | `INTEGER` | `PRIMARY KEY`, Auto Increment | Tự tăng | Mã bản ghi log AI |
| `type` | `VARCHAR` | `NOT NULL` | - | Loại tác vụ (`suggest_slot`, `confirmation_message`, `reminder_message`, `revenue_summary`) |
| `input_json` | `TEXT` | `NOT NULL` | - | Chuỗi JSON chứa toàn bộ dữ liệu đầu vào gửi sang AI |
| `output_text` | `TEXT` | `NOT NULL` | - | Toàn văn kết quả văn bản suy luận trả về từ Gemini |
| `created_at` | `DATETIME` | `NULLABLE` | `CURRENT_TIMESTAMP` | Thời điểm thực thi lệnh gọi |

---

## 4. CHIẾN LƯỢC KIỂM SOÁT TƯƠNG TRANH & CHỐNG TRÙNG LỊCH (CONCURRENCY CONTROL)

### 4.1. Bài toán Xung đột Khung giờ (Race Condition)
Trong một hệ thống đặt sân thể thao trực tuyến, xung đột xảy ra khi:
- **Tình huống:** Khách A và Khách B cùng gọi điện hoặc cùng thao tác trên giao diện web chọn Khung giờ `18:00 - 19:30` của `Sân số 1` vào cùng một thời điểm $t_0$.
- **Nếu xử lý ngây thơ (Naive Read-then-Write):** Cả hai tiến trình đều đọc thấy `status == 'available'`, sau đó cả hai cùng thực hiện lệnh `INSERT INTO bookings`. Kết quả là 2 khách hàng bị xếp đè lên nhau (Double Booking), gây khủng hoảng vận hành thực tế.

### 4.2. Cơ chế Khóa Bi quan (Pessimistic Row-Level Lock)
Hệ thống giải quyết bài toán trên bằng cơ chế khóa bi quan ở tầng CSDL thông qua SQLAlchemy:

```python
# Đoạn mã nguồn xử lý trong backend/app/routers/bookings.py
with db.begin():
    # Chiếm giữ Exclusive Lock trên dòng time_slot được chọn
    slot = db.query(TimeSlot)\
             .filter(TimeSlot.id == request.time_slot_id)\
             .with_for_update()\
             .first()

    if not slot:
        raise HTTPException(status_code=404, detail="Khung giờ không tồn tại")

    if slot.status != "available":
        # Request đến sau lập tức bị từ chối an toàn
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Khung giờ này vừa được đặt bởi người khác. Vui lòng chọn giờ khác!"
        )

    # Đổi trạng thái ngay trong transaction
    slot.status = "booked"
    
    # Tạo bản ghi Booking
    new_booking = Booking(...)
    db.add(new_booking)
    # Tự động commit và giải phóng Lock khi kết thúc khối with
```

### 4.3. Quy trình Thực thi Transaction Đặt sân
1. Bắt đầu Transaction.
2. Thực hiện câu lệnh SQL: `SELECT * FROM time_slots WHERE id = :id FOR UPDATE`.
3. CSDL gán khóa độc quyền (Exclusive Lock) lên dòng `time_slot` này. Mọi transaction khác cố gắng truy vấn dòng này với `FOR UPDATE` sẽ phải dừng chờ (Queue Wait).
4. Kiểm tra điều kiện:
   - Nếu `slot.status == 'available'`: Đổi thành `'booked'`, thêm `Booking`, tính `total_amount`. Commit Transaction $\rightarrow$ Khóa được giải phóng $\rightarrow$ Request 1 thành công (HTTP 201).
   - Tiến trình thứ hai được giải phóng khỏi hàng đợi, lúc này đọc thấy `slot.status == 'booked'` $\rightarrow$ Bắn lỗi HTTP 409 Conflict $\rightarrow$ Request 2 thất bại an toàn, không có dữ liệu rác phát sinh.
5. Ràng buộc cứng: Cột `bookings.time_slot_id` được gắn thuộc tính `UNIQUE`. Kể cả trong trường hợp hiếm gặp lỗi tầng code, CSDL sẽ kích hoạt `UniqueConstraintViolation` và rollback tự động.

---

## 5. CHIẾN LƯỢC ĐÁNH CHỈ MỤC (INDEXING STRATEGY)

Để đảm bảo tốc độ phản hồi của API tra cứu lịch sân dưới 50ms khi lượng bản ghi lên tới hàng trăm nghìn dòng, các chỉ mục (Indexes) sau đã được thiết lập:

1. **`ix_time_slots_date` trên bảng `time_slots(date)`:**
   - *Mục đích:* Tối ưu hóa API tải lưới lịch sân theo ngày `GET /time-slots?date=YYYY-MM-DD`.
2. **`ix_customers_phone` trên bảng `customers(phone)`:**
   - *Mục đích:* Giúp nhân viên lễ tân tìm kiếm tức thì thông tin khách hàng khi họ gọi điện tới bằng số điện thoại.
3. **`ix_users_username` trên bảng `users(username)`:**
   - *Mục đích:* Đẩy nhanh quá trình xác thực đăng nhập JWT (Auth Service).
4. **`ix_courts_name` trên bảng `courts(name)`:**
   - *Mục đích:* Sắp xếp và tra cứu danh mục cơ sở vật chất.

---

## 6. QUY TRÌNH KHỞI TẠO & DỮ LIỆU MẪU (SEED DATA)

Mã nguồn tại `backend/app/seed_data.py` cung cấp kịch bản nạp dữ liệu ban đầu tự động:
- **Tài khoản mặc định:**
  - Quản trị viên: `username = admin`, mật khẩu mã hóa Bcrypt tương ứng với `admin123`, vai trò `admin`.
  - Nhân viên: `username = staff`, mật khẩu `staff123`, vai trò `staff`.
- **Dữ liệu sân thể thao:**
  - 2 Sân bóng đá mini 7 người (Mặt cỏ nhân tạo cao cấp).
  - 3 Sân cầu lông (Thảm PVC thi đấu đạt chuẩn).
  - 1 Sân Tennis ngoài trời.
- **Khung giờ mẫu:** Tự động sinh danh sách 10 khung giờ/ngày (từ 06:00 đến 23:00) cho từng sân trong 14 ngày tới.

---
**Kết luận:** Bản thiết kế CSDL của SportBooking Pro đáp ứng toàn diện các tiêu chuẩn kỹ thuật phần mềm: chuẩn hóa dữ liệu, phòng chống xung đột tương tranh tuyệt đối và sẵn sàng mở rộng quy mô.
