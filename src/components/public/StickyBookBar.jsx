/**
 * Sticky bottom "Book Now" bar — mobile only. On desktop, visitors always
 * have a visible CTA on screen (hero button or the final CTA band), so this
 * would otherwise stack a second "Book Now" against those.
 */
export default function StickyBookBar({ show, serviceName, price, theme, onBook }) {
  if (!show) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-4 py-3 border-t border-slate-200 flex items-center gap-3 animate-slide-up shadow-2xl bg-white">
      <div className="flex-1 min-w-0">
        {serviceName ? (
          <>
            <p className="font-semibold text-sm truncate text-slate-900">{serviceName}</p>
            {price > 0 && (
              <p className="text-xs font-bold" style={{ color: theme.primary }}>
                ₦{price.toLocaleString()}
              </p>
            )}
          </>
        ) : (
          <p className="font-semibold text-sm text-slate-900">Ready to book?</p>
        )}
      </div>
      <button
        onClick={onBook}
        className="px-5 py-2.5 rounded-xl font-bold text-sm border-0 cursor-pointer flex-shrink-0 active:scale-95"
        style={{ background: theme.btnBg, color: theme.btnText }}>
        Book Now →
      </button>
    </div>
  );
}
