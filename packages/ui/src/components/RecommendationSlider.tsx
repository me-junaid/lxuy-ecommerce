import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface RecommendedProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  imageUrl: string;
  isWishlisted?: boolean;
}

export interface RecommendationSliderProps {
  title?: string;
  products: RecommendedProduct[];
  onProductClick?: (id: string) => void;
  onWishlistToggle?: (id: string, e: React.MouseEvent) => void;
}

export const RecommendationSlider: React.FC<RecommendationSliderProps> = ({
  title = 'STYLES RECOMMENDED FOR YOU',
  products,
  onProductClick,
  onWishlistToggle,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [wishlistStates, setWishlistStates] = useState<Record<string, boolean>>(
    products.reduce((acc, p) => ({ ...acc, [p.id]: !!p.isWishlisted }), {})
  );

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const handleWishlistClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlistStates((prev) => ({ ...prev, [id]: !prev[id] }));
    onWishlistToggle?.(id, e);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 py-10 md:py-20 bg-[#FDFBF7]">
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="text-base tracking-[0.2em] text-neutral-800 font-light uppercase">
          <span className="font-bold mr-1">Styles</span> {title.substring(title.indexOf(' ') + 1)}
        </h2>
      </div>

      {/* Slider Wrapper */}
      <div className="relative group/slider">
        
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/95 border border-luxury-silver/30 shadow-md flex items-center justify-center -translate-x-3 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:scale-105 active:scale-95 outline-none"
          aria-label="Scroll Left"
        >
          <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="w-[calc(100%+3rem)] -mx-6 px-6 md:w-full md:mx-0 md:px-1 flex space-x-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4 scroll-pl-6 md:scroll-pl-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => {
            const isWishlisted = wishlistStates[product.id];

            return (
              <div
                key={product.id}
                onClick={() => onProductClick?.(product.id)}
                className="flex-none w-[270px] snap-start cursor-pointer group/card flex flex-col text-center"
              >
                {/* Image Area */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F5F5] mb-4">
                  
                  {/* Floating Wishlist Heart */}
                  <button
                    onClick={(e) => handleWishlistClick(product.id, e)}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-luxury-silver/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
                    aria-label="Add to Wishlist"
                  >
                    <svg
                      className={`w-4.5 h-4.5 transition-colors duration-300 ${
                        isWishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-500 hover:text-red-500'
                      }`}
                      fill={isWishlisted ? 'currentColor' : 'none'}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>

                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                    loading="lazy"
                  />

                  {/* Hover Tooltip Overlay (matching reference layout) */}
                  <div className="absolute inset-x-0 bottom-0 bg-[#111111]/85 backdrop-blur-[2px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 py-3.5 px-4 z-10">
                    <p className="text-[10px] text-white/95 uppercase tracking-wider font-light line-clamp-1">
                      {product.name}
                    </p>
                  </div>
                </div>

                {/* Price block */}
                <div className="flex flex-col items-center space-y-1 mb-1">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm font-semibold text-neutral-800">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-neutral-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                    {product.discount && (
                      <span className="text-[10px] font-bold text-red-500 tracking-wide uppercase">
                        {product.discount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Brand label */}
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-1">
                  {product.brand}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/95 border border-luxury-silver/30 shadow-md flex items-center justify-center translate-x-3 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:scale-105 active:scale-95 outline-none"
          aria-label="Scroll Right"
        >
          <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </section>
  );
};
