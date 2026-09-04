import { CheckCircle } from 'lucide-react';

const NEUTRAL_BORDER = 'rgba(148,163,184,0.35)';

/**
 * Service row on the public booking page. `duration`/`description` render only
 * when present on the record — both are optional today (no such columns exist
 * yet on `services`), so this degrades to the current name+price+category card.
 */
export default function ServiceCard({ svc, isSelected, Icon, theme, onSelect, onContinueBooking }) {
  const metaLine = [svc.category, svc.duration ? `${svc.duration} min` : null].filter(Boolean).join(' · ');

  return (
    <div
      className="rounded-2xl border transition-all duration-200 overflow-hidden bg-white"
      style={{
        borderColor: isSelected ? theme.primary : NEUTRAL_BORDER,
        boxShadow: isSelected
          ? `0 0 0 1px ${theme.primary}, 0 2px 8px rgba(0,0,0,0.06)`
          : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center gap-4 p-5">
        {/* Icon block */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isSelected ? `${theme.primary}22` : `${theme.primary}10` }}>
          <Icon size={20} style={{ color: theme.primary }} />
        </div>

        {/* Info block */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight text-slate-900">{svc.name}</p>
          {metaLine && (
            <p className="text-xs mt-0.5 capitalize font-medium text-slate-400">{metaLine}</p>
          )}
          {svc.description && (
            <p className="text-xs mt-1 text-slate-400 leading-snug line-clamp-2">{svc.description}</p>
          )}
        </div>

        {/* Price + Select */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="font-black text-lg leading-none" style={{ color: theme.primary }}>
            ₦{(svc.price || 0).toLocaleString()}
          </span>
          <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all active:scale-95"
            style={{
              background: isSelected ? theme.btnBg : `${theme.primary}14`,
              color: isSelected ? theme.btnText : theme.primary,
            }}
          >
            {isSelected ? <><CheckCircle size={13} /> Selected</> : 'Select'}
          </button>
        </div>
      </div>

      {/* Expanded booking prompt when selected */}
      {isSelected && (
        <div className="border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Ready to book? Choose your date and time.</p>
          <button
            onClick={onContinueBooking}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border-0 cursor-pointer"
            style={{ background: theme.btnBg, color: theme.btnText }}
          >
            Continue Booking →
          </button>
        </div>
      )}
    </div>
  );
}
