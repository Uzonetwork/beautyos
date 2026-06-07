import { useState, useEffect } from 'react';
import { Check, Lock, Loader2 } from 'lucide-react';
import SabiLogo from '../components/SabiLogo';
import { openPaystackPopup } from '../components/PaystackPayment';
import { activateSubscription } from '../lib/payments';
import { PRICING } from '../config/pricing';
import { supabase } from '../lib/supabase';

export default function PaymentView({ business, onSuccess }) {
  const [ownerEmail, setOwnerEmail] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setOwnerEmail(session.user.email);
    });
  }, []);

  async function handlePay() {
    if (!business?.id) { setError('Business not found. Please refresh.'); return; }
    if (!ownerEmail)   { setError('Could not determine your email. Please refresh.'); return; }
    setLoading(true);
    setError('');
    openPaystackPopup({
      email:      ownerEmail,
      businessId: business.id,
      onSuccess: async (response) => {
        try {
          await activateSubscription(business.id, response.reference);
          onSuccess();
        } catch (err) {
          console.error('[PaymentView] activateSubscription failed:', err);
          setError('Payment received but activation failed. Contact support with ref: ' + response.reference);
        } finally {
          setLoading(false);
        }
      },
      onClose: () => setLoading(false),
    });
  }

  return (
    <div className="min-h-screen bg-sabi-dark flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-sabi-card border border-sabi-border rounded-2xl p-8 flex flex-col items-center">

        {/* Logo */}
        <div className="mb-7">
          <SabiLogo size="lg" dark={false} />
        </div>

        <h1 className="font-serif text-3xl font-medium text-white text-center mb-2">Activate Your Sabi Account</h1>
        <p className="text-sabi-muted text-sm text-center mb-7">One plan. Everything included. Cancel any time.</p>

        {/* Pricing card */}
        <div className="w-full bg-sabi-dark border border-sabi-border rounded-xl p-6 mb-5 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sabi-gold text-sabi-dark text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap">
            {PRICING.promoLabel}
          </div>

          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-sabi-muted text-sm line-through">₦{PRICING.fullPrice.toLocaleString()}/yr</span>
            <span className="font-serif text-5xl font-semibold text-sabi-gold">
              ₦{PRICING.promoPrice.toLocaleString()}<span className="font-sans text-base font-normal text-sabi-muted">/yr</span>
            </span>
          </div>
          <p className="text-xs text-sabi-muted mb-5">{PRICING.promoNote}</p>

          <ul className="flex flex-col gap-2.5">
            {PRICING.features.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/85">
                <Check size={14} strokeWidth={2.5} className="text-sabi-green flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm text-center mb-4">
            {error}
          </div>
        )}

        <button
          className="btn-gold w-full justify-center py-4 text-base disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handlePay}
          disabled={loading}
        >
          {loading
            ? <><Loader2 size={16} className="pv-spin" /> Processing…</>
            : `Pay ₦${PRICING.promoPrice.toLocaleString()} — Activate Now`
          }
        </button>

        <div className="flex items-center gap-2 mt-4 text-sabi-muted text-xs">
          <Lock size={12} />
          <span>Secure payment via Paystack</span>
        </div>

      </div>
    </div>
  );
}
