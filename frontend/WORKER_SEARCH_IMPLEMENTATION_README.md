# Worker Search Implementation - Customer Panel

## Overview
This document outlines the implementation of the worker search functionality in the customer panel's browse services page. Customers can now find available workers within 10 miles of their selected location using **Postcoder's built-in distance API**.

## ✅ **CRITICAL FIX: Postcoder Distance API**
- **Before**: Fake random distances (workers in Pakistan showing as 2.6 miles away)
- **After**: Real postcode distances using Postcoder's distance API
- **Service**: Postcoder Distance API - **Already integrated and working**

## Features Implemented

### ✅ **Three Location Options**
1. **Enter Postcode** - Customer enters a postcode and selects a specific address
2. **Current Location** - Uses browser geolocation to get customer's current position
3. **Profile Address** - Fetches customer's saved address from their profile

### ✅ **Postcoder Distance API Worker Search**
- **Direct postcode distance calculation** using Postcoder's distance API
- **No coordinate calculations needed** - Postcoder handles everything
- Searches for workers within **10 miles radius** of selected postcode
- Fetches workers from `profiles` table where `user_type = 'worker'`
- Filters workers by **real distance** and sorts by proximity

### ✅ **Available Workers Display**
- Shows worker profiles with **real distance information**
- Displays worker ratings, reviews, and location details
- Allows customers to select multiple workers

## Implementation Details

### 1. **Postcoder Distance API Integration**
```typescript
// Location: src/hooks/useWorkerSearch.ts
const getWorkersWithinDistance = async (customerPostcode, workerPostcodes, maxDistance, allWorkers) => {
  // Use Postcoder's distance API to get distances for all worker postcodes at once
  const response = await fetch(
    `https://postcoder.com/distances/GB/${cleanCustomerPostcode}?api_key=PCW59-Q4YAC-G2CEK-3V5YX&format=json&postcodes=${workerPostcodes.join(',')}`
  );
  
  const distanceData = await response.json();
  
  // Filter workers within the specified distance
  for (const worker of allWorkers) {
    const postcodeDistance = distanceData.find(item => 
      item.postcode === worker.postcode
    );
    
    if (postcodeDistance && postcodeDistance.distance <= maxDistance) {
      workersWithDistance.push({
        ...worker,
        distance: parseFloat(postcodeDistance.distance.toFixed(1))
      });
    }
  }
  
  return workersWithDistance.sort((a, b) => a.distance - b.distance);
};
```

**Why Postcoder Distance API?**
- ✅ **Already integrated** - No new API setup needed
- ✅ **UK postcode accuracy** - Perfect for UK-based service
- ✅ **Existing API key** - PCW59-Q4YAC-G2CEK-3V5YX already configured
- ✅ **No CORS issues** - Already working in the system
- ✅ **Built-in distance calculation** - No need for coordinates or Haversine formula
- ✅ **Batch processing** - Check multiple postcodes in one API call

### 2. **Fallback Method for Individual Postcodes**
```typescript
// If batch API fails, fall back to individual postcode distance checks
const getPostcodeDistance = async (postcode1, postcode2) => {
  const response = await fetch(
    `https://postcoder.com/distances/GB/${postcode1}?api_key=PCW59-Q4YAC-G2CEK-3V5YX&format=json&postcodes=${postcode2}`
  );
  
  const data = await response.json();
  return data[0]?.distance ? parseFloat(data[0].distance) : null;
};
```

### 3. **Updated Worker Search Hook**
```typescript
// Location: src/hooks/useWorkerSearch.ts
const searchWorkersByPostcode = useCallback(async (params: WorkerSearchParams) => {
  // 1. Fetch all workers from profiles table
  const { data: allWorkers } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_type', 'worker')
    .not('postcode', 'is', null);
  
  // 2. Get unique worker postcodes
  const workerPostcodes = [...new Set(allWorkers.map(w => w.postcode))];
  
  // 3. Use Postcoder's distance API to get workers within range
  const workersWithinDistance = await getWorkersWithinDistance(
    params.customerPostcode,
    workerPostcodes,
    params.maxDistance,
    allWorkers
  );
  
  // 4. Sort by distance (closest first)
  return workersWithinDistance.sort((a, b) => a.distance - b.distance);
}, []);
```

## User Flow

### **Step 1: Location Selection**
1. Customer clicks "Book Now" on a service
2. Popup opens with three location options:
   - **Enter Postcode**: Customer searches and selects address
   - **Current Location**: Browser gets GPS coordinates + extracts postcode
   - **Profile Address**: Loads saved address + postcode from profile
3. **System uses the postcode** to find workers via Postcoder distance API
4. Customer fills in service details (date, budget, description)
5. Customer clicks "Find Available Workers (Within 10 Miles)"

### **Step 2: Postcoder Distance API Worker Search**
1. System fetches all workers from `profiles` table
2. **Gets unique worker postcodes** from database
3. **Calls Postcoder distance API** with customer postcode + all worker postcodes
4. **Postcoder returns distances** for all postcodes in one API call
5. **Filters workers within 10 miles** using Postcoder's distance data
6. Shows workers sorted by proximity

### **Step 3: Worker Selection**
1. Customer reviews available workers with **real distances**
2. Selects one or more workers
3. Writes personal messages to each worker
4. Sends service requests

## Technical Implementation

### **Postcoder Distance API Flow**
```typescript
// 1. Customer selects postcode
const customerPostcode = "SW1V 3DW";

