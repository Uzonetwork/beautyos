-- Payment verification lockdown + plan_expires_at timezone fix.
--
-- Prerequisite: deploy supabase/functions/verify-payment and set its
-- PAYSTACK_SECRET_KEY secret (see that function's deploy notes) before
-- relying on this — until then, section 3 below will correctly block the
-- app's own renewal flow too, since nothing else is left that can write
-- these columns.
--
-- Run the sections in order. Section 1 is read-only — run it and read the
-- output before running section 4. Do not skip it.

-- ─── 1. PREFLIGHT — run first, read the output ─────────────────────────────
-- The 7 businesses currently marked active were activated by hand before
-- this fix existed, so any paystack_reference values they carry are not
-- real Paystack references. Section 4 adds a uniqueness constraint on
-- paystack_reference; it will fail outright if two rows share a non-null
-- value. Confirm this returns zero rows before proceeding. If it doesn't,
-- resolve each conflicting row by hand (e.g. null out the fake value) —
-- this file does not do that for you, since it's touching data outside
-- what a migration script should decide on its own.
select paystack_reference, count(*), array_agg(id) as business_ids
from businesses
where paystack_reference is not null
group by paystack_reference
having count(*) > 1;

-- ─── 2. Fix plan_expires_at's timezone ambiguity ───────────────────────────
-- plan_expires_at is `timestamp without time zone` holding a UTC wall-clock
-- value — written via expiresAt.toISOString(), whose 'Z' offset Postgres
-- has always silently discarded on insert into a column of this type
-- rather than converting by it (see add_businesses_public_view.sql for the
-- same note, made when that view's is_active check was written). The
-- existing rows are therefore already correct UTC values; this cast does
-- not change what moment in time any of them represent — it only changes
-- the column's type so PostgREST starts serializing an explicit offset.
--
-- That's what actually fixes the bug: src/lib/payments.js's
-- isSubscriptionActive() and daysUntilExpiry() parse the value with plain
-- `new Date(...)`, which reads an offset-less string as browser-local time
-- instead of UTC. Once the column is timestamptz, the string PostgREST
-- sends always carries an explicit UTC offset, so `new Date()` parses it
-- correctly everywhere — no application code change is needed alongside
-- this migration.
alter table businesses
  alter column plan_expires_at type timestamptz
  using plan_expires_at at time zone 'UTC';

-- businesses_public's is_active previously had to cast plan_expires_at to
-- timestamptz explicitly before comparing to now(). Now that the column
-- already is timestamptz, that cast is not just redundant but actively
-- wrong — applying `at time zone 'UTC'` to a timestamptz value converts it
-- to a naive local-clock timestamp, which would silently reintroduce the
-- same ambiguity in reverse. Recreate the view without it.
create or replace view businesses_public
  with (security_invoker = false)
  as
  select
    id,
    name,
    owner_name,
    tagline,
    business_type,
    custom_business_type,
    avatar_url,
    whatsapp,
    city,
    state,
    slug,
    avg_rating,
    rating_count,
    created_at,
    (
      subscription_status = 'active'
      and plan_expires_at is not null
      and plan_expires_at > now()
    ) as is_active
  from businesses;

-- ─── 3. Lock subscription_status / plan_expires_at / paystack_reference to
--        the service role only ────────────────────────────────────────────
-- Today "Owner update businesses" lets an owner's own authenticated
-- session write any column on their own row — including these three,
-- from a browser console, for free, right now. This trigger closes that:
-- any UPDATE touching one of these columns is rejected unless the request
-- is running as service_role, which only the verify-payment Edge Function
-- ever uses. auth.role() reads the `role` claim PostgREST sets per
-- request (service_role for that function's service client, authenticated
-- for an owner's own session) — it holds regardless of what the client
-- sends, since it's derived from the JWT the request authenticated with,
-- not from anything the request body claims.
create or replace function lock_subscription_columns() returns trigger as $$
begin
  if auth.role() <> 'service_role' and (
    new.subscription_status is distinct from old.subscription_status or
    new.plan_expires_at    is distinct from old.plan_expires_at or
    new.paystack_reference is distinct from old.paystack_reference
  ) then
    raise exception 'subscription_status, plan_expires_at, and paystack_reference can only be set by the payment verification service';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists businesses_lock_subscription_columns on businesses;
create trigger businesses_lock_subscription_columns
  before update on businesses
  for each row execute function lock_subscription_columns();

-- ─── 4. Prevent one Paystack reference from activating two businesses ─────
-- Nullable-safe: Postgres unique constraints never consider two NULLs
-- equal to each other, so this only constrains rows that carry a real
-- reference. Do not run this until section 1's query returns zero rows.
alter table businesses
  add constraint businesses_paystack_reference_unique unique (paystack_reference);
