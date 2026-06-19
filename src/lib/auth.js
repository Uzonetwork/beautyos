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
 * signUp — creates a Supabase Auth user and triggers the OTP confirmation email.
 *
 * Deliberately does NOT insert a businesses row. Business creation happens in
 * createBusiness(), which must be called only after verifySignupOtp() succeeds.
 * This ensures no unverified business records exist in the database.
 *
 * When email confirmation is enabled (as it is here), signUp() returns a user
 * but session is null — that is expected and correct. verifyOtp() will establish
 * the session once the user enters their code.
 */
export async function signUp(email, password) {
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) throw authError;
  const user = authData?.user;
  if (!user?.id) {
    throw new Error('signUp did not return a user object. Check your Supabase project settings.');
  }
  return { user };
}

/**
 * verifySignupOtp — confirms the 6-digit OTP the user received by email.
 * On success, Supabase establishes an active session automatically.
 * createBusiness() must be called immediately after this succeeds.
 */
export async function verifySignupOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
  if (error) throw error;
  return data;
}

/**
 * resendSignupOtp — resends the OTP email for an unconfirmed signup.
 */
export async function resendSignupOtp(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

/**
 * createBusiness — inserts a businesses row and seeds default services.
 *
 * Requires an active session (i.e. verifySignupOtp() must have succeeded first).
 * The RLS policy "Owner insert businesses" enforces: auth.uid() = user_id.
 */
export async function createBusiness(businessData) {
  if (!businessData?.businessType) {
    throw new Error('businessType is required');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('No active session. Please verify your email first.');
  }

  const userId = user.id;
  const categories = TYPE_CATEGORIES[businessData.businessType] ?? ['other'];
  const slug = await generateSlug(businessData.name);

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

  if (bizError) throw bizError;

  // Seed default services for this business type (non-fatal if it fails)
  const { data: defaults, error: defaultsError } = await supabase
    .from('default_services')
    .select('name, category, default_price')
    .eq('business_type', businessData.businessType);

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
      console.warn('[createBusiness] service seeding error (non-fatal):', seedError.message);
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
