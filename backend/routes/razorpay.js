import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

let razorpay = null;

// Try to initialize Razorpay
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET not set in environment variables, Razorpay functionality will be limited');
  } else {
    // Log the keys being used (only first few characters for security)
    console.log(`Initializing Razorpay with Key ID: ${process.env.RAZORPAY_KEY_ID.substring(0, 6)}... and Key Secret: ${process.env.RAZORPAY_KEY_SECRET.substring(0, 5)}...`);
    
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Razorpay:', error.message);
}

router.post('/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      console.error('Razorpay service is not available');
      return res.status(503).json({ message: 'Razorpay service is not available' });
    }

    const { amount, orderType, consultationType, productInfo } = req.body;
    
    if (!amount || isNaN(amount)) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    // Validate order type
    if (!orderType || !['consultation', 'product'].includes(orderType)) {
      console.error('Invalid order type:', orderType);
      return res.status(400).json({ message: 'Invalid order type. Must be consultation or product' });
    }
    
    // Validate consultation type if order type is consultation
    if (orderType === 'consultation' && (!consultationType || !['virtual', 'home', 'clinic'].includes(consultationType))) {
      console.error('Invalid consultation type:', consultationType);
      return res.status(400).json({ message: 'Invalid consultation type' });
    }

    // Validate product info if order type is product
    if (orderType === 'product' && (!productInfo || !productInfo.id || !productInfo.name)) {
      console.error('Invalid product info:', productInfo);
      return res.status(400).json({ message: 'Product information is required for product orders' });
    }

    console.log(`Creating Razorpay order for ${orderType} with amount:`, amount);
    console.log('=== BACKEND RAZORPAY DEBUG ===');
    console.log('Received amount (in paise):', amount);
    console.log('Amount type:', typeof amount);
    console.log('Amount in rupees:', amount / 100);
    console.log('==============================');
    if (orderType === 'consultation') {
      console.log('Consultation type:', consultationType);
    } else {
      console.log('Product:', productInfo.name);
    }
    console.log('Using Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
    
    // Create a short receipt (max 40 characters for Razorpay)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    let receiptPrefix;
    
    if (orderType === 'consultation') {
      receiptPrefix = `cons_${consultationType.substring(0, 4)}`;
    } else {
      // For products, use a short product identifier
      const productId = productInfo.id ? productInfo.id.toString().substring(0, 10) : 'prod';
      receiptPrefix = `prod_${productId}`;
    }
    
    const receipt = `${receiptPrefix}_${timestamp}`.substring(0, 40); // Ensure max 40 chars
    
    console.log('Generated receipt:', receipt, '(length:', receipt.length, ')');
    
    const options = {
      amount: amount, // amount in smallest currency unit (paise for INR)
      currency: "INR",
      receipt: receipt,
      notes: {
        orderType: orderType,
        ...(orderType === 'consultation' ? { consultationType } : { productInfo })
      },
    };

    const order = await razorpay.orders.create(options);
    console.log('Order created:', order);
    res.json(order);
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({ message: 'Failed to create order: ' + error.message });
  }
});

router.post('/verify-payment', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        success: false,
        message: 'Razorpay service is not available' 
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing payment verification parameters' 
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log('Verifying payment signature:', {
      expected: expectedSignature,
      received: razorpay_signature
    });

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      res.json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
});

export default router;