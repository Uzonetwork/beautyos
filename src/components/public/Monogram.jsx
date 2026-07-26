/** Brand-colored initials avatar — the fallback shown whenever a business has no photo. */
export default function Monogram({ name, size = 96, rounded = 'full', primary = '#F5C842' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className={`flex items-center justify-center font-black flex-shrink-0 ${rounded === 'full' ? 'rounded-full' : 'rounded-2xl'}`}
      style={{
        width: size,
        height: size,
        background: `${primary}18`,
        color: primary,
        fontFamily: 'Georgia, serif',
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </div>
  );
}
