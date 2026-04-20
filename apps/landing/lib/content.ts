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
  all: "#f59e0b",
  whatsapp: "#25d366",
  instagram: "#e1306c",
  telegram: "#29b6f6",
  email: "#a78bfa",
};

export type BubbleVariant = "wa" | "ig" | "tg" | "em" | "m2";

export type Bubble = { variant: BubbleVariant; from: string; text: string };

export type ChannelItem = {
  key: ChannelKey;
  name: string;
  volume: string;
  desc: string;
  sample: string;
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

export type ChannelSummary = { key: ChannelKey | "all"; label: string; volume: string };
