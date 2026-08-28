// Records a payout to an affiliate and sweeps every currently-payable,
// not-yet-paid conversion of theirs onto it in the same request — a
// full sweep, not per-conversion selection, since at this scale (a
// handful of affiliates, paid by hand) partial payout UI is complexity
// nobody would use. See supabase/add_affiliate_payouts.sql for the
// payable rule (first_paid_at set, 7+ days ago, payout_id still null)
// and the schema this writes to.
//
// Mirrors admin-data/index.ts's auth boilerplate exactly (JWT → admin_users
// check) but is a separate function rather than a second verb on
// admin-data, matching this codebase's one-function-per-write-action
// pattern (verify-payment / paystack-webhook are likewise single-purpose).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // ── 1. Extract the caller's Supabase JWT ─────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return jsonResponse({ error: 'Missing authorization token' }, 401);
  }

  // ── 2. Build service-role client ─────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SERVICE_ROLE_KEY') ??
    '';

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured — missing service key' }, 500);
  }

  const DB = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── 3. Verify the JWT and identify the caller ─────────────────────────────
  const { data: { user }, error: authError } = await DB.auth.getUser(token);

  if (authError || !user) {
    return jsonResponse({ error: 'Invalid or expired session' }, 401);
  }

  // ── 4. Confirm the caller exists in admin_users ───────────────────────────
  const { data: adminRow } = await DB
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    return jsonResponse({ error: 'Forbidden — not an admin' }, 403);
  }

  // ── 5. Parse and validate the request body ────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { affiliate_id, amount, method, note, paid_at } = body ?? {};

  if (typeof affiliate_id !== 'string' || !affiliate_id) {
    return jsonResponse({ error: 'affiliate_id is required' }, 400);
  }
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    return jsonResponse({ error: 'amount must be a positive integer (naira)' }, 400);
  }
  if (typeof method !== 'string' || !method.trim()) {
    return jsonResponse({ error: 'method is required' }, 400);
  }

  const { data: affiliate } = await DB
    .from('affiliates')
    .select('id')
    .eq('id', affiliate_id)
    .maybeSingle();

  if (!affiliate) {
    return jsonResponse({ error: 'Unknown affiliate_id' }, 404);
  }

  // ── 6. Insert the payout ────────────────────────────────────────────────
  const insertRow: Record<string, unknown> = {
    affiliate_id,
    amount,
    method: method.trim(),
    note: typeof note === 'string' && note.trim() ? note.trim() : null,
  };
  if (typeof paid_at === 'string' && paid_at) insertRow.paid_at = paid_at;

  const { data: payout, error: payoutError } = await DB
    .from('payouts')
    .insert(insertRow)
    .select()
    .single();

  if (payoutError || !payout) {
    console.error('[admin-record-payout] insert failed:', payoutError);
    return jsonResponse({ error: 'Failed to record payout' }, 500);
  }

  // ── 7. Sweep every currently-payable, unpaid conversion onto it ─────────
  // Same payable rule as affiliate_status() in add_affiliate_payouts.sql:
  // first_paid_at set, 7+ days ago, payout_id still null.
  const payableCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: sweptBusinesses, error: sweepError } = await DB
    .from('businesses')
    .update({ payout_id: payout.id })
    .eq('referred_by_affiliate_id', affiliate_id)
    .is('payout_id', null)
    .not('first_paid_at', 'is', null)
    .lte('first_paid_at', payableCutoff)
    .select('id');

  if (sweepError) {
    // The payout row is already recorded — surface this loudly rather than
    // rolling back, since the admin needs to know money was logged but the
    // conversions it covers weren't marked, not have it silently vanish.
    console.error('[admin-record-payout] sweep failed:', sweepError);
    return jsonResponse({ error: 'Payout recorded but marking covered conversions failed — check manually', payout }, 500);
  }

  return jsonResponse({ success: true, payout, coveredCount: sweptBusinesses?.length ?? 0 });
});
