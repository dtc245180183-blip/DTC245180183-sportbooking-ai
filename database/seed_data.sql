-- ====================================================================
-- SportBooking Pro - Sample Production Seed Data (DML)
-- Bao gom 12 don dat san mau va 10 giao dich thuc thu 1,750,000 VND
-- ====================================================================

PRAGMA foreign_keys = OFF;

-- Du lieu bang: users (4 ban ghi)
INSERT OR REPLACE INTO users ("id", "username", "password_hash", "full_name", "role", "created_at") VALUES (1, 'admin', '$2b$12$IsiK3W0yKV8NnOTOHNtZoejb7XyY9jUcL0Q4O7/vcfChNXwEgW.Me', 'Administrator', 'admin', '2026-09-02 16:10:09');
INSERT OR REPLACE INTO users ("id", "username", "password_hash", "full_name", "role", "created_at") VALUES (2, 'staff', '$2b$12$zD/ISrXqGTzNtA7qQXrxbeQJFuyGOiWtmdlt0VzzRx.ACbqKIzIwO', 'Nguyễn Thu Hàng', 'staff', '2026-09-02 16:29:00');
INSERT OR REPLACE INTO users ("id", "username", "password_hash", "full_name", "role", "created_at") VALUES (3, 'gggggg', '$2b$12$PpS.2V3jZYuq.sdnYR958u99Aufml6YHGHuUMHE8SaGiqZ6.D7thG', 'yhhgg', 'staff', '2026-09-03 08:04:29');
INSERT OR REPLACE INTO users ("id", "username", "password_hash", "full_name", "role", "created_at") VALUES (4, 'bghhhh', '$2b$12$5CXKUZ5R/1avrYFgdQijouOBBL.wLij013zAP7oib.dSXxgh61Z1q', 'bghhhh', 'staff', '2026-09-14 05:33:02');

-- Du lieu bang: court_types (4 ban ghi)
INSERT OR REPLACE INTO court_types ("id", "name", "description", "image_url") VALUES (1, 'Sân bóng đá 7 người', 'Sân cỏ nhân tạo chuẩn 7 người', NULL);
INSERT OR REPLACE INTO court_types ("id", "name", "description", "image_url") VALUES (2, 'Sân Cầu Lông', 'Sân thảm PVC chuẩn thi đấu', NULL);
INSERT OR REPLACE INTO court_types ("id", "name", "description", "image_url") VALUES (3, 'Sân Pickleball', 'Sân cứng tiêu chuẩn quốc tế', NULL);
INSERT OR REPLACE INTO court_types ("id", "name", "description", "image_url") VALUES (4, 'Sân Bóng Đá', 'Cỏ nhân tạo 5 người', NULL);

-- Du lieu bang: courts (5 ban ghi)
INSERT OR REPLACE INTO courts ("id", "name", "court_type_id", "price_per_hour", "status", "image_url") VALUES (1, 'Sân Bóng A', 1, 200000.0, 'active', NULL);
INSERT OR REPLACE INTO courts ("id", "name", "court_type_id", "price_per_hour", "status", "image_url") VALUES (2, 'Sân Bóng B', 1, 200000.0, 'active', NULL);
INSERT OR REPLACE INTO courts ("id", "name", "court_type_id", "price_per_hour", "status", "image_url") VALUES (3, 'Sân Cầu Lông 1', 2, 100000.0, 'active', NULL);
INSERT OR REPLACE INTO courts ("id", "name", "court_type_id", "price_per_hour", "status", "image_url") VALUES (4, 'Sân Cầu Lông 2', 2, 100000.0, 'active', NULL);
INSERT OR REPLACE INTO courts ("id", "name", "court_type_id", "price_per_hour", "status", "image_url") VALUES (5, 'Sân Pickleball VIP', 3, 250000.0, 'active', NULL);

