/** Lấy mã video YouTube (11 ký tự) từ link hoặc mã. Trả về null nếu không hợp lệ. */
export function getYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null
  const value = input.trim()
  if (/^[\w-]{11}$/.test(value)) return value
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\.|^m\./, '')
    if (host === 'youtu.be') return valid(url.pathname.slice(1))
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.searchParams.get('v')) return valid(url.searchParams.get('v'))
      const [, kind, id] = url.pathname.split('/')
      if (['embed', 'shorts', 'live', 'v'].includes(kind)) return valid(id)
    }
  } catch {
    /* không phải URL hợp lệ */
  }
  return null
}

const valid = (id: string | null) => (id && /^[\w-]{11}$/.test(id) ? id : null)

/** URL nhúng (chế độ bảo vệ quyền riêng tư youtube-nocookie), tự phát khi mở. */
export const youTubeEmbedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&cc_load_policy=1`

/** Ảnh bìa chất lượng cao của video. */
export const youTubeThumbnailUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

/** "m:ss" → số giây */
export function durationToSeconds(duration: string | null): number {
  if (!duration) return 0
  const [m, s] = duration.split(':').map(Number)
  return (m || 0) * 60 + (s || 0)
}
