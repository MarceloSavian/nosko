import { Trans } from '@lingui/react/macro';
import { Avatar } from '@/presentation/components/Avatar';
import { Badge } from '@/presentation/components/Badge';
import { Card } from '@/presentation/components/Card';
import { CircularProgress } from '@/presentation/components/CircularProgress';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { PageHeader } from '@/presentation/components/PageHeader';
import { ProgressBar } from '@/presentation/components/ProgressBar';
import { SectionHeader } from '@/presentation/components/SectionHeader';

function PaymentsHero() {
  return (
    <Card variant="hero" padding="lg" className="mb-10">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container mb-4">
        <Trans>Total Payments This Month</Trans>
      </p>
      <div className="flex items-baseline space-x-3 mb-2">
        <span className="text-5xl font-headline font-bold">$1,630.00</span>
        <Badge variant="success" size="md" className="space-x-1">
          <Icon name="trending_down" className="text-sm" />
          <span>2.4%</span>
        </Badge>
      </div>
      <div className="flex gap-3 mt-6">
        <Card variant="glass" padding="sm" className="rounded-xl">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container mb-1">
            <Trans>Joint Share</Trans>
          </p>
          <p className="text-lg font-bold">$1,250.00</p>
        </Card>
        <Card variant="glass" padding="sm" className="rounded-xl">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container mb-1">
            <Trans>Individual</Trans>
          </p>
          <p className="text-lg font-bold">$380.00</p>
        </Card>
      </div>
    </Card>
  );
}

function JointPlanningSection() {
  return (
    <section className="flex-1">
      <SectionHeader
        title={<Trans>Joint Planning</Trans>}
        action={
          <Badge variant="success" size="sm">
            <Trans>Collaborative</Trans>
          </Badge>
        }
      />

      <Card variant="default" padding="md" className="mb-4">
        <div className="flex items-start space-x-4">
          <IconBox icon="home" size="md" tone="surface" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm text-on-surface">
                <Trans>Rent &amp; Housing</Trans>
              </p>
              <div className="text-right">
                <p className="font-bold text-on-surface">$2,400.00</p>
                <p className="text-[10px] text-outline">
                  <Trans>Total Bill</Trans>
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mb-3">
              <Trans>Monthly residence cost</Trans>
            </p>
            <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-wider text-on-surface-variant">
              <span>
                <Trans>Nosko&apos;s Portion (60%)</Trans>
              </span>
              <span className="font-bold">$1,300.00</span>
            </div>
            <ProgressBar value={60} size="md" color="primary" />
            <div className="flex items-center space-x-2 mt-3 text-xs text-on-surface-variant">
              <Icon name="group" className="text-sm" />
              <span>
                <Trans>Split equally with partner. Due in 4 days.</Trans>
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card variant="default" padding="md">
          <IconBox icon="shopping_cart" size="md" tone="secondary" className="mb-3" />
          <p className="font-bold text-on-surface">
            <Trans>Grocery</Trans>
          </p>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xl font-headline font-bold text-on-surface">$40.00</span>
            <span className="text-xs text-outline">
              <Trans>this week</Trans>
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-on-surface-variant">
              <Trans>Shared with Partner</Trans>
            </span>
            <Icon name="favorite" filled className="text-sm text-error" />
          </div>
          <div className="flex -space-x-1 mt-2">
            <Avatar size="sm" tone="primary" />
            <Avatar size="sm" tone="tertiary" />
          </div>
        </Card>
        <Card variant="default" padding="md">
          <IconBox icon="bolt" size="md" tone="secondary" className="mb-3" />
          <p className="font-bold text-on-surface">
            <Trans>Utilities</Trans>
          </p>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xl font-headline font-bold text-on-surface">$10.00</span>
            <span className="text-xs text-outline">
              <Trans>Nosko&apos;s share</Trans>
            </span>
          </div>
        </Card>
      </div>
    </section>
  );
}

