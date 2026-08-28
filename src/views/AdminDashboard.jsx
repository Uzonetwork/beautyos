import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, AlertCircle, X } from 'lucide-react';
import { signIn, signOut, getSession } from '../lib/auth';
import { PRICING } from '../config/pricing';
import SabiLogo from '../components/SabiLogo';

const EDGE_FN_URL         = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`;
const RECORD_PAYOUT_URL   = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-record-payout`;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtTimestamp(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDateStr(s) {
  if (!s) return '—';
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB');
}
function fmtMoney(n) { return '₦' + (n || 0).toLocaleString(); }

const TYPE_LABELS = {
  nail_studio: 'Nail Studio', lash_studio: 'Lash Studio', spa: 'Spa', barbershop: 'Barbershop',
  mua: 'MUA', other: 'Other', tailor: 'Tailor & Fashion', photography: 'Photography',
  home_services: 'Home Services', tutor: 'Private Tutor', fitness: 'Fitness & Wellness',
  events: 'Event Services', private_chef: 'Private Chef', content_creator: 'Content Creator',
  dj: 'Music DJ', other_professional: 'Other Professional',
};

const TYPE_COLORS = {
  nail_studio: { bg: 'rgba(192,82,111,0.09)', color: '#c0526f' },
  lash_studio: { bg: 'rgba(192,82,111,0.09)', color: '#c0526f' },
  spa:         { bg: 'rgba(192,82,111,0.09)', color: '#c0526f' },
  barbershop:  { bg: 'rgba(192,82,111,0.09)', color: '#c0526f' },
  mua:         { bg: 'rgba(192,82,111,0.09)', color: '#c0526f' },
  other:       { bg: 'rgba(192,82,111,0.09)', color: '#c0526f' },
  tailor:          { bg: 'rgba(99,102,241,0.1)',  color: '#4338ca' },
  photography:     { bg: 'rgba(217,119,6,0.1)',   color: '#b45309' },
  home_services:   { bg: 'rgba(20,184,166,0.1)',  color: '#0f766e' },
  tutor:           { bg: 'rgba(59,130,246,0.1)',  color: '#1d4ed8' },
  fitness:         { bg: 'rgba(234,88,12,0.1)',   color: '#c2410c' },
  events:          { bg: 'rgba(168,85,247,0.1)',  color: '#7c3aed' },
  private_chef:    { bg: 'rgba(16,185,129,0.1)',  color: '#059669' },
  content_creator: { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  dj:              { bg: 'rgba(14,165,233,0.1)',  color: '#0284c7' },
  other_professional: { bg: 'rgba(76,175,114,0.08)', color: '#4CAF72' },
};

function subBadgeStyle(status, expiresAt) {
  const active  = status === 'active' && expiresAt && new Date(expiresAt) > new Date();
  const expired = status === 'active' && expiresAt && new Date(expiresAt) <= new Date();
  if (active)  return { bg: 'rgba(22,163,74,0.12)',  color: '#4CAF72',  label: 'ACTIVE'   };
  if (expired) return { bg: 'rgba(201,68,68,0.1)',   color: '#f87171',  label: 'EXPIRED'  };
  return             { bg: 'rgba(122,174,144,0.08)', color: '#7AAE90',  label: 'INACTIVE' };
}

const thCls = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-sabi-muted bg-sabi-deep whitespace-nowrap border-b border-sabi-border/15';
const tdCls = 'px-4 py-3 text-white text-sm align-middle border-b border-sabi-border/8';
const STATUS_BADGE = {
  confirmed: 'bg-sabi-green/10 text-green-700',
  pending:   'bg-sabi-gold/10 text-yellow-700',
  cancelled: 'bg-red-500/8 text-red-500',
};

export default function AdminDashboard() {
  // 'loading' = checking existing session; 'login' = show form; 'forbidden' = authed but not admin; 'dashboard' = all good
  const [view, setView] = useState('loading');

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [loginErr,     setLoginErr]     = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [loading,        setLoading]        = useState(false);
  const [loadError,      setLoadError]      = useState('');
  const [stats,          setStats]          = useState(null);
  const [businesses,     setBusinesses]     = useState([]);
  const [ratings,        setRatings]        = useState({});
  const [recentBookings, setRecentBookings] = useState([]);
  const [topServices,    setTopServices]    = useState([]);
  const [affiliates,     setAffiliates]     = useState([]);
  const [search,         setSearch]         = useState('');
  const [adminToken,     setAdminToken]     = useState('');

  // Record-payout modal — null when closed, the affiliate row when open.
  const [payoutModal,      setPayoutModal]      = useState(null);
  const [payoutAmount,     setPayoutAmount]     = useState('');
  const [payoutMethod,     setPayoutMethod]     = useState('Bank Transfer');
  const [payoutNote,       setPayoutNote]       = useState('');
  const [payoutDate,       setPayoutDate]       = useState(todayStr());
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutErr,        setPayoutErr]        = useState('');

  // Always show the login form on mount — never silently reuse a pre-existing
  // session (e.g. from a business owner logged in on the same device).
  useEffect(() => { setView('login'); }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoginLoading(true);
    setLoginErr('');
    try {
      // Clear any stale session before signing in so the admin-data fetch
      // always uses the credentials just submitted, not a leftover token.
      try { await signOut(); } catch { /* ignore */ }
      const { session } = await signIn(email.trim(), password);
      if (session?.access_token) {
        await load(session.access_token);
      } else {
        setLoginErr('Login succeeded but no session was returned. Please try again.');
      }
    } catch (err) {
      setLoginErr(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    try { await signOut(); } catch { /* ignore */ }
    setView('login');
    setEmail('');
    setPassword('');
    setStats(null);
    setBusinesses([]);
    setRecentBookings([]);
    setTopServices([]);
    setAffiliates([]);
    setAdminToken('');
  }

  // Called from the dashboard header "Refresh" button
  async function refresh() {
    const session = await getSession();
    if (!session?.access_token) { setView('login'); return; }
    await load(session.access_token);
  }

  async function load(token) {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(EDGE_FN_URL, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // 403 = authenticated but not in admin_users
      if (res.status === 403) { setView('forbidden'); return; }
      // 401 = token expired or invalid — prompt re-login
      if (res.status === 401) { setView('login'); return; }
      if (!res.ok) throw new Error(`Edge Function returned ${res.status}`);

      const data = await res.json();
      setAdminToken(token);

      const emailMap = {};
      (data.users ?? []).forEach(u => { if (u.id) emailMap[u.id] = u.email ?? '—'; });

      const bizBkgMap = {};
      (data.bizBookingIds ?? []).forEach(b => { bizBkgMap[b.business_id] = (bizBkgMap[b.business_id] || 0) + 1; });

      const svcBkgMap = {};
      (data.allBookings ?? []).forEach(b => { const k = `${b.business_id}::${b.service_name}`; svcBkgMap[k] = (svcBkgMap[k] || 0) + 1; });

      const top10 = (data.services ?? [])
        .map(s => ({ ...s, booking_count: svcBkgMap[`${s.business_id}::${s.name}`] || 0 }))
        .sort((a, b) => b.booking_count - a.booking_count)
        .slice(0, 10);

      setStats({
        totalBiz:      data.bizCount,
        totalBookings: data.bookingCount,
        totalClients:  data.clientCount,
        monthBiz:      data.monthBizCount,
        activeSubs:    data.activeSubsCount,
      });
      setBusinesses((data.businesses ?? []).map(b => ({ ...b, email: emailMap[b.user_id] ?? '—', booking_count: bizBkgMap[b.id] ?? 0 })));
      setRecentBookings(data.recentBookings ?? []);
      setTopServices(top10);

      // Commission is earned once, when the business pays — not tied to
      // whether the subscription is currently active — and becomes
      // payable 7 days after that payment (matching the refund window
      // in the Terms). See supabase/add_affiliate_payouts.sql for the
      // schema this mirrors: first_paid_at (set once, at first payment)
      // and payout_id (null until swept onto a recorded payout).
      const PAYABLE_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const referralStatsMap = {};
      (data.businesses ?? []).forEach(b => {
        if (!b.referred_by_affiliate_id) return;
        const s = referralStatsMap[b.referred_by_affiliate_id] ?? (referralStatsMap[b.referred_by_affiliate_id] = { signups: 0, pending: 0, payable: 0, paidOut: 0 });
        s.signups += 1;
        if (!b.first_paid_at) return; // not converted yet
        if (b.payout_id) { s.paidOut += 1; return; }
        const payableSince = new Date(b.first_paid_at).getTime() + PAYABLE_MS;
        if (now >= payableSince) s.payable += 1;
        else s.pending += 1;
      });
      const paidTotalByAffiliate = {};
      (data.payouts ?? []).forEach(p => {
        paidTotalByAffiliate[p.affiliate_id] = (paidTotalByAffiliate[p.affiliate_id] || 0) + (p.amount || 0);
      });
      setAffiliates((data.affiliates ?? []).map(a => {
        const s = referralStatsMap[a.id] ?? { signups: 0, pending: 0, payable: 0, paidOut: 0 };
        return {
          ...a,
          signups:   s.signups,
          pending:   s.pending,
          payable:   s.payable,
          paidOut:   s.paidOut,
          owed:      s.payable * PRICING.commissionPerReferral,
          paidTotal: paidTotalByAffiliate[a.id] || 0,
        };
      }));

      if (data.reviews?.length) {
        const acc = {};
        data.reviews.forEach(r => { if (!acc[r.business_id]) acc[r.business_id] = { sum: 0, count: 0 }; acc[r.business_id].sum += r.rating; acc[r.business_id].count += 1; });
        const avgMap = {};
        Object.entries(acc).forEach(([id, v]) => { avgMap[id] = { avg: +(v.sum / v.count).toFixed(1), count: v.count }; });
        setRatings(avgMap);
      }

      setView('dashboard');
    } catch (err) {
      console.error('[Admin] load failed:', err);
      setLoadError('Failed to load data. Check console for details.');
      setView('dashboard');
    } finally {
      setLoading(false);
    }
  }

  function openPayoutModal(a) {
    setPayoutModal(a);
    setPayoutAmount(String(a.owed || ''));
    setPayoutMethod('Bank Transfer');
    setPayoutNote('');
    setPayoutDate(todayStr());
    setPayoutErr('');
  }

  function closePayoutModal() {
    if (payoutSubmitting) return; // don't let the modal close mid-submit
    setPayoutModal(null);
  }

  async function submitPayout(e) {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (!Number.isInteger(amountNum) || amountNum <= 0) {
      setPayoutErr('Enter a whole naira amount greater than 0.');
      return;
    }
    if (!payoutMethod.trim()) {
      setPayoutErr('Method is required.');
      return;
    }
    setPayoutSubmitting(true);
    setPayoutErr('');
    try {
      const res = await fetch(RECORD_PAYOUT_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_id: payoutModal.id,
          amount: amountNum,
          method: payoutMethod.trim(),
          note: payoutNote.trim() || undefined,
          paid_at: payoutDate || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || `Edge Function returned ${res.status}`);
      setPayoutModal(null);
      await refresh();
    } catch (err) {
      setPayoutErr(err.message || 'Failed to record payout.');
    } finally {
      setPayoutSubmitting(false);
    }
  }

  const filtered = businesses.filter(b => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return b.name?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q) || b.owner_name?.toLowerCase().includes(q);
  });

  // ── Initial session check ─────────────────────────────────────────────────

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-sabi-dark flex items-center justify-center">
        <Loader2 size={24} className="text-sabi-green animate-spin" />
      </div>
    );
  }

  // ── Login form ─────────────────────────────────────────────────────────────

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-sabi-dark flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-sabi-card border border-sabi-border rounded-2xl p-8">
          <div className="flex justify-center mb-6">
            <button onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0">
              <SabiLogo size="lg" />
            </button>
          </div>
          <h1 className="font-serif text-3xl font-medium text-white text-center mb-1">Admin Access</h1>
          <p className="text-sabi-muted text-sm text-center mb-8">Sign in with your admin account.</p>
          <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sabi-muted pointer-events-none" />
                <input
                  className="input-dark pl-9"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  autoComplete="email"
                  autoFocus
                  onChange={e => { setEmail(e.target.value); setLoginErr(''); }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sabi-muted pointer-events-none" />
                <input
                  className="input-dark pl-9"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  autoComplete="current-password"
                  onChange={e => { setPassword(e.target.value); setLoginErr(''); }}
                />
              </div>
            </div>
            {loginErr && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                <AlertCircle size={14} className="flex-shrink-0" />
                {loginErr}
              </div>
            )}
            <button
              className="btn-gold w-full justify-center py-3 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={loginLoading || !email || !password}
            >
              {loginLoading && <Loader2 size={15} className="animate-spin" />}
              {loginLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Forbidden (authenticated but not in admin_users) ───────────────────────

  if (view === 'forbidden') {
    return (
      <div className="min-h-screen bg-sabi-dark flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-sabi-card border border-sabi-border rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
          <button onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0">
            <SabiLogo size="md" />
          </button>
          <h1 className="font-serif text-2xl font-medium text-white">Access Denied</h1>
          <p className="text-sabi-muted text-sm">Your account is not authorised to access the admin dashboard.</p>
          <button className="btn-gold w-full justify-center py-3 mt-2" onClick={handleLogout}>
            Sign in with a different account
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-sabi-dark font-sans">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-sabi-card border-b border-sabi-border">
        <div className="max-w-6xl mx-auto px-6 h-13 flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0">
              <SabiLogo size="md" />
            </button>
            <span className="text-xs font-black uppercase tracking-widest bg-sabi-gold text-sabi-dark px-2.5 py-1 rounded">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sabi-muted text-sm border border-sabi-border px-3 py-1.5 rounded-lg hover:text-white hover:border-sabi-green transition-colors bg-transparent cursor-pointer" onClick={refresh} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button className="text-sabi-muted text-sm hover:text-white transition-colors bg-transparent border-0 cursor-pointer" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 pb-20">

        {loadError && <div className="bg-red-500/7 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">{loadError}</div>}

        {loading && !stats ? (
          <div className="text-center py-20 text-sabi-muted text-sm">Loading dashboard data…</div>
        ) : (
          <>
            {/* Stats */}
            <section className="mb-12">
              <h2 className="font-serif text-2xl font-medium text-white mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Businesses',   value: stats?.totalBiz      ?? '—' },
                  { label: 'New This Month',      value: stats?.monthBiz      ?? '—', accent: true },
                  { label: 'Active Subscribers',  value: stats?.activeSubs    ?? '—', accent: true },
                  { label: 'Total Bookings',      value: stats?.totalBookings ?? '—' },
                  { label: 'Total Clients',       value: stats?.totalClients  ?? '—' },
                ].map(({ label, value, accent }) => (
                  <div key={label} className={`rounded-2xl p-5 border ${accent ? 'bg-sabi-gold/8 border-sabi-gold/20' : 'bg-sabi-card border-sabi-border'}`}>
                    <p className="text-xs font-bold uppercase tracking-widest text-sabi-muted mb-2">{label}</p>
                    <p className="font-serif text-4xl font-semibold text-sabi-gold leading-none">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Businesses */}
            <section className="mb-12">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h2 className="font-serif text-2xl font-medium text-white flex items-center gap-3">
                  Registered Businesses
                  <span className="font-sans text-xs font-bold text-sabi-gold bg-sabi-gold/12 px-2 py-0.5 rounded-full">{filtered.length}</span>
                </h2>
                <input
                  className="bg-sabi-card border border-sabi-border rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-sabi-green transition-colors placeholder:text-sabi-muted min-w-[200px]"
                  placeholder="Search name, email, owner…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="bg-sabi-card border border-sabi-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {['Business Name','Owner Email','Type','Status','WhatsApp','Rating','Bookings','Registered'].map((h, i) => (
                          <th key={h} className={`${thCls} ${i >= 5 ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-12 text-center text-sabi-muted text-sm">No results</td></tr>
                      ) : filtered.map(b => {
                        const sub  = subBadgeStyle(b.subscription_status, b.plan_expires_at);
                        const tClr = TYPE_COLORS[b.business_type] ?? TYPE_COLORS.other;
                        return (
                          <tr key={b.id} className="hover:bg-sabi-card/50 transition-colors">
                            <td className={`${tdCls} font-medium`}>{b.name || '—'}</td>
                            <td className={`${tdCls} text-sabi-muted`}>{b.email}</td>
                            <td className={tdCls}>
                              {b.business_type && (
                                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: tClr.bg, color: tClr.color }}>
                                  {TYPE_LABELS[b.business_type] ?? b.business_type}
                                </span>
                              )}
                            </td>
                            <td className={tdCls}>
                              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: sub.bg, color: sub.color }}>{sub.label}</span>
                            </td>
                            <td className={`${tdCls} text-sabi-muted`}>{b.whatsapp || '—'}</td>
                            <td className={`${tdCls} text-right`}>
                              {ratings[b.id] ? (
                                <span className="text-sabi-gold">★ {ratings[b.id].avg} <span className="text-sabi-muted text-xs font-normal">({ratings[b.id].count})</span></span>
                              ) : '—'}
                            </td>
                            <td className={`${tdCls} text-right`}>{b.booking_count}</td>
                            <td className={`${tdCls} text-right text-sabi-muted`}>{fmtTimestamp(b.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Recent bookings */}
            <section className="mb-12">
              <h2 className="font-serif text-2xl font-medium text-white flex items-center gap-3 mb-4">
                Recent Bookings
                <span className="font-sans text-xs font-bold text-sabi-gold bg-sabi-gold/12 px-2 py-0.5 rounded-full">last 20</span>
              </h2>
              <div className="bg-sabi-card border border-sabi-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>{['Client','Service','Business','Status','Appt. Date','Submitted'].map((h, i) => <th key={h} className={`${thCls} ${i >= 4 ? 'text-right' : ''}`}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {recentBookings.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-sabi-muted text-sm">No bookings yet</td></tr>
                      ) : recentBookings.map(b => (
                        <tr key={b.id} className="hover:bg-sabi-card/50 transition-colors border-b border-sabi-border/8">
                          <td className={tdCls}>
                            <span className="font-medium">{b.client_name}</span>
                            <br /><span className="text-sabi-muted text-xs">{b.client_phone}</span>
                          </td>
                          <td className={tdCls}>{b.service_name}</td>
                          <td className={tdCls}>{b.businesses?.name ?? '—'}</td>
                          <td className={tdCls}>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] ?? 'bg-sabi-border/20 text-sabi-muted'}`}>{b.status}</span>
                          </td>
                          <td className={`${tdCls} text-right text-sabi-muted`}>{fmtDateStr(b.date)}</td>
                          <td className={`${tdCls} text-right text-sabi-muted`}>{fmtTimestamp(b.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Top services */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-white flex items-center gap-3 mb-4">
                Top Services by Bookings
                <span className="font-sans text-xs font-bold text-sabi-gold bg-sabi-gold/12 px-2 py-0.5 rounded-full">top 10</span>
              </h2>
              <div className="bg-sabi-card border border-sabi-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>{['#','Service','Business','Price','Bookings'].map((h, i) => <th key={h} className={`${thCls} ${i >= 3 ? 'text-right' : ''}`}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {topServices.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-12 text-center text-sabi-muted text-sm">No services yet</td></tr>
                      ) : topServices.map((s, i) => (
                        <tr key={s.id} className="hover:bg-sabi-card/50 transition-colors border-b border-sabi-border/8">
                          <td className={`${tdCls} text-sabi-muted w-8`}>{i + 1}</td>
                          <td className={`${tdCls} font-medium`}>{s.name}</td>
                          <td className={`${tdCls} text-sabi-muted`}>{s.businesses?.name ?? '—'}</td>
                          <td className={`${tdCls} text-right`}>{fmtMoney(s.price)}</td>
                          <td className={`${tdCls} text-right font-black text-sabi-gold`}>{s.booking_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Affiliates */}
            <section className="mt-12">
              <h2 className="font-serif text-2xl font-medium text-white flex items-center gap-3 mb-4">
                Affiliates
                <span className="font-sans text-xs font-bold text-sabi-gold bg-sabi-gold/12 px-2 py-0.5 rounded-full">{affiliates.length}</span>
              </h2>
              <div className="bg-sabi-card border border-sabi-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>{['Code','Name','Phone','Signups','Pending','Payable','Owed','Paid to Date',''].map((h, i) => <th key={h || 'action'} className={`${thCls} ${i >= 3 && i <= 7 ? 'text-right' : ''}`}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {affiliates.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-12 text-center text-sabi-muted text-sm">No affiliates yet</td></tr>
                      ) : affiliates.map(a => (
                        <tr key={a.id} className="hover:bg-sabi-card/50 transition-colors border-b border-sabi-border/8">
                          <td className={`${tdCls} font-medium`}>{a.code}</td>
                          <td className={tdCls}>{a.name}{!a.active && <span className="ml-2 text-xs text-sabi-muted">(inactive)</span>}</td>
                          <td className={`${tdCls} text-sabi-muted`}>{a.phone || '—'}</td>
                          <td className={`${tdCls} text-right`}>{a.signups}</td>
                          <td className={`${tdCls} text-right text-sabi-muted`}>{a.pending}</td>
                          <td className={`${tdCls} text-right`}>{a.payable}</td>
                          <td className={`${tdCls} text-right font-black text-sabi-gold`}>{fmtMoney(a.owed)}</td>
                          <td className={`${tdCls} text-right text-sabi-muted`}>{fmtMoney(a.paidTotal)}</td>
                          <td className={`${tdCls} text-right`}>
                            <button
                              className="btn-outline py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-sabi-border disabled:hover:text-sabi-muted"
                              onClick={() => openPayoutModal(a)}
                              disabled={a.payable === 0}
                              title={a.payable === 0 ? 'Nothing payable right now' : 'Record a payout'}
                            >
                              Record payout
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-sabi-muted mt-2">
                A code's public status page: <span className="text-sabi-green">danda.ng/a/&lt;code&gt;</span>
              </p>
            </section>
          </>
        )}
      </main>

      {payoutModal && (
        <div className="fixed inset-0 z-[300] bg-sabi-dark/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-sabi-card border border-sabi-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-medium text-white">
                Record payout — {payoutModal.name}
              </h3>
              <button
                className="bg-transparent border-0 cursor-pointer text-sabi-muted hover:text-white p-1"
                onClick={closePayoutModal}
                disabled={payoutSubmitting}
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-sabi-muted mb-5">
              Covers all {payoutModal.payable} currently payable conversion{payoutModal.payable === 1 ? '' : 's'} for {payoutModal.code} — marks each as paid once recorded.
            </p>
            <form onSubmit={submitPayout} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Amount (₦)</label>
                <input
                  className="input-dark"
                  type="number"
                  min="1"
                  step="1"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Method</label>
                <input
                  className="input-dark"
                  type="text"
                  placeholder="Bank Transfer"
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Date</label>
                <input
                  className="input-dark"
                  type="date"
                  value={payoutDate}
                  onChange={e => setPayoutDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-sabi-muted uppercase tracking-wider mb-1.5">Note (transfer reference)</label>
                <input
                  className="input-dark"
                  type="text"
                  placeholder="GTB txn ref…"
                  value={payoutNote}
                  onChange={e => setPayoutNote(e.target.value)}
                />
              </div>
              {payoutErr && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {payoutErr}
                </div>
              )}
              <button
                className="btn-gold w-full justify-center py-3 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
                disabled={payoutSubmitting}
              >
                {payoutSubmitting && <Loader2 size={15} className="animate-spin" />}
                {payoutSubmitting ? 'Recording…' : 'Record Payout'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
