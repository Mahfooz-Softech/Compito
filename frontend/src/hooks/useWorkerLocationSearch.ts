import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export interface WorkerLocation {
  id: string;
  worker_profile_id: string;
  first_name: string;
  last_name: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  distance: number;
  is_available: boolean;
  is_online: boolean;
  rating: number | null;
  total_reviews: number | null;
  hourly_rate: number | null;
  bio: string | null;
  avatar_url: string | null;
}

export interface SearchLocation {
  postcode: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface UseWorkerLocationSearchReturn {
  workers: WorkerLocation[];
  loading: boolean;
  error: string | null;
  searchWorkers: (location: SearchLocation, maxDistance?: number) => Promise<void>;
  searchWorkersByPostcode: (postcode: string, maxDistance?: number) => Promise<void>;
  workerCounts: {
    within5Miles: number;
    within10Miles: number;
    within20Miles: number;
    total: number;
  } | null;
  clearResults: () => void;
}

export function useWorkerLocationSearch(): UseWorkerLocationSearchReturn {
  const [workers, setWorkers] = useState<WorkerLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerCounts, setWorkerCounts] = useState<{
    within5Miles: number;
    within10Miles: number;
    within20Miles: number;
    total: number;
  } | null>(null);

  const { toast } = useToast();

  const searchWorkers = useCallback(async (location: SearchLocation, maxDistance: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useWorkerLocationSearch: Searching for workers at location:', location);
      
      // Search workers using backend API
      const response = await apiClient.post('/worker-location-search', {
        ...location,
        maxDistance
      });
      const data = response.data;
      
      setWorkers(data.workers);
      setWorkerCounts(data.workerCounts);
      
      console.log('🔍 useWorkerLocationSearch: Found', data.workers.length, 'workers');
      
      if (data.workers.length === 0) {
        toast({
          title: "No Workers Found",
          description: `No available workers found within ${maxDistance} miles of ${location.formattedAddress}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Workers Found!",
          description: `Found ${data.workers.length} workers within ${maxDistance} miles`,
          variant: "default"
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search for workers';
      console.error('🔍 useWorkerLocationSearch: Error searching workers:', err);
      setError(errorMessage);
      
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const searchWorkersByPostcode = useCallback(async (postcode: string, maxDistance: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useWorkerLocationSearch: Searching for workers by postcode:', postcode);
      
      // Search workers by postcode using backend API
      const response = await apiClient.post('/worker-location-search', {
        postcode,
        maxDistance
      });
      const data = response.data;
      
      setWorkers(data.workers);
      setWorkerCounts(data.workerCounts);
      
      console.log('🔍 useWorkerLocationSearch: Found', data.workers.length, 'workers by postcode');
      
      if (data.workers.length === 0) {
        toast({
          title: "No Workers Found",
          description: `No available workers found within ${maxDistance} miles of postcode ${postcode}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Workers Found!",
          description: `Found ${data.workers.length} workers within ${maxDistance} miles`,
          variant: "default"
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search for workers by postcode';
      console.error('🔍 useWorkerLocationSearch: Error searching workers by postcode:', err);
      setError(errorMessage);
      
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setWorkers([]);
    setError(null);
    setWorkerCounts(null);
  }, []);

  return {
    workers,
    loading,
    error,
    searchWorkers,
    searchWorkersByPostcode,
    workerCounts,
    clearResults
  };
}
