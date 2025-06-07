// Custom hook for managing consultation booking workflow
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  consultationService, 
  ConsultationType, 
  PaymentMethod, 
  BookingFormData, 
  BookingResult 
} from '@/services/consultationService';
import { 
  paymentService, 
  PaymentData, 
  PaymentResult 
} from '@/services/paymentService';

export type BookingStep = 1 | 2 | 3;

export interface UseConsultationBookingProps {
  initialConsultationType?: ConsultationType;
}

export interface UseConsultationBookingReturn {
  // State
  step: BookingStep;
  consultationType: ConsultationType;
  paymentMethod: PaymentMethod;
  isProcessingPayment: boolean;
  showReportWarning: boolean;
  
  // Form data
  formData: BookingFormData;
  
  // Methods
  setStep: (step: BookingStep) => void;
  setConsultationType: (type: ConsultationType) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setFormData: (data: Partial<BookingFormData>) => void;
  setShowReportWarning: (show: boolean) => void;
  
  // Actions
  handleContinue: () => Promise<void>;
  handleBack: () => void;
  handleReturnHome: () => void;
  
  // Data
  consultationTypes: ReturnType<typeof consultationService.getConsultationTypes>;
  availableTimeSlots: string[];
  dateConstraints: ReturnType<typeof consultationService.getDateConstraints>;
  availablePaymentMethods: ReturnType<typeof paymentService.getAvailablePaymentMethods>;
  selectedConsultation: ReturnType<typeof consultationService.getConsultationByType>;
}

export const useConsultationBooking = ({
  initialConsultationType = 'virtual'
}: UseConsultationBookingProps = {}): UseConsultationBookingReturn => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [step, setStep] = useState<BookingStep>(1);
  const [consultationType, setConsultationType] = useState<ConsultationType>(initialConsultationType);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showReportWarning, setShowReportWarning] = useState(false);

  // Form data
  const [formData, setFormDataState] = useState<BookingFormData>({
    name: '',
    phone: localStorage.getItem('lastUsedPhone') || '',
    date: new Date().toISOString().split('T')[0],
    time: '9:00 AM',
    address: '',
    symptoms: '',
    hasReport: false,
    reportFile: null,
  });

  // Initialize payment SDK on mount
  useEffect(() => {
    paymentService.initializePaymentSDK();
  }, []);

  // Update form data
  const setFormData = (data: Partial<BookingFormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  };

  // Get consultation types and other data
  const consultationTypes = consultationService.getConsultationTypes();
  const availableTimeSlots = consultationService.getAvailableTimeSlots();
  const dateConstraints = consultationService.getDateConstraints();
  const availablePaymentMethods = paymentService.getAvailablePaymentMethods(consultationType);
  const selectedConsultation = consultationService.getConsultationByType(consultationType);

  // Handle Razorpay payment
  const handleRazorpayPayment = async (): Promise<boolean> => {
    try {
      setIsProcessingPayment(true);

      if (!selectedConsultation) {
        throw new Error('Invalid consultation type selected');
      }

      const paymentData: PaymentData = {
        amount: selectedConsultation.price,
        consultationType,
        customerInfo: {
          name: formData.name,
          email: '',
          phone: formData.phone,
        },
        appointmentDetails: {
          date: formData.date,
          time: formData.time,
          address: formData.address,
        },
      };

      const paymentResult: PaymentResult = await paymentService.processRazorpayPayment(paymentData);

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      return true;

    } catch (error: any) {
      console.error("Payment failed:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle appointment booking
  const handleBookingSubmission = async (paymentMethodToUse: PaymentMethod): Promise<boolean> => {
    try {
      const bookingResult: BookingResult = await consultationService.saveAppointment(
        formData,
        consultationType,
        paymentMethodToUse
      );

      if (!bookingResult.success) {
        throw new Error(bookingResult.error || 'Failed to save appointment');
      }

      const paymentMethodText = paymentMethodToUse === 'razorpay' ? 'Payment Successful' : 'Success!';
      const descriptionText = paymentMethodToUse === 'razorpay' 
        ? 'Your consultation has been booked successfully.'
        : 'Your appointment has been booked successfully.';

      toast({
        title: paymentMethodText,
        description: descriptionText,
      });

      return true;

    } catch (error: any) {
      console.error("Booking failed:", error);
      const errorTitle = paymentMethodToUse === 'razorpay' ? 'Payment Failed' : 'Error';
      const errorDescription = paymentMethodToUse === 'razorpay'
        ? 'There was an error processing your payment. Please try again.'
        : 'There was an error booking your appointment. Please try again.';

      toast({
        title: errorTitle,
        description: error.message || errorDescription,
        variant: "destructive",
      });

      return false;
    }
  };

  // Handle continue button click
  const handleContinue = async () => {
    if (step === 1) {
      // Validate form
      const validation = consultationService.validateBookingForm(formData, consultationType);
      
      if (!validation.isValid) {
        toast({
          title: "Missing Information",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      // Check if report is ticked but not uploaded
      if (formData.hasReport && !formData.reportFile) {
        setShowReportWarning(true);
        return;
      }

      setStep(2);

    } else if (step === 2) {
      let success = false;

      if (paymentMethod === 'razorpay') {
        // Process payment first, then save appointment
        const paymentSuccess = await handleRazorpayPayment();
        if (paymentSuccess) {
          success = await handleBookingSubmission('razorpay');
        }
      } else {
        // Save appointment directly for cash payment
        success = await handleBookingSubmission('cash');
      }

      if (success) {
        setStep(3);
      }

    } else {
      // Step 3 - Return to home
      navigate('/');
    }
  };

  // Handle back button
  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as BookingStep);
    }
  };

  // Handle return to home
  const handleReturnHome = () => {
    navigate('/');
  };

  return {
    // State
    step,
    consultationType,
    paymentMethod,
    isProcessingPayment,
    showReportWarning,
    
    // Form data
    formData,
    
    // Methods
    setStep,
    setConsultationType,
    setPaymentMethod,
    setFormData,
    setShowReportWarning,
    
    // Actions
    handleContinue,
    handleBack,
    handleReturnHome,
    
    // Data
    consultationTypes,
    availableTimeSlots,
    dateConstraints,
    availablePaymentMethods,
    selectedConsultation,
  };
};
