import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type ActionLinkProps = Omit<ComponentProps<'a'>, 'href'> & {
  /** Đích chính (thường lấy từ `siteLinks`). */
  href?: string
  /** Đích dự phòng khi `href` chưa được cấu hình (vd. anchor trong trang). */
  fallbackHref?: string
  /** Nội dung tooltip / screen reader khi chưa có đích đến. */
  unavailableLabel?: string
}

const isExternal = (url: string) => /^https?:\/\//i.test(url)
const isRoute = (url: string) => url.startsWith('/')

/**
 * Link có hành vi trung thực:
 * - Route nội bộ ("/dashboard") → `<Link>` của react-router.
 * - Anchor / URL ngoài → `<a>` (link ngoài mở tab mới).
 * - Chưa có đích → phần tử `aria-disabled` kèm nhãn "Sắp ra mắt".
 */
export function ActionLink({
  href,
  fallbackHref,
  unavailableLabel = 'Tính năng sắp ra mắt',
  className,
  children,
  ...props
}: ActionLinkProps) {
  const target = href ?? fallbackHref

  if (!target) {
    return (
      <span role="link" aria-disabled="true" title={unavailableLabel} className={cn(className, 'cursor-not-allowed opacity-60')}>
        {children}
        <span className="sr-only"> ({unavailableLabel})</span>
      </span>
    )
  }

  if (isRoute(target)) {
    return (
      <Link to={target} className={className} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <a
      href={target}
      className={className}
      {...(isExternal(target) && { target: '_blank', rel: 'noopener noreferrer' })}
      {...props}
    >
      {children}
    </a>
  )
}
