import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { WishlistProvider } from "../context/WishlistContext";
import { CartProvider } from "../context/CartContext";
import { CartDrawer } from "../components/CartDrawer";

const sansFont = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const serifFont = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://lxuy.com"
  ),
  title: {
    default: "LXUY — Premium Fashion & Luxury Menswear",
    template: "%s | LXUY",
  },
  description:
    "Discover curated luxury menswear at LXUY — premium editorial fashion, exclusive collections, and timeless style delivered to your door.",
  keywords: [
    "luxury menswear",
    "premium fashion",
    "designer clothing",
    "editorial fashion",
    "LXUY",
    "luxury brand",
    "menswear India",
  ],
  authors: [{ name: "LXUY", url: "https://lxuy.com" }],
  creator: "LXUY",
  publisher: "LXUY",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://lxuy.com",
    siteName: "LXUY",
    title: "LXUY — Premium Fashion & Luxury Menswear",
    description:
      "Discover curated luxury menswear at LXUY — premium editorial fashion, exclusive collections, and timeless style.",
    images: [
      {
        url: "/images/hero/invetsinyo.jpg",
        width: 1200,
        height: 630,
        alt: "LXUY — Premium Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lxuy",
    creator: "@lxuy",
    title: "LXUY — Premium Fashion & Luxury Menswear",
    description:
      "Discover curated luxury menswear at LXUY — premium editorial fashion, exclusive collections, and timeless style.",
    images: ["/images/hero/invetsinyo.jpg"],
  },
  alternates: {
    canonical: "https://lxuy.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sansFont.variable} ${serifFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              {children}
              <CartDrawer />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
