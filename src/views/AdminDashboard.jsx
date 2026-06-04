import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import SabiLogo from '../components/SabiLogo';

// ── Constants ─────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = 'beautyos_admin_2024';
const SESSION_KEY    = 'bos_admin_auth';

// A separate Supabase client using the service role key so it can bypass RLS
// and read bookings / clients across all businesses.
// SECURITY NOTE: VITE_* vars are bundled into the client-side JS. The service
// role key should only be used here, behind the password gate. Rotate the admin
// password after first deployment and consider moving to a server-side API route
// for production use.
const DB = (() => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTimestamp(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function fmtDateStr(s) {
  // Handles plain YYYY-MM-DD strings stored in the bookings.date text column.
  if (!s) return '—';
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB');
}

function fmtMoney(n) {
  return '₦' + (n || 0).toLocaleString();
}

// ── Business type display ─────────────────────────────────────────────────────

const TYPE_LABELS = {
  nail_studio:   'Nail Studio',
  lash_studio:   'Lash Studio',
  spa:           'Spa',
  barbershop:    'Barbershop',
  mua:           'MUA',
  other:         'Other',
  tailor:             'Tailor & Fashion',
  photography:        'Photography',
  home_services:      'Home Services',
  tutor:              'Private Tutor',
  fitness:            'Fitness & Wellness',
  events:             'Event Services',
  private_chef:       'Private Chef',
  content_creator:    'Content Creator',
  dj:                 'Music DJ',
  other_professional: 'Other Professional',
};

const TYPE_COLORS = {
  nail_studio:   { bg: 'rgba(192,82,111,0.09)',  color: '#c0526f' },
  lash_studio:   { bg: 'rgba(192,82,111,0.09)',  color: '#c0526f' },
  spa:           { bg: 'rgba(192,82,111,0.09)',  color: '#c0526f' },
  barbershop:    { bg: 'rgba(192,82,111,0.09)',  color: '#c0526f' },
  mua:           { bg: 'rgba(192,82,111,0.09)',  color: '#c0526f' },
  other:         { bg: 'rgba(192,82,111,0.09)',  color: '#c0526f' },
  tailor:             { bg: 'rgba(99,102,241,0.1)',   color: '#4338ca' },
  photography:        { bg: 'rgba(217,119,6,0.1)',    color: '#b45309' },
  home_services:      { bg: 'rgba(20,184,166,0.1)',   color: '#0f766e' },
  tutor:              { bg: 'rgba(59,130,246,0.1)',   color: '#1d4ed8' },
  fitness:            { bg: 'rgba(234,88,12,0.1)',    color: '#c2410c' },
  events:             { bg: 'rgba(168,85,247,0.1)',   color: '#7c3aed' },
  private_chef:       { bg: 'rgba(16,185,129,0.1)',   color: '#059669' },
  content_creator:    { bg: 'rgba(239,68,68,0.1)',    color: '#dc2626' },
  dj:                 { bg: 'rgba(14,165,233,0.1)',   color: '#0284c7' },
  other_professional: { bg: 'rgba(45,27,27,0.08)',    color: 'rgba(45,27,27,0.5)' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background:    accent ? 'rgba(245, 200, 66, 0.08)' : '#0F3D22',
      border:        `1px solid ${accent ? 'rgba(245,200,66,0.2)' : 'rgba(76,175,114,0.15)'}`,
      borderRadius:  6,
      padding:       '22px 20px 18px',
    }}>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(122,174,144,0.8)', marginBottom: 10 }}>
        {label}
      </p>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: '#F5C842', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colours = {
    confirmed: { bg: 'rgba(22,163,74,0.1)',   color: '#15803d' },
    pending:   { bg: 'rgba(217,119,6,0.1)',   color: '#b45309' },
    cancelled: { bg: 'rgba(201,68,68,0.08)',  color: '#c94444' },
  };
  const c = colours[status] ?? { bg: 'rgba(45,27,27,0.08)', color: 'rgba(45,27,27,0.5)' };
  return (
    <span style={{
      fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700,
      letterSpacing: '0.8px', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 3,
      background: c.bg, color: c.color,
    }}>
      {status}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);

  const [loading, setLoading]               = useState(false);
  const [loadError, setLoadError]           = useState('');
  const [stats, setStats]                   = useState(null);
  const [businesses, setBusinesses]         = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [topServices, setTopServices]       = useState([]);
  const [search, setSearch]                 = useState('');

  // ── Auth ──────────────────────────────────────────────────
  function handleLogin(e) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput('');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setStats(null);
    setBusinesses([]);
    setRecentBookings([]);
    setTopServices([]);
  }

  // ── Data loading ──────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    if (!DB) {
      setLoadError('VITE_SUPABASE_SERVICE_KEY is not set. Add it to .env.local and restart the dev server.');
      return;
    }
    load();
  }, [authed]);

  async function load() {
    setLoading(true);
    setLoadError('');
    try {
      const now          = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fire all queries in parallel
      const [
        bizCountRes,
        bookingCountRes,
        clientCountRes,
        monthBizRes,
        bizDataRes,
        bizBookingIdsRes,
        recentBkgRes,
        servicesRes,
        allBkgRes,
        usersRes,
      ] = await Promise.all([
        DB.from('businesses').select('*', { count: 'exact', head: true }),
        DB.from('bookings').select('*',   { count: 'exact', head: true }),
        DB.from('clients').select('*',    { count: 'exact', head: true }),
        DB.from('businesses').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        DB.from('businesses').select('*').order('created_at', { ascending: false }),
        DB.from('bookings').select('business_id'),
        DB.from('bookings')
          .select('id, client_name, client_phone, service_name, status, date, created_at, businesses(name)')
          .order('created_at', { ascending: false })
          .limit(20),
        DB.from('services').select('id, name, price, business_id, businesses(name)'),
        DB.from('bookings').select('service_name, business_id'),
        DB.auth.admin.listUsers({ perPage: 1000 }),
      ]);

      // email map: user_id → email
      const emailMap = {};
      (usersRes.data?.users ?? []).forEach(u => {
        if (u.id) emailMap[u.id] = u.email ?? '—';
      });

      // booking count per business
      const bizBkgMap = {};
      (bizBookingIdsRes.data ?? []).forEach(b => {
        bizBkgMap[b.business_id] = (bizBkgMap[b.business_id] || 0) + 1;
      });

      // booking count per service (keyed by business_id::service_name)
      const svcBkgMap = {};
      (allBkgRes.data ?? []).forEach(b => {
        const k = `${b.business_id}::${b.service_name}`;
        svcBkgMap[k] = (svcBkgMap[k] || 0) + 1;
      });

      const top10 = (servicesRes.data ?? [])
        .map(s => ({ ...s, booking_count: svcBkgMap[`${s.business_id}::${s.name}`] || 0 }))
        .sort((a, b) => b.booking_count - a.booking_count)
        .slice(0, 10);

      setStats({
        totalBiz:      bizCountRes.count     ?? 0,
        totalBookings: bookingCountRes.count  ?? 0,
        totalClients:  clientCountRes.count   ?? 0,
        monthBiz:      monthBizRes.count      ?? 0,
      });

      setBusinesses((bizDataRes.data ?? []).map(b => ({
        ...b,
        email:         emailMap[b.user_id]   ?? '—',
        booking_count: bizBkgMap[b.id]       ?? 0,
      })));

      setRecentBookings(recentBkgRes.data ?? []);
      setTopServices(top10);
    } catch (err) {
      console.error('[Admin] load failed:', err);
      setLoadError('Failed to load data. Check console for details.');
    }
    setLoading(false);
  }

  // ── Filtered businesses ───────────────────────────────────
  const filtered = businesses.filter(b => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      b.name?.toLowerCase().includes(q)       ||
      b.email?.toLowerCase().includes(q)      ||
      b.owner_name?.toLowerCase().includes(q)
    );
  });

  // ── Render: password gate ─────────────────────────────────
  if (!authed) {
    return (
      <div style={S.gate}>
        <form style={S.gateCard} onSubmit={handleLogin}>
          <div style={S.gateBrand}><SabiLogo size="md" dark={true} /></div>
          <h1 style={S.gateTitle}>Admin Access</h1>
          <p style={S.gateSub}>This area is restricted to authorised users.</p>
          <input
            style={{ ...S.gateInput, ...(pwError ? S.gateInputErr : {}) }}
            type="password"
            placeholder="Enter admin password"
            value={pwInput}
            autoFocus
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
          />
          {pwError && <p style={S.gateError}>Incorrect password. Try again.</p>}
          <button style={S.gateBtn} type="submit">Enter Dashboard</button>
        </form>
      </div>
    );
  }

  // ── Render: dashboard ─────────────────────────────────────
  return (
    <div style={S.root}>

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <SabiLogo size="md" dark={true} />
            <span style={S.headerLabel}>Admin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={S.refreshBtn} onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button style={S.logoutBtn} onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>

      <main style={S.main}>

        {loadError && (
          <div style={S.errorBanner}>{loadError}</div>
        )}

        {loading && !stats ? (
          <div style={S.loadingMsg}>Loading dashboard data…</div>
        ) : (
          <>
            {/* ── Section 1: Stats ─────────────────────── */}
            <section style={S.section}>
              <h2 style={S.sectionTitle}>Overview</h2>
              <div style={S.statsGrid}>
                <StatCard label="Total Businesses"        value={stats?.totalBiz      ?? '—'} />
                <StatCard label="New This Month"          value={stats?.monthBiz      ?? '—'} accent />
                <StatCard label="Total Bookings (All)"    value={stats?.totalBookings ?? '—'} />
                <StatCard label="Total Clients (All)"     value={stats?.totalClients  ?? '—'} />
              </div>
            </section>

            {/* ── Section 2: Businesses ────────────────── */}
            <section style={S.section}>
              <div style={S.sectionHead}>
                <h2 style={S.sectionTitle}>
                  Registered Businesses
                  <span style={S.count}>{filtered.length}</span>
                </h2>
                <input
                  style={S.search}
                  placeholder="Search name, email, owner…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <Th>Business Name</Th>
                      <Th>Owner Email</Th>
                      <Th>Type</Th>
                      <Th>WhatsApp</Th>
                      <Th right>Bookings</Th>
                      <Th right>Registered</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} style={S.emptyCell}>No results</td></tr>
                    ) : filtered.map(b => (
                      <tr key={b.id} style={S.tr}>
                        <td style={{ ...S.td, ...S.tdStrong }}>{b.name || '—'}</td>
                        <td style={S.td}>{b.email}</td>
                        <td style={S.td}>
                          {b.business_type ? (
                            <span style={{
                              ...S.typeTag,
                              background: (TYPE_COLORS[b.business_type] ?? TYPE_COLORS.other).bg,
                              color:      (TYPE_COLORS[b.business_type] ?? TYPE_COLORS.other).color,
                            }}>
                              {TYPE_LABELS[b.business_type] ?? b.business_type}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={S.td}>{b.whatsapp || '—'}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{b.booking_count}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{fmtTimestamp(b.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Section 3: Recent bookings ───────────── */}
            <section style={S.section}>
              <h2 style={S.sectionTitle}>
                Recent Bookings
                <span style={S.count}>last 20</span>
              </h2>
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <Th>Client</Th>
                      <Th>Service</Th>
                      <Th>Business</Th>
                      <Th>Status</Th>
                      <Th right>Appt. Date</Th>
                      <Th right>Submitted</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.length === 0 ? (
                      <tr><td colSpan={6} style={S.emptyCell}>No bookings yet</td></tr>
                    ) : recentBookings.map(b => (
                      <tr key={b.id} style={S.tr}>
                        <td style={S.td}>
                          <span style={S.tdStrong}>{b.client_name}</span>
                          <br />
                          <span style={S.tdMuted}>{b.client_phone}</span>
                        </td>
                        <td style={S.td}>{b.service_name}</td>
                        <td style={S.td}>{b.businesses?.name ?? '—'}</td>
                        <td style={S.td}><StatusBadge status={b.status} /></td>
                        <td style={{ ...S.td, ...S.tdNum }}>{fmtDateStr(b.date)}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{fmtTimestamp(b.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Section 4: Top services ──────────────── */}
            <section style={{ ...S.section, marginBottom: 0 }}>
              <h2 style={S.sectionTitle}>
                Top Services by Bookings
                <span style={S.count}>top 10</span>
              </h2>
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <Th>Service</Th>
                      <Th>Business</Th>
                      <Th right>Price</Th>
                      <Th right>Bookings</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {topServices.length === 0 ? (
                      <tr><td colSpan={5} style={S.emptyCell}>No services yet</td></tr>
                    ) : topServices.map((s, i) => (
                      <tr key={s.id} style={S.tr}>
                        <td style={{ ...S.td, ...S.tdMuted, width: 32 }}>{i + 1}</td>
                        <td style={{ ...S.td, ...S.tdStrong }}>{s.name}</td>
                        <td style={S.td}>{s.businesses?.name ?? '—'}</td>
                        <td style={{ ...S.td, ...S.tdNum }}>{fmtMoney(s.price)}</td>
                        <td style={{ ...S.td, ...S.tdNum, fontWeight: 700, color: '#F5C842' }}>{s.booking_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// ── Table header helper ───────────────────────────────────────────────────────
function Th({ children, right }) {
  return (
    <th style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
      color: 'rgba(122,174,144,0.8)', padding: '11px 16px',
      textAlign: right ? 'right' : 'left',
      borderBottom: '1px solid rgba(76,175,114,0.15)',
      whiteSpace: 'nowrap', background: '#1A5C30',
    }}>
      {children}
    </th>
  );
}

// ── Styles object ─────────────────────────────────────────────────────────────
const S = {
  // Password gate
  gate: {
    minHeight: '100vh', background: '#0A2E1A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  gateCard: {
    background: '#0F3D22', border: '1px solid rgba(76,175,114,0.2)',
    borderRadius: 8, padding: '40px 36px',
    display: 'flex', flexDirection: 'column', gap: 14,
    width: '100%', maxWidth: 380,
  },
  gateBrand: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 26, fontWeight: 500, color: '#F5C842',
    letterSpacing: '-0.3px', margin: 0,
  },
  gateTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28, fontWeight: 500, color: '#FFFFFF', margin: 0,
  },
  gateSub: {
    fontSize: 13, color: '#7AAE90', margin: 0,
  },
  gateInput: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, color: '#FFFFFF',
    background: '#0A2E1A', border: '1px solid #1A5C30',
    borderRadius: 4, padding: '10px 12px', outline: 'none',
  },
  gateInputErr: {
    borderColor: '#c94444', background: '#0A2E1A',
  },
  gateError: {
    fontSize: 13, color: '#c94444', margin: 0,
  },
  gateBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 700, color: '#0A2E1A',
    background: '#F5C842', border: 'none', borderRadius: 4,
    padding: '11px 0', cursor: 'pointer',
  },

  // Dashboard shell
  root: {
    minHeight: '100vh', background: '#0A2E1A',
    fontFamily: "'DM Sans', sans-serif", color: '#FFFFFF',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: '#0F3D22', boxShadow: '0 1px 0 rgba(76,175,114,0.15)',
  },
  headerInner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 24px',
    height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerBrand: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22, fontWeight: 500, color: '#F5C842', letterSpacing: '-0.3px',
  },
  headerLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: '#0A2E1A',
    background: '#F5C842', padding: '3px 8px', borderRadius: 3,
  },
  refreshBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 500, color: '#7AAE90',
    background: 'none', border: '1px solid rgba(76,175,114,0.25)',
    borderRadius: 3, padding: '5px 12px', cursor: 'pointer',
  },
  logoutBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 500, color: 'rgba(122,174,144,0.7)',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  },
  main: {
    maxWidth: 1100, margin: '0 auto', padding: '32px 24px 72px',
  },
  loadingMsg: {
    textAlign: 'center', padding: '80px 0',
    fontSize: 14, color: '#7AAE90',
  },
  errorBanner: {
    background: 'rgba(201,68,68,0.07)', border: '1px solid rgba(201,68,68,0.2)',
    borderRadius: 6, padding: '12px 16px',
    fontSize: 13, color: '#c94444', marginBottom: 24,
  },

  // Sections
  section: { marginBottom: 48 },
  sectionHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 16, flexWrap: 'wrap', marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 26, fontWeight: 500, color: '#FFFFFF',
    margin: 0, display: 'flex', alignItems: 'center', gap: 10,
  },
  count: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11, fontWeight: 600, color: '#F5C842',
    background: 'rgba(245,200,66,0.12)', padding: '2px 8px', borderRadius: 10,
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14, marginTop: 16,
  },

  // Search
  search: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, color: '#FFFFFF',
    background: '#0F3D22', border: '1px solid rgba(76,175,114,0.2)',
    borderRadius: 4, padding: '8px 12px', outline: 'none',
    minWidth: 220,
  },

  // Tables
  tableWrap: {
    marginTop: 16,
    background: '#0F3D22', border: '1px solid rgba(76,175,114,0.15)',
    borderRadius: 6, overflowX: 'auto',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  },
  tr: { borderBottom: '1px solid rgba(76,175,114,0.08)' },
  td: {
    padding: '12px 16px', color: '#FFFFFF',
    verticalAlign: 'middle',
  },
  tdStrong: { fontWeight: 500 },
  tdMuted:  { color: '#7AAE90', fontSize: 12 },
  tdNum:    { textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  emptyCell: {
    padding: '40px 20px', textAlign: 'center',
    color: '#7AAE90', fontSize: 14,
  },
  typeTag: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10, fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase',
    background: 'rgba(76,175,114,0.12)', color: '#4CAF72',
    padding: '2px 7px', borderRadius: 3,
  },
};
