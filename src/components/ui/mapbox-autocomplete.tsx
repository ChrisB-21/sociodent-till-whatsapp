import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapbox types
interface MapboxFeature {
  id: string;
  type: string;
  place_name: string;
  relevance: number;
  properties: {
    accuracy?: string;
    category?: string;
    maki?: string;
    wikidata?: string;
    short_code?: string;
  };
  text: string;
  place_type: string[];
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  address?: string;
  context?: Array<{
    id: string;
    mapbox_id: string;
    text: string;
    wikidata?: string;
    short_code?: string;
  }>;
}

interface MapboxGeocodeResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

interface MapboxAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string, feature?: MapboxFeature) => void;
  onFeatureSelect?: (feature: MapboxFeature) => void;
  error?: string;
  required?: boolean;
  country?: string;
  types?: string[];
  className?: string;
  disabled?: boolean;
}

const MapboxAutocomplete: React.FC<MapboxAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onFeatureSelect,
  error,
  required = false,
  country = 'IN', // Default to India
  types = ['place', 'locality', 'neighborhood', 'address'],
  className,
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mapbox access token from environment variables
  const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoicmFtMjAwNCIsImEiOiJjbWVpNHhjcWYwM3Q2MnFzamx0Y3AzOTZkIn0.0EKgQygpJL5PS_fdr9J1iA';

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced search function
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Construct Mapbox Geocoding API URL
      const baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
      const encodedQuery = encodeURIComponent(query);
      
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        country: country,
        types: types.join(','),
        limit: '8',
        autocomplete: 'true',
        fuzzyMatch: 'true'
      });

      const url = `${baseUrl}/${encodedQuery}.json?${params}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: MapboxGeocodeResponse = await response.json();
      
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (feature: MapboxFeature) => {
    // Use the short name (feature.text) instead of the full place_name
    const shortName = feature.text || feature.place_name;
    setInputValue(shortName);
    onChange(shortName, feature);
    
    if (onFeatureSelect) {
      onFeatureSelect(feature);
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);



  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Label htmlFor={`mapbox-${label}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
          <Input
            ref={inputRef}
            id={`mapbox-${label}`}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "pl-10 pr-10",
              error && "border-red-500",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
            autoComplete="off"
          />
          
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {suggestions.map((feature) => (
              <div
                key={feature.id}
                onClick={() => handleSuggestionClick(feature)}
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                          {feature.text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                          {feature.place_name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default MapboxAutocomplete;