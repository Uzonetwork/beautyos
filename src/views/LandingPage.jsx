import { useState, useEffect } from 'react';
import {
  Globe, TrendingUp, Users, LayoutList,
  Scissors, Eye, Leaf, Sparkles, User,
  Check, ArrowRight,
} from 'lucide-react';
import SabiLogo from '../components/SabiLogo';
import './LandingPage.css';

// ── Static data ───────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: Globe,      title: 'Online Booking Page', desc: 'Your personal link — clients book directly, any time, from any device. No DMs, no calls.' },
  { Icon: TrendingUp, title: 'Earnings Tracker',    desc: "See today's and this month's confirmed earnings at a glance. Know your money." },
  { Icon: Users,      title: 'Client Management',   desc: 'Full client history — visit count, last service, and contact details, all in one place.' },
  { Icon: LayoutList, title: 'Service Menu',        desc: 'Add, edit, and price your services. Toggle availability instantly. Update live in seconds.' },
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

// ── Rotating preview cards ────────────────────────────────────────────────────

const PROFESSION_CARDS = [
  {
    biz: "Chi's Nail Studio",
    profession: 'Nail Studio',
    bg: '#fff7f7',
    earnings: '₦24,000',
    earningsColor: '#b85c5c',
    statBg: '#ffe8e8',
    dotColor: '#b85c5c',
    liveBg: '#fce8e8',
    liveColor: '#b85c5c',
    avatarBg: '#eed5d5',
    textColor: '#2d1b1b',
    mutedColor: 'rgba(45,27,27,0.45)',
    sectionColor: 'rgba(45,27,27,0.35)',
    rowBg: '#fff0f0',
    appts: [
      { name: 'Adaeze N.',   service: 'Gel Manicure',    time: '10:00 AM' },
      { name: 'Chidinma E.', service: 'Lash Extensions', time: '12:30 PM' },
    ],
  },
  {
    biz: 'Kemi Photography',
    profession: 'Photographer',
    bg: '#0F3D22',
    earnings: '₦80,000',
    earningsColor: '#F5C842',
    statBg: '#1A5C30',
    dotColor: '#4CAF72',
    liveBg: 'rgba(245,200,66,0.15)',
    liveColor: '#F5C842',
    avatarBg: '#1A5C30',
    textColor: '#ffffff',
    mutedColor: '#7AAE90',
    sectionColor: 'rgba(122,174,144,0.6)',
    rowBg: '#0A2E1A',
    appts: [
      { name: 'Emeka O.', service: 'Portrait Session', time: '11:00 AM' },
      { name: 'Funmi A.', service: 'Event Coverage',   time: '2:00 PM'  },
    ],
  },
  {
    biz: 'Zara Couture',
    profession: 'Tailor & Fashion',
    bg: '#260f40',
    earnings: '₦45,000',
    earningsColor: '#F5C842',
    statBg: '#3a1560',
    dotColor: '#C084FC',
    liveBg: 'rgba(192,132,252,0.15)',
    liveColor: '#C084FC',
    avatarBg: '#3a1560',
    textColor: '#ffffff',
    mutedColor: '#9060C0',
    sectionColor: 'rgba(144,96,192,0.6)',
    rowBg: '#1a0a2e',
    appts: [
      { name: 'Ngozi B.', service: 'Aso-Ebi Sewing', time: '10:00 AM' },
      { name: 'Amina K.', service: 'Dress Fitting',   time: '1:00 PM'  },
    ],
  },
  {
    biz: 'BurnFit Lagos',
    profession: 'Fitness & Wellness',
    bg: '#0f3820',
    earnings: '₦30,000',
    earningsColor: '#B8F53A',
    statBg: '#185430',
    dotColor: '#50C878',
    liveBg: 'rgba(80,200,120,0.15)',
    liveColor: '#50C878',
    avatarBg: '#185430',
    textColor: '#ffffff',
    mutedColor: '#407858',
    sectionColor: 'rgba(64,120,88,0.7)',
    rowBg: '#0a2a1a',
    appts: [
      { name: 'Tunde F.', service: 'Personal Training', time: '7:00 AM' },
      { name: 'Sola M.',  service: 'Group Class',        time: '9:00 AM' },
    ],
  },
  {
    biz: 'DJ Frequencies',
    profession: 'Music DJ',
    bg: '#2a1010',
    earnings: '₦120,000',
    earningsColor: '#F5C842',
    statBg: '#3d1818',
    dotColor: '#F06060',
    liveBg: 'rgba(240,96,96,0.15)',
    liveColor: '#F06060',
    avatarBg: '#3d1818',
    textColor: '#ffffff',
    mutedColor: '#904040',
    sectionColor: 'rgba(144,64,64,0.6)',
    rowBg: '#1e0808',
    appts: [
      { name: 'Club Quilox',  service: 'Club Night', time: '10:00 PM' },
      { name: 'Mr & Mrs Eze', service: 'Wedding DJ', time: 'Sat'       },
    ],
  },
  {
    biz: 'Chef Tunde',
    profession: 'Private Chef',
    bg: '#2a2a10',
    earnings: '₦50,000',
    earningsColor: '#F5C842',
    statBg: '#383818',
    dotColor: '#C8C840',
    liveBg: 'rgba(200,200,64,0.15)',
    liveColor: '#C8C840',
    avatarBg: '#383818',
    textColor: '#ffffff',
    mutedColor: '#808030',
    sectionColor: 'rgba(128,128,48,0.6)',
    rowBg: '#1e1e08',
    appts: [
      { name: 'The Adeyemis',  service: 'Home Dinner',    time: '7:00 PM' },
      { name: 'Lagos Food Fest', service: 'Event Catering', time: 'Sat'     },
    ],
  },
  {
    biz: 'Vibe Events Co.',
    profession: 'Event Services',
    bg: '#3d1028',
    earnings: '₦160,000',
    earningsColor: '#F5C842',
    statBg: '#4d1838',
    dotColor: '#F06090',
    liveBg: 'rgba(240,96,144,0.15)',
    liveColor: '#F06090',
    avatarBg: '#4d1838',
    textColor: '#ffffff',
    mutedColor: '#904060',
    sectionColor: 'rgba(144,64,96,0.6)',
    rowBg: '#2a0a1a',
    appts: [
      { name: 'Bolu & Temi', service: 'Decoration',   time: '9:00 AM' },
      { name: 'GTBank',       service: 'Corporate MC', time: '2:00 PM' },
    ],
  },
];

