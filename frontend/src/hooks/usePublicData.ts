import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

export const usePublicData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 50000,
    averageRating: 4.9,
    verifiedWorkers: 100,
    support247: true
  });
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      setLoading(true);

      // Fetch services grouped by categories
      const { data: servicesData, error: servicesError } = await apiClient.getServices({ limit: 50 });

      if (servicesError) throw servicesError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await apiClient.getCategories();

      if (categoriesError) throw categoriesError;

      // Fetch general stats
      const { data: profilesData, error: profilesError } = await apiClient.getProfiles();

      if (profilesError) throw profilesError;

      const { data: reviewsData, error: reviewsError } = await apiClient.getReviews();

      if (reviewsError) throw reviewsError;

      const { data: workersData, error: workersError } = await apiClient.getWorkerProfiles();

      if (workersError) throw workersError;

      // Process data
      const customerCount = profilesData?.filter(p => p.user_type === 'customer').length || 0;
      const avgRating = reviewsData?.length > 0 
        ? (reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length)
        : 4.9;
      const verifiedPercent = workersData?.length > 0
        ? Math.round((workersData.filter(w => w.is_verified).length / workersData.length) * 100)
        : 100;

      // Group services by category
      const categoryMap = new Map();
      categoriesData?.forEach(cat => {
        categoryMap.set(cat.id, {
          ...cat,
          services: [],
          workers: 0,
          avgPrice: { min: 0, max: 0 }
        });
      });

      servicesData?.forEach(service => {
        const category = categoryMap.get(service.category_id);
        if (category) {
          category.services.push(service);
          category.workers += 1;
          if (category.avgPrice.min === 0 || service.price_min < category.avgPrice.min) {
            category.avgPrice.min = service.price_min;
          }
          if (service.price_max > category.avgPrice.max) {
            category.avgPrice.max = service.price_max;
          }
        }
      });

      setStats({
        totalCustomers: Math.max(customerCount, 50000), // Show at least 50k for marketing
        averageRating: Number(avgRating.toFixed(1)),
        verifiedWorkers: verifiedPercent,
        support247: true
      });

      setServices(servicesData || []);
      setCategories(Array.from(categoryMap.values()).filter(cat => cat.services.length > 0));

    } catch (error) {
      console.error('Error fetching public data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    stats,
    services,
    categories,
    refetch: fetchPublicData
  };
};