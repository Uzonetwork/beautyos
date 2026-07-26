/** Consistent eyebrow + heading + optional subtitle for public page sections. */
export default function SectionHeader({ eyebrow, title, subtitle, color }) {
  return (
    <div className="text-center mb-12">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color }}>
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif font-medium leading-tight text-slate-900"
        style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm mt-2 text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}
