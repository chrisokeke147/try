// TRY brand design tokens — shared across rider app, driver app, and admin dashboard.
// Source: Novapath's brand identity guide. Usage ratio: ~80% black/white, ~20% yellow
// reserved for CTAs, highlights, and status — yellow is an accent, not a fill color.

export const colors = {
  brandYellow: '#FFC700',
  brandYellowDark: '#E6B400',
  black: '#000000',
  surface: '#161616',
  surfaceAlt: '#1F1F1F',
  card: '#FFFFFF',
  textPrimary: '#000000',
  textOnDark: '#FFFFFF',
  textMuted: '#8A8A8A',
  success: '#2ECC71',
  danger: '#FF4D4D',
  warning: '#FFA800',
  border: '#2A2A2A',
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Poppins per the brand guide: H1 Bold 32/40, H2 SemiBold 24/32, H3 SemiBold 20/28,
// Body Regular 16/24, Caption Regular 12/16. Numbers/prices use Medium.
export const typography = {
  fontFamily: 'Poppins_400Regular',
  fontFamilyMedium: 'Poppins_500Medium',
  fontFamilySemiBold: 'Poppins_600SemiBold',
  fontFamilyBold: 'Poppins_700Bold',
  sizes: {
    caption: 12,
    body: 16,
    subtitle: 16,
    title: 20,
    heading: 24,
    h1: 32,
  },
  lineHeights: {
    caption: 16,
    body: 24,
    title: 28,
    heading: 32,
    h1: 40,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const theme = { colors, radii, spacing, typography, shadows };

export type Theme = typeof theme;
export default theme;
