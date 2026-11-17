import { useEffect, useId, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { anchor, sectionIds, siteLinks } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { mainNav } from '../data/home-content'
import { LanguageToggle } from './LanguageToggle'
import { ActionLink } from './shared/ActionLink'
import { homeButton } from './shared/button-styles'
import { Logo } from './shared/Logo'
import { Container } from './shared/Container'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  // Đóng menu thu gọn bằng Esc hoặc khi màn hình đủ rộng (≥1280px) để hiện menu đầy đủ.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const mq = window.matchMedia('(min-width: 1280px)')
    const onChange = () => mq.matches && setOpen(false)
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onChange)
    }
  }, [open])

  const close = () => setOpen(false)
  const navLink = 'text-sm leading-5 font-medium text-slate-600 transition-colors hover:text-slate-900'

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <Container className="flex h-[72px] items-center justify-between gap-4">
        <a href={anchor(sectionIds.top)} aria-label="StoryToScene – về đầu trang" className="rounded-lg">
          <Logo />
        </a>

        <nav aria-label="Điều hướng chính" className="hidden xl:block">
          <ul className="flex items-center gap-8">
            {mainNav.map((item) => (
              <li key={item.label}>
                <a href={item.href} className={navLink}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <LanguageToggle className="hidden sm:flex" />
          <span aria-hidden="true" className="hidden h-5 w-px bg-slate-200 sm:block" />
          <ActionLink
            href={siteLinks.login}
            unavailableLabel="Đăng nhập sắp ra mắt"
            className="hidden text-sm leading-5 font-semibold text-slate-700 sm:inline"
          >
            Đăng nhập
          </ActionLink>
          {/* < 640px: nút này chuyển vào menu ☰ để header không bị tràn */}
          <ActionLink href={siteLinks.register} className={cn(homeButton({ size: 'sm' }), 'hidden sm:inline-flex')}>
            Dùng thử miễn phí
            <ArrowRight aria-hidden="true" />
          </ActionLink>
          <button
            type="button"
            className="-mr-1 inline-flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 xl:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </Container>

      {/* Menu thu gọn (mobile / tablet) */}
      <div id={panelId} hidden={!open} className="border-t border-slate-100 bg-white xl:hidden">
        <Container className="pb-4">
          <nav aria-label="Điều hướng (thu gọn)">
            <ul className="flex flex-col py-2">
              {mainNav.map((item) => (
                <li key={item.label}>
                  <a href={item.href} onClick={close} className={cn(navLink, 'block rounded-lg px-2 py-3 hover:bg-slate-50')}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-2 pt-4 sm:hidden">
            <LanguageToggle />
            <ActionLink
              href={siteLinks.login}
              unavailableLabel="Đăng nhập sắp ra mắt"
              className="text-sm leading-5 font-semibold text-slate-700"
            >
              Đăng nhập
            </ActionLink>
          </div>
          <ActionLink
            href={siteLinks.register}
            onClick={close}
            className={cn(homeButton({ size: 'block' }), 'mt-4 sm:hidden')}
          >
            Dùng thử miễn phí
            <ArrowRight aria-hidden="true" />
          </ActionLink>
        </Container>
      </div>
    </header>
  )
}
