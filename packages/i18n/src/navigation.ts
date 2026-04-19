// Navigation helpers are exported as a lightweight adapter and wired in each app.
// This keeps @m2/i18n usable without forcing Next runtime imports during package tests.
export type NavigationConfig = {
  locales: readonly string[];
  defaultLocale: string;
  localePrefix: "always" | "as-needed" | "never";
};

export function createNavigationConfig(config: NavigationConfig) {
  return config;
}
