import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tutorial, TutorialLanguage } from '../data/tutorials'
import { getYouTubeId, youTubeThumbnailUrl } from '../lib/youtube'

type LessonCardProps = {
  lesson: Tutorial
  language: TutorialLanguage
  onOpen: () => void
}

/** Thẻ một bài hướng dẫn: thumbnail (số thứ tự + thời lượng), tiêu đề, mô tả. Bấm để mở video. */
export function LessonCard({ lesson, language, onOpen }: LessonCardProps) {
  const video = lesson.videos[language]
  const id = getYouTubeId(video.youtube)
  const thumb = lesson.thumbnail === 'youtube' ? (id ? youTubeThumbnailUrl(id) : null) : lesson.thumbnail

  return (
    <article className="group">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Xem bài ${lesson.number}: ${lesson.title}${video.duration ? `, ${video.duration}` : ''}${id ? '' : ' (video sắp ra mắt)'}`}
        className="relative block aspect-[696/432] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xs transition-shadow outline-none group-hover:shadow-lg focus-visible:ring-4 focus-visible:ring-jade-500/30"
      >
        {thumb && <img src={thumb} alt="" width={696} height={432} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-2.5 left-2.5 rounded-md px-2 py-0.5 text-xs leading-5 font-bold tabular-nums shadow-xs',
            lesson.darkThumbnail ? 'bg-white/90 text-slate-900' : 'border border-slate-200 bg-white text-slate-900',
          )}
        >
          {lesson.number}
        </span>
        {/* Nút play hiện khi rê chuột / focus */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/20 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-jade-500 text-white shadow-lg">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
        </span>
        <span
          aria-hidden="true"
          className="absolute right-2.5 bottom-2.5 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-xs leading-5 font-medium text-white tabular-nums"
        >
          {video.duration ?? (id ? 'Video' : 'Sắp ra mắt')}
        </span>
      </button>
      <h3 className="mt-3.5 text-base leading-6 font-semibold text-slate-900">
        {lesson.number} · {lesson.title}
      </h3>
      <p className="mt-0.5 text-sm leading-5 text-slate-500">{lesson.description}</p>
    </article>
  )
}
