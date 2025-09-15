import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ServiceRequestFlow } from '@/components/customer/ServiceRequestFlow';
import { useCustomerData } from '@/hooks/useCustomerData';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import { Search, Star, MapPin, Clock, Filter, Heart } from 'lucide-react';

const CustomerBrowse = () => {
  const { loading, allServices, addToFavorites } = useCustomerData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [findWorkersDialog, setFindWorkersDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  // Memoize the fetchCategories function to prevent unnecessary re-renders
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await apiClient.get('/public/categories');
      if (error) throw error;
      const list = Array.isArray(data) ? data : (data as any)?.data || [];
      setCategories(['All', ...(list.map((cat: any) => cat.name) || [])]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Memoize filtered services to prevent unnecessary re-renders
  const filteredServices = useMemo(() => {
    return allServices.filter(service => {
      const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
      
      // Location filtering (simplified for now - in real app would use geolocation)
      const matchesLocation = !locationFilter || 
        service.worker_location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        service.online_available;
      
      const matchesOnlineFilter = !onlineOnly || service.online_available;
      
      return matchesSearch && matchesCategory && matchesLocation && matchesOnlineFilter;
    });
  }, [allServices, searchTerm, selectedCategory, locationFilter, onlineOnly]);
  console.log("Filtered services are ===> ",filteredServices);
  // Memoize handlers to prevent unnecessary re-renders
  const handleFindWorkers = useCallback((service: any) => {
    setSelectedService(service);
    setFindWorkersDialog(true);
  }, []);

  const handleAddToFavorites = useCallback(async (service: any) => {
    try {
      await addToFavorites(service.id, service.worker_id);
      toast({ title: "Success", description: "Added to favorites!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add to favorites", variant: "destructive" });
    }
  }, [addToFavorites, toast]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationFilter(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleOnlineOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setOnlineOnly(e.target.checked);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setFindWorkersDialog(false);
  }, []);

  if (loading) {
    return (
      <DashboardLayout userType="customer" title="Browse Services">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="customer" title="Browse Services">
      <div className="space-y-6">
        {/* Header & Search */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Browse Services</h1>
            <p className="text-muted-foreground">Find the perfect service provider for your needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services or providers..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Location (city, zip code)..."
                value={locationFilter}
                onChange={handleLocationChange}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="online-only"
                checked={onlineOnly}
                onChange={handleOnlineOnlyChange}
                className="w-4 h-4"
              />
              <label htmlFor="online-only" className="text-sm font-medium">
                Online services only
              </label>
            </div>
          </div>
        </div>

        {/* Service Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge 
              key={category} 
              variant={selectedCategory === category ? "default" : "outline"} 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const locationText = service.worker_location 
              || service.workerLocation
              || service.worker?.profile?.location 
              || service.worker_profile?.location
              || service.worker?.location 
              || service.location 
              || service.address
              || service.worker_city 
              || null;
            const ratingValue = service.rating ?? service.avg_rating ?? service.worker?.rating ?? service.worker_profile?.rating ?? 0;
            const reviewsValue = service.reviews_count ?? service.review_count ?? service.total_reviews ?? service.worker?.reviews_count ?? service.worker_profile?.reviews_count ?? 0;
            return (
            <Card key={service.id} className="hover:shadow-lg transition-all duration-300 border-gradient">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-3xl mb-2">🔧</div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">{service.category || 'Service'}</Badge>
                  
                  </div>
                </div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-muted-foreground">by</span>
                  <span className="text-sm font-medium text-primary">{service.provider}</span>
                </div>
                {service.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{service.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{ratingValue}</span>
                    <span className="text-xs text-muted-foreground">({reviewsValue} reviews)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{service.online_available ? 'Online Available' : (locationText || 'Location not set')}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration_hours || 1}h duration</span>
                  </div>
                </div>

                {service.online_available && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      🌐 Online Service
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-primary">
                    ${service.price_min} - ${service.price_max}
                  </div>
                  <Button onClick={() => handleFindWorkers(service)} className="btn-hero">
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No services found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters</p>
            </CardContent>
          </Card>
        )}
      </div>


      {/* Find Workers Flow - Fiverr-style worker discovery */}
      <ServiceRequestFlow
        selectedService={selectedService}
        isOpen={findWorkersDialog}
        onClose={handleCloseDialog}
      />
    </DashboardLayout>
  );
};

export default CustomerBrowse;