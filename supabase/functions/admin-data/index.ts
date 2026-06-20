import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  // ── 1. Verify caller is an admin ─────────────────────────────────────────
  // The admin password is stored as an Edge Function secret (ADMIN_PASSWORD),
  // set via: supabase secrets set ADMIN_PASSWORD=<value>
  // The frontend sends it as Bearer <password> — never as a VITE_ env var.
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const adminPassword = Deno.env.get('ADMIN_PASSWORD') ?? '';

  if (!token || !adminPassword || token !== adminPassword) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // ── 2. Build service-role client (server-side only) ──────────────────────
  // Supabase auto-injects SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
  // SERVICE_ROLE_KEY is a manually set fallback (Supabase rejects custom
  // secrets prefixed with SUPABASE_).
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SERVICE_ROLE_KEY') ??
    '';

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured — missing service key' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const DB = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── 3. Run privileged queries ─────────────────────────────────────────────
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      bizCountRes,
      bookingCountRes,
      clientCountRes,
      monthBizRes,
      activeSubsRes,
      bizDataRes,
      bizBookingIdsRes,
      recentBkgRes,
      servicesRes,
      allBkgRes,
      usersRes,
    ] = await Promise.all([
      DB.from('businesses').select('*', { count: 'exact', head: true }),
      DB.from('bookings').select('*', { count: 'exact', head: true }),
      DB.from('clients').select('*', { count: 'exact', head: true }),
      DB.from('businesses').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      DB.from('businesses').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active').gt('plan_expires_at', now.toISOString()),
      DB.from('businesses').select('*').order('created_at', { ascending: false }),
      DB.from('bookings').select('business_id'),
      DB.from('bookings').select('id, client_name, client_phone, service_name, status, date, created_at, businesses(name)').order('created_at', { ascending: false }).limit(20),
      DB.from('services').select('id, name, price, business_id, businesses(name)'),
      DB.from('bookings').select('service_name, business_id'),
      DB.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    // Reviews may not exist yet — catch independently like the original did
    let reviews: Array<{ business_id: string; rating: number }> = [];
    try {
      const { data: reviewRows } = await DB.from('reviews').select('business_id, rating');
      reviews = reviewRows ?? [];
    } catch { /* reviews table not yet created */ }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = (usersRes.data as any)?.users ?? [];

    return new Response(
      JSON.stringify({
        bizCount:        bizCountRes.count      ?? 0,
        bookingCount:    bookingCountRes.count   ?? 0,
        clientCount:     clientCountRes.count    ?? 0,
        monthBizCount:   monthBizRes.count       ?? 0,
        activeSubsCount: activeSubsRes.count     ?? 0,
        businesses:      bizDataRes.data         ?? [],
        bizBookingIds:   bizBookingIdsRes.data   ?? [],
        recentBookings:  recentBkgRes.data       ?? [],
        services:        servicesRes.data        ?? [],
        allBookings:     allBkgRes.data          ?? [],
        users,
        reviews,
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[admin-data] query error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load admin data' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
