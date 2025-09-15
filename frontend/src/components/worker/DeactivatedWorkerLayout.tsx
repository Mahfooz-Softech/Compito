import React, { createContext, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserX, Home, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { AccountStatusBanner } from './AccountStatusBanner';
import { useAuth } from '@/contexts/AuthContext';

// Context to indicate we're in deactivated layout
const DeactivatedLayoutContext = createContext(false);

export const useDeactivatedLayout = () => useContext(DeactivatedLayoutContext);

interface DeactivatedWorkerLayoutProps {
  children: React.ReactNode;
}

export const DeactivatedWorkerLayout: React.FC<DeactivatedWorkerLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <DeactivatedLayoutContext.Provider value={true}>
      <div className="min-h-screen bg-gray-50">
      {/* Header for deactivated workers */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Worker Dashboard</h1>
              <p className="text-sm text-red-600">Account Deactivated</p>
            </div>
          </div>
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Deactivated
          </Badge>
        </div>
      </header>

      {/* Main content area */}
      <main className="container mx-auto px-4 py-6">
        {/* Account Status Banner */}
        {user && <AccountStatusBanner workerId={user.id} />}
        
        {/* Dashboard content */}
        <div className="space-y-6">
          {/* Deactivation Notice */}
          <Alert className="border-red-200 bg-red-50">
            <UserX className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div>
                <strong>Account Access Restricted</strong>
                <p className="text-sm mt-1">
                  Your account has been deactivated. You can only view your dashboard information.
                  All navigation features and other pages have been disabled.
                </p>
                <div className="mt-2 text-xs text-red-700">
                  <strong>Available:</strong> View dashboard stats, earnings, and account status
                  <br />
                  <strong>Disabled:</strong> Services, bookings, messages, settings, and all other features
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Dashboard content */}
          {children}
        </div>
      </main>
      </div>
    </DeactivatedLayoutContext.Provider>
  );
};
