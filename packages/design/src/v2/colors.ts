import type { ChannelType } from '@m2/types';

export type V2Channels = Record<ChannelType, string> & {
  whatsapp: string;
  instagram: string;
  facebook: string;
  sms: string;
  email: string;
  /** Editorial channels supported by the V2 design bundle but not yet in @m2/types. */
  messenger: string;
  telegram: string;
};

export type V2Intent = 'pricing' | 'support' | 'lead' | 'urgent';

export const colorsV2 = {
  bg: {
    base: '#0b0f1a',
    deep: '#07090f',
    surface: 'rgba(19, 24, 40, 0.55)',
    dimmed: 'rgba(19, 24, 40, 0.78)',
  },
  accent: {
    100: '#b4b5fb',
    200: '#8b8cf7',
    300: '#6366f1',
    400: '#5b5cd6',
    deep: '#5fa8ff',
  },
  text: {
    primary: '#f1f3fa',
    secondary: '#c2c8d6',
    muted: '#8892a6',
    disabled: '#5e687c',
  },
  state: {
    success: '#34d399',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#5fa8ff',
  },
  channels: {
    whatsapp: '#25d366',
    instagram: '#e1306c',
    messenger: '#0084ff',
    telegram: '#29b6f6',
    sms: '#a78bfa',
    email: '#8b8cf7',
    facebook: '#1877f2',
  } satisfies V2Channels,
  intent: {
    pricing: '#a78bfa',
    support: '#34d399',
    lead: '#5fa8ff',
    urgent: '#ef4444',
  } satisfies Record<V2Intent, string>,
} as const;

/** RGB triple of `accent.200`, used for shadow / halo composition. */
export const accentRgb = '139, 140, 247';

/** RGB triple of `accent.300`. */
export const accentDeepRgb = '99, 102, 241';

export type ColorsV2 = typeof colorsV2;
