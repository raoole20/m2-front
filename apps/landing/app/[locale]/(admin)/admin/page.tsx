"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminRootPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";

  useEffect(() => {
    router.replace(`/${locale === "es" ? "" : "en/"}admin/dashboard`);
  }, [locale, router]);

  return null;
}
