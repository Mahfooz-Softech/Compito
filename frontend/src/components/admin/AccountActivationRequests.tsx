import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertTriangle,
  Users
} from 'lucide-react';
import { DashboardLayout } from '../dashboard/DashboardLayout';

interface ActivationRequest {
  id: string;
  worker_id: string;
  request_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  worker_name: string;
  worker_email: string;
  deactivation_reason: string | null;
}

export const AccountActivationRequests = () => {
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ActivationRequest | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch activation requests with worker details
      const { data, error } = await supabase
        .from('account_activation_requests')
        .select(`
          *,
          worker:worker_id(
            first_name,
            last_name
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Transform data to include worker names and fetch additional details
      const transformedRequests = await Promise.all(
        (data || []).map(async (request) => {
          // Get worker profile details
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', request.worker_id)
            .single();

          // Get deactivation reason
          const { data: statusData } = await supabase
            .from('worker_account_status')
            .select('deactivation_reason')
            .eq('worker_id', request.worker_id)
            .single();

          return {
            ...request,
            worker_name: profileData ? `${profileData.first_name} ${profileData.last_name}` : 'Unknown Worker',
            worker_email: 'N/A', // Email not available in profiles table
            deactivation_reason: statusData?.deactivation_reason || 'No reason provided'
          };
        })
      );

      setRequests(transformedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch activation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !adminNotes.trim()) {
      toast.error('Please provide admin notes for the action');
      return;
    }

    setProcessing(true);
    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Admin authentication required');
        return;
      }

      // Update the request status
      const { error: updateError } = await supabase
        .from('account_activation_requests')
        .update({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          admin_notes: adminNotes,
          processed_at: new Date().toISOString(),
          processed_by: user.id
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // If approved, reactivate the worker account
      if (actionType === 'approve') {
        const { error: reactivateError } = await supabase.rpc('admin_manual_reactivate_worker', {
          worker_id_param: selectedRequest.worker_id,
          admin_id_param: user.id,
          reactivation_reason_param: `Account reactivated by admin approval. Admin notes: ${adminNotes}`
        });

        if (reactivateError) throw reactivateError;
        
        // Send notification to worker about approval
        const { error: notificationError } = await supabase.rpc('create_notification', {
          p_user_id: selectedRequest.worker_id,
          p_type: 'account_activation_approved',
          p_title: 'Account Reactivation Approved',
          p_message: `Your account reactivation request has been approved! Admin notes: ${adminNotes}`,
          p_related_id: selectedRequest.id,
          p_related_type: 'account_activation_request'
        });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          // Continue even if notification fails
        }
        
        toast.success('Request approved and worker account reactivated');
      } else {
        // If rejected, send notification to worker
        const { error: notificationError } = await supabase.rpc('create_notification', {
          p_user_id: selectedRequest.worker_id,
          p_type: 'account_activation_rejected',
          p_title: 'Account Reactivation Request Rejected',
          p_message: `Your account reactivation request has been rejected. Admin notes: ${adminNotes}`,
          p_related_id: selectedRequest.id,
          p_related_type: 'account_activation_request'
        });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          // Continue even if notification fails
        }

        toast.success('Request rejected and worker notified');
      }

      setAdminNotes('');
      setShowActionDialog(false);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error processing action:', error);
      toast.error('Failed to process action');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusCount = (status: string) => {
    return (requests || []).filter(r => r.status === status).length;
  };

  // Filter requests based on status
  const filteredRequests = (requests || []).filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading activation requests...</p>
        </div>
      </div>
    );
  }

  return (
   <DashboardLayout userType="admin" title="Account Activation Requests"> <div className="space-y-6">
   <div>
     <h1 className="text-3xl font-bold">Account Activation Requests</h1>
     <p className="text-muted-foreground">Review and manage worker account reactivation requests</p>
   </div>

   {/* Statistics */}
   <div className="grid gap-4 md:grid-cols-4">
     <Card>
       <CardContent className="p-6">
         <div className="flex items-center space-x-2">
           <div className="p-2 bg-blue-100 rounded-lg">
             <Users className="h-4 w-4 text-blue-600" />
           </div>
           <div>
             <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
             <p className="text-2xl font-bold">{requests.length}</p>
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
             <p className="text-sm font-medium text-muted-foreground">Pending</p>
             <p className="text-2xl font-bold text-yellow-600">{getStatusCount('pending')}</p>
           </div>
         </div>
       </CardContent>
     </Card>

     <Card>
       <CardContent className="p-6">
         <div className="flex items-center space-x-2">
           <div className="p-2 bg-green-100 rounded-lg">
             <CheckCircle className="h-4 w-4 text-green-600" />
           </div>
           <div>
             <p className="text-sm font-medium text-muted-foreground">Approved</p>
             <p className="text-2xl font-bold text-green-600">{getStatusCount('approved')}</p>
           </div>
         </div>
       </CardContent>
     </Card>

     <Card>
       <CardContent className="p-6">
         <div className="flex items-center space-x-2">
           <div className="p-2 bg-red-100 rounded-lg">
             <XCircle className="h-4 w-4 text-red-600" />
           </div>
           <div>
             <p className="text-sm font-medium text-muted-foreground">Rejected</p>
             <p className="text-2xl font-bold text-red-600">{getStatusCount('rejected')}</p>
           </div>
         </div>
       </CardContent>
     </Card>
   </div>

   {/* Status Filters */}
   <Card>
     <CardContent className="p-4">
       <div className="flex flex-wrap gap-2">
         <Button
           variant={statusFilter === 'all' ? 'default' : 'outline'}
           size="sm"
           onClick={() => setStatusFilter('all')}
         >
           All ({requests.length})
         </Button>
         <Button
           variant={statusFilter === 'pending' ? 'default' : 'outline'}
           size="sm"
           onClick={() => setStatusFilter('pending')}
           className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
         >
           Pending ({getStatusCount('pending')})
         </Button>
         <Button
           variant={statusFilter === 'approved' ? 'default' : 'outline'}
           size="sm"
           onClick={() => setStatusFilter('approved')}
           className="bg-green-100 text-green-800 hover:bg-green-200"
         >
           Approved ({getStatusCount('approved')})
         </Button>
         <Button
           variant={statusFilter === 'rejected' ? 'default' : 'outline'}
           size="sm"
           onClick={() => setStatusFilter('rejected')}
           className="bg-red-100 text-red-800 hover:bg-red-200"
         >
           Rejected ({getStatusCount('rejected')})
         </Button>
       </div>
     </CardContent>
   </Card>

   {/* Requests List */}
   <div className="grid gap-4">
     {filteredRequests.length === 0 ? (
       <Card>
         <CardContent className="p-6 text-center">
           <p className="text-muted-foreground">
             {requests.length === 0 
               ? 'No activation requests found' 
               : `No ${statusFilter === 'all' ? '' : statusFilter} requests found`
             }
           </p>
         </CardContent>
       </Card>
     ) : (
       filteredRequests.map((request) => (
         <Card key={request.id} className="hover:shadow-lg transition-shadow">
           <CardContent className="p-6">
             <div className="flex justify-between items-start mb-4">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                   <Users className="h-5 w-5" />
                 </div>
                 <div>
                   <h3 className="font-semibold">{request.worker_name}</h3>
                   <p className="text-sm text-muted-foreground">{request.worker_email}</p>
                 </div>
               </div>
               <div className="flex items-center space-x-2">
                 {getStatusBadge(request.status)}
                 {request.status === 'pending' && (
                   <div className="flex space-x-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         setSelectedRequest(request);
                         setActionType('approve');
                         setShowActionDialog(true);
                       }}
                       className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                     >
                       <CheckCircle className="h-4 w-4 mr-2" />
                       Approve
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         setSelectedRequest(request);
                         setActionType('reject');
                         setShowActionDialog(false);
                         setShowActionDialog(true);
                       }}
                       className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                     >
                       <XCircle className="h-4 w-4 mr-2" />
                       Reject
                     </Button>
                   </div>
                 )}
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <div>
                 <Label className="text-sm font-medium">Workers Request's Descriptions</Label>
                 <p className="text-sm mt-1">{request.request_reason}</p>
               </div>
               <div>
                 <Label className="text-sm font-medium">Deactivation Reason</Label>
                 <p className="text-sm mt-1">{request.deactivation_reason}</p>
               </div>
               <div>
                 <Label className="text-sm font-medium">Requested On</Label>
                 <p className="text-sm mt-1">{new Date(request.requested_at).toLocaleDateString()}</p>
               </div>
               <div>
                 <Label className="text-sm font-medium">Status</Label>
                 <div className="mt-1">{getStatusBadge(request.status)}</div>
               </div>
             </div>

             {request.admin_notes && (
               <div className="p-3 bg-blue-50 rounded-lg">
                 <p className="text-sm font-medium text-blue-800 mb-1">Admin Notes:</p>
                 <p className="text-sm text-blue-700">{request.admin_notes}</p>
               </div>
             )}

             {request.processed_at && (
               <div className="mt-2 text-xs text-muted-foreground">
                 Processed on: {new Date(request.processed_at).toLocaleDateString()}
               </div>
             )}
           </CardContent>
         </Card>
       ))
     )}
   </div>

   {/* Action Dialog */}
   <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
     <DialogContent className="max-w-md">
       <DialogHeader>
         <DialogTitle className="flex items-center space-x-2">
           {actionType === 'approve' ? (
             <>
               <CheckCircle className="h-5 w-5 text-green-600" />
               <span>Approve Reactivation Request</span>
             </>
           ) : (
             <>
               <XCircle className="h-5 w-5 text-red-600" />
               <span>Reject Reactivation Request</span>
             </>
           )}
         </DialogTitle>
       </DialogHeader>
       <div className="space-y-4">
         <div>
           <Label htmlFor="adminNotes" className="text-sm font-medium">
             Admin Notes {actionType === 'reject' && <span className="text-red-600">*</span>}
           </Label>
           <Textarea
             id="adminNotes"
             placeholder={`Please provide notes for ${actionType === 'approve' ? 'approving' : 'rejecting'} this request...`}
             value={adminNotes}
             onChange={(e) => setAdminNotes(e.target.value)}
             rows={4}
             className={actionType === 'reject' ? 'border-red-200 focus:border-red-500' : ''}
           />
           {actionType === 'reject' && (
             <p className="text-xs text-red-600 mt-1">
               * Rejection notes are required and will be sent to the worker
             </p>
           )}
         </div>
         
         <div className="flex space-x-2">
           <Button 
             onClick={handleAction} 
             disabled={processing || !adminNotes.trim()}
             variant={actionType === 'approve' ? 'default' : 'destructive'}
             className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
           >
             {actionType === 'approve' ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
             {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve Request' : 'Reject Request')}
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
 </div></DashboardLayout>
  );
};
