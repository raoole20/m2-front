import { MessageCircle, Send, Instagram, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function ChannelsStrip() {
  const t = await getTranslations("landing.channels");

  const items = [
    { key: "whatsapp", icon: MessageCircle },
    { key: "instagram", icon: Instagram },
    { key: "telegram", icon: Send },
    { key: "email", icon: Mail },
  ] as const;

  return (
    <section className="px-6 py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              aria-label={t(item.key)}
              className="flex items-center gap-3 rounded-xl border border-stroke-subtle bg-surface-container/70 px-4 py-3 text-text-primary"
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{t(item.key)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
