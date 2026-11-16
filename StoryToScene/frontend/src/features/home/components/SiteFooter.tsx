import { Clapperboard } from 'lucide-react'
import { footerColumns } from '../data/home-content'
import { ActionLink } from './shared/ActionLink'
import { Logo } from './shared/Logo'

const year = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface px-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 py-12 lg:gap-16 lg:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex flex-col gap-3 sm:col-span-3 lg:col-span-2">
            <Logo variant="footer" />
            <p className="max-w-96 text-[15px] leading-6 text-ink-muted">
              Biến truyện thành kịch bản phim ngắn. Giải pháp AI biên kịch chuyên nghiệp, hỗ trợ phân rã cảnh,
              thoại, và chỉ dẫn máy quay chuẩn điện ảnh.
            </p>
            <p className="flex items-center gap-2 pt-2 text-[13px] leading-[18px] font-semibold tracking-[0.05em] text-clay uppercase">
              <Clapperboard aria-hidden="true" className="size-4" />
              Cinematic Screenplay Engine
            </p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
              <h2 className="text-sm leading-5 font-semibold tracking-[0.05em] text-ink uppercase">
                {column.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label} className="py-0.5">
                    <ActionLink
                      href={link.href}
                      className="text-[13px] leading-5 text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </ActionLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-5 text-ink-muted">© {year} StoryToScene. Tất cả quyền được bảo lưu.</p>
          <p className="text-[13px] leading-[18px] font-semibold tracking-[0.05em] text-clay">
            DÀNH CHO BIÊN KỊCH VÀ NHÀ LÀM PHIM ĐỘC LẬP
          </p>
        </div>
      </div>
    </footer>
  )
}
