import createMiddleware from "next-intl/middleware";

import { defaultLocale, localePrefix, locales } from "@m2/i18n";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
