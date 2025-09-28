import { db } from '@/firebase';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';

export interface ProductOrderNotification {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  orderDate: string;
}

// Function to check if user has pending orders
export const checkUserPendingOrders = async (userEmail: string) => {
  try {
    const ordersRef = ref(db, 'orders');
    const snapshot = await get(ordersRef);
    
    if (snapshot.exists()) {
      const ordersData = snapshot.val();
      const orders = Object.values(ordersData) as any[];
      
      // Check if user has any orders that are not yet delivered
      const pendingOrders = orders.filter(order => 
        order.userEmail === userEmail && 
        order.status !== 'delivered' && 
        order.status !== 'cancelled'
      );
      
      return pendingOrders.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking user pending orders:', error);
    return false;
  }
};

// Function to save a complete order to Firebase
export const saveOrderToFirebase = async (orderData: any) => {
  try {
    const ordersRef = ref(db, 'orders');
    const newOrderRef = push(ordersRef);
    
    // Extract customer details from the order data
    const customerDetails = orderData.customerDetails || {};
    
    // Create comprehensive order object with enhanced user tracking
    const completeOrder = {
      id: newOrderRef.key,
      orderId: orderData.orderId,
      orderDate: orderData.orderDate,
      
      // User identification - multiple ways to track the user
      userId: orderData.userId || null,
      userAuthEmail: orderData.userAuthEmail || customerDetails.email,
      userRole: orderData.userRole || 'patient',
      userName: orderData.userName || `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim(),
      userEmail: customerDetails.email || '',
      userPhone: customerDetails.phone || '',
      
      // User address
      userAddress: {
        street: customerDetails.addressLine1 || '',
        line2: customerDetails.addressLine2 || '',
        city: customerDetails.city || '',
        state: customerDetails.state || '',
        pincode: customerDetails.pincode || '',
        landmark: customerDetails.landmark || '',
        country: 'India'
      },
      
      // Order details
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      paymentMethod: orderData.paymentMethod || 'cod',
      paymentId: orderData.paymentId || null,
      razorpayOrderId: orderData.razorpayOrderId || null,
      status: orderData.status || 'pending',
      isCartOrder: orderData.isCartOrder || false,
      
      // Tracking information
      trackingInfo: {
        orderPlaced: Date.now(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: Date.now(),
            note: 'Order placed successfully'
          }
        ]
      },
      
      // Timestamps
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await set(newOrderRef, completeOrder);
    
    // Also save order to user's personal order history
    if (orderData.userId) {
      const userOrderRef = ref(db, `users/${orderData.userId}/orders/${newOrderRef.key}`);
      await set(userOrderRef, {
        orderId: orderData.orderId,
        orderDate: orderData.orderDate,
        totalAmount: orderData.totalAmount,
        status: orderData.status,
        items: orderData.items,
        paymentMethod: orderData.paymentMethod,
        createdAt: Date.now()
      });
    }
    
    console.log('Order saved to Firebase successfully:', newOrderRef.key);
    return { success: true, orderId: newOrderRef.key };
  } catch (error) {    console.error('Error saving order to Firebase:', error);
    return { success: false, error };
  }
};

// Function to cancel an order
export const cancelOrder = async (orderId: string, userId?: string, reason?: string) => {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);
    
    if (!orderSnapshot.exists()) {
      return { success: false, error: 'Order not found' };
    }
    
    const orderData = orderSnapshot.val();
    
    // Check if order can be cancelled (only pending and confirmed orders)
    if (!['pending', 'confirmed'].includes(orderData.status)) {
      return { success: false, error: 'Order cannot be cancelled at this stage' };
    }
    
    // Update order status to cancelled
    const updatedOrder = {
      ...orderData,
      status: 'cancelled',
      cancellationReason: reason || 'Cancelled by user',
      cancelledAt: Date.now(),
      updatedAt: Date.now(),
      trackingInfo: {
        ...orderData.trackingInfo,
        statusHistory: [
          ...orderData.trackingInfo.statusHistory,
          {
            status: 'cancelled',
            timestamp: Date.now(),
            note: reason || 'Order cancelled by user'
          }
        ]
      }
    };
    
    await set(orderRef, updatedOrder);
    
    // Send cancellation notification to admin
    await sendOrderCancellationNotificationToAdmin({
      orderId: orderData.orderId,
      customerName: orderData.userName,
      customerEmail: orderData.userEmail,
      customerPhone: orderData.userPhone,
      productName: orderData.items.map((item: any) => item.name).join(', '),
      totalAmount: orderData.totalAmount,
      paymentMethod: orderData.paymentMethod,
      cancellationReason: reason || 'Cancelled by user',
      orderDate: orderData.orderDate
    });
    
    console.log('Order cancelled successfully:', orderId);
    return { success: true, orderId };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error };
  }
};

// Function to send order cancellation notification to admin via email
export const sendOrderCancellationNotificationToAdmin = async (orderData: any) => {
  try {
    // Send email to admin
    const emailResponse = await fetch('http://localhost:3000/api/email/send-order-cancellation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminEmail: 'saiaravindanstudiesonly@gmail.com',
        orderData
      })
    });
    
    if (!emailResponse.ok) {
      throw new Error('Failed to send email notification');
    }
    
    // Also store in Firebase for admin dashboard
    const notificationsRef = ref(db, 'admin/orderCancellationNotifications');
    await push(notificationsRef, {
      ...orderData,
      notificationDate: new Date().toISOString(),
      status: 'unread',
      type: 'cancellation'
    });
    
    console.log('Order cancellation notification sent to admin');
    return { success: true };
  } catch (error) {
    console.error('Error sending order cancellation notification:', error);
    return { success: false, error };
  }
};

// Function to send product order notification to admin via email
export const sendProductOrderNotificationToAdmin = async (orderData: ProductOrderNotification) => {
  try {
    // Send email to admin
    const emailResponse = await fetch('http://localhost:3000/api/email/send-product-order-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminEmail: 'saiaravindanstudiesonly@gmail.com',
        orderData
      })
    });
    
    if (!emailResponse.ok) {
      console.warn('Failed to send email notification, but continuing...');
    }
    
    // Store notification in Firebase for admin to see
    const notificationsRef = ref(db, 'admin/productOrderNotifications');
    await push(notificationsRef, {
      ...orderData,
      notificationDate: new Date().toISOString(),
      status: 'unread',
      type: 'new_order'
    });

    console.log('Product order notification sent to admin:', orderData);
    return { success: true };
  } catch (error) {
    console.error('Error sending product order notification:', error);
    return { success: false, error };
  }
};

// Function to send order confirmation email to customer
export const sendOrderConfirmationToCustomer = async (orderData: ProductOrderNotification) => {
  try {
    // Store customer notification
    const customerNotificationsRef = ref(db, `users/${orderData.customerEmail.replace(/[.#$[\]]/g, '_')}/orderNotifications`);
    await push(customerNotificationsRef, {
      orderId: orderData.orderId,
      productName: orderData.productName,
      totalAmount: orderData.totalAmount,
      orderDate: orderData.orderDate,
      status: 'confirmed',
      notificationDate: new Date().toISOString()
    });

    // In a real application, send actual email to customer
    console.log('Order confirmation sent to customer:', orderData.customerEmail);

    return { success: true };
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return { success: false, error };
  }
};

// Function to get all product order notifications for admin
export const getProductOrderNotifications = async () => {
  try {
    // In a real app, you would fetch from your backend API
    // For now, return mock data or Firebase data
    return [];
  } catch (error) {
    console.error('Error fetching product order notifications:', error);
    return [];
  }
};
