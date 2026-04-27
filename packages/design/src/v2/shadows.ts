import type { ViewStyle } from 'react-native';

import { accentRgb } from './colors';

type ShadowSpec = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

/**
 * Floating tab bar — heavy outer drop shadow; the 1px inner highlight is
 * applied via a sibling `<View>` (RN cannot render true inset shadows).
 */
const floating: ShadowSpec = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.5,
  shadowRadius: 40,
  elevation: 18,
};

/** Card-level ambient shadow + accent halo. */
const card: ShadowSpec = {
  shadowColor: `rgba(${accentRgb}, 1)`,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 24,
  elevation: 8,
};

/** Accent-tinted glow for AI / interactive surfaces. */
const glowAccent: ShadowSpec = {
  shadowColor: `rgba(${accentRgb}, 1)`,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 18,
  elevation: 12,
};

export const shadowsV2 = {
  floating,
  card,
  glow: {
    accent: glowAccent,
  },
} as const;

export type ShadowsV2 = typeof shadowsV2;
