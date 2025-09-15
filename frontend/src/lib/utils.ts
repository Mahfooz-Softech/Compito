import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Check if a worker is within the specified distance from a location
 * @param workerLat - Worker's latitude
 * @param workerLon - Worker's longitude
 * @param customerLat - Customer's latitude
 * @param customerLon - Customer's longitude
 * @param maxDistance - Maximum distance in miles (default: 10)
 * @returns True if worker is within distance
 */
export function isWorkerWithinDistance(
  workerLat: number, 
  workerLon: number, 
  customerLat: number, 
  customerLon: number, 
  maxDistance: number = 10
): boolean {
  const distance = calculateDistance(workerLat, workerLon, customerLat, customerLon);
  return distance <= maxDistance;
}

/**
 * Format distance for display
 * @param distance - Distance in miles
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 5280)} feet away`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} miles away`;
  } else {
    return `${Math.round(distance)} miles away`;
  }
}

/**
 * Get postcode parts for distance calculation
 * @param postcode - Full postcode (e.g., "SW1V 3DW")
 * @returns Object with postcode parts
 */
export function getPostcodeParts(postcode: string) {
  const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
  
  // UK postcode format: A9 9AA or A99 9AA or AA9 9AA or AA99 9AA
  const match = cleanPostcode.match(/^([A-Z]{1,2}\d{1,2})(\d[A-Z]{2})$/);
  
  if (match) {
    return {
      outward: match[1], // First part (e.g., "SW1V")
      inward: match[2],  // Second part (e.g., "3DW")
      full: cleanPostcode
    };
  }
  
  return {
    outward: cleanPostcode,
    inward: '',
    full: cleanPostcode
  };
}

/**
 * Split UK postcode into p1, p2, p3 parts for database storage
 * @param postcode - Full UK postcode (e.g., "M1 1AE", "GU16 7JQ", "BT1 1JW")
 * @returns Object with p1, p2, p3 parts
 */
export function splitUKPostcode(postcode: string) {
  if (!postcode) {
    return { p1: '', p2: '', p3: '' };
  }

  const cleanPostcode = postcode.trim();
  const parts = cleanPostcode.split(' ');
  
  if (parts.length >= 2) {
    const firstPart = parts[0]; // e.g., "M1", "GU16", "BT1"
    const secondPart = parts[1]; // e.g., "1AE", "7JQ", "1JW"
    
    // Extract p2 (last numeric character from first part)
    const p2Match = firstPart.match(/\d+$/);
    const p2 = p2Match ? p2Match[0] : '';
    
    return {
      p1: firstPart,    // e.g., "M1", "GU16", "BT1"
      p2: p2,           // e.g., "1", "6", "1"
      p3: secondPart    // e.g., "1AE", "7JQ", "1JW"
    };
  }
  
  // If only one part, treat it as p1
  return {
    p1: cleanPostcode,
    p2: '',
    p3: ''
  };
}
