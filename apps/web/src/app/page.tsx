"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Header,
  Footer,
  AnimatedReveal,
  ProductCard,
  Button,
  Input,
  RecommendationSlider,
} from "@repo/ui";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Local Hero Images
const HERO_SLIDES = [
  {
    image: "/images/hero/invetsinyo.jpg",
    title: "Timeless Aesthetics.",
    subtitle: "Modern Editorial",
    description: "Experience a boutique approach to digital commerce, combining clean typography, editorial imagery, and custom animation physics."
  },
  {
    image: "/images/hero/blalj.jpeg",
    title: "Sought After Silhouettes.",
    subtitle: "The Tailored Edit",
    description: "A study in line, drape, and form. Discover structured coats and fluid blouses designed for modern versatility."
  },
  {
    image: "/images/hero/sokrates.jpeg",
    title: "Architectural Drape.",
    subtitle: "Summer / Autumn Collection",
    description: "Honoring natural fibers, organic geometry, and meticulous details that elevate the everyday wardrobe."
  }
];

// Local Model Product Images
const DUMMY_PRODUCTS = [
  {
    id: "1",
    name: "Draped Silk Blouse",
    brand: "LXUY SIGNATURE",
    price: 450,
    imageUrl: "/images/models/modules1.jpeg",
    badge: "New Collection",
  },
  {
    id: "2",
    name: "Classic Wool Trench Coat",
    brand: "LXUY SIGNATURE",
    price: 890,
    imageUrl: "/images/models/modules2.jpeg",
    badge: "Limited Edition",
  },
  {
    id: "3",
    name: "Linen Wide-Leg Trouser",
    brand: "LXUY SIGNATURE",
    price: 320,
    imageUrl: "/images/models/modules3.jpeg",
  },
  {
    id: "4",
    name: "Ribbed Merino Knit Dress",
    brand: "LXUY SIGNATURE",
    price: 520,
    imageUrl: "/images/models/modules4.jpeg",
  },
];

// Secondary Model Images for Lookbook
const LOOKBOOK_IMAGES = [
  { src: "/images/models/modules5.jpeg", caption: "Structured Comfort", size: "col-span-1 aspect-[3/4]" },
  { src: "/images/models/modules6.jpeg", caption: "Textural Contrast", size: "col-span-1 aspect-[3/4]" },
  { src: "/images/models/modules7.jpeg", caption: "Minimalist Geometry", size: "col-span-2 aspect-[4/3] md:aspect-[16/9]" },
  { src: "/images/models/modules8.jpeg", caption: "Form & Function", size: "col-span-1 aspect-[3/4]" },
  { src: "/images/models/modules9.jpeg", caption: "The Fine Knit", size: "col-span-1 aspect-[3/4]" },
  { src: "/images/models/modules10.jpeg", caption: "Tailoring Details", size: "col-span-1 aspect-[3/4]" },
  { src: "/images/models/modules11.jpeg", caption: "Sartorial Contrast", size: "col-span-1 aspect-[3/4]" },
];

