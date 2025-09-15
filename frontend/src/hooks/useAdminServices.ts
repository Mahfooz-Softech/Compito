import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Service {
  id: string;
  title: string;
  description: string;
  price_min: number;
  price_max: number;
  duration_hours: number;
  worker_id: string;
  category_id: string;
  categories: { name: string } | null;
  worker_profiles: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  } | null;
  // Transformed properties
  worker?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  duration?: number;
}

interface ServiceStats {
  totalServices: number;
  totalCategories: number;
  avgServiceValue: number;
  activeProviders: number;
}

interface CategoryPerformance {
  name: string;
  serviceCount: number;
  workerCount: number;
  revenue: number;
  commission: number;
  color: string;
}

interface AdminTotals {
  totalRevenue: number;
  totalCommission: number;
}

export const useAdminServices = (page: number = 1, pageSize: number = 10, searchTerm: string = '', selectedCategory: string = '') => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [allServicesCache, setAllServicesCache] = useState<Service[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<ServiceStats>({
    totalServices: 0,
    totalCategories: 0,
    avgServiceValue: 0,
    activeProviders: 0
  });
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [adminTotals, setAdminTotals] = useState<AdminTotals>({ totalRevenue: 0, totalCommission: 0 });
  const [availableCategories, setAvailableCategories] = useState<Array<{id: string; name: string}>>([]);

  // Client-side filtering function
  const filterServices = (allServices: Service[], search: string, category: string) => {
    let filtered = allServices;
    
    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(search.toLowerCase()) ||
        service.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply category filter
    if (category && category !== 'all') {
      filtered = filtered.filter(service => service.category === category);
    }
    
    return filtered;
  };

  const fetchServices = async () => {
    try {
      setLoading(true);

      // Fetch from Laravel backend (pre-joined data + stats)
      const response = await apiClient.get('/admin/services?stats=true');
      const payload = (response as any).data || {};
      const transformedServices = (payload.data || []) as Service[];

      // Cache all services for client-side filtering
      setAllServicesCache(transformedServices);

      // Apply client-side filtering and pagination
      const filteredServices = filterServices(transformedServices, searchTerm, selectedCategory);
      const startIndex = (page - 1) * pageSize;
      const paginatedServices = filteredServices.slice(startIndex, startIndex + pageSize);
      
      setServices(paginatedServices);
      setTotalCount(filteredServices.length);

      // Backend-provided aggregates and filters
      console.log('Backend payload:', payload);
      console.log('Available categories from backend:', payload.availableCategories);
      
      if (payload.stats) setStats(payload.stats);
      if (payload.categoryPerformance) setCategoryPerformance(payload.categoryPerformance);
      if (payload.adminTotals) setAdminTotals(payload.adminTotals);
      if (payload.availableCategories) setAvailableCategories(payload.availableCategories);

    } catch (error) {
      console.error('Error in fetchServices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic filtering when search/category changes
  const updateFiltersOptimistically = () => {
    if (allServicesCache.length > 0) {
      const filteredServices = filterServices(allServicesCache, searchTerm, selectedCategory);
      const startIndex = (page - 1) * pageSize;
      const paginatedServices = filteredServices.slice(startIndex, startIndex + pageSize);
      
      setServices(paginatedServices);
      setTotalCount(filteredServices.length);
    }
  };

  const updateServiceOptimistically = (serviceId: string, updates: Partial<Service>) => {
    setServices(prevServices => 
      prevServices.map(service => 
        service.id === serviceId ? { ...service, ...updates } : service
      )
    );
  };

  const deleteServiceOptimistically = (serviceId: string) => {
    setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
    setTotalCount(prev => prev - 1);
  };

  // Initial fetch only on mount
  useEffect(() => {
    fetchServices();
  }, []); // Only fetch once on mount

  // Handle optimistic filtering when search/category changes
  useEffect(() => {
    updateFiltersOptimistically();
  }, [searchTerm, selectedCategory, page]); // Optimistic updates for filters and pagination

  return {
    loading,
    services,
    totalCount,
    stats,
    categoryPerformance,
    adminTotals,
    availableCategories,
    updateServiceOptimistically,
    deleteServiceOptimistically,
    updateFiltersOptimistically,
    refetch: fetchServices
  };
};