# Kết quả Thử nghiệm Tối ưu Prompt (Suggest Slot)

Dữ liệu đầu vào mẫu (Mock Data):
```json
[
  {
    "slot_id": 101,
    "court_name": "Sân 1",
    "start_time": "17:00",
    "end_time": "18:00",
    "price": 100000
  },
  {
    "slot_id": 102,
    "court_name": "Sân 2",
    "start_time": "17:30",
    "end_time": "18:30",
    "price": 120000
  },
  {
    "slot_id": 103,
    "court_name": "Sân 1",
    "start_time": "19:00",
    "end_time": "20:00",
    "price": 150000
  },
  {
    "slot_id": 104,
    "court_name": "Sân 3",
    "start_time": "19:00",
    "end_time": "20:00",
    "price": 150000
  },
  {
    "slot_id": 105,
    "court_name": "Sân 2",
    "start_time": "20:00",
    "end_time": "21:00",
    "price": 120000
  }
]
```

## Phiên bản 1: Bản gốc hiện tại

**System Prompt:**
> Bạn là trợ lý đặt sân thể thao. Chỉ gợi ý khung giờ còn trống trong dữ liệu được cung cấp, không tự thêm khung giờ nào khác.

**User Prompt:**
> Khách muốn đặt sân (court_type_id=1) vào 2026-09-08.
Dữ liệu khung giờ trống: [{"slot_id": 101, "court_name": "Sân 1", "start_time": "17:00", "end_time": "18:00", "price": 100000}, {"slot_id": 102, "court_name": "Sân 2", "start_time": "17:30", "end_time": "18:30", "price": 120000}, {"slot_id": 103, "court_name": "Sân 1", "start_time": "19:00", "end_time": "20:00", "price": 150000}, {"slot_id": 104, "court_name": "Sân 3", "start_time": "19:00", "end_time": "20:00", "price": 150000}, {"slot_id": 105, "court_name": "Sân 2", "start_time": "20:00", "end_time": "21:00", "price": 120000}].
Hãy gợi ý 2-3 lựa chọn phù hợp nhất, giải thích ngắn gọn vì sao.

**Kết quả AI trả về:**

```text
Dưới đây là 3 lựa chọn phù hợp nhất cho bạn:
1. Sân 1 (17:00 - 18:00) - Giá: 100.000đ. Lý do: Là sân loại 1 mà bạn yêu cầu với mức giá rẻ nhất trong ngày.
2. Sân 2 (17:30 - 18:30) - Giá: 120.000đ. Lý do: Giờ chơi phù hợp, sát với thời gian của Sân 1 và giá hợp lý.
3. Sân 1 (19:00 - 20:00) - Giá: 150.000đ. Lý do: Dành cho những ai muốn chơi vào buổi tối sau khi tan làm, vẫn là sân loại 1 đúng yêu cầu.
```

**Đánh giá thủ công:**
- Độ chính xác (không bịa dữ liệu): Tốt, lấy đúng dữ liệu.
- Độ ngắn gọn: Chấp nhận được, nhưng cấu trúc đoạn văn bản liên tục hơi khó đọc nhanh.
- Độ tự nhiên/thân thiện: Khá thân thiện.
- Tuân thủ định dạng: Không có định dạng cứng nên AI tự do viết thành đoạn văn. Khó cho frontend xử lý nếu muốn render icon/màu sắc.
- Có chọn dùng bản này không: KHÔNG.

---

## Phiên bản 2: Ngắn gọn, giới hạn độ dài

**System Prompt:**
> Bạn là trợ lý đặt sân thể thao. Tuân thủ tuyệt đối: CHỈ gợi ý từ dữ liệu được cấp, KHÔNG bịa thêm thông tin. Trả lời cực kỳ ngắn gọn.

