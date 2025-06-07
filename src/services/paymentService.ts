// Payment Service - Handles all payment-related operations
import { loadRazorpayScript, createRazorpayOrder, initializeRazorpayPayment } from '@/lib/razorpay';

export interface PaymentData {
  amount: number;
  consultationType: 'virtual' | 'home' | 'clinic';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  appointmentDetails: {
    date: string;
    time: string;
    address?: string;
  };
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

export class PaymentService {
  private static instance: PaymentService;

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Initialize Razorpay SDK
   */
  public async initializePaymentSDK(): Promise<boolean> {
    try {
      return await loadRazorpayScript();
    } catch (error) {
      console.error('Failed to initialize payment SDK:', error);
      return false;
    }
  }

  /**
   * Process Razorpay payment
   */
  public async processRazorpayPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      // Ensure Razorpay SDK is loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        console.log("Razorpay not loaded, trying to load again...");
        const loaded = await loadRazorpayScript();
        
        if (!loaded || typeof (window as any).Razorpay === 'undefined') {
          throw new Error("Razorpay SDK failed to load");
        }
      }

      // Validate Razorpay key
      if (!RAZORPAY_KEY) {
        throw new Error("Razorpay API key is missing");
      }

      // Create order
      const amount = Math.round(paymentData.amount * 100);
      console.log("Creating order with amount:", amount);

      const order = await createRazorpayOrder(amount, 'consultation', paymentData.consultationType);
      console.log("Order created successfully:", order);

      if (!order || !order.id) {
        throw new Error("Failed to create order: Invalid response");
      }

      // Initialize payment
      const paymentResponse = await initializeRazorpayPayment({
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Socio Smile Market",
        description: this.getConsultationTitle(paymentData.consultationType),
        order_id: order.id,
        prefill: {
          name: paymentData.customerInfo.name,
          email: paymentData.customerInfo.email,
          contact: paymentData.customerInfo.phone,
        },
        notes: {
          consultationType: paymentData.consultationType,
          date: paymentData.appointmentDetails.date,
          time: paymentData.appointmentDetails.time,
          ...(paymentData.consultationType !== 'virtual' && paymentData.appointmentDetails.address 
            ? { address: paymentData.appointmentDetails.address } 
            : {}),
        },
        theme: {
          color: "#0F766E",
        },
      });

      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
      };

    } catch (error: any) {
      console.error("Payment failed:", error);
      return {
        success: false,
        error: error.message || "Payment processing failed",
      };
    }
  }

  /**
   * Validate payment method for consultation type
   */
  public isPaymentMethodAvailable(paymentMethod: 'razorpay' | 'cash', consultationType: 'virtual' | 'home' | 'clinic'): boolean {
    // Cash payment is not available for virtual consultations
    if (paymentMethod === 'cash' && consultationType === 'virtual') {
      return false;
    }
    return true;
  }

  /**
   * Get consultation title for display
   */
  private getConsultationTitle(consultationType: 'virtual' | 'home' | 'clinic'): string {
    const titles = {
      virtual: 'Virtual Consultation',
      home: 'Home Visit Consultation',
      clinic: 'Clinic Consultation',
    };
    return titles[consultationType];
  }

  /**
   * Get available payment methods for a consultation type
   */
  public getAvailablePaymentMethods(consultationType: 'virtual' | 'home' | 'clinic') {
    const allMethods = [
      {
        id: 'razorpay',
        name: 'Card/UPI/Netbanking',
        available: true,
      },
      {
        id: 'cash',
        name: 'Cash on Visit',
        available: consultationType !== 'virtual',
      },
    ];

    return allMethods.filter(method => method.available);
  }
}

export const paymentService = PaymentService.getInstance();
