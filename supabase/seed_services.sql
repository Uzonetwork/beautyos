-- BeautyOS — Default services reference table
-- Run this once. The signUp() helper in src/lib/auth.js queries this table
-- to seed a new business's services automatically on registration.
--
-- No RLS needed — this is a static public reference table.

create table if not exists default_services (
  id             uuid    primary key default gen_random_uuid(),
  business_type  text    not null,
  name           text    not null,
  category       text    not null,
  default_price  integer not null default 0
);

-- Prevent duplicate inserts on re-run
delete from default_services;

insert into default_services (business_type, name, category, default_price) values

  -- ── Nail Studio ─────────────────────────────────────────────────────────────
  ('nail_studio', 'Gel Manicure',    'nails', 8000),
  ('nail_studio', 'Nail Extensions', 'nails', 15000),
  ('nail_studio', 'Nail Art',        'nails', 5000),
  ('nail_studio', 'Acrylic Nails',   'nails', 20000),
  ('nail_studio', 'Nail Removal',    'nails', 3000),
  ('nail_studio', 'Pedicure',        'nails', 7000),

  -- ── Lash Studio ─────────────────────────────────────────────────────────────
  ('lash_studio', 'Lash Lift',       'lash', 12000),
  ('lash_studio', 'Lash Extensions', 'lash', 18000),
  ('lash_studio', 'Lash Tint',       'lash',  8000),

  -- ── Spa ─────────────────────────────────────────────────────────────────────
  ('spa', 'Swedish Massage',    'spa', 25000),
  ('spa', 'Deep Tissue Massage','spa', 30000),
  ('spa', 'Body Scrub',         'spa', 20000),
  ('spa', 'Facial',             'spa', 18000),
  ('spa', 'Waxing',             'spa',  8000),
  ('spa', 'Aromatherapy',       'spa', 22000),

  -- ── Barbershop ──────────────────────────────────────────────────────────────
  ('barbershop', 'Haircut',        'barber', 3000),
  ('barbershop', 'Beard Trim',     'barber', 2000),
  ('barbershop', 'Shape Up',       'barber', 2500),
  ('barbershop', 'Hair Treatment', 'barber', 5000),

  -- ── MUA (Makeup Artist) ─────────────────────────────────────────────────────
  ('mua', 'Full Glam Makeup', 'makeup', 50000),
  ('mua', 'Natural Makeup',   'makeup', 30000),
  ('mua', 'Bridal Makeup',    'makeup', 80000),
  ('mua', 'Gele Tying',       'makeup', 15000);
