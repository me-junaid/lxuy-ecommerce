import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface SearchFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  category: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 's1',
    name: "Women's thong sandal with Interlocking G",
    brand: "GUCCI",
    price: 890,
    imageUrl: "/images/models/modules12.jpeg",
    category: "Shoes",
  },
  {
    id: 's2',
    name: "GG Marmont wallet on chain",
    brand: "GUCCI",
    price: 1150,
    imageUrl: "/images/models/modules5.jpeg",
    category: "Wallets",
  },
  {
    id: 's3',
    name: "Classic Wool Trench Coat",
    brand: "LXUY SIGNATURE",
    price: 890,
    imageUrl: "/images/models/modules2.jpeg",
    category: "Coats",
  },
  {
    id: 's4',
    name: "Draped Silk Blouse",
    brand: "LXUY SIGNATURE",
    price: 450,
    imageUrl: "/images/models/modules1.jpeg",
    category: "Blouses",
  },
  {
    id: 's5',
    name: "Linen Wide-Leg Trouser",
    brand: "LXUY SIGNATURE",
    price: 380,
    imageUrl: "/images/models/modules6.jpeg",
    category: "Trousers",
  }
];


export const SearchFlyout: React.FC<SearchFlyoutProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(MOCK_PRODUCTS);
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

  // Perform search filtering
  useEffect(() => {
    if (!query.trim()) {
      setFilteredProducts(MOCK_PRODUCTS);
      return;
    }
    const lowerQuery = query.toLowerCase().trim();
    const matches = MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
    setFilteredProducts(matches);
  }, [query]);

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
        {/* Left side empty space to keep logo perfectly centered */}
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
      <div className="max-w-7xl w-full mx-auto px-6 pt-12 md:pt-1 pb- space-y-10 flex-1 flex flex-col overflow-hidden">
        
        {/* Search Input Block (Sits below header, flex-shrink-0) */}
        <div className="max-w-3xl w-full text-left flex-shrink-0">
          <div className="flex items-end border-b border-neutral-300 focus-within:border-luxury-dark transition-colors duration-300 pb-2">
            <span className="text-sm md:text-md font-serif text-neutral-500 mr-3 select-none">
              Search for:
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Lxuy"
              className="flex-1 bg-transparent border-none outline-none text-base md:text-lg font-serif text-neutral-800 tracking-wide placeholder-neutral-300"
            />
          </div>
        </div>

        {/* 3. Products Grid Area (Scrolls vertically) */}
        <div className="space-y-6 text-left flex-1 overflow-y-auto pr-1 no-scrollbar">
          <h3 className="text-[10px] uppercase tracking-luxury font-bold text-neutral-400 border-b border-luxury-silver/25 pb-2 sticky top-0 bg-[#FDFBF7] z-10">
            {query.trim() ? `Search Results (${filteredProducts.length})` : 'Most Coveted'}
          </h3>

          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-sm font-light text-neutral-400">
              No matches found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pb-6">
              {filteredProducts.map((p, index) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group space-y-4 cursor-pointer mb-5"
                >
                  {/* Image Aspect ratio matches Gucci's layout */}
                  <div className="aspect-[3/4] overflow-hidden bg-luxury-silver/5 relative">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-all duration-700 ease-out"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-serif text-neutral-800 tracking-wide group-hover:text-luxury-gold transition-colors text-sm font-normal">
                      {p.name}
                    </h4>
                    <p className="font-light text-neutral-500">
                      ${p.price.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};