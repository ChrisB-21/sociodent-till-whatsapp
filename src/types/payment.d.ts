export type ConsultationType = 'virtual' | 'home' | 'clinic';

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
    consultationType: ConsultationType;
    customerInfo: CustomerInfo;
    appointmentDetails: AppointmentDetails;
}

export interface PaymentResult {
    success: boolean;
    paymentId?: string;
    orderId?: string;
    error?: string;
}