import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export interface MonthlyPerformance {
  month: string;
  jobs: number;
  earnings: number;
  growth: number;
}

export interface ServicePerformance {
  service: string;
  bookings: number;
  rating: number;
  totalEarnings: number;
}

export const useWorkerAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalClients: 0,
    jobsCompleted: 0,
    averageRating: 0,
    hourlyRate: 0,
    newClientsThisMonth: 0,
    jobsThisMonth: 0,
    totalReviews: 0,
    hourlyRateChange: 0
  });
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance[]>([]);

  const userId = useMemo(() => user?.id, [user?.id]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/worker-analytics/${userId}`);
      const data: any = response?.data || {};

      setAnalytics({
        totalClients: Number(data.analytics?.totalClients ?? 0),
        jobsCompleted: Number(data.analytics?.jobsCompleted ?? 0),
        averageRating: Number(data.analytics?.averageRating ?? 0),
        hourlyRate: Number(data.analytics?.hourlyRate ?? 0),
        newClientsThisMonth: Number(data.analytics?.newClientsThisMonth ?? 0),
        jobsThisMonth: Number(data.analytics?.jobsThisMonth ?? 0),
        totalReviews: Number(data.analytics?.totalReviews ?? 0),
        hourlyRateChange: Number(data.analytics?.hourlyRateChange ?? 0)
      });
      setMonthlyPerformance(Array.isArray(data.monthlyPerformance) ? data.monthlyPerformance : []);
      setServicePerformance(Array.isArray(data.servicePerformance) ? data.servicePerformance : []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setAnalytics({
        totalClients: 0,
        jobsCompleted: 0,
        averageRating: 0,
        hourlyRate: 0,
        newClientsThisMonth: 0,
        jobsThisMonth: 0,
        totalReviews: 0,
        hourlyRateChange: 0
      });
      setMonthlyPerformance([]);
      setServicePerformance([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAnalyticsData();
    }
  }, [fetchAnalyticsData]);

  return useMemo(() => ({
    loading,
    analytics,
    monthlyPerformance,
    servicePerformance
  }), [loading, analytics, monthlyPerformance, servicePerformance]);
};