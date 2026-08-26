import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Keep in sync with src/config/pricing.js PRICING.promoPriceKobo / currency —
// a Deno Edge Function can't import from the Vite app, so this is a
// deliberate duplication, not an oversight.
const EXPECTED_AMOUNT_KOBO = 1440000;
const EXPECTED_CURRENCY = 'NGN';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // ── 1. Extract the caller's Supabase JWT ─────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return jsonResponse({ error: 'Missing authorization token' }, 401);

  // ── 2. Build service-role client ─────────────────────────────────────────
  // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.
  // PAYSTACK_SECRET_KEY is set manually (see deploy notes) and is only ever
  // read here, inside this Deno runtime — it is never bundled into the
  // browser app, unlike VITE_PAYSTACK_PUBLIC_KEY.
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SERVICE_ROLE_KEY') ??
    '';
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured — missing service key' }, 500);
  }
  if (!paystackSecretKey) {
    return jsonResponse({ error: 'Server misconfigured — missing Paystack secret key' }, 500);
  }

  const DB = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── 3. Verify the JWT and identify the caller ─────────────────────────────
  const { data: { user }, error: authError } = await DB.auth.getUser(token);
  if (authError || !user) {
    return jsonResponse({ error: 'Invalid or expired session' }, 401);
  }

  // ── 4. Parse and validate the request body ────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }
  const businessId = body?.businessId;
  const reference   = body?.reference;
  if (!businessId || !reference) {
    return jsonResponse({ error: 'businessId and reference are required' }, 400);
  }

  // ── 5. Confirm the caller owns this business ──────────────────────────────
  const { data: business, error: bizError } = await DB
    .from('businesses')
    .select('id, user_id, plan_expires_at, paystack_reference')
    .eq('id', businessId)
    .maybeSingle();

  if (bizError || !business) return jsonResponse({ error: 'Business not found' }, 404);
  if (business.user_id !== user.id) return jsonResponse({ error: 'Forbidden — not your business' }, 403);

  // ── 6. Idempotency — retrying with the same reference is always safe ──────
  if (business.paystack_reference === reference) {
    return jsonResponse({ success: true, plan_expires_at: business.plan_expires_at, alreadyProcessed: true });
  }

  // Reject if this reference is already attached to a DIFFERENT business
  // (belt-and-suspenders alongside the DB-level unique constraint).
  const { data: conflictRow } = await DB
    .from('businesses')
    .select('id')
    .eq('paystack_reference', reference)
    .neq('id', businessId)
    .maybeSingle();

  if (conflictRow) return jsonResponse({ error: 'This payment reference has already been used' }, 409);

  // ── 7. Verify the transaction with Paystack, server-side ──────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paystackData: any;
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
    });
    const json = await res.json();
    if (!res.ok || !json?.status) {
      console.error('[verify-payment] Paystack verify request failed:', json);
      return jsonResponse({ error: 'Could not verify payment with Paystack' }, 502);
    }
    paystackData = json.data;
  } catch (err) {
    console.error('[verify-payment] Paystack request threw:', err);
    return jsonResponse({ error: 'Could not reach Paystack' }, 502);
  }

  if (paystackData?.status !== 'success') {
    return jsonResponse({ error: 'Payment was not successful' }, 422);
  }
  if (paystackData?.amount !== EXPECTED_AMOUNT_KOBO || paystackData?.currency !== EXPECTED_CURRENCY) {
    console.error('[verify-payment] amount/currency mismatch:', paystackData?.amount, paystackData?.currency);
    return jsonResponse({ error: 'Payment amount does not match the expected plan price' }, 422);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaBusinessId = paystackData?.metadata?.custom_fields?.find(
    (f: any) => f.variable_name === 'business_id',
  )?.value;
  if (metaBusinessId !== businessId) {
    console.error('[verify-payment] business_id mismatch in metadata:', metaBusinessId, businessId);
    return jsonResponse({ error: 'Payment reference does not match this business' }, 422);
  }

  // ── 8. Compute the new expiry — extend from whichever is later: now, or
  //        the business's current (possibly still-future) expiry. This
  //        means renewing early never costs the owner the remaining days
  //        on their current plan. ──────────────────────────────────────────
  const now = new Date();
  const currentExpiry = business.plan_expires_at ? new Date(business.plan_expires_at) : null;
  const anchor = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(anchor);
  newExpiry.setFullYear(newExpiry.getFullYear() + 1);

  // ── 9. Activate — this write is only permitted because it runs as
  //        service_role; see lock_subscription_columns() in
  //        supabase/fix_payment_verification.sql. ───────────────────────────
  const { error: updateError } = await DB
    .from('businesses')
    .update({
      subscription_status: 'active',
      plan_expires_at: newExpiry.toISOString(),
      paystack_reference: reference,
    })
    .eq('id', businessId);

  if (updateError) {
    console.error('[verify-payment] activation write failed:', updateError);
    return jsonResponse({ error: 'Failed to activate subscription' }, 500);
  }

  return jsonResponse({ success: true, plan_expires_at: newExpiry.toISOString() });
});
