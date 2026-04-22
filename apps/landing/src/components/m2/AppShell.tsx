"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppIcon } from "./AppIcon";

function useBase() {
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";
  return { base, locale, pathname };
}

type AppShellProps = {
  children: ReactNode;
  hideSearch?: boolean;
};

export function AppShell({ children, hideSearch }: AppShellProps) {
  const { base, pathname } = useBase();

  const isActive = (key: string) => {
    if (key === "dashboard") return pathname === base || pathname === `${base}/dashboard`;
    if (key === "inbox") return pathname.startsWith(`${base}/inbox`);
    if (key === "settings") return pathname.startsWith(`${base}/settings`);
    return false;
  };

  const mainItems: { k: string; label: string; icon: string; count?: string; href: string }[] = [
    { k: "dashboard", label: "Dashboard", icon: "home", href: `${base}/dashboard` },
    { k: "inbox", label: "Bandeja", icon: "inbox", count: "13.6k", href: `${base}/inbox` },
  ];

  const channels: { k: string; label: string; count: string; dot: string }[] = [
    { k: "wa", label: "WhatsApp", count: "8.2k", dot: "#25d366" },
    { k: "ig", label: "Instagram", count: "3.4k", dot: "#e1306c" },
    { k: "tg", label: "Telegram", count: "1.1k", dot: "#29b6f6" },
    { k: "em", label: "Email", count: "940", dot: "#a78bfa" },
  ];

  const views: { label: string; icon: string; count?: string }[] = [
    { label: "Prioridad alta", icon: "flame", count: "12" },
    { label: "Necesitan humano", icon: "user-plus", count: "7" },
    { label: "Leads calientes", icon: "trending-up", count: "24" },
    { label: "Archivados", icon: "archive" },
  ];

  return (
    <div className="m2-app">
      <div className="topnav">
        <Link href={`${base}/dashboard`} className="logo">
          <span className="mark">m</span>M2
        </Link>
        <div className="ws-chip">
          <div className="ws-avatar">M</div>
          Mila Café
          <AppIcon name="chevron-down" size={12} color="var(--text-dim)" />
        </div>
        {!hideSearch && (
          <div className="search-bar">
            <AppIcon name="search" size={15} />
            <input placeholder="Buscar chats, contactos, etiquetas…" />
            <span className="kbd">⌘K</span>
          </div>
        )}
        <div className="spacer" />
        <button type="button" className="btn-icon" aria-label="Novedades">
          <AppIcon name="bell" size={17} />
        </button>
        <button type="button" className="btn-icon" aria-label="Ajustes rápidos">
          <AppIcon name="settings" size={17} />
        </button>
        <Link href={`${base}/settings`} className="user-avatar" aria-label="Settings">
          A
        </Link>
      </div>

      <div className="shell">
        <nav className="sidebar">
          {mainItems.map((x) => (
            <Link key={x.k} href={x.href} className={`sb-item ${isActive(x.k) ? "on" : ""}`}>
              <AppIcon name={x.icon} size={15} />
              <span>{x.label}</span>
              {x.count && <span className="count">{x.count}</span>}
            </Link>
          ))}

          <div className="sb-group">Canales</div>
          {channels.map((c) => (
            <Link key={c.k} href={`${base}/inbox?ch=${c.k}`} className="sb-item">
              <span className="ch-dot" style={{ background: c.dot, boxShadow: `0 0 8px ${c.dot}80` }} />
              <span>{c.label}</span>
              <span className="count">{c.count}</span>
            </Link>
          ))}

          <div className="sb-group">Vistas</div>
          {views.map((v, i) => (
            <Link key={i} href={`${base}/inbox`} className="sb-item">
              <AppIcon name={v.icon} size={14} />
              <span>{v.label}</span>
              {v.count && <span className="count">{v.count}</span>}
            </Link>
          ))}

          <div className="sb-group">Configuración</div>
          <Link href={`${base}/settings`} className={`sb-item ${isActive("settings") ? "on" : ""}`}>
            <AppIcon name="settings" size={14} />
            <span>Settings</span>
          </Link>

          <div className="usage-card">
            <div className="usage-head">
              <span>Plan Pro</span>
              <span>14 d</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
              Mensajes IA este mes
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: "62%" }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--text-dim)",
              }}
            >
              <span>6.2k / 10k</span>
              <a href="#" style={{ color: "var(--accent-soft)", textDecoration: "none" }}>
                Upgrade →
              </a>
            </div>
          </div>
        </nav>

        <div>{children}</div>
      </div>
    </div>
  );
}
