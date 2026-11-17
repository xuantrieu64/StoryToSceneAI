import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Khung nội dung chuẩn của Homepage: tối đa 1280px, nội dung 1216px ở desktop. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}
