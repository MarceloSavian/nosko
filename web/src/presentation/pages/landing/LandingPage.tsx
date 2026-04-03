import { Trans } from '@lingui/react/macro';
import { Icon } from '@/presentation/components/Icon';
import { LinkButton } from '@/presentation/components/LinkButton';
import { Logo } from '@/presentation/components/Logo';

function Navbar() {
  return (
    <header className="fixed top-0 right-0 left-0 h-20 bg-background/80 backdrop-blur-xl shadow-sm z-50 flex justify-between items-center px-10 w-full">
      <div className="flex items-center gap-8">
        <Logo />
        <nav className="hidden md:flex gap-8 items-center">
          <a
            className="text-primary border-b-2 border-secondary pb-1 font-extrabold tracking-tight text-sm"
            href="#benefits"
          >
            <Trans>Portfolio</Trans>
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-opacity font-extrabold tracking-tight text-sm"
            href="#features"
          >
            <Trans>Insights</Trans>
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-opacity font-extrabold tracking-tight text-sm"
            href="#planning"
          >
            <Trans>Planning</Trans>
          </a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-4 text-sm font-semibold tracking-wide text-primary/70">
          <a className="hover:text-primary transition-colors" href="#benefits">
            <Trans>Benefits</Trans>
          </a>
          <a className="hover:text-primary transition-colors" href="#pricing">
            <Trans>Pricing</Trans>
          </a>
        </div>
        <LinkButton to="/signup" variant="primary" size="sm">
          <Trans>Get Started</Trans>
        </LinkButton>
        <LinkButton to="/login" variant="link" size="sm">
          <Trans>Log In</Trans>
        </LinkButton>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center px-6 md:px-10 lg:px-20 overflow-hidden">
      <div className="max-w-4xl z-10">
        <div className="mb-6 inline-flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
          <span className="w-2 h-2 bg-secondary rounded-full" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">
            <Trans>Estate Level Management</Trans>
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-primary leading-[0.95] mb-8 font-headline">
          <Trans>
            Financial unity starts with <span className="text-secondary italic">precision.</span>
          </Trans>
        </h1>
        <p className="text-lg md:text-xl text-primary/70 max-w-xl mb-12 font-medium leading-relaxed">
          <Trans>
            A digital curator for high-end financial lucidity. Consolidate your wealth with a
            sophisticated, sand-based neutral experience.
          </Trans>
        </p>
        <div className="flex flex-wrap gap-4">
          <LinkButton to="/signup" variant="primary" size="lg" className="space-x-3">
            <span>
              <Trans>Get Started</Trans>
            </span>
            <Icon name="arrow_forward" className="text-lg" />
          </LinkButton>
          <button
            type="button"
            className="bg-white text-primary border border-primary/10 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/50 transition-all flex items-center gap-3"
          >
            <Icon name="play_circle" filled className="text-2xl" />
            <Trans>Watch Film</Trans>
          </button>
        </div>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[80%] hidden lg:block">
        <div className="absolute right-10 bottom-20 left-20 bg-primary p-10 rounded-[2rem] shadow-2xl text-white z-10">
          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
            <Trans>Portfolio Yield</Trans>
          </span>
          <div className="text-5xl font-extrabold tracking-tighter mt-2 font-headline">+12.4%</div>
          <div className="mt-4 flex gap-1">
            <div className="h-1 w-12 bg-secondary rounded-full" />
            <div className="h-1 w-4 bg-white/20 rounded-full" />
            <div className="h-1 w-4 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

function BentoGridSection() {
  return (
    <section id="benefits" className="px-6 md:px-10 lg:px-20 py-24 bg-background">
      <div className="mb-16">
        <h2 className="text-4xl font-extrabold tracking-tighter text-primary font-headline">
          <Trans>The New Standard.</Trans>
        </h2>
        <div className="h-1 w-20 bg-secondary mt-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
        <div className="md:col-span-8 bg-white rounded-[2rem] p-10 shadow-sm flex flex-col justify-between overflow-hidden relative group">
          <div className="z-10">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">
              <Trans>Analytics Engine</Trans>
            </span>
            <h3 className="text-3xl font-extrabold tracking-tight mt-2 max-w-md font-headline">
              <Trans>Precision-driven wealth oversight for complex partners.</Trans>
            </h3>
          </div>
          <div className="flex gap-4 items-center z-10">
            <div className="h-12 w-12 bg-tertiary-container rounded-2xl flex items-center justify-center">
              <Icon name="analytics" className="text-primary" />
            </div>
            <span className="font-bold">
              <Trans>Real-time data synchronization across 15,000+ institutions.</Trans>
            </span>
          </div>
        </div>
        <div className="md:col-span-4 bg-primary text-white rounded-[2rem] p-10 shadow-sm flex flex-col justify-between">
          <Icon name="security" filled className="text-4xl text-secondary" />
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-2 font-headline">
              <Trans>Immutable Security.</Trans>
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              <Trans>
                256-bit encryption with decentralized validation protocols for every sync.
              </Trans>
            </p>
          </div>
        </div>
        <div className="md:col-span-4 bg-secondary-container rounded-[2rem] p-10 shadow-sm flex flex-col justify-center">
          <div className="text-6xl font-extrabold tracking-tighter text-primary font-headline">
            99.9%
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary/60 mt-4">
            <Trans>Uptime Accuracy</Trans>
          </p>
        </div>
        <div className="md:col-span-4 bg-white rounded-[2rem] p-10 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">
              <Trans>Sync Tech</Trans>
            </span>
            <h3 className="text-xl font-extrabold tracking-tight mt-2 font-headline">
              <Trans>Global Liquidity View</Trans>
            </h3>
          </div>
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full border-2 border-white bg-primary-fixed-dim" />
            <div className="w-10 h-10 rounded-full border-2 border-white bg-tertiary-fixed-dim" />
            <div className="w-10 h-10 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[10px] font-bold text-white">
              +12
            </div>
          </div>
        </div>
        <div className="md:col-span-4 bg-tertiary text-white rounded-[2rem] p-10 shadow-sm overflow-hidden relative">
          <h3 className="text-2xl font-extrabold tracking-tight z-10 relative font-headline">
            <Trans>Joint Management.</Trans>
          </h3>
          <p className="text-white/80 text-sm mt-4 z-10 relative">
            <Trans>Designed for couples and partners managing shared wealth estates.</Trans>
          </p>
          <Icon name="group" className="absolute -right-4 -bottom-4 text-[120px] opacity-20" />
        </div>
      </div>
    </section>
  );
}

function ProductPreviewSection() {
  return (
    <section id="features" className="px-6 md:px-10 lg:px-20 py-24 overflow-hidden">
      <div className="bg-white rounded-[3rem] p-12 lg:p-20 shadow-2xl flex flex-col lg:flex-row items-center gap-16 relative">
        <div className="flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary">
            <Trans>Premium Dashboard</Trans>
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mt-4 mb-8 font-headline">
            <Trans>Clarity across every asset class.</Trans>
          </h2>
          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center mt-1">
                <Icon name="check" className="text-secondary text-sm" />
              </div>
              <div>
                <p className="font-bold text-primary">
                  <Trans>Automated Categorization</Trans>
                </p>
                <p className="text-sm text-primary/60">
                  <Trans>Machine learning labels for 100+ transaction types.</Trans>
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center mt-1">
                <Icon name="check" className="text-secondary text-sm" />
              </div>
              <div>
                <p className="font-bold text-primary">
                  <Trans>Estate Projections</Trans>
                </p>
                <p className="text-sm text-primary/60">
                  <Trans>Future wealth forecasting based on current trajectory.</Trans>
                </p>
              </div>
            </li>
          </ul>
        </div>
        <div className="flex-1 w-full max-w-lg">
          <div className="bg-background/50 p-8 rounded-[2rem] border border-white/40 shadow-inner relative">
            <div className="flex justify-between items-end h-64 gap-3">
              <div className="flex-1 bg-primary/10 rounded-t-xl h-[40%]" />
              <div className="flex-1 bg-primary/10 rounded-t-xl h-[55%]" />
              <div className="flex-1 bg-primary/10 rounded-t-xl h-[35%]" />
              <div className="flex-1 bg-primary/10 rounded-t-xl h-[70%]" />
              <div className="flex-1 bg-secondary rounded-t-xl h-[95%] shadow-lg" />
            </div>
            <div className="absolute top-10 right-10 bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-secondary/20">
              <div className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">
                <Trans>Net Worth</Trans>
              </div>
              <div className="text-3xl font-extrabold text-primary tracking-tighter mt-1 font-headline">
                $2,481,092
              </div>
              <div className="flex items-center gap-1 text-tertiary text-xs font-bold mt-2">
                <Icon name="trending_up" className="text-sm" />
                <Trans>+2.4% This Month</Trans>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section id="planning" className="px-6 md:px-10 lg:px-20 py-32 text-center">
      <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-12 font-headline">
        <Trans>
          Elevate your wealth <br />
          management.
        </Trans>
      </h2>
      <div className="flex justify-center gap-6">
        <LinkButton to="/signup" variant="dark" size="lg" className="shadow-xl">
          <Trans>Begin Onboarding</Trans>
        </LinkButton>
      </div>
      <p className="mt-12 text-primary/40 font-medium tracking-wide">
        <Trans>Available on Web, iOS and Android.</Trans>
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-white px-10 py-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1">
          <Logo tone="light" className="mb-8" />
          <p className="text-white/60 text-sm leading-relaxed">
            <Trans>
              Defining the next era of partner-centric wealth management through precision and
              clarity.
            </Trans>
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-secondary uppercase text-xs tracking-widest">
            <Trans>Platform</Trans>
          </h4>
          <ul className="space-y-4 text-sm text-white/80 font-medium">
            <li>
              <a className="hover:text-white transition-colors" href="#benefits">
                <Trans>Benefits</Trans>
              </a>
            </li>
            <li>
              <span className="hover:text-white transition-colors cursor-pointer">
                <Trans>Pricing</Trans>
              </span>
            </li>
            <li>
              <span className="hover:text-white transition-colors cursor-pointer">
                <Trans>Security</Trans>
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-secondary uppercase text-xs tracking-widest">
            <Trans>Company</Trans>
          </h4>
          <ul className="space-y-4 text-sm text-white/80 font-medium">
            <li>
              <span className="hover:text-white transition-colors cursor-pointer">
                <Trans>Our Vision</Trans>
              </span>
            </li>
            <li>
              <span className="hover:text-white transition-colors cursor-pointer">
                <Trans>Contact</Trans>
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-secondary uppercase text-xs tracking-widest">
            <Trans>Resources</Trans>
          </h4>
          <ul className="space-y-4 text-sm text-white/80 font-medium">
            <li>
              <span className="hover:text-white transition-colors cursor-pointer">
                <Trans>Help Center</Trans>
              </span>
            </li>
            <li>
              <span className="hover:text-white transition-colors cursor-pointer">
                <Trans>Legal &amp; Privacy</Trans>
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-white/10 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] text-white/40 tracking-widest uppercase">
          <Trans>&copy; 2024 Nosko Wealth Management. All rights reserved.</Trans>
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="bg-background text-on-background font-body">
      <Navbar />
      <main className="pt-20">
        <HeroSection />
        <BentoGridSection />
        <ProductPreviewSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
