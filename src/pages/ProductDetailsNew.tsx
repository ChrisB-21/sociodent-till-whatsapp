import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Heart, CheckCircle, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useInterest } from '@/context/InterestContext';

// Mock data - in real app, this would come from API
const mockProducts = [  {
    id: 'prostuff-travel-toothbrush',
    name: 'Prostuff 3-in-1 Portable Travel Toothbrush with Built-in Refillable Toothpaste Tube',
    image: 'https://m.media-amazon.com/images/I/71EY2n3D40L._SX569_.jpg',
    price: 3,
    oldPrice: null,
    category: 'toothbrush',
    inStock: true,
    brand: 'Prostuff.in',
    description: '3-in-1 portable travel toothbrush with built-in refillable toothpaste tube, built-in toothbrush case, extra soft bristles and 1 cleaning brush. Perfect for travel, camping, and on-the-go oral care.',
    detailedDescription: 'The Prostuff 3-in-1 Portable Travel Toothbrush is the ultimate solution for maintaining oral hygiene while traveling. This innovative design combines a toothbrush, toothpaste storage, and protective case in one compact unit. The extra soft bristles are gentle on sensitive teeth and gums, while the built-in refillable toothpaste tube eliminates the need to carry separate products.',
    features: [
      'Compact and portable design',
      '3-in-1 functionality (toothbrush, toothpaste tube, case)',
      'Built-in refillable toothpaste tube',
      'Extra soft bristles for sensitive teeth',
      'Includes cleaning brush',
      'Leak-proof design',
      'BPA-free materials',
      'Easy to clean and maintain'
    ],
    specifications: {
      'Dimensions': '23 x 2.5 x 23 cm',
      'Weight': '70g',
      'Material': 'BPA-free Plastic',
      'Bristle Type': 'Extra Soft Nylon',
      'Capacity': 'Refillable toothpaste tube',
      'Color': 'Multicolor',
      'Warranty': '6 months'
    },
    images: [
      'https://m.media-amazon.com/images/I/71EY2n3D40L._SX569_.jpg',
      'https://m.media-amazon.com/images/I/71RAtTuvfNL._AC_FMavif_UC308,308_CACC,308,308_QL58_.jpg',
      'https://m.media-amazon.com/images/I/61-vchXVT7L._AC_FMavif_UC308,308_CACC,308,308_QL58_.jpg',
      'https://m.media-amazon.com/images/I/71SLrDfQ2AL._AC_FMavif_UC308,308_CACC,308,308_QL58_.jpg'
    ]
  }
];

const ProductDetailsNew = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { addInterest, removeInterest, hasInterest } = useInterest();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Find the product by ID
  const product = mockProducts.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Button onClick={() => navigate('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }
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

    if (hasInterest(product.id)) {
      await removeInterest(product.id);
    } else {
      await addInterest({ 
        id: product.id, 
        name: product.name, 
        image: product.image, 
        price: product.price 
      });
    }
  };  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add products to cart",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    addToCart({ 
      id: product.id, 
      name: product.name, 
      image: product.image, 
      price: product.price,
      brand: product.brand 
    }, quantity);
  };

  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase products",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    navigate('/checkout', { state: { product, quantity } });
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Back Button */}
      <div className="container-custom py-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Marketplace
        </Button>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain p-8"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-sociodent-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-contain p-2"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="text-sm text-gray-500 mb-2">{product.brand}</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-sociodent-600">₹{product.price}</span>
                {product.oldPrice && (
                  <span className="text-xl text-gray-500 line-through">₹{product.oldPrice}</span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">In Stock</span>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className={`py-3 ${
                    isInCart(product.id)
                      ? "border-green-600 text-green-600 hover:bg-green-50"
                      : "border-sociodent-600 text-sociodent-600 hover:bg-sociodent-50"
                  }`}
                  size="lg"
                >
                  <ShoppingCart className="mr-2" size={20} />
                  {isInCart(product.id) ? 'Add More' : 'Add to Cart'}
                </Button>
                
                <Button
                  onClick={handleBuyNow}
                  className="w-full bg-sociodent-600 hover:bg-sociodent-700 text-white py-3"
                  size="lg"
                >
                  Buy Now - ₹{product.price * quantity}
                </Button>
              </div>
              
              <Button
                onClick={handleShowInterest}
                variant="outline"
                className={`w-full py-3 ${
                  hasInterest(product.id)
                    ? "border-coral-500 bg-coral-500 text-white hover:bg-coral-600"
                    : "border-coral-500 text-coral-500 hover:bg-coral-50"
                }`}
                size="lg"
              >
                <Heart className="mr-2" size={20} fill={hasInterest(product.id) ? "currentColor" : "none"} />
                {hasInterest(product.id) ? 'Interest Recorded' : 'Show Interest'}
              </Button>
            </div>

            {/* Delivery Info */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="text-green-600" size={20} />
                <span>Free delivery on orders above ₹500</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="text-blue-600" size={20} />
                <span>100% Original Products</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b">
            <nav className="flex space-x-8">
              <button className="border-b-2 border-sociodent-500 py-4 px-1 text-sm font-medium text-sociodent-600">
                Description
              </button>
              <button className="py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                Features
              </button>
              <button className="py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                Specifications
              </button>
            </nav>
          </div>

          <div className="py-8">
            {/* Description Tab */}
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-4">Product Description</h3>
              <p className="text-gray-700 leading-relaxed mb-6">{product.detailedDescription}</p>
              
              <h4 className="text-lg font-semibold mb-3">Key Features</h4>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <h4 className="text-lg font-semibold mb-3 mt-8">Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">{key}:</span>
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsNew;