// ── Card stack component ──────────────────────────────────────────────────────

function CardStack() {
  const [current, setCurrent] = useState(0);
  const total = PROFESSION_CARDS.length;

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % total), 3000);
    return () => clearInterval(id);
  }, [total]);

  function advance() {
    setCurrent(c => (c + 1) % total);
  }

  return (
    <div className="lp-card-stack">
      <div className="lp-card-stack-inner">
        {PROFESSION_CARDS.map((card, i) => {
          const pos = (i - current + total) % total;
          const isFront = pos === 0;
          const isSecond = pos === 1;
          const isThird = pos === 2;
          const hidden = !isFront && !isSecond && !isThird;

          return (
            <div
              key={i}
              className="lp-stack-card"
              style={{
                background: card.bg,
                zIndex:      isFront ? 10 : isSecond ? 9 : isThird ? 8 : 7,
                transform:   isFront  ? 'translateY(0px) scale(1) rotate(0deg)'
                           : isSecond ? 'translateY(9px) scale(0.94) rotate(-3deg)'
                           : isThird  ? 'translateY(18px) scale(0.88) rotate(3deg)'
                           :            'translateY(26px) scale(0.82) rotate(0deg)',
                opacity:     isFront ? 1 : isSecond ? 0.85 : isThird ? 0.7 : 0,
                cursor:      isFront ? 'pointer' : 'default',
                pointerEvents: isFront ? 'auto' : 'none',
                boxShadow:   isFront
                  ? '0 16px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.2)'
                  : '0 4px 16px rgba(0,0,0,0.25)',
                visibility:  hidden ? 'hidden' : 'visible',
              }}
              onClick={isFront ? advance : undefined}
            >
              {/* Top row */}
              <div className="lp-pc-top">
                <div className="lp-pc-avatar" style={{ background: card.avatarBg, border: `1.5px solid ${card.dotColor}44` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="lp-pc-biz" style={{ color: card.textColor }}>{card.biz}</p>
                  <p className="lp-pc-date" style={{ color: card.mutedColor }}>Thursday, 29 May</p>
                </div>
                <span className="lp-pc-live" style={{ color: card.liveColor, background: card.liveBg }}>Live</span>
              </div>

              {/* Earnings stat */}
              <div className="lp-pc-stat" style={{ background: card.statBg }}>
                <p className="lp-pc-stat-label" style={{ color: card.mutedColor }}>Today&apos;s Earnings</p>
                <p className="lp-pc-stat-value" style={{ color: card.earningsColor }}>{card.earnings}</p>
              </div>

              {/* Upcoming label */}
              <p className="lp-pc-section" style={{ color: card.sectionColor }}>Upcoming</p>

              {/* Appointment rows */}
              {card.appts.map((a, j) => (
                <div key={j} className="lp-pc-row" style={{ background: card.rowBg }}>
                  <span className="lp-pc-dot" style={{ background: card.dotColor }} />
                  <div>
                    <p className="lp-pc-client" style={{ color: card.textColor }}>{a.name}</p>
                    <p className="lp-pc-meta" style={{ color: card.mutedColor }}>{a.service} · {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="lp-stack-dots">
        {PROFESSION_CARDS.map((card, i) => (
          <button
            key={i}
            className={`lp-stack-dot${i === current ? ' lp-stack-dot--active' : ''}`}
            onClick={() => setCurrent(i)}
            style={{
              background: i === current ? PROFESSION_CARDS[current].dotColor : 'rgba(255,255,255,0.25)',
              width: i === current ? 20 : 7,
            }}
            aria-label={`Show ${card.biz}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted, onSeeDemo, onLogin }) {
  return (
    <div className="lp-root">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <button className="lp-nav-brand-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <SabiLogo size="md" dark={true} />
          </button>
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
            <p className="lp-eyebrow">For Nigerian Professionals</p>
            <h1 className="lp-hero-title">
              Run your business<br className="lp-hero-br" /> like a CEO
            </h1>
            <p className="lp-hero-sub">
              Sabi gives you a booking page, earnings dashboard, and client management —
              everything a skilled professional needs to look and run professionally.
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
            <CardStack />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="lp-features">
        <div className="lp-section-inner">
          <p className="lp-section-eyebrow">What&apos;s included</p>
          <h2 className="lp-section-title">Everything you need to grow</h2>
          <p className="lp-section-sub">
            Built for the Nigerian professional market — simple, fast, and professional.
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
          <h2 className="lp-section-title">Built for every Nigerian professional</h2>
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
          <div className="lp-footer-logo">
            <SabiLogo size="md" dark={true} />
          </div>
          <p className="lp-footer-tagline">
            The professional platform for skilled businesses in Nigeria
          </p>
          <div className="lp-footer-links">
            <a href="/#/terms" className="lp-footer-legal-link">Terms of Service</a>
            <span className="lp-footer-legal-sep">·</span>
            <a href="/#/privacy" className="lp-footer-legal-link">Privacy Policy</a>
          </div>
          <p className="lp-footer-copy">© 2026 Sabi</p>
        </div>
      </footer>

    </div>
  );
}
