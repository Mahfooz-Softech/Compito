import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WorkerProfileDrawer } from '@/components/admin/WorkerProfileDrawer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Eye,
  Shield,
  UserCheck,
  UserX,
  Calendar
} from 'lucide-react';

interface WorkerAccount {
  worker_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  category_name: string;
  category_description: string;
  is_active: boolean;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  reactivated_at: string | null;
  reactivation_reason: string | null;
  last_activity_check: string | null;
  months_since_creation: number;
  unique_customers_count: number;
  risk_level?: string;
  risk_details?: string;
}

export const WorkerAccountManagement = () => {
  const [workers, setWorkers] = useState<WorkerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<WorkerAccount | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'deactivated' | 'high-risk' | 'medium-risk' | 'low-risk' | 'no-risk'>('all');
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [selectedWorkerForProfile, setSelectedWorkerForProfile] = useState<string | null>(null);

  const formatAccountAge = (createdAt: string | null | undefined) => {
    if (!createdAt) return 'N/A';
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - created);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day; // approx
    const year = 365 * day; // approx

    if (diffMs < hour) {
      const mins = Math.round(diffMs / minute);
      return `${mins} minute${mins === 1 ? '' : 's'}`;
    }
    if (diffMs < day) {
      const hrs = Math.round(diffMs / hour);
      return `${hrs} hour${hrs === 1 ? '' : 's'}`;
    }
    if (diffMs < month) {
      const days = Math.round(diffMs / day);
      return `${days} day${days === 1 ? '' : 's'}`;
    }
    if (diffMs < year) {
      const months = Math.round(diffMs / month);
      return `${months} month${months === 1 ? '' : 's'}`;
    }
    const years = Math.round(diffMs / year);
    return `${years} year${years === 1 ? '' : 's'}`;
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching workers from worker_profiles table...');
      
      // Fetch workers directly from worker_profiles table
      const { data: workerProfiles, error: workerError } = await supabase
        .from('worker_profiles')
        .select(`
          id,
          category_id,
          completed_jobs
        `);

      if (workerError) {
        console.error('Error fetching worker profiles:', workerError);
        throw workerError;
      }

      // Get profile data for workers
      const workerIds = workerProfiles?.map(wp => wp.id) || [];
      if (workerIds.length === 0) {
        setWorkers([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at, user_type')
        .in('id', workerIds)
        .eq('user_type', 'worker');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Get category data
      const categoryIds = workerProfiles?.map(wp => wp.category_id).filter(Boolean) || [];
      const { data: categories, error: categoriesError } = await supabase
        .from('worker_categories')
        .select('id, name, description')
        .in('id', categoryIds);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      // Get account status for workers (if table exists)
      let accountStatuses: any[] = [];
      try {
        const { data: statusData, error: statusError } = await supabase
          .from('worker_account_status' as any)
          .select('worker_id, is_active, deactivated_at, deactivation_reason, reactivated_at, reactivation_reason, last_activity_check')
          .in('worker_id', workerIds);

        if (statusError) {
          console.error('Error fetching account statuses:', statusError);
          // Continue without status data
        } else {
          accountStatuses = statusData || [];
        }
      } catch (error) {
        console.log('worker_account_status table not available yet, continuing without status data');
      }

      // Transform data to match expected format
      const transformedData = profiles?.map(profile => {
        const workerProfile = workerProfiles?.find(wp => wp.id === profile.id);
        const category = categories?.find(cat => cat.id === workerProfile?.category_id);
        const accountStatus = accountStatuses?.find(as => as.worker_id === profile.id);
        
        const monthsSinceCreation = Math.floor(
          (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        
        const completedJobs = workerProfile?.completed_jobs || 0;
        
                 // Calculate risk level based on months and completed jobs
         let calculatedRiskLevel = 'No Risk';
         if (monthsSinceCreation >= 3 && completedJobs === 0) {
           calculatedRiskLevel = 'High Risk';
         } else if (monthsSinceCreation >= 2 && completedJobs === 0) {
           calculatedRiskLevel = 'Medium Risk';
         } else if (monthsSinceCreation >= 1 && completedJobs === 0) {
           calculatedRiskLevel = 'Low Risk';
         }
         
         // Check if worker should be automatically deactivated
         const shouldAutoDeactivate = category?.name === 'Starter' && 
                                    monthsSinceCreation >= 3 && 
                                    completedJobs === 0;
         
         // Auto-deactivate if criteria are met
         if (shouldAutoDeactivate && accountStatus?.is_active !== false) {
           autoDeactivateWorker(profile.id, monthsSinceCreation, completedJobs);
         }
         
         return {
           worker_id: profile.id,
           first_name: profile.first_name || '',
           last_name: profile.last_name || '',
           email: 'N/A', // Email not available in profiles table
           created_at: profile.created_at,
           category_name: category?.name || 'Unknown',
           category_description: category?.description || '',
           is_active: accountStatus?.is_active ?? true,
           deactivated_at: accountStatus?.deactivated_at || null,
           deactivation_reason: accountStatus?.deactivation_reason || null,
           reactivated_at: accountStatus?.reactivated_at || null,
           reactivation_reason: accountStatus?.reactivation_reason || null,
           last_activity_check: accountStatus?.last_activity_check || null,
           months_since_creation: monthsSinceCreation,
           unique_customers_count: completedJobs,
           risk_level: calculatedRiskLevel
         };
      }) || [];

      console.log('Successfully transformed workers:', transformedData);
      setWorkers(transformedData);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to fetch worker accounts');
    } finally {
      setLoading(false);
    }
  };

  // Function to automatically deactivate high-risk workers
  const autoDeactivateWorker = async (workerId: string, monthsOld: number, completedJobs: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deactivationReason = `Auto-deactivated: Starter worker for ${monthsOld} months with ${completedJobs} completed jobs`;
      
      const { error } = await supabase.rpc('admin_manual_deactivate_worker' as any, {
        worker_id_param: workerId,
        admin_id_param: user.id,
        deactivation_reason_param: deactivationReason
      });

      if (error) {
        console.error('Error auto-deactivating worker:', error);
      } else {
        console.log(`Auto-deactivated worker ${workerId} due to high risk`);
      }
    } catch (error) {
      console.error('Error in auto-deactivation:', error);
    }
  };

  const handleManualAction = async () => {
    if (!selectedWorker || !actionReason.trim()) {
      toast.error('Please provide a reason for the action');
      return;
    }

    setProcessing(true);
    try {
      // Get current user ID (admin)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Admin authentication required');
        return;
      }

      if (actionType === 'deactivate') {
        // Use the new admin function for manual deactivation
        const { error } = await supabase.rpc('admin_manual_deactivate_worker' as any, {
          worker_id_param: selectedWorker.worker_id,
          admin_id_param: user.id,
          deactivation_reason_param: actionReason
        });

        if (error) throw error;
        toast.success('Worker account deactivated successfully');
      } else {
        // Use the new admin function for manual reactivation
        const { error } = await supabase.rpc('admin_manual_reactivate_worker' as any, {
          worker_id_param: selectedWorker.worker_id,
          admin_id_param: user.id,
          reactivation_reason_param: actionReason
        });

        if (error) throw error;
        toast.success('Worker account reactivated successfully');
      }

      setActionReason('');
      setShowActionDialog(false);
      fetchWorkers(); // Refresh the list
    } catch (error) {
      console.error('Error processing action:', error);
      toast.error('Failed to process action');
    } finally {
      setProcessing(false);
    }
  };

  const runPeriodicCheck = async () => {
    try {
      const { error } = await supabase.rpc('run_periodic_deactivation_check' as any);
      if (error) throw error;

      toast.success('Periodic deactivation check completed');
      fetchWorkers(); // Refresh the list
    } catch (error) {
      console.error('Error running periodic check:', error);
      toast.error('Failed to run periodic check');
    }
  };

  const handleViewProfile = (workerId: string) => {
    setSelectedWorkerForProfile(workerId);
    setShowProfileDrawer(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Active</Badge>;
    } else {
      return <Badge variant="destructive"><UserX className="h-3 w-3 mr-1" />Deactivated</Badge>;
    }
  };

  const getRiskLevel = (months: number, customers: number) => {
    if (months >= 3 && customers === 0) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />High Risk</Badge>;
    } else if (months >= 2 && customers === 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Medium Risk</Badge>;
    } else if (months >= 1 && customers === 0) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Low Risk</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-800"><Shield className="h-3 w-3 mr-1" />No Risk</Badge>;
    }
  };

  const filteredWorkers = workers.filter(worker => {
    switch (activeFilter) {
      case 'active':
        return worker.is_active;
      case 'deactivated':
        return !worker.is_active;
      case 'high-risk':
        return worker.risk_level === 'High Risk';
      case 'medium-risk':
        return worker.risk_level === 'Medium Risk';
      case 'low-risk':
        return worker.risk_level === 'Low Risk';
      case 'no-risk':
        return worker.risk_level === 'No Risk';
      default:
        return true; // 'all' - show all workers
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading worker accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout userType="admin" title="Worker Account Management">
            <div className="space-y-6">


        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Worker Account Management</h1>
            <p className="text-muted-foreground">Monitor and manage worker account statuses</p>
          </div>
        <div className="flex space-x-2">
          <Button onClick={runPeriodicCheck} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Deactivation Check
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Workers</p>
                <p className="text-2xl font-bold">{workers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {workers.filter(w => w.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deactivated</p>
                <p className="text-2xl font-bold text-red-600">
                  {workers.filter(w => !w.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {workers.filter(w => w.risk_level === 'High Risk').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {workers.filter(w => w.risk_level === 'Medium Risk').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Risk</p>
                <p className="text-2xl font-bold text-blue-600">
                  {workers.filter(w => w.risk_level === 'Low Risk').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">No Risk</p>
                <p className="text-2xl font-bold text-green-600">
                  {workers.filter(w => w.risk_level === 'No Risk').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

             {/* Filters */}
       <div className="flex flex-wrap gap-2">
         <Button
           variant={activeFilter === 'all' ? 'default' : 'outline'}
           onClick={() => setActiveFilter('all')}
         >
           All Workers ({workers.length})
         </Button>
         <Button
           variant={activeFilter === 'active' ? 'default' : 'outline'}
           onClick={() => setActiveFilter('active')}
         >
           Active ({workers.filter(w => w.is_active).length})
         </Button>
         <Button
           variant={activeFilter === 'deactivated' ? 'default' : 'outline'}
           onClick={() => setActiveFilter('deactivated')}
         >
           Deactivated ({workers.filter(w => !w.is_active).length})
         </Button>
         <Button
           variant={activeFilter === 'high-risk' ? 'default' : 'outline'}
           className="bg-red-100 text-red-800 hover:bg-red-200"
           onClick={() => setActiveFilter('high-risk')}
         >
           High Risk ({workers.filter(w => w.risk_level === 'High Risk').length})
         </Button>
         <Button
           variant={activeFilter === 'medium-risk' ? 'default' : 'outline'}
           className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
           onClick={() => setActiveFilter('medium-risk')}
         >
           Medium Risk ({workers.filter(w => w.risk_level === 'Medium Risk').length})
         </Button>
         <Button
           variant={activeFilter === 'low-risk' ? 'default' : 'outline'}
           className="bg-blue-100 text-blue-800 hover:bg-blue-200"
           onClick={() => setActiveFilter('low-risk')}
         >
           Low Risk ({workers.filter(w => w.risk_level === 'Low Risk').length})
         </Button>
         <Button
           variant={activeFilter === 'no-risk' ? 'default' : 'outline'}
           className="bg-green-100 text-green-800 hover:bg-green-200"
           onClick={() => setActiveFilter('no-risk')}
         >
           No Risk ({workers.filter(w => w.risk_level === 'No Risk').length})
         </Button>
       </div>

      {/* Workers List */}
      <div className="grid gap-4">
        {filteredWorkers.map((worker) => (
          <Card key={worker.worker_id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {worker.first_name} {worker.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{worker.email}</p>
                  </div>
                </div>
                                 <div className="flex items-center space-x-2">
                   {getStatusBadge(worker.is_active)}
                   {/* Always show the calculated risk level */}
                   <Badge 
                     variant={worker.risk_level === 'High Risk' ? 'destructive' : 
                             worker.risk_level === 'Medium Risk' ? 'secondary' : 
                             worker.risk_level === 'Low Risk' ? 'outline' : 'outline'}
                     className={
                       worker.risk_level === 'High Risk' ? 'bg-red-100 text-red-800' :
                       worker.risk_level === 'Medium Risk' ? 'bg-yellow-100 text-yellow-800' :
                       worker.risk_level === 'Low Risk' ? 'bg-blue-100 text-blue-800' :
                       'bg-green-100 text-green-800'
                     }
                   >
                     {worker.risk_level === 'High Risk' ? <AlertTriangle className="h-3 w-3 mr-1" /> :
                      worker.risk_level === 'Medium Risk' ? <Clock className="h-3 w-3 mr-1" /> :
                      worker.risk_level === 'Low Risk' ? <Clock className="h-3 w-3 mr-1" /> :
                      <Shield className="h-3 w-3 mr-1" />}
                     {worker.risk_level}
                   </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWorker(worker);
                      setShowDetailsDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Account Age: {formatAccountAge(worker.created_at)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Customers: {worker.unique_customers_count}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Category: {worker.category_name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Created: {new Date(worker.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {!worker.is_active && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Deactivation Reason:</p>
                  <p className="text-sm text-red-700">{worker.deactivation_reason}</p>
                  {worker.deactivated_at && (
                    <p className="text-xs text-red-600 mt-1">
                      Deactivated on: {new Date(worker.deactivated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                {worker.is_active ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedWorker(worker);
                      setActionType('deactivate');
                      setShowActionDialog(true);
                    }}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate Account
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedWorker(worker);
                      setActionType('reactivate');
                      setShowActionDialog(true);
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Reactivate Account
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Worker Account Details</DialogTitle>
          </DialogHeader>
          {selectedWorker && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Worker Name</Label>
                  <p className="text-sm">
                    {selectedWorker.first_name} {selectedWorker.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedWorker.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Age</Label>
                  <p className="text-sm">{selectedWorker.months_since_creation} months</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{selectedWorker.category_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customers</Label>
                  <p className="text-sm">{selectedWorker.unique_customers_count} unique customers</p>
                </div>
                                 <div>
                   <Label className="text-sm font-medium">Status</Label>
                   <div className="mt-1">{getStatusBadge(selectedWorker.is_active)}</div>
                 </div>
                 <div>
                   <Label className="text-sm font-medium">Risk Level</Label>
                   <div className="mt-1">
                     <Badge 
                       variant={selectedWorker.risk_level === 'High Risk' ? 'destructive' : 
                               selectedWorker.risk_level === 'Medium Risk' ? 'secondary' : 
                               selectedWorker.risk_level === 'Low Risk' ? 'outline' : 'outline'}
                       className={
                         selectedWorker.risk_level === 'High Risk' ? 'bg-red-100 text-red-800' :
                         selectedWorker.risk_level === 'Medium Risk' ? 'bg-yellow-100 text-yellow-800' :
                         selectedWorker.risk_level === 'Low Risk' ? 'bg-blue-100 text-blue-800' :
                         'bg-green-100 text-green-800'
                       }
                     >
                       {selectedWorker.risk_level === 'High Risk' ? <AlertTriangle className="h-3 w-3 mr-1" /> :
                        selectedWorker.risk_level === 'Medium Risk' ? <Clock className="h-3 w-3 mr-1" /> :
                        selectedWorker.risk_level === 'Low Risk' ? <Clock className="h-3 w-3 mr-1" /> :
                        <Shield className="h-3 w-3 mr-1" />}
                       {selectedWorker.risk_level}
                     </Badge>
                   </div>
                 </div>
              </div>

              {selectedWorker.deactivation_reason && (
                <div>
                  <Label className="text-sm font-medium">Deactivation Reason</Label>
                  <div className="p-3 bg-red-50 rounded-lg mt-1">
                    <p className="text-sm text-red-700">{selectedWorker.deactivation_reason}</p>
                  </div>
                </div>
              )}

              {selectedWorker.reactivation_reason && (
                <div>
                  <Label className="text-sm font-medium">Reactivation Reason</Label>
                  <div className="p-3 bg-green-50 rounded-lg mt-1">
                    <p className="text-sm text-green-700">{selectedWorker.reactivation_reason}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'deactivate' ? 'Deactivate Worker Account' : 'Reactivate Worker Account'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="actionReason" className="text-sm font-medium">
                Reason for {actionType === 'deactivate' ? 'Deactivation' : 'Reactivation'}
              </Label>
              <Textarea
                id="actionReason"
                placeholder={`Please provide a reason for ${actionType === 'deactivate' ? 'deactivating' : 'reactivating'} this account...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleManualAction} 
                disabled={processing || !actionReason.trim()}
                variant={actionType === 'deactivate' ? 'destructive' : 'default'}
              >
                {actionType === 'deactivate' ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                {processing ? 'Processing...' : (actionType === 'deactivate' ? 'Deactivate' : 'Reactivate')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowActionDialog(false)} 
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
   </DashboardLayout>
  );
};
