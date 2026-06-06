import { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getBusinessTheme, getOwnerBio } from '../lib/getBusinessTheme';
import StarRating from '../components/StarRating';
import SabiLogo from '../components/SabiLogo';

// ── SQL migration needed for ratings (run once in Supabase SQL editor) ─────────
// create table if not exists reviews (
//   id          uuid primary key default gen_random_uuid(),
//   business_id uuid references businesses(id) on delete cascade not null,
//   booking_id  uuid references bookings(id) on delete set null,
//   client_name text not null,
//   rating      int  not null check (rating between 1 and 5),
//   comment     text,
//   created_at  timestamptz default now()
// );
// alter table reviews enable row level security;
// create policy "public read"   on reviews for select using (true);
// create policy "public insert" on reviews for insert with check (true);
// create index on reviews(business_id);

const TYPE_LABELS = {
  nail_studio:        'Nail Studio',
  lash_studio:        'Lash Studio',
  spa:                'Spa',
  barbershop:         'Barbershop',
  mua:                'MUA',
  other:              'Other',
  tailor:             'Tailor',
  photography:        'Photography',
  home_services:      'Home Services',
  tutor:              'Tutor',
  fitness:            'Fitness',
  events:             'Events',
  private_chef:       'Private Chef',
  content_creator:    'Content Creator',
  dj:                 'DJ',
  other_professional: 'Professional',
};

const CATEGORIES = [
  { value: null,              label: 'All'          },
  { value: 'nail_studio',     label: 'Nail Studio'  },
  { value: 'lash_studio',     label: 'Lash Studio'  },
  { value: 'spa',             label: 'Spa'          },
  { value: 'barbershop',      label: 'Barbershop'   },
  { value: 'mua',             label: 'MUA'          },
  { value: 'photography',     label: 'Photography'  },
  { value: 'fitness',         label: 'Fitness'      },
  { value: 'events',          label: 'Events'       },
  { value: 'tailor',          label: 'Tailor'       },
  { value: 'private_chef',    label: 'Private Chef' },
  { value: 'dj',              label: 'DJ'           },
  { value: 'tutor',           label: 'Tutor'        },
  { value: 'content_creator', label: 'Content'      },
];

