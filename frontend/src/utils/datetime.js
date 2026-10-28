/**
 * Utility: Format datetime đúng múi giờ Việt Nam (Asia/Ho_Chi_Minh = UTC+7)
 *
 * SQLite/FastAPI thường trả về ISO string KHÔNG có 'Z' hoặc '+07:00',
 * nên trình duyệt parse nhầm thành giờ địa phương hoặc UTC tùy browser.
 * Hàm này ép về UTC+7 bất kể browser đang dùng timezone nào.
 */

const VN_TZ = 'Asia/Ho_Chi_Minh';

/**
 * Đảm bảo chuỗi datetime được parse đúng là UTC
 * (thêm 'Z' nếu chưa có timezone info)
 */
function toUTC(isoStr) {
  if (!isoStr) return null;
  const s = String(isoStr).trim();
  // Đã có timezone info → dùng nguyên
  if (s.endsWith('Z') || s.includes('+') || /[-]\d{2}:\d{2}$/.test(s)) {
    return new Date(s);
  }
  // Không có → coi là UTC (backend lưu UTC)
  return new Date(s + 'Z');
}

/**
 * Format datetime + time: "08:21:05 17/9/2026" → "15:21:05 17/9/2026"
 */
export function formatVNDateTime(isoStr) {
  const d = toUTC(isoStr);
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    timeZone: VN_TZ,
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Format date only: "17/09/2026"
 */
export function formatVNDate(isoStr) {
  const d = toUTC(isoStr);
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    timeZone: VN_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Lấy ngày hiện tại theo giờ VN (dùng cho filter "Hôm nay")
 * Trả về chuỗi YYYY-MM-DD
 */
export function todayVN(refDate = new Date()) {
  return refDate.toLocaleDateString('sv-SE', { timeZone: VN_TZ }); // sv-SE cho format YYYY-MM-DD
}

/**
 * Cộng/trừ số ngày từ một chuỗi ngày 'YYYY-MM-DD'
 * Tránh hoàn toàn lỗi lệch múi giờ (timezone drift / midnight rollover)
 */
export function addDays(dateStr, days = 0) {
  if (!dateStr) return todayVN();
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d + days));
  return target.toISOString().slice(0, 10);
}

/**
 * Format chuỗi ngày YYYY-MM-DD ra thứ ngày tháng tiếng Việt đầy đủ
 * Ví dụ: "Thứ Ba, 27/10/2026"
 */
export function formatVNDateLong(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return target.toLocaleDateString('vi-VN', {
    timeZone: VN_TZ,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Lấy tổng số phút từ đầu ngày theo giờ Việt Nam (0 - 1439)
 */
export function currentMinutesVN(dateObj = new Date()) {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: VN_TZ,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(dateObj);
  
  const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  return h * 60 + m;
}

/**
 * Xác định trạng thái vận hành thực tế của slot:
 * - 'in_use': Đang sử dụng (nằm trong khung giờ đá của ngày hôm nay)
 * - 'completed': Đã xong (hết giờ đá của ngày hôm nay hoặc ngày trong quá khứ)
 * - 'upcoming': Đã đặt (chưa đến giờ đá ngày hôm nay hoặc ngày tương lai)
 */
export function getSlotMatchStatus(slotDate, startTimeStr, endTimeStr, hour = null, refDate = new Date()) {
  if (!slotDate) return 'unknown';

  const todayStr = todayVN(refDate);

  if (slotDate < todayStr) {
    return 'completed'; // Ngày trong quá khứ -> Đã xong
  }
  if (slotDate > todayStr) {
    return 'upcoming'; // Ngày trong tương lai -> Đã đặt (chưa tới)
  }

  // Ngày hôm nay -> So sánh số phút thực tế
  const nowMin = currentMinutesVN(refDate);

  let startMin = 0;
  if (startTimeStr) {
    const [h, m] = String(startTimeStr).slice(0, 5).split(':').map(Number);
    startMin = h * 60 + (m || 0);
  } else if (hour !== null && hour !== undefined) {
    startMin = hour * 60;
  }

  let endMin = startMin + 60;
  if (endTimeStr) {
    const [h, m] = String(endTimeStr).slice(0, 5).split(':').map(Number);
    endMin = h * 60 + (m || 0);
  } else if (hour !== null && hour !== undefined) {
    endMin = (hour + 1) * 60;
  }

  if (nowMin < startMin) {
    return 'upcoming'; // Chưa đến giờ đá -> Đã đặt
  } else if (nowMin >= startMin && nowMin < endMin) {
    return 'in_use'; // Đến giờ đá -> Đang sử dụng
  } else {
    return 'completed'; // Hết giờ đá -> Đã xong
  }
}