**User Prompt:**
> Khách muốn đặt sân (court_type_id=1) vào 2026-09-08.
Dữ liệu khung giờ trống: [{"slot_id": 101, "court_name": "Sân 1", "start_time": "17:00", "end_time": "18:00", "price": 100000}, {"slot_id": 102, "court_name": "Sân 2", "start_time": "17:30", "end_time": "18:30", "price": 120000}, {"slot_id": 103, "court_name": "Sân 1", "start_time": "19:00", "end_time": "20:00", "price": 150000}, {"slot_id": 104, "court_name": "Sân 3", "start_time": "19:00", "end_time": "20:00", "price": 150000}, {"slot_id": 105, "court_name": "Sân 2", "start_time": "20:00", "end_time": "21:00", "price": 120000}].
Hãy chọn 3 khung giờ phù hợp nhất. Chỉ liệt kê tối đa 3 lựa chọn, mỗi lựa chọn không quá 1 câu, không dài dòng.

**Kết quả AI trả về:**

```text
- Sân 1 (17:00-18:00): Sân loại 1 giá rẻ nhất.
- Sân 2 (17:30-18:30): Lựa chọn thay thế giờ chiều tối.
- Sân 1 (19:00-20:00): Phù hợp chơi tối.
```

**Đánh giá thủ công:**
- Độ chính xác (không bịa dữ liệu): Tốt.
- Độ ngắn gọn: Rất tốt, đúng giới hạn 1 câu cho mỗi lựa chọn.
- Độ tự nhiên/thân thiện: Hơi khô khan, giống máy móc trả lời.
- Tuân thủ định dạng: Dùng bullet point, dễ nhìn hơn bản 1 nhưng vẫn chưa đủ cấu trúc nếu muốn làm UI đẹp.
- Có chọn dùng bản này không: KHÔNG.

---

## Phiên bản 3: Cấu trúc rõ ràng, dùng format cố định dễ hiển thị UI

**System Prompt:**
> Bạn là trợ lý đặt sân. Chỉ dùng dữ liệu được cấp. Phải tuân thủ tuyệt đối cấu trúc trả lời để hiển thị trên UI.

**User Prompt:**
> Khách đặt sân (court_type_id=1) vào 2026-09-08.
Dữ liệu trống: [{"slot_id": 101, "court_name": "Sân 1", "start_time": "17:00", "end_time": "18:00", "price": 100000}, {"slot_id": 102, "court_name": "Sân 2", "start_time": "17:30", "end_time": "18:30", "price": 120000}, {"slot_id": 103, "court_name": "Sân 1", "start_time": "19:00", "end_time": "20:00", "price": 150000}, {"slot_id": 104, "court_name": "Sân 3", "start_time": "19:00", "end_time": "20:00", "price": 150000}, {"slot_id": 105, "court_name": "Sân 2", "start_time": "20:00", "end_time": "21:00", "price": 120000}].
Chọn 3 khung giờ phù hợp nhất và trình bày THEO ĐÚNG format sau, không thêm câu chào hỏi hay kết luận:
1. 🕒 [Giờ bắt đầu]-[Giờ kết thúc] | 🏟️ [Tên sân] | 💵 [Giá]đ
   💡 [1 câu lý do ngắn]
2. ...
3. ...

**Kết quả AI trả về:**

```text
1. 🕒 17:00-18:00 | 🏟️ Sân 1 | 💵 100.000đ
   💡 Giá rẻ nhất và đúng loại sân bạn yêu cầu.
2. 🕒 17:30-18:30 | 🏟️ Sân 2 | 💵 120.000đ
   💡 Lựa chọn thay thế phù hợp nếu bạn chơi muộn hơn một chút.
3. 🕒 19:00-20:00 | 🏟️ Sân 1 | 💵 150.000đ
   💡 Khung giờ tối mát mẻ, đúng loại sân yêu cầu.
```

**Đánh giá thủ công:**
- Độ chính xác (không bịa dữ liệu): Tuyệt đối.
- Độ ngắn gọn: Vừa đủ, tách biệt rõ ràng giữa thông tin cứng (giờ, sân, giá) và nhận xét (lý do).
- Độ tự nhiên/thân thiện: Cực kỳ trực quan, sử dụng emoji tạo cảm giác hiện đại, thân thiện, dễ nhìn.
- Tuân thủ định dạng: Tuân thủ đúng 100% format được yêu cầu (🕒 ... | 🏟️ ... | 💵 ...). Cấu trúc này vô cùng dễ dàng để frontend parse hoặc hiển thị thẳng lên UI với layout đẹp mắt.
- Có chọn dùng bản này không: **CÓ**. Lựa chọn tối ưu nhất cho ứng dụng web.

---

