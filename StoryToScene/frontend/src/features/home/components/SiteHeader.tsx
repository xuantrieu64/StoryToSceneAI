import { useEffect, useId, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { anchor, sectionIds, siteLinks } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { mainNav, type NavItem } from '../data/home-content'
import { LanguageToggle } from './LanguageToggle'
import { ActionLink } from './shared/ActionLink'
import { homeButton } from './shared/button-styles'
import { Logo } from './shared/Logo'
import { Container } from './shared/Container'

type SiteHeaderProps = {
  /**
   * Trang đang hiển thị header. Ở trang chủ, link section là anchor trong trang (#...);
   * ở trang khác, link trỏ về trang chủ (/#...). Mục tương ứng được đánh dấu đang chọn.
   */
  page?: 'home' | 'tutorials'
}

export function SiteHeader({ page = 'home' }: SiteHeaderProps) {
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
  const navLink = 'text-sm leading-5 font-medium whitespace-nowrap text-slate-600 transition-colors hover:text-slate-900'
  const isHome = page === 'home'

  /** Link menu: route nội bộ dùng react-router, anchor section dùng thẻ <a>. */
  const renderNavLink = (item: NavItem, className: string, onClick?: () => void) => {
    const href = item.href ?? ''
    if (href.startsWith('/')) {
      const active = item.page === page
      return (
        <Link to={href} onClick={onClick} aria-current={active ? 'page' : undefined} className={cn(className, active && 'font-semibold text-jade-700 hover:text-jade-700')}>
          {item.label}
        </Link>
      )
    }
    return (
      <a href={isHome ? href : `/${href}`} onClick={onClick} className={className}>
        {item.label}
      </a>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <Container className="flex h-[72px] items-center justify-between gap-4">
        {isHome ? (
          <a href={anchor(sectionIds.top)} aria-label="StoryToScene – về đầu trang" className="rounded-lg">
            <Logo />
          </a>
        ) : (
          <Link to="/" aria-label="StoryToScene – trang chủ" className="rounded-lg">
            <Logo />
          </Link>
        )}

        <nav aria-label="Điều hướng chính" className="hidden xl:block">
          <ul className="flex items-center gap-8">
            {mainNav.map((item) => (
              <li key={item.label}>
                {renderNavLink(
                  item,
                  // Mục đang chọn: gạch chân xanh sát mép dưới header
                  cn(navLink, item.page === page && "relative after:absolute after:inset-x-0 after:-bottom-[26px] after:h-0.5 after:rounded-full after:bg-jade-500 after:content-['']"),
                )}
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
                <li key={item.label}>{renderNavLink(item, cn(navLink, 'block rounded-lg px-2 py-3 hover:bg-slate-50'), close)}</li>
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
