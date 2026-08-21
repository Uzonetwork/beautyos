-- Danda Schema — full reference (run on a fresh database)
-- For an existing database, run supabase/migrations/add_auth.sql instead.

create extension if not exists "pgcrypto";

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table businesses (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        references auth.users(id) on delete set null,
  name               text,
  owner_name         text,
  tagline            text,
  whatsapp           text,
  business_type      text        default 'nail_studio',
  service_categories text[]      default '{}',
  created_at         timestamp   default now()
);

create table services (
  id          uuid      primary key default gen_random_uuid(),
  business_id uuid      references businesses(id) on delete cascade,
  name        text,
  price       integer,
  category    text,
  active      boolean   default true,
  created_at  timestamp default now()
);

create table bookings (
  id           uuid      primary key default gen_random_uuid(),
  business_id  uuid      references businesses(id) on delete cascade,
  client_name  text,
  client_phone text,
  service_name text,
  price        integer,
  date         text,
  time         text,
  ampm         text,
  status       text      default 'pending',
  notes        text,
  created_at   timestamp default now()
);

create table clients (
  id           uuid      primary key default gen_random_uuid(),
  business_id  uuid      references businesses(id) on delete cascade,
  name         text,
  phone        text,
  initials     text,
  visit_count  integer   default 1,
  last_service text,
  last_visit   text,
  created_at   timestamp default now()
);

create table gallery (
  id          uuid      primary key default gen_random_uuid(),
  business_id uuid      references businesses(id) on delete cascade,
  image_url   text,
  caption     text,
  created_at  timestamp default now()
);

-- Reference table — not tenant-specific, no RLS needed.
create table default_services (
  id             uuid    primary key default gen_random_uuid(),
  business_type  text    not null,
  name           text    not null,
  category       text    not null,
  default_price  integer not null default 0
);

-- ─── Default services seed ─────────────────────────────────────────────────────

insert into default_services (business_type, name, category, default_price) values
  -- Nail studio
  ('nail_studio', 'Gel Manicure',    'nails', 8000),
  ('nail_studio', 'Nail Extensions', 'nails', 15000),
  ('nail_studio', 'Nail Art',        'nails', 5000),
  ('nail_studio', 'Acrylic Nails',   'nails', 20000),
  ('nail_studio', 'Nail Removal',    'nails', 3000),
  ('nail_studio', 'Pedicure',        'nails', 7000),
  -- Lash studio
  ('lash_studio', 'Lash Lift',       'lash', 12000),
  ('lash_studio', 'Lash Extensions', 'lash', 18000),
  ('lash_studio', 'Lash Tint',       'lash', 8000),
  -- Spa
  ('spa', 'Swedish Massage',   'spa', 25000),
  ('spa', 'Deep Tissue Massage','spa', 30000),
  ('spa', 'Body Scrub',        'spa', 20000),
  ('spa', 'Facial',            'spa', 18000),
  ('spa', 'Waxing',            'spa', 8000),
  ('spa', 'Aromatherapy',      'spa', 22000),
  -- Barbershop
  ('barbershop', 'Haircut',        'barber', 3000),
  ('barbershop', 'Beard Trim',     'barber', 2000),
  ('barbershop', 'Shape Up',       'barber', 2500),
  ('barbershop', 'Hair Treatment', 'barber', 5000),
  -- MUA
  ('mua', 'Full Glam Makeup', 'makeup', 50000),
  ('mua', 'Natural Makeup',   'makeup', 30000),
  ('mua', 'Bridal Makeup',    'makeup', 80000),
  ('mua', 'Gele Tying',       'makeup', 15000);

-- ─── Demo seed data ────────────────────────────────────────────────────────────
-- user_id is null; link to a real auth user after signing up if needed.

insert into businesses (id, name, owner_name, tagline, whatsapp, business_type, service_categories)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'CFO Nails & Lash Studio',
  'Chioma Fortunate Ohanusi',
  'Nail Technician & Lash Artist · Lagos, Nigeria',
  '2348000000000',
  'nail_studio',
  '{nails,lash}'
);

insert into services (business_id, name, price, category) values
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gel Manicure',    8000,  'nails'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nail Extensions', 15000, 'nails'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nail Art',        5000,  'nails'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lash Lift',       12000, 'lash'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lash Extensions', 18000, 'lash'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pedicure',        7000,  'nails'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Acrylic Nails',   20000, 'nails'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lash Tint',       8000,  'lash'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nail Removal',    3000,  'nails');

-- ─── Row Level Security ────────────────────────────────────────────────────────

alter table businesses     enable row level security;
alter table services       enable row level security;
alter table bookings       enable row level security;
alter table clients        enable row level security;
alter table gallery        enable row level security;
-- default_services: enable RLS and allow everyone to read it.
-- Tables created via the Supabase dashboard have RLS on by default,
-- which would silently return empty results without a read policy.
alter table default_services enable row level security;

create policy "Public read default_services"
  on default_services for select using (true);

-- ─── Public policies (anon key, unauthenticated visitors) ─────────────────────

create policy "Public read businesses"
  on businesses for select using (true);

create policy "Public read services"
  on services for select using (true);

-- Clients book without an account
create policy "Public insert bookings"
  on bookings for insert with check (true);

create policy "Public read gallery"
  on gallery for select using (true);

-- ─── Owner policies (authenticated via Supabase Auth) ─────────────────────────
-- Every owner policy checks auth.uid() = businesses.user_id (directly or via
-- a subquery through business_id) so owners can only touch their own data.

-- businesses — owner inserts their own row on signup
create policy "Owner insert businesses"
  on businesses for insert
  with check (auth.uid() = user_id);

-- businesses — owner updates their own profile
create policy "Owner update businesses"
  on businesses for update
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helper expression used in every child-table policy:
--   auth.uid() = (select user_id from businesses where id = business_id)

-- services
create policy "Owner insert services"
  on services for insert
  with check (auth.uid() = (select user_id from businesses where id = business_id));

create policy "Owner update services"
  on services for update
  using     (auth.uid() = (select user_id from businesses where id = business_id))
  with check (auth.uid() = (select user_id from businesses where id = business_id));

create policy "Owner delete services"
  on services for delete
  using (auth.uid() = (select user_id from businesses where id = business_id));

-- bookings
create policy "Owner select bookings"
  on bookings for select
  using (auth.uid() = (select user_id from businesses where id = business_id));

create policy "Owner update bookings"
  on bookings for update
  using     (auth.uid() = (select user_id from businesses where id = business_id))
  with check (auth.uid() = (select user_id from businesses where id = business_id));

create policy "Owner delete bookings"
  on bookings for delete
  using (auth.uid() = (select user_id from businesses where id = business_id));

-- clients
create policy "Owner select clients"
  on clients for select
  using (auth.uid() = (select user_id from businesses where id = business_id));

create policy "Owner insert clients"
  on clients for insert
  with check (auth.uid() = (select user_id from businesses where id = business_id));

create policy "Owner update clients"
  on clients for update
  using     (auth.uid() = (select user_id from businesses where id = business_id))
  with check (auth.uid() = (select user_id from businesses where id = business_id));

create policy "Owner delete clients"
  on clients for delete
  using (auth.uid() = (select user_id from businesses where id = business_id));

-- gallery
create policy "Owner insert gallery"
  on gallery for insert
  with check (auth.uid() = (select user_id from businesses where id = business_id));

create policy "Owner delete gallery"
  on gallery for delete
  using (auth.uid() = (select user_id from businesses where id = business_id));
