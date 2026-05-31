-- Fix: grant the authenticated role table-level permissions on clients.
--
-- Tables created via raw SQL (not the Supabase dashboard) do not automatically
-- receive GRANT statements for the anon/authenticated roles. Without these grants
-- PostgreSQL blocks the query at the role level before RLS is even checked, so
-- RLS policies alone are not enough.
--
-- Run this once in Supabase → SQL Editor → New query.

grant usage on schema public to authenticated;

-- clients table — owner needs full CRUD
grant select, insert, update, delete on table public.clients to authenticated;

-- businesses table — needed by the RLS subquery in client policies:
--   auth.uid() = (select user_id from businesses where id = business_id)
grant select on table public.businesses to authenticated;

-- bookings table — owner needs select/update/delete
grant select, update, delete on table public.bookings to authenticated;

-- services table — owner needs full CRUD
grant select, insert, update, delete on table public.services to authenticated;

-- gallery table — owner needs full CRUD
grant select, insert, delete on table public.gallery to authenticated;
