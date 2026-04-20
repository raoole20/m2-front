import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { defaultLocale, locales } from "@m2/i18n";

import type { Lang } from "../../lib/content";
import { Channels } from "./_components/Channels";
import { FinalCTA } from "./_components/FinalCTA";
import { Footer } from "./_components/Footer";
import { Hero } from "./_components/Hero";
import { HowItWorks } from "./_components/HowItWorks";
import { InboxSection } from "./_components/InboxSection";
import { Nav } from "./_components/Nav";
import { Pricing } from "./_components/Pricing";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) {
    notFound();
  }

  const activeLocale = (locale || defaultLocale) as Lang;

  return (
    <div className="prop-b">
      <Nav locale={activeLocale} />
      <main>
        <Hero locale={activeLocale} />
        <Channels />
        <InboxSection />
        <HowItWorks />
        <Pricing />
        <FinalCTA locale={activeLocale} />
      </main>
      <Footer locale={activeLocale} />
    </div>
  );
}
