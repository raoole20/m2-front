import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { defaultLocale, locales } from "@m2/i18n";

import type { Lang } from "@/src/lib/content";
import { Channels } from "@/src/components/landing/Channels";
import { CursorGlow } from "@/src/components/landing/CursorGlow";
import { FinalCTA } from "@/src/components/landing/FinalCTA";
import { Footer } from "@/src/components/landing/Footer";
import { Hero } from "@/src/components/landing/Hero";
import { HowItWorks } from "@/src/components/landing/HowItWorks";
import { InboxSection } from "@/src/components/landing/InboxSection";
import { LogosBar } from "@/src/components/landing/LogosBar";
import { MetricsStrip } from "@/src/components/landing/MetricsStrip";
import { Nav } from "@/src/components/landing/Nav";
import { Pricing } from "@/src/components/landing/Pricing";
import { Testimonials } from "@/src/components/landing/Testimonials";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) {
    notFound();
  }

  const activeLocale = (locale || defaultLocale) as Lang;

  return (
    <div className="prop-b3">
      <CursorGlow />
      <Nav locale={activeLocale} />
      <main>
        <Hero locale={activeLocale} />
        <LogosBar />
        <MetricsStrip />
        <Channels />
        <InboxSection />
        <Testimonials />
        <HowItWorks />
        <Pricing />
        <FinalCTA locale={activeLocale} />
      </main>
      <Footer locale={activeLocale} />
    </div>
  );
}
