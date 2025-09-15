import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

interface WorkerAccountStatus {
  is_active: boolean;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  reactivated_at: string | null;
  reactivation_reason: string | null;
}

interface AccountActivationRequest {
  id: string;
  worker_id: string;
  request_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useWorkerAccountStatus = () => {
  const { user } = useAuth();
  const [accountStatus, setAccountStatus] = useState<WorkerAccountStatus | null>(null);
  const [activationRequest, setActivationRequest] = useState<AccountActivationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch worker account status
  const fetchAccountStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch worker account status from backend
      const response = await apiClient.get(`/worker-account-status/${user.id}`);
      const data = response.data;

      setAccountStatus(data.accountStatus);
      setActivationRequest(data.activationRequest);

    } catch (err) {
      console.error('Error fetching account status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch account status');
    } finally {
      setLoading(false);
    }
  };

  // Create account activation request
  const createActivationRequest = async (reason: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await apiClient.post('/account-activation-requests', {
        worker_id: user.id,
        request_reason: reason,
        status: 'pending'
      });

      const data = response.data;
      setActivationRequest(data);
      return data;
    } catch (err) {
      console.error('Error creating activation request:', err);
      throw err;
    }
  };

  // Check if worker can perform actions
  const canPerformAction = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await apiClient.get(`/worker-can-perform-action/${user.id}`);
      return response.data.canPerformAction || false;
    } catch (err) {
      console.error('Error checking worker permissions:', err);
      return false;
    }
  };

  // Get account age in months
  const getAccountAgeInMonths = (): number => {
    if (!user?.created_at) return 0;

    const createdDate = new Date(user.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    
    return diffMonths;
  };

  // Get unique customers count
  const getUniqueCustomersCount = async (): Promise<number> => {
    if (!user) return 0;

    try {
      const response = await apiClient.get(`/worker-unique-customers-count/${user.id}`);
      return response.data.count || 0;
    } catch (err) {
      console.error('Error getting unique customers count:', err);
      return 0;
    }
  };

  // Get worker category info
  const getWorkerCategoryInfo = async () => {
    if (!user) return null;

    try {
      const response = await apiClient.get(`/worker-category-info/${user.id}`);
      return response.data;
    } catch (err) {
      console.error('Error getting worker category info:', err);
      return null;
    }
  };

  // Check if worker meets deactivation criteria
  const checkDeactivationCriteria = async (): Promise<{
    shouldDeactivate: boolean;
    reason: string;
    monthsSinceCreation: number;
    uniqueCustomers: number;
    categoryName: string;
  }> => {
    if (!user) {
      return {
        shouldDeactivate: false,
        reason: '',
        monthsSinceCreation: 0,
        uniqueCustomers: 0,
        categoryName: ''
      };
    }

    try {
      const response = await apiClient.get(`/worker-deactivation-criteria/${user.id}`);
      return response.data;
    } catch (err) {
      console.error('Error checking deactivation criteria:', err);
      return {
        shouldDeactivate: false,
        reason: 'Error checking criteria',
        monthsSinceCreation: 0,
        uniqueCustomers: 0,
        categoryName: ''
      };
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccountStatus();
    }
  }, [user]);

  return {
    accountStatus,
    activationRequest,
    loading,
    error,
    fetchAccountStatus,
    createActivationRequest,
    canPerformAction,
    getAccountAgeInMonths,
    getUniqueCustomersCount,
    getWorkerCategoryInfo,
    checkDeactivationCriteria,
    isAccountActive: accountStatus?.is_active ?? true
  };
};
