/**
 * @format
 */

export const colors = {
  background: '#0B0B0F',
  surface: '#17171F',
  surfaceRaised: '#22222D',
  border: '#2E2E3A',
  /** Line under headers; lighter than border so it reads on pure black too. */
  divider: '#3A3A48',
  text: '#F5F5F7',
  textMuted: '#9A9AA8',
  primary: '#7C5CFF',
  primaryPressed: '#6646F0',
  onPrimary: '#FFFFFF',
  danger: '#FF5C7A',
  success: '#4ADE80',
  scrim: 'rgba(0,0,0,0.6)',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
  body: { fontSize: 16, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
};