function fmtPrice(n) {
  if (!n && n !== 0) return '';
  return '₦' + Number(n).toLocaleString('en-NG');
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function MarketplaceView({ onBack }) {
  const [businesses, setBusinesses] = useState([]);
  const [services, setServices]     = useState({});   // { business_id: [{ id, name, price }] }
  const [ratings, setRatings]       = useState({});   // { business_id: { avg, count } }
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      // ── FIX 1: no subscription filter — show all businesses pre-go-live ──────
      const { data, error: err } = await supabase
        .from('businesses')
        .select('id, name, business_type, owner_name, tagline, city, state, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (err) throw err;
      const bizList = data ?? [];
      setBusinesses(bizList);

      // ── FIX 2: fetch top-3 services per business (ordered by price desc) ─────
      if (bizList.length) {
        const ids = bizList.map(b => b.id);
        const { data: svcData } = await supabase
          .from('services')
          .select('id, business_id, name, price')
          .in('business_id', ids)
          .order('price', { ascending: false });

        // Group into a map, capping at 3 per business (order is price desc so first 3 = top 3)
        const svcMap = {};
        (svcData ?? []).forEach(s => {
          if (!svcMap[s.business_id]) svcMap[s.business_id] = [];
          if (svcMap[s.business_id].length < 3) svcMap[s.business_id].push(s);
        });
        setServices(svcMap);
      }

      // ── Ratings: graceful fallback if reviews table doesn't exist yet ─────────
      try {
        const { data: rData } = await supabase
          .from('reviews')
          .select('business_id, rating');
        if (rData?.length) {
          const acc = {};
          rData.forEach(r => {
            if (!acc[r.business_id]) acc[r.business_id] = { sum: 0, count: 0 };
            acc[r.business_id].sum   += r.rating;
            acc[r.business_id].count += 1;
          });
          const avgMap = {};
          Object.entries(acc).forEach(([id, v]) => {
            avgMap[id] = { avg: v.sum / v.count, count: v.count };
          });
          setRatings(avgMap);
        }
      } catch { /* reviews table not yet created — silently skip */ }

    } catch (err) {
      console.error('[Marketplace]', err);
      setError('Failed to load professionals. Please try again.');
    }
    setLoading(false);
  }

  // ── FIX 1: search across name, owner_name, tagline, city, state ───────────────
  // If city + state are empty, name and tagline still serve as location fallback.
  const filtered = businesses.filter(b => {
    if (category && b.business_type !== category) return false;
    if (!search.trim()) return true;

    const q = search.trim().toLowerCase();
    return (
      b.name?.toLowerCase().includes(q)       ||
      b.owner_name?.toLowerCase().includes(q) ||
      b.tagline?.toLowerCase().includes(q)    ||
      b.city?.toLowerCase().includes(q)       ||
      b.state?.toLowerCase().includes(q)
    );
  });

  function book(id) {
    const url  = new URL(window.location.href);
    url.search = `?business=${id}`;
    url.hash   = '';
    window.location.href = url.toString();
  }

  return (
    <div style={S.root}>

      {/* ── Nav ───────────────────────────────────────── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <button style={S.backBtn} onClick={onBack}>
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>
          <SabiLogo size="md" dark={true} />
          <div style={{ width: 64 }} />
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <div style={S.hero}>
        <p style={S.eyebrow}>Sabi Marketplace</p>
        <h1 style={S.heroTitle}>Find a professional near you</h1>
        <p style={S.heroSub}>
          Browse verified Nigerian professionals. Book directly — no DMs, no calls.
        </p>
        <div style={S.searchWrap}>
          <Search size={15} style={S.searchIcon} />
          <input
            style={S.searchInput}
            placeholder="Search by name, city, or profession…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category pills ────────────────────────────── */}
      <div style={S.pillsOuter}>
        <div style={S.pillsInner}>
          {CATEGORIES.map(c => (
            <button
              key={c.value ?? 'all'}
              style={{ ...S.pill, ...(category === c.value ? S.pillActive : {}) }}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────── */}
      <main style={S.main}>
        {error && <div style={S.errorBanner}>{error}</div>}

        {loading ? (
          <div style={S.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={S.skeleton} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <p style={S.emptyTitle}>
              {search || category ? 'No results found' : 'No professionals listed yet'}
            </p>
            <p style={S.emptySub}>
              {search || category
                ? 'Try a different search or category.'
                : 'Check back soon — more professionals are joining Sabi every week.'}
            </p>
          </div>
        ) : (
          <>
            <p style={S.countLabel}>
              {filtered.length} professional{filtered.length !== 1 ? 's' : ''}
            </p>
            <div style={S.grid}>
              {filtered.map(b => {
                const r = ratings[b.id];
                const bio = b.tagline?.trim() || getOwnerBio(b.business_type);
                return (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    bio={bio}
                    svcList={services[b.id] ?? []}
                    avgRating={r?.avg   ?? 0}
                    reviewCount={r?.count ?? 0}
                    onBook={() => book(b.id)}
                  />
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Business card ─────────────────────────────────────────────────────────────

function BusinessCard({ business, bio, svcList, avgRating, reviewCount, onBook }) {
  const theme   = getBusinessTheme(business.business_type);
  const isDark  = theme.textDark === '#ffffff';
  const initial = (business.name || '?')[0].toUpperCase();
  const location = [business.city, business.state].filter(Boolean).join(', ');

  return (
    <div
      style={{ ...S.card, background: theme.cardBg, borderColor: theme.border }}
      onMouseEnter={e => {
        e.currentTarget.style.transform  = 'translateY(-3px)';
        e.currentTarget.style.boxShadow  = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform  = 'translateY(0)';
        e.currentTarget.style.boxShadow  = 'none';
      }}
    >
      {/* Header row: avatar + name + owner */}
      <div style={S.cardHeader}>
        <div style={{ ...S.avatar, background: isDark ? theme.bg : '#f5eded', borderColor: `${theme.primary}55` }}>
          <span style={{ color: theme.primary, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
            {initial}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...S.cardName, color: theme.textDark }}>{business.name}</p>
          {business.owner_name && (
            <p style={{ ...S.cardOwner, color: theme.textMuted }}>{business.owner_name}</p>
          )}
        </div>
      </div>

      {/* Type badge + optional location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ ...S.typeBadge, background: `${theme.primary}22`, color: theme.primary }}>
          {TYPE_LABELS[business.business_type] ?? 'Professional'}
        </span>
        {location && (
          <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            📍 {location}
          </span>
        )}
      </div>

      {/* Star rating */}
      <div style={{ marginBottom: 10 }}>
        <StarRating stars={avgRating} count={reviewCount} />
      </div>

      {/* Bio */}
      <p style={{ ...S.cardBio, color: theme.textMuted }}>{bio}</p>

      {/* Services list */}
      {svcList.length > 0 && (
        <div style={{ ...S.svcList, borderColor: `${theme.primary}22` }}>
          {svcList.map(s => (
            <div key={s.id} style={S.svcRow}>
              <span style={{ ...S.svcName, color: theme.textDark }}>{s.name}</span>
              <span style={S.svcDots} />
              <span style={{ ...S.svcPrice, color: theme.priceColor ?? theme.primary }}>
                {fmtPrice(s.price)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        style={{ ...S.bookBtn, background: theme.btnBg, color: theme.btnText }}
        onClick={onBook}
      >
        Book Now
      </button>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  root: {
    minHeight: '100vh', background: '#0A2E1A',
    fontFamily: "'DM Sans', sans-serif",
  },

  // Nav
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(10,46,26,0.96)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(76,175,114,0.18)',
  },
  navInner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 24px',
    height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#7AAE90', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    padding: 0, width: 64,
  },

  // Hero
  hero: {
    maxWidth: 680, margin: '0 auto', padding: '56px 24px 0',
    textAlign: 'center',
  },
  eyebrow: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: '2.5px',
    textTransform: 'uppercase', color: '#4CAF72', margin: '0 0 12px',
  },
  heroTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 500,
    color: '#FFFFFF', margin: '0 0 12px', lineHeight: 1.08,
  },
  heroSub: {
    fontSize: 15, color: '#7AAE90', margin: '0 0 28px', lineHeight: 1.6,
  },
  searchWrap: {
    position: 'relative', maxWidth: 460, margin: '0 auto',
  },
  searchIcon: {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)', color: '#7AAE90', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, color: '#FFFFFF',
    background: '#0F3D22', border: '1px solid rgba(76,175,114,0.25)',
    borderRadius: 4, padding: '12px 16px 12px 42px', outline: 'none',
  },

  // Category pills
  pillsOuter: {
    overflowX: 'auto', padding: '24px 24px 0',
    scrollbarWidth: 'none', msOverflowStyle: 'none',
  },
  pillsInner: {
    display: 'flex', gap: 8, flexWrap: 'nowrap',
    maxWidth: 1100, margin: '0 auto',
  },
  pill: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
    color: '#7AAE90', background: 'transparent',
    border: '1px solid rgba(76,175,114,0.2)',
    borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
    flexShrink: 0, transition: 'all 0.15s',
  },
  pillActive: {
    background: '#F5C842', color: '#0A2E1A',
    border: '1px solid #F5C842', fontWeight: 700,
  },

  // Main + grid
  main: {
    maxWidth: 1100, margin: '0 auto', padding: '20px 24px 72px',
  },
  countLabel: {
    fontSize: 12, color: 'rgba(122,174,144,0.6)',
    margin: '0 0 16px', fontFamily: "'DM Sans', sans-serif",
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },

  // Card
  card: {
    borderRadius: 8, padding: '18px',
    border: '1px solid', display: 'flex', flexDirection: 'column',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, border: '1.5px solid',
  },
  cardName: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.2,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardOwner: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11, margin: '2px 0 0',
  },
  typeBadge: {
    display: 'inline-block',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10, fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase', padding: '2px 8px', borderRadius: 3,
  },

  // Bio
  cardBio: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12, lineHeight: 1.5, margin: '0 0 12px',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  // Services
  svcList: {
    display: 'flex', flexDirection: 'column', gap: 6,
    borderTop: '1px solid', paddingTop: 10, marginBottom: 14,
  },
  svcRow: {
    display: 'flex', alignItems: 'baseline', gap: 4,
  },
  svcName: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '55%',
  },
  svcDots: {
    flex: 1,
    borderBottom: '1px dotted rgba(122,174,144,0.3)',
    marginBottom: 3,
  },
  svcPrice: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  },

  // Book button
  bookBtn: {
    marginTop: 'auto',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 700,
    border: 'none', borderRadius: 3,
    padding: '10px 0', cursor: 'pointer', width: '100%',
  },

  // States
  skeleton: {
    background: '#0F3D22', borderRadius: 8, height: 220,
    border: '1px solid rgba(76,175,114,0.1)',
  },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28, fontWeight: 500, color: '#FFFFFF', margin: '0 0 8px',
  },
  emptySub: { fontSize: 14, color: '#7AAE90', margin: 0 },
  errorBanner: {
    background: 'rgba(201,68,68,0.07)', border: '1px solid rgba(201,68,68,0.2)',
    borderRadius: 6, padding: '12px 16px',
    fontSize: 13, color: '#c94444', marginBottom: 24,
  },
};
