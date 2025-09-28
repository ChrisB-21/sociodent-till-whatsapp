import React, { useState, useEffect } from 'react';
import { Package, User, MapPin, Phone, Mail, Calendar, DollarSign, Search, Filter, Eye, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/firebase';
import { ref, get, onValue, off, set } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';

interface ProductOrder {
  id: string;
  orderId: string;
  orderDate: string;
  userId?: string;
  userAuthEmail?: string;
  userRole?: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAddress: {
    street: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
    country: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  totalAmount: number;
  paymentMethod: 'cod' | 'online';
  paymentId?: string;
  razorpayOrderId?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  isCartOrder: boolean;
  trackingInfo?: {
    orderPlaced: number;
    statusHistory: Array<{
      status: string;
      timestamp: number;
      note: string;
    }>;
  };
  createdAt: number;
  updatedAt: number;
}

const AdminProductOrders = () => {
  const { toast } = useToast();
  const [user, loading, error] = useAuthState(auth);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ProductOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);

  // Debug authentication
  useEffect(() => {
    console.log('Admin Product Orders - Auth state:', { user: user?.email, loading, error });
  }, [user, loading, error]);

  // Fetch orders from Firebase
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    if (!user) {
      console.log('Admin Product Orders - No authenticated user');
      setDataLoading(false);
      return;
    }

    console.log('Admin Product Orders - Fetching orders for user:', user.email);
    const ordersRef = ref(db, 'orders');
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      console.log('Admin Product Orders - Firebase snapshot:', snapshot.exists(), snapshot.val());
      
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const ordersArray: ProductOrder[] = Object.values(ordersData);
        
        // Sort by creation date (newest first)
        ordersArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        setOrders(ordersArray);
        setFilteredOrders(ordersArray);
        console.log('Admin Product Orders - Loaded orders:', ordersArray.length, ordersArray);
      } else {
        console.log('Admin Product Orders - No orders found in Firebase');
        setOrders([]);
        setFilteredOrders([]);
      }
      setDataLoading(false);
    }, (error) => {
      console.error('Admin Product Orders - Error fetching orders:', error);
      setDataLoading(false);
      toast({
        title: "Error",
        description: "Failed to load orders. Please refresh the page.",
        variant: "destructive",
      });
    });

    return () => off(ordersRef, 'value', unsubscribe);
  }, [toast, user, loading]);
  // Filter orders based on search and status
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show login required state
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access the admin panel.</p>
        </div>
      </div>
    );
  }
  const updateOrderStatus = async (orderId: string, newStatus: ProductOrder['status']) => {
    try {
      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { ...order, status: newStatus };
            
            // Add to tracking history if it exists
            if (updatedOrder.trackingInfo) {
              updatedOrder.trackingInfo.statusHistory.push({
                status: newStatus,
                timestamp: Date.now(),
                note: `Status updated to ${newStatus}`
              });
            }
            
            return updatedOrder;
          }
          return order;
        })
      );

      // Update in Firebase
      const orderRef = ref(db, `orders/${orderId}`);
      await set(orderRef, {
        ...orders.find(o => o.id === orderId),
        status: newStatus,
        updatedAt: Date.now(),
        trackingInfo: {
          ...orders.find(o => o.id === orderId)?.trackingInfo,
          statusHistory: [
            ...(orders.find(o => o.id === orderId)?.trackingInfo?.statusHistory || []),
            {
              status: newStatus,
              timestamp: Date.now(),
              note: `Status updated to ${newStatus} by admin`
            }
          ]
        }
      });

      toast({
        title: "Order Status Updated",
        description: `Order status has been updated to ${newStatus}`,
      });

      // In real app, send email notification to customer here
      console.log(`Email notification sent for order ${orderId} - status: ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: ProductOrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ProductOrder['status']) => {
    switch (status) {
      case 'pending': return <Calendar size={14} />;
      case 'confirmed': return <Check size={14} />;
      case 'shipped': return <Package size={14} />;
      case 'delivered': return <Check size={14} />;
      case 'cancelled': return <X size={14} />;
      default: return <Calendar size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Orders</h1>
              <p className="text-gray-600 mt-1">Manage customer product orders and deliveries</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Total Orders: {orders.length}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Pending: {orders.filter(o => o.status === 'pending').length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input
                  placeholder="Search by customer name, order ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sociodent-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">                {filteredOrders.map((order) => {
                  // Calculate total items and get first product for display
                  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  const firstItem = order.items[0];
                  const itemsDisplay = order.items.length > 1 
                    ? `${order.items.length} products (${totalItems} items)` 
                    : `${firstItem?.name || 'Unknown Product'}`;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{order.orderId}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{order.userName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail size={12} />
                            {order.userEmail}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone size={12} />
                            {order.userPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {firstItem?.image && (
                            <img
                              src={firstItem.image}
                              alt={firstItem.name}
                              className="w-12 h-12 object-contain bg-gray-50 rounded"
                            />
                          )}
                          {!firstItem?.image && (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-xs">
                              {itemsDisplay}
                            </div>
                            <div className="text-sm text-gray-500">Total: {totalItems} items</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">₹{order.totalAmount}</div>
                        <div className="text-sm text-gray-500">{order.paymentMethod.toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          {order.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              Confirm
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              Ship
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          )}

          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more orders.'
                  : 'No product orders have been placed yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Order Details</h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Order Info */}
                <div>
                  <h3 className="font-semibold mb-3">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Order ID:</span>
                      <span className="font-medium ml-2">{selectedOrder.orderId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Order Date:</span>
                      <span className="font-medium ml-2">
                        {new Date(selectedOrder.orderDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment:</span>
                      <span className="font-medium ml-2">{selectedOrder.paymentMethod.toUpperCase()}</span>
                    </div>
                  </div>
                </div>                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span>{selectedOrder.userName}</span>
                      {selectedOrder.userRole && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {selectedOrder.userRole}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <span>{selectedOrder.userEmail}</span>
                    </div>
                    {selectedOrder.userAuthEmail && selectedOrder.userAuthEmail !== selectedOrder.userEmail && (
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-blue-400" />
                        <span className="text-blue-600">Auth Email: {selectedOrder.userAuthEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span>{selectedOrder.userPhone}</span>
                    </div>
                    {selectedOrder.userId && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>User ID: {selectedOrder.userId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="font-semibold mb-3">Delivery Address</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>{selectedOrder.userAddress.street}</div>
                    {selectedOrder.userAddress.line2 && <div>{selectedOrder.userAddress.line2}</div>}
                    <div>{selectedOrder.userAddress.city}, {selectedOrder.userAddress.state} - {selectedOrder.userAddress.pincode}</div>
                    {selectedOrder.userAddress.landmark && <div>Landmark: {selectedOrder.userAddress.landmark}</div>}
                  </div>
                </div>

                {/* Product Details */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-contain bg-white rounded"                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Package size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="text-sm text-gray-500 mt-1">
                            Quantity: {item.quantity} × ₹{item.price} = ₹{item.quantity * item.price}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="text-xl font-bold">₹{selectedOrder.totalAmount}</span>
                      </div>
                    </div>
                  </div>                </div>

                {/* Order Tracking */}
                {selectedOrder.trackingInfo && (
                  <div>
                    <h3 className="font-semibold mb-3">Order Tracking</h3>
                    <div className="space-y-3">
                      {selectedOrder.trackingInfo.statusHistory?.map((track: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 text-sm">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                          <div className="flex-1">
                            <div className="font-medium capitalize">{track.status}</div>
                            <div className="text-gray-500 text-xs">
                              {new Date(track.timestamp).toLocaleString()}
                            </div>
                            {track.note && (
                              <div className="text-gray-600 text-xs mt-1">{track.note}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div>
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Method:</span>
                      <span className="font-medium ml-2">{selectedOrder.paymentMethod.toUpperCase()}</span>
                    </div>
                    {selectedOrder.paymentId && (
                      <div>
                        <span className="text-gray-500">Payment ID:</span>
                        <span className="font-medium ml-2 text-xs">{selectedOrder.paymentId}</span>
                      </div>
                    )}
                    {selectedOrder.razorpayOrderId && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Razorpay Order:</span>
                        <span className="font-medium ml-2 text-xs">{selectedOrder.razorpayOrderId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update Actions */}
                <div>
                  <h3 className="font-semibold mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <Button
                        key={status}
                        variant={selectedOrder.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, status as ProductOrder['status']);
                          setSelectedOrder({ ...selectedOrder, status: status as ProductOrder['status'] });
                        }}
                        disabled={selectedOrder.status === status}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductOrders;
