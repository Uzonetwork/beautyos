import { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StarRating from '../components/StarRating';
import SabiLogo from '../components/SabiLogo';

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

export default function MarketplaceView({ onBack, initialSearch = '', initialCategory = null }) {
  const [businesses, setBusinesses] = useState([]);
  const [fromPrices, setFromPrices] = useState({});
  const [ratings,    setRatings]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  // Seeded from the homepage's search/location row or a "Browse by
  // service" tile (see LandingPage.jsx) — reuses this exact filtering
  // logic rather than duplicating it, so there's only one place that
  // knows how to match a business against a query.
  const [search,     setSearch]     = useState(initialSearch);
  const [category,   setCategory]   = useState(initialCategory);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError('');
    try {
      // Same rule as the sitemap and the homepage's category tiles — a
      // lapsed subscription drops out of the marketplace. Tapping an
      // inactive listing used to land a customer on PublicView's "This
      // business is temporarily unavailable" gate, no booking form —
      // free exposure a paying business isn't getting more of.
      const { data, error: err } = await supabase
        .from('businesses_public')
        .select('id, name, business_type, owner_name, city, state, created_at, avatar_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(200);
      if (err) throw err;
      const bizList = data ?? [];
      setBusinesses(bizList);

      if (bizList.length) {
        const ids = bizList.map(b => b.id);
        // Ascending, keeping only the first (lowest) price per business —
        // this only ever needs a single "from ₦X" figure per card now,
        // not a shortlist of services to itemize.
        const { data: svcData } = await supabase.from('services').select('id, business_id, price').in('business_id', ids).order('price', { ascending: true });
        const priceMap = {};
        (svcData ?? []).forEach(s => {
          if (s.price == null) return;
          if (!(s.business_id in priceMap)) priceMap[s.business_id] = s.price;
        });
        setFromPrices(priceMap);
      }

      try {
        const { data: rData } = await supabase.from('reviews').select('business_id, rating');
        if (rData?.length) {
          const acc = {};
          rData.forEach(r => {
            if (!acc[r.business_id]) acc[r.business_id] = { sum: 0, count: 0 };
            acc[r.business_id].sum += r.rating; acc[r.business_id].count += 1;
          });
          const avgMap = {};
          Object.entries(acc).forEach(([id, v]) => { avgMap[id] = { avg: v.sum / v.count, count: v.count }; });
          setRatings(avgMap);
        }
      } catch { /* reviews table not yet created */ }

    } catch (err) {
      console.error('[Marketplace]', err);
      setError('Failed to load professionals. Please try again.');
    }
    setLoading(false);
  }

  // Same "at least one business" rule LandingPage.jsx uses for its
  // category tiles — fourteen pills for eight businesses was more
  // navigation than content. `businesses` is already active-only (see
  // load() above), so presence here already means "active". "All"
  // always shows regardless.
  const presentTypes = new Set(businesses.map(b => b.business_type));
  const visibleCategories = CATEGORIES.filter(c => c.value === null || presentTypes.has(c.value));

  const filtered = businesses.filter(b => {
    if (category && b.business_type !== category) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      b.name?.toLowerCase().includes(q)       ||
      b.owner_name?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q)       ||
      b.state?.toLowerCase().includes(q)
    );
  });

  function book(id) {
    const url = new URL(window.location.href);
    url.search = `?business=${id}`;
    url.hash   = '';
    window.location.href = url.toString();
  }

  return (
    <div className="min-h-screen bg-sabi-dark font-sans">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-sabi-dark/96 backdrop-blur border-b border-sabi-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button className="flex items-center gap-1.5 text-sabi-muted text-sm hover:text-white transition-colors bg-transparent border-0 cursor-pointer" onClick={onBack}>
            <ArrowLeft size={15} /> Back
          </button>
          <button onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0">
            <SabiLogo size="md" />
          </button>
          <div className="w-16" />
        </div>
      </nav>

      {/* ── Hero — same restrained type scale as LandingPage.jsx (no
          font-serif, no display sizes; that's the one thing left on this
          page still speaking the old marketing-page language) ────── */}
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-6 text-center">
        <h1 className="text-white font-extrabold text-xl tracking-tight mb-1.5">Find a professional near you</h1>
        <p className="text-sabi-muted text-sm mb-6">Browse Nigerian professionals.</p>
        {/* Same white-pill search field as the homepage header. */}
        <div className="flex items-center gap-2 bg-white rounded-xl pl-3.5 pr-3 py-1 max-w-md mx-auto">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            className="flex-1 min-w-0 bg-transparent border-0 outline-none py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400"
            placeholder="Search by name, city, or profession…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category pills ───────────────────────────────────── */}
      <div className="overflow-x-auto px-6 pb-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 max-w-5xl mx-auto">
          {visibleCategories.map(c => (
            <button
              key={c.value ?? 'all'}
              onClick={() => setCategory(c.value)}
              className={`flex-shrink-0 text-xs font-semibold whitespace-nowrap px-4 py-2 rounded-full border transition-all cursor-pointer ${category === c.value ? 'bg-sabi-gold text-sabi-dark border-sabi-gold font-bold' : 'border-sabi-border text-sabi-muted hover:border-sabi-green hover:text-sabi-green bg-transparent'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results zone — light background ──────────────────── */}
      <div className="bg-[#FAFAFA] rounded-t-3xl">
        <main className="max-w-5xl mx-auto px-6 pb-20 pt-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-500 text-sm mb-6">{error}</div>}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl animate-pulse" style={{ height: 132 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-slate-900 font-bold text-lg mb-2">
                {search || category ? 'No results found' : 'No professionals listed yet'}
              </h2>
              <p className="text-slate-500 text-sm">
                {search || category ? 'Try a different search or category.' : 'Check back soon — more professionals are joining Danda every week.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(b => {
                const r = ratings[b.id];
                return (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    fromPrice={fromPrices[b.id] ?? null}
                    avgRating={r?.avg   ?? 0}
                    reviewCount={r?.count ?? 0}
                    onBook={() => book(b.id)}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Business card ─────────────────────────────────────────────────────────────
// White card, thin slate border, one text colour, gold reserved for the one
// action button — same system LandingPage.jsx's tiles use. No per-profession
// theme colour: on a page showing several businesses at once, eight accent
// colours read as a collage, not eight individual brands.

function BusinessCard({ business, fromPrice, avgRating, reviewCount, onBook }) {
  const initial  = (business.name || '?')[0].toUpperCase();
  const type     = TYPE_LABELS[business.business_type] ?? 'Professional';
  const location = [business.city, business.state].filter(Boolean).join(', ');

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-sabi-green hover:shadow-sm transition-all cursor-pointer"
      onClick={onBook}
    >
      <div className="flex items-center gap-3">
        {business.avatar_url ? (
          <img
            src={business.avatar_url}
            alt=""
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          // Neutral fallback — no theme colour. Same slate-on-white
          // treatment as the homepage's icon-fallback category tile.
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 font-bold text-base text-slate-500">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight truncate text-slate-900">{business.name}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {type}{location ? ` · ${location}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          {fromPrice != null && (
            <p className="text-sm font-bold text-slate-900 leading-none">
              {fmtPrice(fromPrice)} <span className="text-[11px] font-medium text-slate-400">from</span>
            </p>
          )}
          {/* Omitted entirely when there's no rating yet — a zero-star
              row reads worse than nothing. */}
          {reviewCount > 0 && (
            <div className="mt-1.5">
              <StarRating stars={avgRating} count={reviewCount} />
            </div>
          )}
        </div>
        <button
          className="btn-gold text-xs px-3.5 py-2 flex-shrink-0"
          onClick={e => { e.stopPropagation(); onBook(); }}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
