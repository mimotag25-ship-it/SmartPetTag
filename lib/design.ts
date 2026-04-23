// SmartPet Tag — Light mode design system
export const colors = {
  // Backgrounds
  bg: '#FFFFFF',
  bgCard: '#F9FAFB',
  bgBorder: '#E5E7EB',
  bgBorderStrong: '#D1D5DB',

  // Brand
  amber: '#F59E0B',
  amberDim: '#FEF3C7',
  amberDark: '#B45309',

  // Semantic
  emergency: '#EF4444',
  emergencyDim: '#FEF2F2',
  safe: '#10B981',
  safeDim: '#ECFDF5',
  community: '#6366F1',
  communityDim: '#EEF2FF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#9CA3AF',
  textHint: '#D1D5DB',

  // Nav
  navBg: '#FFFFFF',
  navBorder: '#E5E7EB',
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  amber: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
};

export const energyConfig = {
  1: { color: '#6366F1', bg: '#EEF2FF', label: 'Very Calm' },
  2: { color: '#10B981', bg: '#ECFDF5', label: 'Calm' },
  3: { color: '#F59E0B', bg: '#FEF3C7', label: 'Active' },
  4: { color: '#F97316', bg: '#FFF7ED', label: 'High Energy' },
  5: { color: '#EF4444', bg: '#FEF2F2', label: 'Extreme' },
};
