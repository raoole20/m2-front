/**
 * V2 motion tokens — durations + easings for the 4 keyframe families used
 * across atoms and screens. Consumers (Reanimated) can replay these via
 * `withTiming` / `withSpring` using the durations and easings below.
 *
 * Easing strings follow the cubic-bezier(...) form used in CSS for parity
 * with the design bundle; consumers map them to `Easing.bezier(...)` in RN.
 */
export type EasingTuple = readonly [number, number, number, number];

export type MotionToken = {
  durationMs: number;
  easing: string;
  /** Cubic-bezier control points, ready for `Easing.bezier(...)`. */
  bezier: EasingTuple;
  /** Whether the keyframe loops indefinitely (sparkle, pulse, pulseRing). */
  loop: boolean;
};

const m = (token: MotionToken): MotionToken => token;

export const motionV2 = {
  sparkle: m({
    durationMs: 3600,
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    bezier: [0.4, 0, 0.6, 1],
    loop: true,
  }),
  pulse: m({
    durationMs: 1600,
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    bezier: [0.4, 0, 0.6, 1],
    loop: true,
  }),
  pulseRing: m({
    durationMs: 2400,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bezier: [0.16, 1, 0.3, 1],
    loop: true,
  }),
  fadeUp: m({
    durationMs: 380,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    bezier: [0.2, 0.8, 0.2, 1],
    loop: false,
  }),
} as const;

export type MotionV2 = typeof motionV2;
