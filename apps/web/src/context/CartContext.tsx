"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

export interface CartItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    images: string[];
    brand: string | { _id: string; name: string };
  };
  sku: string;
  quantity: number;
  price: number;
  compareAtPrice?: number;
  attributes: Array<{ name: string; value: string }>;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItemToCart: (
    product: {
      _id: string;
      name: string;
      slug: string;
      images: string[];
      brand: string | { _id: string; name: string };
      variants?: any[];
      price?: number;
    },
    sku: string,
    quantity?: number
  ) => Promise<void>;
  updateCartItemQuantity: (productId: string, sku: string, quantity: number) => Promise<void>;
  removeItemFromCart: (productId: string, sku: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Track if we merged the cart on login for the current session
  const didMergeRef = useRef<string | null>(null);

  // Debouncing refs for cart updates to prevent race conditions
  const debounceTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingSyncsRef = useRef<Record<string, number>>({});

  // Cleanup active timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeoutsRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Helper to map NestJS populated backend item to CartItem
  const mapBackendItem = (backendItem: any): CartItem => {
    const p = backendItem.product;
    const sku = backendItem.sku;
    const qty = backendItem.quantity;

    const variant = p.variants?.find((v: any) => v.sku === sku) || p.variants?.[0];
    const price = variant ? variant.price : 0;
    const compareAtPrice = variant ? variant.compareAtPrice : undefined;
    const attributes = variant ? variant.attributes : [];

    return {
      product: {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        images: p.images || [],
        brand: p.brand,
      },
      sku,
      quantity: qty,
      price,
      compareAtPrice,
      attributes,
    };
  };

  // Load cart initially
  useEffect(() => {
    async function loadCart() {
      setLoading(true);
      setError(null);
      if (user) {
        try {
          const res = await api.get('/api/v1/cart');
          const mapped = (res.items || []).map(mapBackendItem);
          setItems(mapped);
        } catch (err: any) {
          console.error('Failed to load authenticated cart:', err);
          setError(err.message || 'Failed to load cart');
        }
      } else {
        // Load from localStorage for guest
        const local = localStorage.getItem('lxuy_guest_cart');
        if (local) {
          try {
            setItems(JSON.parse(local));
          } catch {
            localStorage.removeItem('lxuy_guest_cart');
          }
        }
      }
      setLoading(false);
    }
    loadCart();
  }, [user]);

  // Merge Guest Cart to Member Cart on Login
  useEffect(() => {
    if (user && didMergeRef.current !== user.id) {
      const local = localStorage.getItem('lxuy_guest_cart');
      if (local) {
        try {
          const guestItems = JSON.parse(local) as CartItem[];
          if (guestItems.length > 0) {
            const payload = {
              items: guestItems.map((item) => ({
                productId: item.product._id,
                sku: item.sku,
                quantity: item.quantity,
              })),
            };

            api.post('/api/v1/cart/merge', payload)
              .then((res) => {
                const mapped = (res.items || []).map(mapBackendItem);
                setItems(mapped);
                localStorage.removeItem('lxuy_guest_cart');
              })
              .catch((err) => {
                console.error('Failed to merge guest cart on login:', err);
              });
          }
        } catch (e) {
          console.error('Error parsing guest cart for merge:', e);
        }
      }
      didMergeRef.current = user.id;
    } else if (!user) {
      didMergeRef.current = null;
    }
  }, [user]);

  // Helper to persist local cart
  const saveLocalCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('lxuy_guest_cart', JSON.stringify(newItems));
  };

  const addItemToCart = async (
    product: {
      _id: string;
      name: string;
      slug: string;
      images: string[];
      brand: string | { _id: string; name: string };
      variants?: any[];
      price?: number;
    },
    sku: string,
    quantity = 1
  ) => {
    setError(null);
    setIsCartOpen(true); // Open drawer automatically for seamless premium interaction
    
    if (user) {
      // Optimistic UI Update: Save previous items for potential rollback
      const previousItems = JSON.parse(JSON.stringify(items));
      
      // Resolve variant info for local display
      const variant = product.variants?.find((v: any) => v.sku === sku);
      const price = variant ? variant.price : (product as any).price || 0;
      const compareAtPrice = variant ? variant.compareAtPrice : undefined;
      const attributes = variant ? variant.attributes : [];

      const optimisticItems = [...items];
      const existingIdx = optimisticItems.findIndex(
        (item) => item.product._id === product._id && item.sku === sku
      );

      if (existingIdx > -1) {
        optimisticItems[existingIdx] = {
          ...optimisticItems[existingIdx],
          quantity: optimisticItems[existingIdx].quantity + quantity
        };
      } else {
        optimisticItems.push({
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            images: product.images,
            brand: product.brand,
          },
          sku,
          quantity,
          price,
          compareAtPrice,
          attributes,
        });
      }
      setItems(optimisticItems);

      try {
        const res = await api.post('/api/v1/cart/items', {
          productId: product._id,
          sku,
          quantity,
        });
        const mapped = (res.items || []).map(mapBackendItem);
        setItems(mapped);
      } catch (err: any) {
        console.error('Failed to add item to cart on backend:', err);
        setError(err.message || 'Failed to add item');
        setItems(previousItems); // Rollback on failure
      }
    } else {
      // Find variant details
      const variant = product.variants?.find((v: any) => v.sku === sku);
      const price = variant ? variant.price : (product as any).price || 0;
      const compareAtPrice = variant ? variant.compareAtPrice : undefined;
      const attributes = variant ? variant.attributes : [];

      const newItems = [...items];
      const existingIdx = newItems.findIndex(
        (item) => item.product._id === product._id && item.sku === sku
      );

      if (existingIdx > -1) {
        newItems[existingIdx].quantity += quantity;
      } else {
        newItems.push({
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            images: product.images,
            brand: product.brand,
          },
          sku,
          quantity,
          price,
          compareAtPrice,
          attributes,
        });
      }
      saveLocalCart(newItems);
    }
  };

  const updateCartItemQuantity = async (productId: string, sku: string, quantity: number) => {
    setError(null);
    
    // First, update React local state instantly
    let newItems = [...items];
    const idx = newItems.findIndex((item) => item.product._id === productId && item.sku === sku);
    if (idx > -1) {
      if (quantity <= 0) {
        newItems.splice(idx, 1);
      } else {
        newItems[idx] = { ...newItems[idx], quantity };
      }
      setItems(newItems);
    }

    if (user) {
      const key = `${productId}-${sku}`;

      // Clear any pending timeout for this item
      if (debounceTimeoutsRef.current[key]) {
        clearTimeout(debounceTimeoutsRef.current[key]);
      }

      // Store the latest quantity we want to sync
      pendingSyncsRef.current[key] = quantity;

      // Set a new timeout to send the request after user finishes clicking
      debounceTimeoutsRef.current[key] = setTimeout(async () => {
        const finalQuantity = pendingSyncsRef.current[key];
        delete pendingSyncsRef.current[key];
        delete debounceTimeoutsRef.current[key];

        try {
          const res = await api.patch(`/api/v1/cart/items/${productId}?sku=${sku}`, {
            sku,
            quantity: finalQuantity,
          });
          const mapped = (res.items || []).map(mapBackendItem);
          
          // Only apply backend response state if no new clicks occurred during flight
          if (!pendingSyncsRef.current[key]) {
            setItems(mapped);
          }
        } catch (err: any) {
          console.error('Failed to update cart item quantity on backend:', err);
          setError(err.message || 'Failed to update quantity');
          
          // Rollback to database cart items
          try {
            const res = await api.get('/api/v1/cart');
            const mapped = (res.items || []).map(mapBackendItem);
            setItems(mapped);
          } catch {}
        }
      }, 350); // 350ms debounce window
    } else {
      let newItems = [...items];
      const idx = newItems.findIndex((item) => item.product._id === productId && item.sku === sku);
      if (idx > -1) {
        if (quantity <= 0) {
          newItems.splice(idx, 1);
        } else {
          newItems[idx].quantity = quantity;
        }
        saveLocalCart(newItems);
      }
    }
  };

  const removeItemFromCart = async (productId: string, sku: string) => {
    setError(null);
    
    // Optimistic UI state update
    const optimisticItems = items.filter((item) => !(item.product._id === productId && item.sku === sku));
    setItems(optimisticItems);

    if (user) {
      const key = `${productId}-${sku}`;
      
      // Clear any pending sync timeouts for this item
      if (debounceTimeoutsRef.current[key]) {
        clearTimeout(debounceTimeoutsRef.current[key]);
        delete debounceTimeoutsRef.current[key];
      }
      delete pendingSyncsRef.current[key];

      try {
        const res = await api.delete(`/api/v1/cart/items/${productId}?sku=${sku}`);
        const mapped = (res.items || []).map(mapBackendItem);
        setItems(mapped);
      } catch (err: any) {
        console.error('Failed to remove item from backend cart:', err);
        setError(err.message || 'Failed to remove item');
        
        // Revert to backend cart state
        try {
          const res = await api.get('/api/v1/cart');
          const mapped = (res.items || []).map(mapBackendItem);
          setItems(mapped);
        } catch {}
      }
    } else {
      const newItems = items.filter((item) => !(item.product._id === productId && item.sku === sku));
      saveLocalCart(newItems);
    }
  };

  const clearCart = async () => {
    setError(null);
    if (user) {
      try {
        const res = await api.delete('/api/v1/cart');
        const mapped = (res.items || []).map(mapBackendItem);
        setItems(mapped);
      } catch (err: any) {
        console.error('Failed to clear backend cart:', err);
        setError(err.message || 'Failed to clear cart');
      }
    } else {
      saveLocalCart([]);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        error,
        isCartOpen,
        setIsCartOpen,
        addItemToCart,
        updateCartItemQuantity,
        removeItemFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
