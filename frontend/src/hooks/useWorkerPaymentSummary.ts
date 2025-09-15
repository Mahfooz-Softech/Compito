import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface WorkerPaymentSummary {
  worker_id: string;
  worker_name: string;
  category: string;
  total_services: number;
  total_customers: number;
  total_amount: number;
  total_commission: number;
  required_payout: number; // amount still to be paid (worker_paid = false)
  paid_amount: number; // amount already paid (worker_paid = true)
}

export const useWorkerPaymentSummary = (currentPage: number = 1, pageSize: number = 10, searchTerm: string = '') => {
  const [loading, setLoading] = useState(true);
  const [workerSummaries, setWorkerSummaries] = useState<WorkerPaymentSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchWorkerSummaries = async () => {
    try {
      setLoading(true);

      // Fetch worker payment summaries from Laravel API
      const response = await apiClient.get(`/worker-payment-summary?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(searchTerm)}`);
      
      if (response.error) {
        console.error('Error fetching worker payment summaries:', response.error);
        return;
      }

      const data = response.data as any;
      setWorkerSummaries(data.workerSummaries || []);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerSummaries();
  }, [currentPage, pageSize, searchTerm]);

  return {
    loading,
    workerSummaries,
    totalCount,
    refetch: fetchWorkerSummaries
  };
};