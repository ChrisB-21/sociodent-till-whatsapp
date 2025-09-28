export type ConsultationType = 'virtual' | 'home' | 'clinic';

export interface AppointmentDetails {
    date: string;
    time: string;
    address?: string;
}

export interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
}