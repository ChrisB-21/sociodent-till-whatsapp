import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, Phone, Mail, User, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LocationAutocomplete from '@/components/ui/location-autocomplete';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { sendProductOrderNotificationToAdmin, sendOrderConfirmationToCustomer, saveOrderToFirebase, checkUserPendingOrders } from '@/services/productOrderService';
import { loadRazorpayScript, createRazorpayOrder, initializeRazorpayPayment } from '@/lib/razorpay';

interface CheckoutFormData {
  // Personal Details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Address Details
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  
  // Payment Details
  paymentMethod: 'cod' | 'online';
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { product, quantity, items, totalAmount } = location.state || {};
  
  // Determine if this is a cart checkout or single product checkout
  const isCartCheckout = !!items;
  const checkoutItems = isCartCheckout ? items : [{ ...product, quantity }];
  const checkoutTotal = isCartCheckout ? totalAmount : (product?.price * quantity || 0);
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    paymentMethod: 'cod'
  });

  // Handle location selection from Mapbox
  const handleLocationChange = (locationComponents: { state: string; city: string; district?: string; locality?: string; area?: string; pincode?: string }) => {
    setFormData(prev => ({
      ...prev,
      state: locationComponents.state,
      city: locationComponents.city,
      pincode: locationComponents.pincode || prev.pincode
    }));
    
    // Clear location-related errors
    if (errors.state) {
      setErrors(prev => ({ ...prev, state: undefined }));
    }
    if (errors.city) {
      setErrors(prev => ({ ...prev, city: undefined }));
    }
  };

  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingOrders, setIsCheckingOrders] = useState(true);

  // Check for pending orders when component mounts
  useEffect(() => {
    const checkPendingOrders = async () => {
      if (!user?.email) {
        setIsCheckingOrders(false);
        return;
      }

      try {
        const hasPendingOrders = await checkUserPendingOrders(user.email);
        if (hasPendingOrders) {
          toast({
            title: "Order Already in Progress",
            description: "You have an order that is still being processed. Please wait for it to be delivered before placing a new order.",
            variant: "destructive",
          });
          navigate('/marketplace');
          return;
        }
      } catch (error) {
        console.error('Error checking pending orders:', error);
      } finally {
        setIsCheckingOrders(false);
      }
    };

    checkPendingOrders();
  }, [user?.email, navigate, toast]);
  // Show loading state while checking for pending orders
  if (isCheckingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your order history...</p>
        </div>
      </div>
    );
  }

  if (!checkoutItems || checkoutItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Items Selected</h1>
          <Button onClick={() => navigate('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutFormData> = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Pincode validation
    const pincodeRegex = /^\d{6}$/;
    if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please fill all required fields",
        description: "Check the form for any errors and try again.",
        variant: "destructive"
      });
      return;
    }    setIsSubmitting(true);
      try {      const orderData = {
        items: checkoutItems,
        customerDetails: formData,
        userId: user?.uid || null,
        userAuthEmail: user?.email || null,
        userRole: user?.role || 'patient',
        userName: user?.name || `${formData.firstName} ${formData.lastName}`,
        totalAmount: checkoutTotal,
        orderDate: new Date().toISOString(),
        orderId: `ORD-${Date.now()}`,
        isCartOrder: isCartCheckout,
        paymentMethod: formData.paymentMethod,
        status: 'pending'
      };

      if (formData.paymentMethod === 'online') {
        // Process online payment with Razorpay
        await processOnlinePayment(orderData);
      } else {
        // Process COD order
        await processCODOrder(orderData);
      }

    } catch (error) {
      console.error('Order processing error:', error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const processCODOrder = async (orderData: any) => {
    // Simulate API call for COD orders
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Save order to Firebase first
    const saveResult = await saveOrderToFirebase(orderData);
    if (!saveResult.success) {
      throw new Error('Failed to save order');
    }

    // Send email notifications
    await sendNotifications(orderData);

    toast({
      title: "Order Placed Successfully!",
      description: `Your order ${orderData.orderId} has been placed. You will receive a confirmation email shortly.`,
    });

    // Redirect to order confirmation
    navigate('/order-confirmation', { state: { orderData } });
  };

  const processOnlinePayment = async (orderData: any) => {
    try {
      // Load Razorpay script
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        throw new Error("Failed to load Razorpay SDK");
      }      // Create Razorpay order
      console.log('=== RAZORPAY DEBUG START ===');
      console.log('1. Raw order data:', orderData);
      console.log('2. orderData.totalAmount:', orderData.totalAmount);
      console.log('3. typeof orderData.totalAmount:', typeof orderData.totalAmount);
      
      const amount = Math.round(orderData.totalAmount * 100); // Convert to paise
      console.log('4. Conversion calculation: Math.round(' + orderData.totalAmount + ' * 100)');
      console.log('5. Amount in paise (sent to backend):', amount);
      console.log('6. Amount in rupees (for verification):', amount / 100);
      console.log('=== RAZORPAY DEBUG END ===');
      
      const productInfo = {
        id: isCartCheckout ? 'cart-order' : checkoutItems[0].id,
        name: isCartCheckout ? `Cart Order (${checkoutItems.length} items)` : checkoutItems[0].name,
        items: checkoutItems
      };      const razorpayOrder = await createRazorpayOrder(amount, 'product', productInfo);
      console.log('7. Razorpay backend response:', razorpayOrder);

      // Verify the amount is correct before passing to Razorpay
      const expectedAmountInRupees = amount / 100;
      console.log('8. Expected amount in rupees:', expectedAmountInRupees);
      console.log('9. Razorpay order amount (paise):', razorpayOrder.amount);
      console.log('10. Razorpay order amount (rupees):', razorpayOrder.amount / 100);

      // Initialize Razorpay payment
      const paymentResult = await initializeRazorpayPayment({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount, // This should be in paise
        currency: razorpayOrder.currency || "INR",
        name: "SocioDent Marketplace",
        description: isCartCheckout ? `Payment for ${checkoutItems.length} items` : `Payment for ${checkoutItems[0].name}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },        notes: {
          orderType: 'product',
          orderItems: checkoutItems.length,
          isCartOrder: isCartCheckout,
        },
        theme: {
          color: "#3B82F6",
        },
      });      if (paymentResult.success) {
        // Payment successful - process the order
        orderData.paymentId = paymentResult.paymentId;
        orderData.razorpayOrderId = razorpayOrder.id;
        
        // Save order to Firebase first
        const saveResult = await saveOrderToFirebase(orderData);
        if (!saveResult.success) {
          throw new Error('Failed to save order');
        }
        
        // Send notifications
        await sendNotifications(orderData);

        toast({
          title: "Payment Successful!",
          description: `Your order ${orderData.orderId} has been placed successfully.`,
        });

        // Redirect to order confirmation
        navigate('/order-confirmation', { state: { orderData } });
      } else {
        throw new Error(paymentResult.error || "Payment failed");
      }

    } catch (error: any) {
      console.error('Online payment error:', error);
      throw new Error(error.message || "Payment processing failed");
    }
  };  const sendNotifications = async (orderData: any) => {
    // For multiple items, send notifications for each item
    for (const item of orderData.items) {
      const notificationData = {
        orderId: orderData.orderId,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        productName: item.name,
        quantity: item.quantity,
        totalAmount: item.price * item.quantity,
        paymentMethod: formData.paymentMethod,
        address: {
          line1: formData.addressLine1,
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          landmark: formData.landmark
        },
        orderDate: orderData.orderDate
      };

      // Send notification to admin
      await sendProductOrderNotificationToAdmin(notificationData);
    }
    
    // Send confirmation to customer (only once for the whole order)
    const customerNotificationData = {
      orderId: orderData.orderId,
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      productName: orderData.items.length > 1 ? `Order with ${orderData.items.length} items` : orderData.items[0].name,
      quantity: orderData.items.reduce((total: number, item: any) => total + item.quantity, 0),
      totalAmount: orderData.totalAmount,
      paymentMethod: formData.paymentMethod,
      address: {
        line1: formData.addressLine1,
        line2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        landmark: formData.landmark
      },
      orderDate: orderData.orderDate
    };

    await sendOrderConfirmationToCustomer(customerNotificationData);
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="text-sociodent-600" size={20} />
                  <h2 className="text-lg font-semibold">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="text-sociodent-600" size={20} />
                  <h2 className="text-lg font-semibold">Delivery Address</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      className={errors.addressLine1 ? 'border-red-500' : ''}
                      placeholder="House/Flat/Block No."
                    />
                    {errors.addressLine1 && <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>}
                  </div>
                  <div>
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={formData.addressLine2}
                      onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                      placeholder="Road/Street/Lane"
                    />
                  </div>
                  {/* Location Selection with Mapbox Autocomplete */}
                  <LocationAutocomplete
                    onLocationChange={handleLocationChange}
                    initialState={formData.state}
                    initialCity={formData.city}
                    errors={{
                      state: errors.state,
                      city: errors.city
                    }}
                  />
                  <div className="mt-4">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className={errors.pincode ? 'border-red-500' : ''}
                      placeholder="6-digit pincode"
                    />
                    {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
                  </div>
                  <div>
                    <Label htmlFor="landmark">Landmark (Optional)</Label>
                    <Input
                      id="landmark"
                      value={formData.landmark}
                      onChange={(e) => handleInputChange('landmark', e.target.value)}
                      placeholder="Nearby landmark for easy delivery"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="text-sociodent-600" size={20} />
                  <h2 className="text-lg font-semibold">Payment Method</h2>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <span className="sr-only">Cash on Delivery</span>
                    <input
                      id="payment-cod"
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value as 'cod' | 'online')}
                      className="text-sociodent-600"
                    />
                    <div>
                      <div className="font-medium">Cash on Delivery</div>
                      <div className="text-sm text-gray-500">Pay when your order arrives</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <span className="sr-only">Online Payment</span>
                    <input
                      id="payment-online"
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === 'online'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value as 'cod' | 'online')}
                      className="text-sociodent-600"
                    />
                    <div>
                      <div className="font-medium">Online Payment</div>
                      <div className="text-sm text-gray-500">Pay securely with UPI, Cards, Net Banking</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}              <Button
                type="submit"
                className="w-full bg-sociodent-600 hover:bg-sociodent-700 py-3"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Placing Order...' : `Place Order - ₹${checkoutTotal.toLocaleString()}`}
              </Button>
            </form>
          </div>          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {checkoutItems.map((item: any) => (
                  <div key={item.id || item.name} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-contain bg-gray-50 rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                      <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                      <div className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{checkoutTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>₹{checkoutTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Home size={16} />
                  <span className="font-medium">Free Delivery</span>
                </div>
                <p className="text-sm text-green-700">
                  Your order qualifies for free delivery. Expected delivery in 3-5 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
