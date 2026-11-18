import { useState } from 'react'
import { SiteHeader } from '../features/home/components/SiteHeader'
import { LanguageFilter } from '../features/tutorials/components/LanguageFilter'
import { LessonGrid } from '../features/tutorials/components/LessonGrid'
import { TrailerCard } from '../features/tutorials/components/TrailerCard'
import { TutorialsCta } from '../features/tutorials/components/TutorialsCta'
import { TutorialsHero } from '../features/tutorials/components/TutorialsHero'
import { VideoDialog, type OpenVideo } from '../features/tutorials/components/VideoDialog'
import { trailer, tutorials, type TutorialLanguage } from '../features/tutorials/data/tutorials'
import { durationToSeconds } from '../features/tutorials/lib/youtube'

/** Tổng thời lượng các bài tiếng Việt (làm tròn phút) – tự cập nhật theo dữ liệu. */
const totalMinutes = Math.max(1, Math.round(tutorials.reduce((sum, t) => sum + durationToSeconds(t.videos.vi.duration), 0) / 60))

/** Trang Hướng dẫn sử dụng – /tutorials */
function Tutorials() {
  const [language, setLanguage] = useState<TutorialLanguage>('vi')
  const [openVideo, setOpenVideo] = useState<OpenVideo | null>(null)

  return (
    <div className="min-h-svh bg-white font-sans text-slate-900">
      <SiteHeader page="tutorials" />
      <main>
        <TutorialsHero
          lessonCount={tutorials.length}
          totalMinutes={totalMinutes}
          languageFilter={<LanguageFilter value={language} onChange={setLanguage} />}
          trailer={
            <TrailerCard
              video={trailer.videos[language]}
              caption={trailer.caption}
              onPlay={() => setOpenVideo({ title: 'Trailer StoryToScene', description: trailer.caption, language, video: trailer.videos[language] })}
            />
          }
        />
        <LessonGrid
          lessons={tutorials}
          language={language}
          onOpen={(lesson) =>
            setOpenVideo({
              title: `${lesson.number} · ${lesson.title}`,
              description: lesson.description,
              language,
              video: lesson.videos[language],
            })
          }
        />
        <TutorialsCta />
      </main>
      <VideoDialog open={openVideo} onClose={() => setOpenVideo(null)} />
    </div>
  )
}

export default Tutorials
