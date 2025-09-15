import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkerProfile {
  id: string;
  user_type: string;
  first_name: string;
  last_name: string;
  location: string;
  city: string;
  postcode: string;
  avatar_url?: string;
  customer_rating?: number;
  customer_total_reviews?: number;
  distance?: number; // Distance from customer location in miles
}

export interface WorkerSearchParams {
  customerPostcode?: string;
  customerLat?: number;
  customerLon?: number;
  maxDistance: number; // Default 10 miles
}

export const useWorkerSearch = () => {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

  // Search workers by coordinates or postcode
  const searchWorkersByPostcode = useCallback(async (params: WorkerSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting worker search with params:', params);
      
      if (!params.customerPostcode && (!params.customerLat || !params.customerLon)) {
        throw new Error('Either customer postcode or coordinates are required');
      }

      // Search workers using backend API
      const response = await apiClient.post('/worker-search', params);
      const data = response.data;

      console.log(`Found ${data.workers.length} workers within ${params.maxDistance} miles`);
      setWorkers(data.workers);
    } catch (err) {
      console.error('Error searching workers:', err);
      setError(err instanceof Error ? err.message : 'Failed to search workers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get postcode coordinates using Google Maps Places API (New)
  const getPostcodeCoordinates = async (postcode: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const cleanPostcode = postcode.replace(/\s+/g, '');
      
      // Use Google Maps Places API (New) to get postcode coordinates
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText?key=AIzaSyD8JJIEpeczXM2TxfdR-RuGG3-AKNDC-4U`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-FieldMask': 'places.displayName,places.location,places.types'
          },
          body: JSON.stringify({
            textQuery: cleanPostcode,
            locationBias: {
              circle: {
                center: {
                  latitude: 51.5074, // London center
                  longitude: -0.1278
                },
                radius: 500000.0 // 500km radius for UK coverage
              }
            },
            languageCode: 'en',
            regionCode: 'GB'
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        if (place.location && place.location.latitude && place.location.longitude) {
          return {
            lat: place.location.latitude,
            lon: place.location.longitude
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting postcode coordinates:', error);
      return null;
    }
  };

  // Fetch customer's profile location
  const fetchCustomerLocation = useCallback(async () => {
    if (!user) return null;

    try {
      const response = await apiClient.get('/auth/profile');
      const profile = response.data;
      
      return {
        location: profile.location,
        city: profile.city,
        postcode: profile.postcode
      };
    } catch (err) {
      console.error('Error fetching customer location:', err);
      return null;
    }
  }, [user]);

  // Clear search results
  const clearSearch = useCallback(() => {
    setWorkers([]);
    setError(null);
  }, []);

  return {
    workers,
    loading,
    error,
    searchWorkersByPostcode,
    fetchCustomerLocation,
    clearSearch
  };
};
