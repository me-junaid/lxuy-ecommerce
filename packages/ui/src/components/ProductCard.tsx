import React from 'react';
import { motion } from 'framer-motion';

export interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  badge?: string;
  rating?: number;
  ratingCount?: number;
  stock?: number;
  isWishlisted?: boolean;
  onWishlistToggle?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  onAddToCart?: (e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  brand,
  price,
  compareAtPrice,
  imageUrl,
  badge,
  rating,
  ratingCount,
  stock,
  isWishlisted,
  onWishlistToggle,
  onClick,
  onAddToCart,
}) => {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col w-full text-left"
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F5F5] mb-3">
        {badge && (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[9px] font-bold tracking-luxury uppercase bg-luxury-dark text-luxury-cream">
            {badge}
          </span>
        )}

        {/* Wishlist Button */}
        {onWishlistToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle(e);
            }}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#FDFBF7]/85 hover:bg-[#FDFBF7] flex items-center justify-center shadow-md backdrop-blur-[2px] transition-all hover:scale-105 focus:outline-none border-none"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg
              className={`w-4 h-4 transition-colors duration-300 ${isWishlisted ? "fill-red-500 stroke-red-500" : "stroke-neutral-600 fill-none"}`}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        )}

        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
          loading="lazy"
        />

        {/* Hover action overlay */}
        {stock !== 0 && onAddToCart && (
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(e);
              }}
              className="w-full py-2.5 bg-[#FDFBF7] text-[#111111] hover:bg-[#111111] hover:text-[#FDFBF7] border border-transparent text-[10px] font-bold tracking-luxury uppercase shadow-lg transition-all duration-300"
            >
              Quick Add
            </motion.button>
          </div>
        )}
      </div>

      {/* Info details */}
      <div className="flex flex-col space-y-1">
        <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
          {brand}
        </span>
        <h3 className="font-serif text-sm text-neutral-800 tracking-wide truncate group-hover:text-luxury-gold transition-colors leading-tight">
          {name}
        </h3>
        
        {/* Rating Row */}
        {rating !== undefined && rating > 0 && (
          <div className="flex items-center space-x-1 text-xs text-neutral-500 select-none">
            <span className="text-luxury-gold text-sm leading-none">★</span>
            <span className="font-medium text-neutral-700 text-[11px]">{rating.toFixed(1)}</span>
            {ratingCount !== undefined && (
              <span className="text-neutral-400 text-[10px]">({ratingCount})</span>
            )}
          </div>
        )}

        {/* Pricing Row */}
        <div className="flex items-center space-x-2 mt-0.5">
          <p className="text-xs font-semibold text-neutral-700">
            {formattedPrice}
          </p>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-[10px] text-neutral-400 line-through">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(compareAtPrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {stock !== undefined && (
          <div className="text-[9px] font-bold tracking-wider uppercase pt-0.5">
            {stock === 0 ? (
              <span className="text-red-500 flex items-center">
                <span className="w-1 h-1 rounded-full bg-red-500 mr-1.5 inline-block" />
                Out of Stock
              </span>
            ) : stock <= 5 ? (
              <span className="text-orange-500 flex items-center">
                <span className="w-1 h-1 rounded-full bg-orange-500 mr-1.5 inline-block animate-pulse" />
                Only {stock} left
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
