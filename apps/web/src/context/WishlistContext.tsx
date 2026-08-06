"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

export interface WishlistItem {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  variants?: Array<{
    sku: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    attributes: Array<{ name: string; value: string }>;
    images: string[];
    isActive: boolean;
  }>;
  brand?: string | { _id: string; name: string };
  category?: string | { _id: string; name: string };
}

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
  toggleWishlistItem: (productId: string, productData?: WishlistItem) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if we merged the wishlist on login for the current session
  const didMergeRef = useRef<string | null>(null);

  // Load wishlist initially
  useEffect(() => {
    async function loadWishlist() {
      setLoading(true);
      setError(null);
      if (user) {
        try {
          const res = await api.get('/api/v1/wishlist');
          setItems(res.products || []);
        } catch (err: any) { // TODO(err): Use correct error type after defining Axios/Fetch error classes
          console.error('Failed to load authenticated wishlist:', err);
          setError(err.message || 'Failed to load wishlist');
        }
      } else {
        // Load from localStorage for guest
        const local = localStorage.getItem('lxuy_guest_wishlist');
        if (local) {
          try {
            setItems(JSON.parse(local));
          } catch {
            localStorage.removeItem('lxuy_guest_wishlist');
          }
        }
      }
      setLoading(false);
    }
    loadWishlist();
  }, [user]);

  // Merge Guest Wishlist to Member Wishlist on Login
  useEffect(() => {
    if (user && didMergeRef.current !== user.id) {
      const local = localStorage.getItem('lxuy_guest_wishlist');
      if (local) {
        try {
          const guestItems = JSON.parse(local) as WishlistItem[];
          if (guestItems.length > 0) {
            const payload = {
              productIds: guestItems.map((item) => item._id),
            };

            api.post('/api/v1/wishlist/merge', payload)
              .then((res) => {
                setItems(res.products || []);
                localStorage.removeItem('lxuy_guest_wishlist');
              })
              .catch((err) => {
                console.error('Failed to merge guest wishlist on login:', err);
              });
          }
        } catch (e) {
          console.error('Error parsing guest wishlist for merge:', e);
        }
      }
      didMergeRef.current = user.id;
    } else if (!user) {
      didMergeRef.current = null;
    }
  }, [user]);

  const toggleWishlistItem = async (productId: string, productData?: WishlistItem) => {
    setError(null);
    if (user) {
      try {
        const res = await api.post('/api/v1/wishlist/toggle', { productId });
        setItems(res.products || []);
      } catch (err: any) { // TODO(err): Use correct error type
        console.error('Failed to toggle wishlist item:', err);
        setError(err.message || 'Failed to update wishlist');
      }
    } else {
      // Handle guest local storage toggle
      const exists = items.some((item) => item._id === productId);
      let updatedItems: WishlistItem[];

      if (exists) {
        updatedItems = items.filter((item) => item._id !== productId);
      } else {
        if (!productData) {
          console.error('Cannot add item as guest: productData is missing');
          return;
        }
        updatedItems = [...items, productData];
      }

      setItems(updatedItems);
      localStorage.setItem('lxuy_guest_wishlist', JSON.stringify(updatedItems));
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setError(null);
    if (user) {
      try {
        const res = await api.delete(`/api/v1/wishlist/${productId}`);
        setItems(res.products || []);
      } catch (err: any) { // TODO(err): Use correct error type
        console.error('Failed to remove wishlist item:', err);
        setError(err.message || 'Failed to remove from wishlist');
      }
    } else {
      const updatedItems = items.filter((item) => item._id !== productId);
      setItems(updatedItems);
      localStorage.setItem('lxuy_guest_wishlist', JSON.stringify(updatedItems));
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return items.some((item) => item._id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        loading,
        error,
        toggleWishlistItem,
        isInWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
