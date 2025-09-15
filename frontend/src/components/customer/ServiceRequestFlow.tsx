import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressData } from '@/components/ui/GoogleMapsAutocomplete';
import { AvailableWorkers } from '@/components/customer/AvailableWorkers';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useWorkerLocationSearch } from '@/hooks/useWorkerLocationSearch';
import { WorkerLocationResults } from '@/components/customer/WorkerLocationResults';
import ServiceAddressSelector from './ServiceAddressSelector';
import { WorkingDatePicker } from '@/components/ui/WorkingDatePicker';

import { 
  MapPin, 
  Clock, 
  Star, 
  DollarSign, 
  Send, 
  Filter,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Target,
  Info,
  Search,
  Home,
  Navigation
} from 'lucide-react';

interface ServiceRequestFlowProps {
  selectedService: {
    id: string;
    title: string;
    price_min?: number;
    price_max?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface WorkerData {
  id: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  rating: number;
  total_reviews: number;
  hourly_rate: number;
  bio: string;
  is_online: boolean;
  is_available: boolean;
  distance?: number;
  services: Array<{
    id: string;
    title: string;
    price_min: number;
    price_max: number;
  }>;
}

export const ServiceRequestFlow = ({ selectedService, isOpen, onClose }: ServiceRequestFlowProps) => {
  const { toast } = useToast();
  const { 
    workers, 
    loading: workersLoading, 
    error: workersError, 
    searchWorkers, 
    workerCounts,
    clearResults 
  } = useWorkerLocationSearch();
  
  const [step, setStep] = useState(1); // 1: Location, 2: Worker List, 3: Contact Workers
  const [location, setLocation] = useState({
    type: 'google', // 'google', 'current', 'profile'
    address: '',
    postcode: '',
    latitude: null as number | null,
    longitude: null as number | null
  });
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [serviceDetails, setServiceDetails] = useState({
    preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to tomorrow
    budget: { min: selectedService?.price_min || 50, max: selectedService?.price_max || 200 },
    description: ''
  });
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestMessages, setRequestMessages] = useState<{[workerId: string]: string}>({});

  const getCurrentLocation = () => {
    console.log('[SRF] getCurrentLocation: start');
    setLoading(true);
  
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser. Please enter your address manually.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('[SRF] geolocation success', { lat, lng });
  
        try {
          // Use Google Maps Places API (New) to get address from coordinates
          const response = await fetch(
            `https://places.googleapis.com/v1/places:searchNearby?key=AIzaSyD8JJIEpeczXM2TxfdR-RuGG3-AKNDC-4U`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-FieldMask': 'places.displayName,places.types,places.addressComponents'
              },
              body: JSON.stringify({
                locationRestriction: {
                  circle: {
                    center: {
                      latitude: lat,
                      longitude: lng
                    },
                    radius: 100.0 // 100m radius for precise location
                  }
                },
                languageCode: 'en',
                regionCode: 'GB'
              })
            }
          );
          
          const data = await response.json();
          console.log('[SRF] places nearby response', data);
          
          if (data.places && data.places.length > 0) {
            const place = data.places[0];
            const address = place.displayName?.text || `(${lat.toFixed(6)}, ${lng.toFixed(6)})`;
            
            // Extract postcode from address components if available
            let postcode = '';
            if (place.addressComponents) {
              for (const component of place.addressComponents) {
                if (component.types && component.types.includes('postal_code')) {
                  postcode = component.longText || '';
                  break;
                }
              }
            }
    
            setLocation({
              type: "current",
              address,
              postcode,
              latitude: lat,
              longitude: lng
            });
            console.log('[SRF] location set (current)', { address, postcode, lat, lng });
    
            // Search for workers at current location
            const searchLocation = {
              latitude: lat,
              longitude: lng,
              formattedAddress: address,
              postcode: postcode
            };
            console.log('[SRF] searchWorkers (current)', searchLocation);
            searchWorkers(searchLocation, 10);
    
            toast({
              title: "Location Set",
              description: `Current location: ${address}`,
            });
          } else {
            setLocation(prev => ({
              ...prev,
              type: "current",
              address: `(${lat.toFixed(6)}, ${lng.toFixed(6)})`,
              postcode: '',
              latitude: lat,
              longitude: lng
            }));
            console.log('[SRF] location set (current fallback)', { lat, lng });
            
            // Search for workers at current location (fallback)
            const fallbackSearchLocation = {
              latitude: lat,
              longitude: lng,
              formattedAddress: `(${lat.toFixed(6)}, ${lng.toFixed(6)})`,
              postcode: ''
            };
            console.log('[SRF] searchWorkers (current fallback)', fallbackSearchLocation);
            searchWorkers(fallbackSearchLocation, 10);
            
            toast({
              title: "Location Set (fallback)",
              description: `Coordinates only: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            });
          }
        } catch (error) {
          console.error('[SRF] geocoding failed', error);
          setLocation(prev => ({
            ...prev,
            type: "current",
            address: `(${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            postcode: '',
            latitude: lat,
            longitude: lng
          }));
          console.log('[SRF] location set (error fallback)', { lat, lng });
          
          // Search for workers at current location (error fallback)
          const errorFallbackSearchLocation = {
            latitude: lat,
            longitude: lng,
            formattedAddress: `(${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            postcode: ''
          };
          console.log('[SRF] searchWorkers (error fallback)', errorFallbackSearchLocation);
          searchWorkers(errorFallbackSearchLocation, 10);
          
          toast({
            title: "Location Set (fallback)",
            description: `Coordinates only: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          });
        }
  
        setLoading(false);
      },
      (error) => {
        console.error('[SRF] geolocation error', error);
  
        let message = "Could not get current location.";
        if (error.code === error.PERMISSION_DENIED)
          message = "Permission denied. Please allow location access.";
        if (error.code === error.POSITION_UNAVAILABLE)
          message = "Location unavailable. Try again later.";
        if (error.code === error.TIMEOUT)
          message = "Location request timed out.";
  
        toast({ title: "Error", description: message, variant: "destructive" });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const getProfileAddress = async () => {
    console.log('[SRF] getProfileAddress: start');
    try {
      // Use Laravel API profile (must be authenticated with Bearer token)
      const { data, error } = await apiClient.getProfile();
      if (error) {
        console.warn('[SRF] /auth/profile error', error);
      }
      const prof = data?.profile || null;
      const rawLat = prof?.latitude;
      const rawLng = prof?.longitude;
      const postcode = prof?.postcode ?? '';
      const latitude = rawLat != null ? Number(rawLat) : null;
      const longitude = rawLng != null ? Number(rawLng) : null;
      console.log('[SRF] /auth/profile parsed', { latitude, longitude, postcode });

      if (Number.isFinite(latitude as number) && Number.isFinite(longitude as number)) {
        setLocation(prev => ({
          ...prev,
          type: 'profile',
          address: 'Your Profile Location',
          postcode,
          latitude: latitude as number,
          longitude: longitude as number
        }));
        console.log('[SRF] location set (profile)', { latitude, longitude, postcode });
        const searchLocation = {
          latitude: latitude as number,
          longitude: longitude as number,
          formattedAddress: 'Your Profile Location',
          postcode
        };
        console.log('[SRF] searchWorkers (profile)', searchLocation);
        searchWorkers(searchLocation, 10);
        toast({
          title: 'Profile Location Set',
          description: 'Your profile location has been set for worker search.',
        });
      } else if (postcode) {
        // Fallback: postcode-only search if coords not set on profile
        console.warn('[SRF] profile missing coords, using postcode-only search', { postcode });
        searchWorkers({ postcode, latitude: 0, longitude: 0, formattedAddress: 'Postcode' }, 10);
        toast({
          title: 'Using Postcode',
          description: 'Profile coordinates missing; searching by postcode.',
        });
      } else {
        console.warn('[SRF] profile has no coordinates', { latitude, longitude, postcode });
        toast({
          title: 'Profile Location Not Set',
          description: 'Please set your profile location in your account settings to enable worker search.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error('[SRF] getProfileAddress failed', e);
      toast({
        title: 'Profile Fetch Error',
        description: 'Could not fetch your profile from the server.',
        variant: 'destructive',
      });
    }
  };


  const handleAddressSelect = (address: AddressData) => {
    console.log('[SRF] handleAddressSelect', address);
    setAddressData(address);
    
    // Also update location state for compatibility
    setLocation(prev => ({
      ...prev,
      type: 'google',
      address: address.formattedAddress,
      postcode: address.postalCode || '',
      latitude: address.latitude,
      longitude: address.longitude
    }));
    
    // Search for workers at this location using coordinates
    if (address.latitude && address.longitude) {
      const searchLocation = {
        postcode: address.postalCode || '',
        latitude: address.latitude,
        longitude: address.longitude,
        formattedAddress: address.formattedAddress
      };
      
      // Search for workers within 10 miles
      console.log('[SRF] searchWorkers (address select)', searchLocation);
      searchWorkers(searchLocation, 10);
    }
    
    toast({
      title: "Address Selected!",
      description: `Address: ${address.formattedAddress}`,
    });
  };

  const handleWorkerSelect = (worker: any) => {
    setSelectedWorkers(prev => {
      if (prev.includes(worker.id)) {
        return prev.filter(id => id !== worker.id);
      } else {
        return [...prev, worker.id];
      }
    });
  };

  // Debug location state changes
  useEffect(() => {
    console.log('[SRF] location state changed', location);
  }, [location]);

  // Debug worker search results
  useEffect(() => {
    console.log('[SRF] workers state', {
      workersCount: workers?.length || 0,
      workers,
      workersLoading,
      workersError,
      workerCounts,
    });
  }, [workers, workersLoading, workersError, workerCounts]);

  const sendServiceRequests = async () => {
    if (selectedWorkers.length === 0) {
      toast({
        title: "No Workers Selected",
        description: "Please select at least one worker to send requests to.",
        variant: "destructive",
      });
      return;
    }

    if (!location.address || !location.latitude || !location.longitude) {
      toast({
        title: "Location Required",
        description: "Please select a service location before sending requests.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedService?.id) {
      toast({
        title: "Service Required",
        description: "Please select a service before sending requests.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Process each worker request individually via Laravel API
      for (const workerId of selectedWorkers) {
        const worker = workers.find(w => w.id === workerId);
        if (!worker || !worker.worker_profile_id) {
          console.error('Worker not found or missing worker_profile_id:', workerId);
          continue;
        }

        const payload = {
          service_id: selectedService.id,
          worker_id: worker.worker_profile_id,
          message_to_worker: requestMessages[workerId] || serviceDetails.description,
          preferred_date: serviceDetails.preferredDate || null,
          location_address: location.address,
          location_latitude: location.latitude,
          location_longitude: location.longitude,
          budget_min: serviceDetails.budget.min,
          budget_max: serviceDetails.budget.max,
        };

        const { data, error } = await apiClient.post('/customer/create-service-request', payload);
        if (error) {
          console.error('Error creating service request (Laravel):', error);
          throw new Error(`Failed to create service request: ${error.message || 'Unknown error'}`);
        }
      }

      toast({
        title: "Success! 🎉",
        description: `Service requests sent to ${selectedWorkers.length} worker(s)! They'll receive notifications and can respond with offers. Check your messages for responses.`
      });
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error sending service requests:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send service requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Where do you need this service?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant={location.type === 'google' ? 'default' : 'outline'} 
            onClick={() => setLocation(prev => ({ ...prev, type: 'google' }))} 
            className="h-20 flex flex-col items-center space-y-2"
          >
            <MapPin className="h-5 w-5" />
            <span>Enter Address</span>
          </Button>
          
          <Button 
            variant={location.type === 'current' ? 'default' : 'outline'} 
            onClick={getCurrentLocation} 
            disabled={loading} 
            className="h-20 flex flex-col items-center space-y-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
            <span>Current Location</span>
          </Button>
          
          <Button 
            variant={location.type === 'profile' ? 'default' : 'outline'} 
            onClick={getProfileAddress} 
            disabled={loading} 
            className="h-20 flex flex-col items-center space-y-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Home className="h-5 w-5" />
            )}
            <span>Profile Address</span>
          </Button>
        </div>
      </div>

      {location.type === 'google' && (
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
          <ServiceAddressSelector 
            onAddressSelect={handleAddressSelect}
            placeholder="Start typing your address..."
            label="Search by Address"
            className="w-full"
          />
        </div>
      )}

      {location.type === 'current' && location.address && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Navigation className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Current Location</span>
          </div>
          <p className="text-sm text-blue-800 mt-2">{location.address}</p>
          {location.postcode && (
            <p className="text-xs text-blue-700 mt-1">Coordinates: {location.longitude} ,  {location.latitude}</p>
          )}
        </div>
      )}

      {location.type === 'profile' && location.address && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Home className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Profile Address</span>
          </div>
          <p className="text-sm text-purple-800 mt-2">{location.address}</p>
          <p className="text-xs text-purple-700 mt-1">Postcode: {location.postcode}</p>
        </div>
      )}

      <div className="space-y-6 pt-4">
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Service Details</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="preferred-date">Preferred Date</Label>
              <WorkingDatePicker
                value={serviceDetails.preferredDate}
                onChange={(date) => setServiceDetails(prev => ({ ...prev, preferredDate: date }))}
                placeholder="Select preferred date"
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget-min">Budget Min (£)</Label>
                <Input
                  id="budget-min"
                  type="number"
                  value={serviceDetails.budget.min}
                  onChange={(e) => setServiceDetails(prev => ({ 
                    ...prev, 
                    budget: { ...prev.budget, min: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="budget-max">Budget Max (£)</Label>
                <Input
                  id="budget-max"
                  type="number"
                  value={serviceDetails.budget.max}
                  onChange={(e) => setServiceDetails(prev => ({ 
                    ...prev, 
                    budget: { ...prev.budget, max: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Service Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you need..."
                value={serviceDetails.description}
                onChange={(e) => setServiceDetails(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button 
          onClick={() => setStep(2)} 
          disabled={(!addressData && !location.latitude && !location.longitude) || loading} 
          className="w-full" 
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding Workers...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Find Available Workers (Within 10 Miles)
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Available Workers</h3>
        <Badge variant="secondary">
          {workers.length} worker{workers.length !== 1 ? 's' : ''} found within 10 miles
        </Badge>
      </div>
      
      {addressData && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Service Location</span>
          </div>
          <p className="text-sm text-blue-800 mt-2">{addressData.formattedAddress}</p>
          <p className="text-xs text-blue-700 mt-1">Postcode: {addressData.postalCode}</p>
          <p className="text-xs text-blue-700 mt-1">City: {addressData.administrativeAreaLevel1 || addressData.locality}</p>
          {/* <p className="text-xs text-blue-700 mt-1">Coordinates: {addressData.latitude}, {addressData.longitude}</p> */}
        </div>
      )}



      {/* Worker Location Results */}
      <WorkerLocationResults
        workers={workers}
        loading={workersLoading}
        error={workersError}
        workerCounts={workerCounts}
        selectedWorkers={selectedWorkers}
        onWorkerSelect={(worker) => {
          setSelectedWorkers(prev => {
            if (prev.includes(worker.id)) {
              return prev.filter(id => id !== worker.id);
            } else {
              return [...prev, worker.id];
            }
          });
        }}
        onContactWorker={(worker) => {
          // Handle contact action
          console.log('Contact worker:', worker);
        }}
      />

      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => setStep(1)}>
          Back to Location
        </Button>
        <Button 
          onClick={() => setStep(3)} 
          disabled={selectedWorkers.length === 0} 
          className="flex-1"
        >
          Contact Selected Workers ({selectedWorkers.length})
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Send Requests to Workers</h3>
      
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Personalize Your Requests</h4>
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {selectedWorkers.map(workerId => {
            const worker = workers.find(w => w.id === workerId);
            if (!worker) return null;
            
            return (
              <Card key={workerId}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{worker.first_name} {worker.last_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {worker.distance} miles away • {worker.postcode}
                      </p>
                    </div>
                  </div>
                  
                  <Textarea
                    placeholder="Personal message to this worker..."
                    value={requestMessages[workerId] || ''}
                    onChange={(e) => setRequestMessages(prev => ({ 
                      ...prev, 
                      [workerId]: e.target.value 
                    }))}
                    rows={3}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button 
          onClick={sendServiceRequests} 
          disabled={selectedWorkers.length === 0 || loading} 
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Requests...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Requests to {selectedWorkers.length} Worker{selectedWorkers.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );



  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]   ">
        <DrawerHeader className="flex-shrink-0 pb-4 ">
          <DrawerTitle className="flex items-center space-x-2">
            <span>Book: {selectedService?.title}</span>
            <Badge variant="outline">Step {step} of 3</Badge>
          </DrawerTitle>
          
          {/* Step Progress Indicator */}
          <div className="flex items-center space-x-2 mt-4">
            <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-primary' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${step === 2 ? 'bg-primary' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${step === 3 ? 'bg-primary' : 'bg-gray-300'}`} />
          </div>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 min-h-0 ">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </DrawerContent>
    </Drawer>
  );
};