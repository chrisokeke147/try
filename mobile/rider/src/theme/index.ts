// Mirrors packages/theme — duplicated locally so the Expo app has zero monorepo
// metro-config wiring to do. Keep in sync with packages/theme/index.ts.
// Source: Novapath's brand identity guide — black/white ~80%, yellow ~20% as accent only.
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
};

export const radii = { sm: 8, md: 16, lg: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

// Poppins per brand guide: H1 Bold 32/40, H2 SemiBold 24/32, H3 SemiBold 20/28,
// Body Regular 16/24, Caption Regular 12/16. Numbers/prices use Medium.
export const typography = {
  fontFamily: 'Poppins_400Regular',
  fontFamilyMedium: 'Poppins_500Medium',
  fontFamilySemiBold: 'Poppins_600SemiBold',
  fontFamilyBold: 'Poppins_700Bold',
  sizes: { caption: 13, body: 17, subtitle: 19, title: 23, heading: 27, h1: 36 },
  weights: { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const },
};
