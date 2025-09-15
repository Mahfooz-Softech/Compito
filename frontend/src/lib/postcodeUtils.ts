/**
 * Postcode utility functions for splitting UK postcodes into parts
 */

export interface PostcodeParts {
  p1: string; // First part minus last character
  p2: string; // Last character of first part
  p3: string; // Second part after space
}

/**
 * Splits a UK postcode into 3 parts according to the specified logic:
 * - Split by space first
 * - First part: take everything except the last character
 * - Second part: take the last character of the first part
 * - Third part: take the second part after space
 * 
 * Example: "B123G EWY" becomes:
 * - p1: "B123"
 * - p2: "G"
 * - p3: "EWY"
 */
export function splitPostcode(postcode: string): PostcodeParts {
  // Remove extra spaces and convert to uppercase
  const cleanPostcode = postcode.trim().replace(/\s+/g, ' ').toUpperCase();
  
  // Split by space
  const parts = cleanPostcode.split(' ');
  
  if (parts.length < 2) {
    // If no space found, treat as single part
    const firstPart = parts[0] || '';
    return {
      p1: firstPart.slice(0, -1) || '',
      p2: firstPart.slice(-1) || '',
      p3: ''
    };
  }
  
  const firstPart = parts[0] || '';
  const secondPart = parts[1] || '';
  
  return {
    p1: firstPart.slice(0, -1) || '', // Everything except last character
    p2: firstPart.slice(-1) || '',    // Last character of first part
    p3: secondPart                     // Second part after space
  };
}

/**
 * Reconstructs a postcode from its parts
 */
export function reconstructPostcode(parts: PostcodeParts): string {
  const { p1, p2, p3 } = parts;
  
  if (!p1 && !p2) return '';
  if (!p3) return `${p1}${p2}`;
  
  return `${p1}${p2} ${p3}`;
}

/**
 * Validates if a postcode format is valid for splitting
 */
export function isValidPostcodeFormat(postcode: string): boolean {
  // Basic UK postcode format validation
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
  return ukPostcodeRegex.test(postcode.trim());
}

/**
 * Formats a postcode for display (adds space if missing)
 */
export function formatPostcode(postcode: string): string {
  const clean = postcode.trim().toUpperCase();
  
  // If already has space, return as is
  if (clean.includes(' ')) return clean;
  
  // Add space before the last 3 characters if it's a valid format
  if (clean.length >= 5) {
    const insertIndex = clean.length - 3;
    return clean.slice(0, insertIndex) + ' ' + clean.slice(insertIndex);
  }
  
  return clean;
}

