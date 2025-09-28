import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();  const { orderData } = location.state || {};

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <Button onClick={() => navigate('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  // Handle both single product and cart orders
  const items = orderData.items || [{ ...orderData.product, quantity: orderData.quantity }];
  const customerDetails = orderData.customerDetails;
  const totalAmount = orderData.totalAmount;
  const orderId = orderData.orderId;

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="container-custom py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">Thank you for your order. We'll send you a confirmation email shortly.</p>
        </div>

        {/* Order Details */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">            <div className="border-b pb-4 mb-4">
              <h2 className="text-lg font-semibold mb-2">Order Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-medium ml-2">{orderId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Order Date:</span>
                  <span className="font-medium ml-2">{new Date(orderData.orderDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Order Status:</span>
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    {orderData.status || 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Estimated Delivery:</span>
                  <span className="font-medium ml-2">3-5 business days</span>
                </div>
              </div>
            </div>            {/* Product Details */}
            <div className="space-y-4 mb-6">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 p-4 border border-gray-100 rounded-lg">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-contain bg-gray-50 rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <div className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</div>
                    <div className="text-lg font-semibold mt-2">₹{item.price * item.quantity}</div>
                  </div>
                </div>
              ))}
              
              {/* Total Amount */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-sociodent-600">₹{totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin size={16} />
                Delivery Address
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div>{customerDetails.firstName} {customerDetails.lastName}</div>
                <div>{customerDetails.addressLine1}</div>
                {customerDetails.addressLine2 && <div>{customerDetails.addressLine2}</div>}
                <div>{customerDetails.city}, {customerDetails.state} - {customerDetails.pincode}</div>
                {customerDetails.landmark && <div>Landmark: {customerDetails.landmark}</div>}
                <div className="mt-2">
                  <span className="font-medium">Phone:</span> {customerDetails.phone}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {customerDetails.email}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Payment Method:</span>
                <span className="font-medium capitalize">
                  {orderData.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment'}
                </span>
              </div>
              
              {orderData.paymentMethod === 'cod' ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Package className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">Cash on Delivery Instructions</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Please keep exact amount ₹{totalAmount} ready for payment</li>
                        <li>• Payment to be made to the delivery person</li>
                        <li>• Delivery charges (if any) are included in the total amount</li>
                        <li>• Please verify the product before making payment</li>
                        <li>• Our delivery partner will call you before delivery</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle size={16} />
                    <span className="font-medium">Payment Completed Successfully</span>
                  </div>
                  {orderData.razorpayPaymentId && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span>Transaction ID: </span>
                      <span className="font-mono">{orderData.razorpayPaymentId}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-sociodent-600">₹{totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button
              onClick={() => navigate('/marketplace')}
              variant="outline"
              className="px-8"
            >
              <ArrowLeft className="mr-2" size={16} />
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