-- Du lieu bang: time_slots (631 ban ghi)
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (1, 1, '2026-09-03', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (2, 1, '2026-09-03', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (3, 1, '2026-09-03', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (4, 1, '2026-09-03', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (5, 1, '2026-09-03', '21:00:00.000000', '22:00:00.000000', 'booked');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (6, 1, '2026-09-04', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (7, 1, '2026-09-04', '18:00:00.000000', '19:00:00.000000', 'booked');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (8, 1, '2026-09-04', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (9, 1, '2026-09-04', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (10, 1, '2026-09-04', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (11, 1, '2026-09-05', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (12, 1, '2026-09-05', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (13, 1, '2026-09-05', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (14, 1, '2026-09-05', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (15, 1, '2026-09-05', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (16, 2, '2026-09-03', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (17, 2, '2026-09-03', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (18, 2, '2026-09-03', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (19, 2, '2026-09-03', '20:00:00.000000', '21:00:00.000000', 'booked');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (20, 2, '2026-09-03', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (21, 2, '2026-09-04', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (22, 2, '2026-09-04', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (23, 2, '2026-09-04', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (24, 2, '2026-09-04', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (25, 2, '2026-09-04', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (26, 2, '2026-09-05', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (27, 2, '2026-09-05', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (28, 2, '2026-09-05', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (29, 2, '2026-09-05', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (30, 2, '2026-09-05', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (31, 3, '2026-09-03', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (32, 3, '2026-09-03', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (33, 3, '2026-09-03', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (34, 3, '2026-09-03', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (35, 3, '2026-09-03', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (36, 3, '2026-09-04', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (37, 3, '2026-09-04', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (38, 3, '2026-09-04', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (39, 3, '2026-09-04', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (40, 3, '2026-09-04', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (41, 3, '2026-09-05', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (42, 3, '2026-09-05', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (43, 3, '2026-09-05', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (44, 3, '2026-09-05', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (45, 3, '2026-09-05', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (46, 4, '2026-09-03', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (47, 4, '2026-09-03', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (48, 4, '2026-09-03', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (49, 4, '2026-09-03', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (50, 4, '2026-09-03', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (51, 4, '2026-09-04', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (52, 4, '2026-09-04', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (53, 4, '2026-09-04', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (54, 4, '2026-09-04', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (55, 4, '2026-09-04', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (56, 4, '2026-09-05', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (57, 4, '2026-09-05', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (58, 4, '2026-09-05', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (59, 4, '2026-09-05', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (60, 4, '2026-09-05', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (61, 5, '2026-09-03', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (62, 5, '2026-09-03', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (63, 5, '2026-09-03', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (64, 5, '2026-09-03', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (65, 5, '2026-09-03', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (66, 5, '2026-09-04', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (67, 5, '2026-09-04', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (68, 5, '2026-09-04', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (69, 5, '2026-09-04', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (70, 5, '2026-09-04', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (71, 5, '2026-09-05', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (72, 5, '2026-09-05', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (73, 5, '2026-09-05', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (74, 5, '2026-09-05', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (75, 5, '2026-09-05', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (76, 3, '2026-09-04', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (77, 3, '2026-09-04', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (78, 3, '2026-09-04', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (79, 3, '2026-09-04', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (80, 3, '2026-09-04', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (81, 3, '2026-09-04', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (82, 3, '2026-09-04', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (83, 3, '2026-09-04', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (84, 3, '2026-09-04', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (85, 3, '2026-09-04', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (86, 3, '2026-09-04', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (87, 3, '2026-09-05', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (88, 3, '2026-09-05', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (89, 3, '2026-09-05', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (90, 3, '2026-09-05', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (91, 3, '2026-09-05', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (92, 3, '2026-09-05', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (93, 3, '2026-09-05', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (94, 3, '2026-09-05', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (95, 3, '2026-09-05', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (96, 3, '2026-09-05', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (97, 3, '2026-09-05', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (98, 3, '2026-09-06', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (99, 3, '2026-09-06', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (100, 3, '2026-09-06', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (101, 3, '2026-09-06', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (102, 3, '2026-09-06', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (103, 3, '2026-09-06', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (104, 3, '2026-09-06', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (105, 3, '2026-09-06', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (106, 3, '2026-09-06', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (107, 3, '2026-09-06', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (108, 3, '2026-09-06', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (109, 3, '2026-09-06', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (110, 3, '2026-09-06', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (111, 3, '2026-09-06', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (112, 3, '2026-09-06', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (113, 3, '2026-09-06', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (114, 3, '2026-09-07', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (115, 3, '2026-09-07', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (116, 3, '2026-09-07', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (117, 3, '2026-09-07', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (118, 3, '2026-09-07', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (119, 3, '2026-09-07', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (120, 3, '2026-09-07', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (121, 3, '2026-09-07', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (122, 3, '2026-09-07', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (123, 3, '2026-09-07', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (124, 3, '2026-09-07', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (125, 3, '2026-09-07', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (126, 3, '2026-09-07', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (127, 3, '2026-09-07', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (128, 3, '2026-09-07', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (129, 3, '2026-09-07', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (130, 3, '2026-09-08', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (131, 3, '2026-09-08', '07:00:00.000000', '08:00:00.000000', 'booked');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (132, 3, '2026-09-08', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (133, 3, '2026-09-08', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (134, 3, '2026-09-08', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (135, 3, '2026-09-08', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (136, 3, '2026-09-08', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (137, 3, '2026-09-08', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (138, 3, '2026-09-08', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (139, 3, '2026-09-08', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (140, 3, '2026-09-08', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (141, 3, '2026-09-08', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (142, 3, '2026-09-08', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (143, 3, '2026-09-08', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (144, 3, '2026-09-08', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (145, 3, '2026-09-08', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (146, 3, '2026-09-09', '06:00:00.000000', '07:00:00.000000', 'booked');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (147, 3, '2026-09-09', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (148, 3, '2026-09-09', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (149, 3, '2026-09-09', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (150, 3, '2026-09-09', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (151, 3, '2026-09-09', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (152, 3, '2026-09-09', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (153, 3, '2026-09-09', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (154, 3, '2026-09-09', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (155, 3, '2026-09-09', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (156, 3, '2026-09-09', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (157, 3, '2026-09-09', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (158, 3, '2026-09-09', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (159, 3, '2026-09-09', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (160, 3, '2026-09-09', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (161, 3, '2026-09-09', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (162, 3, '2026-09-10', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (163, 3, '2026-09-10', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (164, 3, '2026-09-10', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (165, 3, '2026-09-10', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (166, 3, '2026-09-10', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (167, 3, '2026-09-10', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (168, 3, '2026-09-10', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (169, 3, '2026-09-10', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (170, 3, '2026-09-10', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (171, 3, '2026-09-10', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (172, 3, '2026-09-10', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (173, 3, '2026-09-10', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (174, 3, '2026-09-10', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (175, 3, '2026-09-10', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (176, 3, '2026-09-10', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (177, 3, '2026-09-10', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (178, 3, '2026-09-11', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (179, 3, '2026-09-11', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (180, 3, '2026-09-11', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (181, 3, '2026-09-11', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (182, 3, '2026-09-11', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (183, 3, '2026-09-11', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (184, 3, '2026-09-11', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (185, 3, '2026-09-11', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (186, 3, '2026-09-11', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (187, 3, '2026-09-11', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (188, 3, '2026-09-11', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (189, 3, '2026-09-11', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (190, 3, '2026-09-11', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (191, 3, '2026-09-11', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (192, 3, '2026-09-11', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (193, 3, '2026-09-11', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (194, 4, '2026-09-04', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (195, 4, '2026-09-04', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (196, 4, '2026-09-04', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (197, 4, '2026-09-04', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (198, 4, '2026-09-04', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (199, 4, '2026-09-04', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (200, 4, '2026-09-04', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (201, 4, '2026-09-04', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (202, 4, '2026-09-04', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (203, 4, '2026-09-04', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (204, 4, '2026-09-04', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (205, 4, '2026-09-05', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (206, 4, '2026-09-05', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (207, 4, '2026-09-05', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (208, 4, '2026-09-05', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (209, 4, '2026-09-05', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (210, 4, '2026-09-05', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (211, 4, '2026-09-05', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (212, 4, '2026-09-05', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (213, 4, '2026-09-05', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (214, 4, '2026-09-05', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (215, 4, '2026-09-05', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (216, 4, '2026-09-06', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (217, 4, '2026-09-06', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (218, 4, '2026-09-06', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (219, 4, '2026-09-06', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (220, 4, '2026-09-06', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (221, 4, '2026-09-06', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (222, 4, '2026-09-06', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (223, 4, '2026-09-06', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (224, 4, '2026-09-06', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (225, 4, '2026-09-06', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (226, 4, '2026-09-06', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (227, 4, '2026-09-06', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (228, 4, '2026-09-06', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (229, 4, '2026-09-06', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (230, 4, '2026-09-06', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (231, 4, '2026-09-06', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (232, 4, '2026-09-07', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (233, 4, '2026-09-07', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (234, 4, '2026-09-07', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (235, 4, '2026-09-07', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (236, 4, '2026-09-07', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (237, 4, '2026-09-07', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (238, 4, '2026-09-07', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (239, 4, '2026-09-07', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (240, 4, '2026-09-07', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (241, 4, '2026-09-07', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (242, 4, '2026-09-07', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (243, 4, '2026-09-07', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (244, 4, '2026-09-07', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (245, 4, '2026-09-07', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (246, 4, '2026-09-07', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (247, 4, '2026-09-07', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (248, 4, '2026-09-08', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (249, 4, '2026-09-08', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (250, 4, '2026-09-08', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (251, 4, '2026-09-08', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (252, 4, '2026-09-08', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (253, 4, '2026-09-08', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (254, 4, '2026-09-08', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (255, 4, '2026-09-08', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (256, 4, '2026-09-08', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (257, 4, '2026-09-08', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (258, 4, '2026-09-08', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (259, 4, '2026-09-08', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (260, 4, '2026-09-08', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (261, 4, '2026-09-08', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (262, 4, '2026-09-08', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (263, 4, '2026-09-08', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (264, 4, '2026-09-09', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (265, 4, '2026-09-09', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (266, 4, '2026-09-09', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (267, 4, '2026-09-09', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (268, 4, '2026-09-09', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (269, 4, '2026-09-09', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (270, 4, '2026-09-09', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (271, 4, '2026-09-09', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (272, 4, '2026-09-09', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (273, 4, '2026-09-09', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (274, 4, '2026-09-09', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (275, 4, '2026-09-09', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (276, 4, '2026-09-09', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (277, 4, '2026-09-09', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (278, 4, '2026-09-09', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (279, 4, '2026-09-09', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (280, 4, '2026-09-10', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (281, 4, '2026-09-10', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (282, 4, '2026-09-10', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (283, 4, '2026-09-10', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (284, 4, '2026-09-10', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (285, 4, '2026-09-10', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (286, 4, '2026-09-10', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (287, 4, '2026-09-10', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (288, 4, '2026-09-10', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (289, 4, '2026-09-10', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (290, 4, '2026-09-10', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (291, 4, '2026-09-10', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (292, 4, '2026-09-10', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (293, 4, '2026-09-10', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (294, 4, '2026-09-10', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (295, 4, '2026-09-10', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (296, 4, '2026-09-11', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (297, 4, '2026-09-11', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (298, 4, '2026-09-11', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (299, 4, '2026-09-11', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (300, 4, '2026-09-11', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (301, 4, '2026-09-11', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (302, 4, '2026-09-11', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (303, 4, '2026-09-11', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (304, 4, '2026-09-11', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (305, 4, '2026-09-11', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (306, 4, '2026-09-11', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (307, 4, '2026-09-11', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (308, 4, '2026-09-11', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (309, 4, '2026-09-11', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (310, 4, '2026-09-11', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (311, 4, '2026-09-11', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (312, 1, '2026-09-17', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (313, 1, '2026-09-17', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (314, 1, '2026-09-17', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (315, 1, '2026-09-17', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (316, 1, '2026-09-17', '10:00:00.000000', '11:00:00.000000', 'booked');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (317, 1, '2026-09-17', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (318, 1, '2026-09-17', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (319, 1, '2026-09-17', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (320, 1, '2026-09-17', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (321, 1, '2026-09-17', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (322, 1, '2026-09-17', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (323, 1, '2026-09-17', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (324, 1, '2026-09-17', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (325, 1, '2026-09-17', '19:00:00.000000', '20:00:00.000000', 'booked');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (326, 1, '2026-09-17', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (327, 1, '2026-09-17', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (328, 1, '2026-09-18', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (329, 1, '2026-09-18', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (330, 1, '2026-09-18', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (331, 1, '2026-09-18', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (332, 1, '2026-09-18', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (333, 1, '2026-09-18', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (334, 1, '2026-09-18', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (335, 1, '2026-09-18', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (336, 1, '2026-09-18', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (337, 1, '2026-09-18', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (338, 1, '2026-09-18', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (339, 1, '2026-09-18', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (340, 1, '2026-09-18', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (341, 1, '2026-09-18', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (342, 1, '2026-09-18', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (343, 1, '2026-09-18', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (344, 1, '2026-09-19', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (345, 1, '2026-09-19', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (346, 1, '2026-09-19', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (347, 1, '2026-09-19', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (348, 1, '2026-09-19', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (349, 1, '2026-09-19', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (350, 1, '2026-09-19', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (351, 1, '2026-09-19', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (352, 1, '2026-09-19', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (353, 1, '2026-09-19', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (354, 1, '2026-09-19', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (355, 1, '2026-09-19', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (356, 1, '2026-09-19', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (357, 1, '2026-09-19', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (358, 1, '2026-09-19', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (359, 1, '2026-09-19', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (360, 1, '2026-09-20', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (361, 1, '2026-09-20', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (362, 1, '2026-09-20', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (363, 1, '2026-09-20', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (364, 1, '2026-09-20', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (365, 1, '2026-09-20', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (366, 1, '2026-09-20', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (367, 1, '2026-09-20', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (368, 1, '2026-09-20', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (369, 1, '2026-09-20', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (370, 1, '2026-09-20', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (371, 1, '2026-09-20', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (372, 1, '2026-09-20', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (373, 1, '2026-09-20', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (374, 1, '2026-09-20', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (375, 1, '2026-09-20', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (376, 1, '2026-09-21', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (377, 1, '2026-09-21', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (378, 1, '2026-09-21', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (379, 1, '2026-09-21', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (380, 1, '2026-09-21', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (381, 1, '2026-09-21', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (382, 1, '2026-09-21', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (383, 1, '2026-09-21', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (384, 1, '2026-09-21', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (385, 1, '2026-09-21', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (386, 1, '2026-09-21', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (387, 1, '2026-09-21', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (388, 1, '2026-09-21', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (389, 1, '2026-09-21', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (390, 1, '2026-09-21', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (391, 1, '2026-09-21', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (392, 1, '2026-09-22', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (393, 1, '2026-09-22', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (394, 1, '2026-09-22', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (395, 1, '2026-09-22', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (396, 1, '2026-09-22', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (397, 1, '2026-09-22', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (398, 1, '2026-09-22', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (399, 1, '2026-09-22', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (400, 1, '2026-09-22', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (401, 1, '2026-09-22', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (402, 1, '2026-09-22', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (403, 1, '2026-09-22', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (404, 1, '2026-09-22', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (405, 1, '2026-09-22', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (406, 1, '2026-09-22', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (407, 1, '2026-09-22', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (408, 1, '2026-09-23', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (409, 1, '2026-09-23', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (410, 1, '2026-09-23', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (411, 1, '2026-09-23', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (412, 1, '2026-09-23', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (413, 1, '2026-09-23', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (414, 1, '2026-09-23', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (415, 1, '2026-09-23', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (416, 1, '2026-09-23', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (417, 1, '2026-09-23', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (418, 1, '2026-09-23', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (419, 1, '2026-09-23', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (420, 1, '2026-09-23', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (421, 1, '2026-09-23', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (422, 1, '2026-09-23', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (423, 1, '2026-09-23', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (424, 1, '2026-09-24', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (425, 1, '2026-09-24', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (426, 1, '2026-09-24', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (427, 1, '2026-09-24', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (428, 1, '2026-09-24', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (429, 1, '2026-09-24', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (430, 1, '2026-09-24', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (431, 1, '2026-09-24', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (432, 1, '2026-09-24', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (433, 1, '2026-09-24', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (434, 1, '2026-09-24', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (435, 1, '2026-09-24', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (436, 1, '2026-09-24', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (437, 1, '2026-09-24', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (438, 1, '2026-09-24', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (439, 1, '2026-09-24', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (440, 1, '2026-09-25', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (441, 1, '2026-09-25', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (442, 1, '2026-09-25', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (443, 1, '2026-09-25', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (444, 1, '2026-09-25', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (445, 1, '2026-09-25', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (446, 1, '2026-09-25', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (447, 1, '2026-09-25', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (448, 1, '2026-09-25', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (449, 1, '2026-09-25', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (450, 1, '2026-09-25', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (451, 1, '2026-09-25', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (452, 1, '2026-09-25', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (453, 1, '2026-09-25', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (454, 1, '2026-09-25', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (455, 1, '2026-09-25', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (456, 1, '2026-09-26', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (457, 1, '2026-09-26', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (458, 1, '2026-09-26', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (459, 1, '2026-09-26', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (460, 1, '2026-09-26', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (461, 1, '2026-09-26', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (462, 1, '2026-09-26', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (463, 1, '2026-09-26', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (464, 1, '2026-09-26', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (465, 1, '2026-09-26', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (466, 1, '2026-09-26', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (467, 1, '2026-09-26', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (468, 1, '2026-09-26', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (469, 1, '2026-09-26', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (470, 1, '2026-09-26', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (471, 1, '2026-09-26', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (472, 1, '2026-09-27', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (473, 1, '2026-09-27', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (474, 1, '2026-09-27', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (475, 1, '2026-09-27', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (476, 1, '2026-09-27', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (477, 1, '2026-09-27', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (478, 1, '2026-09-27', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (479, 1, '2026-09-27', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (480, 1, '2026-09-27', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (481, 1, '2026-09-27', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (482, 1, '2026-09-27', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (483, 1, '2026-09-27', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (484, 1, '2026-09-27', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (485, 1, '2026-09-27', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (486, 1, '2026-09-27', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (487, 1, '2026-09-27', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (488, 1, '2026-09-28', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (489, 1, '2026-09-28', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (490, 1, '2026-09-28', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (491, 1, '2026-09-28', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (492, 1, '2026-09-28', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (493, 1, '2026-09-28', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (494, 1, '2026-09-28', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (495, 1, '2026-09-28', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (496, 1, '2026-09-28', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (497, 1, '2026-09-28', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (498, 1, '2026-09-28', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (499, 1, '2026-09-28', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (500, 1, '2026-09-28', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (501, 1, '2026-09-28', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (502, 1, '2026-09-28', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (503, 1, '2026-09-28', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (504, 1, '2026-09-29', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (505, 1, '2026-09-29', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (506, 1, '2026-09-29', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (507, 1, '2026-09-29', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (508, 1, '2026-09-29', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (509, 1, '2026-09-29', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (510, 1, '2026-09-29', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (511, 1, '2026-09-29', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (512, 1, '2026-09-29', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (513, 1, '2026-09-29', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (514, 1, '2026-09-29', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (515, 1, '2026-09-29', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (516, 1, '2026-09-29', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (517, 1, '2026-09-29', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (518, 1, '2026-09-29', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (519, 1, '2026-09-29', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (520, 1, '2026-09-30', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (521, 1, '2026-09-30', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (522, 1, '2026-09-30', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (523, 1, '2026-09-30', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (524, 1, '2026-09-30', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (525, 1, '2026-09-30', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (526, 1, '2026-09-30', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (527, 1, '2026-09-30', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (528, 1, '2026-09-30', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (529, 1, '2026-09-30', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (530, 1, '2026-09-30', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (531, 1, '2026-09-30', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (532, 1, '2026-09-30', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (533, 1, '2026-09-30', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (534, 1, '2026-09-30', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (535, 1, '2026-09-30', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (536, 2, '2026-09-17', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (537, 2, '2026-09-17', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (538, 2, '2026-09-17', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (539, 2, '2026-09-17', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (540, 2, '2026-09-17', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (541, 2, '2026-09-17', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (542, 2, '2026-09-17', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (543, 2, '2026-09-17', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (544, 2, '2026-09-17', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (545, 2, '2026-09-17', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (546, 2, '2026-09-17', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (547, 2, '2026-09-17', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (548, 2, '2026-09-17', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (549, 2, '2026-09-17', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (550, 2, '2026-09-17', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (551, 2, '2026-09-17', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (552, 2, '2026-09-18', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (553, 2, '2026-09-18', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (554, 2, '2026-09-18', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (555, 2, '2026-09-18', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (556, 2, '2026-09-18', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (557, 2, '2026-09-18', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (558, 2, '2026-09-18', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (559, 2, '2026-09-18', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (560, 2, '2026-09-18', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (561, 2, '2026-09-18', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (562, 2, '2026-09-18', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (563, 2, '2026-09-18', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (564, 2, '2026-09-18', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (565, 2, '2026-09-18', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (566, 2, '2026-09-18', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (567, 2, '2026-09-18', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (568, 3, '2026-09-17', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (569, 3, '2026-09-17', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (570, 3, '2026-09-17', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (571, 3, '2026-09-17', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (572, 3, '2026-09-17', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (573, 3, '2026-09-17', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (574, 3, '2026-09-17', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (575, 3, '2026-09-17', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (576, 3, '2026-09-17', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (577, 3, '2026-09-17', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (578, 3, '2026-09-17', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (579, 3, '2026-09-17', '17:00:00.000000', '18:00:00.000000', 'booked');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (580, 3, '2026-09-17', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (581, 3, '2026-09-17', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (582, 3, '2026-09-17', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (583, 3, '2026-09-17', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (584, 3, '2026-09-18', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (585, 3, '2026-09-18', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (586, 3, '2026-09-18', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (587, 3, '2026-09-18', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (588, 3, '2026-09-18', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (589, 3, '2026-09-18', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (590, 3, '2026-09-18', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (591, 3, '2026-09-18', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (592, 3, '2026-09-18', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (593, 3, '2026-09-18', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (594, 3, '2026-09-18', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (595, 3, '2026-09-18', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (596, 3, '2026-09-18', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (597, 3, '2026-09-18', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (598, 3, '2026-09-18', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (599, 3, '2026-09-18', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (600, 4, '2026-09-17', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (601, 4, '2026-09-17', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (602, 4, '2026-09-17', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (603, 4, '2026-09-17', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (604, 4, '2026-09-17', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (605, 4, '2026-09-17', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (606, 4, '2026-09-17', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (607, 4, '2026-09-17', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (608, 4, '2026-09-17', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (609, 4, '2026-09-17', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (610, 4, '2026-09-17', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (611, 4, '2026-09-17', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (612, 4, '2026-09-17', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (613, 4, '2026-09-17', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (614, 4, '2026-09-17', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (615, 4, '2026-09-17', '21:00:00.000000', '22:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (616, 4, '2026-09-18', '06:00:00.000000', '07:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (617, 4, '2026-09-18', '07:00:00.000000', '08:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (618, 4, '2026-09-18', '08:00:00.000000', '09:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (619, 4, '2026-09-18', '09:00:00.000000', '10:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (620, 4, '2026-09-18', '10:00:00.000000', '11:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (621, 4, '2026-09-18', '11:00:00.000000', '12:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (622, 4, '2026-09-18', '12:00:00.000000', '13:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (623, 4, '2026-09-18', '13:00:00.000000', '14:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (624, 4, '2026-09-18', '14:00:00.000000', '15:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (625, 4, '2026-09-18', '15:00:00.000000', '16:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (626, 4, '2026-09-18', '16:00:00.000000', '17:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (627, 4, '2026-09-18', '17:00:00.000000', '18:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (628, 4, '2026-09-18', '18:00:00.000000', '19:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (629, 4, '2026-09-18', '19:00:00.000000', '20:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (630, 4, '2026-09-18', '20:00:00.000000', '21:00:00.000000', 'available');
INSERT OR REPLACE INTO time_slots ("id", "court_id", "date", "start_time", "end_time", "status") VALUES (631, 4, '2026-09-18', '21:00:00.000000', '22:00:00.000000', 'available');

-- Du lieu bang: customers (6 ban ghi)
INSERT OR REPLACE INTO customers ("id", "full_name", "phone", "email", "note", "created_at", "address") VALUES (1, 'Nguyễn Văn Khách', '0901234561', 'khach1@gmail.com', NULL, '2026-09-02 16:29:00', '123 Đường Cầu Giấy, Hà Nội');
INSERT OR REPLACE INTO customers ("id", "full_name", "phone", "email", "note", "created_at", "address") VALUES (2, 'Trần Thị Khách', '0901234562', 'khach2@gmail.com', NULL, '2026-09-02 16:29:00', 'phú bìnhh');
INSERT OR REPLACE INTO customers ("id", "full_name", "phone", "email", "note", "created_at", "address") VALUES (4, 'Trần Thị B', '0987654321', 'b@gmail.com', NULL, '2026-09-03 17:02:23', NULL);
INSERT OR REPLACE INTO customers ("id", "full_name", "phone", "email", "note", "created_at", "address") VALUES (5, 'Lê Văn C', '0909123456', 'c@gmail.com', NULL, '2026-09-03 17:02:23', NULL);
INSERT OR REPLACE INTO customers ("id", "full_name", "phone", "email", "note", "created_at", "address") VALUES (6, 'Nguyễn Văn Hào', '0973426523', 'haongu@gmalil.com', NULL, '2026-09-17 08:13:36', NULL);
INSERT OR REPLACE INTO customers ("id", "full_name", "phone", "email", "note", "created_at", "address") VALUES (7, 'Triệu Văn Bách', '0932472134', 'bach@gmail.com', NULL, '2026-09-18 08:55:22', NULL);

-- Du lieu bang: maintenance_schedules (4 ban ghi)
INSERT OR REPLACE INTO maintenance_schedules ("id", "court_id", "start_date", "end_date", "reason", "status") VALUES (1, 5, '2026-09-04', '2026-09-09', 'aaa', 'done');
INSERT OR REPLACE INTO maintenance_schedules ("id", "court_id", "start_date", "end_date", "reason", "status") VALUES (2, 4, '2026-09-08', '2026-09-15', '', 'done');
INSERT OR REPLACE INTO maintenance_schedules ("id", "court_id", "start_date", "end_date", "reason", "status") VALUES (3, 5, '2026-09-18', '2026-09-20', 'bảo dưỡng mặt sân', 'done');
INSERT OR REPLACE INTO maintenance_schedules ("id", "court_id", "start_date", "end_date", "reason", "status") VALUES (4, 1, '2026-10-16', '2026-10-17', '', 'done');

-- Du lieu bang: bookings (12 ban ghi)
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (1, 1, 1, 5, 2, 'completed', 100000.0, 300000.0, '2026-09-03 07:33:11', 'ok');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (2, 2, 3, 32, 1, 'cancelled', 100000.0, 100000.0, '2026-09-03 07:46:49', 'ok');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (3, 4, 1, 7, 2, 'completed', 0.0, 300000.0, '2026-09-03 17:27:57', '');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (4, 1, 2, 19, 2, 'completed', 0.0, 300000.0, '2026-09-03 17:39:12', '');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (5, 5, 3, 131, 2, 'completed', 0.0, 100000.0, '2026-09-08 02:49:40', '');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (6, 5, 3, 146, 1, 'completed', 0.0, 100000.0, '2026-09-09 03:06:34', '');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (7, 2, 2, 16, 1, 'cancelled', 100000.0, 300000.0, '2026-09-17 02:03:24', ' [Đã hủy - Đã hoàn cọc 100,000đ: Hoàn tiền cọc theo thỏa thuận]');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (8, 1, 1, 316, 4, 'completed', 0.0, 200000.0, '2026-09-17 06:41:31', 'jjjjj');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (9, 6, 3, 579, 1, 'completed', 50000.0, 100000.0, '2026-09-17 08:14:15', '');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (10, 6, 1, 325, 2, 'completed', 100000.0, 200000.0, '2026-09-17 08:32:14', '');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (11, 6, 2, 545, 1, 'cancelled', 100000.0, 200000.0, '2026-09-17 09:39:13', '');
INSERT OR REPLACE INTO bookings ("id", "customer_id", "court_id", "time_slot_id", "staff_id", "status", "deposit_amount", "total_amount", "created_at", "note") VALUES (12, 1, 4, 614, 1, 'cancelled', 50000.0, 100000.0, '2026-09-17 10:25:42', ' [Đã hủy - Giữ cọc 50,000đ]');

-- Du lieu bang: payments (10 ban ghi)
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (3, 1, 200000.0, 'cash', 'paid', '2026-09-04 08:21:04.397000');
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (5, 4, 300000.0, 'cash', 'paid', '2026-09-08 02:20:44.556000');
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (6, 2, 100000.0, 'cash', 'refunded', '2026-09-08 02:21:21.231000');
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (7, 3, 300000.0, 'cash', 'paid', '2026-09-08 02:23:46.069000');
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (9, 6, 100000.0, 'transfer', 'paid', '2026-09-14 05:32:22.185000');
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (10, 5, 100000.0, 'transfer', 'paid', '2026-09-15 01:10:26.578000');
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (12, 8, 200000.0, 'cash', 'paid', '2026-09-17 07:06:36.398000');
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (13, 9, 50000.0, 'cash', 'paid', '2026-09-17 08:21:05.356000');
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (14, 10, 100000.0, 'cash', 'paid', '2026-09-17 08:46:17.524000');
INSERT OR REPLACE INTO payments ("id", "booking_id", "amount", "method", "status", "paid_at") VALUES (15, 7, 100000.0, 'cash', 'refunded', '2026-10-17 02:50:31.857550');

-- Du lieu bang: ai_logs (43 ban ghi)
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (1, 'suggest_slot', '{"court_type_id": 2, "preferred_date": "2026-09-09", "preferred_start_time": null, "preferred_end_time": null}', '1. 🕒 06:00-07:00 | 🏟️ Sân Cầu Lông 1 | 💵 100.000đ
   💡 Thích hợp tập luyện thể thao vào sáng sớm để bắt đầu ngày mới năng động.
2. 🕒 08:00-09:00 | 🏟️ Sân Cầu Lông 2 | 💵 100.000đ
   💡 Khung giờ sáng thong thả, thời tiết mát mẻ dễ chịu cho việc đánh cầu.
3. 🕒 15:00-16:00 | 🏟️ Sân Cầu Lông 1 | 💵 100.000đ
   💡 Khung giờ xế chiều thuận tiện vận động xả stress sau giờ làm việc, học tập.', '2026-09-09 02:40:25');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (2, 'revenue_summary', '{"from_date": "2026-09-02", "to_date": "2026-09-09", "raw_data": {"17:00": {"total": 23, "booked": 0, "occupancy_rate_percent": 0.0}, "18:00": {"total": 23, "booked": 1, "occupancy_rate_percent": 4.35}, "19:00": {"total": 23, "booked": 0, "occupancy_rate_percent": 0.0}, "20:00": {"total": 23, "booked": 1, "occupancy_rate_percent": 4.35}, "21:00": {"total": 23, "booked": 1, "occupancy_rate_percent": 4.35}, "06:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}, "07:00": {"total": 12, "booked": 1, "occupancy_rate_percent": 8.33}, "08:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}, "11:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 12, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu tỉ lệ lấp đầy từ ngày 2026-09-02 đến 2026-09-09, dưới đây là tóm tắt tình hình vận hành và đề xuất chương trình khuyến mại:

### 1. Tóm tắt khung giờ cao điểm và thấp điểm

*   **Khung giờ cao điểm (Có lượt đặt sân):**
    *   **Cao nhất:** Khung giờ **07:00** đạt tỉ lệ lấp đầy **8,33%** (1/12 lượt đặt).
    *   **Các khung giờ có phát sinh đặt sân khác:** **18:00**, **20:00** và **21:00** đều đạt tỉ lệ lấp đầy **4,35%** (mỗi khung giờ có 1/23 lượt đặt).

*   **Khung giờ thấp điểm (Tỉ lệ lấp đầy 0,0% - không có lượt đặt):**
    *   Khung giờ sáng sớm: **06:00**.
    *   Dải giờ ban ngày/hành chính: **Từ 08:00 đến 17:00**.
    *   Khung giờ tối xen kẽ: **19:00**.

---

### 2. Đề xuất chương trình khuyến mại cho khung giờ thấp điểm

*   **Chương trình 1: Ưu đãi "Giờ Vàng Ban Ngày" (Áp dụng khung giờ 08:00 – 16:00)**
    *   *Nội dung:* Giảm giá trực tiếp tiền thuê sân cho khách hàng đặt sân trong khoảng thời gian từ 08:00 đến 16:00 nhằm kích cầu nhóm khách hàng có thời gian linh hoạt (sinh viên, người làm tự do, giải đấu nội bộ ban ngày).
*   **Chương trình 2: Ưu đãi "Đón Sớm – Lấp Tối" (Áp dụng khung giờ 06:00, 17:00 và 19:00)**
    *   *Nội dung:* Tặng kèm dịch vụ (như nước uống/dụng cụ) hoặc ưu đãi tích điểm x2 cho khách hàng đặt sân vào khung giờ 06:00 sáng hoặc các khung giờ trống buổi tối (17:00 và 19:00) để lấp đầy các khoảng trống lịch giữa ca.', '2026-09-09 02:41:10');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (3, 'confirmation_message', '{"booking_id": 1, "message_type": "confirmation"}', 'Chào anh Nguyễn Văn Khách! Xác nhận anh đã đặt thành công Sân Bóng A với thông tin như sau:

- Ngày: 2026-09-03
- Giờ: 21:00-22:00
- Tiền cọc: 100000.0
- Tổng tiền: 300000.0

Cảm ơn anh và hẹn gặp lại!', '2026-09-09 03:06:22');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (4, 'confirmation_message', '{"booking_id": 6, "message_type": "confirmation"}', 'Chào anh Lê Văn C, em xin xác nhận thông tin đặt sân của anh như sau:

- Sân: Sân Cầu Lông 1
- Ngày: 2026-09-09
- Giờ: 06:00-07:00
- Tiền cọc: 0.0
- Tổng tiền: 100000.0

Cảm ơn anh đã đặt sân!', '2026-09-09 03:07:30');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (5, 'suggest_slot', '{"court_type_id": 2, "preferred_date": "2026-09-09", "preferred_start_time": null, "preferred_end_time": null}', '1. 🕒 07:00-08:00 | 🏟️ Sân Cầu Lông 1 | 💵 100.000đ
   💡 Khung giờ sáng sớm mát mẻ, rất thích hợp để rèn luyện thể lực bắt đầu ngày mới.
2. 🕒 08:00-09:00 | 🏟️ Sân Cầu Lông 2 | 💵 100.000đ
   💡 Thời gian buổi sáng thuận tiện, ánh sáng tốt và không khí thoải mái.
3. 🕒 16:00-17:00 | 🏟️ Sân Cầu Lông 1 | 💵 100.000đ
   💡 Khung giờ chiều mát, phù hợp để vận động và giải tỏa căng thẳng cuối ngày.', '2026-09-09 03:10:00');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (6, 'suggest_slot', '{"court_type_id": 2, "preferred_date": "2026-09-09", "preferred_start_time": null, "preferred_end_time": null}', '1. 🕒 07:00-08:00 | 🏟️ Sân Cầu Lông 1 | 💵 100.000đ
   💡 Khung giờ sáng sớm thích hợp để tập luyện khởi động ngày mới.
2. 🕒 08:00-09:00 | 🏟️ Sân Cầu Lông 2 | 💵 100.000đ
   💡 Khung giờ buổi sáng mát mẻ, phù hợp cho các buổi giao lưu thể thao.
3. 🕒 16:00-17:00 | 🏟️ Sân Cầu Lông 1 | 💵 100.000đ
   💡 Khung giờ cuối chiều lý tưởng để rèn luyện sức khỏe sau giờ làm việc.', '2026-09-09 03:10:23');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (7, 'confirmation_message', '{"booking_id": 1, "message_type": "confirmation"}', 'Chào bạn Nguyễn Văn Khách,

Xác nhận bạn đã đặt sân thành công với thông tin sau:
- Sân: Sân Bóng A
- Ngày: 2026-09-03
- Khung giờ: 21:00-22:00
- Tiền cọc: 100000.0
- Tổng tiền: 300000.0

Cảm ơn bạn!', '2026-09-14 05:36:26');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (8, 'reminder_message', '{"booking_id": 4, "message_type": "reminder"}', 'Dạ em chào anh/chị Nguyễn Văn Khách, em xin nhắc lịch chơi sắp tới của anh/chị tại Sân Bóng B vào ngày 2026-09-03, khung giờ 20:00-21:00. 

Anh/chị vui lòng đến đúng giờ để trải nghiệm cuộc chơi trọn vẹn nhất nhé! Tiền cọc còn thiếu của anh/chị là 0.0. 

Hẹn gặp anh/chị tại sân ạ!', '2026-09-15 00:57:54');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (9, 'suggest_slot', '{"court_type_id": 2, "preferred_date": "2026-09-03", "preferred_start_time": null, "preferred_end_time": null}', '1. 🕒 17:00-18:00 | 🏟️ Sân Cầu Lông 1 | 💵 100.000đ
   💡 Khung giờ vừa tan làm, rất phù hợp để tập luyện khởi động đầu buổi tối.
2. 🕒 18:00-19:00 | 🏟️ Sân Cầu Lông 1 | 💵 100.000đ
   💡 Khung giờ cao điểm phổ biến, thuận tiện sắp xếp thời gian cùng đồng đội.
3. 🕒 19:00-20:00 | 🏟️ Sân Cầu Lông 1 | 💵 100.000đ
   💡 Khung giờ tối mát mẻ, thích hợp cho các trận thi đấu giao lưu kéo dài.', '2026-09-15 00:59:39');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (10, 'confirmation_message', '{"booking_id": 3, "message_type": "confirmation"}', 'Chào chị Trần Thị B, 

Dịch vụ chăm sóc khách hàng xin xác nhận thông tin đặt sân của chị như sau:

- **Sân:** Sân Bóng A
- **Ngày:** 2026-09-04
- **Thời gian:** 18:00-19:00
- **Tiền cọc:** 0.0
- **Tổng tiền:** 300000.0

Cảm ơn chị đã đặt sân!', '2026-09-15 01:00:36');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (11, 'revenue_summary', '{"from_date": "2026-09-08", "to_date": "2026-09-15", "raw_data": {"06:00": {"total": 8, "booked": 1, "occupancy_rate_percent": 12.5}, "07:00": {"total": 8, "booked": 1, "occupancy_rate_percent": 12.5}, "08:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "11:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "17:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "18:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "19:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "20:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "21:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu tỉ lệ lấp đầy từ ngày 2026-09-08 đến 2026-09-15, dưới đây là tóm tắt và đề xuất:

### 1. Tóm tắt khung giờ:
* **Khung giờ cao điểm nhất (trong tập dữ liệu):** 
  * **06:00** và **07:00**: Tỉ lệ lấp đầy **12.5%** (1/8 lượt được đặt).
* **Khung giờ thấp điểm:** 
  * **Từ 08:00 đến 21:00**: Tỉ lệ lấp đầy **0.0%** (0/8 lượt được đặt cho tất cả các khung giờ: 08:00, 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00, 21:00).

---

### 2. Đề xuất chương trình khuyến mại cho khung giờ thấp điểm (08:00 - 21:00):
1. **Giảm giá thuê sân theo khung giờ trống:** Áp dụng mức giá ưu đãi/giảm giá trực tiếp cho tất cả các lượt đặt sân rơi vào dải giờ từ 08:00 đến 21:00 để chuyển đổi tỉ lệ lấp đầy từ 0.0% lên cao hơn.
2. **Chương trình "Đặt 1 giờ tặng 1 giờ" hoặc giảm giá theo chuỗi giờ:** Áp dụng ưu đãi khi khách hàng đặt các lượt chơi liên tiếp trong khoảng thời gian từ 08:00 đến 21:00 nhằm tăng tổng số lượt đặt (`booked`) trong dải giờ này.', '2026-09-15 01:05:07');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (12, 'revenue_summary', '{"from_date": "2026-09-08", "to_date": "2026-09-15", "raw_data": {"06:00": {"total": 8, "booked": 1, "occupancy_rate_percent": 12.5}, "07:00": {"total": 8, "booked": 1, "occupancy_rate_percent": 12.5}, "08:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "11:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "17:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "18:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "19:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "20:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "21:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu tỉ lệ lấp đầy từ ngày 2026-09-08 đến 2026-09-15, tôi xin tóm tắt tình hình vận hành và đưa ra đề xuất như sau:

---

### 1. Tóm tắt khung giờ cao điểm và thấp điểm

*   **Khung giờ có lượt đặt (cao nhất trong bảng số liệu):**
    *   **06:00 và 07:00:** Tỉ lệ lấp đầy đạt **12.5%** (đã đặt 1/8 sân mỗi khung giờ).
*   **Khung giờ thấp điểm:**
    *   **Từ 08:00 đến 21:00 (tất cả các khung giờ còn lại):** Tỉ lệ lấp đầy đạt **0.0%** (đã đặt 0/8 sân trên toàn bộ 14 khung giờ này).

---

### 2. Đề xuất chương trình khuyến mại cho khung giờ thấp điểm (08:00 - 21:00)

1.  **Chương trình "Giảm giá khung giờ trống (08:00 - 21:00)":** Áp dụng mức giá ưu đãi/chiết khấu trực tiếp cho khách hàng đặt sân trong khoảng thời gian từ 08:00 đến 21:00 để thu hút lượt đặt mới.
2.  **Chương trình "Gói đặt sân định kỳ giờ thấp điểm":** Bán các gói đặt sân theo tuần/tháng dành riêng cho khung giờ từ 08:00 đến 21:00 với mức giá ưu đãi đặc biệt nhằm cố định lượng khách hàng sử dụng trong khoảng thời gian này.', '2026-09-15 01:05:49');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (13, 'confirmation_message', '{"booking_id": 5, "message_type": "confirmation"}', 'Chào anh/chị Lê Văn C,

Xác nhận anh/chị đã đặt sân thành công với thông tin chi tiết:
- Sân: Sân Cầu Lông 1
- Ngày: 2026-09-08
- Giờ: 07:00-08:00
- Tiền cọc: 0.0
- Tổng tiền: 100000.0

Cảm ơn quý khách và chúc anh/chị có một buổi chơi thể thao vui vẻ!', '2026-09-15 01:08:07');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (14, 'revenue_summary', '{"from_date": "2026-09-08", "to_date": "2026-09-15", "raw_data": {"06:00": {"total": 8, "booked": 1, "occupancy_rate_percent": 12.5}, "07:00": {"total": 8, "booked": 1, "occupancy_rate_percent": 12.5}, "08:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "11:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "17:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "18:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "19:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "20:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "21:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên số liệu được cung cấp từ ngày 2026-09-08 đến ngày 2026-09-15, dưới đây là tóm tắt tình hình vận hành và đề xuất:

### 1. Tóm tắt khung giờ cao điểm và thấp điểm
* **Khung giờ cao điểm (tương đối):** **06:00** và **07:00** 
  * Tỉ lệ lấp đầy: **12.5%** (có 1/8 sân được đặt ở mỗi khung giờ).
* **Khung giờ thấp điểm:** Từ **08:00 đến 21:00** 
  * Tỉ lệ lấp đầy: **0.0%** (hoàn toàn không có lượt đặt sân, 0/8 sân).

---

### 2. Đề xuất chương trình khuyến mại cho khung giờ thấp điểm (08:00 - 21:00)
Để cải thiện tỉ lệ lấp đầy 0.0% trong khoảng thời gian từ 08:00 đến 21:00, có thể áp dụng 2 chương trình sau:

1. **Giảm giá theo khung giờ trống (Giảm giá từ 08:00 - 21:00):** Áp dụng mức giá ưu đãi/giảm giá trực tiếp cho tất cả các lượt đặt sân phát sinh trong khoảng thời gian từ 08:00 đến 21:00.
2. **Ưu đãi tặng giờ chơi:** Áp dụng chương trình "Đặt 1 giờ tặng 1 giờ" hoặc "Đặt 2 giờ tính tiền 1 giờ" dành riêng cho các khung giờ từ 08:00 đến 21:00 nhằm tăng lượt sân được sử dụng.', '2026-09-15 01:08:59');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (15, 'confirmation_message', '{"booking_id": 5, "message_type": "confirmation"}', 'Chào anh/chị Lê Văn C, em xin xác nhận thông tin đặt sân của anh/chị như sau:

- **Sân:** Sân Cầu Lông 1
- **Ngày:** 2026-09-08
- **Giờ:** 07:00-08:00
- **Tiền cọc:** 0.0
- **Tổng tiền:** 100000.0

Cảm ơn anh/chị và chúc anh/chị có trải nghiệm chơi thể thao vui vẻ!', '2026-09-15 03:36:44');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (16, 'reminder_message', '{"booking_id": 5, "message_type": "reminder"}', 'Dạ chào anh Lê Văn C, 

Đây là tin nhắn nhắc lịch chơi sắp tới của anh tại **Sân Cầu Lông 1** vào ngày **2026-09-08**, khung giờ **07:00-08:00**. 

Anh vui lòng đến đúng giờ và mang theo số tiền còn thiếu là **100.000đ** nhé. Cảm ơn anh và chúc anh có buổi chơi thể thao vui vẻ!', '2026-09-15 03:37:00');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (17, 'confirmation_message', '{"booking_id": 1, "message_type": "confirmation"}', 'Chào anh/chị Nguyễn Văn Khách, 

Xác nhận anh/chị đã đặt sân thành công với thông tin sau:
- Sân: Sân Bóng A
- Ngày: 2026-09-03
- Giờ: 21:00-22:00
- Tiền cọc: 100000.0
- Tổng tiền: 300000.0

Cảm ơn anh/chị!', '2026-09-17 01:56:58');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (18, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-17", "preferred_start_time": null, "preferred_end_time": null}', '1. 🕒 17:00-18:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ sau giờ làm việc, thời tiết mát mẻ thích hợp rèn luyện thể thao.
2. 🕒 18:00-19:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ vàng buổi tối, rất thuận tiện để tổ chức thi đấu giao hữu.
3. 🕒 19:00-20:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ tối mát mẻ, thoải mái thời gian chuẩn bị và tập luyện cùng đồng đội.', '2026-09-17 02:28:17');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (19, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-17", "preferred_start_time": "09:00:00", "preferred_end_time": "11:00:00"}', '1. 🕒 09:00-10:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ sáng thích hợp cho việc luyện tập thể thao và khởi động ngày mới.
2. 🕒 10:00-11:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ tiếp nối liền kề, thuận tiện nếu bạn muốn mở rộng thời gian thi đấu.', '2026-09-17 02:29:42');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (20, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-17", "preferred_start_time": "20:00:00", "preferred_end_time": "21:00:00"}', '1. 🕒 20:00-21:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ tối mát mẻ, rất thích hợp để rèn luyện sức khỏe và giao lưu sau giờ làm việc.', '2026-09-17 02:30:48');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (21, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-17", "preferred_start_time": "20:00:00", "preferred_end_time": "22:00:00"}', '1. 🕒 20:00-21:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ vàng buổi tối, thời tiết mát mẻ rất thích hợp để vận động.
2. 🕒 21:00-22:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ muộn liền kề, phù hợp cho những ai muốn chơi thể thao sau giờ làm việc.', '2026-09-17 02:31:03');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (22, 'confirmation_message', '{"booking_id": 8, "message_type": "confirmation"}', 'Chào anh Nguyễn Văn Khách,

Dưới đây là tin nhắn xác nhận thông tin đặt sân của anh:

- **Sân:** Sân Bóng A
- **Ngày:** 2026-09-17
- **Giờ:** 10:00-11:00
- **Tiền cọc:** 0.0
- **Tổng tiền:** 200000.0

Cảm ơn anh đã đặt sân! Chúc anh có trải nghiệm chơi thể thao vui vẻ!', '2026-09-17 06:41:46');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (23, 'confirmation_message', '{"booking_id": 8, "message_type": "confirmation"}', 'Dạ chào anh/chị Nguyễn Văn Khách, em xin xác nhận thông tin đặt sân của mình như sau:

- **Sân:** Sân Bóng A
- **Ngày:** 2026-09-17
- **Giờ:** 10:00-11:00
- **Tiền cọc:** 0.0 VNĐ
- **Tổng tiền:** 200000.0 VNĐ

Cảm ơn anh/chị!', '2026-09-17 06:43:37');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (24, 'revenue_summary', '{"from_date": "2026-09-10", "to_date": "2026-09-17", "raw_data": {"06:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "07:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "08:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 8, "booked": 1, "occupancy_rate_percent": 12.5}, "11:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "17:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "18:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "19:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "20:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "21:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu tỉ lệ lấp đầy từ ngày 2026-09-10 đến 2026-09-17, tôi xin tóm tắt tình hình vận hành và đề xuất chương trình khuyến mại như sau:

### 1. Tóm tắt khung giờ cao điểm và thấp điểm
* **Khung giờ cao điểm (có tỉ lệ lấp đầy cao nhất trong dữ liệu):** 
  * **10:00:** Tỉ lệ lấp đầy **12.5%** (đã đặt 1/8 sân).
* **Khung giờ thấp điểm:** 
  * Các khung giờ **06:00 – 09:00** và **11:00 – 21:00:** Tỉ lệ lấp đầy **0.0%** (chưa có lượt đặt nào, 0/8 sân).

---

### 2. Đề xuất chương trình khuyến mại cho khung giờ thấp điểm
Để cải thiện tỉ lệ lấp đầy tại các khung giờ trống (06:00 – 09:00 và 11:00 – 21:00), có thể áp dụng 2 chương trình sau:

1. **Chương trình "Giờ trống giá ưu đãi":** Áp dụng chính sách giảm giá trực tiếp trên giá thuê sân đối với các khung giờ có tỉ lệ lấp đầy 0% (06:00 – 09:00 và 11:00 – 21:00).
2. **Chương trình "Đặt giờ trống - Tặng voucher":** Tặng voucher giảm giá cho lượt đặt tiếp theo hoặc tặng kèm dịch vụ/tiện ích đối với khách hàng thực hiện đặt sân vào các khung giờ thấp điểm nêu trên.', '2026-09-17 07:08:05');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (25, 'revenue_summary', '{"from_date": "2026-09-10", "to_date": "2026-09-17", "raw_data": {"06:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "07:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "08:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 8, "booked": 1, "occupancy_rate_percent": 12.5}, "11:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "17:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "18:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "19:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "20:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "21:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu tỉ lệ lấp đầy từ ngày 2026-09-10 đến 2026-09-17, tôi tóm tắt tình hình vận hành và đưa ra đề xuất như sau:

---

### 1. Tóm tắt khung giờ cao điểm và thấp điểm

*   **Khung giờ cao điểm (có tỉ lệ lấp đầy cao nhất):**
    *   **10:00:** Tỉ lệ lấp đầy **12.5%** (đã đặt 1/8 sân). Đây là khung giờ duy nhất phát sinh lượt đặt sân trong khoảng thời gian này.
*   **Khung giờ thấp điểm (tỉ lệ lấp đầy 0%):**
    *   Tất cả các khung giờ còn lại: **06:00 – 09:00** và **11:00 – 21:00** đều có tỉ lệ lấp đầy là **0.0%** (đã đặt 0/8 sân).

---

### 2. Đề xuất chương trình khuyến mại cho khung giờ thấp điểm

Nhằm thúc đẩy lượt đặt sân tại các khung giờ đang hoàn toàn trống (0% lấp đầy):

1.  **Chương trình "Giờ vàng giá ưu đãi":**
    *   **Nội dung:** Giảm giá trực tiếp (ví dụ: giảm 20% - 30% giá thuê) áp dụng cho khách hàng đặt sân vào các khung giờ sáng sớm (06:00 - 09:00) hoặc khung giờ chiều/tối (11:00 - 21:00).
2.  **Chương trình "Combo Đặt 2 tính 1" hoặc Tặng dịch vụ đi kèm:**
    *   **Nội dung:** Áp dụng ưu đãi thuê 2 giờ liên tiếp chỉ tính tiền 1 giờ, hoặc tặng kèm nước uống/dụng cụ thi đấu khi đặt sân trong các khung giờ có tỉ lệ lấp đầy 0%.', '2026-09-17 07:19:12');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (26, 'revenue_summary', '{"from_date": "2026-09-03", "to_date": "2026-09-17", "raw_data": {"17:00": {"total": 31, "booked": 0, "occupancy_rate_percent": 0.0}, "18:00": {"total": 31, "booked": 1, "occupancy_rate_percent": 3.23}, "19:00": {"total": 31, "booked": 0, "occupancy_rate_percent": 0.0}, "20:00": {"total": 31, "booked": 1, "occupancy_rate_percent": 3.23}, "21:00": {"total": 31, "booked": 1, "occupancy_rate_percent": 3.23}, "06:00": {"total": 20, "booked": 1, "occupancy_rate_percent": 5.0}, "07:00": {"total": 20, "booked": 1, "occupancy_rate_percent": 5.0}, "08:00": {"total": 20, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 20, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 20, "booked": 1, "occupancy_rate_percent": 5.0}, "11:00": {"total": 20, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 20, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 20, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 20, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 20, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 20, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu tỉ lệ lấp đầy từ ngày 2026-09-03 đến 2026-09-17, tôi tóm tắt tình hình như sau:

### 1. Tóm tắt khung giờ cao điểm và thấp điểm

*   **Khung giờ cao điểm (có phát sinh lượt đặt sân):**
    *   **Tỉ lệ lấp đầy 5.0%** (1/20 lượt đặt): `06:00`, `07:00`, `10:00`.
    *   **Tỉ lệ lấp đầy 3.23%** (1/31 lượt đặt): `18:00`, `20:00`, `21:00`.
*   **Khung giờ thấp điểm (Tỉ lệ lấp đầy 0.0% - không có lượt đặt nào):**
    *   Gồm 10 khung giờ: `08:00`, `09:00`, `11:00`, `12:00`, `13:00`, `14:00`, `15:00`, `16:00`, `17:00`, và `19:00`.

---

### 2. Đề xuất chương trình khuyến mại cho khung giờ thấp điểm

1.  **Chương trình "Giảm giá giờ thấp điểm" (Off-Peak Discount):**
    *   **Đối tượng áp dụng:** Khách hàng đặt sân trong các khung giờ có tỉ lệ lấp đầy 0.0% (bao gồm các khung giờ ban ngày từ `08:00` đến `17:00`, và khung giờ buổi tối `19:00`).
    *   **Hình thức:** Ưu đãi giảm giá trực tiếp trên giá thuê sân cho các khung giờ này nhằm gia tăng lượt đặt.

2.  **Chương trình "Đặt 1 tặng 1 / Ưu đãi tích điểm giờ trống":**
    *   **Đối tượng áp dụng:** Các khung giờ hoàn toàn trống lượt đặt (`08:00 - 09:00`, `11:00 - 17:00`, `19:00`).
    *   **Hình thức:** Tặng thêm thời gian chơi hoặc tặng voucher giảm giá cho lần đặt tiếp theo khi khách hàng trải nghiệm đặt sân vào các khung giờ thấp điểm nêu trên.', '2026-09-17 07:20:18');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (27, 'revenue_summary', '{"from_date": "2026-09-10", "to_date": "2026-09-17", "raw_data": {"06:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "07:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "08:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 8, "booked": 1, "occupancy_rate_percent": 12.5}, "11:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "17:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "18:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "19:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "20:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}, "21:00": {"total": 8, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu được cung cấp từ ngày 2026-09-10 đến 2026-09-17, tôi xin tóm tắt tình hình vận hành và đề xuất khuyến mại như sau:

### 1. Tóm tắt khung giờ cao điểm và thấp điểm
* **Khung giờ cao điểm (có tỉ lệ lấp đầy cao nhất):** 
  * **10:00**: Tỉ lệ lấp đầy là **12.5%** (đặt 1/8 lượt).
* **Khung giờ thấp điểm:** 
  * Các khung giờ **06:00 – 09:00** và **11:00 – 21:00**: Tỉ lệ lấp đầy là **0.0%** (đặt 0/8 lượt).

---

### 2. Đề xuất chương trình khuyến mại cho khung giờ thấp điểm
Để cải thiện tỉ lệ lấp đầy ở các khung giờ trống (06:00–09:00 và 11:00–21:00):

1. **Giảm giá giờ chơi trống:** Áp dụng mức giá ưu đãi/giảm giá trực tiếp khi đặt sân vào các khung giờ có tỉ lệ lấp đầy 0% (06:00–09:00 và 11:00–21:00).
2. **Tặng thêm thời gian hoặc dịch vụ đi kèm:** Áp dụng chính sách đặt 1 giờ tặng thêm giờ chơi hoặc tặng kèm dịch vụ/nước uống cho khách hàng đặt sân trong các khung giờ thấp điểm này.', '2026-09-17 07:39:42');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (28, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-17", "preferred_start_time": "06:00:00", "preferred_end_time": "20:00:00"}', '1. 🕒 07:00-08:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ sáng sớm mát mẻ, thích hợp để tập luyện và khởi động ngày mới.
2. 🕒 16:00-17:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ chiều mát, rất lý tưởng cho các trận bóng giao hữu sau giờ làm việc.
3. 🕒 08:00-09:00 | 🏟️ Sân Bóng B | 💵 200.000đ
   💡 Khung giờ buổi sáng thong thả, thời tiết vẫn dịu nhẹ và dễ chịu.', '2026-09-17 08:10:47');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (29, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-17", "preferred_start_time": null, "preferred_end_time": null}', '1. 🕒 06:00-07:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ sáng sớm thời tiết mát mẻ, lý tưởng để tập luyện khởi động ngày mới.
2. 🕒 08:00-09:00 | 🏟️ Sân Bóng B | 💵 200.000đ
   💡 Khung giờ buổi sáng nắng nhẹ, thích hợp cho các trận thi đấu giao hữu.
3. 🕒 16:00-17:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ chiều mát, thuận tiện rèn luyện sức khỏe sau giờ làm việc.', '2026-09-17 08:11:49');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (30, 'reminder_message', '{"booking_id": 10, "message_type": "reminder"}', 'Chào bạn nguyễn văn hảo ngu, đây là tin nhắn nhắc lịch chơi sắp tới của bạn tại Sân Bóng A vào ngày 2026
-09-17, khung giờ 19:00-20:00. 

Bạn vui lòng đến đúng giờ và mang theo số tiền còn thiếu là 200000.0 nhé. Chúc bạn có một trận bóng thật vui vẻ!', '2026-09-17 08:34:23');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (31, 'confirmation_message', '{"booking_id": 10, "message_type": "confirmation"}', 'Chào bạn nguyễn văn hảo ngu, em xin xác nhận thông tin đặt sân của bạn như sau:

- Sân: Sân Bóng A
- Ngày: 2026-09-17
- Giờ: 19:00-20:00
- Tiền cọc: 100000.0
- Tổng tiền: 200000.0

Cảm ơn bạn đã đặt sân!', '2026-09-17 08:36:55');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (32, 'reminder_message', '{"booking_id": 10, "message_type": "reminder"}', 'Chào anh/chị nguyễn văn hảo ngu, 

Đây là tin nhắn nhắc lịch chơi sắp tới của anh/chị tại Sân Bóng A vào khung giờ 19:00-20:00 ngày 2026-09-17. 

Anh/chị vui lòng đến đúng giờ và thanh toán khoản tiền còn thiếu là 200000.0 nhé. Hẹn gặp anh/chị tại sân!', '2026-09-17 08:37:36');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (33, 'reminder_message', '{"booking_id": 10, "message_type": "reminder"}', 'Chào anh/chị nguyễn văn hảo ngu, em xin nhắc lịch chơi thể thao của mình sắp đến giờ rồi ạ!

- **Sân:** Sân Bóng A
- **Thời gian:** 19:00 - 20:00, ngày 2026-09-17
- **Đặt cọc còn thiếu:** 200.000 VNĐ

Anh/chị vui lòng đến đúng giờ và mang theo số tiền đặt cọc còn thiếu (200.000 VNĐ) giúp em nhé. Chúc anh/chị có khoảng thời gian chơi vui vẻ!', '2026-09-17 08:39:19');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (34, 'reminder_message', '{"booking_id": 10, "message_type": "reminder"}', 'Chào anh Nguyễn Văn Hảo Ngu, đây là tin nhắn nhắc lịch chơi sắp tới của anh tại Sân Bóng A vào ngày 2026-09-17, khung giờ 19:00-20:00. 

Anh vui lòng đến đúng giờ và chuẩn bị số tiền cọc còn thiếu là 100000.0 giúp sân nhé. Cảm ơn anh!', '2026-09-17 08:44:01');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (35, 'reminder_message', '{"booking_id": 12, "message_type": "reminder"}', 'Chào anh/chị Nguyễn Văn Khách, 

Sân xin nhắc lịch chơi sắp tới của anh/chị tại Sân Cầu Lông 2 vào khung giờ 20:00-21:00, ngày 2026-09-17. 

Anh/chị vui lòng đến đúng giờ và mang theo số tiền cọc còn thiếu là 50000.0 giúp sân nhé. Chúc anh/chị có buổi chơi thể thao vui vẻ!', '2026-09-18 07:20:28');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (36, 'revenue_summary', '{"from_date": "2026-09-11", "to_date": "2026-09-18", "raw_data": {"06:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "07:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "08:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 10, "booked": 1, "occupancy_rate_percent": 10.0}, "11:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "17:00": {"total": 10, "booked": 1, "occupancy_rate_percent": 10.0}, "18:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "19:00": {"total": 10, "booked": 1, "occupancy_rate_percent": 10.0}, "20:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}, "21:00": {"total": 10, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu tỉ lệ lấp đầy từ ngày 2026-09-11 đến 2026-09-18, dưới đây là tóm tắt và đề xuất chương trình khuyến mại:

### 1. Tóm tắt khung giờ cao điểm / thấp điểm

*   **Khung giờ có tỉ lệ lấp đầy cao nhất trong dữ liệu (10.0% - 1/10 lượt đặt):** 
    *   `10:00`, `17:00`, `19:00`.
*   **Khung giờ thấp điểm (0.0% - 0/10 lượt đặt):**
    *   Buổi sáng: `06:00`, `07:00`, `08:00`, `09:00`.
    *   Buổi trưa & chiều: `11:00`, `12:00`, `13:00`, `14:00`, `15:00`, `16:00`.
    *   Buổi tối: `18:00`, `20:00`, `21:00`.

---

### 2. Đề xuất 1-2 chương trình khuyến mại cho khung giờ thấp điểm (các khung giờ có tỉ lệ lấp đầy 0%)

1.  **Chương trình "Ưu đãi giờ trống":** Giảm giá trực tiếp tiền thuê sân đối với các khung giờ có tỷ lệ lấp đầy 0% (đặc biệt là dải giờ sáng 06:00 - 09:00 và dải giờ trưa/chiều 11:00 - 16:00) nhằm khuyến khích khách hàng đặt sân vào các thời điểm này.
2.  **Chương trình "Đặt sân tặng kèm dịch vụ":** Tặng kèm nước uống hoặc dịch vụ/dụng cụ hỗ trợ miễn phí cho khách hàng đăng ký sử dụng sân trong các khung giờ đạt 0% lấp đầy (bao gồm các khung giờ 06:00–09:00, 11:00–16:00, 18:00, 20:00–21:00).', '2026-09-18 08:05:06');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (37, 'revenue_summary', '{"from_date": "2026-09-17", "to_date": "2026-09-19", "raw_data": {"06:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "07:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "08:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 9, "booked": 1, "occupancy_rate_percent": 11.11}, "11:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "17:00": {"total": 9, "booked": 1, "occupancy_rate_percent": 11.11}, "18:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "19:00": {"total": 9, "booked": 1, "occupancy_rate_percent": 11.11}, "20:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}, "21:00": {"total": 9, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu tỉ lệ lấp đầy từ ngày 2026-
09-17 đến 2026-09-19:

### 1. Tóm tắt khung giờ cao điểm và thấp điểm
* **Khung giờ cao nhất (tỉ lệ lấp đầy 11.11%, booked = 1/9):** 
  * 10:00, 17:00, 19:00.
* **Khung giờ thấp điểm (tỉ lệ lấp đầy 0.0%, booked = 0/9):** 
  * Khung giờ sáng: 06:00, 07:00, 08:00, 09:00.
  * Khung giờ trưa và chiều: 11:00, 12:00, 13:00, 14:00, 15:00, 16:00.
  * Khung giờ tối/đêm: 18:00, 20:00, 21:00.

---

### 2. Đề xuất 1-2 chương trình khuyến mại cho khung giờ thấp điểm
1. **Giảm giá giờ thấp điểm (Happy Hour):** Áp dụng ưu đãi giảm giá thuê sân trực tiếp cho các khung giờ có tỉ lệ lấp đầy 0% (đặc biệt là dải giờ 06:00 - 09:00 và 11:00 - 16:00).
2. **Ưu đãi đồng giá tối/đêm:** Áp dụng mức giá ưu đãi đồng giá cho các khung giờ xen kẽ trống hoàn toàn vào buổi tối như 18:00, 20:00, và 21:00.', '2026-09-18 08:06:19');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (38, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-18", "preferred_start_time": null, "preferred_end_time": null}', '1. 🕒 06:00-07:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Thích hợp rèn luyện sức khỏe vào sáng sớm thoáng mát.
2. 🕒 08:00-09:00 | 🏟️ Sân Bóng B | 💵 200.000đ
   💡 Khung giờ sáng đẹp, thời tiết dễ chịu để vận động.
3. 🕒 15:00-16:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ chiều mát mẻ, rất lý tưởng cho các trận đấu giao hữu.', '2026-09-18 09:24:57');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (39, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-18", "preferred_start_time": "17:00:00", "preferred_end_time": "19:00:00"}', '1. 🕒 17:00-18:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ tan tầm lý tưởng để thể dục ngay sau giờ làm việc.
2. 🕒 18:00-19:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ vàng buổi tối phù hợp cho các trận đấu giao hữu.
3. 🕒 17:00-18:00 | 🏟️ Sân Bóng B | 💵 200.000đ
   💡 Lựa chọn thay thế tuyệt vời cùng khung giờ chiều mát mẻ tại Sân B.', '2026-09-18 09:25:44');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (40, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-17", "preferred_start_time": "19:00:00", "preferred_end_time": null}', '1. 🕒 19:00-20:00 | 🏟️ Sân Bóng B | 💵 200.000đ
   💡 Khung giờ vàng buổi tối rất thuận tiện để thi đấu sau giờ làm việc.
2. 🕒 20:00-21:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ đẹp giữa tối với thời tiết mát mẻ và dễ chịu.
3. 🕒 21:00-22:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Phù hợp cho những ai muốn thi đấu ca muộn thoải mái và ít kẹt xe.', '2026-09-18 09:40:23');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (41, 'suggest_slot', '{"court_type_id": 1, "preferred_date": "2026-09-18", "preferred_start_time": "19:00:00", "preferred_end_time": null}', '1. 🕒 19:00-20:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Khung giờ vàng ngay sau giờ làm, rất tiện lợi để vận động buổi tối.
2. 🕒 20:00-21:00 | 🏟️ Sân Bóng A | 💵 200.000đ
   💡 Giờ đá lý tưởng nhất buổi tối, thời tiết mát mẻ và dễ tập trung đông đủ.
3. 🕒 21:00-22:00 | 🏟️ Sân Bóng B | 💵 200.000đ
   💡 Phù hợp cho các trận đấu muộn, không gian thoải mái và yên tĩnh.', '2026-09-18 10:08:23');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (42, 'revenue_summary', '{"from_date": "2026-09-20", "to_date": "2026-10-19", "raw_data": {"06:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "07:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "08:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "11:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "17:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "18:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "19:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "20:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}, "21:00": {"total": 11, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên số liệu được cung cấp, dưới đây là tóm tắt tình hình vận hành và đề xuất chương trình khuyến mại:

### 1. Tóm tắt khung giờ cao điểm và thấp điểm
* **Khung giờ cao điểm:** **Không có**. Tất cả các khung giờ từ 06:00 đến 21:00 đều ghi nhận 0 lượt đặt sân (tỉ lệ lấp đầy đạt 0.0%).
* **Khung giờ thấp điểm:** **Toàn bộ các khung giờ từ 06:00 đến 21:00** (100% thời gian hoạt động đều đạt tỉ lệ lấp đầy 0.0% với 0/11 lượt đặt).

---

### 2. Đề xuất chương trình khuyến mại
Do tất cả các khung giờ đều chưa có lượt đặt, đề xuất áp dụng khuyến mại cho toàn bộ thời gian hoạt động:

1. **Chương trình "Đặt 1 giờ - Tặng 1 giờ" (Hoặc tặng kèm dịch vụ):** 
   * Áp dụng cho tất cả các khung giờ từ 06:00 đến 21:00 để kích thích khách hàng trải nghiệm sân.
2. **Chương trình Đồng giá / Giảm giá toàn bộ khung giờ:** 
   * Giảm % giá thuê sân hoặc áp dụng một mức giá ưu đãi cố định cho mọi lượt đặt sân trong ngày trong giai đoạn này.', '2026-10-19 16:15:01');
INSERT OR REPLACE INTO ai_logs ("id", "type", "input_json", "output_text", "created_at") VALUES (43, 'revenue_summary', '{"from_date": "2026-09-01", "to_date": "2026-09-23", "raw_data": {"17:00": {"total": 40, "booked": 1, "occupancy_rate_percent": 2.5}, "18:00": {"total": 40, "booked": 1, "occupancy_rate_percent": 2.5}, "19:00": {"total": 40, "booked": 1, "occupancy_rate_percent": 2.5}, "20:00": {"total": 40, "booked": 1, "occupancy_rate_percent": 2.5}, "21:00": {"total": 40, "booked": 1, "occupancy_rate_percent": 2.5}, "06:00": {"total": 29, "booked": 1, "occupancy_rate_percent": 3.45}, "07:00": {"total": 29, "booked": 1, "occupancy_rate_percent": 3.45}, "08:00": {"total": 29, "booked": 0, "occupancy_rate_percent": 0.0}, "09:00": {"total": 29, "booked": 0, "occupancy_rate_percent": 0.0}, "10:00": {"total": 29, "booked": 1, "occupancy_rate_percent": 3.45}, "11:00": {"total": 29, "booked": 0, "occupancy_rate_percent": 0.0}, "12:00": {"total": 29, "booked": 0, "occupancy_rate_percent": 0.0}, "13:00": {"total": 29, "booked": 0, "occupancy_rate_percent": 0.0}, "14:00": {"total": 29, "booked": 0, "occupancy_rate_percent": 0.0}, "15:00": {"total": 29, "booked": 0, "occupancy_rate_percent": 0.0}, "16:00": {"total": 29, "booked": 0, "occupancy_rate_percent": 0.0}}}', 'Dựa trên dữ liệu tỉ lệ lấp đầy từ ngày 2026-09-01 đến 2026-09-23, dưới đây là tóm tắt tình hình vận hành và đề xuất:

### 1. Tóm tắt khung giờ cao điểm và thấp điểm

*   **Khung giờ "cao điểm" nhất (Tỉ lệ lấp đầy cao nhất trong dữ liệu - 3.45%):**
    *   Các khung giờ: **06:00, 07:00, 10:00** (đều đạt 1 lượt đặt trên tổng số 29 sân/lượt).
    *   *Lưu ý:* Các khung giờ từ **17:00 đến 21:00** đạt tỉ lệ lấp đầy **2.5%** (1 lượt đặt trên tổng số 40 sân/lượt).

*   **Khung giờ thấp điểm (Tỉ lệ lấp đầy 0.0% - không có lượt đặt):**
    *   Các khung giờ: **08:00, 09:00** và dải giờ chiều **11:00, 12:00, 13:00, 14:00, 15:00, 16:00** (đều có 0 lượt đặt trên tổng số 29 sân/lượt).

---

### 2. Đề xuất chương trình khuyến mại cho khung giờ thấp điểm (08:00–09:00 và 11:00–16:00)

1.  **Chương trình "Giờ Vàng Giá Sốc":** 
    *   Giảm giá tiền thuê sân (hoặc áp dụng mức giá đồng giá ưu đãi) đối với tất cả các lượt đặt trong khung giờ từ **11:00 đến 16:00** để thu hút khách hàng phát sinh nhu cầu vào buổi trưa/chiều.
2.  **Ưu đãi "Đặt Sân Sáng Sớm - Tặng Giờ Chơi":**
    *   Áp dụng khuyến mại tặng thêm thời gian chơi hoặc voucher cho khách hàng đặt sân trong các khung giờ **08:00 - 09:00** để lấp đầy khoảng trống giữa ca sáng.', '2026-10-19 16:16:11');

PRAGMA foreign_keys = ON;
