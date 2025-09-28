import { useState } from 'react';
import PaymentProcessor from '../components/PaymentProcessor';

const PaymentPage: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handlePayment = async () => {
        setIsProcessing(true);
        
        // Payment data will be passed to PaymentProcessor component

        try {
            // Show payment processor
            setIsProcessing(true);
        } catch (error) {
            console.error('Payment error:', error);
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center mb-8">Payment Page</h1>
                {!isProcessing ? (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-center text-gray-800">
                            Complete Your Payment
                        </h2>
                        <div className="p-4 bg-gray-100 rounded-md">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Amount:</span>
                                <span className="text-2xl font-bold text-gray-800">$10.00</span>
                            </div>
                        </div>
                        <button
                            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            onClick={handlePayment}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Pay Now'}
                        </button>
                    </div>
                ) : (
                    <PaymentProcessor 
                        paymentData={{
                            amount: 1000,
                            currency: 'USD',
                            customerId: 'customer_123',
                            customerEmail: 'customer@example.com',
                            description: 'Dental appointment payment',
                            consultationType: 'virtual',
                            customerInfo: {
                                name: 'John Doe',
                                email: 'customer@example.com',
                                phone: '+1234567890'
                            },
                            appointmentDetails: {
                                date: new Date().toISOString().split('T')[0],
                                time: '10:00 AM'
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default PaymentPage;