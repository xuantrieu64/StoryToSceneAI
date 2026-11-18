import { anchor, sectionIds, siteLinks } from '@/config/site-links'

/*
 * Ảnh minh họa: Figma MCP đã hết lượt gọi nên chưa tải được ảnh gốc của thiết kế.
 * Tạm dùng ảnh cùng chủ đề đã có trong dự án – thay file tại đây khi có ảnh xuất từ Figma.
 */
import terminalStill from '@/assets/home/hero/trinh-tham.jpg'
import blogNovel from '@/assets/home/hero/cong-so.jpg'
import genreHaiHuoc from '@/assets/home/genres/hai-huoc.jpg'
import genreThanhXuan from '@/assets/home/genres/thanh-xuan.jpg'
import genreGiaDinh from '@/assets/home/genres/gia-dinh.jpg'
import genreSuThi from '@/assets/home/genres/su-thi.jpg'
import genreKinhDi from '@/assets/home/genres/kinh-di.jpg'
import genreHanhDong from '@/assets/home/genres/hanh-dong.jpg'
import genreTrinhTham from '@/assets/home/genres/trinh-tham.jpg'
import genreTienHiep from '@/assets/home/genres/tien-hiep.jpg'

export const images = { terminalStill }

/* ------------------------------ Điều hướng ------------------------------ */

/** `page`: trang mà mục menu này đại diện (để đánh dấu đang chọn). */
export type NavItem = { label: string; href?: string; page?: 'tutorials' }

/** Menu chính (theo thiết kế trang Hướng dẫn). Section "Quy trình sản xuất" không còn trong menu, vẫn nằm trên trang chủ. */
export const mainNav: NavItem[] = [
  { label: 'Cách hoạt động', href: anchor(sectionIds.pipeline) },
  { label: 'Thể loại', href: anchor(sectionIds.genres) },
  { label: 'Bảng giá', href: anchor(sectionIds.pricing) },
  { label: 'FAQ', href: anchor(sectionIds.faq) },
  { label: 'Hướng dẫn', href: siteLinks.tutorials, page: 'tutorials' },
]

/* ------------------------- Thanh "phân cảnh hôm nay" ------------------------- */

export const todayScenes = [
  { genre: 'Cổ trang', title: 'Vương Triều Máu', stats: '14 phân cảnh • 4k chữ' },
  { genre: 'Trinh thám', title: 'Đêm Mất Tích', stats: '9 phân cảnh • 3k chữ' },
  { genre: 'Ngôn tình', title: 'Hẹn Ước Mùa Hạ', stats: '12 phân cảnh • 5k chữ' },
]

/* ---------------------------------- Hero ---------------------------------- */

export const heroTrust = ['Không cần thẻ tín dụng', 'Miễn phí 3 chương đầu', 'Chuẩn Final Draft (.FDX)']

export const terminalDemo = {
  shot: 'SHOT 04.B - MEDIUM CLOSE-UP',
  shotNote: 'Ánh sáng neon ướt mưa • Dutch Angle',
  match: '92% Match',
  dramaRatio: 88.4,
  pace: 'Tiết tấu: Gấp rút',
  conflict: 'Xung đột: Cấp 4 (Cao trào)',
  scene: 'CẢNH 01: NỘI. VĂN PHÒNG ĐIỀU TRA - ĐÊM',
  timecode: '00:01:24',
  action:
    'Mưa quất rát mặt kính cửa sổ tầng 4. Khói thuốc lá cuộn từng vệt xanh lam quanh chiếc đèn bàn vàng ố. MINH (45 tuổi, dáng vẻ kiệt quệ) dí sát chiếc kính lúp vào tấm ảnh chụp hiện trường.',
  character: 'MINH',
  parenthetical: '(thì thầm, mắt không rời vết máu)',
  dialogue: '"Kẻ ra tay... không phải là người của thế giới này."',
  extract: 'Trích xuất: 14 Cận cảnh, 6 Góc nghiêng',
}

