import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

type Stats = {
  totalUsers: number;
  totalCustomers: number;
  totalWorkers: number;
  newThisMonth: number;
  totalRevenue: number;
  totalProfit: number;
  workerPayouts?: number;
  activeBookings: number;
  completedBookings: number;
  totalBookings?: number;
  growthRate: number;
};

type PlatformStats = {
  jobsCompleted: number;
  activeWorkers: number;
  customerSatisfaction: number;
  platformFees: number;
  workerPayouts?: number;
  totalCategories: number;
  avgRating: number;
};

export const useAdminData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [lastDataHash, setLastDataHash] = useState<string>('');

  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalWorkers: 0,
    newThisMonth: 0,
    totalRevenue: 0,
    totalProfit: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalBookings: 0,
    growthRate: 0,
  });

  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    jobsCompleted: 0,
    activeWorkers: 0,
    customerSatisfaction: 96,
    platformFees: 0,
    totalCategories: 0,
    avgRating: 4.8,
  });

  const [recentWorkers, setRecentWorkers] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [workerCategories, setWorkerCategories] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [commissionSettings, setCommissionSettings] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);

  const debouncedFetch = useCallback((delay: number = 1000) => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchAdminData();
    }, delay);
  }, []);

  useEffect(() => {
    if (user && !isInitialized) {
      fetchAdminData();
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  useEffect(() => {
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFetchTime > 300000) debouncedFetch(500);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [lastFetchTime, debouncedFetch]);

  const manualRefresh = useCallback(async () => {
    setLoading(true);
    await fetchAdminData();
  }, []);

  useEffect(() => () => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
  }, []);

  const fetchAdminData = async () => {
    try {
      const now = Date.now();
      if (now - lastFetchTime < 30000 && isInitialized) return;

      setLoading(true);
      const response = await apiClient.get('/admin/data');
      if (response.error) {
        console.error('Admin data error:', response.error);
        return;
      }

      const data = (response.data || {}) as any;

      setStats({
        totalUsers: data.stats?.totalUsers ?? 0,
        totalCustomers: data.stats?.totalCustomers ?? 0,
        totalWorkers: data.stats?.totalWorkers ?? 0,
        newThisMonth: data.stats?.newThisMonth ?? 0,
        totalRevenue: data.stats?.totalRevenue ?? 0,
        totalProfit: data.stats?.totalProfit ?? 0,
        activeBookings: data.stats?.activeBookings ?? 0,
        completedBookings: data.stats?.completedBookings ?? 0,
        totalBookings: data.stats?.totalBookings ?? 0,
        growthRate: data.stats?.growthRate ?? 0,
        workerPayouts: data.stats?.workerPayouts ?? 0,
      });
      
      setPlatformStats({
        jobsCompleted: data.platformStats?.jobsCompleted ?? 0,
        activeWorkers: data.platformStats?.activeWorkers ?? 0,
        customerSatisfaction: data.platformStats?.customerSatisfaction ?? 96,
        platformFees: data.platformStats?.platformFees ?? 0,
        workerPayouts: data.platformStats?.workerPayouts ?? 0,
        totalCategories: data.platformStats?.totalCategories ?? 0,
        avgRating: data.platformStats?.avgRating ?? 4.8,
      });

      setAllUsers(data.users || []);
      setAllCustomers(data.customers || []);
      setAllWorkers(data.workers || []);
      setAllServices(data.services || []);
      setAllBookings(data.bookings || []);
      setAllPayments(data.payments || []);
      setAllReviews(data.reviews || []);
      setServiceCategories(data.categories || []);
      setWorkerCategories(data.workerCategories || []);
      setCommissionSettings(data.commissionSettings || []);

      setRecentWorkers((data.workers || []).slice(0, 10));
      setRecentBookings((data.bookings || []).slice(0, 10));

      const alerts: any[] = [];
      if ((data.workers || []).some((w: any) => w.status === 'pending')) {
        alerts.push({ id: 'pending-workers', type: 'warning', message: 'Workers pending verification', action: 'Review', link: '/admin/workers?filter=pending' });
      }
      setSystemAlerts(alerts);

      setDataVersion((p) => p + 1);
      setLastDataHash(Date.now().toString());
      setLastFetchTime(Date.now());
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkersWithPagination = async (
    page: number = 0,
    pageSize: number = 10,
    filters: any = {}
  ) => {
    setWorkersLoading(true);
    try {
      const res = await apiClient.post('/admin/workers-pagination', { page, pageSize, filters });
      return {
        data: res.data?.data || [],
        totalCount: res.data?.totalCount || 0,
        page: res.data?.page ?? page,
        pageSize: res.data?.pageSize ?? pageSize,
        totalPages: res.data?.totalPages || 0,
      };
    } catch (e) {
      console.error('Error fetching workers with pagination:', e);
      return { data: [], totalCount: 0, totalPages: 0 };
    } finally {
      setWorkersLoading(false);
    }
  };

  const verifyWorker = async (workerId: string) => {
    try {
      const res = await apiClient.post(`/admin/workers/${workerId}/verify`);
      return { success: true, message: res.data?.message || 'Worker verified' };
    } catch (e: any) {
      console.error('verifyWorker failed:', e);
      return { success: false, message: e?.message || 'Failed to verify worker' };
    }
  };

  const rejectWorker = async (workerId: string) => {
    try {
      const res = await apiClient.post(`/admin/workers/${workerId}/reject`);
      return { success: true, message: res.data?.message || 'Worker rejected' };
    } catch (e: any) {
      console.error('rejectWorker failed:', e);
      return { success: false, message: e?.message || 'Failed to reject worker' };
    }
  };

  return {
    loading,
    workersLoading,
    stats,
    recentWorkers,
    recentBookings,
    allUsers,
    allWorkers,
    allCustomers,
    allServices,
    allPayments,
    allReviews,
    allBookings,
    allWorkerCategories: workerCategories,
    allServiceCategories: serviceCategories,
    allCommissionSettings: commissionSettings,
    workerCategories,
    platformStats,
    systemAlerts,
    refetch: fetchAdminData,
    manualRefresh,
    dataVersion,
    lastDataHash,
    lastFetchTime,
    fetchWorkersWithPagination,
    verifyWorker,
    rejectWorker,
  };
};