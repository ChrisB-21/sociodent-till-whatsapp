import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useInterest } from '@/context/InterestContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, clearCart } = useCart();
  const { addInterest, hasInterest } = useInterest();
  const { toast } = useToast();

  const handleMoveToWishlist = async (item: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to wishlist",
        variant: "destructive"
      });
      return;
    }

    try {
      await addInterest({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price
      });
      removeFromCart(item.id);
      toast({
        title: "Moved to Wishlist",
        description: `${item.name} has been moved to your wishlist`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move item to wishlist",
        variant: "destructive"
      });
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to proceed with checkout",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Add some items to your cart before checkout",
        variant: "destructive"
      });
      return;
    }

    navigate('/checkout', { state: { items, totalAmount: getTotalPrice() } });
  };

  if (items.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          </div>

          <div className="text-center py-16">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some products to get started!</p>
            <Button 
              onClick={() => navigate('/marketplace')}
              className="bg-sociodent-600 hover:bg-sociodent-700"
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
            Shopping Cart ({getTotalItems()} items)
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-contain bg-gray-50 rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                    {item.brand && (
                      <p className="text-sm text-gray-500 mb-2">{item.brand}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </Button>
                        </div>
                        <div className="text-lg font-semibold text-sociodent-600">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasInterest(item.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveToWishlist(item)}
                            className="text-coral-500 hover:text-coral-600 hover:bg-coral-50"
                          >
                            <Heart size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({getTotalItems()} items):</span>
                  <span>₹{getTotalPrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>₹{getTotalPrice().toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full bg-sociodent-600 hover:bg-sociodent-700 py-3"
                size="lg"
              >
                Proceed to Checkout
              </Button>

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">Free Delivery!</p>
                  <p>Your order qualifies for free delivery. Expected delivery in 3-5 business days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
