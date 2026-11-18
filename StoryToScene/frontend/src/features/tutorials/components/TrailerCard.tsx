import { Play } from 'lucide-react'
import { LogoMark } from '@/features/home/components/shared/Logo'
import type { TutorialVideo } from '../data/tutorials'
import { getYouTubeId, youTubeThumbnailUrl } from '../lib/youtube'

type TrailerCardProps = {
  video: TutorialVideo
  caption: string
  onPlay: () => void
}

/** Khung trailer tổng quan: nền tối, logo ở giữa, nút "Xem trailer" và thời lượng. */
export function TrailerCard({ video, caption, onPlay }: TrailerCardProps) {
  const id = getYouTubeId(video.youtube)

  return (
    <figure>
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Xem trailer${video.duration ? ` (${video.duration})` : ''}`}
        className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#202124_0%,#16171a_55%,#241f26_100%)] text-left shadow-[0_30px_60px_-28px_rgb(15_23_42/0.6)] ring-1 ring-black/5 outline-none focus-visible:ring-4 focus-visible:ring-jade-500/40"
      >
        {/* Khi có link YouTube: dùng ảnh bìa của video làm nền */}
        {id && <img src={youTubeThumbnailUrl(id)} alt="" className="absolute inset-0 size-full object-cover opacity-60" />}
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center gap-3">
          <LogoMark className="size-11 rounded-xl [&_svg]:size-6" />
          <span className="text-2xl font-bold tracking-[-0.02em] text-white sm:text-[28px]">StoryToScene</span>
        </span>
        <span className="absolute bottom-5 left-5 inline-flex h-10 items-center gap-2 rounded-full bg-jade-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgb(0_176_116/0.8)] transition-colors group-hover:bg-jade-600 sm:bottom-6 sm:left-6">
          <Play aria-hidden="true" className="size-3.5 fill-current" />
          Xem trailer
        </span>
        {video.duration && (
          <span className="absolute right-5 bottom-5 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-slate-200 tabular-nums sm:right-6 sm:bottom-6">
            {video.duration}
          </span>
        )}
      </button>
      <figcaption className="mt-3 text-sm leading-5 text-slate-500">
        <span className="font-semibold text-slate-700">Trailer</span>
        {video.duration && ` · ${video.duration}`} {caption}
      </figcaption>
    </figure>
  )
}
