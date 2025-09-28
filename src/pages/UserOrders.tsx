import React, { useState, useEffect } from 'react';
import { Package, Calendar, DollarSign, MapPin, Phone, Mail, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/firebase';
import { ref, get, onValue, off } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import { cancelOrder } from '@/services/productOrderService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  cancellationReason?: string;
  cancelledAt?: number;
}

const UserOrders = () => {
  const { toast } = useToast();
  const [user, loading, error] = useAuthState(auth);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch user's orders from Firebase
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      setDataLoading(false);
      return;
    }

    const ordersRef = ref(db, 'orders');
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const allOrders: ProductOrder[] = Object.values(ordersData);
        
        // Filter orders for the current user
        const userOrders = allOrders.filter(order => 
          order.userEmail === user.email || 
          order.userAuthEmail === user.email ||
          order.userId === user.uid
        );
        
        // Sort by creation date (newest first)
        userOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        setOrders(userOrders);
        console.log('Loaded user orders:', userOrders.length);
      } else {
        setOrders([]);
      }
      setDataLoading(false);
    }, (error) => {
      console.error('Error fetching user orders:', error);
      setDataLoading(false);
      toast({
        title: "Error",
        description: "Failed to load your orders. Please refresh the page.",
        variant: "destructive",
      });
    });

    return () => off(ordersRef, 'value', unsubscribe);
  }, [user, loading, toast]);

  const handleCancelOrder = async (order: ProductOrder) => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Cancellation Reason Required",
        description: "Please provide a reason for cancelling the order.",
        variant: "destructive",
      });
      return;
    }

    setIsCancelling(true);
    try {
      const result = await cancelOrder(order.id, user?.uid, cancellationReason.trim());
      
      if (result.success) {
        toast({
          title: "Order Cancelled",
          description: `Your order ${order.orderId} has been cancelled successfully.`,
        });
        setCancellationReason('');
        setSelectedOrder(null);
      } else {
        throw new Error(result.error || 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelOrder = (order: ProductOrder) => {
    return ['pending', 'confirmed'].includes(order.status);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h1>
          <p className="text-gray-600">You need to be logged in to view your orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
      </div>

      {dataLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h2>
          <p className="text-gray-500">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Order #{order.orderId}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  {canCancelOrder(order) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel Order
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Cancel Order #{order.orderId}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this order? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="my-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for cancellation (required)
                          </label>
                          <Textarea
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Please provide a reason for cancelling this order..."
                            className="w-full"
                            rows={3}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => {
                            setCancellationReason('');
                            setSelectedOrder(null);
                          }}>
                            Keep Order
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelOrder(order)}
                            disabled={isCancelling || !cancellationReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Items Ordered</h4>
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {item.name} (Qty: {item.quantity}) - ₹{item.price}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Payment Details</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Total: ₹{order.totalAmount}
                  </p>
                  <p className="text-sm text-gray-600">
                    Method: {order.paymentMethod.toUpperCase()}
                  </p>
                  {order.paymentId && (
                    <p className="text-sm text-gray-600">
                      Payment ID: {order.paymentId}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Delivery Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{order.userAddress.street}</p>
                    {order.userAddress.line2 && <p>{order.userAddress.line2}</p>}
                    <p>{order.userAddress.city}, {order.userAddress.state}</p>
                    <p>{order.userAddress.pincode}</p>
                  </div>
                </div>
              </div>

              {order.status === 'cancelled' && order.cancellationReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Cancellation Reason:</strong> {order.cancellationReason}
                  </p>
                  {order.cancelledAt && (
                    <p className="text-sm text-red-600 mt-1">
                      Cancelled on: {formatDate(order.cancelledAt)}
                    </p>
                  )}
                </div>
              )}

              {order.trackingInfo && order.trackingInfo.statusHistory.length > 1 && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <h5 className="font-medium text-gray-800 mb-2">Order Timeline</h5>
                  <div className="space-y-1">
                    {order.trackingInfo.statusHistory.slice(-3).reverse().map((history, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <span className="font-medium">{history.status.charAt(0).toUpperCase() + history.status.slice(1)}</span> - 
                        {formatDate(history.timestamp)} - {history.note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
