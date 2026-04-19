import { darkColors } from './colors';

/**
 * Glow tokens for web Tailwind `boxShadow` and CSS consumers.
 *
 * Colors are derived from `darkColors` to stay aligned with the M3 palette
 * mobile already consumes. Mobile uses `shadows.glow(color, r, o)` from
 * `./spacing`; web consumers use these composed strings via Tailwind.
 */
export const glows = {
  primary: {
    soft: '0 0 24px rgba(173, 198, 255, 0.35)',
    strong: '0 0 48px rgba(173, 198, 255, 0.2)',
  },
  secondary: {
    soft: '0 0 24px rgba(233, 179, 255, 0.35)',
    strong: '0 0 48px rgba(233, 179, 255, 0.2)',
  },
  success: {
    soft: '0 0 24px rgba(138, 229, 168, 0.35)',
    strong: '0 0 48px rgba(138, 229, 168, 0.2)',
  },
  warning: {
    soft: '0 0 24px rgba(255, 213, 128, 0.35)',
    strong: '0 0 48px rgba(255, 213, 128, 0.2)',
  },
  danger: {
    soft: '0 0 24px rgba(255, 154, 162, 0.35)',
    strong: '0 0 48px rgba(255, 154, 162, 0.2)',
  },
  edgeHighlight: `inset 1px 1px 0 rgba(173, 198, 255, 0.2), inset -1px -1px 0 rgba(173, 198, 255, 0.08)`,
  primaryValue: darkColors.primary,
} as const;