/* -------------------------------- Thể loại -------------------------------- */

export type Genre = { code: string; tag: string; title: string; description: string; lens: string; src: string }

export const genres: Genre[] = [
  { code: '#01', tag: 'Thôn quê hóm hỉnh', title: 'Hài hước đời sống', description: 'Tiết tấu nhanh, thoại hóm hỉnh, bắt trọn từng khoảnh khắc bình dị rộn rã tiếng cười.', lens: '18 phong cách lens', src: genreHaiHuoc },
  { code: '#02', tag: 'Học đường nhật ký', title: 'Thanh xuân hoài niệm', description: 'Trong trẻo, góc quay đón nắng dịu mát, lột tả trọn vẹn xúc cảm rung động đầu đời.', lens: 'Tone pastel dịu', src: genreThanhXuan },
  { code: '#03', tag: 'Tình cảm gia đình', title: 'Gia đình ấm áp', description: 'Tình cảm dung dị qua mâm cơm gia đình, nhịp cắt tĩnh lặng giàu chiều sâu rung cảm.', lens: 'Ánh sáng vàng ấm', src: genreGiaDinh },
  { code: '#04', tag: 'Sử thi cung đình', title: 'Sử thi hào hùng', description: 'Trang phục hoàng triều lộng lẫy, bối cảnh đại diện uy nghiêm với củ máy đại cảnh.', lens: 'Toàn cảnh Anamorphic', src: genreSuThi },
  { code: '#05', tag: 'Dân gian rùng rợn', title: 'Kinh dị tâm linh', description: 'Huyền bí dân gian, bóng tối u ám bủa vây, nhịp thở ngắt quãng và âm vang rợn người.', lens: 'Low-Key Chiaroscuro', src: genreKinhDi },
  { code: '#06', tag: 'Kiếm vũ đêm mưa', title: 'Hành động nhiệt huyết', description: 'Chuyển động dồn dập, tia lửa và chạm tóe sáng, củ máy lia góc nghiêng nghẹt thở.', lens: 'Shaky-Cam Dynamic', src: genreHanhDong },
  { code: '#07', tag: 'Neo-noir mystery', title: 'Trinh thám ly kỳ', description: 'Manh mối mập mờ, ánh đèn ven rèm chớp tắt, những cú twist bẻ lái không thể đoán trước.', lens: 'Noir Shadow & Slits', src: genreTrinhTham },
  { code: '#08', tag: 'Huyền huyễn vũ trụ', title: 'Tiên hiệp kỳ ảo', description: 'Pháp bảo huyền diệu, tiên cảnh bồng lai rực rỡ và những đại chiến rung chuyển đất trời.', lens: 'VFX Celestial Light', src: genreTienHiep },
]

/* ------------------------- Quy trình biến đổi (demo) ------------------------- */

