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
    const { data } = await supabase.from('businesses_public').select('id').eq('slug', slug).maybeSingle();
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
 * checkReferralCode — validates a referral code via the is_valid_referral_code
 * RPC (security definer, callable by anon — see add_referral_attribution.sql).
 * Returns the affiliate's first name if the code matches an active
 * affiliate, otherwise null. Never throws — a failed check should read as
 * "not recognized," not as an app error.
 */
export async function checkReferralCode(code) {
  const trimmed = (code ?? '').trim();
  if (!trimmed) return null;
  const { data, error } = await supabase.rpc('is_valid_referral_code', { p_code: trimmed });
  if (error || !data?.length || !data[0].valid) return null;
  return data[0].affiliate_first_name ?? null;
}

/**
 * createBusiness — inserts a businesses row and seeds default services.
 *
 * Requires an active session (i.e. verifySignupOtp() must have succeeded first).
 * The RLS policy "Owner insert businesses" enforces: auth.uid() = user_id.
 *
 * referralCode, if present, is written as-is into referral_code_entered —
 * resolving it into referred_by_affiliate_id happens server-side in the
 * businesses_resolve_referral trigger, so this function never queries the
 * (RLS-locked, no anon/authenticated policy) affiliates table itself.
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
      referral_code_entered: businessData.referralCode?.trim() || null,
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
 * uploadBusinessAvatar — uploads a profile photo to the "avatars" storage
 * bucket and updates the businesses.avatar_url column. Shared by the signup
 * flow and OwnerDashboard so both write through the same bucket/path/column.
 */
export async function uploadBusinessAvatar(businessId, file) {
  const ext = file.name.split('.').pop();
  const path = `${businessId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: true });
  if (uploadError) throw uploadError;
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  const { error: updateError } = await supabase.from('businesses').update({ avatar_url: publicUrl }).eq('id', businessId);
  if (updateError) throw updateError;
  return publicUrl;
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
 * requestPasswordReset — sends a recovery email via Supabase Auth.
 *
 * redirectTo is the bare origin (no trailing slash, no hash of its own) —
 * matches what Supabase was already observed redirecting to before this
 * was ever set explicitly, i.e. the project's configured Site URL. Must
 * also be present in Supabase's Authentication → URL Configuration →
 * Redirect URLs allow list, or Supabase silently falls back to the Site
 * URL instead of honoring this. Supabase appends the recovery token as a
 * URL hash fragment (#access_token=...&type=recovery) to whatever URL is
 * passed here; App.jsx's onAuthStateChange listener picks up the
 * resulting PASSWORD_RECOVERY event.
 */
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

/**
 * updatePassword — sets a new password for the signed-in user.
 *
 * Only works with an active session. The recovery-link flow establishes
 * one automatically once Supabase's client detects the token in the URL
 * (see App.jsx's PASSWORD_RECOVERY handling) — this throws
 * AuthSessionMissingError if called without that session in place.
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * signOut — clears the active session and removes all Supabase tokens from
 * local/session storage so a refresh can never restore the session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  // Belt-and-suspenders: purge any sb-* keys that survived the signOut call
  Object.keys(localStorage)
    .filter(key => key.startsWith('sb-'))
    .forEach(key => localStorage.removeItem(key));
  sessionStorage.clear();
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
