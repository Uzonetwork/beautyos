import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SabiLogo from '../components/SabiLogo';

function fmtMoney(n) { return '₦' + (n || 0).toLocaleString(); }

/**
 * Public, no-login status page at /a/:code for an affiliate to check
 * their own numbers without messaging the admin. Reads only through
 * affiliate_status() (security definer — see
 * supabase/add_affiliate_payouts.sql), which returns aggregate counts
 * and totals only. It never exposes business names, emails, or any
 * other customer detail — this URL is short enough to guess and is
 * meant to be shared openly, so there is nothing here to protect
 * beyond those aggregates.
 */
export default function AffiliateStatusView({ code }) {
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabase.rpc('affiliate_status', { p_code: code });
      if (cancelled) return;
      // Unknown code → zero rows, never an error (same contract as
      // is_valid_referral_code) — that reads as "not found," not a bug.
      if (error || !data?.length) {
        setNotFound(true);
      } else {
        setStatus(data[0]);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="min-h-screen bg-sabi-dark font-sans">
      <nav className="sticky top-0 z-50 bg-sabi-dark/96 backdrop-blur border-b border-sabi-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-center">
          <button onClick={() => { window.location.href = '/'; }} className="bg-transparent border-0 cursor-pointer p-0">
            <SabiLogo size="md" />
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-16 pb-20">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 size={24} className="text-sabi-green animate-spin" />
          </div>
        ) : notFound ? (
          <div className="text-center py-20">
            <h1 className="font-serif text-3xl font-medium text-white mb-2">Code not found</h1>
            <p className="text-sabi-muted text-sm">Double-check the link — affiliate codes are case-insensitive but must match exactly.</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-sabi-green mb-3 text-center">Affiliate Status</p>
            <h1 className="font-serif text-4xl font-medium text-white mb-10 text-center">{status.name}</h1>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="rounded-2xl p-5 border bg-sabi-card border-sabi-border">
                <p className="text-xs font-bold uppercase tracking-widest text-sabi-muted mb-2">Signups</p>
                <p className="font-serif text-4xl font-semibold text-sabi-gold leading-none">{status.signups}</p>
              </div>
              <div className="rounded-2xl p-5 border bg-sabi-card border-sabi-border">
                <p className="text-xs font-bold uppercase tracking-widest text-sabi-muted mb-2">Paid Conversions</p>
                <p className="font-serif text-4xl font-semibold text-sabi-gold leading-none">{status.paid_conversions}</p>
              </div>
              <div className="rounded-2xl p-5 border bg-sabi-gold/8 border-sabi-gold/20">
                <p className="text-xs font-bold uppercase tracking-widest text-sabi-muted mb-2">Amount Owed</p>
                <p className="font-serif text-4xl font-semibold text-sabi-gold leading-none">{fmtMoney(status.amount_owed)}</p>
              </div>
              <div className="rounded-2xl p-5 border bg-sabi-card border-sabi-border">
                <p className="text-xs font-bold uppercase tracking-widest text-sabi-muted mb-2">Already Paid</p>
                <p className="font-serif text-4xl font-semibold text-white leading-none">{fmtMoney(status.amount_paid)}</p>
              </div>
            </div>

            <p className="text-xs text-sabi-muted text-center leading-relaxed">
              A conversion counts once a business pays, and becomes owed 7 days after that payment.
              Questions about a payout? Reach out to Danda directly.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
