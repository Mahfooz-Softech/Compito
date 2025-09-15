import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export const useWorkerData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyEarnings: 0,
    monthlyGrossEarnings: 0,
    monthlyCommission: 0,
    jobsCompleted: 0,
    averageRating: 0,
    activeClients: 0,
    category: 'General',
    commissionRate: 0,
    totalReviews: 0,
    newClientsThisMonth: 0,
    jobsThisMonth: 0,
    monthlyGoal: 3000,
    monthlyJobGoal: 20,
    responseRate: 95,
    onTimeRate: 98,
    repeatCustomers: 0,
    monthlyEarningsData: []
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [workerServices, setWorkerServices] = useState([]);
  const [messages, setMessages] = useState({ conversations: [], activeChat: [] });
  const [reviews, setReviews] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Simple fetch function
  const fetchWorkerData = async () => {
    if (!user?.id) {
      console.log('useWorkerData: No user ID, skipping fetch');
      return;
    }
    
    console.log('useWorkerData: Starting data fetch for user:', user.id);
    
    try {
      setLoading(true);

      // Fetch worker data from Laravel API
      const { data: workerData, error } = await apiClient.get(`/worker-data/${user.id}`);

      if (error) {
        console.error('useWorkerData: Error fetching data:', error);
        setLoading(false);
        return;
      }

      console.log('useWorkerData: API response received:', workerData);

      // Extract data from API response
      const {
        stats: apiStats = {},
        recent_jobs = [],
        upcoming_schedule = [],
        worker_profile: profile = null,
        worker_services = [],
        messages = { conversations: [], activeChat: [] },
        reviews = [],
        earnings = [],
        availability = [],
        alerts = [],
        profile_completion = 0
      } = workerData;

      // Transform API stats to match frontend expectations (ensure numbers are numbers)
      const transformedStats = {
        monthlyEarnings: Number(apiStats.monthly_earnings || 0),
        monthlyGrossEarnings: Number(apiStats.monthly_gross_earnings || 0),
        monthlyCommission: Number(apiStats.monthly_commission || 0),
        jobsCompleted: Number(apiStats.completed_jobs || 0),
        averageRating: Number(apiStats.average_rating || 0),
        activeClients: Number(apiStats.active_clients || 0),
        category: apiStats.category || 'General',
        commissionRate: Number(apiStats.commission_rate || 0),
        totalReviews: Number(apiStats.total_reviews || 0),
        newClientsThisMonth: Number(apiStats.new_clients_this_month || 0),
        jobsThisMonth: Number(apiStats.jobs_this_month || 0),
        monthlyGoal: Number(apiStats.monthly_goal || 3000),
        monthlyJobGoal: Number(apiStats.monthly_job_goal || 20),
        responseRate: Number(apiStats.response_rate || 95),
        onTimeRate: Number(apiStats.on_time_rate || 98),
        repeatCustomers: Number(apiStats.repeat_customers || 0),
        monthlyEarningsData: apiStats.monthly_earnings_data || []
      };

      console.log('useWorkerData: Transformed stats:', transformedStats);

      // Set all the data
      setStats(transformedStats);
      setRecentJobs(recent_jobs);
      setUpcomingSchedule(upcoming_schedule);
      setWorkerProfile(profile);
      setWorkerServices(worker_services);
      setMessages(messages);
      setReviews(reviews);
      setEarnings(earnings);
      setAvailability(availability);
      setAlerts(alerts);
      setProfileCompletion(Number(profile_completion || 0));

    } catch (error) {
      console.error('useWorkerData: Error fetching worker data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple useEffect
  useEffect(() => {
    if (user?.id) {
      fetchWorkerData();
    }
  }, [user?.id]);

  return {
    loading,
    stats,
    recentJobs,
    upcomingSchedule,
    workerProfile,
    workerServices,
    messages,
    reviews,
    earnings,
    availability,
    alerts,
    profileCompletion,
    fetchWorkerData
  };
};