import { genres } from '@/features/home/data/home-content'
import type { ProjectSettingKey, StoryGenreId, VisualStyleId } from '../types/project'

export type CatalogOption<Id extends string> = {
  id: Id
  name: string
  description: string
  image: string
}

/* --------------------------- Phong cách hình ảnh --------------------------- */

export const visualStyles: CatalogOption<VisualStyleId>[] = [
  {
    id: 'anime-90s',
    name: 'Hoạt hình Nhật thập niên 90',
    description: 'Hoạt hình 2D hoài niệm lấy cảm hứng từ anime Nhật Bản thập niên 1990; bối cảnh theo truyện.',
    image: '/assets/story-styles/anime-90s.png',
  },
  {
    id: 'chinese-classic',
    name: '2D cổ phong Trung Hoa',
    description: 'Hoạt hình 2D cổ phong, kết hợp mỹ học phương Đông và màu sắc hiện đại.',
    image: '/assets/story-styles/chinese-classic.png',
  },
  {
    id: 'flat-2d',
    name: '2D phẳng tối giản',
    description: 'Minh họa 2D phẳng, hình khối rõ ràng và màu sắc gọn; bối cảnh theo truyện.',
    image: '/assets/story-styles/flat-2d.png',
  },
  {
    id: 'urban-cinema',
    name: 'Đô thị điện ảnh',
    description: 'Phong cách điện ảnh hiện đại với ánh sáng đèn đô thị và tông màu cảm xúc sâu lắng.',
    image: '/assets/story-styles/urban-cinema.png',
  },
  {
    id: 'traditional-ink',
    name: 'Tranh dân gian truyền thống',
    description: 'Màu sắc kinh điển, nét vẽ mực truyền thống gợi mở không gian thi vị cổ điển.',
    image: '/assets/story-styles/traditional-ink.png',
  },
  {
    id: 'fantasy-cinema',
    name: 'Huyền ảo điện ảnh',
    description: 'Tông màu rực rỡ, trang phục tỉ mỉ và khung cảnh lộng lẫy mang chất tiên hiệp.',
    image: '/assets/story-styles/fantasy-cinema.png',
  },
]

/* ----------------------------- Thể loại truyện ----------------------------- */

/** Gán ID cố định cho 8 thể loại của trang chủ (theo mã `code`). */
const storyGenreIdByHomeCode: Record<string, StoryGenreId> = {
  '#01': 'hai-huoc',
  '#02': 'thanh-xuan',
  '#03': 'gia-dinh',
  '#04': 'su-thi',
  '#05': 'kinh-di',
  '#06': 'hanh-dong',
  '#07': 'trinh-tham',
  '#08': 'tien-hiep',
}

/** Dùng chung tên, mô tả và ảnh với mục "Thể loại" trên trang chủ. */
export const storyGenres: CatalogOption<StoryGenreId>[] = genres.flatMap((genre) => {
  const id = storyGenreIdByHomeCode[genre.code]
  return id ? [{ id, name: genre.title, description: genre.description, image: genre.src }] : []
})

/* --------------------------------- Bối cảnh -------------------------------- */

export const settingFields: { key: ProjectSettingKey; label: string; placeholder: string }[] = [
  { key: 'era', label: 'Thời đại', placeholder: 'vd. Hiện đại, 2020s · Thế kỷ 18 thờ...' },
  { key: 'location', label: 'Nơi chốn', placeholder: 'vd. TP.HCM, Việt Nam · Kinh thành...' },
  { key: 'people', label: 'Con người', placeholder: 'vd. Người Việt; da, tóc, dáng theo ...' },
  { key: 'costume', label: 'Trang phục', placeholder: 'vd. Đồ công sở, áo thun · Áo tứ thâ...' },
  { key: 'architecture', label: 'Kiến trúc, đường phố', placeholder: 'vd. Nhà ống, hẻm, xe máy, cà phê ...' },
  { key: 'signage', label: 'Chữ trên biển hiệu', placeholder: 'vd. Tiếng Việt · Không có chữ đọc ...' },
  { key: 'dailyLife', label: 'Chi tiết đời sống', placeholder: 'vd. Tiền đồng, phở, trà đá · Trầu c...' },
  { key: 'forbidden', label: 'Không được xuất hiện', placeholder: 'vd. Biển hiệu chữ Hán, đèn lồng đỏ...' },
]

export function findOptionName<Id extends string>(options: CatalogOption<Id>[], id: Id | null) {
  return id ? (options.find((option) => option.id === id)?.name ?? null) : null
}
