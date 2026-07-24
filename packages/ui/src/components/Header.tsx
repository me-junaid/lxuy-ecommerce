import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HeaderProps {
  brandName?: string;
  cartCount?: number;
  onCartClick?: () => void;
  onProfileClick?: () => void;
  onSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brandName = 'LXUY',
  cartCount = 0,
  onCartClick,
  onProfileClick,
  onSearchClick,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const categories = [
    { label: 'Sale', href: '#', isSale: true },
    { label: 'New Arrivals', href: '#', menuKey: 'new-arrivals' },
    { label: 'Men', href: '#', menuKey: 'men' },
    { label: 'Women', href: '#', menuKey: 'women' },
  ];

  return (
    <>
      <header className="sticky top-0 left-0 w-full z-45 border-b border-luxury-silver/30 bg-[#FDFBF7] transition-all duration-300">
        
        {/* Row 1: Top Bar (Logo & Actions) */}
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          
          {/* Left: Hamburger menu (Mobile) & Support Link (Desktop) */}
          <div className="flex-1 flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-luxury-dark p-1 outline-none mr-4"
              aria-label="Open Mobile Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden md:flex space-x-6 text-[10px] uppercase tracking-luxury font-medium text-neutral-500">
              <a href="#" className="hover:text-luxury-gold transition-colors">Stores</a>
              <span className="text-neutral-300">|</span>
              <a href="#" className="hover:text-luxury-gold transition-colors">Support</a>
            </div>
          </div>

          {/* Center: Spaced Logo */}
          <div className="text-center">
            <a
              href="/"
              className="font-serif text-2xl md:text-3.5xl font-semibold tracking-[0.3em] text-luxury-dark hover:opacity-85 transition-opacity"
            >
              {brandName}
            </a>
          </div>

          {/* Right: Actions */}
          <div className="flex-1 flex items-center justify-end space-x-5">
            {/* Search */}
            <button
              onClick={onSearchClick}
              className="text-luxury-dark hover:text-luxury-gold p-1 outline-none transition-colors duration-300"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Profile */}
            <button
              onClick={onProfileClick}
              className="text-luxury-dark hover:text-luxury-gold p-1 outline-none transition-colors duration-300"
              aria-label="Account"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

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
                  className={`text-xs uppercase tracking-widest font-medium py-2.5 transition-colors duration-300 relative ${
                    cat.isSale
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
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Maison Kitsuné</a>
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
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Jackets & Coats</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Casual Shirts</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Knitwear</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Trousers</a>
                              </div>
                              {/* Col 2: Brands */}
                              <div className="col-span-3 flex flex-col space-y-2">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/25 pb-2">Featured Brands</h4>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Polo Ralph Lauren</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Fred Perry</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Hackett London</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Maison Kitsuné</a>
                              </div>
                              {/* Col 3: Promo */}
                              <div className="col-span-6 grid grid-cols-2 gap-4">
                                <div className="relative aspect-[16/10] overflow-hidden bg-luxury-silver/10 col-span-2">
                                  <img src="/images/models/modules8.jpeg" alt="Men Promo" className="w-full h-full object-cover transition-transform duration-700 hover:scale-103" />
                                  <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4">
                                    <span className="text-xs text-white uppercase tracking-luxury font-bold">Men's Tailoring</span>
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
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Dresses & Jumpsuits</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Blouses & Tops</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Coats & Trenchcoats</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Trousers & Skirts</a>
                              </div>
                              {/* Col 2: Brands */}
                              <div className="col-span-3 flex flex-col space-y-2">
                                <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold border-b border-luxury-silver/25 pb-2">Featured Brands</h4>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Vivienne Westwood</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Marc Jacobs</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">Coccinelle</a>
                                <a href="#" className="text-xs text-neutral-700 hover:text-luxury-gold transition-colors">LXUY Signature</a>
                              </div>
                              {/* Col 3: Promo */}
                              <div className="col-span-6 grid grid-cols-2 gap-4">
                                <div className="relative aspect-[16/10] overflow-hidden bg-luxury-silver/10 col-span-2">
                                  <img src="/images/models/modules11.jpeg" alt="Women Promo" className="w-full h-full object-cover transition-transform duration-700 hover:scale-103" />
                                  <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4">
                                    <span className="text-xs text-white uppercase tracking-luxury font-bold">Women's Silhouette Edit</span>
                                    <span className="text-[9px] text-white/80 uppercase font-medium underline tracking-wide">View Collection</span>
                                  </div>
                                </div>
                              </div>
                            </>
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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-xs bg-[#FDFBF7] shadow-2xl overflow-y-auto flex flex-col p-6"
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
              <nav className="flex flex-col space-y-5 text-left">
                {categories.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-base uppercase tracking-widest font-semibold py-1.5 ${
                      link.isSale ? 'text-red-600' : 'text-luxury-dark'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
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
    </>
  );
};
