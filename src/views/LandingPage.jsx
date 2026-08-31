import { useState, useEffect } from 'react';
import {
  Search, MapPin, Sparkles, Eye, Flower2, Scissors, Brush, Shirt, Camera,
  Home, GraduationCap, Dumbbell, PartyPopper, ChefHat, Music2, Video, Briefcase,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PRICING } from '../config/pricing';
import SabiLogo from '../components/SabiLogo';

// ── Category tiles ───────────────────────────────────────────────────────────
// Canonical order + icon/photo per business_type. Labels mirror
// MarketplaceView.jsx's own filter pills, since a tile's whole job is to
// hand you off into that same category filter — wording should match on
// both sides of the click.
//
// `photo` names a file in public/categories/ (self-hosted, compressed
// WebP). Not every business_type has one yet — other_professional
// doesn't — so Icon stays on every entry as the fallback for whichever
// tile has no photo, not just as a design backup.
const CATEGORY_TILES = [
  { value: 'nail_studio',        label: 'Nail Studio',     Icon: Sparkles,      photo: 'nail-studio.webp'   },
  { value: 'lash_studio',        label: 'Lash Studio',     Icon: Eye,           photo: null                 },
  { value: 'spa',                label: 'Spa',             Icon: Flower2,       photo: null                 },
  { value: 'barbershop',         label: 'Barbershop',      Icon: Scissors,      photo: null                 },
  { value: 'mua',                label: 'MUA',             Icon: Brush,         photo: null                 },
  { value: 'tailor',             label: 'Tailor',          Icon: Shirt,         photo: null                 },
  { value: 'photography',        label: 'Photography',     Icon: Camera,        photo: 'photography.webp'   },
  { value: 'home_services',      label: 'Home Services',   Icon: Home,          photo: 'home-services.webp' },
  { value: 'tutor',              label: 'Tutor',           Icon: GraduationCap, photo: null                 },
  { value: 'fitness',            label: 'Fitness',         Icon: Dumbbell,      photo: 'fitness.webp'       },
  { value: 'events',             label: 'Events',          Icon: PartyPopper,   photo: 'events.webp'        },
  { value: 'private_chef',       label: 'Private Chef',    Icon: ChefHat,       photo: null                 },
  { value: 'dj',                 label: 'DJ',              Icon: Music2,        photo: 'dj.webp'            },
  { value: 'content_creator',    label: 'Content Creator', Icon: Video,         photo: null                 },
  { value: 'other_professional', label: 'Professional',    Icon: Briefcase,     photo: null                 },
  { value: 'other',              label: 'Other',           Icon: Briefcase     },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted, onLogin, onMarketplace, onBrowse }) {
  // Category tile presence and the location dropdown's options both come
  // from one real query — active businesses only, no invented categories
  // or cities. No count is shown per tile (see LandingPage's task notes:
  // with ~1 business in most categories, a real count reads worse than
  // none), just whether at least one active business exists in it.
  const [activeCategories, setActiveCategories] = useState(new Set());
  const [cities,           setCities]           = useState([]);
  const [search,           setSearch]           = useState('');
  const [location,         setLocation]         = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('businesses_public')
        .select('business_type,city')
        .eq('is_active', true);
      if (cancelled || !data) return;
      setActiveCategories(new Set(data.map(b => b.business_type).filter(Boolean)));
      setCities([...new Set(data.map(b => b.city).filter(Boolean))].sort());
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const tiles = CATEGORY_TILES.filter(t => activeCategories.has(t.value));

  function scrollToPro() {
    document.getElementById('lp-pro')?.scrollIntoView({ behavior: 'smooth' });
  }

  // The typed term takes priority over the selected location — both
  // seed the same single search field on the marketplace (see
  // MarketplaceView.jsx), which matches name/owner/tagline/city/state
  // as one substring test, not per-field, so combining "nails" +
  // "Lagos" into one query would under-match rather than narrow the
  // results. Picking one is honest; concatenating them would look
  // like a working AND filter and quietly not be one.
  function submitSearch() {
    const seed = search.trim() || location;
    onBrowse({ search: seed });
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    submitSearch();
  }

  // Belt-and-suspenders alongside the form's onSubmit: some mobile
  // keyboards' "Search"/"Go"/"Done" action key on a virtual keyboard
  // don't reliably translate into a native form submission for every
  // browser, which is exactly the reported bug — typing a term and
  // tapping that key did nothing. Handling Enter directly on the input
  // means it no longer matters whether the browser treats that key as a
  // "submit" trigger at all. preventDefault() here also stops the
  // browser's own default action for the keypress, so this can't
  // double-fire alongside a native form submission.
  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSearch();
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="bg-sabi-dark rounded-b-3xl px-6 pt-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-5">
            <button onClick={() => { window.location.href = '/'; }} className="mr-auto bg-transparent border-0 cursor-pointer p-0">
              <SabiLogo size="md" />
            </button>
            <button onClick={scrollToPro} className="text-sabi-muted text-sm font-semibold hover:text-white transition-colors bg-transparent border-0 cursor-pointer whitespace-nowrap">
              For professionals
            </button>
            <button onClick={onLogin} className="btn-gold text-sm py-2 px-4">
              Log in
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <label className="flex items-center gap-1.5 bg-white rounded-xl px-3 flex-shrink-0">
              <MapPin size={14} className="text-sabi-dark/70 flex-shrink-0" />
              <select
                aria-label="Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="appearance-none bg-transparent border-0 outline-none py-3.5 text-sm font-bold text-slate-900 cursor-pointer"
              >
                <option value="">All locations</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-white rounded-xl pl-3 pr-1 py-1">
              <Search size={16} className="text-slate-400 flex-shrink-0" />
              {/* type="text", not "search" — a native type="search" input
                  grows its own clear (×) button once there's text, which
                  isn't accounted for in this row's width budget and was
                  pushing the button below off the edge on a real 390px
                  viewport (confirmed — its own submit button ended up
                  partly beyond the viewport, not just visually tight). */}
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Nails, barber, photographer…"
                aria-label="Search"
                enterKeyHint="search"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400"
              />
              {/* Doesn't depend on the keyboard's action key at all — a
                  real, always-visible tap target. */}
              <button
                type="submit"
                aria-label="Search"
                className="flex-shrink-0 bg-sabi-gold text-sabi-dark rounded-lg p-2 border-0 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Search size={16} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* ── Browse by service ───────────────────────────────────── */}
      {tiles.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pt-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-slate-900 font-extrabold text-base tracking-tight">Browse by service</h2>
            <button onClick={onMarketplace} className="text-sabi-dark text-sm font-bold bg-transparent border-0 cursor-pointer">
              See all →
            </button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {tiles.map(({ value, label, Icon, photo }) => (
              <button
                key={value}
                onClick={() => onBrowse({ category: value })}
                className="text-center bg-transparent border-0 cursor-pointer p-0 group"
              >
                <div className="aspect-square rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center group-hover:shadow-md group-hover:border-sabi-green transition-all">
                  {photo ? (
                    <img src={`/categories/${photo}`} alt={label} className="w-full h-full object-cover" />
                  ) : (
                    <Icon size={26} strokeWidth={1.75} className="text-sabi-dark" />
                  )}
                </div>
                <p className="mt-2 text-xs font-bold text-slate-900 leading-tight">{label}</p>
              </button>
            ))}
            <button
              onClick={onMarketplace}
              className="text-center bg-transparent border-0 cursor-pointer p-0"
            >
              <div className="aspect-square rounded-2xl bg-sabi-dark flex items-center justify-center text-sabi-gold text-xs font-bold text-center px-2 leading-snug">
                All services
              </div>
              <p className="mt-2 text-xs font-bold text-slate-900 leading-tight">See everything</p>
            </button>
          </div>
        </section>
      )}

      {/* ── Professionals strip ─────────────────────────────────── */}
      <section id="lp-pro" className="max-w-5xl mx-auto px-6 mt-10">
        <div className="bg-sabi-dark rounded-2xl p-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[220px]">
            <h3 className="text-white font-extrabold text-base tracking-tight">You do the work. Danda handles the bookings.</h3>
            <p className="text-sabi-muted text-sm mt-1">
              Your own booking page, client list and earnings — ₦{PRICING.promoPrice.toLocaleString()}/year.
            </p>
          </div>
          <button onClick={onGetStarted} className="btn-gold text-sm px-5 py-2.5 flex-shrink-0">
            List your business
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="max-w-5xl mx-auto px-6 mt-10 pt-6 pb-10 border-t border-slate-200">
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
          <button onClick={scrollToPro} className="bg-transparent border-0 cursor-pointer p-0 hover:text-slate-900 transition-colors">For professionals</button>
          <button onClick={onMarketplace} className="bg-transparent border-0 cursor-pointer p-0 hover:text-slate-900 transition-colors">Marketplace</button>
          <a href="/#/terms" className="hover:text-slate-900 transition-colors">Terms</a>
          <a href="/#/privacy" className="hover:text-slate-900 transition-colors">Privacy</a>
          <a href="mailto:hello@danda.ng" className="hover:text-slate-900 transition-colors">Contact</a>
        </nav>
        <p className="text-xs text-slate-400 mt-4">© {new Date().getFullYear()} Danda · Sabi Software &amp; Systems Ltd</p>
      </footer>

    </div>
  );
}
