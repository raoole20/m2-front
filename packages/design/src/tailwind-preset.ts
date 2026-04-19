import { glows } from './glows';
import { radii } from './radii';
import { tailwindColors } from './tailwindColors';

/**
 * Tailwind v3 preset for web apps.
 *
 * Consumed by apps/landing + apps/admin via tailwind.config.ts `presets`.
 * Mobile does NOT consume this preset (RN has no Tailwind).
 */
export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        primary: tailwindColors.primary,
        secondary: tailwindColors.secondary,
        tertiary: tailwindColors.tertiary,
        surface: tailwindColors.surface,
        text: tailwindColors.text,
        semantic: tailwindColors.semantic,
        stroke: tailwindColors.stroke,
      },
      spacing: {
        0: '0rem',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
      },
      borderRadius: radii,
      fontFamily: {
        display: ['Manrope', 'Segoe UI', 'sans-serif'],
        body: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': `${glows.primary.soft}, ${glows.primary.strong}`,
        'glow-secondary': `${glows.secondary.soft}, ${glows.secondary.strong}`,
        'glow-success': `${glows.success.soft}, ${glows.success.strong}`,
        'glow-warning': `${glows.warning.soft}, ${glows.warning.strong}`,
        'glow-danger': `${glows.danger.soft}, ${glows.danger.strong}`,
      },
      backgroundImage: {
        'mesh-primary':
          'radial-gradient(circle at 20% 20%, rgba(173,198,255,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(233,179,255,0.25), transparent 40%), radial-gradient(circle at 50% 100%, rgba(108,255,129,0.2), transparent 50%)',
        'mesh-dusk':
          'radial-gradient(circle at 15% 15%, rgba(233,179,255,0.3), transparent 40%), radial-gradient(circle at 85% 10%, rgba(173,198,255,0.3), transparent 45%), radial-gradient(circle at 50% 90%, rgba(255,213,128,0.18), transparent 55%)',
      },
    },
  },
  plugins: [],
} as const;
