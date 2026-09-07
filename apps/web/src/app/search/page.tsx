import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();

  return {
    title: query ? `Search results for "${query}"` : "Search",
    description: query
      ? `Browse LXUY search results for "${query}" — discover premium menswear, luxury fashion, and curated editorial collections.`
      : "Search the LXUY catalog — discover premium menswear, luxury fashion, and curated editorial collections.",
    robots: {
      // Search result pages should not be indexed by Google
      index: false,
      follow: true,
    },
  };
}

export default function SearchPage() {
  return <SearchClient />;
}
