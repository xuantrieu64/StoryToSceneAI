import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const homeButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm leading-5 font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-jade-500/40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-jade-500 text-white shadow-[0_8px_20px_-6px_rgb(0_176_116/0.55)] hover:bg-jade-600',
        outline: 'border border-slate-200 bg-white text-slate-900 shadow-xs hover:border-slate-300 hover:bg-slate-50',
        soft: 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
      },
      size: {
        sm: 'h-10 px-4',
        md: 'h-11 px-5',
        lg: 'h-12 px-6',
        block: 'h-11 w-full px-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

/**
 * Kiểu nút dùng chung của Homepage. Class truyền qua `className` được gộp bằng
 * `cn` (tailwind-merge) nên luôn ghi đè đúng class mặc định (vd. `hidden`, `px-*`).
 */
export const homeButton = (props?: Parameters<typeof homeButtonVariants>[0]) => cn(homeButtonVariants(props))

export type HomeButtonProps = VariantProps<typeof homeButtonVariants>
