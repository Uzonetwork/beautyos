import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { signIn, signOut, getSession } from '../lib/auth';
import SabiLogo from '../components/SabiLogo';

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`;

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
  const [search,         setSearch]         = useState('');

  // On mount: reuse an existing Supabase session if present
  useEffect(() => {
    async function init() {
      const session = await getSession();
      if (session?.access_token) {
        await load(session.access_token);
      } else {
        setView('login');
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoginLoading(true);
    setLoginErr('');
    try {
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
          </>
        )}
      </main>
    </div>
  );
}
