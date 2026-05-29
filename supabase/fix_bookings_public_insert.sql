-- Fix: allow unauthenticated (anon) users to submit bookings from public pages.
--
-- The schema.sql defines the "Public insert bookings" RLS policy, but the
-- hand-written schema omits the GRANT statements that Supabase normally adds
-- automatically when tables are created via the dashboard. Without the grant,
-- the anon role is blocked at the PostgreSQL layer before RLS is even checked.
--
-- Run this once against your Supabase project (SQL Editor → New query).

grant usage on schema public to anon;
grant insert on table public.bookings to anon;

-- Recreate the policy explicitly targeting the anon role so it is unambiguous.
drop policy if exists "Public insert bookings" on bookings;
create policy "Public insert bookings"
  on bookings for insert
  to anon
  with check (true);
