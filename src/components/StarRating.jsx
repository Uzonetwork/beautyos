/** Displays a read-only star rating with optional count. */
export default function StarRating({ stars = 0, count = 0, size = 'sm' }) {
  const fontSize = size === 'md' ? 18 : 14;
  const rounded  = Math.round(stars * 2) / 2; // nearest 0.5

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{ fontSize, color: n <= rounded ? '#F5C842' : '#1A5C30', lineHeight: 1 }}
        >
          {n <= rounded ? '★' : '☆'}
        </span>
      ))}
      {count > 0 && (
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: fontSize - 2,
          color: '#7AAE90',
          marginLeft: 2,
        }}>
          ({count})
        </span>
      )}
    </span>
  );
}

/** Clickable star picker — used in the post-booking rating modal. */
export function StarPicker({ value, onChange }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 32, color: n <= value ? '#F5C842' : '#1A5C30',
            lineHeight: 1, padding: '2px 1px',
            transition: 'color 0.15s, transform 0.1s',
            transform: n <= value ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </span>
  );
}
