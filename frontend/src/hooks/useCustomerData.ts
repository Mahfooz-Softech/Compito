import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export const useCustomerData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    favoriteWorkers: 0,
    averageRating: 4.8
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recommendedServices, setRecommendedServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [messages, setMessages] = useState({ conversations: [], activeChat: [] });
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Simple fetch function
  const fetchCustomerData = async () => {
    if (!user?.id) {
      console.log('useCustomerData: No user ID, skipping fetch');
      return;
    }
    
    console.log('useCustomerData: Starting data fetch for user:', user.id);
    
    try {
      setLoading(true);

      // Fetch customer data from Laravel API
      const { data: customerData, error } = await apiClient.get(`/customer-data/${user.id}`);

      if (error) {
        console.error('useCustomerData: Error fetching data:', error);
        setLoading(false);
        return;
      }

      // Extract data from API response
      const {
        stats: apiStats = {},
        recentBookings = [],
        upcomingBookings = [],
        recommendedServices = [],
        allServices = [],
        favorites = [],
        messages = { conversations: [], activeChat: [] },
        payments = [],
        reviews = [],
        profile: userProfile = null,
        alerts = []
      } = customerData;

      // Set all the data
      setStats(apiStats);
      setRecentBookings(recentBookings);
      setUpcomingBookings(upcomingBookings);
      setRecommendedServices(recommendedServices);
      setAllServices(allServices);
      setFavorites(favorites);
      setMessages(messages);
      setPayments(payments);
      setReviews(reviews);
      setProfile(userProfile);
      setAlerts(alerts);

    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple useEffect
  useEffect(() => {
    if (user?.id) {
      fetchCustomerData();
    }
  }, [user?.id]);

  // Simple functions for data operations
  const bookService = async (serviceId: string, scheduledDate: string, address: string, notes?: string) => {
    try {
      const { data, error } = await apiClient.post('/bookings', {
        service_id: serviceId,
        scheduled_date: scheduledDate,
        address,
        notes
      });
      if (error) throw error;
      await fetchCustomerData(); // Refresh data
      return data;
    } catch (error) {
      console.error('Error booking service:', error);
      throw error;
    }
  };

  const addToFavorites = async (serviceId: string) => {
    try {
      const { data, error } = await apiClient.post('/favorites', { service_id: serviceId });
      if (error) throw error;
      await fetchCustomerData(); // Refresh data
      return data;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  };

  const removeFromFavorites = async (serviceId: string) => {
    try {
      const { error } = await apiClient.delete(`/favorites/${serviceId}`);
      if (error) throw error;
      await fetchCustomerData(); // Refresh data
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  };

  const sendMessage = async (workerId: string, message: string) => {
    try {
      const { data, error } = await apiClient.post('/messages', {
        worker_id: workerId,
        message
      });
      if (error) throw error;
      await fetchCustomerData(); // Refresh data
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const createReview = async (bookingId: string, rating: number, comment: string) => {
    try {
      const { data, error } = await apiClient.post('/reviews', {
        booking_id: bookingId,
        rating,
        comment
      });
      if (error) throw error;
      await fetchCustomerData(); // Refresh data
      return data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      const { data, error } = await apiClient.put('/auth/profile', profileData);
      if (error) throw error;
      await fetchCustomerData(); // Refresh data
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return {
    loading,
    stats,
    recentBookings,
    upcomingBookings,
    recommendedServices,
    allServices,
    favorites,
    messages,
    payments,
    reviews,
    profile,
    alerts,
    bookService,
    addToFavorites,
    removeFromFavorites,
    sendMessage,
    createReview,
    updateProfile
  };
};