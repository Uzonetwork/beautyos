import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { getSession, getCurrentBusiness } from './lib/auth';
import { posthog, track } from './lib/posthog';
import LandingPage    from './views/LandingPage';
import SignupView     from './views/SignupView';
import LoginView      from './views/LoginView';
import PublicView     from './views/PublicView';
import OwnerDashboard from './views/OwnerDashboard';

const DEMO_BUSINESS_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Maps view names → URL hash fragments
const VIEW_TO_HASH = {
  landing:      '',
  signup:       'signup',
  login:        'login',
  dashboard:    'dashboard',
  'public-own': 'page',
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
      if (hash === 'signup')    { setView('signup');                                  return; }
      if (hash === 'login')     { setView('login');                                   return; }
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

      const hash = window.location.hash.slice(1);

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

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="app-loading">
        <Loader2 size={24} className="app-loading-icon" />
      </div>
    );
  }

  // ── Landing ─────────────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => { track('signup_started'); navigateTo('signup'); }}
        onSeeDemo={()    => navigateTo('demo')}
        onLogin={()      => navigateTo('login')}
      />
    );
  }

  // ── Sign up — on success go to owner's public page with welcome banner ──────
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
          setShowWelcomeBanner(true);
          navigateTo('public-own');
        }}
        onLogin={() => navigateTo('login')}
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

  return null;
}
