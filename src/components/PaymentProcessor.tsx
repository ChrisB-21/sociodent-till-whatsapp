import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PaymentData } from '../types/payment';

// Define PaymentStatusType
type PaymentStatusType = 'INITIALIZING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

interface PaymentProcessorProps {
    paymentData: PaymentData;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({ paymentData }) => {
    const [status, setStatus] = useState<PaymentStatusType>('INITIALIZING');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    
    useEffect(() => {
        initiatePayment();
    }, []);

    const initiatePayment = async () => {
        try {
            const response = await axios.post('/api/payment/init', paymentData);
            const { paymentId, clientSecret } = response.data;
            
            if (clientSecret) {
                setStatus('PROCESSING');
                startPolling(paymentId);
            }
        } catch (error) {
            handleError('Payment initialization failed');
        }
    };

    const startPolling = (paymentId: string) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get(`/api/payment/${paymentId}/status`);
                const { status } = response.data;

                setStatus(status);

                if (status === 'SUCCESS') {
                    clearInterval(pollInterval);
                    handleSuccess();
                } else if (status === 'FAILED' || status === 'CANCELLED') {
                    clearInterval(pollInterval);
                    handleError('Payment failed or was cancelled');
                }
            } catch (error) {
                clearInterval(pollInterval);
                handleError('Error checking payment status');
            }
        }, 2000); // Poll every 2 seconds

        // Clear interval after 5 minutes (timeout)
        setTimeout(() => {
            clearInterval(pollInterval);
            if (status === 'PROCESSING') {
                handleError('Payment timed out');
            }
        }, 5 * 60 * 1000);
    };

    const handleSuccess = () => {
        toast.success('Payment successful!');
        navigate('/payment/success');
    };

    const handleError = (message: string) => {
        setError(message);
        setStatus('FAILED');
        toast.error(message);
    };

    return (
        <div className="payment-processor">
            <div className="status-container">
                {status === 'INITIALIZING' && (
                    <div className="status-message">
                        <div className="spinner" />
                        <p>Initializing payment...</p>
                    </div>
                )}

                {status === 'PROCESSING' && (
                    <div className="status-message">
                        <div className="spinner" />
                        <p>Processing your payment...</p>
                        <p className="sub-text">Please don't close this window</p>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="status-message success">
                        <div className="check-mark" />
                        <p>Payment successful!</p>
                        <p className="sub-text">Redirecting...</p>
                    </div>
                )}

                {status === 'FAILED' && (
                    <div className="status-message error">
                        <div className="error-icon" />
                        <p>Payment failed</p>
                        <p className="error-text">{error}</p>
                        <button 
                            className="retry-button"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentProcessor;