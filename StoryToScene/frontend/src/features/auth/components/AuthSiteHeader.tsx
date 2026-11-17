import { useEffect, useId, useState } from 'react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { ChevronDown, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoMark } from '@/features/home/components/shared/Logo'
import { cn } from '@/lib/utils'
import { authRoutes, authNav } from '../auth-config'
import { LanguageSwitch } from './LanguageSwitch'

const navLink = 'text-[15px] leading-6 font-medium text-slate-700 transition-colors hover:text-jade-700'

/** Dropdown "Tính năng": các section tính năng trên trang chủ. */
function FeaturesMenu() {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger className={cn(navLink, 'group inline-flex cursor-pointer items-center gap-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-jade-500/30')}>
        Tính năng
        <ChevronDown aria-hidden="true" className="size-4 transition-transform group-data-[popup-open]:rotate-180" />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner sideOffset={10} className="z-[60]">
          <MenuPrimitive.Popup className="min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg outline-none">
            {authNav.features.map((item) => (
              <MenuPrimitive.LinkItem
                key={item.label}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-jade-50 data-[highlighted]:text-jade-700"
              >
                {item.label}
              </MenuPrimitive.LinkItem>
            ))}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

/** Nút CTA bên phải header: trang Login mời đăng ký, trang Register mời đăng nhập. */
const ctas = {
  register: { to: authRoutes.register, label: 'Bắt đầu miễn phí', tone: 'bg-jade-700 hover:bg-jade-800 shadow-[0_10px_24px_-10px_rgb(3_108_69/0.7)]' },
  login: { to: authRoutes.login, label: 'Đăng nhập', tone: 'bg-jade-500 hover:bg-jade-600 shadow-[0_10px_24px_-10px_rgb(0_176_116/0.7)]' },
}

type AuthSiteHeaderProps = {
  /** Đích của nút CTA bên phải: `register` (dùng ở trang Login) hoặc `login` (dùng ở trang Register). */
  cta: keyof typeof ctas
}

/** Header chung của trang Đăng nhập và Đăng ký. */
export function AuthSiteHeader({ cta }: AuthSiteHeaderProps) {
  const action = ctas[cta]
  const [open, setOpen] = useState(false)
  const panelId = useId()

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

  return (
    <header className="relative z-20 border-b border-white/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10 xl:gap-14">
          <Link to={authRoutes.home} aria-label="StoryToScene – trang chủ" className="flex items-center gap-2.5 rounded-lg">
            <LogoMark className="size-9 rounded-xl" />
            <span className="text-xl leading-7 font-bold tracking-[-0.02em] text-slate-800">StoryToScene</span>
          </Link>
          <nav aria-label="Điều hướng chính" className="hidden xl:block">
            <ul className="flex items-center gap-8">
              <li>
                <Link to={authRoutes.home} className={navLink}>
                  Trang chủ
                </Link>
              </li>
              <li>
                <FeaturesMenu />
              </li>
              {authNav.links.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className={navLink}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSwitch className="hidden border-slate-200 bg-white px-4 py-2 text-sm shadow-xs sm:flex" />
          <Link
            to={action.to}
            className={cn(
              'hidden h-11 items-center rounded-xl px-5 text-sm leading-5 font-semibold whitespace-nowrap text-white transition-colors focus-visible:ring-3 focus-visible:ring-jade-500/40 focus-visible:outline-none sm:inline-flex',
              action.tone,
            )}
          >
            {action.label}
          </Link>
          <button
            type="button"
            className="-mr-1 inline-flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-white xl:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </div>

      {/* Menu thu gọn (mobile / tablet) */}
      <div id={panelId} hidden={!open} className="border-t border-slate-100 bg-white xl:hidden">
        <nav aria-label="Điều hướng (thu gọn)" className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <ul className="flex flex-col">
            <li>
              <Link to={authRoutes.home} onClick={() => setOpen(false)} className={cn(navLink, 'block rounded-lg px-2 py-2.5 hover:bg-slate-50')}>
                Trang chủ
              </Link>
            </li>
            <li className="px-2 pt-2.5 pb-1 text-xs font-semibold tracking-[0.06em] text-slate-400 uppercase">Tính năng</li>
            {authNav.features.map((item) => (
              <li key={item.label}>
                <a href={item.href} onClick={() => setOpen(false)} className={cn(navLink, 'block rounded-lg py-2.5 pr-2 pl-5 hover:bg-slate-50')}>
                  {item.label}
                </a>
              </li>
            ))}
            {authNav.links.map((item) => (
              <li key={item.label}>
                <a href={item.href} onClick={() => setOpen(false)} className={cn(navLink, 'block rounded-lg px-2 py-2.5 hover:bg-slate-50')}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 px-2 pt-4">
            <LanguageSwitch className="border-slate-200 bg-white" />
            <Link
              to={action.to}
              onClick={() => setOpen(false)}
              className={cn('inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white sm:hidden', action.tone)}
            >
              {action.label}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
