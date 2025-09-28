// Custom hook for managing consultation booking workflow
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  consultationService,
  type ConsultationType, 
  type BookingFormData, 
  type BookingResult,
  type ConsultationOption 
} from '@/services/consultationService';

export type BookingStep = 1 | 2 | 3;

export interface UseConsultationBookingProps {
  initialConsultationType?: ConsultationType;
  rescheduleAppointmentId?: string | null;
}

export interface UseConsultationBookingReturn {
  // State
  step: BookingStep;
  consultationType: ConsultationType;
  showReportWarning: boolean;
  hasIncompleteAppointments: boolean;
  incompleteAppointments: any[];
  isCheckingAppointments: boolean;
  paymentMethod: string;
  isProcessingPayment: boolean;
  
  // Form data
  formData: BookingFormData;
  availablePaymentMethods: { id: string; name: string; available: boolean; }[];
  
  // Methods
  setStep: (step: BookingStep) => void;
  setConsultationType: (type: ConsultationType) => void;
  setFormData: (data: Partial<BookingFormData>) => void;
  setShowReportWarning: (show: boolean) => void;
  setPaymentMethod: (method: 'razorpay' | 'cash') => void;
  
  // Actions
  handleContinue: () => Promise<void>;
  handleBack: () => void;
  handleReturnHome: () => void;
  
  // Data
  consultationTypes: ConsultationOption[];
  availableTimeSlots: string[];
  dateConstraints: { minDate: string; maxDate: string };
  selectedConsultation?: ConsultationOption;
}

export const useConsultationBooking = ({
  initialConsultationType = 'virtual',
  rescheduleAppointmentId = null
}: UseConsultationBookingProps = {}): UseConsultationBookingReturn => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [step, setStep] = useState<BookingStep>(1);
  const [consultationType, setConsultationType] = useState<ConsultationType>(initialConsultationType);
  const [showReportWarning, setShowReportWarning] = useState(false);
  const [hasIncompleteAppointments, setHasIncompleteAppointments] = useState(false);
  const [incompleteAppointments, setIncompleteAppointments] = useState<any[]>([]);
  const [isCheckingAppointments, setIsCheckingAppointments] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cash'>('razorpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Determine if this is a reschedule (which should bypass incomplete appointment blocking)
  const isReschedule = Boolean(rescheduleAppointmentId);

  // Form data
  const [formData, setFormDataState] = useState<BookingFormData>({
    name: '',
    phone: localStorage.getItem('lastUsedPhone') || '',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    time: '9:00 AM',
    address: '',
    symptoms: '',
    hasReport: false,
    reportFile: null,
  });

  // No payment initialization needed
  // Check for incomplete appointments on mount (skip if reschedule)
  useEffect(() => {
    const checkIncompleteAppointments = async () => {
      try {
        setIsCheckingAppointments(true);
        
        // Skip incomplete appointment check if this is a reschedule
        if (isReschedule) {
          setHasIncompleteAppointments(false);
          setIncompleteAppointments([]);
          return;
        }
        
        const result = await consultationService.hasIncompleteAppointments();
        setHasIncompleteAppointments(result.hasIncomplete);
        setIncompleteAppointments(result.appointments || []);
      } catch (error) {
        console.error('Error checking incomplete appointments:', error);
        // Don't block user if check fails
        setHasIncompleteAppointments(false);
        setIncompleteAppointments([]);
      } finally {
        setIsCheckingAppointments(false);
      }
    };

    checkIncompleteAppointments();
  }, [isReschedule]);

  // Update form data
  const setFormData = (data: Partial<BookingFormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  };

  // Get consultation types and other data
  const consultationTypes = consultationService.getConsultationTypes();
  // Pass selected date to getAvailableTimeSlots for dynamic filtering
  const availableTimeSlots = consultationService.getAvailableTimeSlots(formData.date);
  const dateConstraints = consultationService.getDateConstraints();
  const selectedConsultation = consultationService.getConsultationByType(consultationType);

  // Handle appointment booking
  const handleBookingSubmission = async (): Promise<boolean> => {
    try {
      // Double-check for incomplete appointments before booking (skip if reschedule)
      if (!isReschedule) {
        const incompleteCheck = await consultationService.hasIncompleteAppointments();
        if (incompleteCheck.hasIncomplete) {
          throw new Error('You cannot book a new appointment while you have pending appointments. Please complete or cancel your existing appointments first.');
        }
      }

      const bookingResult: BookingResult = await consultationService.saveAppointment(
        formData,
        consultationType,
        rescheduleAppointmentId || undefined
      );

      if (!bookingResult.success) {
        throw new Error(bookingResult.error || 'Failed to save appointment');
      }

      toast({
        title: 'Success!',
        description: 'Your appointment has been booked successfully.',
      });

      return true;

    } catch (error: any) {
      console.error("Booking failed:", error);
      toast({
        title: 'Error',
        description: error.message || 'There was an error booking your appointment. Please try again.',
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
      setIsProcessingPayment(true);
      try {
        const success = await handleBookingSubmission();
        if (success) {
          setStep(3);
        }
      } finally {
        setIsProcessingPayment(false);
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

  const availablePaymentMethods = [
    {
      id: 'razorpay',
      name: 'Online Payment (Card/UPI/Netbanking)',
      available: true
    },
    {
      id: 'cash',
      name: 'Cash Payment',
      available: consultationType !== 'virtual'
    }
  ];

  return {
    // State
    step,
    consultationType,
    showReportWarning,
    hasIncompleteAppointments,
    incompleteAppointments,
    isCheckingAppointments,
    paymentMethod,
    isProcessingPayment,
    
    // Form data
    formData,
    
    // Methods
    setStep,
    setConsultationType,
    setFormData,
    setShowReportWarning,
    setPaymentMethod,
    
    // Actions
    handleContinue,
    handleBack,
    handleReturnHome,
    
    // Data
    consultationTypes,
    availableTimeSlots,
    dateConstraints,
    selectedConsultation,
    availablePaymentMethods,
  };
};
