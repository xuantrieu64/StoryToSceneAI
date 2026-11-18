import { Bell, CircleHelp, Crown } from 'lucide-react'

type UpgradeHeaderProps = {
  accountInitial: string
  onOpenHelp: () => void
  onOpenNotifications: () => void
}

export function UpgradeHeader({ accountInitial, onOpenHelp, onOpenNotifications }: UpgradeHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        <span className="mt-0.5 grid size-12 shrink-0 place-items-center rounded-full bg-jade-50 text-jade-500 max-sm:size-10">
          <Crown aria-hidden="true" className="size-6 fill-current max-sm:size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h1 className="m-0 text-[28px] leading-9 font-bold tracking-[-0.02em] text-slate-900 max-sm:text-2xl max-sm:leading-8">
            Nâng cấp gói
          </h1>
          <p className="mt-1 mb-0 text-sm leading-5 text-slate-500">
            Chọn gói phù hợp để tạo video chuyên nghiệp hơn với sức mạnh AI.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 max-sm:gap-1">
        <button
          aria-label="Thông báo"
          className="relative grid size-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:ring-3 focus-visible:ring-jade-500/40 focus-visible:outline-none"
          onClick={onOpenNotifications}
          type="button"
        >
          <Bell aria-hidden="true" className="size-5" />
          <span aria-hidden="true" className="absolute top-2 right-2.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button
          aria-label="Hướng dẫn"
          className="grid size-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:ring-3 focus-visible:ring-jade-500/40 focus-visible:outline-none"
          onClick={onOpenHelp}
          type="button"
        >
          <CircleHelp aria-hidden="true" className="size-5" />
        </button>
        <span
          aria-label="Tài khoản"
          className="ml-1 grid size-10 place-items-center rounded-full bg-orange-100 text-base font-bold text-orange-500"
          role="img"
        >
          {accountInitial}
        </span>
      </div>
    </header>
  )
}
