import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, localePrefix, locales } from "@m2/i18n";

const intl = createIntlMiddleware({ locales, defaultLocale, localePrefix });

const PUBLIC_PATHS = ["/admin/login"];

function stripLocale(pathname: string): string {
  const first = pathname.split("/")[1];
  if (!first) {
    return pathname;
  }

  return locales.includes(first as (typeof locales)[number])
    ? pathname.slice(first.length + 1)
    : pathname;
}

export default function middleware(req: NextRequest) {
  const intlResponse = intl(req);
  const location = intlResponse.headers.get("location");
  if (intlResponse.status !== 200 && location) {
    return intlResponse;
  }

  const withoutLocale = stripLocale(req.nextUrl.pathname);
  const requiresAuth =
    withoutLocale.startsWith("/admin") &&
    !PUBLIC_PATHS.some((p) => withoutLocale === p || withoutLocale.startsWith(`${p}/`));

  if (requiresAuth && !req.cookies.has("m2_session")) {
    const loginUrl = req.nextUrl.clone();
    const locale = req.nextUrl.pathname.split("/")[1];
    loginUrl.pathname = locales.includes(locale as (typeof locales)[number])
      ? `/${locale}/admin/login`
      : `/${defaultLocale}/admin/login`;
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
