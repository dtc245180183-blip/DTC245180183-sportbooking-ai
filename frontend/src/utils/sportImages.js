/**
 * Ánh xạ tên loại sân → đường dẫn SVG mặc định
 * Ưu tiên: image_url từ API > tự động theo tên > default
 */

const SPORT_KEYWORDS = {
  football:    ['bóng đá', 'football', 'soccer', 'futsal'],
  badminton:   ['cầu lông', 'badminton'],
  tennis:      ['tennis'],
  volleyball:  ['bóng chuyền', 'volleyball'],
  basketball:  ['bóng rổ', 'basketball'],
  pickleball:  ['pickleball', 'pickerball', 'pickkerball', 'pickle', 'picker'],
};

/**
 * @param {string} typeName - tên loại sân (vd: "Sân cầu lông")
 * @param {string|null} imageUrl - URL ghi đè từ API
 * @returns {string} URL ảnh để dùng trong <img src="">
 */
export function getSportImage(typeName = '', imageUrl = null) {
  if (imageUrl && typeof imageUrl === 'string') {
    const cleanUrl = imageUrl.trim().toLowerCase();
    // Bỏ qua nếu là link trang web HTML thay vì file hình ảnh trực tiếp
    if (!cleanUrl.endsWith('.html') && !cleanUrl.endsWith('.htm')) {
      return imageUrl;
    }
  }

  const lower = (typeName || '').toLowerCase();
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return `/images/sports/${sport}.svg?v=2`;
    }
  }
  return '/images/sports/default.svg?v=2';
}

/**
 * Màu accent theo loại sân (dùng cho border glow card)
 */
const SPORT_ACCENT = {
  football:   '#22C55E',
  badminton:  '#14B8A6',
  tennis:     '#A78BFA',
  volleyball: '#F59E0B',
  basketball: '#F97316',
  pickleball: '#3B82F6',
};

export function getSportAccent(typeName = '') {
  const lower = typeName.toLowerCase();
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return SPORT_ACCENT[sport];
    }
  }
  return '#14B8A6'; // default teal
}
