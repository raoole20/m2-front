import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminProviders } from "@/src/components/AdminProviders";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "M2 — Admin",
    robots: { index: false, follow: false },
  };
}

export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  return <AdminProviders>{children}</AdminProviders>;
}
