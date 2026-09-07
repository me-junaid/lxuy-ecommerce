import type { Metadata } from "next";
import CollectionClient from "./CollectionClient";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/v1/categories/${slug}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<Category>;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com";

  if (!category) {
    return { title: "Collection Not Found", robots: { index: false } };
  }

  const title = `${category.name} Collection`;
  const description =
    category.description
      ? `${category.description} — Shop the ${category.name} collection at LXUY.`
      : `Shop the curated ${category.name} collection at LXUY — premium luxury menswear.`;
  const canonicalUrl = `${siteUrl}/collections/${slug}`;

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
      images: [{ url: `${siteUrl}/images/hero/invetsinyo.jpg`, width: 1200, height: 630, alt: `${category.name} Collection | LXUY` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | LXUY`,
      description,
      images: [`${siteUrl}/images/hero/invetsinyo.jpg`],
    },
  };
}

function BreadcrumbJsonLd({ category }: { category: Category }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: category.name, item: `${siteUrl}/collections/${category.slug}` },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);

  return (
    <>
      {category && <BreadcrumbJsonLd category={category} />}
      <CollectionClient slug={slug} />
    </>
  );
}
