import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

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
  worker_profile?: {
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
      created_at: string;
    };
    worker_categories: {
      name: string;
      description: string;
    };
  };
}

export const useAdminAccountActivation = () => {
  const [requests, setRequests] = useState<AccountActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all activation requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await apiClient.get('/admin/account-activation-requests');

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching activation requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  // Process a request (approve/reject)
  const processRequest = async (
    requestId: string, 
    status: 'approved' | 'rejected', 
    adminNotes?: string
  ) => {
    try {
      const { error } = await apiClient.put(`/admin/account-activation-requests/${requestId}`, {
        status,
        admin_notes: adminNotes?.trim() || null,
        processed_at: new Date().toISOString()
      });

      if (error) throw error;

      // Refresh the requests list
      await fetchRequests();
      return true;
    } catch (err) {
      console.error('Error processing request:', err);
      throw err;
    }
  };

  // Get pending requests count
  const getPendingCount = () => {
    return requests.filter(request => request.status === 'pending').length;
  };

  // Get requests by status
  const getRequestsByStatus = (status: 'pending' | 'approved' | 'rejected') => {
    return requests.filter(request => request.status === status);
  };

  // Get request statistics
  const getStatistics = () => {
    const total = requests.length;
    const pending = getPendingCount();
    const approved = getRequestsByStatus('approved').length;
    const rejected = getRequestsByStatus('rejected').length;

    return {
      total,
      pending,
      approved,
      rejected,
      pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0
    };
  };

  // Get worker account status
  const getWorkerAccountStatus = async (workerId: string) => {
    try {
      const { data, error } = await apiClient.get(`/admin/worker-account-status/${workerId}`);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting worker account status:', err);
      return null;
    }
  };

  // Get all deactivated workers
  const getDeactivatedWorkers = async () => {
    try {
      const { data, error } = await apiClient.get('/admin/deactivated-workers');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting deactivated workers:', err);
      return [];
    }
  };

  // Manually deactivate a worker account
  const manuallyDeactivateWorker = async (workerId: string, reason: string) => {
    try {
      const { error } = await apiClient.post('/admin/deactivate-worker', {
        worker_id: workerId,
        reason: reason
      });

      if (error) throw error;

      // Refresh requests
      await fetchRequests();
      return true;
    } catch (err) {
      console.error('Error manually deactivating worker:', err);
      throw err;
    }
  };

  // Manually reactivate a worker account
  const manuallyReactivateWorker = async (workerId: string, reason: string) => {
    try {
      const { error } = await apiClient.post('/admin/reactivate-worker', {
        worker_id: workerId,
        reason: reason
      });

      if (error) throw error;

      // Refresh requests
      await fetchRequests();
      return true;
    } catch (err) {
      console.error('Error manually reactivating worker:', err);
      throw err;
    }
  };

  // Run periodic deactivation check
  const runPeriodicCheck = async () => {
    try {
      const { error } = await apiClient.post('/admin/run-periodic-deactivation-check');
      if (error) throw error;

      // Refresh requests after check
      await fetchRequests();
      return true;
    } catch (err) {
      console.error('Error running periodic check:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    loading,
    error,
    fetchRequests,
    processRequest,
    getPendingCount,
    getRequestsByStatus,
    getStatistics,
    getWorkerAccountStatus,
    getDeactivatedWorkers,
    manuallyDeactivateWorker,
    manuallyReactivateWorker,
    runPeriodicCheck
  };
};
