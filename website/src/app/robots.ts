import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/profile/edit"],
      },
    ],
    sitemap: "https://cyberlab.id/sitemap.xml",
  };
}
