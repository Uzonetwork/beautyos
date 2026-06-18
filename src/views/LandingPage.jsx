import { useState, useEffect, useRef } from 'react';
import {
  Check, ArrowRight,
  Sparkles, Eye, Flower2, Scissors, Brush, Shirt, Camera, Home,
  GraduationCap, Dumbbell, PartyPopper, ChefHat, Music2, Video, Briefcase,
} from 'lucide-react';
import SabiLogo from '../components/SabiLogo';

// ── Static data ───────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '🌐', title: 'Online Booking Page', desc: 'Your personal link — clients book directly, any time, from any device. No DMs, no calls.' },
  { icon: '📈', title: 'Earnings Tracker',    desc: "See today's and this month's confirmed earnings at a glance. Know your money." },
  { icon: '👥', title: 'Client Management',   desc: 'Full client history — visit count, last service, and contact details, all in one place.' },
  { icon: '📋', title: 'Service Menu',        desc: 'Add, edit, and price your services. Toggle availability instantly. Update live in seconds.' },
];

const PRICING_FEATURES = [
  'Public booking page with your branding',
  'Unlimited bookings',
  'Client management & history',
  'Earnings tracker — daily and monthly',
  'WhatsApp notifications',
  'Gallery showcase for your work',
  'All future updates included',
];

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
      { name: 'The Adeyemis',   service: 'Home Dinner',    time: '7:00 PM' },
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

// ── Professions data ─────────────────────────────────────────────────────────

const PROFESSIONS = [
  { label: 'Nail Studio',     Icon: Sparkles,      color: '#b85c5c' },
  { label: 'Lash Studio',     Icon: Eye,           color: '#b85c5c' },
  { label: 'Spa',             Icon: Flower2,       color: '#b85c5c' },
  { label: 'Barbershop',      Icon: Scissors,      color: '#b85c5c' },
  { label: 'MUA',             Icon: Brush,         color: '#b85c5c' },
  { label: 'Tailor',          Icon: Shirt,         color: '#C084FC' },
  { label: 'Photography',     Icon: Camera,        color: '#F5C842' },
  { label: 'Home Services',   Icon: Home,          color: '#F0A060' },
  { label: 'Tutor',           Icon: GraduationCap, color: '#60A0F0' },
  { label: 'Fitness',         Icon: Dumbbell,      color: '#50C878' },
  { label: 'Events',          Icon: PartyPopper,   color: '#F06090' },
  { label: 'Private Chef',    Icon: ChefHat,       color: '#C8C840' },
  { label: 'DJ',              Icon: Music2,        color: '#F06060' },
  { label: 'Content Creator', Icon: Video,         color: '#40C8C8' },
  { label: 'Other',           Icon: Briefcase,     color: '#7AAE90' },
];

// ── Card stack ────────────────────────────────────────────────────────────────

