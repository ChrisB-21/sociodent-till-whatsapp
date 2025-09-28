import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  brand?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotalPrice: () => 0,
  getTotalItems: () => 0,
  isInCart: () => false,
});

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('sociodent_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('sociodent_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, { ...product, quantity }];
      }
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
    
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart",
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    });
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId: string) => {
    return items.some(item => item.id === productId);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
