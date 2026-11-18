import { cn } from '@/lib/utils'
import { tutorialLanguages, type TutorialLanguage } from '../data/tutorials'

type LanguageFilterProps = {
  value: TutorialLanguage
  onChange: (value: TutorialLanguage) => void
}

/** Chọn ngôn ngữ video hướng dẫn: Tiếng Việt / Tiếng Anh. */
export function LanguageFilter({ value, onChange }: LanguageFilterProps) {
  return (
    <div role="radiogroup" aria-label="Ngôn ngữ video" className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
      {tutorialLanguages.map((lang) => {
        const active = lang.value === value
        return (
          <button
            key={lang.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(lang.value)}
            className={cn(
              'h-8 rounded-lg px-3.5 text-sm leading-5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-jade-500/30',
              active ? 'bg-white font-semibold text-slate-900 shadow-xs' : 'font-medium text-slate-500 hover:text-slate-800',
            )}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}
