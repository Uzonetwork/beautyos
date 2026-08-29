/**
 * Terminal state for a URL that looks like a business slug but matches
 * none — reached only after the slug lookup in App.jsx's init() comes
 * back empty. Deliberately plain: no search box, this isn't a page
 * anyone should spend time on. One way out, to the marketplace, since
 * someone who mistyped a business's name might still find them there.
 */
export default function NotFoundView({ onMarketplace }) {
  return (
    <div className="min-h-screen bg-sabi-dark flex flex-col items-center justify-center px-6 py-10 text-center font-sans">
      <h1 className="font-serif text-3xl font-medium text-white mb-3">Page not found</h1>
      <p className="text-sabi-muted text-sm mb-8 max-w-xs leading-relaxed">
        We couldn't find that page. It may have been mistyped or the business may have moved.
      </p>
      <button
        onClick={onMarketplace}
        className="text-sabi-green text-sm font-semibold bg-transparent border-0 cursor-pointer underline underline-offset-4"
      >
        Browse the Danda marketplace
      </button>
    </div>
  );
}
