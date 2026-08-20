import { PRICING } from '../config/pricing';

const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v1/inline.js';

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return; }
    if (document.querySelector(`script[src="${PAYSTACK_SCRIPT_URL}"]`)) {
      // Script tag exists but PaystackPop not yet ready — poll briefly
      let tries = 0;
      const poll = setInterval(() => {
        if (window.PaystackPop) { clearInterval(poll); resolve(); }
        if (++tries > 30) { clearInterval(poll); reject(new Error('Paystack failed to load')); }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.src = PAYSTACK_SCRIPT_URL;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.head.appendChild(script);
  });
}

/**
 * Opens the Paystack inline payment popup.
 *
 * @param {object} opts
 * @param {string}   opts.email      - Payer's email address
 * @param {string}   opts.businessId - Danda business UUID (embedded in ref + metadata)
 * @param {function} opts.onSuccess  - Called with Paystack response object on payment success
 * @param {function} [opts.onClose]  - Called when the popup is closed without payment
 */
export async function openPaystackPopup({ email, businessId, onSuccess, onClose }) {
  await loadPaystackScript();

  const reference = `SABI_${businessId}_${Date.now()}`;

  const handler = window.PaystackPop.setup({
    key:      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    email,
    amount:   PRICING.promoPriceKobo,
    currency: PRICING.currency,
    ref:      reference,
    metadata: {
      custom_fields: [
        { display_name: 'Business ID', variable_name: 'business_id', value: businessId },
        { display_name: 'Plan',        variable_name: 'plan',        value: 'yearly'   },
      ],
    },
    callback: (response) => onSuccess(response),
    onClose:  () => onClose?.(),
  });

  handler.openIframe();
}
