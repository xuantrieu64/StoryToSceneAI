import { useState } from 'react'
import { Crown } from 'lucide-react'
import { toast } from 'sonner'
import { Sidebar } from '@/features/Dashboard/Sidebar/Sidebar'
import { TutorialPanel } from '@/features/Dashboard/TutorialPanel/TutorialPanel'
import { BillingCycleToggle } from '@/features/subscription/components/BillingCycleToggle'
import { CurrentPlanSummary } from '@/features/subscription/components/CurrentPlanSummary'
import { FeatureComparison } from '@/features/subscription/components/FeatureComparison'
import { PlanCard } from '@/features/subscription/components/PlanCard'
import { UpgradeHeader } from '@/features/subscription/components/UpgradeHeader'
import { UsageStats } from '@/features/subscription/components/UsageStats'
import { sampleCurrentSubscription } from '@/features/subscription/data/current-subscription.sample'
import { getPlan, subscriptionPlans, type BillingCycle } from '@/features/subscription/data/plans'

/** Trang "Nâng cấp gói" (/upgrade). */
function Upgrade() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [guideOpen, setGuideOpen] = useState(false)

  // TODO(api): thay dữ liệu mẫu bằng gói & mức sử dụng thật từ backend.
  const subscription = sampleCurrentSubscription
  const currentPlan = getPlan(subscription.planId)

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] font-sans text-slate-900">
      <Sidebar activeItem={null} guideOpen={guideOpen} onOpenGuide={() => setGuideOpen(true)} />

      <main className="min-w-0 flex-1 px-8 pt-8 pb-10 max-lg:px-6 max-sm:px-4 max-sm:pt-5">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
          <UpgradeHeader
            accountInitial="T"
            onOpenHelp={() => setGuideOpen(true)}
            onOpenNotifications={() => toast.info('Chưa có thông báo mới.')}
          />

          {subscription.isSample && import.meta.env.DEV && (
            <p className="m-0 w-fit rounded-md border border-dashed border-amber-300 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
              Dev: gói hiện tại và mức sử dụng đang là dữ liệu mẫu (chưa nối backend).
            </p>
          )}

          <CurrentPlanSummary plan={currentPlan} subscription={subscription} />

          <section aria-labelledby="choose-plan-title" className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs max-sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 id="choose-plan-title" className="m-0 flex items-center gap-3 text-xl leading-7 font-bold text-slate-900">
                <Crown aria-hidden="true" className="size-6 text-jade-500" strokeWidth={2} />
                Chọn gói nâng cấp
              </h2>
              <BillingCycleToggle value={cycle} onChange={setCycle} />
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-3">
              {subscriptionPlans.map((plan) => (
                <PlanCard
                  currentPlanId={subscription.planId}
                  cycle={cycle}
                  key={plan.id}
                  onCheckoutUnavailable={(target) =>
                    toast.info(`Thanh toán trực tuyến cho gói ${target.name} sắp ra mắt.`, {
                      description: 'Chưa có giao dịch nào được tạo.',
                    })
                  }
                  plan={plan}
                />
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <FeatureComparison plans={subscriptionPlans} />
            <UsageStats plan={currentPlan} subscription={subscription} />
          </div>
        </div>
      </main>

      <TutorialPanel open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  )
}

export default Upgrade
