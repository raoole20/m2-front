import { Platform } from 'react-native';

/**
 * Font families — loaded via @expo-google-fonts (mobile) and next/font/google (landing).
 *
 * Single primary family: Inter. Display/Headline/Title/Body/Label all use Inter weights.
 * Instrument Serif italic is a web-only accent for <em> highlights; declared here for
 * token parity but not loaded on mobile.
 */
export const fontFamily = {
  // Body & Label (Inter)
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  // Display & Headline aliases — all point to Inter weights.
  // Inter is loaded in 400/500/600 only; 700/800 aliases fall back to 600.
  displayRegular: 'Inter_400Regular',
  displayMedium: 'Inter_500Medium',
  displaySemiBold: 'Inter_600SemiBold',
  displayBold: 'Inter_600SemiBold',
  displayExtraBold: 'Inter_600SemiBold',
  // Web-only accent (declared for token parity; not loaded on mobile).
  accentSerif: 'InstrumentSerif_400Regular_Italic',
  // System fallbacks (used while fonts load)
  systemRegular: Platform.OS === 'android' ? 'Roboto' : undefined,
  systemMedium: Platform.OS === 'android' ? 'Roboto_medium' : undefined,
  systemBold: Platform.OS === 'android' ? 'Roboto_bold' : undefined,
} as const;

/**
 * Resolved font family — swaps to system fallback if custom fonts are not yet loaded.
 *
 * @param loaded - Whether custom fonts have finished loading
 * @param custom - The custom font name (e.g. fontFamily.displayBold)
 * @param fallback - The system fallback font (e.g. fontFamily.systemBold)
 * @returns The font name to use, or `undefined` for platform default
 */
export function resolvedFont(
  loaded: boolean,
  custom: string | undefined,
  fallback: string | undefined,
): string | undefined {
  return loaded ? custom : fallback;
}

/**
 * Material 3 typography scale + legacy iOS HIG aliases.
 *
 * Weights target Inter 400/500/600 — matching the landing hero pattern
 * (Inter 500 with tight letter-spacing). Components apply fontFamily separately
 * via the `fontFamily` export and `resolvedFont` utility.
 */
export const typography = {
  // ─── Display scale (Inter) ────────────────────────────────
  displayLarge: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '600' as const,
    letterSpacing: -0.035 * 56,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '500' as const,
    letterSpacing: -0.03 * 45,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '500' as const,
    letterSpacing: -0.028 * 36,
  },

  // ─── Headline scale (Inter) ───────────────────────────────
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '500' as const,
    letterSpacing: -0.025 * 32,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600' as const,
    letterSpacing: -0.02 * 28,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.02 * 24,
  },

  // ─── Title scale (Inter) ──────────────────────────────────
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.015 * 22,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },

  // ─── Body scale (Inter) ───────────────────────────────────
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },

  // ─── Label scale (Inter) ──────────────────────────────────
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },

  // ─── Legacy iOS HIG aliases (backward compat) ─────────────
  /** @deprecated Use displaySmall */
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '400' as const,
    letterSpacing: 0.37,
  },
  /** @deprecated Use headlineMedium */
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400' as const,
    letterSpacing: 0.36,
  },
  /** @deprecated Use titleLarge */
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as const,
    letterSpacing: 0.35,
  },
  /** @deprecated Use titleMedium */
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '400' as const,
    letterSpacing: 0.38,
  },
  /** @deprecated Use titleMedium with weight 600 */
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  /** @deprecated Use bodyLarge */
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  /** @deprecated Use bodyLarge */
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  /** @deprecated Use bodyMedium */
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  /** @deprecated Use bodySmall */
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  /** @deprecated Use labelMedium */
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  /** @deprecated Use labelSmall */
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
} as const;
