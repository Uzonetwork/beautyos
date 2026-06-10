import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import SabiLogo from '../components/SabiLogo';

const ADMIN_PASSWORD = 'beautyos_admin_2024';
const SESSION_KEY    = 'bos_admin_auth';

const DB = (() => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
})();

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
  const [authed,  setAuthed]  = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);

  const [loading,        setLoading]        = useState(false);
  const [loadError,      setLoadError]      = useState('');
  const [stats,          setStats]          = useState(null);
  const [businesses,     setBusinesses]     = useState([]);
  const [ratings,        setRatings]        = useState({});
  const [recentBookings, setRecentBookings] = useState([]);
  const [topServices,    setTopServices]    = useState([]);
  const [search,         setSearch]         = useState('');

  function handleLogin(e) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) { sessionStorage.setItem(SESSION_KEY, '1'); setAuthed(true); setPwError(false); }
    else { setPwError(true); setPwInput(''); }
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY); setAuthed(false);
    setStats(null); setBusinesses([]); setRecentBookings([]); setTopServices([]);
  }

  useEffect(() => {
    if (!authed) return;
    if (!DB) { setLoadError('VITE_SUPABASE_SERVICE_KEY is not set. Add it to .env.local and restart the dev server.'); return; }
    load();
  }, [authed]);

  async function load() {
    setLoading(true); setLoadError('');
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [bizCountRes, bookingCountRes, clientCountRes, monthBizRes, activeSubsRes, bizDataRes, bizBookingIdsRes, recentBkgRes, servicesRes, allBkgRes, usersRes] = await Promise.all([
        DB.from('businesses').select('*', { count: 'exact', head: true }),
        DB.from('bookings').select('*',   { count: 'exact', head: true }),
        DB.from('clients').select('*',    { count: 'exact', head: true }),
        DB.from('businesses').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        DB.from('businesses').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active').gt('plan_expires_at', now.toISOString()),
        DB.from('businesses').select('*').order('created_at', { ascending: false }),
        DB.from('bookings').select('business_id'),
        DB.from('bookings').select('id, client_name, client_phone, service_name, status, date, created_at, businesses(name)').order('created_at', { ascending: false }).limit(20),
        DB.from('services').select('id, name, price, business_id, businesses(name)'),
        DB.from('bookings').select('service_name, business_id'),
        DB.auth.admin.listUsers({ perPage: 1000 }),
      ]);

      const emailMap = {};
      (usersRes.data?.users ?? []).forEach(u => { if (u.id) emailMap[u.id] = u.email ?? '—'; });

      const bizBkgMap = {};
      (bizBookingIdsRes.data ?? []).forEach(b => { bizBkgMap[b.business_id] = (bizBkgMap[b.business_id] || 0) + 1; });

      const svcBkgMap = {};
      (allBkgRes.data ?? []).forEach(b => { const k = `${b.business_id}::${b.service_name}`; svcBkgMap[k] = (svcBkgMap[k] || 0) + 1; });

      const top10 = (servicesRes.data ?? []).map(s => ({ ...s, booking_count: svcBkgMap[`${s.business_id}::${s.name}`] || 0 })).sort((a, b) => b.booking_count - a.booking_count).slice(0, 10);

      setStats({ totalBiz: bizCountRes.count ?? 0, totalBookings: bookingCountRes.count ?? 0, totalClients: clientCountRes.count ?? 0, monthBiz: monthBizRes.count ?? 0, activeSubs: activeSubsRes.count ?? 0 });
      setBusinesses((bizDataRes.data ?? []).map(b => ({ ...b, email: emailMap[b.user_id] ?? '—', booking_count: bizBkgMap[b.id] ?? 0 })));
      setRecentBookings(recentBkgRes.data ?? []);
      setTopServices(top10);

      try {
        const { data: reviewRows } = await DB.from('reviews').select('business_id, rating');
        if (reviewRows?.length) {
          const acc = {};
          reviewRows.forEach(r => { if (!acc[r.business_id]) acc[r.business_id] = { sum: 0, count: 0 }; acc[r.business_id].sum += r.rating; acc[r.business_id].count += 1; });
          const avgMap = {};
          Object.entries(acc).forEach(([id, v]) => { avgMap[id] = { avg: +(v.sum / v.count).toFixed(1), count: v.count }; });
          setRatings(avgMap);
        }
      } catch { /* reviews table not yet created */ }
    } catch (err) {
      console.error('[Admin] load failed:', err);
      setLoadError('Failed to load data. Check console for details.');
    }
    setLoading(false);
  }

  const filtered = businesses.filter(b => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return b.name?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q) || b.owner_name?.toLowerCase().includes(q);
  });

  // ── Password gate ─────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-sabi-dark flex items-center justify-center px-4">
        <form className="w-full max-w-sm bg-sabi-card border border-sabi-border rounded-2xl p-8 flex flex-col gap-4" onSubmit={handleLogin}>
          <button type="button" onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0 self-start">
            <SabiLogo size="md" />
          </button>
          <h1 className="font-serif text-3xl font-medium text-white">Admin Access</h1>
          <p className="text-sabi-muted text-sm">This area is restricted to authorised users.</p>
          <input
            className={`w-full bg-sabi-dark border rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-sabi-muted ${pwError ? 'border-red-500' : 'border-sabi-border focus:border-sabi-green'}`}
            type="password"
            placeholder="Enter admin password"
            value={pwInput}
            autoFocus
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
          />
          {pwError && <p className="text-red-400 text-sm">Incorrect password. Try again.</p>}
          <button className="btn-gold w-full justify-center py-3" type="submit">Enter Dashboard</button>
        </form>
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
            <button className="text-sabi-muted text-sm border border-sabi-border px-3 py-1.5 rounded-lg hover:text-white hover:border-sabi-green transition-colors bg-transparent cursor-pointer" onClick={load} disabled={loading}>
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
