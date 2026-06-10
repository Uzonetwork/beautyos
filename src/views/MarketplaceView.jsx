import { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getBusinessTheme, getOwnerBio } from '../lib/getBusinessTheme';
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

export default function MarketplaceView({ onBack }) {
  const [businesses, setBusinesses] = useState([]);
  const [services,   setServices]   = useState({});
  const [ratings,    setRatings]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError('');
    try {
      const { data, error: err } = await supabase
        .from('businesses')
        .select('id, name, business_type, owner_name, tagline, city, state, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (err) throw err;
      const bizList = data ?? [];
      setBusinesses(bizList);

      if (bizList.length) {
        const ids = bizList.map(b => b.id);
        const { data: svcData } = await supabase.from('services').select('id, business_id, name, price').in('business_id', ids).order('price', { ascending: false });
        const svcMap = {};
        (svcData ?? []).forEach(s => {
          if (!svcMap[s.business_id]) svcMap[s.business_id] = [];
          if (svcMap[s.business_id].length < 3) svcMap[s.business_id].push(s);
        });
        setServices(svcMap);
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
            <SabiLogo size="md" dark={false} />
          </button>
          <div className="w-16" />
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-3">Sabi Marketplace</p>
        <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-3 leading-tight">Find a professional near you</h1>
        <p className="text-sabi-muted text-sm mb-7 leading-relaxed">
          Browse verified Nigerian professionals. Book directly — no DMs, no calls.
        </p>
        <div className="relative max-w-md mx-auto">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-sabi-muted pointer-events-none" />
          <input
            className="w-full bg-sabi-card border border-sabi-border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-sabi-muted outline-none focus:border-sabi-green transition-colors"
            placeholder="Search by name, city, or profession…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category pills ───────────────────────────────────── */}
      <div className="overflow-x-auto px-6 pb-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 max-w-5xl mx-auto">
          {CATEGORIES.map(c => (
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

      {/* ── Count label — dark zone ──────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <p className="text-xs text-sabi-muted/60 max-w-5xl mx-auto px-6 pb-3 pt-1">
          {filtered.length} professional{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Results zone — light background ──────────────────── */}
      <div className="bg-[#FAFAFA] rounded-t-3xl">
        <main className="max-w-5xl mx-auto px-6 pb-20 pt-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-500 text-sm mb-6">{error}</div>}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl animate-pulse" style={{ height: 280 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="font-serif text-3xl font-medium text-slate-900 mb-2">
                {search || category ? 'No results found' : 'No professionals listed yet'}
              </h2>
              <p className="text-slate-500 text-sm">
                {search || category ? 'Try a different search or category.' : 'Check back soon — more professionals are joining Sabi every week.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(b => {
                const r   = ratings[b.id];
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
          )}
        </main>
      </div>
    </div>
  );
}

// ── Business card ─────────────────────────────────────────────────────────────

function BusinessCard({ business, bio, svcList, avgRating, reviewCount, onBook }) {
  const theme    = getBusinessTheme(business.business_type);
  const initial  = (business.name || '?')[0].toUpperCase();
  const location = [business.city, business.state].filter(Boolean).join(', ');

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col animate-fade-in cursor-pointer"
      onClick={onBook}
    >
      {/* Top content */}
      <div className="p-5 flex-1 flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg"
            style={{ background: theme.primary, color: theme.btnText }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate text-slate-900">{business.name}</p>
            {business.owner_name && <p className="text-xs mt-0.5 truncate text-slate-500">{business.owner_name}</p>}
          </div>
        </div>

        {/* Badge + location */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ background: `${theme.primary}1A`, color: theme.primary }}
          >
            {TYPE_LABELS[business.business_type] ?? 'Professional'}
          </span>
          {location && <span className="text-xs text-slate-400">📍 {location}</span>}
        </div>

        {/* Rating */}
        <div className="mb-3">
          <StarRating stars={avgRating} count={reviewCount} />
        </div>

        {/* Bio */}
        <p className="text-sm leading-relaxed mb-3 text-slate-500 line-clamp-2">{bio}</p>

        {/* Services */}
        {svcList.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3 mb-3 mt-auto">
            {svcList.map(s => (
              <div key={s.id} className="flex items-baseline gap-1">
                <span className="text-xs font-medium truncate max-w-[55%] text-slate-700">{s.name}</span>
                <span className="flex-1 border-b border-dotted border-slate-200 mb-0.5" />
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: theme.primary }}>{fmtPrice(s.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          className="w-full py-2.5 rounded-xl font-semibold text-sm border-0 cursor-pointer"
          style={{ background: theme.btnBg, color: theme.btnText }}
          onClick={e => { e.stopPropagation(); onBook(); }}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
