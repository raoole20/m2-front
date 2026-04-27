/**
 * Glass recipe values shared between iOS (BlurView) and Android (fallback
 * gradient + tint). Mirrors the `.glass` rule in `Motomoto Mobile.html`.
 */
export const glassV2 = {
  tint: 'rgba(19, 24, 40, 0.55)',
  /** expo-blur intensity (0–100) used on iOS; matches `blur(30px) saturate(180%)`. */
  blurRadius: 30,
  saturation: 180,
  borderColor: 'rgba(255, 255, 255, 0.10)',
  innerHighlight: 'rgba(255, 255, 255, 0.18)',

  /** Android fallback — opaque enough to read as glass without backdrop blur. */
  androidFallback: {
    backgroundColor: 'rgba(19, 24, 40, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    /** 1px sheen overlay applied as an absolute LinearGradient at the top edge. */
    topSheen: {
      colors: ['rgba(255, 255, 255, 0.18)', 'rgba(255, 255, 255, 0)'] as readonly [string, string],
      start: { x: 0, y: 0 } as const,
      end: { x: 1, y: 0 } as const,
    },
    /** Inner shadow simulated via an absolutely positioned overlay. */
    innerShadowColor: 'rgba(0, 0, 0, 0.25)',
  },

  variants: {
    card: {
      tint: 'rgba(19, 24, 40, 0.55)',
      blurRadius: 30,
    },
    tabbar: {
      tint: 'rgba(19, 24, 40, 0.65)',
      blurRadius: 40,
    },
    input: {
      tint: 'rgba(19, 24, 40, 0.42)',
      blurRadius: 24,
    },
    chip: {
      tint: 'rgba(19, 24, 40, 0.50)',
      blurRadius: 20,
    },
  },

  intensities: {
    subtle: 0.6,
    medium: 1.0,
    strong: 1.3,
  },
} as const;

export type GlassVariant = keyof typeof glassV2.variants;
export type GlassIntensity = keyof typeof glassV2.intensities;
export type GlassV2 = typeof glassV2;
