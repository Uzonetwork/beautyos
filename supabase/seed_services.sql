-- Danda — Default services reference table
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
  ('mua', 'Gele Tying',       'makeup', 15000),

  -- ── Tailor & Fashion ────────────────────────────────────────────────────────
  ('tailor', 'Dress Sewing',    'fashion', 15000),
  ('tailor', 'Trouser',         'fashion',  8000),
  ('tailor', 'Agbada/Senator',  'fashion', 25000),
  ('tailor', 'Skirt & Blouse',  'fashion', 12000),
  ('tailor', 'Alterations',     'fashion',  3000),
  ('tailor', 'Aso-Ebi Sewing',  'fashion', 20000),

  -- ── Photography ─────────────────────────────────────────────────────────────
  ('photography', 'Portrait Session',    'photography', 30000),
  ('photography', 'Event Coverage',      'photography', 80000),
  ('photography', 'Passport Photos',     'photography',  3000),
  ('photography', 'Product Photography', 'photography', 25000),
  ('photography', 'Editing Only',        'photography', 10000),

  -- ── Home Services ───────────────────────────────────────────────────────────
  ('home_services', 'Plumbing Repair',   'home', 15000),
  ('home_services', 'Electrical Repair', 'home', 12000),
  ('home_services', 'AC Service',        'home', 20000),
  ('home_services', 'Painting',          'home', 50000),
  ('home_services', 'Tiling',            'home', 40000),

  -- ── Private Tutor ───────────────────────────────────────────────────────────
  ('tutor', 'Primary Lessons',    'education', 8000),
  ('tutor', 'Secondary Lessons',  'education', 12000),
  ('tutor', 'JAMB Prep',          'education', 15000),
  ('tutor', 'WAEC Prep',          'education', 15000),
  ('tutor', 'Coding Lessons',     'education', 20000),

  -- ── Fitness & Wellness ──────────────────────────────────────────────────────
  ('fitness', 'Personal Training Session', 'fitness', 10000),
  ('fitness', 'Monthly Training Plan',     'fitness', 40000),
  ('fitness', 'Nutrition Consultation',    'fitness', 15000),
  ('fitness', 'Group Class',               'fitness',  5000),

  -- ── Event Services ──────────────────────────────────────────────────────────
  ('events', 'MC/Compere',      'events', 50000),
  ('events', 'DJ Services',     'events', 60000),
  ('events', 'Decoration',      'events', 80000),
  ('events', 'Catering Per Head','events',  3000),
  ('events', 'Small Chops',     'events', 25000),

  -- ── Private Chef ────────────────────────────────────────────────────────────
  ('private_chef', 'Home Dinner Experience', 'chef',  50000),
  ('private_chef', 'Meal Prep Weekly',       'chef',  35000),
  ('private_chef', 'Event Catering',         'chef',  80000),
  ('private_chef', 'Cooking Class',          'chef',  25000),
  ('private_chef', 'Diet Meal Plan',         'chef',  20000),

  -- ── Content Creator ─────────────────────────────────────────────────────────
  ('content_creator', 'Instagram Reel',          'content', 30000),
  ('content_creator', 'YouTube Video',           'content', 50000),
  ('content_creator', 'Product Review',          'content', 25000),
  ('content_creator', 'Brand Photoshoot',        'content', 40000),
  ('content_creator', 'Monthly Content Package', 'content', 120000),

  -- ── Music DJ ────────────────────────────────────────────────────────────────
  ('dj', 'Club Night',      'music', 80000),
  ('dj', 'Wedding DJ',      'music', 120000),
  ('dj', 'House Party',     'music', 50000),
  ('dj', 'Corporate Event', 'music', 100000),
  ('dj', 'Mix/Edit Only',   'music', 20000);
