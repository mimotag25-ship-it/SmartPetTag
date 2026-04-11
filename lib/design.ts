// SmartPet Tag Design System
// Philosophy: Calm. Alive. Trusted. Proud.

export const colors = {
  // Backgrounds
  bg: '#0A0F1E',           // Deep space navy — protective, infinite
  bgCard: '#111827',       // Card background — layered depth
  bgCardHover: '#1A2235',  // Hover state
  bgBorder: '#1F2937',     // Subtle borders
  bgInput: '#0D1526',      // Input fields

  // Brand
  amber: '#F59E0B',        // Primary — porch light, home, hope
  amberDim: '#1C1407',     // Amber background
  amberMid: '#92400E',     // Amber mid tone

  // States
  emergency: '#EF4444',    // Lost/danger
  emergencyDim: '#1C0707', // Emergency background
  safe: '#10B981',         // Found/safe
  safeDim: '#052016',      // Safe background
  community: '#6366F1',    // Social/community
  communityDim: '#0F0F2E', // Community background

  // Energy levels
  energy1: '#6366F1',      // Low energy — calm
  energy2: '#10B981',      // Medium energy
  energy3: '#F59E0B',      // High energy
  energy4: '#EF4444',      // Extreme energy

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#4B5563',
  textAccent: '#F59E0B',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999,
};

export const typography = {
  hero: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' },
  h4: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '400' },
  captionBold: { fontSize: 12, fontWeight: '600' },
  tiny: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
};

export const shadows = {
  amber: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emergency: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Energy level config
export const energyConfig = {
  1: { label: 'Calm', color: '#6366F1', bars: 1 },
  2: { label: 'Moderate', color: '#10B981', bars: 2 },
  3: { label: 'Active', color: '#F59E0B', bars: 3 },
  4: { label: 'High', color: '#F97316', bars: 4 },
  5: { label: 'Extreme', color: '#EF4444', bars: 5 },
};

// Park status config
export const parkStatus = {
  empty: { label: 'Quiet', color: '#6366F1', bg: '#0F0F2E' },
  low: { label: 'Good time', color: '#10B981', bg: '#052016' },
  medium: { label: 'Busy', color: '#F59E0B', bg: '#1C1407' },
  high: { label: 'Very busy', color: '#F97316', bg: '#1C0E07' },
  full: { label: 'Too crowded', color: '#EF4444', bg: '#1C0707' },
};
