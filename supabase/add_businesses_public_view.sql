-- PHASE 1 of 3 — businesses RLS lockdown. Purely additive, safe to run
-- immediately: adds new objects only, touches no existing policy or
-- column. The currently-deployed app code keeps working unchanged
-- against the old "Public read businesses" policy.
--
-- Deploy order:
--   1. THIS FILE — run first, any time.
--   2. App code deploy that switches anon-facing reads to
--      businesses_public (see PublicView.jsx, MarketplaceView.jsx,
--      App.jsx, auth.js, api/sitemap.js). Verify in production.
--   3. supabase/lock_businesses_table.sql — drops the old public
--      policy and the pin column. Do not run until step 2 is verified
--      live; it is destructive and would break any code still reading
--      businesses directly with the anon key.

-- Column-scoped public read surface for anon/authenticated visitors.
-- security_invoker is explicitly false (the default) — this view MUST
-- run with its owner's permissions, not the querying role's, so it can
-- read every row despite RLS while the base table itself stays
-- owner-only starting in phase 3. Do not change this to true.
--
-- is_active mirrors isSubscriptionActive() in src/lib/payments.js
-- exactly: status must be 'active' AND plan_expires_at must be
-- non-null AND in the future. No grace period.
--
-- plan_expires_at is `timestamp without time zone` (confirmed — its
-- serialized values carry no UTC offset, same as created_at which
-- schema.sql declares as plain `timestamp`). It's written via
-- expiresAt.toISOString() in payments.js, i.e. the stored naive value
-- is a UTC wall-clock reading. `at time zone 'UTC'` makes that
-- assumption explicit when casting to timestamptz for the `now()`
-- comparison, instead of implicitly relying on the database session's
-- default timezone (UTC on Supabase, but not guaranteed to stay that
-- way). This changes nothing about the rule, only the cast mechanics.
create view businesses_public
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
      and (plan_expires_at at time zone 'UTC') > now()
    ) as is_active
  from businesses;

-- Raw SQL objects don't get Supabase's automatic grants (same gotcha
-- documented in fix_bookings_public_insert.sql).
grant select on businesses_public to anon, authenticated;

-- Lets an authenticated owner read their own full row once the
-- blanket "Public read businesses" policy is gone (phase 3). Additive
-- now — coexists fine with the still-present public policy.
create policy "Owner select businesses"
  on businesses for select
  to authenticated
  using (auth.uid() = user_id);

-- Intentionally NOT dropping "Public read businesses" here — that's
-- phase 3, after app code no longer depends on it.
