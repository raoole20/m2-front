import { getRequestConfig as nextIntlGetRequestConfig } from "next-intl/server";

import { defaultLocale, locales } from "@m2/i18n";
import { getRequestConfig as sharedRequestConfig } from "@m2/i18n";

export default nextIntlGetRequestConfig(async ({ requestLocale }) => {
  const localeCandidate = await requestLocale;
  const locale =
    localeCandidate && locales.includes(localeCandidate as (typeof locales)[number])
      ? (localeCandidate as (typeof locales)[number])
      : defaultLocale;

  const appMessages = (await import(`../messages/${locale}.json`)).default;

  return sharedRequestConfig({
    locale,
    appMessages,
  });
});
