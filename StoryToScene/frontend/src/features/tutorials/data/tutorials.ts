/*
 * ============================================================================
 *  DỮ LIỆU TRANG HƯỚNG DẪN (/tutorials)
 * ============================================================================
 *  Cách cập nhật video:
 *   1. Upload video lên kênh YouTube của StoryToScene.
 *   2. Dán link vào trường `youtube` của bài tương ứng (đúng ngôn ngữ `vi` / `en`).
 *      Chấp nhận mọi dạng link: https://www.youtube.com/watch?v=XXXX, https://youtu.be/XXXX,
 *      https://www.youtube.com/shorts/XXXX, hoặc chỉ mã video (11 ký tự).
 *   3. Cập nhật `duration` theo độ dài thật của video (định dạng "m:ss").
 *
 *  ⚠️ PLACEHOLDER: hiện CHƯA có video thật – mọi `youtube` đang là `null`.
 *     Giao diện sẽ hiển thị "Video sắp ra mắt" cho tới khi có link.
 *     Thời lượng tiếng Việt lấy theo thiết kế Figma; bản tiếng Anh chưa có (null).
 *
 *  Thumbnail: ảnh minh họa từ thiết kế (src/assets/tutorials). Khi có video,
 *  có thể đặt `thumbnail: 'youtube'` để dùng ảnh bìa tự động của YouTube.
 * ============================================================================
 */
import lesson01 from '@/assets/tutorials/lesson-01.jpg'
import lesson02 from '@/assets/tutorials/lesson-02.jpg'
import lesson03 from '@/assets/tutorials/lesson-03.jpg'
import lesson04 from '@/assets/tutorials/lesson-04.jpg'
import lesson05 from '@/assets/tutorials/lesson-05.jpg'
import lesson06 from '@/assets/tutorials/lesson-06.jpg'
import lesson07 from '@/assets/tutorials/lesson-07.jpg'
import lesson08 from '@/assets/tutorials/lesson-08.jpg'
import lesson09 from '@/assets/tutorials/lesson-09.jpg'
import lesson10 from '@/assets/tutorials/lesson-10.jpg'
import lesson11 from '@/assets/tutorials/lesson-11.jpg'
import lesson12 from '@/assets/tutorials/lesson-12.jpg'

export type TutorialLanguage = 'vi' | 'en'

export const tutorialLanguages: { value: TutorialLanguage; label: string }[] = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'Tiếng Anh' },
]

/** Một video YouTube. `youtube`: link hoặc mã video; `null` = chưa có video. */
export type TutorialVideo = {
  youtube: string | null
  /** Thời lượng hiển thị, dạng "m:ss". `null` nếu chưa biết. */
  duration: string | null
}

export type Tutorial = {
  /** Số thứ tự hiển thị, vd. "01" */
  number: string
  title: string
  description: string
  /** Ảnh thumbnail (import từ assets) hoặc 'youtube' để dùng ảnh bìa của video. */
  thumbnail: string | 'youtube'
  /** Thumbnail nền tối (để chọn màu chữ/khung phù hợp) */
  darkThumbnail?: boolean
  videos: Record<TutorialLanguage, TutorialVideo>
}

const pending = (viDuration: string): Record<TutorialLanguage, TutorialVideo> => ({
  vi: { youtube: null, duration: viDuration },
  en: { youtube: null, duration: null },
})

/** Video giới thiệu tổng quan (Trailer) ở đầu trang. */
export const trailer = {
  title: 'Trailer',
  caption: 'Khám phá tính năng của StoryToScene chỉ trong 42 giây',
  videos: {
    vi: { youtube: null, duration: '0:42' },
    en: { youtube: null, duration: null },
  } satisfies Record<TutorialLanguage, TutorialVideo>,
}

export const tutorials: Tutorial[] = [
  { number: '01', title: 'Đăng ký & đăng nhập', description: 'Google, mã email hoặc mật khẩu', thumbnail: lesson01, videos: pending('0:39') },
  { number: '02', title: 'Tạo mới dự án', description: 'Tên kịch bản, tỉ lệ khung hình, phong cách thị giác, bối cảnh', thumbnail: lesson02, videos: pending('0:44') },
  { number: '03', title: 'Nhập truyện của bạn', description: 'Dán văn bản hoặc tải file lên, các chương tự động chia tách', thumbnail: lesson03, videos: pending('0:37') },
  { number: '04', title: 'Phân tích sự kiện', description: 'AI tóm tắt các sự kiện cốt lõi của từng chương', thumbnail: lesson04, videos: pending('0:25') },
  { number: '05', title: 'Trợ lý kịch bản', description: 'Đề cương truyện, chiến lược chuyển thể, kịch bản từng tập', thumbnail: lesson05, videos: pending('0:36') },
  { number: '06', title: 'Kịch bản điện ảnh', description: 'Chỉnh sửa kịch bản từng dòng, Chế độ đọc, Lịch sử bản thảo', thumbnail: lesson06, videos: pending('0:32') },
  { number: '07', title: 'Nhân vật', description: 'Ảnh tham chiếu, các phiên bản và khóa tạo hình nhân vật', thumbnail: lesson07, videos: pending('0:35') },
  { number: '08', title: 'Bảng phân cảnh', description: 'Bảng phân cảnh storyboard, chi tiết cú máy, dòng thời gian', thumbnail: lesson08, videos: pending('0:39') },
  { number: '09', title: 'Khung hình điện ảnh', description: 'Sinh ảnh AI cho mọi cú máy trong phân cảnh', thumbnail: lesson09, darkThumbnail: true, videos: pending('0:32') },
  { number: '10', title: 'Lồng tiếng & Thoại', description: 'Gán giọng đọc AI biểu cảm cho từng nhân vật', thumbnail: lesson10, videos: pending('0:23') },
  { number: '11', title: 'Dựng video', description: 'Thêm API key, tạo chuyển động cảnh quay và bản dựng thô', thumbnail: lesson11, videos: pending('0:33') },
  { number: '12', title: 'Gói cước & thanh toán', description: 'Quét mã QR VietQR, gói cước tự động kích hoạt ngay', thumbnail: lesson12, videos: pending('0:32') },
]