const RECOMMENDED_PRODUCTS = [
  {
    id: "rec-1",
    name: "Classic Beige Linen Suit",
    brand: "POLO RALPH LAUREN",
    price: 18900,
    originalPrice: 27000,
    discount: "30% off",
    imageUrl: "/images/models/modules5.jpeg",
  },
  {
    id: "rec-2",
    name: "Navy Solid Classic Fit Short Sleeve Polo",
    brand: "HACKETT LONDON",
    price: 9600,
    originalPrice: 16000,
    discount: "40% off",
    imageUrl: "/images/models/modules6.jpeg",
  },
  {
    id: "rec-3",
    name: "Sand Linen Casual Jacket",
    brand: "POLO RALPH LAUREN",
    price: 14400,
    originalPrice: 24000,
    discount: "40% off",
    imageUrl: "/images/models/modules7.jpeg",
  },
  {
    id: "rec-4",
    name: "Tan Double-Breasted Editorial Suit",
    brand: "POLO RALPH LAUREN",
    price: 23400,
    originalPrice: 39000,
    discount: "40% off",
    imageUrl: "/images/models/modules8.jpeg",
  },
  {
    id: "rec-5",
    name: "Knitted Polo Cardigan",
    brand: "FRED PERRY",
    price: 8600,
    originalPrice: 12000,
    discount: "28% off",
    imageUrl: "/images/models/modules9.jpeg",
  },
  {
    id: "rec-6",
    name: "Trench Coat Coat Trimmed",
    brand: "KARL LAGERFELD",
    price: 27900,
    originalPrice: 45000,
    discount: "38% off",
    imageUrl: "/images/models/modules10.jpeg",
  },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Auto-rotate hero slider fast (every 2.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = () => {
    setCartCount((prev) => prev + 1);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Email address is required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubscribed(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-all duration-300">
      {/* Premium Header */}
      <Header
        brandName="LXUY"
        cartCount={cartCount}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => router.push("/cart")}
        onProfileClick={() => router.push(user ? "/profile" : "/login")}
        onSearchClick={() => {}}
        onSearchSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
        onProductClick={(slug) => router.push(`/products/${slug}`)}
      />

      <main className="flex-1 flex flex-col">
        
        {/* Editorial Hero Slider Section */}
        <section className="relative w-full h-[calc(100vh-110px)] flex items-center justify-center bg-[#E5E5E5] overflow-hidden">
          
          {/* Slides */}
          <div className="absolute inset-0 z-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentHeroIdx}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: [0.25, 1, 0.5, 1] }}
                className="relative w-full h-full"
              >
                <Image
                  src={HERO_SLIDES[currentHeroIdx].image}
                  alt={HERO_SLIDES[currentHeroIdx].title}
                  fill
                  priority
                  className="w-full h-full object-cover opacity-80"
                />
              </motion.div>
            </AnimatePresence>
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent z-10 pointer-events-none" />
          </div>

          {/* Hero Content Container */}
          <div className="relative z-20 max-w-4xl mx-auto text-center px-6">
              <div
                className="flex flex-col items-center h-[calc(100vh-240px)]"
              >
                {/* <span className="text-xs uppercase tracking-widest text-[#111111] font-bold mb-4 bg-white/70 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
                  {HERO_SLIDES[currentHeroIdx].subtitle}
                </span>
                
                <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight tracking-wide mb-6 text-white drop-shadow-sm">
                  {HERO_SLIDES[currentHeroIdx].title}
                </h1>

                <p className="text-sm md:text-base font-light max-w-lg mx-auto text-white/95 mb-8 leading-relaxed drop-shadow-sm">
                  {HERO_SLIDES[currentHeroIdx].description}
                </p>
                 */}

<div className="mt-auto">
                <Button variant="primary">
                  Explore Shop
                </Button>
</ div>
              </div>
          </div>
        </section>

        {/* Editorial Gender Collections Grid */}
        <section className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 w-full">
            {/* Men's Collection */}
            <AnimatedReveal direction="up" duration={1} className="w-full">
              <div className="relative group overflow-hidden h-[450px] md:h-[600px] bg-luxury-silver/10 shadow-sm flex items-end justify-center pb-12">
                <div className="absolute inset-0 z-0 transition-transform duration-1000 ease-out group-hover:scale-105">
                  <Image
                    src="/images/models/modules8.jpeg"
                    alt="Men's Collection"
                    fill
                    priority
                    className="object-cover object-top"
                  />
                </div>
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />
                
                {/* Content */}
                <div className="relative z-20 text-center flex flex-col items-center px-6">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#FDFBF7]/80 font-medium mb-2 block">
                    The Tailored Silhouette
                  </span>
                  <h2 className="font-serif text-3xl md:text-4.5xl font-light text-[#FDFBF7] mb-6 tracking-wide drop-shadow-sm">
                    Men&apos;s Collection
                  </h2>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/collections/men")}
                  >
                    Shop Men
                  </Button>
                </div>
              </div>
            </AnimatedReveal>

            {/* Women's Collection */}
            <AnimatedReveal direction="up" duration={1} delay={0.15} className="w-full">
              <div className="relative group overflow-hidden h-[450px] md:h-[600px] bg-luxury-silver/10 shadow-sm flex items-end justify-center pb-12">
                <div className="absolute inset-0 z-0 transition-transform duration-1000 ease-out group-hover:scale-105">
                  <Image
                    src="/images/models/modules1.jpeg"
                    alt="Women's Collection"
                    fill
                    priority
                    className="object-cover object-top"
                  />
                </div>
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />
                
                {/* Content */}
                <div className="relative z-20 text-center flex flex-col items-center px-6">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#FDFBF7]/80 font-medium mb-2 block">
                    The Fluid Silhouette
                  </span>
                  <h2 className="font-serif text-3xl md:text-4.5xl font-light text-[#FDFBF7] mb-6 tracking-wide drop-shadow-sm">
                    Women&apos;s Collection
                  </h2>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/collections/women")}
                  >
                    Shop Women
                  </Button>
                </div>
              </div>
            </AnimatedReveal>
          </div>
        </section>

        {/* Full-screen Video Section: Men */}
        <section className="relative w-full h-[65vh] md:h-[85vh] bg-luxury-dark overflow-hidden">
          <video
            src="/videos/men-home-page.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-90 scale-[1.01]"
          />
          {/* Subtle Overlay to match brand aesthetic */}
          <div className="absolute inset-0 bg-black/25 z-10 pointer-events-none" />
          
          {/* Text Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
            <AnimatedReveal direction="up" duration={1.2}>
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#FDFBF7]/90 font-medium mb-3 block">
                Editorial Motion
              </span>
              <h2 className="font-serif text-4xl md:text-6xl font-light text-[#FDFBF7] mb-8 tracking-wide drop-shadow-sm">
                Men&apos;s Tailoring
              </h2>
              <Button
                variant="secondary"
                onClick={() => router.push("/collections/men")}
              >
                Discover Men
              </Button>
            </AnimatedReveal>
          </div>
        </section>

        {/* Full-screen Video Section: Women */}
        <section className="relative w-full h-[65vh] md:h-[85vh] bg-luxury-dark overflow-hidden">
          <video
            src="/videos/women-home-page.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-90 scale-[1.01]"
          />
          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-black/25 z-10 pointer-events-none" />
          
          {/* Text Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
            <AnimatedReveal direction="up" duration={1.2} delay={0.15}>
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#FDFBF7]/90 font-medium mb-3 block">
                The Fluid Silhouette
              </span>
              <h2 className="font-serif text-4xl md:text-6xl font-light text-[#FDFBF7] mb-8 tracking-wide drop-shadow-sm">
                Women&apos;s Silhouette
              </h2>
              <Button
                variant="secondary"
                onClick={() => router.push("/collections/women")}
              >
                Discover Women
              </Button>
            </AnimatedReveal>
          </div>
        </section>

        {/* Curated Product Releases Grid */}
        <section className="max-w-7xl mx-auto px-6 py-24 w-full">
          <AnimatedReveal direction="up" className="mb-12 text-center md:text-left">
            <span className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold mb-2 block">
              Hand-selected items
            </span>
            <h2 className="font-serif text-3xl font-light text-luxury-dark">
              Curated Releases
            </h2>
          </AnimatedReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {DUMMY_PRODUCTS.map((product, index) => (
              <AnimatedReveal
                key={product.id}
                direction="up"
                delay={0.15 * index}
                duration={0.8}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  brand={product.brand}
                  price={product.price}
                  imageUrl={product.imageUrl}
                  badge={product.badge}
                  onAddToCart={handleAddToCart}
                />
              </AnimatedReveal>
            ))}
          </div>
        </section>

        {/* Styles Recommended For You Section */}
        <AnimatedReveal direction="up" delay={0.1}>
          <RecommendationSlider
            products={RECOMMENDED_PRODUCTS}
            onProductClick={(id) => alert(`Product clicked: ${id}`)}
          />
        </AnimatedReveal>

        {/* Editorial Narrative Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 w-full border-t border-luxury-silver/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            
            {/* Story Image */}
            <AnimatedReveal direction="left" duration={1}>
              <div className="relative aspect-[4/5] w-full bg-luxury-silver/10 overflow-hidden shadow-sm">
                <Image
                  src="/images/models/modules12.jpeg"
                  alt="Model Tailoring Portrait"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-102"
                />
              </div>
            </AnimatedReveal>

            {/* Story Text */}
            <div className="flex flex-col space-y-6 text-left">
              <AnimatedReveal direction="up">
                <span className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold block mb-1">
                  Brand Philosophy
                </span>
                <h3 className="font-serif text-3xl md:text-4xl font-light text-luxury-dark leading-tight">
                  The Art of Sartorial Comfort
                </h3>
              </AnimatedReveal>

              <AnimatedReveal direction="up" delay={0.2}>
                <p className="text-sm text-neutral-600 font-light leading-relaxed">
                  Our designs celebrate organic drape, textural geometry, and modern minimalist forms. Using locally sourced, high-grade linen, cashmere, and raw silk fibers, we craft structured silhouettes that feel entirely weightless.
                </p>
                <p className="text-sm text-neutral-600 font-light leading-relaxed mt-4">
                  Each model release explores the boundary between architectural stiffness and natural motion, creating an editorial aesthetic made for everyday luxury living.
                </p>
              </AnimatedReveal>

              <AnimatedReveal direction="up" delay={0.4}>
                <div className="pt-4">
                  <Button variant="outline">
                    Read Our Narrative
                  </Button>
                </div>
              </AnimatedReveal>
            </div>

          </div>
        </section>

        {/* Asymmetric Editorial Lookbook Gallery */}
        <section className="w-full bg-[#F3F0EC] py-24 px-6 border-t border-b border-luxury-silver/20">
          <div className="max-w-7xl mx-auto">
            
            <AnimatedReveal direction="up" className="mb-16 text-center">
              <span className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold mb-2 block">
                Visual Studies
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-luxury-dark">
                Seasonal Lookbook
              </h2>
              <p className="text-xs text-neutral-500 font-light max-w-md mx-auto mt-2 leading-relaxed">
                An ongoing photographic archive capturing our silhouettes in shifting light and architectural environments.
              </p>
            </AnimatedReveal>

            {/* Asymmetric Masonry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              {/* Column 1 */}
              <div className="flex flex-col space-y-8">
                <AnimatedReveal direction="up" delay={0}>
                  <div className="group relative overflow-hidden bg-white/50 aspect-[3/4] w-full">
                    <Image
                      src={LOOKBOOK_IMAGES[0].src}
                      alt={LOOKBOOK_IMAGES[0].caption}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-xs uppercase tracking-luxury font-medium">
                        {LOOKBOOK_IMAGES[0].caption}
                      </span>
                    </div>
                  </div>
                </AnimatedReveal>

                <AnimatedReveal direction="up" delay={0.15}>
                  <div className="group relative overflow-hidden bg-white/50 aspect-[3/4] w-full">
                    <Image
                      src={LOOKBOOK_IMAGES[4].src}
                      alt={LOOKBOOK_IMAGES[4].caption}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-xs uppercase tracking-luxury font-medium">
                        {LOOKBOOK_IMAGES[4].caption}
                      </span>
                    </div>
                  </div>
                </AnimatedReveal>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col space-y-8">
                <AnimatedReveal direction="up" delay={0.1}>
                  <div className="group relative overflow-hidden bg-white/50 aspect-[3/4] w-full">
                    <Image
                      src={LOOKBOOK_IMAGES[1].src}
                      alt={LOOKBOOK_IMAGES[1].caption}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-xs uppercase tracking-luxury font-medium">
                        {LOOKBOOK_IMAGES[1].caption}
                      </span>
                    </div>
                  </div>
                </AnimatedReveal>

                <AnimatedReveal direction="up" delay={0.25}>
                  <div className="group relative overflow-hidden bg-white/50 aspect-[3/4] w-full">
                    <Image
                      src={LOOKBOOK_IMAGES[5].src}
                      alt={LOOKBOOK_IMAGES[5].caption}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-xs uppercase tracking-luxury font-medium">
                        {LOOKBOOK_IMAGES[5].caption}
                      </span>
                    </div>
                  </div>
                </AnimatedReveal>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col space-y-8">
                <AnimatedReveal direction="up" delay={0.2}>
                  <div className="group relative overflow-hidden bg-white/50 aspect-[3/4] w-full">
                    <Image
                      src={LOOKBOOK_IMAGES[3].src}
                      alt={LOOKBOOK_IMAGES[3].caption}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-xs uppercase tracking-luxury font-medium">
                        {LOOKBOOK_IMAGES[3].caption}
                      </span>
                    </div>
                  </div>
                </AnimatedReveal>

                <AnimatedReveal direction="up" delay={0.35}>
                  <div className="group relative overflow-hidden bg-white/50 aspect-[3/4] w-full">
                    <Image
                      src={LOOKBOOK_IMAGES[6].src}
                      alt={LOOKBOOK_IMAGES[6].caption}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-xs uppercase tracking-luxury font-medium">
                        {LOOKBOOK_IMAGES[6].caption}
                      </span>
                    </div>
                  </div>
                </AnimatedReveal>
              </div>

            </div>
          </div>
        </section>

        {/* Newsletter Editorial Signup Section */}
        <section className="bg-luxury-silver/20 py-24 px-6 border-t border-b border-luxury-silver/30">
          <div className="max-w-xl mx-auto text-center">
            <AnimatedReveal direction="up" className="mb-8">
              <h2 className="font-serif text-3xl font-light mb-3">
                Stay In The Loop
              </h2>
              <p className="text-xs text-neutral-500 font-light leading-relaxed">
                Sign up to receive private access to new releases, editorial lookbooks, and seasonal collections.
              </p>
            </AnimatedReveal>

            <AnimatedReveal direction="up" delay={0.2}>
              {subscribed ? (
                <div className="py-8 text-center text-sm font-medium text-luxury-gold">
                  Thank you for subscribing. We will be in touch shortly.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col space-y-4">
                  <Input
                    label="First Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error}
                  />
                  <Button type="submit" variant="outline" className="w-full mt-4">
                    Subscribe
                  </Button>
                </form>
              )}
            </AnimatedReveal>
          </div>
        </section>
      </main>

      {/* Editorial Footer */}
      <Footer />
    </div>
  );
}
