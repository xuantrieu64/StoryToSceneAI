import { Container } from '@/features/home/components/shared/Container'
import type { Tutorial, TutorialLanguage } from '../data/tutorials'
import { LessonCard } from './LessonCard'

type LessonGridProps = {
  lessons: Tutorial[]
  language: TutorialLanguage
  onOpen: (lesson: Tutorial) => void
}

/** "Từng bước thực hiện": lưới các bài hướng dẫn. */
export function LessonGrid({ lessons, language, onOpen }: LessonGridProps) {
  return (
    <section aria-labelledby="lessons-title" className="pb-16 lg:pb-20">
      <Container>
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <h2 id="lessons-title" className="text-xl leading-7 font-bold tracking-[-0.01em] text-slate-900 sm:text-2xl">
            Từng bước thực hiện
          </h2>
          <p className="text-sm leading-5 text-slate-500">Chọn bài học để xem</p>
        </div>
        <ol className="mt-8 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <li key={lesson.number}>
              <LessonCard lesson={lesson} language={language} onOpen={() => onOpen(lesson)} />
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
