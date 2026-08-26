-- Referral attribution for the commission-based affiliate campaign.
-- Purely additive — new table, new nullable columns, new triggers/function.
-- No existing policy, view, or column is touched, and nothing here is read
-- by the anon key except the one narrow RPC in section 4.
--
-- Run the sections in order; none of them depend on the payment-
-- verification fix (supabase/fix_payment_verification.sql) being applied
-- first, but that fix should already be live before any commission is
-- actually paid out, since paid conversions are read straight off
-- subscription_status/plan_expires_at.

-- ─── 1. affiliates ──────────────────────────────────────────────────────────
-- RLS enabled, deliberately zero policies — anon and authenticated have no
-- access whatsoever. The only readers are: the admin-data Edge Function
-- (service role, bypasses RLS entirely) and the two security-definer
-- functions below (run with their owner's privileges, not the caller's).
create table affiliates (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  phone      text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table affiliates enable row level security;

-- ─── 2. Referral columns on businesses ─────────────────────────────────────
alter table businesses
  add column referral_code_entered text,
  add column referred_by_affiliate_id uuid references affiliates(id);

-- ─── 3. Resolve the code server-side at signup — the client never queries
--        affiliates directly ──────────────────────────────────────────────
-- createBusiness() (src/lib/auth.js) writes whatever the signup form
-- captured — link param or manually typed — into referral_code_entered.
-- This trigger looks it up itself, as the function owner (security
-- definer), so no SELECT grant on affiliates is ever needed by anon or
-- authenticated. An unmatched code (typo, made up, inactive affiliate)
-- must never block signup — it just leaves referred_by_affiliate_id null.
create or replace function resolve_referral_code() returns trigger
security definer set search_path = public
language plpgsql as $$
begin
  if new.referral_code_entered is not null then
    select id into new.referred_by_affiliate_id
    from affiliates
    where upper(code) = upper(new.referral_code_entered) and active
    limit 1;
  end if;
  return new;
end;
$$;

create trigger businesses_resolve_referral
  before insert on businesses
  for each row execute function resolve_referral_code();

-- ─── 4. Referral attribution is permanently immutable ──────────────────────
-- No service_role exception, unlike lock_subscription_columns() in
-- fix_payment_verification.sql — that trigger *needs* an exception so the
-- verify-payment Edge Function can write. This one deliberately has none:
-- once referred_by_affiliate_id/referral_code_entered are set (or set to
-- null, i.e. no referrer) at insert time, no UPDATE from any role, through
-- any path the application exposes, can ever change them.
--
-- CORRECTING A GENUINE MISATTRIBUTION — the only way, and it is
-- intentionally outside the app:
--   1. alter table businesses disable trigger businesses_referral_immutable;
--   2. update businesses
--        set referred_by_affiliate_id = '<correct-affiliate-uuid>',
--            referral_code_entered    = '<code-for-audit-trail>'
--        where id = '<business-id>';
--   3. alter table businesses enable trigger businesses_referral_immutable;
-- Run only by someone with direct SQL access to the project, never as an
-- app code path — that immediacy is the point of the trigger.
create or replace function prevent_referral_change() returns trigger
language plpgsql as $$
begin
  if new.referred_by_affiliate_id is distinct from old.referred_by_affiliate_id
     or new.referral_code_entered is distinct from old.referral_code_entered then
    raise exception 'referral attribution is immutable once set';
  end if;
  return new;
end;
$$;

create trigger businesses_referral_immutable
  before update on businesses
  for each row execute function prevent_referral_change();

-- ─── 5. Anon-callable code validation — boolean + first name only ──────────
-- Codes are not confidential (agents read them aloud over WhatsApp), so
-- the risk being weighed here is a typo permanently costing an affiliate
-- their commission with no correction path (see section 4), not exposure
-- of the code itself. This returns the bare minimum needed to let the
-- signer confirm they've got the right agent — never phone, never the
-- affiliate id, never anything commission-related. Keep affiliate codes
-- non-sequential (see the example insert below) so this can't be used to
-- enumerate the roster.
create or replace function is_valid_referral_code(p_code text)
returns table(valid boolean, affiliate_first_name text)
security definer set search_path = public
language sql as $$
  select true, split_part(name, ' ', 1)
  from affiliates
  where upper(code) = upper(p_code) and active
  limit 1;
$$;

grant execute on function is_valid_referral_code(text) to anon, authenticated;

-- ─── 6. Adding affiliates ───────────────────────────────────────────────────
-- Copy, edit, and run one of these per new agent. Codes must be short but
-- non-sequential (not AGENT01, AGENT02, ...) — see the note in section 5.

-- insert into affiliates (code, name, phone) values ('KELV9X', 'Kelvin Uche', '2348012345678');

-- Seed affiliate for end-to-end testing — uncomment to create it.
-- insert into affiliates (code, name, phone) values ('DND7K2', 'Uzo Ohanusi', null);
