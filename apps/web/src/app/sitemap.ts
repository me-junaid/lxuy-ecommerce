import type { MetadataRoute } from "next";

interface Product {
  slug: string;
  updatedAt?: string;
  createdAt?: string;
}

interface Category {
  slug: string;
  updatedAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com";
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
  ];

  // Dynamic product routes
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/products?status=published&limit=1000`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      const products: Product[] = data.data || [];
      productRoutes = products.map((p) => ({
        url: `${siteUrl}/products/${p.slug}`,
        lastModified: p.updatedAt
          ? new Date(p.updatedAt)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // silently skip if API is unreachable during build
  }

  // Dynamic collection (category) routes
  let collectionRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/api/v1/categories`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const categories: Category[] = await res.json();
      collectionRoutes = categories.map((c) => ({
        url: `${siteUrl}/collections/${c.slug}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // silently skip if API is unreachable during build
  }

  return [...staticRoutes, ...productRoutes, ...collectionRoutes];
}
