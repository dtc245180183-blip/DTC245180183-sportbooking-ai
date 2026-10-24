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
export function todayVN() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: VN_TZ }); // sv-SE cho format YYYY-MM-DD
}