export const pipelineDemo = {
  source: [
    '"Thành phố lúc nửa đêm chìm trong cơn giông âm ướt. Tiếng còi xe cảnh sát từ xa vọng lại qua các hẻm vắng. Nhật bước chân vội vã, chiếc áo măng tô sũng nước bám chặt lấy vai anh."',
    '"Anh dừng lại dưới bóng cột đèn cao áp duy nhất còn nhấp nháy, bàn tay run rẩy rút chiếc phong bì niêm phong đỏ từ túi trong. Anh tự nhủ không được quay đầu lại, nhưng tiếng bước chân phía sau ngày một dồn dập..."',
  ],
  sourceLength: 'Độ dài: 248 từ',
  sourceStatus: '100% đã nạp',
  analysis: [
    { label: 'Bối cảnh', value: 'NGOẠI - ĐÊM MƯA', tone: 'ink' as const },
    { label: 'Nhân vật', value: 'NHẬT (30s) + KẺ BÁM ĐUÔI', tone: 'green' as const },
    { label: 'Cường độ', value: 'CAO ĐỘ (BẬC 4)', tone: 'red' as const },
    { label: 'Đạo cụ chính', value: 'PHONG BÌ ĐỎ', tone: 'ink' as const },
  ],
  dialogueFilter: 94,
  script: {
    slugline: 'CẢNH 1. NGOẠI. CON HẺM ƯỚT SŨNG - ĐÊM',
    blocks: [
      { kind: 'shot' as const, text: '[GÓC MÁY CẬN CẢNH (CLOSE-UP) - THEO CHÂN]' },
      { kind: 'action' as const, text: 'Đôi giày da của NHẬT nện mạnh lên vũng nước đọng, bắn bọt trắng xóa. Hơi thở phả ra thành luồng khói trắng dưới làn mưa xối xả.' },
      { kind: 'shot' as const, text: '[GÓC MÁY TRUNG CẢNH - TỪ PHÍA SAU]' },
      { kind: 'action' as const, text: 'Đèn đường chập tắt liên hồi [SFX: TIẾNG TẠCH ĐIỆN]. Nhật đột ngột khựng lại. Tay run rẩy ghì chặt chiếc phong bì đỏ trước lồng ngực.' },
    ],
    character: 'NHẬT',
    parenthetical: '(thở dốc, quay phắt lại vào bóng tối)',
    dialogue: '"Ai đó?! Xuất đầu lộ diện đi!"',
  },
  exportFormats: ['.FDX', '.PDF', '.DOCX'],
}

/* --------------------------------- 3 bước --------------------------------- */

export const steps = [
  { number: '01', title: 'Dán văn bản truyện gốc', description: 'Nhập trực tiếp đường link chương truyện, dán văn bản thô hoặc tải lên tập tin docx/txt với dung lượng xử lý lên tới 50.000 từ mỗi phiên làm việc.', note: 'Hỗ trợ mọi định dạng chữ', icon: 'file' as const },
  { number: '02', title: 'AI rà soát & trích sự kiện', description: 'Thuật toán Auteur lọc bỏ những đoạn miêu tả nội tâm lan man, phân bổ lại nhịp xung đột, gán thẻ góc máy và xác định thời lượng dự kiến cho từng cảnh quay.', note: 'Gợi ý ống kính & ánh sáng', icon: 'camera' as const, active: true },
  { number: '03', title: 'Xuất kịch bản & phân cảnh', description: 'Tải về bản thảo chuẩn Hollywood hoàn thiện để gửi ngay cho đạo diễn hình ảnh (DOP), diễn viên và ban chủ nhiệm sản xuất mà không cần chỉnh sửa lại font chữ.', note: 'Sẵn sàng quay ngay trên phim trường', icon: 'download' as const },
]

/* -------------------------------- Bảng giá -------------------------------- */

