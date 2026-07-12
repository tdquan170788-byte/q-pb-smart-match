/**
 * Rating mặc định của thành viên mới.
 */
export const DEFAULT_RATING = 1500;

/**
 * Hệ số K quyết định mức rating thay đổi sau mỗi trận.
 *
 * K càng lớn:
 * - rating thay đổi càng nhanh;
 * - phản ứng mạnh hơn với kết quả bất ngờ.
 *
 * K càng nhỏ:
 * - rating ổn định hơn;
 * - cần nhiều trận hơn để phản ánh trình độ.
 */
export const DEFAULT_K_FACTOR = 24;

/**
 * Rating nhỏ nhất được phép lưu.
 */
export const MIN_RATING = 100;

/**
 * Rating lớn nhất được phép lưu.
 */
export const MAX_RATING = 4000;

/**
 * Giá trị score đại diện cho đội thắng.
 */
export const ELO_WIN_SCORE = 1;

/**
 * Giá trị score đại diện cho đội thua.
 */
export const ELO_LOSS_SCORE = 0;

/**
 * Giá trị score cho trường hợp hòa.
 *
 * Pickleball thông thường không hòa, nhưng vẫn giữ
 * hằng số này để Rating Engine có thể tái sử dụng.
 */
export const ELO_DRAW_SCORE = 0.5;

/**
 * Hệ số dùng trong công thức expected score của Elo.
 *
 * Công thức chuẩn:
 *
 * expected = 1 / (1 + 10 ^ ((opponent - player) / 400))
 */
export const ELO_RATING_SCALE = 400;
