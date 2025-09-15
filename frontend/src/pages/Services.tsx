import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, Clock, TrendingUp, Users } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface Service {
  id: string;
  title: string;
  description: string;
  price_min: number;
  price_max: number;
  worker_id: string;
  category_id: string;
  duration_hours?: number;
  worker_name?: string;
  category_name?: string;
  is_verified?: boolean;
  rating?: number;
  total_reviews?: number;
  experience_years?: number;
}

const Services = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch services from database
  const fetchServices = async () => {
    try {
      setLoading(true);
      console.log("Fetching services...");

      // Get services from our backend API
      const servicesResponse = await apiClient.get('/public/services?limit=15');
      const servicesData = servicesResponse.data;

      console.log("Fetched services:", servicesData?.length || 0);

      if (servicesData && servicesData.length > 0) {
        // Get worker profiles for these services
        const workerIds = servicesData.map(s => s.worker_id).filter(Boolean);
        const workerProfilesResponse = await apiClient.get('/public/worker-profiles');
        const workerProfiles = workerProfilesResponse.data.filter(wp => workerIds.includes(wp.id));

        // Get profiles for workers
        const profilesResponse = await apiClient.get('/public/profiles');
        const profiles = profilesResponse.data.filter(p => workerIds.includes(p.id));

        // Get categories for services
        const categoryIds = servicesData.map(s => s.category_id).filter(Boolean);
        const categoriesResponse = await apiClient.get('/public/categories');
        const categoriesData = categoriesResponse.data.filter(c => categoryIds.includes(c.id));

        // Create lookup maps
        const workerProfilesMap = new Map(workerProfiles?.map(wp => [wp.id, wp]) || []);
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const categoriesMap = new Map(categoriesData?.map(c => [c.id, c]) || []);

        // Combine all information
        const servicesWithDetails = servicesData.map(service => {
          const workerProfile = workerProfilesMap.get(service.worker_id);
          const profile = profilesMap.get(service.worker_id);
          const category = categoriesMap.get(service.category_id);
          
          return {
            ...service,
            worker_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Worker',
            category_name: category?.name || 'Unknown Category',
            is_verified: workerProfile?.is_verified || false,
            rating: workerProfile?.rating || 0,
            total_reviews: workerProfile?.total_reviews || 0,
            experience_years: workerProfile?.experience_years || 0
          };
        });

        console.log("Services with details:", servicesWithDetails.length);
        setServices(servicesWithDetails);
        setFilteredServices(servicesWithDetails);
      }

    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filtering
  const fetchCategories = async () => {
    try {
      const categoriesResponse = await apiClient.get('/public/categories');
      const categoriesData = categoriesResponse.data;

      const allCategories = [
        { id: "all", name: "All Services" },
        ...(categoriesData || [])
      ];
      setCategories(allCategories);
      console.log("Categories loaded:", allCategories.length);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Filter services based on search and category
  useEffect(() => {
    let filtered = services;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.worker_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter - FIXED: Compare category_id instead of category_name
    if (selectedCategory !== "all") {
      filtered = filtered.filter(service => service.category_id === selectedCategory);
    }

    // Apply price filter
    if (priceRange !== "all") {
      filtered = filtered.filter(service => {
        const avgPrice = (service.price_min + service.price_max) / 2;
        switch (priceRange) {
          case "low":
            return avgPrice <= 60;
          case "medium":
            return avgPrice > 60 && avgPrice <= 100;
          case "high":
            return avgPrice > 100;
          default:
            return true;
        }
      });
    }

    setFilteredServices(filtered);
  }, [searchQuery, selectedCategory, priceRange, services]);

  // Initial data fetch
  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/5 to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold text-foreground">
                  Available Services
                </h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Discover professional services from verified workers
              </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search services or workers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="low">£30-60</SelectItem>
                    <SelectItem value="medium">£60-100</SelectItem>
                    <SelectItem value="high">£100+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            {/* Enhanced Services Available Section */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4 rounded-2xl shadow-lg border border-primary/20 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {filteredServices.length} Services Available
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <p className="text-sm font-medium">
                    {selectedCategory !== "all" 
                      ? `Filtered by: ${categories.find(c => c.id === selectedCategory)?.name}` 
                      : "Showing all available services"
                    }
                  </p>
                </div>
              </div>
            </div>
         
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="worker-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Service Header */}
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{service.title}</h3>
                        <p className="text-muted-foreground">{service.worker_name}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{service.rating?.toFixed(1) || 'New'}</span>
                          <span className="text-sm text-muted-foreground">
                            ({service.total_reviews || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Service Description */}
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {/* Category and Verification */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {service.category_name}
                      </Badge>
                      {service.is_verified && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{service.experience_years ? `${service.experience_years}+ years` : 'Experienced'}</span>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-primary">£{service.price_min}-{service.price_max}/hr</p>
                        <p className="text-xs text-muted-foreground">Per hour</p>
                      </div>
                      <Button className="btn-hero">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground mb-4">
                No services found matching your criteria
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setPriceRange("all");
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Services;