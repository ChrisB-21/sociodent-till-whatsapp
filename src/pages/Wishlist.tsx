import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInterest } from '@/context/InterestContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { interests, removeInterest } = useInterest();
  const { addToCart, isInCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (interest: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    addToCart({
      id: interest.productId,
      name: interest.productName,
      image: interest.productImage,
      price: interest.productPrice,
      brand: '' // You might want to store brand in interests too
    });
  };

  const handleMoveToCart = async (interest: any) => {
    try {
      handleAddToCart(interest);
      await removeInterest(interest.productId);
      toast({
        title: "Moved to Cart",
        description: `${interest.productName} has been moved to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move item to cart",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container-custom py-8">
          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-500 mb-6">Please login to view your wishlist</p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-coral-500 hover:bg-coral-600"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (interests.length === 0) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container-custom py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/marketplace')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Marketplace
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          </div>

          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save items you love to view them later!</p>
            <Button 
              onClick={() => navigate('/marketplace')}
              className="bg-coral-500 hover:bg-coral-600"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            My Wishlist ({interests.length} items)
          </h1>
        </div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {interests.map((interest) => (
            <div key={interest.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-50 p-4">
                <img
                  src={interest.productImage}
                  alt={interest.productName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {interest.productName}
                </h3>
                <div className="text-lg font-bold text-sociodent-600 mb-3">
                  ₹{interest.productPrice.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mb-4">
                  Added {new Date(interest.dateAdded).toLocaleDateString()}
                </div>
                <div className="space-y-2">
                  {isInCart(interest.productId) ? (
                    <Button
                      onClick={() => handleAddToCart(interest)}
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <ShoppingCart className="mr-2" size={16} />
                      Add More to Cart
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleMoveToCart(interest)}
                      className="w-full bg-sociodent-600 hover:bg-sociodent-700"
                    >
                      <ShoppingCart className="mr-2" size={16} />
                      Move to Cart
                    </Button>
                  )}
                  <Button
                    onClick={() => removeInterest(interest.productId)}
                    variant="outline"
                    className="w-full text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2" size={16} />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
