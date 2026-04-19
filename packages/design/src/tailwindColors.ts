import { darkColors } from './colors';

/**
 * Flat color scales tailored for Tailwind consumption by the web apps
 * (apps/landing, apps/admin) and @m2/ui primitives.
 *
 * Derived from the single source of truth in ./colors (M3 dark palette)
 * so that web styles never drift from mobile. Do NOT import this from
 * mobile code — the shape is DOM/Tailwind-oriented.
 */
export const tailwindColors = {
  primary: {
    DEFAULT: darkColors.primary,
    container: darkColors.primaryContainer,
    onContainer: darkColors.onPrimaryContainer,
  },
  secondary: {
    DEFAULT: darkColors.secondary,
    container: darkColors.secondaryContainer,
    onContainer: darkColors.onSecondaryContainer,
  },
  tertiary: {
    DEFAULT: darkColors.tertiary,
    container: darkColors.tertiaryContainer,
    onContainer: darkColors.onTertiaryContainer,
  },
  surface: {
    DEFAULT: darkColors.surface,
    container: darkColors.surfaceContainer,
    containerHigh: darkColors.surfaceContainerHigh,
    onSurface: darkColors.onSurface,
  },
  text: {
    primary: darkColors.text.primary,
    secondary: darkColors.text.secondary,
    muted: darkColors.text.tertiary,
  },
  semantic: {
    success: '#8AE5A8',
    warning: '#FFD580',
    danger: '#FF9AA2',
  },
  stroke: {
    subtle: 'rgba(173, 198, 255, 0.2)',
  },
} as const;
