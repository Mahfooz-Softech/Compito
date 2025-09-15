import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminAccountActivation } from '@/hooks/useAdminAccountActivation';
import { toast } from 'sonner';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export const AccountActivationDashboard = () => {
  const { 
    loading, 
    getStatistics, 
    getPendingCount, 
    runPeriodicCheck 
  } = useAdminAccountActivation();

  const [runningCheck, setRunningCheck] = useState(false);

  const stats = getStatistics();

  const handleRunCheck = async () => {
    setRunningCheck(true);
    try {
      await runPeriodicCheck();
      toast.success('Periodic deactivation check completed successfully');
    } catch (error) {
      console.error('Error running periodic check:', error);
      toast.error('Failed to run periodic check');
    } finally {
      setRunningCheck(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Action Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Account Activation Overview</h2>
          <p className="text-muted-foreground">
            Monitor worker account activation requests and deactivation status
          </p>
        </div>
        <Button 
          onClick={handleRunCheck} 
          disabled={runningCheck}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${runningCheck ? 'animate-spin' : ''}`} />
          {runningCheck ? 'Running Check...' : 'Run Periodic Check'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingPercentage}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rejected Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-yellow-800">Pending Requests</p>
                <p className="text-sm text-yellow-600">
                  {stats.pending} requests awaiting review
                </p>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {stats.pending}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-800">Periodic Check</p>
                <p className="text-sm text-blue-600">
                  Automatically check for deactivation criteria
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRunCheck}
                disabled={runningCheck}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${runningCheck ? 'animate-spin' : ''}`} />
                Run
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-800">System Active</p>
                <p className="text-sm text-green-600">
                  Automatic deactivation system is running
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-800">Monitoring</p>
                <p className="text-sm text-blue-600">
                  Starter category workers are being monitored
                </p>
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.pending > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {stats.pending} activation request{stats.pending !== 1 ? 's' : ''} pending review
                  </p>
                  <p className="text-sm text-yellow-600">
                    Workers are waiting for account reactivation approval
                  </p>
                </div>
              </div>
            )}
            
            {stats.approved > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {stats.approved} account{stats.approved !== 1 ? 's' : ''} reactivated
                  </p>
                  <p className="text-sm text-green-600">
                    Workers have been successfully reactivated
                  </p>
                </div>
              </div>
            )}
            
            {stats.rejected > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    {stats.rejected} request{stats.rejected !== 1 ? 's' : ''} rejected
                  </p>
                  <p className="text-sm text-red-600">
                    Reactivation requests were not approved
                  </p>
                </div>
              </div>
            )}
            
            {stats.total === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activation requests yet</p>
                <p className="text-sm">The system will automatically detect workers meeting deactivation criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
