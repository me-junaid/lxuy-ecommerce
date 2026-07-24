import React from 'react';
import { motion } from 'framer-motion';

export interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  badge?: string;
  onClick?: () => void;
  onAddToCart?: (e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  brand,
  price,
  imageUrl,
  badge,
  onClick,
  onAddToCart,
}) => {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
  }).format(price);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col w-full text-left"
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F5F5] mb-4">
        {badge && (
          <span className="absolute top-3 left-3 z-10 px-3 py-1 text-[10px] font-medium tracking-luxury uppercase bg-luxury-dark text-luxury-cream border border-transparent">
            {badge}
          </span>
        )}

        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover action overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(e);
            }}
            className="w-full py-3 bg-[#FDFBF7] text-[#111111] hover:bg-[#111111] hover:text-[#FDFBF7] border border-transparent text-xs font-semibold tracking-luxury uppercase shadow-lg transition-all duration-300"
          >
            Quick Add
          </motion.button>
        </div>
      </div>

      {/* Info details */}
      <div className="flex flex-col space-y-1">
        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
          {brand}
        </span>
        <h3 className="font-serif text-base text-luxury-dark leading-tight">
          {name}
        </h3>
        <p className="text-sm font-medium text-luxury-gold mt-1">
          {formattedPrice}
        </p>
      </div>
    </div>
  );
};
