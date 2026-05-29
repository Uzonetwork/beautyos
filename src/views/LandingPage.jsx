import {
  Globe, TrendingUp, Users, LayoutList,
  Scissors, Eye, Leaf, Sparkles, User,
  Check, ArrowRight,
} from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  {
    Icon: Globe,
    title: 'Online Booking Page',
    desc: 'Your personal link — clients book directly, any time, from any device. No DMs, no calls.',
  },
  {
    Icon: TrendingUp,
    title: 'Earnings Tracker',
    desc: "See today's and this month's confirmed earnings at a glance. Know your money.",
  },
  {
    Icon: Users,
    title: 'Client Management',
    desc: 'Full client history — visit count, last service, and contact details, all in one place.',
  },
  {
    Icon: LayoutList,
    title: 'Service Menu',
    desc: 'Add, edit, and price your services. Toggle availability instantly. Update live in seconds.',
  },
];

const BUSINESS_TYPES = [
  { Icon: Scissors, label: 'Nail Studio' },
  { Icon: Eye,      label: 'Lash Studio' },
  { Icon: Leaf,     label: 'Spa'         },
  { Icon: User,     label: 'Barbershop'  },
  { Icon: Sparkles, label: 'MUA'         },
];

const PRICING_FEATURES = [
  'Public booking page with your branding',
  'Real-time booking & status dashboard',
  'Earnings tracker — daily and monthly',
  'Full client history and visit tracking',
  'Service menu with live price editing',
  'Gallery showcase for your work',
  'WhatsApp notification integration',
  'Mobile-friendly across all devices',
];

const MOCK_BOOKINGS = [
  { id: 1, name: 'Adaeze N.',   service: 'Gel Manicure',    time: '10:00 AM', status: 'confirmed' },
  { id: 2, name: 'Chidinma E.', service: 'Lash Extensions', time: '12:30 PM', status: 'confirmed' },
  { id: 3, name: 'Tope A.',     service: 'Acrylic Nails',   time: '3:00 PM',  status: 'pending'   },
];

export default function LandingPage({ onGetStarted, onSeeDemo, onLogin }) {
  return (
    <div className="lp-root">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <span className="lp-nav-brand">BeautyOS</span>
          <div className="lp-nav-actions">
            <button className="lp-nav-login" onClick={onLogin}>Log in</button>
            <button className="lp-nav-cta" onClick={onGetStarted}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-text">
            <p className="lp-eyebrow">For beauty professionals</p>
            <h1 className="lp-hero-title">
              Run your beauty business<br className="lp-hero-br" /> like a CEO
            </h1>
            <p className="lp-hero-sub">
              BeautyOS gives you a booking page, earnings dashboard, and client management —
              everything a beauty business needs to look and run professionally.
            </p>
            <div className="lp-hero-ctas">
              <button className="lp-btn-primary" onClick={onGetStarted}>
                Get Started Free
                <ArrowRight size={16} strokeWidth={2} />
              </button>
              <button className="lp-btn-ghost" onClick={onSeeDemo}>
                See a Demo
              </button>
            </div>
            <p className="lp-hero-note">30 days free · No credit card required</p>
          </div>

          <div className="lp-hero-visual" aria-hidden="true">
            <div className="lp-mockup">
              <div className="lp-mockup-top">
                <div className="lp-mockup-avatar" />
                <div>
                  <p className="lp-mockup-biz">Chi&apos;s Nail Studio</p>
                  <p className="lp-mockup-date">Thursday, 29 May</p>
                </div>
                <span className="lp-mockup-live">Live</span>
              </div>
              <div className="lp-mockup-stat-card">
                <p className="lp-mockup-stat-label">Today&apos;s Earnings</p>
                <p className="lp-mockup-stat-value">&#8358;24,000</p>
              </div>
              <p className="lp-mockup-section">Upcoming</p>
              {MOCK_BOOKINGS.map(b => (
                <div key={b.id} className="lp-mockup-row">
                  <span className={`lp-mockup-dot lp-mockup-dot--${b.status}`} />
                  <div className="lp-mockup-row-info">
                    <p className="lp-mockup-client">{b.name}</p>
                    <p className="lp-mockup-meta">{b.service} &middot; {b.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="lp-features">
        <div className="lp-section-inner">
          <p className="lp-section-eyebrow">What&apos;s included</p>
          <h2 className="lp-section-title">Everything you need to grow</h2>
          <p className="lp-section-sub">
            Built for the Nigerian beauty market — simple, fast, and professional.
          </p>
          <div className="lp-features-grid">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="lp-feature-card">
                <div className="lp-feature-icon">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className="lp-feature-title">{title}</h3>
                <p className="lp-feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Business types ────────────────────────────────────── */}
      <section className="lp-types">
        <div className="lp-section-inner">
          <p className="lp-section-eyebrow">Who it&apos;s for</p>
          <h2 className="lp-section-title">Built for every beauty professional</h2>
          <div className="lp-types-row">
            {BUSINESS_TYPES.map(({ Icon, label }) => (
              <div key={label} className="lp-type-item">
                <div className="lp-type-icon">
                  <Icon size={22} strokeWidth={1.5} />
                </div>
                <p className="lp-type-label">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="lp-pricing">
        <div className="lp-section-inner">
          <p className="lp-section-eyebrow">Pricing</p>
          <h2 className="lp-section-title">Simple, honest pricing</h2>
          <p className="lp-section-sub">One plan. Everything included. Cancel any time.</p>
          <div className="lp-pricing-card">
            <div className="lp-pricing-badge">Most popular</div>
            <p className="lp-plan-label">Professional</p>
            <div className="lp-price-row">
              <span className="lp-price-amount">&#8358;4,000</span>
              <span className="lp-price-period">/month</span>
            </div>
            <p className="lp-price-note">First 30 days free &mdash; no card needed</p>
            <ul className="lp-pricing-features">
              {PRICING_FEATURES.map(f => (
                <li key={f} className="lp-pricing-feature">
                  <Check size={14} strokeWidth={2.5} className="lp-pricing-check" />
                  {f}
                </li>
              ))}
            </ul>
            <button className="lp-btn-primary lp-btn-full" onClick={onGetStarted}>
              Start Free 30-Day Trial
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <p className="lp-footer-brand">BeautyOS</p>
          <p className="lp-footer-tagline">
            The professional platform for beauty businesses in Nigeria
          </p>
          <p className="lp-footer-copy">© 2026 BeautyOS</p>
        </div>
      </footer>

    </div>
  );
}
