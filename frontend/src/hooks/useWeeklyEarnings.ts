import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export interface DailyEarning {
  day: string;
  amount: number;
  jobs: number;
  date: string;
}

export const useWeeklyEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyEarnings, setWeeklyEarnings] = useState<DailyEarning[]>([]);
  const [totalWeeklyEarnings, setTotalWeeklyEarnings] = useState(0);
  const [totalWeeklyJobs, setTotalWeeklyJobs] = useState(0);

  useEffect(() => {
    if (user) {
      fetchWeeklyEarnings();
    }
  }, [user]);

  const fetchWeeklyEarnings = async () => {
    try {
      setLoading(true);

      // Fetch weekly earnings from backend
      const response = await apiClient.get(`/weekly-earnings/${user?.id}`);
      const data = response.data;

      setWeeklyEarnings(data.weeklyEarnings);
      setTotalWeeklyEarnings(data.totalWeeklyEarnings);
      setTotalWeeklyJobs(data.totalWeeklyJobs);

    } catch (error) {
      console.error('Error fetching weekly earnings:', error);
      // Set empty data on error
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      setWeeklyEarnings(daysOfWeek.map(day => ({ day, amount: 0, jobs: 0, date: '' })));
      setTotalWeeklyEarnings(0);
      setTotalWeeklyJobs(0);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    weeklyEarnings,
    totalWeeklyEarnings,
    totalWeeklyJobs,
    refetch: fetchWeeklyEarnings
  };
};