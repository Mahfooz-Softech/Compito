import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddressData {
  formattedAddress: string;
  streetNumber: string;
  route: string;
  locality: string;
  administrativeAreaLevel1: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

interface ServiceAddressSelectorProps {
  onAddressSelect: (address: AddressData) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const ServiceAddressSelector: React.FC<ServiceAddressSelectorProps> = ({
  onAddressSelect,
  placeholder = 'Start typing your address...',
  label = 'Search Address',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ description: string; place_id: string; types?: string[] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  // Google services
  const autoServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);

  // Load Google Maps JS
  useEffect(() => {
    if (!window.google) {
      const present = document.querySelector('script[src*="maps.googleapis.com"]');
      if (!present) {
        const script = document.createElement('script');
        script.src =
          'https://maps.googleapis.com/maps/api/js?key=AIzaSyD8JJIEpeczXM2TxfdR-RuGG3-AKNDC-4U&libraries=places&callback=initGoogleMaps&loading=async';
        script.async = true;
        script.defer = true;
        window.initGoogleMaps = () => setIsApiLoaded(true);
        document.head.appendChild(script);
      }
    } else {
      setIsApiLoaded(true);
    }
  }, []);

  // Init services when API loaded
  useEffect(() => {
    if (!isApiLoaded || !window.google) return;
    autoServiceRef.current = new window.google.maps.places.AutocompleteService();
    placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    setError(null);
  }, [isApiLoaded]);

  // Outside click closes suggestions
  useEffect(() => {
    function handleDocMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleDocMouseDown);
    return () => document.removeEventListener('mousedown', handleDocMouseDown);
  }, []);

  const extractAddressData = (place: any): AddressData => {
    const addressComponents = place.address_components || [];
    const data: AddressData = {
      formattedAddress: place.formatted_address || '',
      streetNumber: '',
      route: '',
      locality: '',
      administrativeAreaLevel1: '',
      country: '',
      postalCode: '',
      latitude: place.geometry?.location?.lat?.() ?? 0,
      longitude: place.geometry?.location?.lng?.() ?? 0,
      placeId: place.place_id || '',
    };

    for (const comp of addressComponents) {
      const types = comp.types as string[];
      if (types.includes('street_number')) data.streetNumber = comp.long_name;
      else if (types.includes('route')) data.route = comp.long_name;
      else if (types.includes('locality')) data.locality = comp.long_name;
      else if (types.includes('administrative_area_level_1')) data.administrativeAreaLevel1 = comp.long_name;
      else if (types.includes('country')) data.country = comp.long_name;
      else if (types.includes('postal_code')) data.postalCode = comp.long_name;
    }
    return data;
  };

  const fetchSuggestions = (query: string) => {
    if (!autoServiceRef.current || !window.google || query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Reset session token periodically for billing grouping/best results
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }

    autoServiceRef.current.getPlacePredictions(
      {
        input: query,
        // Prefer GB results; V2 uses string, V3 can accept array
        componentRestrictions: { country: 'gb' },
        // types: ['geocode'] // Generally safest; postal_code filter handled below
        sessionToken: sessionTokenRef.current,
      },
      (preds: any[], status: any) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !preds) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        // Prefer postal code results if present (UK format heuristic + types)
        const ukPostcodeRegex = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;
        const preferred = preds.filter(
          (p) => (p.types && p.types.includes('postal_code')) || ukPostcodeRegex.test(p.description)
        );
        const list = preferred.length > 0 ? preferred : preds;

        setSuggestions(list.map((p) => ({ description: p.description, place_id: p.place_id, types: p.types })));
        setShowSuggestions(true);
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    setSelectedAddress(null);

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(v), 250);
  };

  const clearSelection = () => {
    setSelectedAddress(null);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    // start a new session for fresh predictions
    if (window.google) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  };

  const handleSuggestionPick = (placeId: string) => {
    if (!placesServiceRef.current) return;
    setLoading(true);
    setError(null);

    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: ['formatted_address', 'address_components', 'geometry', 'place_id'],
        sessionToken: sessionTokenRef.current,
      },
      (place: any, status: any) => {
        setLoading(false);
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
          setError('Failed to fetch place details. Please try another selection.');
          return;
        }
        const addressData = extractAddressData(place);
        setSelectedAddress(addressData);
        setInputValue(addressData.formattedAddress);
        setShowSuggestions(false);
        onAddressSelect(addressData);

        // refresh session for next search
        if (window.google) {
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
      }
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Label htmlFor="address-input" className="text-base font-medium mb-2 block">
        {label}
      </Label>

      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className="w-full pr-10"
          autoComplete="off"
        />

        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            aria-label="Clear"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>

      {/* Suggestions */}
    {/* Suggestions */}
{showSuggestions && suggestions.length > 0 && (
  <div
    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
    // Prevent blur from killing selection
    onMouseDownCapture={(e) => e.preventDefault()}
  >
    <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b">
      {suggestions.length} suggestion{suggestions.length > 1 ? "s" : ""}
    </div>

    {suggestions.map((s) => (
      <div
        key={s.place_id}
        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
        onMouseDown={() => handleSuggestionPick(s.place_id)}
        role="option"
      >
        <div className="flex items-center space-x-3">
          <MapPin className="h-4 w-4 text-[#751BE9] flex-shrink-0" />
          <p className="text-sm font-medium text-gray-900 truncate">
            {s.description}
          </p>
        </div>
      </div>
    ))}
  </div>
)}


      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md mt-2">{error}</div>}

      {/* Selected address summary */}
      {selectedAddress && (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span className="text-base font-semibold text-green-800">Selected Address</span>
            </div>

            <div className="pl-7">
              <p className="text-lg font-medium text-green-900 mb-2">{selectedAddress.formattedAddress}</p>
              <div className="space-y-1">
                {selectedAddress.administrativeAreaLevel1 && (
                  <p className="text-sm text-green-700">{selectedAddress.administrativeAreaLevel1}</p>
                )}
                {selectedAddress.postalCode && (
                  <p className="text-sm text-green-700">Postcode: {selectedAddress.postalCode}</p>
                )}
                {selectedAddress.country && <p className="text-sm text-green-700">{selectedAddress.country}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceAddressSelector;