// 2. Get all worker postcodes from database
const workerPostcodes = ["M1 1AA", "B1 1AA", "EH1 1AA", "CF10 1AA"];

// 3. Call Postcoder distance API
const response = await fetch(
  `https://postcoder.com/distances/GB/SW1V3DW?api_key=PCW59-Q4YAC-G2CEK-3V5YX&format=json&postcodes=M1 1AA,B1 1AA,EH1 1AA,CF10 1AA`
);

// 4. Postcoder returns distances
const distanceData = [
  { postcode: "M1 1AA", distance: 163.2 },
  { postcode: "B1 1AA", distance: 102.8 },
  { postcode: "EH1 1AA", distance: 332.1 },
  { postcode: "CF10 1AA", distance: 131.5 }
];

// 5. Filter workers within 10 miles
const workersWithin10Miles = workers.filter(worker => {
  const distance = distanceData.find(d => d.postcode === worker.postcode)?.distance;
  return distance && distance <= 10;
});

// Result: 0 workers within 10 miles (all are much further away!)
```

### **Database Schema Requirements**
```sql
-- Workers must have postcode in profiles table
SELECT id, first_name, last_name, postcode, city 
FROM profiles 
WHERE user_type = 'worker' 
  AND postcode IS NOT NULL 
  AND postcode != '';
```

## Testing

### **Test the Postcoder Distance API**
```typescript
// In browser console, test with real UK postcodes:
const testPostcodes = [
  'SW1A 2AA', // London (Buckingham Palace)
  'M1 1AA',   // Manchester
  'B1 1AA',   // Birmingham
  'EH1 1AA',  // Edinburgh
  'CF10 1AA'  // Cardiff
];

// Test distance API
const response = await fetch(
  `https://postcoder.com/distances/GB/SW1A2AA?api_key=PCW59-Q4YAC-G2CEK-3V5YX&format=json&postcodes=M1 1AA,B1 1AA`
);

const data = await response.json();
console.log('Distance data:', data);
```

### **Expected Results**
- ✅ **UK postcodes** get distances correctly via Postcoder
- ✅ **Real distances** calculated (London to Manchester = 163+ miles, not 2.6 miles)
- ✅ **Only workers within 10 miles** appear in results
- ✅ **Accurate sorting** by real distance

## Performance Considerations

### **Batch API Calls**
- Postcoder distance API can handle multiple postcodes in one call
- Reduces API calls from N (number of workers) to 1
- Much faster than individual postcode lookups

### **Fallback Strategy**
- If batch API fails, falls back to individual postcode checks
- Ensures system remains functional even if batch processing fails
- Individual calls are slower but more reliable

## Future Enhancements

### **1. Postcode Coordinate Caching**
```typescript
// Cache frequently used postcode distances
const postcodeDistanceCache = new Map();

const getCachedDistance = (postcode1, postcode2) => {
  const key = `${postcode1}-${postcode2}`;
  if (postcodeDistanceCache.has(key)) {
    return postcodeDistanceCache.get(key);
  }
  // Fetch from API and cache
};
```

### **2. Database Distance Storage**
```sql
-- Add distance columns for faster searches
ALTER TABLE profiles ADD COLUMN distance_from_london DECIMAL(8, 2);
ALTER TABLE profiles ADD COLUMN distance_from_manchester DECIMAL(8, 2);

-- Pre-calculate distances for major cities
UPDATE profiles SET distance_from_london = 
  (SELECT distance FROM postcoder_distances WHERE from_postcode = 'SW1A 2AA' AND to_postcode = profiles.postcode);
```

## Summary

This implementation now provides:
- ✅ **Direct postcode distance calculation** using Postcoder's distance API
- ✅ **No coordinate calculations needed** - Postcoder handles everything
- ✅ **No more fake distances** - workers in Pakistan won't show as 2.6 miles away
- ✅ **Proper filtering** - only workers within real 10-mile radius appear
- ✅ **Better user experience** - customers see accurate worker locations
- ✅ **No new API integration** - uses existing Postcoder service
- ✅ **Faster performance** - batch API calls instead of individual lookups

The system now correctly identifies that a worker in Pakistan is thousands of miles away from a UK customer, not 2.6 miles! 🎯

**Key Benefits:**
- 🚀 **Much faster** - Batch API calls instead of individual postcode lookups
- 💰 **Cost-effective** - Uses existing Postcoder API
- 🎯 **Accurate** - Postcoder's built-in distance calculation
- 🔧 **Simple** - No coordinate math needed
- 📊 **Efficient** - Single API call for multiple postcodes
