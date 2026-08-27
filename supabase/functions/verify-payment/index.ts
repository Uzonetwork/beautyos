import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractBusinessId, activatePaystackTransaction } from '../_shared/paystackActivation.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

  // ── 5. Confirm the caller owns the business they're claiming to activate ──
  const { data: business, error: bizError } = await DB
    .from('businesses')
    .select('id, user_id')
    .eq('id', businessId)
    .maybeSingle();

  if (bizError || !business) return jsonResponse({ error: 'Business not found' }, 404);
  if (business.user_id !== user.id) return jsonResponse({ error: 'Forbidden — not your business' }, 403);

  // ── 6. Verify the transaction with Paystack, server-side ──────────────────
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

  // ── 7. The transaction must genuinely belong to the business the caller
  //        owns — otherwise a caller could "confirm" an arbitrary
  //        stranger's reference just by pairing it with their own
  //        (already ownership-verified) businessId. ─────────────────────────
  const derivedBusinessId = extractBusinessId(paystackData);
  if (derivedBusinessId !== businessId) {
    console.error('[verify-payment] business_id mismatch:', derivedBusinessId, businessId);
    return jsonResponse({ error: 'Payment reference does not match this business' }, 422);
  }

  // ── 8. Amount/currency check, idempotency, expiry anchoring, and the
  //        service-role write are all shared with paystack-webhook — see
  //        supabase/functions/_shared/paystackActivation.ts. ────────────────
  const result = await activatePaystackTransaction(DB, paystackData);
  return jsonResponse(result.body, result.status);
});
