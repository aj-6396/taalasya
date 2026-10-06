import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://taalasya.vercel.app");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/scan", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/scan", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