export type PlanFeature = { text: string; strong?: string; included?: boolean }
export type PricingPlan = {
  id: 'free' | 'basic' | 'pro'
  audience: string
  name: string
  price: string
  unit: string
  description: string
  features: PlanFeature[]
  cta: { label: string; href?: string }
  highlighted?: boolean
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    audience: 'Gói khám phá',
    name: 'Miễn Phí',
    price: '0',
    unit: 'VND / MÃI MÃI',
    description: 'Hoàn hảo để trải nghiệm năng lực chuyển thể phân cảnh từ các mẩu truyện ngắn.',
    features: [
      { text: 'Tối đa 3 phân cảnh / ngày' },
      { text: 'Dung lượng 2.000 từ / lần nạp' },
      { text: 'Xuất văn bản thô dạng Text' },
      { text: 'Không hỗ trợ xuất file FDX chuyên dụng', included: false },
    ],
    cta: { label: 'Bắt đầu miễn phí', href: siteLinks.register },
  },
  {
    id: 'basic',
    audience: 'Nhà sáng tạo phim',
    name: 'Gói Cơ Bản',
    price: '99.000',
    unit: 'VND / THÁNG',
    description: 'Dành riêng cho biên kịch trẻ và nhóm sáng tạo nội dung ra mắt phim ngắn định kỳ.',
    features: [
      { strong: 'Không giới hạn', text: ' phân cảnh kịch bản' },
      { text: 'Mở khóa toàn bộ ', strong: '18 phong cách hình ảnh' },
      { text: 'Xuất file PDF Hollywood & Final Draft (.fdx)' },
      { text: 'Giới hạn 50.000 từ / dự án' },
      { text: 'Quyền thương mại tác phẩm trọn đời' },
    ],
    cta: { label: 'Nâng cấp gói Cơ bản →', href: siteLinks.checkoutBasic },
    highlighted: true,
  },
  {
    id: 'pro',
    audience: 'Production house',
    name: 'Chuyên Nghiệp',
    price: '199.000',
    unit: 'VND / THÁNG',
    description: 'Đầy đủ bộ công cụ sản xuất, phân tích tâm lý nhân vật và phác họa storyboard AI.',
    features: [
      { text: 'Toàn bộ tính năng của Gói Cơ Bản' },
      { text: 'Tự động phác họa Storyboard AI khung hình' },
      { text: 'Xuất bảng gợi ý góc máy và danh mục thiết bị DOP' },
      { text: 'Hỗ trợ kỹ thuật 1-1 chuyên sâu qua Zalo' },
    ],
    cta: { label: 'Đăng ký Studio', href: siteLinks.checkoutPro },
  },
]

/* ------------------------------- Đánh giá ------------------------------- */

export const testimonials = [
  {
    quote:
      '"Trước đây tiền kỳ một kịch bản phim ngắn 15 phút tốn của tôi ít nhất 3 tuần bóc tách từng chi tiết. Với StoryToScene, tôi chỉ cần dán chương truyện vào là có ngay phân cảnh với góc máy gợi ý chính xác đến kinh ngạc. Tiết kiệm cả tuần làm việc với DOP!"',
    name: 'Trần Hoàng Nam',
    role: 'Đạo diễn độc lập • Phim ngắn',
    work: 'Đêm Mất Tích',
  },
  {
    quote:
      '"Viết tiểu thuyết mạng quen lối miêu tả nội tâm dài dòng, tôi từng rất chật vật khi chuyển thể sang kịch bản thoại. Thuật toán Auteur AI giữ được trọn vẹn hồn cốt của nhân vật nhưng lọc thoại cực kỳ sắc bén, súc tích chuẩn nhịp phim."',
    name: 'Lê Mai Chi',
    role: 'Tác giả tiểu thuyết • Webtoon',
    work: 'Hẹn Ước Mùa Hạ',
  },
  {
    quote:
      '"Điều khiến cả team sản xuất bất ngờ là khả năng xuất trực tiếp file Final Draft (.fdx) chuẩn công nghiệp. Các thông số lens, ánh sáng và phân cảnh được nạp thẳng vào workflow quay mà không phải format lại dòng nào."',
    name: 'Vũ Đức Huy',
    role: 'Trưởng nhóm VFX & Sản xuất • Sài Gòn Studio',
  },
]

/* ---------------------------------- FAQ ---------------------------------- */

/**
 * Câu hỏi lấy từ Figma. Figma chỉ thể hiện câu trả lời của câu 1 (đang mở);
 * câu trả lời 2–4 được viết dựa trên thông tin đã có trên trang.
 * TODO(product): xác nhận nội dung câu trả lời 2–4 trước khi phát hành.
 */
