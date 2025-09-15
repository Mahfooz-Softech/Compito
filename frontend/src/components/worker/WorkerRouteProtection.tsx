import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { UserX, Home } from 'lucide-react';
import { DeactivatedWorkerLayout } from './DeactivatedWorkerLayout';
import { toast } from 'sonner';

interface WorkerRouteProtectionProps {
  children: React.ReactNode;
}

export const WorkerRouteProtection: React.FC<WorkerRouteProtectionProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccountStatus();
  }, [user]);

  const checkAccountStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if worker account is deactivated
      const response = await apiClient.get(`/worker-account-status/${user.id}`);
      
      if (response.error) {
        console.error('Error checking account status:', response.error);
        // If no status record exists, account is active by default
        setIsDeactivated(false);
        setLoading(false);
        return;
      }

      // If no status record exists, account is active by default
      const isActive = response.data?.is_active ?? true;
      setIsDeactivated(!isActive);
      setLoading(false);

      // If deactivated and not on dashboard, redirect to dashboard
      if (!isActive && location.pathname !== '/worker') {
        navigate('/worker');
        toast.error('Your account has been deactivated. Please contact support.');
      }
    } catch (error) {
      console.error('Error checking account status:', error);
      // If no status record exists, account is active by default
      setIsDeactivated(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking account status...</p>
        </div>
      </div>
    );
  }

  // If account is deactivated and trying to access non-dashboard routes, show restriction message
  if (isDeactivated && location.pathname !== '/worker') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-200 bg-red-50">
            <UserX className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Account Deactivated</h3>
                <p className="text-sm mb-4">
                  Your account has been deactivated. You can only access the dashboard at this time.
                </p>
                <Button 
                  onClick={() => navigate('/worker')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // If account is deactivated and on dashboard, use special layout without sidebar
  if (isDeactivated && location.pathname === '/worker') {
    return <DeactivatedWorkerLayout>{children}</DeactivatedWorkerLayout>;
  }

  // If account is active, render children normally
  return <>{children}</>;
};
