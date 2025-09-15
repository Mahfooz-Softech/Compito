import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Sparkles, Wrench, Truck, Scissors, PaintBucket, Laptop, Loader2, Users, Star, Shield } from 'lucide-react';
import { usePublicData } from '@/hooks/usePublicData';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface HeroFilterProps {
  onSearch: (serviceCategory: string, location: string) => void;
}

interface Worker {
  id: string;
  rating: number;
  total_reviews: number;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  services: Array<{
    title: string;
    price_min: number;
    price_max: number;
    categories: {
      name: string;
    };
  }>;
  latitude: number;
  longitude: number;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export const HeroFilter: React.FC<HeroFilterProps> = ({ onSearch }) => {
  const { categories } = usePublicData();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [searchResults, setSearchResults] = useState<Worker[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocationCoords, setSelectedLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Icon mapping for categories
  const getIconForCategory = (categoryName: string) => {
    switch (categoryName?.toLowerCase()) {
      case 'cleaning': return Sparkles;
      case 'handyman': return Wrench;
      case 'moving': return Truck;
      case 'personal care': return Scissors;
      case 'painting': return PaintBucket;
      case 'tech support': return Laptop;
      default: return Wrench;
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

  // Load Google Maps API
  useEffect(() => {
    if (!window.google) {
      loadGoogleMapsAPI();
    } else {
      setIsGoogleMapsLoaded(true);
      initializeAutocomplete();
    }
  }, []);

  // Initialize autocomplete when API is loaded
  useEffect(() => {
    if (isGoogleMapsLoaded && locationInputRef.current) {
      initializeAutocomplete();
    }
  }, [isGoogleMapsLoaded]);

  const loadGoogleMapsAPI = () => {
    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD8JJIEpeczXM2TxfdR-RuGG3-AKNDC-4U&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    
    window.initGoogleMaps = () => {
      setIsGoogleMapsLoaded(true);
    };
    
    document.head.appendChild(script);
  };

  const initializeAutocomplete = () => {
    if (!locationInputRef.current || !window.google) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'GB' }, // Restrict to UK
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address && place.geometry?.location) {
          setLocation(place.formatted_address);
          setSelectedLocationCoords({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
        }
      });
    } catch (err) {
      console.error('Error initializing Google Maps:', err);
    }
  };

  const handleSearch = async () => {
    if (!selectedCategory || !location || !selectedLocationCoords) {
      return;
    }

    setIsLoading(true);
    setShowResults(true);

    try {
      // Use the same logic as ServiceRequestFlow - search from profiles table first
      // Convert miles to approximate degrees for bounding box filtering
      const latDelta = 10 / 69; // 1 degree of latitude ≈ 69 miles
      const lngDelta = 10 / 54.6; // 1 degree of longitude ≈ 54.6 miles at UK latitude
      
      // Create bounding box for initial filtering
      const minLat = selectedLocationCoords.lat - latDelta;
      const maxLat = selectedLocationCoords.lat + latDelta;
      const minLng = selectedLocationCoords.lng - lngDelta;
      const maxLng = selectedLocationCoords.lng + lngDelta;

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

      if (!workers || workers.length === 0) {
        setSearchResults([]);
        return;
      }

      // Now calculate exact distances and filter by service category
      const workersWithDistance: Worker[] = [];

      for (const worker of workers) {
        if (!worker.latitude || !worker.longitude) {
          continue; // Skip workers without coordinates
        }

        // Calculate exact distance
        const distance = calculateDistance(
          selectedLocationCoords.lat,
          selectedLocationCoords.lng,
          worker.latitude,
          worker.longitude
        );

        // Only include workers within 10 miles
        if (distance <= 10) {
          // Check if this worker has a worker_profile
          const { data: workerProfile, error: profileError } = await supabase
            .from('worker_profiles')
            .select('id, is_verified')
            .eq('id', worker.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error checking worker profile for', worker.id, ':', profileError);
            continue;
          }
          
          // Only include verified workers
          if (!workerProfile || !workerProfile.is_verified) {
            continue;
          }

          // Check if worker has services in the selected category
          const { data: servicesData } = await supabase
            .from('services')
            .select(`
              title,
              price_min,
              price_max,
              category_id
            `)
            .eq('worker_id', worker.id);

          // Check if any service matches the selected category
          let hasMatchingService = false;
          let matchingService = null;

          if (servicesData && servicesData.length > 0) {
            // Get categories for the services
            const categoryIds = servicesData.map(s => s.category_id).filter(Boolean);
            if (categoryIds.length > 0) {
              const { data: categoriesData } = await supabase
                .from('categories')
                .select('id, name')
                .in('id', categoryIds);

              if (categoriesData) {
                for (const service of servicesData) {
                  const category = categoriesData.find(c => c.id === service.category_id);
                  if (category && category.name.toLowerCase() === selectedCategory.toLowerCase()) {
                    hasMatchingService = true;
                    matchingService = service;
                    break;
                  }
                }
              }
            }
          }

          if (hasMatchingService && matchingService) {
            workersWithDistance.push({
              id: worker.id,
              rating: 0, // Will be updated from worker_profile
              total_reviews: 0, // Will be updated from worker_profile
              latitude: worker.latitude,
              longitude: worker.longitude,
              profiles: {
                first_name: worker.first_name,
                last_name: worker.last_name,
                avatar_url: worker.avatar_url
              },
              services: [{
                title: matchingService.title,
                price_min: matchingService.price_min || 0,
                price_max: matchingService.price_max || 0,
                categories: { name: selectedCategory }
              }]
            });
          }
        }
      }

      // Sort by distance (closest first)
      const sortedWorkers = workersWithDistance.sort((a, b) => {
        const distanceA = calculateDistance(
          selectedLocationCoords.lat,
          selectedLocationCoords.lng,
          a.latitude,
          a.longitude
        );
        const distanceB = calculateDistance(
          selectedLocationCoords.lat,
          selectedLocationCoords.lng,
          b.latitude,
          b.longitude
        );
        return distanceA - distanceB;
      });

      setSearchResults(sortedWorkers);
      onSearch(selectedCategory, location);
    } catch (error) {
      console.error('Error searching for workers:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setShowResults(false);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setSelectedLocationCoords(null);
    setShowResults(false);
  };

  const getDistanceFromLocation = (workerLat: number, workerLng: number): string => {
    if (!selectedLocationCoords) return '';
    const distance = calculateDistance(
      selectedLocationCoords.lat,
      selectedLocationCoords.lng,
      workerLat,
      workerLng
    );
    return `${distance.toFixed(1)} miles away`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Filter Card */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Service Category */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Service Category
              </label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-14 text-left bg-background/50 border-2 border-border/50 hover:border-primary/50 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {categories && categories.length > 0 ? (
                    categories.map((category: any) => {
                      const IconComponent = getIconForCategory(category.name);
                      return (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-4 w-4 text-primary" />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="cleaning" disabled>
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>Loading categories...</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Location
              </label>
              <div className="relative">
                <Input
                  ref={locationInputRef}
                  type="text"
                  placeholder="Enter your postcode or address"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="h-14 text-left bg-background/50 border-2 border-border/50 hover:border-primary/50 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 pl-4 pr-12"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {!isGoogleMapsLoaded ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
     
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={!selectedCategory || !location || !selectedLocationCoords || isLoading}
                className="h-14 w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Find Workers
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Verified Workers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4.9★</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">10 miles</div>
              <div className="text-sm text-muted-foreground">Search Radius</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Secure Payments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {showResults && (
        <div className="mt-8">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">
                  Workers Found for {selectedCategory} within 10 miles
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {searchResults.length} workers available
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    📍 10-mile radius
                  </Badge>
                </div>
              </div>

              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.slice(0, 6).map((worker, index) => (
                    <div key={worker.id} className="bg-background/50 rounded-lg p-4 border border-border/50 hover:border-primary/50 transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {worker.profiles?.first_name} {worker.profiles?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {worker.services?.[0]?.title || 'Service Provider'}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{worker.rating || 'New'} {worker.total_reviews ? `(${worker.total_reviews} reviews)` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Shield className="h-4 w-4 text-green-500" />
                          <span>Verified</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span>{getDistanceFromLocation(worker.latitude, worker.longitude)}</span>
                        </div>
                        {worker.services?.[0] && (
                          <div className="text-primary font-semibold">
                            £{worker.services[0].price_min}-{worker.services[0].price_max}/hr
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-2">No workers found within 10 miles</div>
                  <div className="text-sm text-muted-foreground">Try adjusting your location or service category</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
