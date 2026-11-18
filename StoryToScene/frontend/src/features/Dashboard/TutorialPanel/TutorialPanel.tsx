import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Play, Share, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteLinks } from '@/config/site-links'
import { trailer, tutorials, type Tutorial, type TutorialLanguage } from '@/features/tutorials/data/tutorials'
import { VideoDialog, type OpenVideo } from '@/features/tutorials/components/VideoDialog'
import { getYouTubeId, youTubeThumbnailUrl } from '@/features/tutorials/lib/youtube'
import { BrandIcon } from '../Sidebar/Sidebar'

type TutorialPanelProps = {
  open: boolean
  onClose: () => void
}

/** Dashboard chưa có chọn ngôn ngữ video → dùng bản tiếng Việt. */
const language: TutorialLanguage = 'vi'

/**
 * Bảng "Hướng dẫn" trượt từ bên phải trên Dashboard.
 * Dữ liệu video dùng chung với trang /tutorials. Bài chưa có link YouTube
 * sẽ mở khung "Video sắp ra mắt" của VideoDialog (không dùng link giả).
 */
export function TutorialPanel({ open, onClose }: TutorialPanelProps) {
  const [openVideo, setOpenVideo] = useState<OpenVideo | null>(null)
  const trailerVideo = trailer.videos[language]
  const trailerId = getYouTubeId(trailerVideo.youtube)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setOpenVideo(null)
          onClose()
        }
      }}
    >
      <Dialog.Portal>
        {/* Nền trong suốt: giữ nguyên giao diện Dashboard, bấm ra ngoài để đóng */}
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-transparent" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-[412px] max-w-full flex-col border-l border-[#e5e7eb] bg-white font-sans shadow-[-24px_0_48px_-24px_rgba(15,23,42,0.25)] outline-none transition-transform duration-300 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full max-[520px]:w-full max-[520px]:border-l-0">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#f3f4f6] px-5 py-[18px]">
            <Dialog.Title className="m-0 text-xl font-bold leading-7 tracking-[-0.4px] text-[#111827]">
              Hướng dẫn
            </Dialog.Title>
            <Dialog.Close
              aria-label="Đóng hướng dẫn"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] hover:bg-gray-50 hover:text-[#4b5563] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5">
            <SectionLabel>Cho màn này</SectionLabel>
            <button
              aria-label={`Xem trailer giới thiệu StoryToScene${trailerVideo.duration ? ` (${trailerVideo.duration})` : ''}`}
              className="group relative mt-3 block aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#202124_0%,#16171a_55%,#241f26_100%)] text-left outline-none ring-1 ring-black/5 focus-visible:ring-4 focus-visible:ring-[#39b536]/40"
              onClick={() =>
                setOpenVideo({
                  title: 'Trailer StoryToScene',
                  description: trailer.caption,
                  language,
                  video: trailerVideo,
                })
              }
              type="button"
            >
              {trailerId && (
                <img alt="" className="absolute inset-0 size-full object-cover opacity-60" src={youTubeThumbnailUrl(trailerId)} />
              )}
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <BrandIcon />
                </span>
                <span className="text-[26px] font-bold tracking-[-0.5px] text-white">StoryToScene</span>
              </span>
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#39b536] text-white shadow-[0_10px_24px_-8px_rgba(57,181,54,0.8)] transition-transform group-hover:scale-105"
              >
                <Play className="ml-0.5 size-5 fill-current" />
              </span>
              {trailerVideo.duration && (
                <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
                  {trailerVideo.duration}
                </span>
              )}
            </button>
            <p className="mb-0 mt-3 text-[15px] font-bold leading-[22px] text-[#111827]">
              {trailer.title} · Giới thiệu StoryToScene
            </p>
            <p className="mb-0 mt-0.5 text-[13px] leading-5 text-[#6b7280]">{trailer.caption}</p>

            <SectionLabel className="mt-7">Các bài khác</SectionLabel>
            <ul className="m-0 mt-2 grid list-none gap-1 p-0">
              {tutorials.map((lesson) => (
                <li key={lesson.number}>
                  <LessonRow
                    lesson={lesson}
                    onOpen={() =>
                      setOpenVideo({
                        title: `${lesson.number} · ${lesson.title}`,
                        description: lesson.description,
                        language,
                        video: lesson.videos[language],
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          </div>

          <footer className="shrink-0 border-t border-[#f3f4f6] bg-white px-5 py-4">
            <Link
              className="inline-flex items-center gap-2 rounded-md text-sm font-bold text-[#39b536] hover:text-[#2f9a2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
              onClick={onClose}
              to={siteLinks.tutorials ?? '/tutorials'}
            >
              <Share aria-hidden="true" className="size-4" />
              Mở trang Hướng dẫn
            </Link>
          </footer>

          {/* Đặt trong Popup để là dialog lồng: Escape chỉ đóng video trước */}
          <VideoDialog open={openVideo} onClose={() => setOpenVideo(null)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SectionLabel({ children, className = '' }: { children: string; className?: string }) {
  return (
    <h3 className={`m-0 text-xs font-semibold uppercase leading-4 tracking-[0.6px] text-[#4b5563] ${className}`}>
      {children}
    </h3>
  )
}

function LessonRow({ lesson, onOpen }: { lesson: Tutorial; onOpen: () => void }) {
  const video = lesson.videos[language]
  const id = getYouTubeId(video.youtube)
  const thumbnail = lesson.thumbnail === 'youtube' ? (id ? youTubeThumbnailUrl(id) : null) : lesson.thumbnail

  return (
    <button
      aria-label={`Xem bài ${lesson.number}: ${lesson.title}${video.duration ? `, ${video.duration}` : ''}${id ? '' : ' (video sắp ra mắt)'}`}
      className="group flex w-full items-center gap-3.5 rounded-xl p-1.5 text-left hover:bg-[#f3faf2] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#39b536]"
      onClick={onOpen}
      type="button"
    >
      <span className="relative block h-[54px] w-[90px] shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
        {thumbnail && (
          <img alt="" className="absolute inset-0 size-full object-cover" decoding="async" loading="lazy" src={thumbnail} />
        )}
        <span className="absolute bottom-1 right-1 rounded bg-[#111827]/85 px-1 text-[10px] font-medium leading-4 tabular-nums text-white">
          {video.duration ?? (id ? 'Video' : 'Sắp ra mắt')}
        </span>
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-sm leading-5 text-[#111827]">
          {lesson.number} · <strong className="font-bold">{lesson.title}</strong>
        </span>
        <span className="truncate text-xs leading-[18px] text-[#6b7280]">{lesson.description}</span>
      </span>
    </button>
  )
}
