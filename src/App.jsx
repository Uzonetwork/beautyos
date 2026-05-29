import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getSession, getCurrentBusiness } from './lib/auth';
import LandingPage    from './views/LandingPage';
import SignupView     from './views/SignupView';
import LoginView      from './views/LoginView';
import PublicView     from './views/PublicView';
import OwnerDashboard from './views/OwnerDashboard';

const DEMO_BUSINESS_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export default function App() {
  const [view, setView]                         = useState('loading');
  const [authBusiness, setAuthBusiness]         = useState(null);
  const [publicBusinessId, setPublicBusinessId] = useState(null);
  // showWelcomeBanner is only true after signup; cleared on dismiss or navigation away
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // ── Initialise: URL params → auth session → landing ────────────────────────
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

      // Existing session → go straight to the owner's public page (skip landing)
      const session = await getSession();
      if (session) {
        const biz = await getCurrentBusiness();
        if (biz) {
          setAuthBusiness(biz);
          setView('public-own');
          return;
        }
      }

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
        onGetStarted={() => setView('signup')}
        onSeeDemo={()    => setView('demo')}
        onLogin={()      => setView('login')}
      />
    );
  }

  // ── Sign up — on success go to owner's public page with welcome banner ───────
  if (view === 'signup') {
    return (
      <SignupView
        onSuccess={(biz) => {
          setAuthBusiness(biz);
          setShowWelcomeBanner(true);
          setView('public-own');
        }}
        onLogin={() => setView('login')}
      />
    );
  }

  // ── Log in — on success go to owner's public page ───────────────────────────
  if (view === 'login') {
    return (
      <LoginView
        onSuccess={(biz) => {
          setAuthBusiness(biz);
          setView('public-own');
        }}
        onSignup={() => setView('signup')}
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
        onGoDashboard={() => setView('dashboard')}
        onOwnerLogin={() => setView('login')}
      />
    );
  }

  // ── Demo (CFO Nails, no owner bar) ──────────────────────────────────────────
  if (view === 'demo') {
    return (
      <PublicView
        businessId={DEMO_BUSINESS_ID}
        onOwnerLogin={() => setView('login')}
      />
    );
  }

  // ── Specific business public page (?business=<uuid>) ────────────────────────
  if (view === 'public') {
    return (
      <PublicView
        businessId={publicBusinessId}
        onOwnerLogin={() => setView('login')}
      />
    );
  }

  // ── Owner dashboard ─────────────────────────────────────────────────────────
  if (view === 'dashboard') {
    return (
      <OwnerDashboard
        businessId={authBusiness?.id}
        onViewPublicPage={() => setView('public-own')}
        onLogout={() => {
          setAuthBusiness(null);
          setShowWelcomeBanner(false);
          setView('landing');
        }}
      />
    );
  }

  return null;
}
