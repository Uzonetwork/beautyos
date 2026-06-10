export default function SabiLogo({ light = false, size = 'md' }) {
  const sizes = {
    sm: { badge: 'w-6 h-6 text-sm rounded-md', word: 'text-base' },
    md: { badge: 'w-8 h-8 text-lg rounded-lg', word: 'text-xl' },
    lg: { badge: 'w-10 h-10 text-2xl rounded-xl', word: 'text-2xl' },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <div
        className={`${s.badge} flex items-center justify-center font-black text-sabi-dark bg-sabi-gold flex-shrink-0`}
        style={{ fontFamily: 'Georgia,serif' }}
      >
        S
      </div>
      <span
        className={`${s.word} font-bold flex-shrink-0 ${light ? 'text-slate-900' : 'text-white'}`}
        style={{ fontFamily: 'Georgia,serif', letterSpacing: '0.5px' }}
      >
        Sabi
      </span>
    </div>
  );
}
