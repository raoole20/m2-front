import type { ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-left": <path d="M19 12H5M11 18l-6-6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  filter: <path d="M3 6h18M6 12h12M10 18h4" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  close: <path d="M18 6L6 18M6 6l12 12" />,
  check: <path d="M5 13l4 4L19 7" />,
  "chevron-right": <path d="M9 18l6-6-6-6" />,
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 118 0v4" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" />
    </>
  ),
  home: <path d="M3 12l9-9 9 9M5 10v10h14V10" />,
  inbox: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 13h5l2 3h4l2-3h5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <circle cx="17" cy="8" r="3" />
      <path d="M15 20c0-2 1.5-3.5 3-4 2 .5 3 2 3 4" />
    </>
  ),
  "bar-chart": (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 14v4M12 9v9M17 5v13" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </>
  ),
  sparkles: (
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14zM5 5l.6 1.5L7 7l-1.4.5L5 9l-.6-1.5L3 7l1.4-.5L5 5z" />
  ),
  bolt: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
  bell: (
    <>
      <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 004 0" />
    </>
  ),
  tag: (
    <>
      <path d="M20 12l-8 8-8-8V4h8z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  paperclip: (
    <path d="M21 11l-8 8a5.5 5.5 0 01-7.8-7.8l8-8a4 4 0 115.6 5.6l-8 8a2.5 2.5 0 01-3.5-3.5l7-7" />
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </>
  ),
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  phone: (
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  ),
  video: (
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M22 8l-6 4 6 4z" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M12 4v4M8 14h.01M16 14h.01M9 17h6" />
      <circle cx="2" cy="14" r="1" />
      <circle cx="22" cy="14" r="1" />
    </>
  ),
  flame: <path d="M12 2s4 4 4 9a4 4 0 01-8 0c0-2 1-3 1-3s-1 1-1 4a6 6 0 0012 0c0-6-8-10-8-10z" />,
  whatsapp: (
    <path d="M17.5 6.5A7.8 7.8 0 006 17.5L5 21l3.6-1A7.8 7.8 0 0017.5 6.5zM9 9c.5 0 .8.3 1 .8l.4 1c.1.3 0 .6-.2.8l-.5.5c.5 1 1.4 2 2.4 2.4l.5-.5c.2-.2.5-.3.8-.2l1 .4c.5.2.8.5.8 1 0 1.3-1 2.3-2.3 2.3A6.5 6.5 0 016.7 11C6.7 9.7 7.7 9 9 9z" />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </>
  ),
  telegram: <path d="M22 3L2 11l5 2 2 7 3-4 5 4L22 3z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </>
  ),
  "log-out": (
    <>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  "trending-up": <path d="M3 17l6-6 4 4 8-8M14 7h7v7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  "user-plus": (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M19 8v6M22 11h-6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 2L2 20h20L12 2z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
  shield: <path d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z" />,
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l7-7M15 8l3 3M18 5l3 3" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </>
  ),
  rocket: (
    <path d="M9 11c-2 2-3 5-3 9 4 0 7-1 9-3M13 13s5 2 8-3c1-2 1-5 0-8-3-1-6-1-8 0-5 3-3 8-3 8M11 9l4 4" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  archive: (
    <>
      <rect x="3" y="5" width="18" height="4" rx="1" />
      <path d="M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9M10 13h4" />
    </>
  ),
  star: <path d="M12 3l2.9 6 6.1.6-4.6 4.2 1.4 6.2L12 17l-5.8 3 1.4-6.2L3 9.6 9.1 9z" />,
  refresh: <path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" />,
};

type Props = {
  name: keyof typeof PATHS | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function AppIcon({ name, size = 16, color = "currentColor", strokeWidth = 1.75 }: Props) {
  const content = PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {content}
    </svg>
  );
}
