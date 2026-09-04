-- Fix: services.price and bookings.price are nullable in schema.sql, unlike
-- default_services.default_price (which is `not null default 0`). Nothing in
-- the app's own UI can currently write a null price — OwnerDashboard's add-
-- and edit-service forms both reject a blank/invalid price before insert —
-- but the column itself doesn't enforce that, so a value cleared to null
-- directly in the Supabase Studio table editor (or any future insert path
-- that skips that validation) silently produces a service/booking with a
-- null price. The app's own render code has been patched to guard against
-- that (defaults to 0), but this closes the actual hole at the source.
--
-- Run this once against your Supabase project (SQL Editor → New query).

update services set price = 0 where price is null;
update bookings set price = 0 where price is null;

alter table services alter column price set default 0;
alter table services alter column price set not null;

alter table bookings alter column price set default 0;
alter table bookings alter column price set not null;
