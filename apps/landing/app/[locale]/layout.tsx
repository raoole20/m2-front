import { Inter, Instrument_Serif } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { defaultLocale, locales } from "@m2/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.length > 0
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "http://localhost:3001";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = hasLocale(locales, locale) ? locale : defaultLocale;
  const isDefault = activeLocale === defaultLocale;
  const canonical = isDefault ? `${siteUrl}/` : `${siteUrl}/${activeLocale}`;

  const t = await getTranslations({ locale: activeLocale, namespace: "landing.meta" });
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        es: `${siteUrl}/`,
        en: `${siteUrl}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "M2",
      images: [{ url: `${siteUrl}/og-image.svg`, width: 1200, height: 630 }],
      locale: activeLocale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
