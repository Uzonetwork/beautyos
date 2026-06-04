export default function SabiLogo({ dark = false, size = 'md' }) {
  const sizes = {
    sm: { badge: 24, font: 14, word: 16 },
    md: { badge: 32, font: 18, word: 20 },
    lg: { badge: 42, font: 24, word: 28 },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: s.badge, height: s.badge,
        background: dark ? '#ffffff' : '#F5C842',
        borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        fontSize: s.font,
        fontWeight: 900,
        color: '#0A2E1A',
        flexShrink: 0,
        lineHeight: 1,
      }}>S</div>
      <span style={{
        fontFamily: 'Georgia, serif',
        fontSize: s.word,
        fontWeight: 700,
        color: dark ? '#ffffff' : '#0A2E1A',
        letterSpacing: 0.5,
        lineHeight: 1,
      }}>Sabi</span>
    </div>
  );
}
