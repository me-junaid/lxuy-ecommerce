import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#111111] text-[#FDFBF7] py-16 px-6 border-t border-luxury-charcoal">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Column */}
        <div className="flex flex-col space-y-4">
          <span className="font-serif text-xl font-semibold tracking-[0.2em]">LXUY</span>
          <p className="text-xs text-neutral-400 leading-relaxed font-light">
            Crafting a premium e-commerce ecosystem inspired by natural luxury, minimal layout forms, and seamless interactions.
          </p>
        </div>

        {/* Collections Link Column */}
        <div className="flex flex-col space-y-3 text-left">
          <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Collections</h4>
          <Link href="/search" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">New Arrivals</Link>
          <Link href="/collections/women" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Women</Link>
          <Link href="/collections/men" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Men</Link>
          <Link href="/search" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Limited Edition</Link>
        </div>

        {/* Services Link Column */}
        <div className="flex flex-col space-y-3 text-left">
          <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Customer Care</h4>
          <a href="#" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Contact Support</a>
          <a href="#" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Shipping & Returns</a>
          <a href="#" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Sizing Guide</a>
          <a href="#" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Track Order</a>
        </div>

        {/* Brand / Social Column */}
        <div className="flex flex-col space-y-3 text-left">
          <h4 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">About LXUY</h4>
          <a href="#" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Our Story</a>
          <a href="#" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Sustainability</a>
          <a href="#" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Careers</a>
          <a href="#" className="text-xs text-neutral-300 hover:text-luxury-gold transition-colors duration-300">Press</a>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-luxury-charcoal/50 flex flex-col md:flex-row items-center justify-between text-[10px] uppercase tracking-luxury text-neutral-500">
        <p>&copy; {new Date().getFullYear()} LXUY. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-luxury-cream transition-colors duration-300">Privacy Policy</a>
          <a href="#" className="hover:text-luxury-cream transition-colors duration-300">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
