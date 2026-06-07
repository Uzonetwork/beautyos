import { supabase } from './supabase';

/**
 * Generate a URL-safe slug from a business name.
 * Mirrors the SQL generate_slug() function logic.
 */
function toBaseSlug(name) {
  return (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'business';
}

async function generateSlug(name) {
  const base = toBaseSlug(name);
  let slug = base;
  let counter = 0;
  while (true) {
    const { data } = await supabase.from('businesses').select('id').eq('slug', slug).maybeSingle();
    if (!data) break; // slug is free
    counter++;
    slug = `${base}-${counter}`;
  }
  return slug;
}

// Maps business type → default service_categories array
const TYPE_CATEGORIES = {
  nail_studio:        ['nails'],
  lash_studio:        ['lash'],
  spa:                ['spa'],
  barbershop:         ['barber'],
  mua:                ['makeup'],
  other:              ['other'],
  tailor:             ['fashion'],
  photography:        ['photography'],
  home_services:      ['home'],
  tutor:              ['education'],
  fitness:            ['fitness'],
  events:             ['events'],
  private_chef:       ['chef'],
  content_creator:    ['content'],
  dj:                 ['music'],
  other_professional: ['other'],
};

/**
 * signUp — creates a Supabase Auth account, inserts a linked businesses row,
 * then seeds default services for the chosen business type.
 *
 * Common failure mode: the businesses INSERT needs auth.uid() = user_id.
 * That requires the Supabase client to have an active session when the insert
 * runs.  With email confirmation OFF (recommended for this app), signUp()
 * returns a session immediately.  With email confirmation ON, session is null
 * and we attempt a signInWithPassword to obtain one before inserting.
 */
export async function signUp(email, password, businessData) {

  // Log the full businessData so we can confirm businessType is set correctly
  console.log('[signUp] businessData received:', {
    name:               businessData?.name,
    ownerName:          businessData?.ownerName,
    businessType:       businessData?.businessType,   // ← must be non-empty for seeding
    whatsapp:           businessData?.whatsapp,
    customBusinessType: businessData?.customBusinessType,
  });

  if (!businessData?.businessType) {
    throw new Error('businessType is required in businessData');
  }

  // ── Step 1: Create the auth user ──────────────────────────────────────────
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  // Log everything so the caller can see exactly what Supabase returned.
  console.log('[signUp] authData.user    :', authData?.user);
  console.log('[signUp] authData.session :', authData?.session);
  console.log('[signUp] authError        :', authError);

  if (authError) throw authError;

  // user is always returned (even when email confirmation is enabled).
  const user = authData?.user;
  if (!user?.id) {
    throw new Error(
      'signUp did not return a user object. Check your Supabase project settings.'
    );
  }

  const userId = user.id;   // captured explicitly before any async work
  console.log('[signUp] user.id          :', userId);

  // ── Step 2: Ensure the client has an active session ───────────────────────
  // signUp() immediately grants a session when email confirmation is disabled.
  // When it IS enabled, session is null — we try signInWithPassword to get one.
  // If that also fails (e.g. confirmation genuinely required) we surface a
  // clear message rather than a cryptic RLS error.
  let session = authData?.session;

  if (!session) {
    console.warn('[signUp] No session from signUp — attempting signInWithPassword…');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('[signUp] signIn session   :', signInData?.session);
    console.log('[signUp] signIn error     :', signInError);

    if (signInError || !signInData?.session) {
      throw new Error(
        'Account created but could not establish a session. ' +
        'If email confirmation is enabled in your Supabase project, ' +
        'please disable it under Authentication → Providers → Email ' +
        'while in development, then try again.'
      );
    }
    session = signInData.session;
  }

  // At this point auth.uid() == userId inside every subsequent Supabase call.
  console.log('[signUp] session.user.id  :', session.user?.id);

  // ── Step 3: Insert the businesses row ─────────────────────────────────────
  // user_id is set explicitly; the RLS policy "Owner insert businesses" checks
  //   with check (auth.uid() = user_id)
  // which passes because the session above proves auth.uid() = userId.
  const categories = TYPE_CATEGORIES[businessData.businessType] ?? ['other'];

  const slug = await generateSlug(businessData.name);
  console.log('[signUp] generated slug:', slug);

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({
      user_id:              userId,
      name:                 businessData.name,
      owner_name:           businessData.ownerName,
      business_type:        businessData.businessType,
      tagline:              businessData.tagline  ?? '',
      whatsapp:             businessData.whatsapp ?? '',
      address:              businessData.address  ?? null,
      city:                 businessData.city     ?? null,
      state:                businessData.state    ?? null,
      service_categories:   categories,
      custom_business_type: businessData.customBusinessType ?? null,
      slug,
    })
    .select()
    .single();

  console.log('[signUp] businesses insert data  :', business);
  console.log('[signUp] businesses insert error :', bizError);

  if (bizError) throw bizError;

  // ── Step 4: Seed default services ─────────────────────────────────────────
  // Queries default_services WHERE business_type = businessData.businessType,
  // then bulk-inserts into services linked to the new business_id.
  const { data: defaults, error: defaultsError } = await supabase
    .from('default_services')
    .select('name, category, default_price')
    .eq('business_type', businessData.businessType);

  console.log('[signUp] default_services rows found:', defaults?.length ?? 0, '| error:', defaultsError?.message ?? null);

  if (!defaultsError && defaults?.length) {
    const rows = defaults.map(d => ({
      business_id: business.id,
      name:        d.name,
      category:    d.category,
      price:       d.default_price,
      active:      true,
    }));

    const { error: seedError } = await supabase.from('services').insert(rows);

    if (seedError) {
      console.warn('[signUp] service seeding error (non-fatal):', seedError.message);
    } else {
      console.log('[signUp] seeded', rows.length, 'services for business', business.id);
    }
  }

  return { user, business };
}

/**
 * signIn — authenticates an existing business owner.
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * signOut — clears the active session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * getSession — returns the current session or null.
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * getCurrentBusiness — fetches the businesses row for the signed-in user.
 * Returns null if there is no active session or no linked business.
 */
export async function getCurrentBusiness() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[getCurrentBusiness] error:', error.message);
    return null;
  }
  return data ?? null;
}
