import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export interface EarningRecord {
  id: string;
  bookingId: string;
  service: string;
  amount: number; // worker payout
  grossAmount: number; // total amount
  commissionAmount: number;
  commissionRate: number;
  date: string;
  duration: string;
  status: string;
  customer: string;
  isPending: boolean;
}

export const useWorkerEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    average: 0,
    jobsThisMonth: 0,
    lastMonthTotal: 0
  });
  const [recentEarnings, setRecentEarnings] = useState<EarningRecord[]>([]);

  useEffect(() => {
    if (user) {
      fetchEarningsData();
    }
  }, [user]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get(`/worker-earnings/${user?.id}`);
      const data: any = response?.data || {};

      const safe = {
        total: Number(data.earnings?.total_earnings ?? data.earnings?.total_amount ?? 0),
        thisMonth: Number(data.earnings?.current_month_earnings ?? 0),
        average: Number(data.earnings?.current_month_earnings ?? 0),
        jobsThisMonth: 0,
        lastMonthTotal: Number(data.earnings?.last_month_earnings ?? 0)
      };
      setEarnings(safe);

      // Prefer new 'transactions' field, fallback to 'recent_transactions'
      const tx = Array.isArray(data.transactions)
        ? data.transactions
        : (Array.isArray(data.recent_transactions) ? data.recent_transactions : []);

      const transformedRecentEarnings: EarningRecord[] = tx.map((t: any) => ({
        id: String(t.id),
        bookingId: String(t.booking_id || t.id),
        service: t.service_title || 'Unknown Service',
        amount: Number(t.worker_payout ?? t.amount ?? 0),
        grossAmount: Number(t.total_amount ?? t.amount ?? 0),
        commissionAmount: Number(t.commission_amount ?? 0),
        commissionRate: Number(t.commission_rate ?? 0),
        date: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A',
        duration: 'N/A',
        status: t.payment_status || t.status || 'completed',
        customer: t.customer_name || 'Customer',
        isPending: (t.payment_status || t.status) === 'pending'
      }));

      setRecentEarnings(transformedRecentEarnings);

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      setEarnings({ total: 0, thisMonth: 0, average: 0, jobsThisMonth: 0, lastMonthTotal: 0 });
      setRecentEarnings([]);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthPercentage = () => {
    if (earnings.lastMonthTotal === 0) return '+100%';
    if (earnings.thisMonth === 0) return '0%';
    const growth = ((earnings.thisMonth - earnings.lastMonthTotal) / earnings.lastMonthTotal) * 100;
    return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
  };

  return {
    loading,
    earnings,
    recentEarnings,
    getGrowthPercentage,
    refetch: fetchEarningsData
  };
};

// Weekly earnings hook for dashboard remains unchanged
export const useWeeklyEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyEarnings, setWeeklyEarnings] = useState({
    total: 0,
    jobs: 0,
    average: 0
  });

  useEffect(() => {
    if (user) {
      fetchWeeklyEarnings();
    }
  }, [user]);

  const fetchWeeklyEarnings = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get(`/weekly-earnings/${user?.id}`);
      const data: any = response?.data || {};

      const weeklyData = data.weeklyEarnings || {};

      setWeeklyEarnings({
        total: Number(weeklyData.total || 0),
        jobs: Number(weeklyData.jobs || 0),
        average: Number(weeklyData.average || 0)
      });

    } catch (error) {
      console.error('Error fetching weekly earnings:', error);
      setWeeklyEarnings({ total: 0, jobs: 0, average: 0 });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    weeklyEarnings,
    totalWeeklyEarnings: weeklyEarnings.total,
    totalWeeklyJobs: weeklyEarnings.jobs,
    refetch: fetchWeeklyEarnings
  };
};