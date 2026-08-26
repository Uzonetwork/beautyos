// Subscription activation now happens exclusively through the
// verify-payment Edge Function (see supabase/functions/verify-payment),
// which verifies the Paystack transaction server-side before writing
// subscription_status / plan_expires_at / paystack_reference. Those
// columns are locked to the service role at the database level (see
// supabase/fix_payment_verification.sql) — a client-side activateSubscription()
// helper like the one that used to live here can no longer write them at all.

/** Returns true when subscription_status is 'active' AND plan_expires_at is in the future. */
export function isSubscriptionActive(business) {
  if (!business) return false;
  if (business.subscription_status !== 'active') return false;
  if (!business.plan_expires_at) return false;
  return new Date(business.plan_expires_at) > new Date();
}

/** Number of calendar days until the plan expires (0 if already expired or no date). */
export function daysUntilExpiry(business) {
  if (!business?.plan_expires_at) return 0;
  const diff = new Date(business.plan_expires_at) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
