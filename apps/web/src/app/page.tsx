import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "LXUY — Premium Fashion & Luxury Menswear",
  description:
    "Discover curated luxury menswear at LXUY — premium editorial fashion, exclusive collections, and timeless style delivered to your door.",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com",
  },
};

function OrganizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LXUY",
    url: siteUrl,
    logo: `${siteUrl}/images/hero/invetsinyo.jpg`,
    description:
      "LXUY is a luxury menswear and editorial fashion brand offering curated apparel, suits, and accessories.",
    sameAs: [
      "https://instagram.com/lxuy",
      "https://twitter.com/lxuy",
      "https://facebook.com/lxuy",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function WebSiteJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LXUY",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <HomeClient />
    </>
  );
}
