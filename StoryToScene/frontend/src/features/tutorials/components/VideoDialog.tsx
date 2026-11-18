import { Dialog } from '@base-ui/react/dialog'
import { Clock, X } from 'lucide-react'
import { LogoMark } from '@/features/home/components/shared/Logo'
import type { TutorialLanguage, TutorialVideo } from '../data/tutorials'
import { getYouTubeId, youTubeEmbedUrl } from '../lib/youtube'

/** Video đang được mở trong khung phát. */
export type OpenVideo = {
  title: string
  description?: string
  language: TutorialLanguage
  video: TutorialVideo
}

type VideoDialogProps = {
  open: OpenVideo | null
  onClose: () => void
}

/**
 * Khung phát video YouTube (nhúng iframe). Nếu bài chưa có link YouTube,
 * hiển thị trạng thái "Video sắp ra mắt" – không phát video thay thế.
 */
export function VideoDialog({ open, onClose }: VideoDialogProps) {
  const id = getYouTubeId(open?.video.youtube)
  const languageLabel = open?.language === 'en' ? 'tiếng Anh' : 'tiếng Việt'

  return (
    <Dialog.Root open={!!open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[71] w-[min(92vw,960px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-slate-950 shadow-2xl outline-none transition-[opacity,scale] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-base leading-6 font-semibold text-white">{open?.title}</Dialog.Title>
              {open?.description && (
                <Dialog.Description className="mt-0.5 truncate text-sm leading-5 text-slate-400">{open.description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Đóng video"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-jade-500/60 focus-visible:outline-none"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="relative aspect-video w-full bg-black">
            {id ? (
              <iframe
                src={youTubeEmbedUrl(id)}
                title={open?.title}
                className="absolute inset-0 size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_50%_40%,#1d2a26_0%,#0b0f0e_70%)] px-6 text-center">
                <LogoMark className="size-12 rounded-xl [&_svg]:size-6" />
                <p className="text-lg leading-7 font-semibold text-white">Video sắp ra mắt</p>
                <p className="max-w-md text-sm leading-6 text-slate-400">
                  Video {languageLabel} cho bài này đang được hoàn thiện và sẽ sớm được cập nhật trên kênh YouTube của StoryToScene.
                </p>
                {open?.video.duration && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                    <Clock className="size-3.5" aria-hidden="true" />
                    Thời lượng dự kiến {open.video.duration}
                  </span>
                )}
              </div>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
