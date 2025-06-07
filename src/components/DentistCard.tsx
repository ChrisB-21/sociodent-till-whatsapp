import React from 'react';
import { Star, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DentistCardProps {
  id: string;
  name: string;
  specialty: string;
  rating?: number;
  reviewCount?: number;
  location: string;
  availability: string;
  image: string;
  price: number;
  className?: string;
}

const DentistCard = ({
  id,
  name,
  specialty,
  rating,
  reviewCount,
  location,
  availability,
  image,
  price,
  className
}: DentistCardProps) => {
  return (
    <div 
      className={cn(
        "glass-card rounded-2xl overflow-hidden card-hover transition-all duration-300",
        className
      )}
    >
      <div className="relative aspect-[4/3]">
        <img 
          src={image} 
          alt={`Dr. ${name}`} 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={e => { e.currentTarget.src = "/doc-img/placeholder.svg"; }}
        />
        {rating !== undefined && reviewCount !== undefined && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Star className="text-yellow-400 w-4 h-4 mr-1" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-gray-500 text-xs ml-1">({reviewCount})</span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-900">Dr. {name}</h3>
        <p className="text-sociodent-600 text-sm mb-3">{specialty}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span>{location}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>{availability}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="block text-gray-500 text-xs">Starting at</span>
            <span className="font-semibold text-gray-900">₹{price}</span>
          </div>
          <Link 
            to={`/consultation/${id}`}
            className="button-primary py-2 px-4 text-sm"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DentistCard;
