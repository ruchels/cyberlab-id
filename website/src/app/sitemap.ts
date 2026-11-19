import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://cyberlab.id";

  const staticRoutes = [
    "",
    "/learning",
    "/academy",
    "/range",
    "/labs",
    "/tools",
    "/challenges",
    "/arena",
    "/arena/teams",
    "/community",
    "/leaderboard",
    "/progress",
    "/contributors",
    "/research",
    "/mentorship",
    "/events",
    "/opensource",
    "/docs",
    "/about",
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/arena" ? "hourly" : "daily",
    priority: route === "" ? 1.0 : route.startsWith("/academy") || route.startsWith("/range") ? 0.9 : 0.7,
  }));
}
