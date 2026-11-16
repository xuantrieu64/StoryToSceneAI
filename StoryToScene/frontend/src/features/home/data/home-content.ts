import { anchor, sectionIds, siteLinks } from '@/config/site-links'

import heroThanhXuan from '@/assets/home/hero/thanh-xuan.jpg'
import heroCoTrang from '@/assets/home/hero/co-trang.jpg'
import heroTrinhTham from '@/assets/home/hero/trinh-tham.jpg'
import heroGiaDinh from '@/assets/home/hero/gia-dinh.jpg'
import heroSuThi from '@/assets/home/hero/su-thi.jpg'
import heroCongSo from '@/assets/home/hero/cong-so.jpg'
import heroTienHiep from '@/assets/home/hero/tien-hiep.jpg'
import heroKinhDi from '@/assets/home/hero/kinh-di.jpg'
import heroKhoaHoc from '@/assets/home/hero/khoa-hoc-vien-tuong.jpg'

import genreHaiHuoc from '@/assets/home/genres/hai-huoc.jpg'
import genreThanhXuan from '@/assets/home/genres/thanh-xuan.jpg'
import genreGiaDinh from '@/assets/home/genres/gia-dinh.jpg'
import genreSuThi from '@/assets/home/genres/su-thi.jpg'
import genreKinhDi from '@/assets/home/genres/kinh-di.jpg'
import genreHanhDong from '@/assets/home/genres/hanh-dong.jpg'
import genreTrinhTham from '@/assets/home/genres/trinh-tham.jpg'
import genreTamLy from '@/assets/home/genres/tam-ly.jpg'
import genreHauTanThe from '@/assets/home/genres/hau-tan-the.jpg'
import genreNgonTinh from '@/assets/home/genres/ngon-tinh.jpg'
import genreCongSo from '@/assets/home/genres/cong-so.jpg'
import genreTienHiep from '@/assets/home/genres/tien-hiep.jpg'

/* ------------------------------------------------------------------ */
/* Điều hướng                                                          */
/* ------------------------------------------------------------------ */

export type NavItem = { label: string; href: string }

export const mainNav: NavItem[] = [
  { label: 'Cách hoạt động', href: anchor(sectionIds.howItWorks) },
  { label: 'Thể loại', href: anchor(sectionIds.genres) },
  { label: 'Bảng giá', href: anchor(sectionIds.pricing) },
  { label: 'Hỏi đáp', href: anchor(sectionIds.faq) },
  { label: 'Hướng dẫn', href: anchor(sectionIds.demo) },
]

/** CTA "Dùng thử": tới trang đăng ký nếu đã có, nếu chưa thì cuộn tới Bảng giá (Gói Miễn Phí). */
export const tryFreeLink = { href: siteLinks.register, fallbackHref: anchor(sectionIds.pricing) }

/* ------------------------------------------------------------------ */
/* Hero – mosaic poster (chiều cao tile theo Figma, đơn vị px @1280)   */
/* ------------------------------------------------------------------ */

export type PosterTile = { title: string; src: string; height: number; strongShade?: boolean }

export const heroPosterColumns: PosterTile[][] = [
  [
    { title: 'Thanh xuân', src: heroThanhXuan, height: 208 },
    { title: 'Cổ trang', src: heroCoTrang, height: 256, strongShade: true },
    { title: 'Trinh thám', src: heroTrinhTham, height: 192 },
  ],
  [
    { title: 'Gia đình', src: heroGiaDinh, height: 176 },
    { title: 'Sử thi', src: heroSuThi, height: 288, strongShade: true },
    { title: 'Công sở', src: heroCongSo, height: 224 },
  ],
  [
    { title: 'Tiên hiệp', src: heroTienHiep, height: 240 },
    { title: 'Kinh dị', src: heroKinhDi, height: 208 },
    { title: 'Khoa học viễn tưởng', src: heroKhoaHoc, height: 208 },
  ],
]

/* ------------------------------------------------------------------ */
/* Thể loại                                                            */
/* ------------------------------------------------------------------ */

export type Genre = { title: string; description: string; src: string }

export const genres: Genre[] = [
  { title: 'Hài hước', description: 'Tiết tấu nhanh, thoại hóm hỉnh', src: genreHaiHuoc },
  { title: 'Thanh xuân', description: 'Trầm lắng, góc máy rộng thi vị', src: genreThanhXuan },
  { title: 'Gia đình ấm áp', description: 'Tình cảm dung dị, đời thường', src: genreGiaDinh },
  { title: 'Sử thi hào hùng', description: 'Trang phục tinh xảo, bối cảnh lộng lẫy', src: genreSuThi },
  { title: 'Kinh dị tâm linh', description: 'Ám ảnh dân gian, nhịp thở dồn dập', src: genreKinhDi },
  { title: 'Hành động nhiệt huyết', description: 'Chuyển động dồn dập, cận chiến gắt', src: genreHanhDong },
  { title: 'Trinh thám ly kỳ', description: 'Manh mối ẩn giấu, cú twist bất ngờ', src: genreTrinhTham },
  { title: 'Tâm lý giật gân', description: 'Đấu trí nghẹt thở, nội tâm phức tạp', src: genreTamLy },
  { title: 'Hậu tận thế', description: 'Tương lai hoang tàn, thế giới mở', src: genreHauTanThe },
  { title: 'Ngôn tình ngọt ngào', description: 'Ánh nhìn tình tứ, phản ứng hóa học', src: genreNgonTinh },
  { title: 'Công sở hiện đại', description: 'Thương trường kịch tính, nhịp sống đô thị', src: genreCongSo },
  { title: 'Tiên hiệp kỳ ảo', description: 'Pháp bảo huyền ảo, thế giới thần tiên', src: genreTienHiep },
]