function CardStack() {
  const [current, setCurrent] = useState(0);
  const total = PROFESSION_CARDS.length;

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % total), 3000);
    return () => clearInterval(id);
  }, [total]);

  function advance() { setCurrent(c => (c + 1) % total); }

  return (
    <div className="relative w-full max-w-xs mx-auto" style={{ height: 260 }}>
      <div className="relative w-full h-full">
        {PROFESSION_CARDS.map((card, i) => {
          const pos      = (i - current + total) % total;
          const isFront  = pos === 0;
          const isSecond = pos === 1;
          const isThird  = pos === 2;
          const hidden   = !isFront && !isSecond && !isThird;
          return (
            <div
              key={i}
              onClick={isFront ? advance : undefined}
              className="absolute inset-0 rounded-2xl overflow-hidden transition-all duration-500"
              style={{
                background:    card.bg,
                zIndex:        isFront ? 10 : isSecond ? 9 : isThird ? 8 : 7,
                transform:     isFront  ? 'translateY(0px) scale(1) rotate(0deg)'
                             : isSecond ? 'translateY(9px) scale(0.94) rotate(-3deg)'
                             : isThird  ? 'translateY(18px) scale(0.88) rotate(3deg)'
                             :            'translateY(26px) scale(0.82) rotate(0deg)',
                opacity:       isFront ? 1 : isSecond ? 0.85 : isThird ? 0.7 : 0,
                cursor:        isFront ? 'pointer' : 'default',
                pointerEvents: isFront ? 'auto' : 'none',
                boxShadow:     isFront
                  ? '0 16px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.2)'
                  : '0 4px 16px rgba(0,0,0,0.25)',
                visibility:    hidden ? 'hidden' : 'visible',
                padding:       '16px',
              }}
            >
              {/* Top row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: card.avatarBg, border: `1.5px solid ${card.dotColor}44` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight truncate" style={{ color: card.textColor }}>{card.biz}</p>
                  <p className="text-xs" style={{ color: card.mutedColor }}>Thursday, 29 May</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: card.liveColor, background: card.liveBg }}>Live</span>
              </div>

              {/* Earnings stat */}
              <div className="rounded-lg px-3 py-2 mb-3" style={{ background: card.statBg }}>
                <p className="text-xs mb-0.5" style={{ color: card.mutedColor }}>Today&apos;s Earnings</p>
                <p className="text-lg font-black" style={{ color: card.earningsColor }}>{card.earnings}</p>
              </div>

              {/* Upcoming label */}
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: card.sectionColor }}>Upcoming</p>

              {/* Appointment rows */}
              {card.appts.map((a, j) => (
                <div key={j} className="flex items-center gap-2 rounded-lg px-3 py-2 mb-1.5" style={{ background: card.rowBg }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: card.dotColor }} />
                  <div>
                    <p className="text-xs font-semibold leading-tight" style={{ color: card.textColor }}>{a.name}</p>
                    <p className="text-xs" style={{ color: card.mutedColor }}>{a.service} · {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center items-center gap-1.5">
        {PROFESSION_CARDS.map((card, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Show ${card.biz}`}
            className="h-1.5 rounded-full transition-all duration-300 border-0"
            style={{
              background: i === current ? PROFESSION_CARDS[current].dotColor : 'rgba(255,255,255,0.25)',
              width:      i === current ? 20 : 7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Mobile preview cards data ─────────────────────────────────────────────────

const MOBILE_PREVIEW_CARDS = [
  { biz: "Chi's Nail Studio",  type: 'Nail Studio',       initial: 'C', avatarBg: '#b85c5c', earnings: '₦24,000',
    appts: [["Adaeze N.",      "Gel Manicure · 10:00 AM"],  ["Chidinma E.",   "Lash Extensions · 12:30 PM"]] },
  { biz: 'Kemi Photography',   type: 'Photographer',       initial: 'K', avatarBg: '#0A2E1A', earnings: '₦80,000',
    appts: [["Emeka O.",       "Portrait Session · 11:00 AM"], ["Funmi A.",   "Event Coverage · 2:00 PM"]] },
  { biz: 'Zara Couture',       type: 'Tailor & Fashion',   initial: 'Z', avatarBg: '#1a0a2e', earnings: '₦45,000',
    appts: [["Ngozi B.",       "Aso-Ebi Sewing · 10:00 AM"],  ["Amina K.",   "Dress Fitting · 1:00 PM"]] },
  { biz: 'BurnFit Lagos',      type: 'Fitness & Wellness', initial: 'B', avatarBg: '#0a2a1a', earnings: '₦30,000',
    appts: [["Tunde F.",       "Personal Training · 7:00 AM"], ["Sola M.",   "Group Class · 9:00 AM"]] },
  { biz: 'DJ Frequencies',     type: 'Music DJ',           initial: 'D', avatarBg: '#1e0808', earnings: '₦120,000',
    appts: [["Club Quilox",    "Club Night · 10:00 PM"],    ["Mr & Mrs Eze", "Wedding DJ · Sat"]] },
  { biz: 'Chef Tunde',         type: 'Private Chef',       initial: 'T', avatarBg: '#1e1e08', earnings: '₦50,000',
    appts: [["The Adeyemis",   "Home Dinner · 7:00 PM"],    ["Lagos Food Fest", "Event Catering · Sat"]] },
  { biz: 'Vibe Events Co.',    type: 'Event Services',     initial: 'V', avatarBg: '#2a0a1a', earnings: '₦160,000',
    appts: [["Bolu & Temi",    "Decoration · 9:00 AM"],     ["GTBank",       "Corporate MC · 2:00 PM"]] },
];

// ── Mobile card row ───────────────────────────────────────────────────────────

function MobileCardRow() {
  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);

  function handleScroll() {
    if (!scrollRef.current) return;
    const cardWidth = 288 + 16; // w-72 (288px) + gap-4 (16px)
    setActive(Math.round(scrollRef.current.scrollLeft / cardWidth));
  }

  function goTo(i) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: i * (288 + 16), behavior: 'smooth' });
    setActive(i);
  }

  return (
    <div className="flex md:hidden w-full flex-col gap-3" aria-hidden="true">

      {/* Scrollable card row */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-4 -mx-6 px-6 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {MOBILE_PREVIEW_CARDS.map((card, i) => (
          <div
            key={i}
            className="snap-start flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200"
          >
            {/* Top color bar */}
            <div style={{ background: card.avatarBg, height: 8 }} />

            {/* Profile row */}
            <div className="flex items-center gap-3 px-3 pt-3 pb-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                style={{ background: card.avatarBg }}
              >
                {card.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-sm font-bold truncate">{card.biz}</p>
                <p className="text-xs truncate font-medium" style={{ color: card.avatarBg }}>{card.type}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs font-bold text-green-600">LIVE</span>
              </div>
            </div>

            {/* Earnings box */}
            <div className="mx-3 mb-3 bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Today&apos;s Earnings</p>
              <p className="text-xl font-black" style={{ color: card.avatarBg }}>{card.earnings}</p>
            </div>

            {/* Appointments */}
            <div className="px-3 pb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Upcoming</p>
              {card.appts.map(([name, detail], j) => (
                <div key={j} className="flex items-start gap-2 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: card.avatarBg }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{name}</p>
                    <p className="text-xs text-slate-400 truncate">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center items-center gap-1.5">
        {MOBILE_PREVIEW_CARDS.map((card, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Show ${card.biz}`}
            className="h-1.5 rounded-full transition-all duration-300 border-0 cursor-pointer"
            style={{
              background: i === active ? MOBILE_PREVIEW_CARDS[active].avatarBg : 'rgba(255,255,255,0.25)',
              width: i === active ? 20 : 7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted, onSeeDemo, onLogin, onMarketplace }) {
  return (
    <div className="min-h-screen bg-sabi-dark text-white font-sans">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-sabi-dark/95 backdrop-blur border-b border-sabi-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <button onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0">
            <SabiLogo size="md" />
          </button>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={onLogin} className="text-sabi-muted text-sm hover:text-white transition-colors bg-transparent border-0 cursor-pointer">
              Log in
            </button>
            <button onClick={onMarketplace} className="btn-gold text-sm px-4 py-2">
              Marketplace
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-sabi-dark py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">

          {/* Left text */}
          <div className="flex-1 animate-slide-up">
            <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-4">For Nigerian Professionals</p>
            <h1 className="font-serif text-5xl md:text-6xl font-medium leading-tight text-white mb-5">
              Run your business<br />like a CEO
            </h1>
            <p className="text-sabi-muted text-base leading-relaxed mb-8 max-w-md">
              Sabi gives you a booking page, earnings dashboard, and client management —
              everything a skilled professional needs to look and run professionally.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <button className="btn-gold" onClick={onGetStarted}>
                Get Started Free <ArrowRight size={16} />
              </button>
              <button className="btn-outline" onClick={onMarketplace}>
                See a Demo
              </button>
            </div>
            <p className="text-xs text-sabi-muted">₦14,400/yr · Secure payment via Paystack</p>

            {/* Stats row */}
            <div className="flex gap-8 mt-8 pt-8 border-t border-sabi-border">
              <div>
                <p className="text-2xl font-black text-sabi-gold">500+</p>
                <p className="text-xs text-sabi-muted">Professionals</p>
              </div>
              <div>
                <p className="text-2xl font-black text-sabi-gold">₦0</p>
                <p className="text-xs text-sabi-muted">Setup cost</p>
              </div>
              <div>
                <p className="text-2xl font-black text-sabi-gold">2 min</p>
                <p className="text-xs text-sabi-muted">To go live</p>
              </div>
            </div>
          </div>

          {/* Mobile preview card row — replaces rotating stack on small screens */}
          <MobileCardRow />

          {/* Right card stack — desktop only */}
          <div className="hidden md:flex flex-1 justify-center items-center" aria-hidden="true">
            <div className="w-full max-w-xs pb-12">
              <CardStack />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="lp-features" className="bg-sabi-dark py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-3">What&apos;s included</p>
          <h2 className="font-serif text-4xl font-medium text-white mb-3">Everything you need to grow</h2>
          <p className="text-sabi-muted mb-12">Built for the Nigerian professional market — simple, fast, and professional.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="card p-6 text-left hover:border-sabi-green hover:-translate-y-1 transition-all duration-200">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                <p className="text-sabi-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Professions ─────────────────────────────────────────── */}
      <section className="bg-sabi-dark py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-3">Who it&apos;s for</p>
          <h2 className="font-serif text-4xl font-medium text-white mb-2">Built for every Nigerian professional</h2>
          <p className="text-sabi-muted text-sm mb-10">15 professions and counting</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {PROFESSIONS.map(({ label, Icon, color }) => (
              <div
                key={label}
                className="bg-sabi-card border border-sabi-border rounded-xl p-4 text-center hover:border-sabi-green hover:-translate-y-1 transition-all duration-200 cursor-default"
              >
                <div className="flex justify-center mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}26` }}
                  >
                    <Icon size={20} style={{ color }} strokeWidth={1.75} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-sabi-muted leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Marketplace teaser ──────────────────────────────────── */}
      <section className="bg-sabi-dark py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-3">Discover Professionals</p>
          <h2 className="font-serif text-4xl font-medium text-white mb-4">Book any skill, any time</h2>
          <p className="text-sabi-muted mb-8 leading-relaxed">
            From nail artists to private chefs — browse every professional on Sabi and book
            directly from their page. No middleman, no calls.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['Nail Studio', 'Photography', 'Tailoring', 'Fitness', 'Events', 'Private Chef', 'DJ', 'MUA'].map(t => (
              <span key={t} className="bg-sabi-card border border-sabi-border text-sabi-muted text-xs rounded-full px-3 py-1">{t}</span>
            ))}
          </div>
          <button className="btn-gold" onClick={onMarketplace}>
            Browse Marketplace <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="lp-pricing" className="bg-sabi-card py-20 px-6 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-3">Pricing</p>
          <h2 className="font-serif text-4xl font-medium text-white mb-2">Simple, honest pricing</h2>
          <p className="text-sabi-muted mb-10">One plan. Everything included. Cancel any time.</p>

          <div className="card p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sabi-gold text-sabi-dark text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap">
              Launch Price
            </div>
            <p className="text-xs text-sabi-muted uppercase tracking-widest mb-4">Professional — Yearly</p>
            <div className="flex items-baseline justify-center gap-3 mb-1">
              <span className="text-sabi-muted line-through text-sm">₦24,000/yr</span>
              <span className="font-serif text-5xl font-semibold text-sabi-gold">₦14,400</span>
              <span className="text-sabi-muted text-sm">/yr</span>
            </div>
            <p className="text-xs text-sabi-muted mb-8">Price increases to ₦24,000/yr soon</p>

            <ul className="text-left space-y-3 mb-8">
              {PRICING_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/85">
                  <Check size={14} strokeWidth={2.5} className="text-sabi-green flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button className="btn-gold w-full justify-center text-base py-4" onClick={onGetStarted}>
              Get Started — ₦14,400/yr <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-sabi-dark border-t border-sabi-border px-6 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

          {/* Brand */}
          <div>
            <SabiLogo size="md" />
            <p className="text-sabi-muted text-sm mt-4 mb-2">The booking platform for Nigerian professionals</p>
            <p className="text-sabi-muted text-xs leading-relaxed">
              Get your free booking page, manage clients, and track earnings — all in one place.
            </p>
            <div className="flex gap-2 mt-4">
              <a href="https://instagram.com/sabipro.ng" className="w-8 h-8 rounded-lg bg-sabi-card border border-sabi-border flex items-center justify-center text-xs text-sabi-muted hover:text-white hover:border-sabi-green transition-colors" target="_blank" rel="noopener noreferrer" aria-label="Instagram">IG</a>
              <a href="https://tiktok.com/@sabipro.ng"   className="w-8 h-8 rounded-lg bg-sabi-card border border-sabi-border flex items-center justify-center text-xs text-sabi-muted hover:text-white hover:border-sabi-green transition-colors" target="_blank" rel="noopener noreferrer" aria-label="TikTok">TK</a>
              <a href="https://x.com/sabipro.ng"         className="w-8 h-8 rounded-lg bg-sabi-card border border-sabi-border flex items-center justify-center text-xs text-sabi-muted hover:text-white hover:border-sabi-green transition-colors" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">𝕏</a>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-4">Product</p>
            <ul className="space-y-2">
              <li><button className="text-sabi-muted text-sm hover:text-white transition-colors bg-transparent border-0 cursor-pointer" onClick={() => document.getElementById('lp-features')?.scrollIntoView({ behavior: 'smooth' })}>How It Works</button></li>
              <li><button className="text-sabi-muted text-sm hover:text-white transition-colors bg-transparent border-0 cursor-pointer" onClick={() => document.getElementById('lp-pricing')?.scrollIntoView({ behavior: 'smooth' })}>Pricing</button></li>
              <li><a href="/#/signup" className="text-sabi-muted text-sm hover:text-white transition-colors">For Beauty Professionals</a></li>
              <li><a href="/#/signup" className="text-sabi-muted text-sm hover:text-white transition-colors">For All Professionals</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-4">Company</p>
            <ul className="space-y-2">
              <li><a href="/#/terms"   className="text-sabi-muted text-sm hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/#/privacy" className="text-sabi-muted text-sm hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="mailto:hello@sabi.ng" className="text-sabi-muted text-sm hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto border-t border-sabi-border pt-6">
          <p className="text-xs text-sabi-muted">© 2026 Sabi. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
