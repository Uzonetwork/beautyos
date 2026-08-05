// Nigerian mobile numbers are 11 digits locally (0 + 10-digit subscriber
// number), and every network prefix starts with 7, 8, or 9 after the
// leading 0 (e.g. 070, 080, 081, 090, 091). wa.me and sms: links both want
// the international form without a leading '+': 234 + the 10-digit number.
const NG_MOBILE_PREFIX = /^[789]/;

// Resolves raw input down to the 10-digit national subscriber number,
// accepting any of the four input shapes callers may see. Does not check
// the mobile-network prefix — that's layered on separately depending on
// how strict the caller needs to be (see normalizeNgPhone vs.
// isPlausibleNgPhone below).
function toNationalDigits(raw) {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('234')) return digits.slice(3);
  if (digits.length === 11 && digits.startsWith('0'))   return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

/**
 * Normalizes a Nigerian phone number to international format without a
 * leading '+' (what wa.me and sms: links expect), e.g. "2348031234567".
 * Returns null if the input can't be resolved to a plausible 11-digit
 * Nigerian *mobile* number — including a mobile-network-prefix check.
 * Use this wherever a working wa.me/sms: link actually needs to be built
 * (e.g. deciding whether the reminder buttons should be enabled).
 */
export function normalizeNgPhone(raw) {
  const national = toNationalDigits(raw);
  if (!national || !NG_MOBILE_PREFIX.test(national)) return null;
  return '234' + national;
}

export function isValidNgPhone(raw) {
  return normalizeNgPhone(raw) !== null;
}

/**
 * Looser shape check: true if the input resolves to *some* plausible
 * 11-digit Nigerian number, without enforcing the mobile-network prefix.
 * Use this for form-level validation (e.g. the public booking form),
 * where rejecting a real number outright costs a real booking — that's
 * worse than letting a slightly unusual number through.
 */
export function isPlausibleNgPhone(raw) {
  return toNationalDigits(raw) !== null;
}
