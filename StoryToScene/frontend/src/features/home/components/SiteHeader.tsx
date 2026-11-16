import { useEffect, useId, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { anchor, sectionIds, siteLinks } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { mainNav, tryFreeLink } from '../data/home-content'
import { LanguageToggle } from './LanguageToggle'
import { ActionLink } from './shared/ActionLink'
import { Logo } from './shared/Logo'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  // Đóng menu thu gọn bằng phím Esc hoặc khi màn hình đủ rộng (≥1280px) để hiện menu đầy đủ.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const mq = window.matchMedia('(min-width: 1280px)')
    const onResize = () => mq.matches && setOpen(false)
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onResize)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[rgb(231_229_228/0.6)] bg-page/90 px-4 backdrop-blur-md sm:px-6 lg:px-16">
      <div className="mx-auto flex h-16 max-w-[1152px] items-center justify-between gap-4 lg:px-6">
        <div className="flex items-center gap-8">
          <a href={anchor(sectionIds.hero)} aria-label="StoryToScene – về đầu trang" className="rounded-sm">
            <Logo />
          </a>
          <nav aria-label="Điều hướng chính" className="hidden xl:block">
            <ul className="flex items-center gap-6">
              {mainNav.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-[14.5px] leading-[21.75px] font-medium whitespace-nowrap text-nav transition-colors hover:text-ink"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle className="hidden sm:flex" />
          <ActionLink
            href={siteLinks.login}
            unavailableLabel="Đăng nhập sắp ra mắt"
            className={cn(buttonVariants({ variant: 'ghost', size: 'nav' }), 'hidden font-semibold tracking-[0.01em] text-ink sm:inline-flex')}
          >
            Đăng nhập
          </ActionLink>
          <ActionLink
            {...tryFreeLink}
            className={cn(buttonVariants({ variant: 'brand', size: 'nav' }), 'shadow-cta-sm max-[380px]:px-3')}
          >
            Dùng thử miễn phí
          </ActionLink>
          <button
            type="button"
            className="-mr-1 inline-flex size-9 items-center justify-center rounded-lg text-ink hover:bg-surface xl:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menu mobile / tablet */}
      <div id={panelId} hidden={!open} className="border-t border-line pb-4 xl:hidden">
        <nav aria-label="Điều hướng (di động)">
          <ul className="flex flex-col py-2">
            {mainNav.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={close}
                  className="block rounded-lg px-2 py-3 text-[15px] font-medium text-nav hover:bg-surface hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-between gap-3 border-t border-line px-2 pt-4 sm:hidden">
          <LanguageToggle />
          <ActionLink
            href={siteLinks.login}
            unavailableLabel="Đăng nhập sắp ra mắt"
            className={cn(buttonVariants({ variant: 'muted', size: 'nav' }))}
          >
            Đăng nhập
          </ActionLink>
        </div>
      </div>
    </header>
  )
}