function SpendingSection() {
  return (
    <section className="w-72 shrink-0 space-y-4">
      <h3 className="font-headline text-lg font-bold text-on-surface mb-4">
        <Trans>Your Spending</Trans>
      </h3>

      <Card variant="default" padding="md">
        <div className="flex items-center space-x-3">
          <IconBox icon="fitness_center" size="sm" shape="circle" tone="surface" />
          <div className="flex-1">
            <p className="font-bold text-sm text-on-surface">
              <Trans>Gym Membership</Trans>
            </p>
            <p className="text-xs text-on-surface-variant">
              <Trans>Recurring Quarterly</Trans>
            </p>
          </div>
          <p className="font-bold text-on-surface">$120.00</p>
        </div>
      </Card>

      <Card variant="default" padding="md">
        <div className="flex items-center space-x-3">
          <IconBox icon="palette" size="sm" shape="circle" tone="surface" />
          <div className="flex-1">
            <p className="font-bold text-sm text-on-surface">
              <Trans>Art Supplies</Trans>
            </p>
            <p className="text-xs text-on-surface-variant">
              <Trans>Creativity &amp; Hobby</Trans>
            </p>
          </div>
          <p className="font-bold text-on-surface">$260.00</p>
        </div>
      </Card>

      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="relative h-36 bg-gradient-to-br from-primary/80 to-primary">
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            <Badge variant="light" size="sm" className="mb-2 w-fit">
              <Trans>Insight</Trans>
            </Badge>
            <h4 className="font-headline font-bold text-white text-sm">
              <Trans>Growth Mindset</Trans>
            </h4>
            <p className="text-[10px] text-white/70 mt-1 leading-relaxed">
              <Trans>Investing in your hobbies monetizes your long-term creative equity.</Trans>
            </p>
          </div>
        </div>
      </Card>

      <Card variant="default" padding="md">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          <Trans>Efficiency Check</Trans>
        </p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface">
            <Trans>Budget Adherence</Trans>
          </p>
          <p className="text-2xl font-headline font-bold text-secondary">92%</p>
        </div>
      </Card>
    </section>
  );
}

function MilestoneCard() {
  return (
    <Card variant="hero" padding="lg" className="mt-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="star" filled className="text-secondary-fixed text-sm" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container">
              <Trans>Shared Milestone</Trans>
            </p>
          </div>
          <h3 className="font-headline text-3xl font-bold text-white mb-3">
            <Trans>Summer Nordic Getaway</Trans>
          </h3>
          <p className="text-sm text-on-primary-container leading-relaxed max-w-md">
            <Trans>
              You and your partner are 85% of the way to your goal. At this rate, you&apos;ll be
              ready by July 15th.
            </Trans>
          </p>
        </div>
        <CircularProgress value={85} size={100} strokeWidth={8}>
          <div className="text-center">
            <p className="text-xl font-headline font-bold text-secondary">85%</p>
            <p className="text-[8px] uppercase tracking-widest text-on-surface-variant">
              <Trans>Complete</Trans>
            </p>
          </div>
        </CircularProgress>
      </div>
    </Card>
  );
}

export function FinancialPlannerPage() {
  return (
    <div className="p-8">
      <PageHeader
        title={<Trans>My Financial Planner</Trans>}
        subtitle={<Trans>Curating your monthly financial narrative for June 2024.</Trans>}
        actions={
          <>
            <div className="flex -space-x-2">
              <Avatar size="sm" tone="primary" className="ring-2 ring-background" />
              <Avatar size="sm" tone="tertiary" className="ring-2 ring-background" />
            </div>
            <button type="button" className="cursor-pointer">
              <Icon
                name="share"
                className="text-xl text-on-surface-variant hover:text-secondary transition-colors"
              />
            </button>
          </>
        }
      />

      <PaymentsHero />

      <div className="flex gap-8">
        <JointPlanningSection />
        <SpendingSection />
      </div>

      <MilestoneCard />
    </div>
  );
}
