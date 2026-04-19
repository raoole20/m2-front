import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { defaultLocale, locales } from "@m2/i18n";

import { AIHighlight } from "./_components/AIHighlight";
import { ChannelsStrip } from "./_components/ChannelsStrip";
import { FeaturesGrid } from "./_components/FeaturesGrid";
import { Footer } from "./_components/Footer";
import { Hero } from "./_components/Hero";
import { Navbar } from "./_components/Navbar";
import { PricingCTA } from "./_components/PricingCTA";
import { Testimonials } from "./_components/Testimonials";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) {
    notFound();
  }

  const activeLocale = locale || defaultLocale;

  return (
    <main className="pb-10">
      <Navbar locale={activeLocale} />
      <Hero locale={activeLocale} />
      <ChannelsStrip />
      <FeaturesGrid />
      <AIHighlight />
      <Testimonials />
      <PricingCTA />
      <Footer locale={activeLocale} />
    </main>
  );
}
