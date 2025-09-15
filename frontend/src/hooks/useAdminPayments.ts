import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  worker_id: string;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  worker_payout: number;
  payment_status: string;
  worker_paid: boolean;
  created_at: string;
  updated_at?: string;
  transaction_id?: string;
  // Joined data
  customer_profiles: {
    first_name: string;
    last_name: string;
  } | null;
  worker_profiles: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  } | null;
  bookings: {
    services: {
      title: string;
    };
  } | null;
  // Transformed properties for UI
  customer?: string;
  worker?: string;
  serviceTitle?: string;
  date?: string;
  totalAmount?: number;
  commissionAmount?: number;
  commissionRate?: number;
  workerPayout?: number;
  transactionId?: string;
  status?: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalCommission: number;
  totalWorkerPayouts: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  averageCommissionRate: number;
  avgCommissionPerJob: number;
}

export const useAdminPayments = (page: number = 1, pageSize: number = 10, searchTerm: string = '', statusFilter: string = 'all', workerPaidFilter: string = 'all', workerId?: string) => {
  const [loading, setLoading] = useState(true);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalCommission: 0,
    totalWorkerPayouts: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    averageCommissionRate: 0,
    avgCommissionPerJob: 0
  });

  const fetchAllPayments = async () => {
    try {
      setLoading(true);

      // Fetch payments from Laravel API
      const { data: paymentsData, error: paymentsError } = await apiClient.getAdminPayments({ worker_id: workerId });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        return;
      }

      // Transform payments data for the UI
      const transformedPayments = paymentsData?.map(payment => ({
        ...payment,
        customer: payment.customer_profiles ? 
          `${payment.customer_profiles.first_name} ${payment.customer_profiles.last_name}` : 
          'Unknown Customer',
        worker: payment.worker_profiles?.profiles ? 
          `${payment.worker_profiles.profiles.first_name} ${payment.worker_profiles.profiles.last_name}` : 
          'Unknown Worker',
        serviceTitle: payment.bookings?.services?.title || 'Unknown Service',
        status: payment.payment_status,
        totalAmount: payment.total_amount || 0,
        commissionAmount: payment.commission_amount || 0,
        commissionRate: payment.commission_rate || 0.15,
        workerPayout: payment.worker_payout || 0,
        transactionId: payment.transaction_id || `TXN-${payment.id.slice(0, 8)}`,
        date: new Date(payment.created_at).toLocaleDateString()
      })) || [];

      setAllPayments(transformedPayments);

      // Calculate stats from all completed payments
      const completedPayments = transformedPayments.filter(p => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalCommission = completedPayments.reduce((sum, p) => sum + p.commissionAmount, 0);
      const totalWorkerPayouts = completedPayments.reduce((sum, p) => sum + p.workerPayout, 0);
      
      const pendingPayments = transformedPayments.filter(p => p.status === 'pending').length;
      const failedPayments = transformedPayments.filter(p => p.status === 'failed').length;
      
      const averageCommissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) : 0;
      const avgCommissionPerJob = completedPayments.length > 0 ? (totalCommission / completedPayments.length) : 0;

      setStats({
        totalRevenue,
        totalCommission,
        totalWorkerPayouts,
        completedPayments: completedPayments.length,
        pendingPayments,
        failedPayments,
        averageCommissionRate,
        avgCommissionPerJob
      });

    } catch (error) {
      console.error('Error in fetchAllPayments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and pagination client-side for optimistic updates
  const applyFilters = () => {
    let filtered = [...allPayments];

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Apply worker paid filter
    if (workerPaidFilter && workerPaidFilter !== 'all') {
      const isPaid = workerPaidFilter === 'paid';
      filtered = filtered.filter(payment => payment.worker_paid === isPaid);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.customer.toLowerCase().includes(searchLower) ||
        payment.worker.toLowerCase().includes(searchLower) ||
        payment.transactionId?.toLowerCase().includes(searchLower) ||
        payment.serviceTitle?.toLowerCase().includes(searchLower)
      );
    }

    const totalFiltered = filtered.length;
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedPayments = filtered.slice(startIndex, startIndex + pageSize);

    setPayments(paginatedPayments);
    setTotalCount(totalFiltered);
  };

  // Load all data on mount and when workerId changes
  useEffect(() => {
    fetchAllPayments();
  }, [workerId]);

  // Apply filters whenever they change
  useEffect(() => {
    if (allPayments.length > 0) {
      applyFilters();
    }
  }, [allPayments, page, pageSize, statusFilter, workerPaidFilter, searchTerm]);

  return {
    loading,
    payments,
    totalCount,
    stats,
    refetch: fetchAllPayments
  };
};