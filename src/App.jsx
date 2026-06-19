import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getSession, getCurrentBusiness } from './lib/auth';
import { supabase } from './lib/supabase';
import { posthog, track } from './lib/posthog';

const LandingPage     = lazy(() => import('./views/LandingPage'));
const SignupView      = lazy(() => import('./views/SignupView'));
const LoginView       = lazy(() => import('./views/LoginView'));
const PublicView      = lazy(() => import('./views/PublicView'));
const OwnerDashboard  = lazy(() => import('./views/OwnerDashboard'));
const AdminDashboard  = lazy(() => import('./views/AdminDashboard'));
const LegalView       = lazy(() => import('./views/LegalView'));
const MarketplaceView = lazy(() => import('./views/MarketplaceView'));

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

function PageLoader() {
  return (
    <div className="min-h-screen bg-sabi-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sabi-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sabi-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}

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
  if (window.location.hash === '#/admin')   return <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>;
  if (window.location.hash === '#/terms')   return <Suspense fallback={<PageLoader />}><LegalView page="terms" /></Suspense>;
  if (window.location.hash === '#/privacy') return <Suspense fallback={<PageLoader />}><LegalView page="privacy" /></Suspense>;

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-sabi-dark flex items-center justify-center">
        <Loader2 size={24} className="text-sabi-green animate-spin" />
      </div>
    );
  }

  // ── View rendering — all routes wrapped in a single Suspense boundary ────────
  return (
    <Suspense fallback={<PageLoader />}>

      {view === 'landing' && (
        <LandingPage
          onGetStarted={()   => { track('signup_started'); navigateTo('signup'); }}
          onSeeDemo={()      => navigateTo('demo')}
          onLogin={()        => navigateTo('login')}
          onMarketplace={()  => navigateTo('marketplace')}
        />
      )}

      {view === 'signup' && (
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
            navigateTo('dashboard');
          }}
          onLogin={() => navigateTo('login')}
        />
      )}

      {view === 'login' && (
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
      )}

      {view === 'public-own' && authBusiness && (
        <PublicView
          businessId={authBusiness.id}
          isOwner={true}
          showWelcomeBanner={showWelcomeBanner}
          onWelcomeDismiss={() => setShowWelcomeBanner(false)}
          onGoToDashboard={() => navigateTo('dashboard')}
        />
      )}

      {view === 'demo' && (
        <PublicView
          businessId={DEMO_BUSINESS_ID}
        />
      )}

      {view === 'public' && (
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
      )}

      {view === 'dashboard' && (
        <OwnerDashboard
          businessId={authBusiness?.id}
          onViewPublicPage={() => navigateTo('public-own')}
          onLogout={() => {
            setAuthBusiness(null);
            setShowWelcomeBanner(false);
            navigateTo('landing');
          }}
        />
      )}

      {view === 'marketplace' && (
        <MarketplaceView
          onBack={() => navigateTo('landing')}
        />
      )}

      {view === 'admin'   && <AdminDashboard />}
      {view === 'terms'   && <LegalView page="terms" />}
      {view === 'privacy' && <LegalView page="privacy" />}

    </Suspense>
  );
}
