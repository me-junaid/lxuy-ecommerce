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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainLinks = [
    { label: 'Handbags', href: '#' },
    { label: 'Women', href: '#' },
    { label: 'Men', href: '#' },
    { label: 'New In', href: '#' },
    { label: 'Limited Edition', href: '#' },
    { label: 'Accessories', href: '#' },
    { label: 'Editorial & Lookbooks', href: '#' },
  ];

  const secondaryLinks = [
    { label: 'Store Locator', href: '#' },
    { label: 'Brand Philosophy', href: '#' },
    { label: 'Customer Services', href: '#' },
  ];

  return (
    <>
      <header className="sticky top-0 left-0 w-full z-40 border-b border-luxury-silver/30 backdrop-blur-md bg-white transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex-1 hidden md:flex">
            <a
              href="#"
              className="text-[11px] uppercase tracking-luxury font-medium text-neutral-600 hover:text-luxury-gold transition-colors duration-300"
            >
              Contact Us
            </a>
          </div>

          {/* Center: Brand Logo */}
          <div className="flex-1 md:flex-none text-left md:text-center">
            <a
              href="/"
              className="font-serif text-2xl md:text-3xl font-semibold tracking-[0.25em] text-luxury-dark hover:opacity-80 transition-opacity"
            >
              {brandName}
            </a>
          </div>

          {/* Right: Actions & Menu Button */}
          <div className="flex-1 flex items-center justify-end space-x-6">
            {/* Search */}
            <button
              onClick={onSearchClick}
              className="text-luxury-dark hover:text-luxury-gold p-1 outline-none transition-colors duration-300"
              aria-label="Search"
            >
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Profile */}
            <button
              onClick={onProfileClick}
              className="text-luxury-dark hover:text-luxury-gold p-1 outline-none transition-colors duration-300"
              aria-label="Account"
            >
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative text-luxury-dark hover:text-luxury-gold p-1 outline-none transition-colors duration-300"
              aria-label="Shopping Cart"
            >
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-luxury-gold text-[#FDFBF7] text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold tracking-tight">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Menu Trigger */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center space-x-2 text-luxury-dark hover:text-luxury-gold outline-none transition-colors"
              aria-label="Open Menu"
            >
              <span className="text-[10px] uppercase tracking-widest font-semibold hidden md:inline">Menu</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Gucci-Style Drawer Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />

            {/* Sidebar drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#FDFBF7] shadow-2xl overflow-y-auto flex flex-col p-8 md:p-12"
            >
              {/* Top Row: Close button */}
              <div className="flex justify-end mb-10">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 rounded-full bg-luxury-dark text-luxury-cream flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 outline-none"
                  aria-label="Close Menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Category list */}
              <nav className="flex flex-col space-y-6 text-left">
                {mainLinks.map((link, idx) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.4 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="font-sans text-2xl font-light tracking-wide text-luxury-dark hover:text-luxury-gold transition-colors duration-300"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              {/* Separator */}
              <div className="w-full h-[1px] bg-luxury-silver/30 my-8" />

              {/* Secondary brand links */}
              <div className="flex flex-col space-y-4 text-left mb-10">
                {secondaryLinks.map((link, idx) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx + 0.3, duration: 0.4 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="font-sans text-[13px] tracking-wide text-neutral-500 hover:text-luxury-gold transition-colors duration-300"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>

              {/* Account/SignIn link at bottom */}
              <div className="mt-auto pt-6 text-left">
                <a
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-sans text-xs uppercase tracking-luxury font-medium border-b border-luxury-dark pb-1 text-luxury-dark hover:text-luxury-gold hover:border-luxury-gold transition-all"
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
