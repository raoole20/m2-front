import { Platform } from 'react-native';

export const fontFamily = {
  sans: Platform.select({
    ios: 'Inter, -apple-system, system-ui',
    android: 'Inter_400Regular',
    default: 'Inter, system-ui, sans-serif',
  }) as string,
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  serif: Platform.select({
    ios: 'Instrument Serif, Georgia, serif',
    android: 'InstrumentSerif_400Regular_Italic',
    default: 'Instrument Serif, Georgia, serif',
  }) as string,
  instrumentSerif: {
    regular: 'InstrumentSerif_400Regular',
    italic: 'InstrumentSerif_400Regular_Italic',
  },
} as const;

/**
 * RN does not parse `em`; encode tracking as a multiplier and consumers can
 * convert via `letterSpacing: track * fontSize`.
 */
export type V2TypographyToken = {
  fontFamily: string;
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight: number;
  /** Letter-spacing in `em` units; positive = looser, negative = tighter. */
  trackingEm: number;
  /** Letter-spacing in points (RN-friendly), pre-computed for the default size. */
  letterSpacing: number;
  fontStyle?: 'normal' | 'italic';
  textTransform?: 'none' | 'uppercase';
};

const t = (
  partial: Omit<V2TypographyToken, 'letterSpacing'>,
): V2TypographyToken => ({
  ...partial,
  letterSpacing: partial.trackingEm * partial.fontSize,
});

export const typographyV2 = {
  sans: {
    fontFamily: fontFamily.sans,
  },
  serif: {
    fontFamily: fontFamily.serif,
    fontStyle: 'italic' as const,
  },
  display: t({
    fontFamily: fontFamily.inter.semibold,
    fontSize: 38,
    fontWeight: '600',
    lineHeight: 42,
    trackingEm: -0.04,
  }),
  headline: t({
    fontFamily: fontFamily.inter.semibold,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 32,
    trackingEm: -0.025,
  }),
  title: t({
    fontFamily: fontFamily.inter.semibold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    trackingEm: -0.015,
  }),
  body: t({
    fontFamily: fontFamily.inter.regular,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    trackingEm: 0,
  }),
  bodySmall: t({
    fontFamily: fontFamily.inter.regular,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    trackingEm: 0,
  }),
  caption: t({
    fontFamily: fontFamily.inter.medium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    trackingEm: 0.01,
  }),
  micro: t({
    fontFamily: fontFamily.inter.semibold,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
    trackingEm: 0.10,
    textTransform: 'uppercase',
  }),
  serifDisplay: t({
    fontFamily: fontFamily.instrumentSerif.italic,
    fontSize: 38,
    fontWeight: '400',
    lineHeight: 42,
    trackingEm: -0.01,
    fontStyle: 'italic',
  }),
} as const;

export type TypographyV2 = typeof typographyV2;
