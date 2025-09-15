import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Crosshair } from 'lucide-react';

interface LocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (location: { 
    latitude: number; 
    longitude: number; 
    address: string;
  }) => void;
}

export const LocationPicker = ({ open, onOpenChange, onLocationSelect }: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');

  // Get current location
  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15
          });
          
          // Remove existing marker
          if (marker.current) {
            marker.current.remove();
          }
          
          // Add new marker
          marker.current = new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat([longitude, latitude])
            .addTo(map.current);
          
          // Reverse geocode to get address
          reverseGeocode(longitude, latitude);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLoading(false);
      }
    );
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lng: number, lat: number) => {
    if (!mapboxToken) return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        setSelectedLocation({
          latitude: lat,
          longitude: lng,
          address
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  useEffect(() => {
    if (!open || !mapContainer.current) return;

    // For demo purposes, using a placeholder token
    // In production, this should come from Supabase Edge Function secrets
    const token = mapboxToken || 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHNhemNrMWYwMGNzMnFwZWI3azFsb2tpIn0.demo_token';
    
    if (!token || token.includes('demo_token')) {
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40],
      zoom: 9
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Remove existing marker
      if (marker.current) {
        marker.current.remove();
      }
      
      // Add new marker
      marker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([lng, lat])
        .addTo(map.current!);
      
      // Reverse geocode
      reverseGeocode(lng, lat);
    });

    return () => {
      map.current?.remove();
    };
  }, [open, mapboxToken]);

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Select Your Location</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!mapboxToken || mapboxToken.includes('demo_token') ? (
            <div className="p-4 border rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">
                To use the location picker, please enter your Mapbox public token:
              </p>
              <input
                type="text"
                placeholder="Enter your Mapbox public token"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your token from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Click on the map to select a location or use your current location
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <Crosshair className="h-4 w-4" />
                  <span>{loading ? 'Getting...' : 'Current Location'}</span>
                </Button>
              </div>
              
              <div ref={mapContainer} className="w-full h-96 rounded-lg border" />
              
              {selectedLocation && (
                <div className="p-3 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Selected Location:</p>
                  <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                  <p className="text-xs text-muted-foreground">
                    Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirm} 
                  disabled={!selectedLocation}
                >
                  Confirm Location
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};