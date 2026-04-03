import { Trans, useLingui } from '@lingui/react/macro';
import { FeatureCard } from '@/presentation/components/FeatureCard';
import { Icon } from '@/presentation/components/Icon';
import { LinkButton } from '@/presentation/components/LinkButton';
import { Logo } from '@/presentation/components/Logo';

function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl shadow-sm h-16">
      <div className="flex justify-between items-center px-8 h-full max-w-7xl mx-auto">
        <div className="flex items-center space-x-12">
          <Logo />
          <div className="hidden md:flex space-x-8 items-center font-headline tracking-tight font-medium text-sm">
            <a
              className="text-on-surface-variant hover:text-primary transition-colors"
              href="#benefits"
            >
              <Trans>Benefits</Trans>
            </a>
            <a
              className="text-on-surface-variant hover:text-primary transition-colors"
              href="#features"
            >
              <Trans>The Ledger</Trans>
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <LinkButton to="/signup" variant="primary" size="sm">
            <Trans>Sign Up</Trans>
          </LinkButton>
          <LinkButton to="/login" variant="link" size="sm">
            <Trans>Log In</Trans>
          </LinkButton>
        </div>
      </div>
      <div className="bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent h-px" />
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-primary to-primary-container">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-secondary/20 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed shadow-[0_0_8px_rgba(172,244,164,0.6)]" />
            <span className="text-xs font-bold text-primary-fixed uppercase tracking-widest">
              <Trans>Now Private Beta</Trans>
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-white font-headline leading-[1.1] tracking-tighter mb-6">
            <Trans>Finance for</Trans> <br />
            <span className="text-secondary-fixed">
              <Trans>Two.</Trans>
            </span>
          </h1>
          <p className="text-xl text-primary-fixed-dim font-body mb-10 leading-relaxed max-w-lg">
            <Trans>
              The Unity Ledger is more than a bank account. It&apos;s a beautifully curated
              financial narrative designed to help couples grow, dream, and build together.
            </Trans>
          </p>
          <LinkButton to="/signup" variant="primary" size="lg" className="shadow-xl">
            <Trans>Start Your Journey</Trans>
          </LinkButton>
        </div>
      </div>
      <SharedGoalCard />
    </section>
  );
}

