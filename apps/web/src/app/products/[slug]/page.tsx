import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface ProductVariant {
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Array<{ name: string; value: string }>;
  images: string[];
  isActive: boolean;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  summary?: string;
  metaTitle?: string;
  metaDescription?: string;
  images: string[];
  brand: Brand | string;
  category: Category | string;
  variants: ProductVariant[];
  ratings: {
    average: number;
    count: number;
  };
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/v1/products/${slug}`, {
      next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
    });
    if (!res.ok) return null;
    return res.json() as Promise<Product>;
  } catch {
    return null;
  }
}

// ─── generateMetadata ────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com";
  const brandName =
    typeof product.brand === "object" ? product.brand.name : "LXUY SIGNATURE";
  const title =
    product.metaTitle || `${product.name} — ${brandName}`;
  const description =
    product.metaDescription ||
    product.summary ||
    product.description.slice(0, 155);
  const canonicalUrl = `${siteUrl}/products/${slug}`;
  const coverImage = product.images?.[0] ?? `${siteUrl}/images/hero/invetsinyo.jpg`;
  const price = product.variants?.[0]?.price ?? 0;
  const priceFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: "LXUY",
      title: `${title} | LXUY`,
      description,
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: `${product.name} — ${brandName} | LXUY`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | LXUY`,
      description,
      images: [coverImage],
    },
    other: {
      "product:price:amount": price.toString(),
      "product:price:currency": "INR",
      "product:price:formatted": priceFormatted,
    },
  };
}

// ─── JSON-LD structured data ──────────────────────────────────────────────────
function ProductJsonLd({ product }: { product: Product }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com";
  const brandName =
    typeof product.brand === "object" ? product.brand.name : "LXUY SIGNATURE";
  const price = product.variants?.[0]?.price ?? 0;
  const hasStock = product.variants?.some((v) => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    url: `${siteUrl}/products/${product.slug}`,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    sku: product.variants?.[0]?.sku,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "INR",
      price: price,
      priceValidUntil: "2026-12-31",
      availability: hasStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "LXUY",
      },
    },
    ...(product.ratings?.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratings.average.toFixed(1),
            reviewCount: product.ratings.count,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ─── BreadcrumbList JSON-LD ───────────────────────────────────────────────────
function BreadcrumbJsonLd({ product }: { product: Product }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com";
  const categoryName =
    typeof product.category === "object" ? product.category.name : "Collection";
  const categorySlug =
    typeof product.category === "object" ? product.category.slug : null;

  const items = [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    ...(categorySlug
      ? [
          {
            "@type": "ListItem",
            position: 2,
            name: categoryName,
            item: `${siteUrl}/collections/${categorySlug}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.name,
            item: `${siteUrl}/products/${product.slug}`,
          },
        ]
      : [
          {
            "@type": "ListItem",
            position: 2,
            name: product.name,
            item: `${siteUrl}/products/${product.slug}`,
          },
        ]),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ─── Page Component (Server) ──────────────────────────────────────────────────
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd product={product} />
      <ProductDetailClient product={product} />
    </>
  );
}
