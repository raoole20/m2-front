/**
 * Atmosphere mood presets — each entry is a stack of radial halos rendered as
 * `<RadialGradient>` paints inside a Skia `<Canvas>`. The values mirror the
 * `moods` table in `.design-bundle/project/v2-atoms.jsx`.
 *
 * `size`/`pos` are CSS percentage strings as authored in the design bundle;
 * the `<Atmosphere>` primitive parses them against the screen dimensions.
 */
export type HaloDescriptor = {
  /** rgb triple, e.g. "139,140,247". */
  color: string;
  /** "<x%> <y%>" — width / height of the radial gradient relative to the canvas. */
  size: string;
  /** "<x%> <y%>" — center of the radial gradient relative to the canvas. */
  pos: string;
  /** 0–1 alpha at the gradient origin (intensity multiplier applied at render). */
  opacity: number;
};

export type AtmosphereMood =
  | 'inbox'
  | 'conversation'
  | 'channels'
  | 'ai'
  | 'profile';

export type AtmosphereIntensity = 'flat' | 'subtle' | 'rich';

export const atmosphereV2: Record<AtmosphereMood, readonly HaloDescriptor[]> = {
  inbox: [
    { color: '139,140,247', size: '70% 50%', pos: '85% -10%', opacity: 0.18 },
    { color: '99,102,241', size: '55% 35%', pos: '10% 20%', opacity: 0.12 },
    { color: '180,181,251', size: '45% 30%', pos: '50% 110%', opacity: 0.10 },
  ],
  conversation: [
    { color: '139,140,247', size: '60% 40%', pos: '50% -20%', opacity: 0.15 },
    { color: '99,102,241', size: '50% 35%', pos: '20% 60%', opacity: 0.10 },
    { color: '180,181,251', size: '50% 35%', pos: '85% 95%', opacity: 0.10 },
  ],
  channels: [
    { color: '139,140,247', size: '80% 50%', pos: '50% -30%', opacity: 0.14 },
    { color: '37,211,102', size: '40% 25%', pos: '15% 40%', opacity: 0.06 },
    { color: '225,48,108', size: '40% 25%', pos: '85% 65%', opacity: 0.06 },
  ],
  ai: [
    { color: '139,140,247', size: '90% 55%', pos: '50% -20%', opacity: 0.22 },
    { color: '95,168,255', size: '60% 40%', pos: '20% 70%', opacity: 0.10 },
    { color: '180,181,251', size: '60% 40%', pos: '85% 100%', opacity: 0.10 },
  ],
  profile: [
    { color: '139,140,247', size: '60% 40%', pos: '50% -10%', opacity: 0.16 },
    { color: '180,181,251', size: '50% 35%', pos: '10% 100%', opacity: 0.10 },
  ],
} as const;

export const atmosphereIntensityMultiplier: Record<AtmosphereIntensity, number> = {
  flat: 0,
  subtle: 0.5,
  rich: 1,
};

export type AtmosphereV2 = typeof atmosphereV2;
