import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface AdminBooking {
  id: string;
  sid?:string;
  customer_id: string;
  worker_id: string;
  service_id: string | null;
  scheduled_date: string;
  duration_hours: number | null;
  total_amount: number | null;
  status: string;
  address: string | null;
  notes: string | null;
  created_at: string;
  commission_rate: number | null;
  commission_amount: number | null;
  worker_payout: number | null;
  
  // Joined data
  customer_name: string;
  worker_name: string;
  service_title: string | null;
  service_category: string | null;
}

export interface BookingFilters {
  search?: string;
  status?: string;
  period?: string;
}

export interface BookingStats {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}

export const useAdminBookings = (
  page: number = 1,
  pageSize: number = 10,
  filters: BookingFilters = {}
) => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [allBookingsCache, setAllBookingsCache] = useState<AdminBooking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0
  });
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Local filter for optimistic UI updates while server fetch is in-flight
  const filterBookings = (allBookings: AdminBooking[], search: string, status: string, period: string) => {
    let filtered = allBookings;

    if (status && status !== 'all') {
      filtered = filtered.filter(booking => booking.status === status);
    }

    if (period && period !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      filtered = filtered.filter(booking => new Date(booking.scheduled_date) >= startDate);
    }

    if (search && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(booking =>
        booking.id.toLowerCase().includes(term) ||
        (booking.service_id && booking.service_id.toLowerCase().includes(term)) ||
        booking.customer_id.toLowerCase().includes(term) ||
        (booking.worker_id && booking.worker_id.toLowerCase().includes(term)) ||
        (booking.address && booking.address.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Build query params
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', String(pageSize));
      if (filters.search) params.set('search', filters.search);
      // Normalize status to backend values
      const normalizeStatus = (s?: string) => {
        if (!s) return s;
        if (s === 'in-progress') return 'in_progress';
        return s;
      };
      if (filters.status) params.set('status', normalizeStatus(filters.status) as string);
      if (filters.period) params.set('period', filters.period);

      const response = await apiClient.get(`/admin/bookings?${params.toString()}`);
      if ((response as any).error) throw (response as any).error;

      const payload = (response as any).data || {};
      const serverBookings: AdminBooking[] = payload.bookings || [];
      setBookings(serverBookings);
      setAllBookingsCache(serverBookings);
      setTotalCount(payload.total || 0);
      if (payload.stats) setStats(payload.stats);

    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch only on mount
  useEffect(() => {
    fetchBookings();
  }, []); // Only fetch once on mount

  // Immediate refetch on page/pageSize/status/period changes
  useEffect(() => {
    updateFiltersOptimistically();
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters.status, filters.period]);

  // Debounced refetch on search changes
  useEffect(() => {
    updateFiltersOptimistically();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchBookings();
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const refetch = () => {
    fetchBookings();
  };

  // Optimistic update functions to prevent reloading
  const updateBookingOptimistically = (bookingId: string, updates: Partial<AdminBooking>) => {
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, ...updates }
          : booking
      )
    );
  };

  const deleteBookingOptimistically = (bookingId: string) => {
    setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
    setTotalCount(prev => prev - 1);
  };

  // Optimistic filtering when search/status/period changes
  const updateFiltersOptimistically = () => {
    if (allBookingsCache.length > 0) {
      const filteredBookings = filterBookings(allBookingsCache, filters.search || '', filters.status || '', filters.period || '');
      const startIndex = (page - 1) * pageSize;
      const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);
      
      setBookings(paginatedBookings);
      setTotalCount(filteredBookings.length);
    }
  };

  return {
    loading,
    bookings,
    totalCount,
    stats,
    refetch,
    updateBookingOptimistically,
    deleteBookingOptimistically,
    updateFiltersOptimistically
  };
};