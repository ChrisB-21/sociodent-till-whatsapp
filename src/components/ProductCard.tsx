import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  className?: string;
  inStock?: boolean;
}

const ProductCard = ({
  id,
  name,
  image,
  price,
  oldPrice,
  rating,
  reviewCount,
  category,
  className,
  inStock = true
}: ProductCardProps) => {
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
        
        <div className="flex items-center mt-2 mb-3">
          <div className="flex items-center text-sm">
            <Star className="text-yellow-400 w-4 h-4 mr-1" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-gray-500 text-xs ml-1">({reviewCount})</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-gray-900">₹{price}</span>
            {oldPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">₹{oldPrice}</span>
            )}
          </div>
          <button 
            className="w-9 h-9 flex items-center justify-center bg-sociodent-500 text-white rounded-full hover:bg-sociodent-600 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inStock}
            aria-label="Add to cart"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
