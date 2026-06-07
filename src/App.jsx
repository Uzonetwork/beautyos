import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { getSession, getCurrentBusiness } from './lib/auth';
import { supabase } from './lib/supabase';
import { posthog, track } from './lib/posthog';
import LandingPage     from './views/LandingPage';
import SignupView      from './views/SignupView';
import LoginView       from './views/LoginView';
import PublicView      from './views/PublicView';
import OwnerDashboard  from './views/OwnerDashboard';
import AdminDashboard  from './views/AdminDashboard';
import PaymentView     from './views/PaymentView';
import LegalView       from './views/LegalView';
import MarketplaceView from './views/MarketplaceView';

const DEMO_BUSINESS_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Known pathname prefixes that are NOT business slugs
const KNOWN_PATHS = new Set(['', '/', '/marketplace', '/terms', '/privacy', '/signup', '/login']);

/**
 * If the current URL pathname looks like a business slug (not a known app route),
 * return that slug string; otherwise return null.
 */
function getSlugFromPathname() {
  const { pathname } = window.location;
  if (KNOWN_PATHS.has(pathname)) return null;
  // Must be /something with no further slashes
  const match = pathname.match(/^\/([a-z0-9-]+)$/);
  return match ? match[1] : null;
}

// Maps view names → URL hash fragments
const VIEW_TO_HASH = {
  landing:      '',
  signup:       'signup',
  login:        'login',
  payment:      'payment',
  dashboard:    'dashboard',
  'public-own':  'page',
  marketplace:   '/marketplace',
};

