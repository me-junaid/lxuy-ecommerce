"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchFlyout } from './SearchFlyout';

export interface HeaderProps {
  brandName?: string;
  cartCount?: number;
  onCartClick?: () => void;
  onProfileClick?: () => void;
  onSearchClick?: () => void;
  onLogoClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  onProductClick?: (slug: string) => void;
  user?: { firstName: string; lastName: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  brandName = 'LXUY',
  cartCount = 0,
  onCartClick,
  onProfileClick,
  onSearchClick,
  onLogoClick,
  onSearchSubmit,
  onProductClick,
  user = null,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState<{
    menuKey: string;
    imageUrl: string;
    title: string;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);

  const activeMenImage = hoveredMenuItem?.menuKey === 'men'
    ? hoveredMenuItem.imageUrl
    : '/images/models/modules8.jpeg';
  const activeMenTitle = hoveredMenuItem?.menuKey === 'men'
    ? hoveredMenuItem.title
    : "Men's Tailoring";

  const activeWomenImage = hoveredMenuItem?.menuKey === 'women'
    ? hoveredMenuItem.imageUrl
    : '/images/models/modules11.jpeg';
  const activeWomenTitle = hoveredMenuItem?.menuKey === 'women'
    ? hoveredMenuItem.title
    : "Women's Silhouette Edit";

  const activeNewImage = hoveredMenuItem?.menuKey === 'new-arrivals'
    ? hoveredMenuItem.imageUrl
    : '/images/models/modules5.jpeg';

  const renderMobileSubmenuLink = (
    label: string,
    menuKey: string,
    imageUrl: string
  ) => {
    const isSelected = hoveredMenuItem?.menuKey === menuKey && hoveredMenuItem?.title === label;

    return (
      <div key={label} className="flex items-center justify-between py-1.5 border-b border-luxury-silver/5 min-h-[36px]">
        <div className="flex items-center flex-1">
          {isSelected && (
            <div
              className="w-[50%] max-h-[160px] overflow-hidden rounded-sm bg-luxury-silver/10 flex-shrink-0 mr-3 animate-fade-in"
            >
              <img src={imageUrl} alt={label} className="w-full h-full object-cover animate-scale-up" />
            </div>
          )}
          <a
            href="#"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-[11px] text-neutral-700 font-medium transition-all duration-300 ${isSelected ? 'text-luxury-gold font-bold translate-x-1' : ''
              }`}
          >
            {label}
          </a>
        </div>

        {!isSelected && (
          <button
            onClick={() => setHoveredMenuItem({ menuKey, imageUrl, title: label })}
            className="text-[9px] uppercase tracking-luxury text-neutral-400 hover:text-luxury-gold focus:outline-none bg-transparent border-none cursor-pointer"
          >
            Preview
          </button>
        )}
      </div>
    );
  };

  const categories: Array<{ label: string; href: string; menuKey?: string; isSale?: boolean }> = [
    { label: 'Sale', href: '#', isSale: true },
    { label: 'New Arrivals', href: '#', menuKey: 'new-arrivals' },
    { label: 'Men', href: '#', menuKey: 'men' },
    { label: 'Women', href: '#', menuKey: 'women' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-45 border-b border-luxury-silver/30 bg-[#FDFBF7] transition-all duration-300">

        {/* Row 1: Top Bar (Logo & Actions) */}
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between relative">

          {/* Left: Support Links (Desktop Only) */}
          <div className="hidden md:flex md:flex-1 md:items-center">
            <div className="flex space-x-6 text-[10px] uppercase tracking-luxury font-medium text-neutral-500">
              <a href="#" className="hover:text-luxury-gold transition-colors">Stores</a>
              <span className="text-neutral-300">|</span>
              <a href="#" className="hover:text-luxury-gold transition-colors">Support</a>
            </div>
          </div>

          {/* Center: Logo (Left-aligned on mobile, absolute-centered on desktop) */}
          <div className="flex-shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 text-left md:text-center">
            {onLogoClick ? (
              <button
                onClick={onLogoClick}
                className="flex items-center justify-center hover:opacity-85 transition-opacity bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                aria-label="Go to homepage"
              >
                <img
                  src="/images/LOGO/lxuy-logo.png"
                  alt={brandName}
                  className="h-10 w-auto object-contain"
                />
              </button>
            ) : (
              <a
                href="/"
                className="inline-flex items-center justify-center hover:opacity-85 transition-opacity"
              >
                <img
                  src="/images/LOGO/lxuy-logo.jpeg"
                  alt={brandName}
                  className="h-10 w-auto object-contain"
                />
              </a>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex-1 md:flex-none flex items-center justify-end space-x-4 md:space-x-5">
            {/* Search */}
            <button
              onClick={() => {
                setIsSearchOpen(true);
                if (onSearchClick) onSearchClick();
              }}
              className="text-luxury-dark hover:text-luxury-gold p-1 outline-none transition-colors duration-300"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Profile */}
            {user ? (
              <button
                onClick={onProfileClick}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-luxury-gold/15 text-luxury-dark border border-luxury-gold/30 hover:border-luxury-gold hover:bg-luxury-gold/20 transition-all duration-300 text-xs font-semibold tracking-wider"
                title={`${user.firstName} ${user.lastName}`}
              >
                {user.firstName[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
              </button>
            ) : (
              <button
                onClick={onProfileClick}
                className="text-luxury-dark hover:text-luxury-gold p-1 outline-none transition-colors duration-300"
                aria-label="Account"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}

            {/* Wishlist */}
            <button
              className="text-luxury-dark hover:text-luxury-gold p-1 outline-none transition-colors duration-300 hidden md:inline-block"
              aria-label="Wishlist"
            >
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative text-luxury-dark hover:text-luxury-gold p-1 outline-none transition-colors duration-300"
              aria-label="Shopping Cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-luxury-gold text-[#FDFBF7] text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold tracking-tight">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle (Positioned on the far right on mobile viewports) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-luxury-dark p-1 outline-none ml-1"
              aria-label="Open Mobile Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Row 2: Desktop Navigation Bar */}
        <div className="hidden md:block w-full border-t border-luxury-silver/20 bg-[#FDFBF7]">
          <div className="max-w-7xl mx-auto flex justify-center space-x-12 h-12 items-center">
            {categories.map((cat) => (
              <div
                key={cat.label}
                onMouseEnter={() => cat.menuKey && setActiveMenu(cat.menuKey)}
                onMouseLeave={() => setActiveMenu(null)}
                className="h-full flex items-center"
              >
                <a
                  href={cat.href}
                  className={`text-xs uppercase tracking-widest font-medium py-2.5 transition-colors duration-300 relative ${cat.isSale
                      ? 'text-red-600 hover:text-red-700 font-semibold'
                      : 'text-neutral-700 hover:text-luxury-gold'
                    }`}
                >
                  {cat.label}
                  {activeMenu === cat.menuKey && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-luxury-gold" />
                  )}
                </a>

                {/* Desktop Mega Menu Dropdown */}
                {cat.menuKey && (
                  <AnimatePresence>
                    {activeMenu === cat.menuKey && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 right-0 w-full top-full bg-[#FDFBF7] border-b border-luxury-silver/30 shadow-xl z-50 py-12 px-12"
                        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                      >
                        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 text-left">
                          {cat.menuKey === 'new-arrivals' && (
                            <>
                              {/* Col 1: All */}
                              <div className="col-span-2 flex flex-col space-y-3">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/25 pb-2">All</h4>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Women</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Men</a>
                              </div>
                              {/* Col 2: New In */}
                              <div className="col-span-3 flex flex-col space-y-2">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/25 pb-2">New In</h4>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Polo Ralph Lauren</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Fred Perry</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Karl Lagerfeld</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Giuseppe Zanotti</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"> Kitsuné</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Casablanca</a>
                              </div>
                              {/* Col 3: Brands */}
                              <div className="col-span-3 flex flex-col space-y-2">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/25 pb-2">Brands</h4>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Vivienne Westwood</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Marc Jacobs</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Hackett London</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Ted Baker</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Michael Kors</a>
                                <a href="#" className="text-xs text-luxury-gold underline tracking-wide font-medium mt-2">View All Brands</a>
                              </div>
                              {/* Col 4: Promos */}
                              <div className="col-span-4 grid grid-cols-2 gap-4">
                                <div className="relative aspect-[3/4] overflow-hidden bg-luxury-silver/10">
                                  <img src="/images/models/modules5.jpeg" alt="Promo 1" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/15 flex flex-col justify-end p-3">
                                    <span className="text-[9px] text-white uppercase tracking-luxury font-bold">New Arrivals</span>
                                    <span className="text-[8px] text-white/80 uppercase font-medium underline tracking-wide">Shop Now</span>
                                  </div>
                                </div>
                                <div className="relative aspect-[3/4] overflow-hidden bg-luxury-silver/10">
                                  <img src="/images/models/modules6.jpeg" alt="Promo 2" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/15 flex flex-col justify-end p-3">
                                    <span className="text-[9px] text-white uppercase tracking-luxury font-bold">The Lookbook</span>
                                    <span className="text-[8px] text-white/80 uppercase font-medium underline tracking-wide">Explore</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {cat.menuKey === 'men' && (
                            <>
                              {/* Col 1: Categories */}
                              <div className="col-span-3 flex flex-col space-y-2">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/25 pb-2">Clothing</h4>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'men', imageUrl: '/images/models/modules2.jpeg', title: 'Jackets & Coats' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Jackets & Coats
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'men', imageUrl: '/images/models/modules6.jpeg', title: 'Casual Shirts' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Casual Shirts
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'men', imageUrl: '/images/models/modules12.jpeg', title: 'Knitwear' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Knitwear
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'men', imageUrl: '/images/models/modules6.jpeg', title: 'Trousers' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Trousers
                                </a>
                              </div>
                              {/* Col 2: Brands */}
                              <div className="col-span-3 flex flex-col space-y-2">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/25 pb-2">Featured Brands</h4>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'men', imageUrl: '/images/models/modules8.jpeg', title: 'Polo Ralph Lauren' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Polo Ralph Lauren
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'men', imageUrl: '/images/models/modules6.jpeg', title: 'Fred Perry' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Fred Perry
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'men', imageUrl: '/images/models/modules2.jpeg', title: 'Hackett London' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Hackett London
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'men', imageUrl: '/images/models/modules8.jpeg', title: ' Kitsuné' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Kitsuné
                                </a>
                              </div>
                              {/* Col 3: Promo */}
                              <div className="col-span-6 grid grid-cols-2 gap-4">
                                <div className="relative aspect-[16/10] overflow-hidden bg-luxury-silver/10 col-span-2">
                                  <AnimatePresence mode="wait">
                                    <motion.img
                                      key={activeMenImage}
                                      src={activeMenImage}
                                      alt={activeMenTitle}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.25 }}
                                      className="w-full h-full object-cover absolute inset-0"
                                    />
                                  </AnimatePresence>
                                  <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4 z-10 pointer-events-none">
                                    <span className="text-xs text-white uppercase tracking-luxury font-bold">{activeMenTitle}</span>
                                    <span className="text-[9px] text-white/80 uppercase font-medium underline tracking-wide">View Collection</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {cat.menuKey === 'women' && (
                            <>
                              {/* Col 1: Categories */}
                              <div className="col-span-3 flex flex-col space-y-2">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/25 pb-2">Clothing</h4>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'women', imageUrl: '/images/models/modules1.jpeg', title: 'Dresses & Jumpsuits' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Dresses & Jumpsuits
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'women', imageUrl: '/images/models/modules4.jpeg', title: 'Blouses & Tops' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Blouses & Tops
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'women', imageUrl: '/images/models/modules2.jpeg', title: 'Coats & Trenchcoats' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Coats & Trenchcoats
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'women', imageUrl: '/images/models/modules6.jpeg', title: 'Trousers & Skirts' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Trousers & Skirts
                                </a>
                              </div>
                              {/* Col 2: Brands */}
                              <div className="col-span-3 flex flex-col space-y-2">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/25 pb-2">Featured Brands</h4>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'women', imageUrl: '/images/models/modules1.jpeg', title: 'Vivienne Westwood' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Vivienne Westwood
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'women', imageUrl: '/images/models/modules5.jpeg', title: 'Marc Jacobs' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Marc Jacobs
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'women', imageUrl: '/images/models/modules11.jpeg', title: 'Coccinelle' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  Coccinelle
                                </a>
                                <a
                                  href="#"
                                  className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors"
                                  onMouseEnter={() => setHoveredMenuItem({ menuKey: 'women', imageUrl: '/images/models/modules2.jpeg', title: 'LXUY Signature' })}
                                  onMouseLeave={() => setHoveredMenuItem(null)}
                                >
                                  LXUY Signature
                                </a>
                              </div>
                              {/* Col 3: Promo */}
                              <div className="col-span-6 grid grid-cols-2 gap-4">
                                <div className="relative aspect-[16/10] overflow-hidden bg-luxury-silver/10 col-span-2">
                                  <AnimatePresence mode="wait">
                                    <motion.img
                                      key={activeWomenImage}
                                      src={activeWomenImage}
                                      alt={activeWomenTitle}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.25 }}
                                      className="w-full h-full object-cover absolute inset-0"
                                    />
                                  </AnimatePresence>
                                  <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4 z-10 pointer-events-none">
                                    <span className="text-xs text-white uppercase tracking-luxury font-bold">{activeWomenTitle}</span>
                                    <span className="text-[9px] text-white/80 uppercase font-medium underline tracking-wide">View Collection</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                          {hoveredMenuItem && (
                            <motion.div
                              style={{
                                position: 'fixed',
                                left: mousePos.x + 15,
                                top: mousePos.y + 15,
                                pointerEvents: 'none',
                                zIndex: 100,
                              }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.1, ease: 'easeOut' }}
                              className="w-24 h-32 overflow-hidden shadow-2xl border border-white rounded-sm bg-[#FDFBF7]"
                            >
                              <img
                                src={hoveredMenuItem.imageUrl}
                                alt="cursor follow"
                                className="w-full h-full object-cover"
                              />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>
        </div>
      </header>
      <div className="h-16 md:h-[128px] w-full flex-shrink-0" />

      {/* Mobile Drawer Menu (Slide out from left) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* dark background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />

            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xs bg-[#FDFBF7] shadow-2xl overflow-y-auto flex flex-col p-6"
            >
              {/* Close Button */}
              <div className="flex justify-end mb-8">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 outline-none text-luxury-dark"
                  aria-label="Close Mobile Menu"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col space-y-4 text-left">
                {categories.map((link) => {
                  const hasSubmenu = !!link.menuKey;
                  const isExpanded = expandedMobileMenu === link.menuKey;

                  return (
                    <div key={link.label} className="border-b border-luxury-silver/20 pb-3">
                      {hasSubmenu ? (
                        <button
                          onClick={() => setExpandedMobileMenu(isExpanded ? null : link.menuKey!)}
                          className="w-full flex items-center justify-between text-left text-sm uppercase tracking-widest font-semibold py-1.5 text-luxury-dark focus:outline-none bg-transparent border-none cursor-pointer"
                        >
                          <span>{link.label}</span>
                          <svg
                            className={`w-4 h-4 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block text-sm uppercase tracking-widest font-semibold py-1.5 ${link.isSale ? 'text-red-600' : 'text-luxury-dark'
                            }`}
                        >
                          {link.label}
                        </a>
                      )}

                      {/* Expanded Submenu Content */}
                      {hasSubmenu && isExpanded && (
                        <div className="mt-3 pl-4 space-y-5">
                          {link.menuKey === 'new-arrivals' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/10 pb-1 block">
                                  New In
                                </span>

                                <div className="flex flex-col space-y-1.5 pl-1 text-[11px] text-neutral-700 font-medium">
                                  <a
                                    href="/new-arrivals?category=women"
                                    className="transition-colors hover:text-black"
                                  >
                                    Women
                                  </a>

                                  <a
                                    href="/new-arrivals?category=men"
                                    className="transition-colors hover:text-black"
                                  >
                                    Men
                                  </a>
                                </div>
                              </div>

                              {/* <div className="relative aspect-[16/10] overflow-hidden bg-luxury-silver/5 rounded-sm mt-3 shadow-sm">
      <img
        src="/images/models/modules5.jpeg"
        alt="New Arrivals"
        className="w-full h-full object-cover"
      />
    </div> */}
                            </div>
                          )}

                          {link.menuKey === 'men' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/10 pb-1 block">Clothing</span>
                                <div className="flex flex-col space-y-1.5 pl-1 text-[11px] text-neutral-700 font-medium">
                                  {renderMobileSubmenuLink('Jackets & Coats', 'men', '/images/models/modules2.jpeg')}
                                  {renderMobileSubmenuLink('Casual Shirts', 'men', '/images/models/modules6.jpeg')}
                                  {renderMobileSubmenuLink('Knitwear', 'men', '/images/models/modules12.jpeg')}
                                  {renderMobileSubmenuLink('Trousers', 'men', '/images/models/modules6.jpeg')}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/10 pb-1 block">Featured Brands</span>
                                <div className="flex flex-col space-y-1.5 pl-1 text-[11px] text-neutral-700 font-medium">
                                  {renderMobileSubmenuLink('Polo Ralph Lauren', 'men', '/images/models/modules8.jpeg')}
                                  {renderMobileSubmenuLink('Fred Perry', 'men', '/images/models/modules6.jpeg')}
                                  {renderMobileSubmenuLink('Hackett London', 'men', '/images/models/modules2.jpeg')}
                                  {renderMobileSubmenuLink(' Kitsuné', 'men', '/images/models/modules8.jpeg')}
                                </div>
                              </div>
                              {/* <div className="relative aspect-[16/10] overflow-hidden bg-luxury-silver/5 rounded-sm mt-3 shadow-sm">
                                <img src={activeMenImage} alt="Men's Tailoring" className="w-full h-full object-cover" />
                              </div> */}
                            </div>
                          )}

                          {link.menuKey === 'women' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/10 pb-1 block">Clothing</span>
                                <div className="flex flex-col space-y-1.5 pl-1 text-[11px] text-neutral-700 font-medium">
                                  {renderMobileSubmenuLink('Dresses & Jumpsuits', 'women', '/images/models/modules1.jpeg')}
                                  {renderMobileSubmenuLink('Blouses & Tops', 'women', '/images/models/modules4.jpeg')}
                                  {renderMobileSubmenuLink('Coats & Trenchcoats', 'women', '/images/models/modules2.jpeg')}
                                  {renderMobileSubmenuLink('Trousers & Skirts', 'women', '/images/models/modules6.jpeg')}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/10 pb-1 block">Featured Brands</span>
                                <div className="flex flex-col space-y-1.5 pl-1 text-[11px] text-neutral-700 font-medium">
                                  {renderMobileSubmenuLink('Vivienne Westwood', 'women', '/images/models/modules1.jpeg')}
                                  {renderMobileSubmenuLink('Marc Jacobs', 'women', '/images/models/modules5.jpeg')}
                                  {renderMobileSubmenuLink('Coccinelle', 'women', '/images/models/modules11.jpeg')}
                                  {renderMobileSubmenuLink('LXUY Signature', 'women', '/images/models/modules2.jpeg')}
                                </div>
                              </div>
                              {/* <div className="relative aspect-[16/10] overflow-hidden bg-luxury-silver/5 rounded-sm mt-3 shadow-sm">
                                <img src={activeWomenImage} alt="Women's Silhouette Edit" className="w-full h-full object-cover" />
                              </div> */}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              <div className="w-full h-[1px] bg-luxury-silver/30 my-6" />

              <div className="flex flex-col space-y-3 text-left">
                <a href="#" className="text-xs uppercase tracking-luxury text-neutral-500 font-medium">Store Locator</a>
                <a href="#" className="text-xs uppercase tracking-luxury text-neutral-500 font-medium">Customer Support</a>
              </div>

              <div className="mt-auto pt-6 text-left">
                <a
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs uppercase tracking-luxury font-bold border-b border-luxury-dark pb-1 text-luxury-dark"
                >
                  Sign In
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Luxury Search Flyout Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <SearchFlyout
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSearchSubmit={onSearchSubmit}
            onProductClick={onProductClick}
          />
        )}
      </AnimatePresence>
    </>
  );
};
