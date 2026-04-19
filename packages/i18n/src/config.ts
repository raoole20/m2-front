export const locales = ["es", "en"] as const;

export const defaultLocale = "es" as const;

export const localePrefix = "as-needed" as const;

export type Locale = (typeof locales)[number];
