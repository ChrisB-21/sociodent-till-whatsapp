export type ConsultationType = 'virtual' | 'home' | 'clinic';
export type PaymentStatus = 'INITIALIZING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
}

export interface AppointmentDetails {
    date: string;
    time: string;
    address?: string;
}

export interface PaymentData {
    amount: number;
    currency: string;
    customerId: string;
    customerEmail: string;
    description?: string;
    consultationType: ConsultationType;
    customerInfo: CustomerInfo;
    appointmentDetails: AppointmentDetails;
}

export interface PaymentStatusResponse {
    status: PaymentStatus;
    details?: any;
}

export interface PaymentResponse {
    paymentId: string;
    clientSecret: string;
    status: string;
}

export interface RazorpayInitResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature?: string;
}