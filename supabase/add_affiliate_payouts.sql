-- Affiliate payouts: a ledger of what's been paid, and the two surfaces
-- that read it — the admin payout workflow and a public per-affiliate
-- status page. Purely additive except section 3 (two new businesses
-- columns), section 4 (a one-time backfill), and section 5 (a lock
-- trigger on those columns).
--
-- Commission rule (unambiguous, per product decision):
--   ₦4,000, one-time per business, earned when the business pays.
--   Self-referral is permitted — no special-casing anywhere here.
--   A conversion becomes PAYABLE 7 days after payment (matching the
--   refund window in the Terms) — before that it's PENDING, not owed.
--
-- Run the sections IN ORDER — section 4's backfill deliberately runs
-- before section 5's lock trigger exists, since that trigger would
-- otherwise reject the backfill's own UPDATE (see the note in section 5).

-- ─── 1. payouts ─────────────────────────────────────────────────────────────
-- Same RLS posture as affiliates (see add_referral_attribution.sql):
-- enabled, deliberately zero policies. The only readers/writers are the
-- admin-data / admin-record-payout Edge Functions (service role) and the
-- security-definer affiliate_status() RPC below.
create table payouts (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id),
  amount       integer not null,       -- naira, matches PRICING's convention (not kobo)
  paid_at      date not null default current_date,
  method       text not null,          -- e.g. "Bank Transfer", "Cash" — free text, not an enum
  note         text,                   -- free-text transfer reference, for reconciliation
  created_at   timestamptz not null default now()
);

alter table payouts enable row level security;

-- ─── 2. affiliate_id index ──────────────────────────────────────────────────
-- Every read below (admin sweep, public RPC) filters or joins on this.
create index payouts_affiliate_id_idx on payouts(affiliate_id);

-- ─── 3. Two new columns on businesses ──────────────────────────────────────
-- first_paid_at: stamped once, by paystackActivation.ts, only when it is
-- still null at activation time (COALESCE, never overwritten by a
-- renewal). This is deliberately NOT derived from plan_expires_at —
-- plan_expires_at moves forward on every renewal (anchored to whichever
-- is later: now, or the current still-future expiry), so
-- "plan_expires_at - 1 year" only equals the true first-payment date
-- until the first renewal, after which it drifts forward and would make
-- an already-payable conversion look newly pending again. The one-time
-- backfill in section 4 below is the sole sanctioned exception to
-- "derive, don't store" for this column, and it explains there why it's
-- safe exactly once.
--
-- payout_id: null = not yet paid out; set = this business's one-time
-- commission is covered by that payout. A business can reference at
-- most one payout (plain FK, not a join table), matching the rule that
-- commission is one-time per business — "what's still owed" is then
-- just `first_paid_at is not null and payout_id is null and
-- first_paid_at <= now() - interval '7 days'`, no arithmetic required.
alter table businesses
  add column first_paid_at timestamptz,
  add column payout_id     uuid references payouts(id);

-- ─── 4. ONE-TIME BACKFILL — run once, do not re-run ────────────────────────
-- Existing paid businesses (including the DND Studio conversion already
-- attributed to DND7K2) have first_paid_at = null today, since the column
-- didn't exist when they were activated — they would never become
-- payable without this. "plan_expires_at - 1 year" is EXACT for every
-- row today, because nothing has renewed yet (see the note in section 3
-- on why that stops being true after a renewal). Running this again
-- later, after any renewal has happened, would silently push a real
-- conversion's first_paid_at forward and reset its payable clock — that
-- is exactly the bug section 3 exists to prevent, and exactly what
-- section 5's lock trigger (created right after this, deliberately not
-- before) then makes structurally impossible to repeat by accident. This
-- is a point-in-time correction, not a repeatable migration.
update businesses
set first_paid_at = plan_expires_at - interval '1 year'
where subscription_status = 'active'
  and plan_expires_at is not null
  and first_paid_at is null;

-- ─── 5. Lock both new columns to service-role writes only ──────────────────
-- Otherwise "Owner update businesses" lets an owner set either from their
-- own authenticated session, same gap lock_subscription_columns() in
-- fix_payment_verification.sql closed for subscription_status /
-- plan_expires_at / paystack_reference. A dedicated trigger rather than
-- folding these into that one: different concern (commission bookkeeping
-- vs payment verification), and the two are deployed/reasoned about
-- independently. Created here, after section 4's backfill, precisely so
-- that one-time UPDATE runs unlocked and nothing after it can repeat it.
create or replace function lock_payout_columns() returns trigger as $$
begin
  if auth.role() <> 'service_role' and (
    new.first_paid_at is distinct from old.first_paid_at or
    new.payout_id     is distinct from old.payout_id
  ) then
    raise exception 'first_paid_at and payout_id can only be set by the payment/payout services';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger businesses_lock_payout_columns
  before update on businesses
  for each row execute function lock_payout_columns();

-- ─── 6. affiliate_status — anon-callable aggregates, no business detail ────
-- Follows the is_valid_referral_code pattern (add_referral_attribution.sql
-- section 5): security definer, so affiliates/businesses/payouts stay
-- unreadable by the anon key directly; an unknown code returns zero rows,
-- never an error. Counts only — never business names, emails, or any
-- other customer-identifying detail, since /a/:code is short enough to
-- guess and is meant to be shared openly.
--
-- Deliberately does NOT filter `and active`, unlike is_valid_referral_code
-- — the two checks mean different things. `active` gates whether a code
-- can attribute a *new* signup; it says nothing about whether money is
-- still owed for conversions it already earned. A deactivated affiliate's
-- link going dark while a balance is outstanding would look like the
-- balance was being hidden, not just that new signups were turned off.
--
-- KEEP THE 4000 BELOW IN SYNC WITH commissionPerReferral IN
-- src/config/pricing.js — this function can't import that file (it's a
-- Postgres function, not JS), so the amount is deliberately duplicated
-- here. If one changes, the admin dashboard and this page will silently
-- disagree about what's owed until the other is updated to match.
create or replace function affiliate_status(p_code text)
returns table(
  name              text,
  signups           bigint,
  paid_conversions  bigint,
  amount_owed       integer,
  amount_paid       integer
)
security definer set search_path = public
language sql as $$
  select
    a.name,
    count(b.id) filter (where b.referred_by_affiliate_id = a.id),
    count(b.id) filter (where b.first_paid_at is not null),
    (count(b.id) filter (
      where b.first_paid_at is not null
        and b.payout_id is null
        and b.first_paid_at <= now() - interval '7 days'
    ) * 4000)::integer,
    coalesce((select sum(p.amount) from payouts p where p.affiliate_id = a.id), 0)::integer
  from affiliates a
  left join businesses b on b.referred_by_affiliate_id = a.id
  where upper(a.code) = upper(p_code)
  group by a.id, a.name
  limit 1;
$$;

grant execute on function affiliate_status(text) to anon, authenticated;

-- ─── 7. Adding payouts ──────────────────────────────────────────────────────
-- Copy, edit, and run one of these per payout recorded outside the admin
-- dashboard (e.g. while the admin-record-payout Edge Function is not yet
-- deployed). Once that function is live, use the dashboard instead — it
-- also sweeps the covered businesses' payout_id, which a manual insert
-- here does not do for you.

-- insert into payouts (affiliate_id, amount, method, note)
--   values ('<affiliate-uuid>', 4000, 'Bank Transfer', 'GTB txn ref 000000000000');
