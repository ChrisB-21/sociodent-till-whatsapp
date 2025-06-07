import React, { useState } from 'react';
import { Search, Edit2, Trash2, Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  active: boolean;
  createdAt: string;
  [key: string]: any;
}

interface ProductManagementProps {
  products: Product[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onToggleProductStatus: (id: string, active: boolean) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  searchTerm,
  onSearchChange,
  formatDate,
  formatCurrency,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleProductStatus
}) => {
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
    active: true
  });
  const [sortBy, setSortBy] = useState<string>("recent");
  const [filterCategory, setFilterCategory] = useState<string>("");

  // Get unique categories from products
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    // Apply category filter
    if (filterCategory && product.category !== filterCategory) {
      return false;
    }

    // Apply search term
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchTermLower) ||
      product.description.toLowerCase().includes(searchTermLower) ||
      product.category.toLowerCase().includes(searchTermLower) ||
      product.price.toString().includes(searchTermLower)
    );
  }).sort((a, b) => {
    switch(sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "price_low":
        return a.price - b.price;
      case "price_high":
        return b.price - a.price;
      case "stock_low":
        return a.stock - b.stock;
      case "stock_high":
        return b.stock - a.stock;
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock,
      active: product.active
    });
    setShowProductModal(true);
  };

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
      active: true
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name || productForm.price === undefined) {
      return; // Validate required fields
    }

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productForm);
    } else {
      onAddProduct(productForm as Omit<Product, 'id' | 'createdAt'>);
    }
    
    setShowProductModal(false);
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      'Dental Care': 'bg-blue-100 text-blue-800',
      'Instruments': 'bg-purple-100 text-purple-800',
      'Medication': 'bg-green-100 text-green-800',
      'Hygiene': 'bg-teal-100 text-teal-800',
      'Equipment': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Product Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage dental products and inventory
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="px-10 py-2 border rounded-md text-sm w-64"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            <select
              className="text-sm border rounded px-3 py-2 bg-white"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              className="text-sm border rounded px-3 py-2 bg-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Sort by: Recent</option>
              <option value="name">Sort by: Name</option>
              <option value="price_low">Sort by: Price (Low to High)</option>
              <option value="price_high">Sort by: Price (High to Low)</option>
              <option value="stock_low">Sort by: Stock (Low to High)</option>
              <option value="stock_high">Sort by: Stock (High to Low)</option>
            </select>

            <Button onClick={handleAddNewProduct}>
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-700">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Stock</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Added On</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-md" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge className={getCategoryBadgeColor(product.category)}>
                      {product.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 font-medium">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={product.stock < 10 ? "text-red-600 font-medium" : ""}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${product.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>{product.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={product.active ? "default" : "secondary"}
                        size="sm"
                        onClick={() => onToggleProductStatus(product.id, !product.active)}
                      >
                        {product.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center">No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name" className="text-right">
                  Product Name
                </Label>
                <Input
                  id="name"
                  value={productForm.name || ''}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div>
                <Label htmlFor="price" className="text-right">
                  Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={productForm.price || 0}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              
              <div>
                <Label htmlFor="stock" className="text-right">
                  Stock
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={productForm.stock || 0}
                  onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Input
                  id="category"
                  value={productForm.category || ''}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="col-span-3"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </datalist>
              </div>
              
              <div>
                <Label htmlFor="imageUrl" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  value={productForm.imageUrl || ''}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="col-span-3"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              
              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={productForm.active}
                  onCheckedChange={(checked) => setProductForm({ ...productForm, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductManagement;
