// Nigerian mobile numbers are 11 digits locally (0 + 10-digit subscriber
// number), and every network prefix starts with 7, 8, or 9 after the
// leading 0 (e.g. 070, 080, 081, 090, 091). wa.me and sms: links both want
// the international form without a leading '+': 234 + the 10-digit number.
const NG_MOBILE_PREFIX = /^[789]/;

/**
 * Normalizes a Nigerian phone number to international format without a
 * leading '+' (what wa.me and sms: links expect), e.g. "2348031234567".
 * Returns null if the input can't be resolved to a plausible 11-digit
 * Nigerian mobile number.
 */
export function normalizeNgPhone(raw) {
  const digits = (raw ?? '').replace(/\D/g, '');
  let national = null;

  if (digits.length === 13 && digits.startsWith('234')) {
    national = digits.slice(3);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  } else if (digits.length === 10) {
    national = digits;
  }

  if (!national || national.length !== 10 || !NG_MOBILE_PREFIX.test(national)) {
    return null;
  }

  return '234' + national;
}

export function isValidNgPhone(raw) {
  return normalizeNgPhone(raw) !== null;
}