export default function App() {
  const [view, setView]                         = useState('loading');
  const [authBusiness, setAuthBusiness]         = useState(null);
  const [publicBusinessId, setPublicBusinessId] = useState(null);
  // showWelcomeBanner is only true after signup; cleared on dismiss or navigation away
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // ── Analytics — fire page_viewed on every view change ──────────────────────
  useEffect(() => {
    if (view !== 'loading') {
      track('page_viewed', { view });
    }
  }, [view]);

  // ── Navigate and sync URL hash ──────────────────────────────────────────────
  const navigateTo = useCallback((newView) => {
    if (newView in VIEW_TO_HASH) {
      const hash = VIEW_TO_HASH[newView];
      history.pushState(
        { view: newView },
        '',
        hash ? `#${hash}` : window.location.pathname + window.location.search,
      );
    }
    setView(newView);
  }, []);

  // ── Browser back / forward ──────────────────────────────────────────────────
  useEffect(() => {
    function onPopState() {
      const hash = window.location.hash.slice(1);
      if (hash === '/admin')       { setView('admin');       return; }
      if (hash === '/terms')       { setView('terms');       return; }
      if (hash === '/privacy')     { setView('privacy');     return; }
      if (hash === '/marketplace') { setView('marketplace'); return; }
      if (hash === 'signup')    { setView('signup');                                  return; }
      if (hash === 'login')     { setView('login');                                   return; }
      if (hash === 'payment')   { setView(authBusiness ? 'payment'    : 'landing');  return; }
      if (hash === 'dashboard') { setView(authBusiness ? 'dashboard'  : 'landing');  return; }
      if (hash === 'page')      { setView(authBusiness ? 'public-own' : 'landing');  return; }
      setView(authBusiness ? 'public-own' : 'landing');
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [authBusiness]);

  // ── Initialise: URL params → hash → auth session → landing ─────────────────
  useEffect(() => {
    async function init() {
      const params   = new URLSearchParams(window.location.search);
      const bizParam = params.get('business');

      if (bizParam === 'demo' || bizParam === 'cfo-nails') {
        setView('demo');
        return;
      }
      if (bizParam) {
        setPublicBusinessId(bizParam);
        setView('public');
        return;
      }

      // Slug routing: /chi-nail-studio → look up by businesses.slug
      const slug = getSlugFromPathname();
      if (slug) {
        const { data: bizBySlug } = await supabase
          .from('businesses').select('id').eq('slug', slug).maybeSingle();
        if (bizBySlug?.id) {
          setPublicBusinessId(bizBySlug.id);
          setView('public');
          return;
        }
        // Slug not found — fall through to normal routing
      }

      const hash = window.location.hash.slice(1);

      // Admin + legal + marketplace routes — no auth needed
      if (hash === '/admin')       { setView('admin');       return; }
      if (hash === '/terms')       { setView('terms');       return; }
      if (hash === '/privacy')     { setView('privacy');     return; }
      if (hash === '/marketplace') { setView('marketplace'); return; }

      // Public routes — no auth needed on refresh
      if (hash === 'signup') { setView('signup'); return; }
      if (hash === 'login')  { setView('login');  return; }

      // Existing session → restore auth-gated view
      const session = await getSession();
      if (session) {
        const biz = await getCurrentBusiness();
        if (biz) {
          setAuthBusiness(biz);
          if (hash === 'dashboard') { setView('dashboard'); return; }
          setView('public-own');
          history.replaceState({ view: 'public-own' }, '', '#page');
          return;
        }
      }

      // Not authenticated — always land on landing, clear any stale hash
      if (hash) history.replaceState({}, '', window.location.pathname + window.location.search);
      setView('landing');
    }
    init();
  }, []);

  // ── Synchronous hash checks — run before async init() resolves.
  // All hooks are declared above, so these early returns are safe.
  if (window.location.hash === '#/admin')   return <AdminDashboard />;
  if (window.location.hash === '#/terms')   return <LegalView page="terms" />;
  if (window.location.hash === '#/privacy') return <LegalView page="privacy" />;

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-sabi-dark flex items-center justify-center">
        <Loader2 size={24} className="text-sabi-green animate-spin" />
      </div>
    );
  }

  // ── Landing ─────────────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <LandingPage
        onGetStarted={()   => { track('signup_started'); navigateTo('signup'); }}
        onSeeDemo={()      => navigateTo('demo')}
        onLogin={()        => navigateTo('login')}
        onMarketplace={()  => navigateTo('marketplace')}
      />
    );
  }

  // ── Sign up — on success go to payment wall ────────────────────────────────
  if (view === 'signup') {
    return (
      <SignupView
        onBack={() => navigateTo('landing')}
        onSuccess={(biz) => {
          if (biz?.user_id) {
            posthog.identify(biz.user_id, {
              business_name: biz.name,
              business_type: biz.business_type,
            });
          }
          track('signup_completed', {
            business_id:   biz?.id,
            business_type: biz?.business_type,
          });
          setAuthBusiness(biz);
          navigateTo('payment');
        }}
        onLogin={() => navigateTo('login')}
      />
    );
  }

  // ── Payment wall — after signup, before first dashboard access ──────────────
  if (view === 'payment' && authBusiness) {
    return (
      <PaymentView
        business={authBusiness}
        onSuccess={() => {
          setShowWelcomeBanner(true);
          navigateTo('public-own');
        }}
      />
    );
  }

  // ── Log in — on success go to owner's public page ───────────────────────────
  if (view === 'login') {
    return (
      <LoginView
        onSuccess={(biz) => {
          if (biz?.user_id) {
            posthog.identify(biz.user_id, {
              business_name: biz.name,
              business_type: biz.business_type,
            });
          }
          track('owner_login', { business_id: biz?.id });
          setAuthBusiness(biz);
          setShowWelcomeBanner(true);
          navigateTo('public-own');
        }}
        onSignup={() => navigateTo('signup')}
      />
    );
  }

  // ── Owner viewing their own public booking page ─────────────────────────────
  if (view === 'public-own' && authBusiness) {
    return (
      <PublicView
        businessId={authBusiness.id}
        isOwner={true}
        showWelcomeBanner={showWelcomeBanner}
        onWelcomeDismiss={() => setShowWelcomeBanner(false)}
        onGoToDashboard={() => navigateTo('dashboard')}
      />
    );
  }

  // ── Demo (CFO Nails, no owner bar) ──────────────────────────────────────────
  if (view === 'demo') {
    return (
      <PublicView
        businessId={DEMO_BUSINESS_ID}
      />
    );
  }

  // ── Specific business public page (?business=<uuid>) ────────────────────────
  if (view === 'public') {
    return (
      <PublicView
        businessId={publicBusinessId}
        onGoToDashboard={async () => {
          const biz = await getCurrentBusiness();
          if (biz) {
            setAuthBusiness(biz);
            navigateTo('dashboard');
          }
        }}
      />
    );
  }

  // ── Owner dashboard ─────────────────────────────────────────────────────────
  if (view === 'dashboard') {
    return (
      <OwnerDashboard
        businessId={authBusiness?.id}
        onViewPublicPage={() => navigateTo('public-own')}
        onLogout={() => {
          setAuthBusiness(null);
          setShowWelcomeBanner(false);
          navigateTo('landing');
        }}
      />
    );
  }

  // ── Marketplace (public, no auth required) ─────────────────────────────────
  if (view === 'marketplace') {
    return (
      <MarketplaceView
        onBack={() => navigateTo('landing')}
      />
    );
  }

  // ── Admin dashboard (own password gate, no Supabase auth required) ─────────
  if (view === 'admin')   return <AdminDashboard />;
  if (view === 'terms')   return <LegalView page="terms" />;
  if (view === 'privacy') return <LegalView page="privacy" />;

  return null;
}
