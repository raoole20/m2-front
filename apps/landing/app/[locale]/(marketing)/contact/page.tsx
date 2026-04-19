import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("landing.contact");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-extrabold text-text-primary">{t("title")}</h1>
      <p className="mt-4 text-text-secondary">{t("description")}</p>
      <a className="mt-6 inline-flex text-primary underline" href="mailto:contact@motomoto.app">
        contact@motomoto.app
      </a>
    </main>
  );
}
