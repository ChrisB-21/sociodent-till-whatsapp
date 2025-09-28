import type { ConsultationType, PaymentData, PaymentResult } from '../types/payment.d';
import { createRazorpayOrder, loadRazorpayScript, initializeRazorpayPayment } from '../lib/razorpay';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

export interface PaymentMethod {
    id: 'razorpay' | 'cash';
    name: string;
    available: boolean;
}

class PaymentService {
    private static instance: PaymentService | null = null;

    private constructor() {
        // Private constructor to enforce singleton
    }

    public static getInstance(): PaymentService {
        if (!PaymentService.instance) {
            PaymentService.instance = new PaymentService();
        }
        return PaymentService.instance;
    }

    public async initializePaymentSDK(): Promise<boolean> {
        try {
            return await loadRazorpayScript();
        } catch (error) {
            console.error('Failed to initialize payment SDK:', error);
            return false;
        }
    }

    public async processRazorpayPayment(paymentData: PaymentData): Promise<PaymentResult> {
        try {
            // Check if Razorpay SDK is loaded
            if (typeof (window as any).Razorpay === 'undefined') {
                const loaded = await this.initializePaymentSDK();
                if (!loaded) {
                    throw new Error("Razorpay SDK failed to load");
                }
            }

            // Validate API key
            if (!RAZORPAY_KEY) {
                throw new Error("Razorpay API key is missing");
            }

            // Create order
            const order = await createRazorpayOrder(
                paymentData.amount, 
                'consultation', 
                paymentData.consultationType
            );

            if (!order?.id) {
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

    public isPaymentMethodAvailable(paymentMethod: 'razorpay' | 'cash', consultationType: ConsultationType): boolean {
        return !(paymentMethod === 'cash' && consultationType === 'virtual');
    }

    private getConsultationTitle(consultationType: ConsultationType): string {
        const titles: Record<ConsultationType, string> = {
            virtual: 'Virtual Consultation',
            home: 'Home Visit Consultation',
            clinic: 'Clinic Consultation',
        };
        return titles[consultationType];
    }

    public getAvailablePaymentMethods(consultationType: ConsultationType): PaymentMethod[] {
        const allMethods: PaymentMethod[] = [
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

// Create and export the singleton instance
const paymentService = PaymentService.getInstance();

export { paymentService };
export default paymentService;