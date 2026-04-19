import { Inter, Manrope } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { defaultLocale, locales } from "@m2/i18n";

const displayFont = Manrope({ subsets: ["latin"], variable: "--font-display" });
const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });

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

  const title =
    activeLocale === "es" ? "Motomoto | CRM conversacional" : "Motomoto | Conversational CRM";
  const description =
    activeLocale === "es"
      ? "Unifica WhatsApp, Instagram y correo en una sola bandeja con IA contextual."
      : "Unify WhatsApp, Instagram and email into a single AI-powered inbox.";

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
      siteName: "Motomoto",
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
    <html lang={locale} className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
