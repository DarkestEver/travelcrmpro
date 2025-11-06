import { useState, useRef, useEffect } from 'react';
import { FiMapPin, FiX } from 'react-icons/fi';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const LocationInput = ({
  value,
  onChange,
  placeholder = 'Search for a location',
  className = '',
  label,
  required = false
}) => {
  const [inputValue, setInputValue] = useState(value?.name || value?.address || '');
  const [autocomplete, setAutocomplete] = useState(null);
  const inputRef = useRef(null);

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value?.name || value?.address || '');
  }, [value]);

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const locationData = {
          name: place.name || '',
          address: place.formatted_address || '',
          placeId: place.place_id || '',
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        };

        // Extract additional details
        const components = place.address_components || [];
        components.forEach(component => {
          const types = component.types;
          if (types.includes('locality')) {
            locationData.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            locationData.state = component.long_name;
          }
          if (types.includes('country')) {
            locationData.country = component.long_name;
          }
          if (types.includes('postal_code')) {
            locationData.postalCode = component.long_name;
          }
        });

        setInputValue(place.formatted_address);
        onChange(locationData);
      }
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // If user manually types without selecting from autocomplete
    if (!e.target.value) {
      onChange(null);
    }
  };

  // If Google Maps script fails to load or no API key
  if (loadError) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange({ address: e.target.value });
          }}
          placeholder={placeholder}
          className={className || 'input'}
          required={required}
        />
        <p className="text-xs text-amber-600 mt-1">
          Google Maps autocomplete unavailable. Using basic input.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          type="text"
          placeholder="Loading..."
          className={className || 'input'}
          disabled
        />
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <FiMapPin className="w-4 h-4" />
        </div>
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            types: ['geocode', 'establishment'],
            fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id']
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`pl-10 pr-10 ${className || 'input'}`}
            required={required}
          />
        </Autocomplete>
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
      {value?.coordinates && (
        <p className="text-xs text-gray-500 mt-1">
          📍 {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
};

export default LocationInput;
