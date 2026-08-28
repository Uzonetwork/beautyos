export const PRICING = {
  promoPrice:      14400,     // ₦14,400 — current launch price
  fullPrice:       24000,     // ₦24,000 — future price shown as strikethrough
  promoPriceKobo:  1440000,   // Paystack uses kobo (14400 × 100)
  currency:        'NGN',
  planName:        'Danda — Yearly',
  promoLabel:      'Launch Price',
  promoNote:       'Price increases to ₦24,000/yr soon',
  // Paid to an affiliate per referred business that converts to a paid
  // subscription. KEEP IN SYNC WITH THE HARDCODED 4000 IN
  // affiliate_status() in supabase/add_affiliate_payouts.sql — that SQL
  // function can't import this file, so the amount is duplicated there
  // on purpose. If one changes, the admin dashboard and the public
  // affiliate status page will silently disagree until the other matches.
  commissionPerReferral: 4000,
  features: [
    'Public booking page with your branding',
    'Unlimited bookings',
    'Client management',
    'Earnings tracker',
    'WhatsApp notifications',
    'Gallery showcase',
    'All future updates',
  ],
};
