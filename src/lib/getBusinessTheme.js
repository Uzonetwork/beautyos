export const PROFESSION_THEMES = {
  nail_studio:   { bg:'#fdf5f5', cardBg:'#fff0f0', primary:'#b85c5c', accent:'#c97a7a', textDark:'#2d1b1b', textMuted:'#9a7070', border:'#eed5d5', btnBg:'#b85c5c', btnText:'#ffffff', priceColor:'#b85c5c' },
  lash_studio:   { bg:'#fdf5f5', cardBg:'#fff0f0', primary:'#b85c5c', accent:'#c97a7a', textDark:'#2d1b1b', textMuted:'#9a7070', border:'#eed5d5', btnBg:'#b85c5c', btnText:'#ffffff', priceColor:'#b85c5c' },
  spa:           { bg:'#fdf5f5', cardBg:'#fff0f0', primary:'#b85c5c', accent:'#c97a7a', textDark:'#2d1b1b', textMuted:'#9a7070', border:'#eed5d5', btnBg:'#b85c5c', btnText:'#ffffff', priceColor:'#b85c5c' },
  mua:           { bg:'#fdf5f5', cardBg:'#fff0f0', primary:'#b85c5c', accent:'#c97a7a', textDark:'#2d1b1b', textMuted:'#9a7070', border:'#eed5d5', btnBg:'#b85c5c', btnText:'#ffffff', priceColor:'#b85c5c' },
  barbershop:    { bg:'#fdf5f5', cardBg:'#fff0f0', primary:'#b85c5c', accent:'#c97a7a', textDark:'#2d1b1b', textMuted:'#9a7070', border:'#eed5d5', btnBg:'#b85c5c', btnText:'#ffffff', priceColor:'#b85c5c' },
  other:         { bg:'#fdf5f5', cardBg:'#fff0f0', primary:'#b85c5c', accent:'#c97a7a', textDark:'#2d1b1b', textMuted:'#9a7070', border:'#eed5d5', btnBg:'#b85c5c', btnText:'#ffffff', priceColor:'#b85c5c' },
  photography:   { bg:'#0A2E1A', cardBg:'#0F3D22', primary:'#F5C842', accent:'#4CAF72', textDark:'#ffffff', textMuted:'#7AAE90', border:'#1A5C30', btnBg:'#F5C842', btnText:'#0A2E1A', priceColor:'#F5C842' },
  tailor:        { bg:'#1a0a2e', cardBg:'#260f40', primary:'#C084FC', accent:'#C084FC', textDark:'#ffffff', textMuted:'#9060C0', border:'#3a1560', btnBg:'#C084FC', btnText:'#1a0a2e', priceColor:'#F5C842' },
  home_services: { bg:'#2e1a0a', cardBg:'#3d2210', primary:'#F0A060', accent:'#F0A060', textDark:'#ffffff', textMuted:'#A07050', border:'#4d2e14', btnBg:'#F0A060', btnText:'#2e1a0a', priceColor:'#F5C842' },
  tutor:         { bg:'#0a1a2e', cardBg:'#102240', primary:'#60A0F0', accent:'#60A0F0', textDark:'#ffffff', textMuted:'#507090', border:'#183660', btnBg:'#60A0F0', btnText:'#0a1a2e', priceColor:'#F5C842' },
  fitness:       { bg:'#0a2a1a', cardBg:'#0f3820', primary:'#50C878', accent:'#50C878', textDark:'#ffffff', textMuted:'#407858', border:'#185430', btnBg:'#50C878', btnText:'#0a2a1a', priceColor:'#B8F53A' },
  events:        { bg:'#2a0a1a', cardBg:'#3d1028', primary:'#F06090', accent:'#F06090', textDark:'#ffffff', textMuted:'#904060', border:'#4d1838', btnBg:'#F06090', btnText:'#2a0a1a', priceColor:'#F5C842' },
  private_chef:  { bg:'#1e1e08', cardBg:'#2a2a10', primary:'#C8C840', accent:'#C8C840', textDark:'#ffffff', textMuted:'#808030', border:'#383818', btnBg:'#C8C840', btnText:'#1e1e08', priceColor:'#F5C842' },
  content_creator:{ bg:'#0a1e1e', cardBg:'#102a2a', primary:'#40C8C8', accent:'#40C8C8', textDark:'#ffffff', textMuted:'#308080', border:'#184040', btnBg:'#40C8C8', btnText:'#0a1e1e', priceColor:'#F5C842' },
  dj:            { bg:'#1e0808', cardBg:'#2a1010', primary:'#F06060', accent:'#F06060', textDark:'#ffffff', textMuted:'#904040', border:'#3d1818', btnBg:'#F06060', btnText:'#1e0808', priceColor:'#F5C842' },
  other_professional: { bg:'#0A2E1A', cardBg:'#0F3D22', primary:'#F5C842', accent:'#4CAF72', textDark:'#ffffff', textMuted:'#7AAE90', border:'#1A5C30', btnBg:'#F5C842', btnText:'#0A2E1A', priceColor:'#F5C842' },
};

export function getBusinessTheme(businessType) {
  return PROFESSION_THEMES[businessType] ?? PROFESSION_THEMES['other_professional'];
}

export function applyThemeStyle(businessType) {
  const t = getBusinessTheme(businessType);
  const isDark = t.textDark === '#ffffff';
  return {
    '--t-bg':          t.bg,
    '--t-card':        t.cardBg,
    '--t-primary':     t.primary,
    '--t-accent':      t.accent,
    '--t-text':        t.textDark,
    '--t-muted':       t.textMuted,
    '--t-border':      t.border,
    '--t-btn-bg':      t.btnBg,
    '--t-btn-text':    t.btnText,
    '--t-price':       t.priceColor,
    '--t-footer-bg':   isDark ? t.bg : '#1c1010',
    '--t-footer-text': t.textMuted,
    '--t-input-bg':    isDark ? t.bg : '#ffffff',
    '--t-placeholder': t.textMuted,
    '--t-shimmer-1':   isDark ? t.cardBg : 'rgba(240,230,230,0.6)',
    '--t-shimmer-2':   isDark ? t.border  : 'rgba(252,232,232,1)',
  };
}