/* ------------------------------------------------------------------ */
/* Demo: truyện → sự kiện → kịch bản                                  */
/* ------------------------------------------------------------------ */

export const demoStory = {
  chapter: 'Chương 1',
  title: 'Lá thư dưới mưa',
  before:
    'Mưa đổ xuống phố từ lúc chập tối. Linh đứng nép dưới mái hiên tiệm sách đã đóng cửa, tay siết chặt lá thư không đề tên người gửi.',
  quote: '“Chín giờ tối nay, bến xe buýt cuối đường. Đừng đến muộn.”',
  after:
    'Đồng hồ chỉ tám giờ năm mươi. Cô hít một hơi, bước ra khỏi mái hiên, mặc cho nước mưa thấm lạnh vai áo.',
  wordCount: '68 từ văn xuôi',
}

export const demoEvents = [
  {
    title: 'Thiết lập bối cảnh',
    detail: 'Linh trú mưa trước tiệm sách cũ, tay siết lá thư bí ẩn. (Nhân vật: Linh · Bối cảnh: Đêm mưa).',
  },
  {
    title: 'Manh mối hành động',
    detail: 'Lá thư hẹn 9h tại bến xe buýt cuối đường. (Đầu mối: Kẻ gửi giấu mặt).',
  },
  {
    title: 'Điểm kích hoạt',
    detail: '8:50 - Linh quyết định dấn thân vào màn mưa. (Bước ngoặt mở đầu hành trình).',
  },
]

export const demoScreenplay = {
  /** Tiêu đề cảnh (slugline), hiển thị dạng "CẢNH 1 · NGOẠI · PHỐ VẮNG · ĐÊM" */
  sceneHeading: ['CẢNH 1', 'NGOẠI', 'PHỐ VẮNG', 'ĐÊM'],
  action:
    'Mưa nặng hạt xối xả trên mặt đường loang loáng ánh đèn vàng. LINH (24 tuổi) nép sát vào mái hiên tiệm sách đã kéo cửa sắt.',
  shotLabel: 'CẬN CẢNH:',
  insert: 'Nét chữ nhòe nước trên phong bì: “Chín giờ tối nay, bến xe buýt cuối đường.”',
  character: 'LINH',
  parenthetical: '(thì thầm run rẩy)',
  dialogue: '“Ai lại hẹn người ta giữa trời mưa thế này…”',
  closingAction: 'Cô liếc nhìn đồng hồ đeo tay: 8:50. Hít một hơi dứt khoát, Linh bước thẳng vào màn mưa xối xả.',
  estimate: 'Ước tính: 45 giây phim',
}

/* ------------------------------------------------------------------ */
/* Bảng giá                                                            */
/* ------------------------------------------------------------------ */

/** Một dòng tính năng; phần `strong` được in đậm. */
export type FeatureSegment = { text: string; strong?: boolean }
export type PlanFeature = { segments: FeatureSegment[]; included: boolean }

export type PricingPlan = {
  id: 'free' | 'basic' | 'pro'
  name: string
  tag: string
  price: string
  period: string
  highlighted?: boolean
  cta: { label: string; href?: string }
  features: PlanFeature[]
}