function SharedGoalCard() {
  return (
    <div className="absolute bottom-20 right-8 hidden lg:block">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl w-80 shadow-2xl rotate-3">
        <div className="flex justify-between items-center mb-6">
          <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
            <Trans>Shared Goal</Trans>
          </span>
          <Icon name="favorite" className="text-tertiary-fixed-dim" />
        </div>
        <h4 className="text-white font-headline text-xl font-bold mb-2">
          <Trans>Summer in Tuscany</Trans>
        </h4>
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-primary-fixed-dim">
            <Trans>$8,450 saved</Trans>
          </span>
          <span className="text-white">84%</span>
        </div>
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
          <div className="h-full bg-secondary-fixed w-3/5" />
          <div className="h-full bg-tertiary-fixed-dim w-1/4" />
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const { t } = useLingui();

  return (
    <section id="benefits" className="py-32 bg-background px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 bg-surface-container-lowest p-12 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter mb-6 text-primary">
                <Trans>The Shared Narrative</Trans>
              </h2>
              <p className="text-lg text-on-surface-variant max-w-md leading-relaxed mb-12">
                <Trans>
                  Every transaction tells a story. From morning coffees to mortgage payments, Nosko
                  translates your data into a cohesive editorial ledger.
                </Trans>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FeatureCard
                  className="bg-surface-container-low"
                  icon={<Icon name="account_balance_wallet" filled className="text-secondary" />}
                  title={t`Unity Accounts`}
                  description={t`Seamlessly blend your individual accounts into one shared visual interface.`}
                />
                <FeatureCard
                  className="bg-surface-container-low"
                  icon={<Icon name="forum" className="text-tertiary" />}
                  title={t`In-Line Context`}
                  description={t`Comment on transactions, add photos of memories, and plan together.`}
                />
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-tertiary-fixed/30 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
          </div>
          <div className="md:col-span-4 flex flex-col gap-8">
            <div className="flex-1 bg-primary p-8 rounded-[2.5rem] text-white flex flex-col justify-between">
              <Icon name="security" className="text-4xl text-secondary-fixed" />
              <div>
                <h3 className="text-2xl font-bold font-headline mb-4">
                  <Trans>Ironclad Privacy</Trans>
                </h3>
                <p className="text-primary-fixed-dim text-sm">
                  <Trans>
                    Bank-grade encryption with a couple-focused permission layer that respects
                    individual autonomy.
                  </Trans>
                </p>
              </div>
            </div>
            <div className="flex-1 bg-secondary-fixed p-8 rounded-[2.5rem] text-on-secondary-fixed flex flex-col justify-between">
              <Icon name="trending_up" className="text-4xl" />
              <div>
                <h3 className="text-2xl font-bold font-headline mb-4">
                  <Trans>Grow Together</Trans>
                </h3>
                <p className="text-on-secondary-fixed-variant text-sm">
                  <Trans>
                    Predictive insights that help you anticipate future expenses and hit savings
                    milestones faster.
                  </Trans>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DesignedForSection() {
  const { t } = useLingui();

  const items = [
    {
      icon: 'auto_awesome',
      iconBg: 'bg-primary-fixed',
      iconColor: 'text-primary',
      title: t`Smart Asymmetry`,
      description: t`Our layout prioritizes what matters to you specifically, not a generic grid of numbers.`,
    },
    {
      icon: 'diversity_1',
      iconBg: 'bg-tertiary-fixed',
      iconColor: 'text-tertiary',
      title: t`Collaborative Planning`,
      description: t`Real-time sync ensures you're always on the same page, whether it's grocery lists or global investments.`,
    },
    {
      icon: 'eco',
      iconBg: 'bg-secondary-fixed',
      iconColor: 'text-secondary',
      title: t`Growth Focus`,
      description: t`We don't just track spending; we celebrate every step towards your shared flourishing.`,
    },
  ];

  return (
    <section id="features" className="py-24 bg-surface-container-low relative">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2">
            <h2 className="text-5xl font-extrabold font-headline tracking-tighter mb-8 text-primary">
              <Trans>Designed for the Modern Couple.</Trans>
            </h2>
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.title} className="flex items-start space-x-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}
                  >
                    <Icon name={item.icon} className={item.iconColor} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{item.title}</h4>
                    <p className="text-on-surface-variant">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-32 px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl font-extrabold font-headline tracking-tighter mb-8">
          <Trans>Ready to sync your</Trans> <br />
          <span className="text-secondary italic">
            <Trans>financial rhythm?</Trans>
          </span>
        </h2>
        <p className="text-xl text-on-surface-variant mb-12 max-w-2xl mx-auto">
          <Trans>
            Join thousands of couples who have moved beyond spreadsheets and discovered a more
            harmonious way to manage their lives.
          </Trans>
        </p>
        <LinkButton to="/signup" variant="dark" size="lg">
          <Trans>Get Early Access</Trans>
        </LinkButton>
        <p className="mt-6 text-sm text-outline">
          <Trans>No credit card required. Invite your partner later.</Trans>
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-surface-container-low pt-24 pb-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
          <div className="col-span-2">
            <Logo className="mb-6" />
            <p className="text-on-surface-variant leading-relaxed max-w-xs">
              <Trans>
                Crafting the future of shared finance with beauty, trust, and editorial precision.
              </Trans>
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-6">
              <Trans>Product</Trans>
            </h5>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li>
                <a className="hover:text-primary transition-colors" href="#benefits">
                  <Trans>Features</Trans>
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#features">
                  <Trans>The Ledger</Trans>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6">
              <Trans>Company</Trans>
            </h5>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  <Trans>About Us</Trans>
                </span>
              </li>
              <li>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  <Trans>Contact</Trans>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-outline-variant/20">
          <p className="text-xs text-outline mb-4 md:mb-0">
            <Trans>&copy; 2024 Nosko Financial Technologies. All rights reserved.</Trans>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="bg-background text-on-background font-body">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <DesignedForSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
