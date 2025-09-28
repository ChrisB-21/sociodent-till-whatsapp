import React, { useState, useCallback } from 'react';
import MapboxAutocomplete from '@/components/ui/mapbox-autocomplete';

interface LocationComponents {
  state: string;
  city: string;
  district?: string;
  locality?: string;
  area?: string;
  pincode?: string;
}

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

interface LocationAutocompleteProps {
  onLocationChange: (components: LocationComponents) => void;
  initialState?: string;
  initialCity?: string;
  errors?: {
    state?: string;
    city?: string;
  };
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  onLocationChange,
  initialState = '',
  initialCity = '',
  errors = {}
}) => {
  const [stateValue, setStateValue] = useState(initialState);
  const [cityValue, setCityValue] = useState(initialCity);

  // Extract location components from Mapbox feature
  const extractLocationComponents = (feature: MapboxFeature): LocationComponents => {
    const components: LocationComponents = {
      state: '',
      city: '',
      district: '',
      locality: '',
      area: '',
      pincode: ''
    };

    // Get the main text (could be city, area, etc.)
    const mainText = feature.text;
    const placeTypes = feature.place_type || [];

    // Set the main location based on place type
    if (placeTypes.includes('region')) {
      components.state = mainText;
    } else if (placeTypes.includes('place') || placeTypes.includes('municipality')) {
      components.city = mainText;
    } else if (placeTypes.includes('locality') || placeTypes.includes('neighborhood')) {
      components.locality = mainText;
    } else if (placeTypes.includes('district')) {
      components.district = mainText;
    }

    // Extract context information
    if (feature.context) {
      feature.context.forEach((ctx) => {
        const ctxId = ctx.id.toLowerCase();
        
        if (ctxId.includes('region') && !components.state) {
          components.state = ctx.text;
        } else if (ctxId.includes('district') && !components.district) {
          components.district = ctx.text;
        } else if (ctxId.includes('place') && !components.city) {
          components.city = ctx.text;
        } else if (ctxId.includes('locality') && !components.locality) {
          components.locality = ctx.text;
        } else if (ctxId.includes('neighborhood') && !components.area) {
          components.area = ctx.text;
        } else if (ctxId.includes('postcode')) {
          components.pincode = ctx.text;
        }
      });
    }

    // If we still don't have a city but have a district/locality, use those
    if (!components.city && components.district) {
      components.city = components.district;
    }

    return components;
  };

  const handleStateSelection = useCallback((value: string, feature?: MapboxFeature) => {
    setStateValue(value);
    setCityValue(''); // Reset city when state changes

    if (feature) {
      const components = extractLocationComponents(feature);
      onLocationChange({
        state: components.state || value,
        city: '', // Reset city
        district: components.district,
        locality: components.locality,
        area: components.area,
        pincode: components.pincode
      });
    } else {
      onLocationChange({
        state: value,
        city: '',
        district: '',
        locality: '',
        area: '',
        pincode: ''
      });
    }
  }, [onLocationChange]);

  const handleCitySelection = useCallback((value: string, feature?: MapboxFeature) => {
    setCityValue(value);

    if (feature) {
      const components = extractLocationComponents(feature);
      onLocationChange({
        state: stateValue || components.state,
        city: components.city || value,
        district: components.district,
        locality: components.locality,
        area: components.area,
        pincode: components.pincode
      });
    } else {
      onLocationChange({
        state: stateValue,
        city: value,
        district: '',
        locality: '',
        area: '',
        pincode: ''
      });
    }
  }, [stateValue, onLocationChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MapboxAutocomplete
        label="State"
        placeholder="Type state name (e.g., Tamil Nadu)"
        value={stateValue}
        onChange={handleStateSelection}
        error={errors.state}
        required
        types={['region', 'place']}
        country="IN"
        className="w-full"
      />
      
      <MapboxAutocomplete
        label="City"
        placeholder={stateValue ? "Type city name (e.g., Chennai)" : "Select state first"}
        value={cityValue}
        onChange={handleCitySelection}
        error={errors.city}
        required
        types={['place', 'locality', 'district']}
        country="IN"
        disabled={!stateValue}
        className="w-full"
      />
    </div>
  );
};

export default LocationAutocomplete;