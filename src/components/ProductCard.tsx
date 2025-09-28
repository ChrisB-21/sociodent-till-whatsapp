import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useInterest } from '@/context/InterestContext';
import { useToast } from '@/hooks/use-toast';
import { checkUserPendingOrders } from '@/services/productOrderService';

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  category: string;
  className?: string;
  inStock?: boolean;
  brand?: string;
}

const ProductCard = ({
  id,
  name,
  image,
  price,
  oldPrice,
  category,
  className,
  inStock = true,
  brand
}: ProductCardProps) => {
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { addInterest, removeInterest, hasInterest } = useInterest();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hasPendingOrder, setHasPendingOrder] = useState(false);

  // Check for pending orders when user changes
  useEffect(() => {
    const checkPendingOrders = async () => {
      if (user?.email) {
        try {
          const pending = await checkUserPendingOrders(user.email);
          setHasPendingOrder(pending);
        } catch (error) {
          console.error('Error checking pending orders:', error);
        }
      } else {
        setHasPendingOrder(false);
      }
    };

    checkPendingOrders();
  }, [user?.email]);

  const handleShowInterest = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to show interest in products",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (hasInterest(id)) {
      await removeInterest(id);
    } else {
      await addInterest({ id, name, image, price });
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add products to cart",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (hasPendingOrder) {
      toast({
        title: "Order Already in Progress",
        description: "You have an order that is still being processed. Please wait for it to be delivered before placing a new order.",
        variant: "destructive"
      });
      return;
    }

    addToCart({ id, name, image, price, brand });
  };

  return (
    <div className={cn(
      "glass-card rounded-2xl overflow-hidden card-hover",
      className,
      !inStock && "opacity-70"
    )}>
      <Link to={`/products/${id}`} className="block relative aspect-square">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-contain p-4"
          loading="lazy" 
        />
        <div className="absolute top-3 left-3 bg-sociodent-100 text-sociodent-700 px-2 py-1 rounded-full text-xs font-medium">
          {category}
        </div>
        
        {!inStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="px-3 py-1 bg-gray-800 text-white text-sm font-medium rounded">
              Out of Stock
            </div>
          </div>
        )}
      </Link>
      
      <div className="p-4">
        <Link to={`/products/${id}`} className="hover:text-sociodent-600 transition-colors">
          <h3 className="font-medium text-gray-900 leading-snug">{name}</h3>
        </Link>
        
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-xl font-bold text-gray-900">₹{price}</span>
            {oldPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">₹{oldPrice}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleShowInterest}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                hasInterest(id) 
                  ? "bg-coral-500 text-white" 
                  : "bg-coral-100 text-coral-500 hover:bg-coral-200"
              )}
              disabled={!inStock}
              aria-label={hasInterest(id) ? "Remove interest" : "Show interest"}
            >
              <Heart size={16} fill={hasInterest(id) ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={handleAddToCart}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                isInCart(id)
                  ? "bg-green-500 text-white"
                  : hasPendingOrder
                  ? "bg-gray-400 text-white"
                  : "bg-sociodent-500 text-white hover:bg-sociodent-600"
              )}
              disabled={!inStock || hasPendingOrder}
              aria-label={
                hasPendingOrder 
                  ? "Order in progress" 
                  : isInCart(id) 
                  ? "In cart" 
                  : "Add to cart"
              }
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
