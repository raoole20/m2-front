import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.length > 0
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "http://localhost:3001";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      alternates: {
        languages: {
          es: `${siteUrl}/`,
          en: `${siteUrl}/en`,
        },
      },
    },
    {
      url: `${siteUrl}/en`,
      alternates: {
        languages: {
          es: `${siteUrl}/`,
          en: `${siteUrl}/en`,
        },
      },
    },
  ];
}
