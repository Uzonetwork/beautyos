-- ── 1. Add avatar_url column to businesses ────────────────────────────────────
alter table businesses
  add column if not exists avatar_url text;

-- ── 2. Storage buckets ────────────────────────────────────────────────────────
-- Run these in the Supabase dashboard → Storage → New bucket,
-- OR execute via the SQL editor with the storage schema extension enabled.

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ── 3. Storage RLS policies ───────────────────────────────────────────────────

-- gallery bucket — public read
create policy "Public read gallery storage"
  on storage.objects for select
  using (bucket_id = 'gallery');

-- gallery bucket — owner upload (path must start with their business_id)
create policy "Owner upload gallery storage"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery'
    and auth.role() = 'authenticated'
  );

-- gallery bucket — owner delete
create policy "Owner delete gallery storage"
  on storage.objects for delete
  using (
    bucket_id = 'gallery'
    and auth.role() = 'authenticated'
  );

-- avatars bucket — public read
create policy "Public read avatars storage"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- avatars bucket — owner upload
create policy "Owner upload avatars storage"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

-- avatars bucket — owner update (upsert replaces the existing avatar)
create policy "Owner update avatars storage"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );
