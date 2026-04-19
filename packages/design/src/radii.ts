/**
 * Radius tokens in rem units, sized for web Tailwind consumption.
 * Mobile consumers (apps/mobile) continue to use `borderRadius` from `./spacing`.
 */
export const radii = {
  none: "0rem",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;
