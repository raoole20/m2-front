import type { LucideIcon } from "lucide-react";
import { Instagram, Mail, MessageCircle, Send } from "lucide-react";

export type Lang = "es" | "en";

export type ChannelKey = "whatsapp" | "instagram" | "telegram" | "email";

export const CHANNEL_ICONS: Record<ChannelKey, LucideIcon> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  telegram: Send,
  email: Mail,
};

export const CHANNEL_COLORS: Record<ChannelKey | "all", string> = {
  all: "#8b8cf7",
  whatsapp: "#25d366",
  instagram: "#e1306c",
  telegram: "#29b6f6",
  email: "#a78bfa",
};

export const CHANNEL_GRADIENTS: Record<ChannelKey, string> = {
  whatsapp: "linear-gradient(135deg, #34d399, #059669)",
  instagram: "linear-gradient(135deg, #f472b6, #db2777)",
  telegram: "linear-gradient(135deg, #60a5fa, #2563eb)",
  email: "linear-gradient(135deg, #c4b5fd, #8b5cf6)",
};

export const CHANNEL_BADGE_GRADIENTS: Record<ChannelKey, string> = {
  whatsapp: "linear-gradient(135deg, #25d366, #128c7e)",
  instagram: "linear-gradient(135deg, #e1306c, #c13584)",
  telegram: "linear-gradient(135deg, #29b6f6, #0288d1)",
  email: "linear-gradient(135deg, #a78bfa, #7c3aed)",
};

export const TRUST_AVATAR_GRADIENTS: string[] = [
  "linear-gradient(135deg, #f472b6, #db2777)",
  "linear-gradient(135deg, #60a5fa, #2563eb)",
  "linear-gradient(135deg, #fbbf24, #d97706)",
  "linear-gradient(135deg, #34d399, #059669)",
  "linear-gradient(135deg, #a78bfa, #7c3aed)",
];

export const TESTIMONIAL_AVATAR_GRADIENTS: Record<string, string> = {
  pink: "linear-gradient(135deg, #f472b6, #db2777)",
  blue: "linear-gradient(135deg, #60a5fa, #2563eb)",
  amber: "linear-gradient(135deg, #fbbf24, #d97706)",
  green: "linear-gradient(135deg, #34d399, #059669)",
  violet: "linear-gradient(135deg, #a78bfa, #7c3aed)",
};

export type ChannelItem = {
  key: ChannelKey;
  name: string;
  desc: string;
  sample: string;
};

export type ChannelBadge = {
  key: ChannelKey;
  name: string;
  region: string;
  style: string;
};

export type LogoItem = { text: string; sans: boolean };

export type MetricItem = {
  valuePre: string;
  valueEm: string;
  valueSuf: string;
  label: string;
};

export type TestimonialItem = {
  featured: boolean;
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatar: keyof typeof TESTIMONIAL_AVATAR_GRADIENTS;
};

export type StepItem = { n: string; title: string; desc: string };

export type PriceTier = {
  tier: string;
  price: string;
  per: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

export type NavLink = { label: string; href: string };

export type InboxItem = {
  name: string;
  channel: ChannelKey;
  preview: string;
  time: string;
  initials: string;
};
