import { supabase } from './supabase';

/**
 * Activates (or renews) a business subscription after successful Paystack payment.
 * Sets status to 'active', stamps plan_expires_at to exactly 1 year from now,
 * and records the Paystack reference.
 */
export async function activateSubscription(businessId, reference) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { error } = await supabase
    .from('businesses')
    .update({
      subscription_status: 'active',
      plan_expires_at:     expiresAt.toISOString(),
      paystack_reference:  reference,
    })
    .eq('id', businessId);

  if (error) throw error;
  return true;
}

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
