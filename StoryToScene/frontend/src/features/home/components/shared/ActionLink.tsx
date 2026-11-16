import type { ComponentProps } from 'react'
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

/**
 * Link có hành vi trung thực:
 * - Có đích → render `<a>` (link ngoài tự mở tab mới).
 * - Chưa có đích → render phần tử `aria-disabled`, kèm nhãn "Sắp ra mắt",
 *   không điều hướng tới trang không tồn tại.
 */
export function ActionLink({
  href,
  fallbackHref,
  unavailableLabel = 'Tính năng sắp ra mắt',
  className,
  children,
  onClick,
  ...props
}: ActionLinkProps) {
  const target = href ?? fallbackHref

  if (!target) {
    return (
      <span
        role="link"
        aria-disabled="true"
        title={unavailableLabel}
        className={cn(className, 'cursor-not-allowed opacity-60')}
      >
        {children}
        <span className="sr-only"> ({unavailableLabel})</span>
      </span>
    )
  }

  return (
    <a
      href={target}
      className={className}
      onClick={onClick}
      {...(isExternal(target) && { target: '_blank', rel: 'noopener noreferrer' })}
      {...props}
    >
      {children}
    </a>
  )
}
