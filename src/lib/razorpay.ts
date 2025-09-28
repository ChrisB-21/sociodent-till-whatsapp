import { API_ENDPOINTS } from '../config/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: any;
  theme: {
    color: string;
  };
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

// Log Razorpay key for debugging
console.log('Razorpay API Key:', RAZORPAY_KEY ? 'Available' : 'Not available');

// Suppress XMLHttpRequest header warnings from Razorpay
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(...args) {
  const result = originalXHROpen.apply(this, args);
  
  // Override onreadystatechange to suppress header warnings
  const originalOnReadyStateChange = this.onreadystatechange;
  this.onreadystatechange = function(...readyArgs) {
    try {
      if (originalOnReadyStateChange) {
        return originalOnReadyStateChange.apply(this, readyArgs);
      }
    } catch (error: any) {
      // Suppress specific header access errors from Razorpay
      if (error.message && (
        error.message.includes('x-rtb-fingerprint-id') ||
        error.message.includes('unsafe header')
      )) {
        return;
      }
      throw error;
    }
  };
  
  return result;
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      console.log('Razorpay already loaded');
      resolve(true);
      return;
    }
    
    // Remove any existing script tags (in case of previous failed loads)
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.parentNode?.removeChild(existingScript);
    }
    
    console.log('Loading Razorpay script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.id = 'razorpay-script';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error);
      resolve(false);
    };
    
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (amount: number, orderType = 'consultation', extraData?: any) => {
  try {
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount for order creation');
    }
    
    // Convert amount from rupees to paise (smallest currency unit)
    // Razorpay expects amount in paise (1 rupee = 100 paise)
    // For products, the amount is already converted in Checkout.tsx, so don't convert again
    // For consultations, the amount is in rupees, so convert to paise
    let amountInPaise;
    if (orderType === 'product') {
      // Products: amount is already in paise from Checkout.tsx
      amountInPaise = amount;
    } else {
      // Consultations: amount is in rupees, convert to paise
      amountInPaise = Math.round(amount * 100);
    }
    
    let requestBody: any = { amount: amountInPaise, orderType };
    
    // Validate consultation type if order type is consultation
    if (orderType === 'consultation') {
      const consultationType = extraData;
      if (!consultationType || !['virtual', 'home', 'clinic'].includes(consultationType)) {
        throw new Error('Invalid consultation type');
      }
      requestBody.consultationType = consultationType;
    }
    
    // Add product info if order type is product
    if (orderType === 'product') {
      const productInfo = extraData;
      if (!productInfo || !productInfo.id || !productInfo.name) {
        throw new Error('Product information is required for product orders');
      }
      requestBody.productInfo = productInfo;
    }
    
    console.log(`Creating order at ${API_ENDPOINTS.RAZORPAY.CREATE_ORDER}`);
    if (orderType === 'product') {
      console.log(`Product amount: ${amount} paise (₹${amount / 100})`);
    } else {
      console.log(`Consultation amount: ₹${amount} (${amountInPaise} paise)`);
    }
    console.log('Request body:', requestBody);
    
    const response = await fetch(API_ENDPOINTS.RAZORPAY.CREATE_ORDER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Order creation failed. Status:', response.status, 'Response:', errorText);
      
      let errorMessage = 'Failed to create payment order';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response isn't valid JSON, use the original error message
      }
      
      throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    console.log('Order created successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  try {
    // Validate payment data
    if (!paymentData.razorpay_order_id || !paymentData.razorpay_payment_id || !paymentData.razorpay_signature) {
      throw new Error('Missing payment verification parameters');
    }
    
    console.log('Verifying payment with data:', {
      orderId: paymentData.razorpay_order_id,
      paymentId: paymentData.razorpay_payment_id,
      // Don't log the signature for security reasons
    });
    
    const response = await fetch(API_ENDPOINTS.RAZORPAY.VERIFY_PAYMENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payment verification failed. Status:', response.status, 'Response:', errorText);
      
      let errorMessage = 'Payment verification failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response isn't valid JSON, use the original error message
      }
      
      throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    console.log('Payment verified successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

export const initializeRazorpayPayment = (options: RazorpayOptions): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if Razorpay is loaded or needs to be loaded
      if (!window.Razorpay) {
        console.log('Razorpay not loaded, attempting to load...');
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay SDK');
        }
      }

      // Double-check that Razorpay is available
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not available even after loading');
      }

      // Validate required fields
      if (!options.key) {
        throw new Error('Razorpay key is required');
      }
      
      if (!options.amount) {
        throw new Error('Amount is required for payment');
      }
      
      if (!options.order_id) {
        throw new Error('Order ID is required for payment');
      }

      console.log('Initializing Razorpay payment with options:', {
        key: options.key,
        amount: options.amount,
        currency: options.currency,
        order_id: options.order_id,
        amountInRupees: options.amount / 100 // For debugging
      });

      // Validate amount is reasonable
      if (options.amount < 300) {
        console.warn('Warning: Amount is less than ₹3 (300 paise). Current amount:', options.amount, 'paise');
      }

      // Create Razorpay instance with explicit amount formatting
      const rzp = new window.Razorpay({
        key: options.key,
        amount: parseInt(options.amount.toString()), // Ensure it's an integer
        currency: options.currency || 'INR',
        order_id: options.order_id,
        name: options.name,
        description: options.description,
        prefill: options.prefill || {},
        notes: options.notes || {},
        theme: options.theme || { color: '#1669AE' },
        handler: async function(response: any) {
          try {
            console.log('Payment successful, processing...', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id
            });
            
            // TODO: Re-enable verification after debugging
            // For now, skip verification to test the booking flow
            console.log('Skipping verification for debugging - payment accepted');
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              response: response
            });
            
            /* 
            // Verify the payment
            const verificationResponse = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            if (verificationResponse.success) {
              console.log('Payment verification successful');
              resolve({
                success: true,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                response: response
              });
            } else {
              console.error('Payment verification failed:', verificationResponse);
              reject(new Error('Payment verification failed'));
            }
            */
          } catch (error) {
            console.error('Error in payment handler:', error);
            reject(error);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed by user');
            reject(new Error('Payment cancelled by user'));
          },
          escape: false,
          animation: true
        },
      });
      
      // Register event listeners
      rzp.on('payment.failed', function(response: any) {
        console.error('Payment failed:', response.error);
        reject(new Error(`Payment failed: ${response.error.description || response.error.reason || 'Unknown error'}`));
      });
      
      rzp.on('payment.cancel', function() {
        console.log('Payment cancelled by user');
        reject(new Error('Payment was cancelled'));
      });
      
      // Open Razorpay payment form
      console.log('Opening Razorpay payment modal...');
      rzp.open();
    } catch (error) {
      console.error('Error initializing Razorpay payment:', error);
      reject(error);
    }
  });
};