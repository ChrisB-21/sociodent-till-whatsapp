import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const productCategories = [
  { id: 'all', name: 'All Products' },
  { id: 'toothbrush', name: 'Toothbrushes' },
  { id: 'toothpaste', name: 'Toothpastes' },
  { id: 'floss', name: 'Dental Floss' },
  { id: 'mouthwash', name: 'Mouthwash' },
  { id: 'whitening', name: 'Whitening Products' },
  { id: 'accessories', name: 'Accessories' },
];

const mockProducts = [
  // ... your mock products here ...
];

const Products = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [cartItems, setCartItems] = useState<string[]>([]);

  // Filter products based on search term and category
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add to cart function
  const handleAddToCart = (productId: string) => {
    setCartItems(prev => [...prev, productId]);
    toast({
      title: "Added to cart",
      description: "Product has been added to your cart",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-20">
        <section className="py-12 bg-sociodent-50">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Curated Products Picked by <span className="text-coral-500">Socio</span><span className="text-sociodent-700">Dent</span> - <span className="text-coral-500">Coming Soon</span>
              </h1>
              <p className="text-lg text-gray-600">
                Find expert-recommended dental products to maintain your oral health between appointments.
              </p>
            </div>

            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between mb-8">
              <div className="hidden md:flex flex-wrap gap-2">
                {productCategories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="mb-2"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                className="md:hidden flex items-center"
                onClick={() => setShowMobileFilter(!showMobileFilter)}
              >
                <SlidersHorizontal size={16} className="mr-2" />
                Filter
              </Button>
            </div>

            {showMobileFilter && (
              <div className="md:hidden mb-6 bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {productCategories.map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowMobileFilter(false);
                      }}
                      className="mb-2"
                      size="sm"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-coral-500">Coming Soon...</h3>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Products;
