import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';

interface DashboardStats {
  overview: {
    total_bookings: number;
    completed_bookings: number;
    pending_bookings: number;
    cancelled_bookings: number;
    total_spent: number;
    average_rating: number;
    total_reviews: number;
  };
  service_requests: {
    total_requests: number;
    pending_requests: number;
    responded_requests: number;
  };
  offers: {
    total_offers: number;
    pending_offers: number;
    accepted_offers: number;
  };
  recent_activity: {
    recent_bookings: number;
    recent_service_requests: number;
    unread_notifications: number;
  };
  monthly_spending: Array<{
    month: string;
    amount: number;
  }>;
  top_services: Array<{
    title: string;
    id: string;
    usage_count: number;
    total_spent: number;
  }>;
  recent_bookings_details: Array<{
    id: string;
    service_title: string;
    worker_name: string;
    total_amount: number;
    status: string;
    scheduled_date: string;
    created_at: string;
  }>;
  rating_distribution: {
    [key: number]: number;
  };
}

interface ChartData {
  booking_status_distribution: { [key: string]: number };
  service_category_distribution: Array<{
    name: string;
    count: number;
    total_spent: number;
  }>;
  weekly_activity: Array<{
    week: string;
    bookings: number;
    service_requests: number;
  }>;
  yearly_spending: Array<{
    month: string;
    year: string;
    amount: number;
  }>;
}

interface ActivityItem {
  type: 'booking' | 'service_request' | 'offer';
  id: string;
  title: string;
  description: string;
  amount?: number;
  date: string;
  status: string;
}

interface DashboardData {
  stats: DashboardStats | null;
  charts: ChartData | null;
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel using the API client (handles auth token)
      const [statsRes, chartsRes, activitiesRes] = await Promise.all([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/dashboard/charts'),
        apiClient.get('/dashboard/activity'),
      ]);

      if (statsRes.error || chartsRes.error || activitiesRes.error) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = statsRes.data as any;
      const chartsData = chartsRes.data as any;
      const activitiesData = activitiesRes.data as any;

      if (statsData?.success) {
        setStats(statsData.stats);
      }
      if (chartsData?.success) {
        setCharts(chartsData.charts);
      }
      if (activitiesData?.success) {
        setActivities(activitiesData.activities);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  return {
    stats,
    charts,
    activities,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};
