import { supabase } from '@/integrations/supabase/client';

/**
 * IMPORTANT: This service only returns workers who already have valid worker_profiles records.
 * Workers without worker_profiles are automatically skipped because:
 * 1. The service_requests.worker_id field requires a valid worker_profiles.id
 * 2. Row Level Security (RLS) prevents clients from creating worker_profiles for other users
 * 3. Only workers can create their own profiles through the authentication system
 * 
 * To fix missing worker profiles, workers must:
 * - Complete their profile setup through the worker onboarding process
 * - Or have an admin create their profile through the admin interface
 */

export interface WorkerLocation {
  id: string; // This is the profiles.id
  worker_profile_id: string; // This is the worker_profiles.id that we need for service_requests
  first_name: string;
  last_name: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  distance: number; // in miles
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

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get coordinates for a postcode using Google Maps Geocoding API
 * @param postcode UK postcode
 * @returns Promise with coordinates
 */
export async function getCoordinatesForPostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  if (!window.google) {
    console.error('Google Maps API not loaded');
    return null;
  }

  try {
    const geocoder = new window.google.maps.Geocoder();
    
    const result = await new Promise<any>((resolve, reject) => {
      geocoder.geocode(
        { 
          address: postcode,
          componentRestrictions: { country: 'GB' }
        },
        (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve(results[0]);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });

    const location = result.geometry.location;
    return {
      lat: location.lat(),
      lng: location.lng()
    };
  } catch (error) {
    console.error('Error getting coordinates for postcode:', error);
    return null;
  }
}

/**
 * Find workers within specified distance of a location
 * @param searchLocation The location to search from
 * @param maxDistanceMiles Maximum distance in miles (default: 10)
 * @returns Promise with array of workers within distance
 */
export async function findWorkersWithinDistance(
  searchLocation: SearchLocation,
  maxDistanceMiles: number = 10
): Promise<WorkerLocation[]> {
  try {
    console.log('🔍 Finding workers within', maxDistanceMiles, 'miles of:', searchLocation);
    console.log('🔍 Search location coordinates:', searchLocation.latitude, searchLocation.longitude);

    // Note: We cannot create missing worker_profiles from client-side due to RLS restrictions
    // Only workers can create their own profiles. The system will only return workers
    // who already have valid worker_profiles records.

    // First, get all available workers from the database
    // Query profiles table where user_type = 'worker' and join with worker_profiles
    const { data: workers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        postcode,
        latitude,
        longitude,
        avatar_url,
        user_type
      `)
      .eq('user_type', 'worker')
      .not('postcode', 'is', null);

    if (error) {
      console.error('Error fetching workers:', error);
      throw error;
    }

    console.log('🔍 Found', workers?.length || 0, 'available workers in database');
    console.log('🔍 Sample worker data:', workers?.[0]);

    if (!workers || workers.length === 0) {
      return [];
    }

    // Filter workers by distance
    const workersWithDistance: WorkerLocation[] = [];

    for (const worker of workers) {
      let workerLat = worker.latitude;
      let workerLng = worker.longitude;

      // If worker doesn't have coordinates, try to get them from postcode
      if (!workerLat || !workerLng) {
        console.log('🔍 Worker', worker.id, 'missing coordinates, getting from postcode:', worker.postcode);
        const coords = await getCoordinatesForPostcode(worker.postcode);
        if (coords) {
          workerLat = coords.lat;
          workerLng = coords.lng;
        } else {
          console.warn('🔍 Could not get coordinates for worker postcode:', worker.postcode);
          continue; // Skip this worker
        }
      }

      // Calculate distance using coordinates
      const distance = calculateDistance(
        searchLocation.latitude,
        searchLocation.longitude,
        workerLat,
        workerLng
      );

      console.log('🔍 Worker', worker.first_name, 'at', workerLat, workerLng, 'distance:', distance.toFixed(2), 'miles');

              // Only include workers within the specified distance
        if (distance <= maxDistanceMiles) {
          // Check if this worker has a worker_profile by querying the worker_profiles table
          const { data: workerProfile, error: profileError } = await supabase
            .from('worker_profiles')
            .select('id')
            .eq('id', worker.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('🔍 Error checking worker profile for', worker.id, ':', profileError);
            continue;
          }
          
          // Only include workers that have valid worker_profiles records
          // This is required for service_requests.worker_id foreign key constraint
          if (!workerProfile) {
            console.warn('🔍 Worker', worker.id, 'has no worker_profile, skipping (required for service requests). This worker needs to complete their profile setup.');
            continue;
          }
          
          const workerProfileId = workerProfile.id;
          
          console.log('🔍 Adding worker to results:', {
            id: worker.id,
            name: `${worker.first_name} ${worker.last_name}`,
            distance: Math.round(distance * 10) / 10,
            hasWorkerProfile: true,
            workerProfileId: workerProfileId
          });
          
          workersWithDistance.push({
            id: worker.id,
            worker_profile_id: workerProfileId,
            first_name: worker.first_name,
            last_name: worker.last_name,
            postcode: worker.postcode,
            latitude: workerLat,
            longitude: workerLng,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
            is_available: true, // Default to true since we're querying workers
            is_online: false, // Default to false
            rating: null, // Will be populated later if needed
            total_reviews: null, // Will be populated later if needed
            hourly_rate: null, // Will be populated later if needed
            bio: null, // Will be populated later if needed
            avatar_url: worker.avatar_url
          });
        }
    }

    // Sort by distance (closest first)
    workersWithDistance.sort((a, b) => a.distance - b.distance);

    console.log('🔍 Found', workersWithDistance.length, 'workers within', maxDistanceMiles, 'miles');
    return workersWithDistance;

  } catch (error) {
    console.error('Error finding workers within distance:', error);
    throw error;
  }
}

/**
 * Find workers by postcode (fallback method)
 * @param postcode UK postcode
 * @param maxDistanceMiles Maximum distance in miles (default: 10)
 * @returns Promise with array of workers within distance
 */
export async function findWorkersByPostcode(
  postcode: string,
  maxDistanceMiles: number = 10
): Promise<WorkerLocation[]> {
  try {
    // First get coordinates for the postcode
    const coords = await getCoordinatesForPostcode(postcode);
    if (!coords) {
      throw new Error('Could not get coordinates for postcode');
    }

    const searchLocation: SearchLocation = {
      postcode,
      latitude: coords.lat,
      longitude: coords.lng,
      formattedAddress: postcode
    };

    return await findWorkersWithinDistanceOptimized(searchLocation, maxDistanceMiles);
  } catch (error) {
    console.error('Error finding workers by postcode:', error);
    throw error;
  }
}

/**
 * Create missing worker profiles for workers who don't have them
 * This is required for service_requests to work properly
 * @returns Promise with number of worker profiles created
 */
export async function createMissingWorkerProfiles(): Promise<number> {
  try {
    console.log('🔍 Creating missing worker profiles...');

    // Get workers without worker_profiles
    const { data: workers, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, postcode, latitude, longitude')
      .eq('user_type', 'worker')
      .not('id', 'in', `(SELECT id FROM worker_profiles)`);

    if (error) {
      console.error('Error fetching workers without profiles:', error);
      throw error;
    }

    if (!workers || workers.length === 0) {
      console.log('🔍 No workers found without worker profiles');
      return 0;
    }

    console.log('🔍 Found', workers.length, 'workers without worker profiles');

    let createdCount = 0;

    for (const worker of workers) {
      try {
        // Create a basic worker profile
        const { error: createError } = await supabase
          .from('worker_profiles')
          .insert({
            id: worker.id, // Use the same ID as profiles
            bio: null,
            hourly_rate: null,
            experience_years: null,
            rating: 0,
            total_reviews: 0,
            is_available: true,
            is_online: false,
            is_verified: false,
            verification_status: 'pending',
            service_radius_miles: 10,
            skills: [],
            latitude: worker.latitude,
            longitude: worker.longitude,
            location: worker.postcode,
            city: null,
            country: 'UK',
            postcode: worker.postcode
          });

        if (!createError) {
          createdCount++;
          console.log('🔍 Created worker profile for', worker.id, worker.first_name);
        } else {
          console.error('Error creating worker profile for', worker.id, ':', createError);
        }

        // Add a small delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error creating worker profile for', worker.id, ':', error);
      }
    }

    console.log('🔍 Successfully created', createdCount, 'worker profiles');
    return createdCount;

  } catch (error) {
    console.error('Error creating missing worker profiles:', error);
    throw error;
  }
}

/**
 * Update missing worker coordinates in the database
 * This function can be run periodically to populate missing coordinates
 * @returns Promise with number of workers updated
 */
export async function updateMissingWorkerCoordinates(): Promise<number> {
  try {
    console.log('🔍 Updating missing worker coordinates...');

    // Get workers without coordinates
    const { data: workers, error } = await supabase
      .from('profiles')
      .select('id, postcode')
      .eq('user_type', 'worker')
      .or('latitude.is.null,longitude.is.null')
      .not('postcode', 'is', null);

    if (error) {
      console.error('Error fetching workers without coordinates:', error);
      throw error;
    }

    if (!workers || workers.length === 0) {
      console.log('🔍 No workers found without coordinates');
      return 0;
    }

    console.log('🔍 Found', workers.length, 'workers without coordinates');

    let updatedCount = 0;

    for (const worker of workers) {
      try {
        const coords = await getCoordinatesForPostcode(worker.postcode);
        if (coords) {
          // Update the worker's coordinates in the database
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              latitude: coords.lat.toString(),
              longitude: coords.lng.toString()
            })
            .eq('id', worker.id);

          if (!updateError) {
            updatedCount++;
            console.log('🔍 Updated coordinates for worker', worker.id, ':', coords);
          } else {
            console.error('Error updating coordinates for worker', worker.id, ':', updateError);
          }
        }

        // Add a small delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error updating coordinates for worker', worker.id, ':', error);
      }
    }

    console.log('🔍 Successfully updated coordinates for', updatedCount, 'workers');
    return updatedCount;

  } catch (error) {
    console.error('Error updating missing worker coordinates:', error);
    throw error;
  }
}

/**
 * Get worker count by distance ranges
 * @param searchLocation The location to search from
 * @returns Promise with distance range counts
 */
export async function getWorkerCountByDistance(searchLocation: SearchLocation): Promise<{
  within5Miles: number;
  within10Miles: number;
  within20Miles: number;
  total: number;
}> {
  try {
    const workers5Miles = await findWorkersWithinDistance(searchLocation, 5);
    const workers10Miles = await findWorkersWithinDistance(searchLocation, 10);
    const workers20Miles = await findWorkersWithinDistance(searchLocation, 20);

    return {
      within5Miles: workers5Miles.length,
      within10Miles: workers10Miles.length,
      within20Miles: workers20Miles.length,
      total: workers20Miles.length
    };
  } catch (error) {
    console.error('Error getting worker count by distance:', error);
    throw error;
  }
}

/**
 * Find workers within distance using optimized coordinate-based filtering
 * This function is more efficient as it filters workers by approximate distance first
 * @param searchLocation The location to search from
 * @param maxDistanceMiles Maximum distance in miles (default: 10)
 * @returns Promise with array of workers within distance
 */
export async function findWorkersWithinDistanceOptimized(
  searchLocation: SearchLocation,
  maxDistanceMiles: number = 10
): Promise<WorkerLocation[]> {
  try {
    console.log('🔍 Finding workers within', maxDistanceMiles, 'miles (optimized) of:', searchLocation);
    
    // Note: We cannot create missing worker_profiles from client-side due to RLS restrictions
    // Only workers can create their own profiles. The system will only return workers
    // who already have valid worker_profiles records.
    
    // Convert miles to approximate degrees (rough estimation for initial filtering)
    // 1 degree of latitude ≈ 69 miles, 1 degree of longitude ≈ 54.6 miles at UK latitude
    const latDelta = maxDistanceMiles / 69;
    const lngDelta = maxDistanceMiles / 54.6;
    
    // Create bounding box for initial filtering
    const minLat = searchLocation.latitude - latDelta;
    const maxLat = searchLocation.latitude + latDelta;
    const minLng = searchLocation.longitude - lngDelta;
    const maxLng = searchLocation.longitude + lngDelta;

    console.log('🔍 Bounding box:', { minLat, maxLat, minLng, maxLng });

    // Get workers within the bounding box first (this reduces the number of distance calculations)
    const { data: workers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        postcode,
        latitude,
        longitude,
        avatar_url,
        user_type
      `)
      .eq('user_type', 'worker')
      .not('postcode', 'is', null)
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng);

    if (error) {
      console.error('Error fetching workers in bounding box:', error);
      throw error;
    }

    console.log('🔍 Found', workers?.length || 0, 'workers in bounding box');

    if (!workers || workers.length === 0) {
      return [];
    }

    // Now calculate exact distances for workers in the bounding box
    const workersWithDistance: WorkerLocation[] = [];

    for (const worker of workers) {
      if (!worker.latitude || !worker.longitude) {
        continue; // Skip workers without coordinates
      }

      // Calculate exact distance
      const distance = calculateDistance(
        searchLocation.latitude,
        searchLocation.longitude,
        worker.latitude,
        worker.longitude
      );

                    // Only include workers within the specified distance
      if (distance <= maxDistanceMiles) {
        // Check if this worker has a worker_profile by querying the worker_profiles table
        const { data: workerProfile, error: profileError } = await supabase
          .from('worker_profiles')
          .select('id')
          .eq('id', worker.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('🔍 Error checking worker profile for', worker.id, ':', profileError);
          continue;
        }
        
        // Only include workers that have valid worker_profiles records
        // This is required for service_requests.worker_id foreign key constraint
        if (!workerProfile) {
          console.warn('🔍 Worker', worker.id, 'has no worker_profile, skipping (required for service requests). This worker needs to complete their profile setup.');
          continue;
        }
        
        const workerProfileId = workerProfile.id;
        
        console.log('🔍 Adding worker to results (optimized):', {
          id: worker.id,
          name: `${worker.first_name} ${worker.last_name}`,
          distance: Math.round(distance * 10) / 10,
          hasWorkerProfile: true,
          workerProfileId: workerProfileId
        });
        
        workersWithDistance.push({
          id: worker.id,
          worker_profile_id: workerProfileId,
          first_name: worker.first_name,
          last_name: worker.last_name,
          postcode: worker.postcode,
          latitude: worker.latitude,
          longitude: worker.longitude,
          distance: Math.round(distance * 10) / 10,
          is_available: true, // Default to true since we're querying workers
          is_online: false, // Default to false
          rating: null, // Will be populated later if needed
          total_reviews: null, // Will be populated later if needed
          hourly_rate: null, // Will be populated later if needed
          bio: null, // Will be populated later if needed
          avatar_url: worker.avatar_url
        });
      }
    }

    // Sort by distance (closest first)
    workersWithDistance.sort((a, b) => a.distance - b.distance);

    console.log('🔍 Found', workersWithDistance.length, 'workers within', maxDistanceMiles, 'miles (optimized)');
    return workersWithDistance;

  } catch (error) {
    console.error('Error in optimized worker search:', error);
    // Fallback to regular search if optimized search fails
    return findWorkersWithinDistance(searchLocation, maxDistanceMiles);
  }
}
