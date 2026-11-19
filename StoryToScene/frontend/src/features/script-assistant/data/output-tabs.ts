/** Các tab kết quả ở cột phải của Trợ lý kịch bản. */
export type OutputTabId = 'outline' | 'strategy' | 'script'

export const outputTabs: { id: OutputTabId; label: string }[] = [
  { id: 'outline', label: 'Khung truyện' },
  { id: 'strategy', label: 'Chiến lược chuyển thể' },
  { id: 'script', label: 'Kịch bản' },
]

/** Bộ nhớ tóm tắt mẫu (chưa có AI) – để thử thao tác "Xóa bộ nhớ tóm tắt". */
export const SAMPLE_SUMMARY = 'Tóm tắt mẫu: nhân vật chính, bối cảnh và các sự kiện chính của các chương đã nhập.'

export const ASSISTANT_GREETING =
  'Xin chào! Tôi là trợ lý thông minh StoryToScene, bạn có muốn tôi bắt đầu tạo kịch bản cho bạn không?'
