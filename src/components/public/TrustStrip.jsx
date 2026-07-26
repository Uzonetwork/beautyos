import { Star, ShieldCheck, Lock } from 'lucide-react';

/**
 * Refined trust strip for the hero. The rating badge only appears once a
 * business has real ratings — never a fabricated placeholder number.
 * Verified/Secure are static platform guarantees, not tenant-specific stats.
 */
export default function TrustStrip({ business }) {
  const badges = [
    business?.rating_count > 0 && {
      key: 'rating',
      Icon: Star,
      text: `${Number(business.avg_rating).toFixed(1)} (${business.rating_count})`,
    },
    { key: 'verified', Icon: ShieldCheck, text: 'Verified Pro' },
    { key: 'secure',   Icon: Lock,        text: 'Secure Booking' },
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap gap-3">
      {badges.map(({ key, Icon, text }) => (
        <div key={key}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-500">
          <Icon size={13} className="text-slate-400" />
          {text}
        </div>
      ))}
    </div>
  );
}
