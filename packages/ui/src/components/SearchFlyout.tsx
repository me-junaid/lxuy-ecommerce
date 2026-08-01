"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface SearchFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchSubmit?: (query: string) => void;
  onProductClick?: (slug: string) => void;
}

interface Product {
  _id: string;
  name: string;
  brand: {
    _id: string;
    name: string;
    slug: string;
  } | string;
  price: number;
  slug: string;
  images: string[];
}

export const SearchFlyout: React.FC<SearchFlyoutProps> = ({
  isOpen,
  onClose,
  onSearchSubmit,
  onProductClick,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Debounced API search fetch
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/products?search=${encodeURIComponent(query.trim())}`);
        if (response.ok) {
          const resJson = await response.json();
          setResults(resJson.data || []);
        }
      } catch (error) {
        console.error('Search fetch error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      if (onSearchSubmit) {
        onSearchSubmit(query.trim());
      } else {
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      }
    }
  };

  const handleItemClick = (slug: string) => {
    onClose();
    if (onProductClick) {
      onProductClick(slug);
    } else {
      window.location.href = `/products/${slug}`;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-[#FDFBF7] text-[#111111] flex flex-col h-screen overflow-hidden"
    >
      {/* 1. Header Bar: Centered Logo & Right Close */}
      <div className="max-w-7xl w-full mx-auto px-6 h-16 md:h-20 flex flex-shrink-0 items-center justify-between relative border-b border-luxury-silver/20">
        <div className="w-10" />

        {/* Center: Brand Logo */}
        <span className="font-serif text-3xl font-semibold tracking-[0.3em] text-luxury-dark select-none absolute left-1/2 -translate-x-1/2">
          LXUY
        </span>

        {/* Right: Close Button */}
        <button
          onClick={onClose}
          className="text-xs uppercase tracking-luxury font-medium text-neutral-500 hover:text-luxury-gold transition-colors py-2 border-b border-transparent hover:border-luxury-gold"
        >
          Close
        </button>
      </div>

      {/* 2. Main Search & Results Content */}
      <div className="max-w-7xl w-full mx-auto px-6 pt-12 pb-6 space-y-10 flex-1 flex flex-col overflow-hidden">
        
        {/* Search Input Block (Sits below header, flex-shrink-0) */}
        <form onSubmit={handleSubmit} className="max-w-3xl w-full text-left flex-shrink-0">
          <div className="flex items-end border-b border-neutral-300 focus-within:border-luxury-dark transition-colors duration-300 pb-2">
            <span className="text-sm md:text-md font-serif text-neutral-500 mr-3 select-none">
              Search for:
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Start typing..."
              className="flex-1 bg-transparent border-none outline-none text-base md:text-lg font-serif text-neutral-800 tracking-wide placeholder-neutral-300"
            />
            {query.trim() && (
              <button
                type="submit"
                className="text-xs uppercase tracking-luxury text-luxury-gold font-bold hover:text-luxury-dark transition-colors ml-4"
              >
                Search
              </button>
            )}
          </div>
        </form>

        {/* 3. Products Grid Area (Scrolls vertically) */}
        <div className="space-y-6 text-left flex-1 overflow-y-auto pr-1 no-scrollbar">
          <h3 className="text-[10px] uppercase tracking-luxury font-bold text-neutral-400 border-b border-luxury-silver/25 pb-2 sticky top-0 bg-[#FDFBF7] z-10 flex justify-between items-center">
            <span>
              {query.trim() ? `Search Results (${results.length})` : 'Type to search luxury catalog'}
            </span>
            {loading && (
              <svg className="animate-spin h-3 w-3 text-luxury-gold" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </h3>

          {query.trim() && results.length === 0 && !loading ? (
            <div className="py-20 text-center text-sm font-light text-neutral-400">
              No matches found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-6">
              {results.map((p, index) => {
                const brandName = typeof p.brand === 'object' && p.brand !== null ? p.brand.name : 'LXUY SIGNATURE';
                const image = p.images && p.images.length > 0 ? p.images[0] : '/images/models/modules1.jpeg';

                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    onClick={() => handleItemClick(p.slug)}
                    className="group space-y-3 cursor-pointer"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-luxury-silver/5 relative">
                      <img
                        src={image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-700 ease-out"
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
                        {brandName}
                      </span>
                      <h4 className="font-serif text-neutral-800 tracking-wide group-hover:text-luxury-gold transition-colors text-sm font-normal truncate">
                        {p.name}
                      </h4>
                      <p className="font-light text-neutral-500">
                        ${p.price.toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};