const f = (included: boolean, ...segments: FeatureSegment[]): PlanFeature => ({ included, segments })
const b = (text: string): FeatureSegment => ({ text, strong: true })
const t = (text: string): FeatureSegment => ({ text })

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gói Miễn Phí',
    tag: 'Dùng thử',
    price: '0 VND',
    period: 'Không thời hạn, trải nghiệm tính năng',
    cta: { label: 'Dùng thử miễn phí', href: siteLinks.register },
    features: [
      f(true, b('1 dự án'), t(' mở cùng lúc')),
      f(true, t('Truyện tối đa '), b('10.000 từ')),
      f(true, b('10 lượt AI/ngày'), t(' (150 lượt/tháng)')),
      f(true, t('5 ảnh tiêu chuẩn/ngày')),
      f(false, t('Ảnh điện ảnh cao cấp')),
      f(false, t('Lồng tiếng AI nhân vật')),
    ],
  },
  {
    id: 'basic',
    name: 'Gói Cơ Bản',
    tag: 'Cá nhân',
    price: '99.000 VND',
    period: '/ 30 ngày (Quét mã QR tiện lợi)',
    highlighted: true,
    cta: { label: 'Mua gói Cơ Bản • 99.000 VND', href: siteLinks.checkoutBasic },
    features: [
      f(true, b('3 dự án'), t(' mở đồng thời')),
      f(true, t('Truyện tối đa '), b('20.000 từ'), t('/dự án')),
      f(true, b('30 lượt AI/ngày'), t(' (Không giới hạn tháng)')),
      f(true, t('20 ảnh tiêu chuẩn/ngày')),
      f(true, t('10 ảnh điện ảnh Premium/ngày')),
      f(true, t('50.000 ký tự lồng tiếng thoại AI/tháng')),
    ],
  },
  {
    id: 'pro',
    name: 'Gói Chuyên Nghiệp',
    tag: 'Đoàn phim',
    price: '199.000 VND',
    period: '/ 30 ngày (Quét mã QR tiện lợi)',
    cta: { label: 'Mua gói Pro • 199.000 VND', href: siteLinks.checkoutPro },
    features: [
      f(true, b('10 dự án'), t(' đồng thời')),
      f(true, t('Truyện tối đa '), b('50.000 từ'), t('/dự án')),
      f(true, b('100 lượt AI/ngày'), t(' không giới hạn')),
      f(true, t('50 ảnh tiêu chuẩn/ngày')),
      f(true, t('25 ảnh điện ảnh Premium/ngày')),
      f(true, t('120.000 ký tự lồng tiếng thoại AI/tháng')),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Câu hỏi lấy nguyên văn từ Figma. Figma chỉ có trạng thái đóng nên KHÔNG có
 * nội dung câu trả lời – các câu trả lời dưới đây được viết dựa trên thông tin
 * đã có trên trang (bảng giá, CTA, quy trình).
 * TODO(product): xác nhận lại nội dung trả lời trước khi phát hành.
 */
export const faqs = [
  {
    question: 'Tôi có cần tự mua key AI không?',
    answer:
      'Không. Lượt AI đã được tính sẵn trong từng gói: 10 lượt/ngày với Gói Miễn Phí, 30 lượt/ngày với Gói Cơ Bản và 100 lượt/ngày với Gói Chuyên Nghiệp. Bạn không cần đăng ký hay nhập API key riêng.',
  },
  {
    question: 'Hết hạn gói thì dự án của tôi ra sao?',
    answer:
      'Dự án và kịch bản đã tạo vẫn được giữ trong tài khoản của bạn. Khi gói trả phí hết hạn, hạn mức sử dụng trở về mức của Gói Miễn Phí cho tới khi bạn gia hạn bằng mã QR chuyển khoản.',
  },
  {
    question: 'Truyện của tôi có ai khác xem được không?',
    answer:
      'Không. Truyện và kịch bản chỉ hiển thị với tài khoản của bạn. Bản quyền nội dung thuộc 100% về tác giả.',
  },
  {
    question: 'Ngoài kịch bản, Studio làm được gì nữa?',
    answer:
      'Trong Studio bạn có thể tiếp tục chỉnh sửa kịch bản, tạo storyboard và ảnh minh họa phân cảnh, lồng tiếng thoại AI cho nhân vật, rồi xuất file PDF hoặc Fountain.',
  },
  {
    question: 'StoryToScene có hỗ trợ viết bằng tiếng Anh không?',
    answer:
      'StoryToScene hiện được tối ưu cho truyện tiếng Việt. Phiên bản giao diện tiếng Anh (EN) đang được phát triển và sẽ được thông báo khi sẵn sàng.',
  },
]

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export type FooterLink = { label: string; href?: string }

export const footerColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Studio Kịch Bản', href: siteLinks.studio },
      { label: 'Kho Thể Loại', href: anchor(sectionIds.genres) },
      { label: 'Bảng giá thành viên', href: anchor(sectionIds.pricing) },
      { label: 'Mô hình phân cảnh AI', href: anchor(sectionIds.howItWorks) },
    ],
  },
  {
    title: 'Tài nguyên',
    links: [
      { label: 'FAQ & Hướng dẫn', href: anchor(sectionIds.faq) },
      { label: 'Kịch bản mẫu', href: anchor(sectionIds.demo) },
      { label: 'Quy chuẩn Slugline', href: anchor(sectionIds.demo) },
      { label: 'Cộng đồng tác giả', href: siteLinks.community },
    ],
  },
  {
    title: 'Pháp lý',
    links: [
      { label: 'Điều khoản dịch vụ', href: siteLinks.terms },
      { label: 'Chính sách bảo mật', href: siteLinks.privacy },
      { label: 'Bản quyền nội dung AI', href: siteLinks.aiCopyright },
      { label: 'Liên hệ & Hỗ trợ', href: siteLinks.contact },
    ],
  },
]
