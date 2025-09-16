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
    if (user?.id) {
      fetchWeeklyEarnings();
    }
  }, [user?.id]);

  const fetchWeeklyEarnings = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get(`/weekly-earnings/${user?.id}`);
      const payload = response.data;
      const we = payload?.weeklyEarnings || {};
      const daily = Array.isArray(we.daily_breakdown) ? we.daily_breakdown : [];

      setWeeklyEarnings(
        daily.map((d: any) => ({
          day: d.day,
          amount: Number(d.earnings || 0),
          jobs: Number(d.jobs || 0),
          date: d.date || ''
        }))
      );
      setTotalWeeklyEarnings(Number(we.total || 0));
      setTotalWeeklyJobs(Number(we.jobs || 0));

    } catch (error) {
      console.error('Error fetching weekly earnings:', error);
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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