# Báo cáo Code Review (AI)

**Vai trò:** Senior Backend Engineer & Security Expert
**Phạm vi review:** `bookings.py`, `booking_service.py`, `gemini_client.py`

---

## I. Các vấn đề về CHẤT LƯỢNG CODE (Code Quality)

### 1. Thiếu Pagination (Phân trang) cho danh sách Booking (`bookings.py`)
**Vấn đề:** Trong hàm `get_bookings()`, toàn bộ dữ liệu thỏa mãn điều kiện lọc được trả về thông qua `query.all()`. Nếu hệ thống có hàng ngàn booking, việc này sẽ gây chậm API, tràn RAM server và quá tải frontend.
**Đề xuất Refactor:** Thêm `skip` và `limit` vào query params.

```python
# Mẫu code đề xuất:
@router.get("/", response_model=List[BookingDetailResponse])
def get_bookings(
    # ... các tham số cũ ...
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # ... logic query cũ ...
    return query.offset(skip).limit(limit).all()
```

### 2. Trùng lặp code xử lý Transaction/Rollback (`booking_service.py`)
**Vấn đề:** Cả 3 hàm `create_booking`, `cancel_booking`, `reschedule_booking` đều lặp lại block `try... except Exception as e: db.rollback(); raise e`. Điều này vi phạm nguyên tắc DRY (Don't Repeat Yourself) và dễ gây lỗi nếu lập trình viên quên thêm vào hàm mới.
**Đề xuất Refactor:** Dùng một context manager (hoặc decorator) để quản lý transaction vòng đời của DB.

```python
# Mẫu code đề xuất:
from contextlib import contextmanager

@contextmanager
def transaction(db: Session):
    try:
        yield
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

# Áp dụng vào service (không cần try-catch thủ công nữa)
def cancel_booking(db: Session, booking_id: int) -> Booking:
    with transaction(db):
        booking = db.query(Booking).with_for_update().filter(Booking.id == booking_id).first()
        # ... logic
        return booking
```

### 3. Khởi tạo Object cấu hình dư thừa trong Retry Loop (`gemini_client.py`)
**Vấn đề:** Object `model = genai.GenerativeModel(...)` được khởi tạo *bên trong* vòng lặp `for attempt in range(...)`. Đây là một thao tác thừa thãi gây tốn tài nguyên. Nó chỉ cần khởi tạo 1 lần trước khi vào loop.
**Đề xuất Refactor:** Đẩy khởi tạo model ra ngoài vòng lặp.

```python
# Mẫu code đề xuất:
def generate(system_prompt: str, user_prompt: str) -> str:
    # ...
    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=system_prompt
    )
    for attempt in range(max_retries + 1):
        try:
            response = model.generate_content(user_prompt)
            # ...
```

---

## II. Các vấn đề về BẢO MẬT (Security)

### 1. Lỗ hổng Phân quyền / Broken Object Level Authorization (BOLA/IDOR) (`bookings.py` & `booking_service.py`)
**Vấn đề:** Endpoints `PUT /{booking_id}/cancel` và `PUT /{booking_id}/reschedule` hiện tại chỉ nhận `booking_id` và gọi thẳng xuống service để thực thi. Hệ thống **không hề kiểm tra** xem `current_user` có quyền với `booking_id` này hay không. Nếu tôi là khách hàng (Customer), tôi có thể truyền ID booking của người khác vào API này để hủy lịch/đổi lịch của họ!
**Mức độ nguy hiểm:** RẤT CAO (Nghiêm trọng).
**Đề xuất Refactor:** Service cần nhận thêm `current_user` và xác minh quyền sở hữu hoặc quyền admin.

```python
# Mẫu code đề xuất trong booking_service.py:
def cancel_booking(db: Session, booking_id: int, current_user) -> Booking:
    booking = db.query(Booking).with_for_update().filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    # [SECURITY] Kiểm tra quyền sở hữu
    if current_user.role == "customer" and booking.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền hủy booking của người khác")
    
    # ... tiếp tục logic hủy ...
```

### 2. Lộ lọt thông tin nhạy cảm qua Exception Message (`gemini_client.py`)
**Vấn đề:** Ở block `except Exception as e:`, hệ thống trả về HTTP 500 với thông báo `detail=f"Lỗi hệ thống AI: {str(e)}"`. Việc truyền thẳng raw error message (str(e)) xuống client có thể làm rò rỉ cấu trúc hệ thống, thư viện đang sử dụng, hay thậm chí một phần API Key nếu thư viện quăng lỗi kèm token.
**Mức độ nguy hiểm:** TRUNG BÌNH.
**Đề xuất Refactor:** Log lỗi chi tiết ở backend, nhưng chỉ trả về thông báo chung chung (Generic message) cho client.

```python
# Mẫu code đề xuất:
        except Exception as e:
            # [SECURITY] Log chi tiết lỗi (an toàn ở server)
            logger.error(f"Gemini API unexpected error: {e}", exc_info=True)
            # [SECURITY] Trả về generic message cho client
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Lỗi hệ thống AI (Internal Error). Vui lòng liên hệ admin."
            )
```

---
*Lưu ý: Báo cáo này chỉ đề xuất các giải pháp. Vui lòng cho phép thực thi (Apply) để tôi tiến hành refactor sửa code thực tế.*
