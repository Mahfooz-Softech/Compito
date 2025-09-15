import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, X, CheckCircle, Loader2 } from 'lucide-react';

interface GoogleMapsAutocompleteProps {
  onAddressSelect: (address: AddressData) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  showMap?: boolean;
}

export interface AddressData {
  formattedAddress: string;
  streetNumber?: string;
  route?: string;
  locality?: string; // city
  administrativeAreaLevel1?: string; // state/county
  country?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export const GoogleMapsAutocomplete: React.FC<GoogleMapsAutocompleteProps> = ({
  onAddressSelect,
  placeholder = "Enter postcode",
  label = "Address",
  className = "",
  showMap = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  // Load Google Maps API with proper async loading
  useEffect(() => {
    if (!window.google) {
      loadGoogleMapsAPI();
    } else {
      setIsApiLoaded(true);
      initializeAutocomplete();
    }
  }, []);

  // Initialize autocomplete when API is loaded
  useEffect(() => {
    if (isApiLoaded && inputRef.current) {
      initializeAutocomplete();
    }
  }, [isApiLoaded]);

  const loadGoogleMapsAPI = () => {
    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const script = document.createElement('script');
    // Note: Using legacy Autocomplete API for now due to PlaceAutocompleteElement compatibility issues
    // This will show a deprecation warning but provides reliable functionality
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD8JJIEpeczXM2TxfdR-RuGG3-AKNDC-4U&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    
    window.initGoogleMaps = () => {
      setIsApiLoaded(true);
    };
    
    document.head.appendChild(script);
  };

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google) return;

    try {
      // Initialize map if showMap is true
      if (showMap && mapRef.current) {
        const newMap = new window.google.maps.Map(mapRef.current, {
          center: { lat: 51.5074, lng: -0.1278 }, // London center
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        setMap(newMap);

        // Create marker
        const newMarker = new window.google.maps.Marker({
          map: newMap,
          anchorPoint: new window.google.maps.Point(0, -29),
        });
        setMarker(newMarker);
      }

      // Use legacy Autocomplete for now as it's more reliable
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: [
          'formatted_address',
          'address_components',
          'geometry',
          'place_id'
        ],
        types: ['postal_code'],
        componentRestrictions: { country: 'GB' }, // Restrict to UK
      });

      // Add place_changed listener
      autocomplete.addListener('place_changed', () => {
        handlePlaceChanged(autocomplete);
      });

      setAutocomplete(autocomplete);
      setError(null);
    } catch (err) {
      console.error('Error initializing Google Maps:', err);
      setError('Failed to initialize Google Maps. Please refresh the page.');
    }
  };

  const handlePlaceChanged = (autocompleteInstance: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const place = autocompleteInstance.getPlace();

      if (!place.geometry || !place.geometry.location) {
        setError('No location details available for this address. Please try another address.');
        setIsLoading(false);
        return;
      }

      // Parse address components
      const addressData = parseAddressComponents(place);
      
      // Add coordinates
      addressData.latitude = place.geometry.location.lat();
      addressData.longitude = place.geometry.location.lng();
      addressData.placeId = place.place_id;

      setSelectedAddress(addressData);

      // Update map if showing
      if (map && marker) {
        const location = place.geometry.location;
        
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(location);
          map.setZoom(17);
        }
        
        marker.setPosition(location);
        marker.setVisible(true);
      }

      // Call the callback
      console.log('🔍 Calling onAddressSelect with:', addressData);
      onAddressSelect(addressData);
      
    } catch (err) {
      console.error('Error handling place change:', err);
      setError('Error processing address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const parseAddressComponents = (place: any): AddressData => {
    const addressComponents = place.address_components || [];
    const addressData: AddressData = {
      formattedAddress: place.formatted_address || '',
      streetNumber: '',
      route: '',
      locality: '',
      administrativeAreaLevel1: '',
      country: '',
      postalCode: '',
      latitude: 0,
      longitude: 0,
      placeId: ''
    };

    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('street_number')) {
        addressData.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        addressData.route = component.long_name;
      } else if (types.includes('locality')) {
        addressData.locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressData.administrativeAreaLevel1 = component.long_name;
      } else if (types.includes('country')) {
        addressData.country = component.long_name;
      } else if (types.includes('postal_code')) {
        addressData.postalCode = component.long_name;
      }
    }

    return addressData;
  };

  const clearSelection = () => {
    setSelectedAddress(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (marker) {
      marker.setVisible(false);
    }
    if (map) {
      map.setCenter({ lat: 51.5074, lng: -0.1278 });
      map.setZoom(10);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedAddress) {
      setSelectedAddress(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <Label htmlFor="address-input">{label}</Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          placeholder={placeholder}
          onChange={handleInputChange}
          className="pr-10"
          disabled={isLoading || !isApiLoaded}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {!isApiLoaded && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-pulse text-muted-foreground" />
          </div>
        )}
        
        {selectedAddress && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}

      {selectedAddress && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Selected Address
                  </Badge>
                </div>
                <p className="text-sm font-medium text-green-800 mb-1">
                  {selectedAddress.formattedAddress}
                </p>
                <div className="text-xs text-green-700 space-y-1">
                  {selectedAddress.streetNumber && selectedAddress.route && (
                    <p>{selectedAddress.streetNumber} {selectedAddress.route}</p>
                  )}
                  {selectedAddress.locality && (
                    <p>{selectedAddress.locality}</p>
                  )}
                  {selectedAddress.administrativeAreaLevel1 && (
                    <p>{selectedAddress.administrativeAreaLevel1}</p>
                  )}
                  {selectedAddress.postalCode && (
                    <p>Postcode: {selectedAddress.postalCode}</p>
                  )}
                  {selectedAddress.country && (
                    <p>{selectedAddress.country}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showMap && mapRef.current && (
        <div className="border rounded-md overflow-hidden">
          <div 
            ref={mapRef} 
            className="w-full h-64"
            style={{ minHeight: '256px' }}
          />
        </div>
      )}
    </div>
  );
};