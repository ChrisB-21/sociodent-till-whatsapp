
import { Calendar, Clock, MapPin, Video, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  id: string;
  dentistName: string;
  dentistImage: string;
  date: string;
  time: string;
  type: 'virtual' | 'home' | 'clinic';
  location?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  className?: string;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
}

const AppointmentCard = ({
  id,
  dentistName,
  dentistImage,
  date,
  time,
  type,
  location,
  status,
  className,
  onCancel,
  isCancelling
}: AppointmentCardProps) => {
  // Status styling
  const statusStyles = {
    upcoming: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  
  // Type icon
  const TypeIcon = type === 'virtual' 
    ? Video 
    : type === 'home' 
      ? Home 
      : MapPin;
  
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className={cn(
      "glass-card rounded-xl p-5 border border-gray-100",
      className
    )}>
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
          <img 
            src={dentistImage} 
            alt={dentistName} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Dr. {dentistName}</h3>
          <div className="flex items-center mt-1">
            <TypeIcon className="w-4 h-4 mr-1 text-sociodent-500" />
            <span className="text-sm text-gray-600 capitalize">
              {type} Consultation
            </span>
          </div>
        </div>
        <div className={cn(
          "ml-auto text-xs px-2 py-1 rounded-full",
          statusStyles[status]
        )}>
          {formatStatus(status)}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
          <Calendar className="w-4 h-4 mr-2 text-sociodent-500" />
          <span>{date}</span>
        </div>
        <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4 mr-2 text-sociodent-500" />
          <span>{time}</span>
        </div>
        {location && type !== 'virtual' && (
          <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
            <MapPin className="w-4 h-4 mr-2 text-sociodent-500" />
            <span>{location}</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between pt-3 border-t border-gray-100">
        {status === 'upcoming' && (
          <>
            <button 
              className="button-destructive py-1.5 px-3 text-sm"
              onClick={() => onCancel?.(id)}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelling...
                </span>
              ) : (
                'Cancel Appointment'
              )}
            </button>
            {type === 'virtual' && !isCancelling && (
              <button className="button-primary py-1.5 px-3 text-sm">
                Join Call
              </button>
            )}
            {type !== 'virtual' && !isCancelling && (
              <button className="button-primary py-1.5 px-3 text-sm">
                Get Directions
              </button>
            )}
          </>
        )}
        
        {status === 'completed' && (
          <>
            <button className="button-secondary py-1.5 px-3 text-sm">
              Book Again
            </button>
            <button className="button-primary py-1.5 px-3 text-sm">
              Leave Review
            </button>
          </>
        )}
        
        {status === 'cancelled' && (
          <button className="button-primary py-1.5 px-3 text-sm w-full">
            Book New Appointment
          </button>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
