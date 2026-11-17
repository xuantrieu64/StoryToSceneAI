import { Globe, Mail, MessageCircle } from 'lucide-react'
import { siteLinks } from '@/config/site-links'
import { footerColumns } from '../data/home-content'
import { ActionLink } from './shared/ActionLink'
import { LogoMark } from './shared/Logo'
import { Container } from './shared/Container'

const year = new Date().getFullYear()

const socials = [
  { label: 'Website', icon: Globe, href: siteLinks.website },
  { label: 'Email', icon: Mail, href: siteLinks.email },
  { label: 'Zalo', icon: MessageCircle, href: siteLinks.zalo },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <Container className="py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="sm:col-span-3 lg:col-span-1">
            <span className="flex items-center gap-2.5">
              <LogoMark />
              <span className="text-[17px] leading-5 font-bold tracking-[-0.02em] text-slate-900">
                StoryToScene <span className="text-jade-500">AI</span>
              </span>
            </span>
            <p className="mt-4 max-w-sm text-[13px] leading-6 text-slate-500">
              Nền tảng kiến tạo kịch bản điện ảnh tiên tiến bằng trí tuệ nhân tạo. Chuyển hóa ý tưởng, tiểu thuyết và truyện
              ngắn thành bản thảo phân cảnh tiêu chuẩn Hollywood trong tích tắc.
            </p>
            <ul className="mt-5 flex items-center gap-2">
              {socials.map(({ label, icon: Icon, href }) => (
                <li key={label}>
                  <ActionLink
                    href={href}
                    aria-label={label}
                    unavailableLabel={`Trang ${label} sắp được cập nhật`}
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </ActionLink>
                </li>
              ))}
            </ul>
          </div>

          {footerColumns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-xs leading-4 font-semibold tracking-[0.06em] text-slate-900 uppercase">{col.title}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <ActionLink href={link.href} className="text-[13px] leading-5 text-slate-500 transition-colors hover:text-slate-900">
                      {link.label}
                    </ActionLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-100 pt-6 text-xs leading-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-400">© {year} StoryToScene Studio Inc. Toàn bộ bản quyền được bảo lưu.</p>
          <p className="flex items-center gap-3 font-medium tracking-[0.06em] text-slate-500 uppercase">
            Cinematic Auteur Engine
            <span aria-hidden="true" className="size-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1.5 text-jade-600">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-jade-500" />
              System online
            </span>
          </p>
        </div>
      </Container>
    </footer>
  )
}
