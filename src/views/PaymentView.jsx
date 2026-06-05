import { useState, useEffect } from 'react';
import { Check, Lock, Loader2 } from 'lucide-react';
import SabiLogo from '../components/SabiLogo';
import { openPaystackPopup } from '../components/PaystackPayment';
import { activateSubscription } from '../lib/payments';
import { PRICING } from '../config/pricing';
import { supabase } from '../lib/supabase';

export default function PaymentView({ business, onSuccess }) {
  const [ownerEmail, setOwnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div style={S.root}>
      <div style={S.card}>

        {/* Logo */}
        <div style={S.logoWrap}>
          <SabiLogo size="lg" dark={true} />
        </div>

        {/* Headline */}
        <h1 style={S.headline}>Activate Your Sabi Account</h1>
        <p style={S.sub}>One plan. Everything included. Cancel any time.</p>

        {/* Pricing card */}
        <div style={S.pricingCard}>
          <div style={S.badge}>{PRICING.promoLabel}</div>

          <div style={S.priceRow}>
            <span style={S.strikethrough}>₦{PRICING.fullPrice.toLocaleString()}/yr</span>
            <span style={S.price}>₦{PRICING.promoPrice.toLocaleString()}<span style={S.period}>/yr</span></span>
          </div>
          <p style={S.promoNote}>{PRICING.promoNote}</p>

          <ul style={S.featureList}>
            {PRICING.features.map(f => (
              <li key={f} style={S.featureItem}>
                <Check size={14} strokeWidth={2.5} style={{ color: '#4CAF72', flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Error */}
        {error && <p style={S.error}>{error}</p>}

        {/* CTA */}
        <button style={{ ...S.payBtn, opacity: loading ? 0.7 : 1 }} onClick={handlePay} disabled={loading}>
          {loading
            ? <><Loader2 size={16} style={{ animation: 'pv-spin 0.75s linear infinite' }} /> Processing…</>
            : `Pay ₦${PRICING.promoPrice.toLocaleString()} — Activate Now`
          }
        </button>

        {/* Trust note */}
        <div style={S.trustNote}>
          <Lock size={12} style={{ color: '#7AAE90' }} />
          <span>Secure payment via Paystack</span>
        </div>

      </div>
    </div>
  );
}

const S = {
  root: {
    minHeight: '100vh',
    background: '#0A2E1A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#0F3D22',
    border: '1px solid rgba(76,175,114,0.2)',
    borderRadius: 12,
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },
  logoWrap: {
    marginBottom: 28,
  },
  headline: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28,
    fontWeight: 500,
    color: '#FFFFFF',
    textAlign: 'center',
    margin: 0,
    marginBottom: 8,
    lineHeight: 1.2,
  },
  sub: {
    fontSize: 14,
    color: '#7AAE90',
    textAlign: 'center',
    margin: 0,
    marginBottom: 28,
  },
  pricingCard: {
    width: '100%',
    background: '#0A2E1A',
    border: '1px solid rgba(76,175,114,0.2)',
    borderRadius: 10,
    padding: '28px 24px',
    position: 'relative',
    marginBottom: 20,
  },
  badge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#F5C842',
    color: '#0A2E1A',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    padding: '4px 14px',
    borderRadius: 10,
    whiteSpace: 'nowrap',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 4,
  },
  strikethrough: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: '#7AAE90',
    textDecoration: 'line-through',
  },
  price: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 40,
    fontWeight: 600,
    color: '#F5C842',
    lineHeight: 1,
  },
  period: {
    fontSize: 16,
    fontWeight: 400,
    color: '#7AAE90',
    fontFamily: "'DM Sans', sans-serif",
  },
  promoNote: {
    fontSize: 12,
    color: '#7AAE90',
    margin: 0,
    marginBottom: 20,
  },
  featureList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  error: {
    fontSize: 13,
    color: '#f87171',
    background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 6,
    padding: '10px 14px',
    textAlign: 'center',
    width: '100%',
    marginBottom: 4,
  },
  payBtn: {
    width: '100%',
    background: '#F5C842',
    color: '#0A2E1A',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    padding: '15px 24px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    transition: 'opacity 0.2s',
  },
  trustNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#7AAE90',
  },
};
