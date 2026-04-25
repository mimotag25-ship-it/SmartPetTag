// SmartPet Tag — Premium Design System
// Deep navy + amber gold + crisp white — sophisticated & high-trust

export const colors = {
  // Core backgrounds
  bg: '#F8FAFC',           // off-white page bg
  bgCard: '#FFFFFF',       // pure white cards
  bgCardAlt: '#F1F5F9',    // subtle alt card
  bgBorder: '#E2E8F0',     // light border
  bgBorderStrong: '#CBD5E1',

  // Brand — amber gold
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  amberDim: '#FFFBEB',
  amberDark: '#D97706',

  // Navy — premium base
  navy: '#0F172A',
  navyMid: '#1E293B',
  navyLight: '#334155',

  // Semantic
  emergency: '#EF4444',
  emergencyDim: '#FFF1F1',
  emergencyBorder: '#FECACA',
  safe: '#10B981',
  safeDim: '#ECFDF5',
  safeBorder: '#A7F3D0',
  community: '#6366F1',
  communityDim: '#EEF2FF',
  communityBorder: '#C7D2FE',
  warning: '#F97316',
  warningDim: '#FFF7ED',

  // Text hierarchy
  textPrimary: '#0F172A',    // headlines
  textSecondary: '#334155',  // body
  textMuted: '#64748B',      // captions
  textHint: '#94A3B8',       // placeholders
  textInverse: '#FFFFFF',    // on dark

  // iOS system blue for map/navigation
  blue: '#007AFF',
};

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  amber: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  emergency: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 999,
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const typography = {
  hero: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1, color: colors.textPrimary },
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.textPrimary },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: colors.textMuted },
};

export const energyConfig = {
  1: { color: '#6366F1', bg: '#EEF2FF', label: 'Muy tranquilo' },
  2: { color: '#10B981', bg: '#ECFDF5', label: 'Tranquilo' },
  3: { color: '#F59E0B', bg: '#FFFBEB', label: 'Activo' },
  4: { color: '#F97316', bg: '#FFF7ED', label: 'Alta energía' },
  5: { color: '#EF4444', bg: '#FFF1F1', label: 'Extremo' },
};