export const faqs = [
  {
    question: 'Bản quyền của kịch bản sau khi tạo ra sẽ thuộc về ai?',
    answer:
      '100% bản quyền kịch bản, các ý tưởng phân cảnh và cấu trúc kịch tính do AI tạo ra đều thuộc sở hữu hoàn toàn của bạn. Bạn có toàn quyền sử dụng để bấm máy, bán kịch bản, tham dự liên hoan phim hoặc thương mại hóa mà không phải chia sẻ bản quyền với StoryToScene.',
  },
  {
    question: 'Kịch bản có tương thích với các phần mềm viết kịch bản chuyên dụng không?',
    answer:
      'Có. Kịch bản được xuất theo chuẩn Hollywood ở định dạng Final Draft (.fdx), PDF và DOCX, nên có thể mở tiếp trong các phần mềm viết kịch bản chuyên dụng mà không phải định dạng lại.',
  },
  {
    question: 'Tôi có cần phải tự cung cấp OpenAI API Key riêng không?',
    answer:
      'Không. Toàn bộ xử lý AI đã được tích hợp sẵn trong từng gói dịch vụ, bạn không cần đăng ký hay nhập API key riêng.',
  },
  {
    question: 'Nếu một chương truyện có quá nhiều nhân vật thì AI xử lý ra sao?',
    answer:
      'Ở bước phân tích nhịp, AI nhận diện từng nhân vật và gán họ vào đúng cảnh, lời thoại tương ứng. Bạn có thể xem và chỉnh lại danh sách nhân vật trước khi xuất kịch bản.',
  },
]

/* ---------------------------------- Blog ---------------------------------- */

export const blogPosts = [
  {
    tag: 'Kỹ thuật biên kịch • 5 phút đọc',
    date: '18 Tháng 5, 2025',
    title: "Từ tiểu thuyết 100.000 chữ đến kịch bản 15 phút: Bí quyết cô đọng chi tiết mà không mất 'hồn' truyện",
    excerpt: "Phương pháp bóc tách 'xương sống xung đột' và chuyển hóa độc thoại nội tâm miên man thành hành động hình ảnh điện ảnh sống động.",
    src: blogNovel,
  },
  {
    tag: 'Đạo diễn & Visual • 8 phút đọc',
    date: '12 Tháng 5, 2025',
    title: '18 Phong cách hình ảnh Auteur: Chọn góc máy & ánh sáng nào cho từng thể loại phim?',
    excerpt: 'Cẩm nang phân loại phong cách thị giác từ Low-Key rùng rợn đến góc quay Anamorphic sử thi, giúp đạo diễn định hình visual identity.',
    src: genreHanhDong,
  },
  {
    tag: 'Tiền kỳ & Xuất bản • 6 phút đọc',
    date: '05 Tháng 5, 2025',
    title: 'Cách định dạng kịch bản Hollywood chuẩn Final Draft cho các cuộc thi phim ngắn quốc tế',
    excerpt: 'Tìm hiểu quy chuẩn slugline, căn lề thoại, mô tả hành động và cách chuẩn bị hồ sơ kịch bản dự thi liên hoan phim chuyên nghiệp.',
    src: genreSuThi,
  },
]

/* --------------------------------- Footer --------------------------------- */

export type FooterLink = { label: string; href?: string }

export const footerColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Cách hoạt động', href: anchor(sectionIds.pipeline) },
      { label: 'Thể loại truyện', href: anchor(sectionIds.genres) },
      { label: 'Bảng giá', href: anchor(sectionIds.pricing) },
      { label: 'Bản phát hành v2.4', href: siteLinks.releaseNotes },
    ],
  },
  {
    title: 'Tài nguyên',
    links: [
      { label: 'Tài liệu hướng dẫn', href: siteLinks.docs },
      { label: 'Câu hỏi thường gặp', href: anchor(sectionIds.faq) },
      { label: 'Kho kịch bản mẫu', href: anchor(sectionIds.pipeline) },
      { label: 'Hội biên kịch AI', href: siteLinks.community },
    ],
  },
  {
    title: 'Pháp lý & Studio',
    links: [
      { label: 'Điều khoản dịch vụ', href: siteLinks.terms },
      { label: 'Chính sách bảo mật', href: siteLinks.privacy },
      { label: 'Bản quyền tác phẩm', href: siteLinks.copyright },
      { label: 'Liên hệ hợp tác', href: siteLinks.partnership },
    ],
  },
]
