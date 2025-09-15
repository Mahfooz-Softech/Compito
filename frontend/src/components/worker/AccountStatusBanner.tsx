import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, UserX, RefreshCw, Send } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface AccountStatusBannerProps {
  workerId: string;
}

export const AccountStatusBanner: React.FC<AccountStatusBannerProps> = ({ workerId }) => {
  const [showReactivationDialog, setShowReactivationDialog] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{
    is_active: boolean;
    deactivation_reason: string | null;
    deactivated_at: string | null;
  } | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Check account status when component mounts
  React.useEffect(() => {
    checkAccountStatus();
    checkPendingRequests();
  }, [workerId]);

  const checkAccountStatus = async () => {
    try {
      const response = await apiClient.get(`/worker-account-status/${workerId}`);
      
      if (response.error) {
        console.error('Error checking account status:', response.error);
        // If no status record exists, account is active by default
        setAccountStatus({ is_active: true, deactivation_reason: null, deactivated_at: null });
        return;
      }

      const data = response.data;
      setAccountStatus({
        is_active: data.is_active ?? true,
        deactivation_reason: data.deactivation_reason,
        deactivated_at: data.deactivated_at
      });
    } catch (error) {
      console.error('Error checking account status:', error);
      // If no status record exists, account is active by default
      setAccountStatus({ is_active: true, deactivation_reason: null, deactivated_at: null });
    }
  };

  const checkPendingRequests = async () => {
    try {
      const response = await apiClient.get(`/account-activation-requests?worker_id=${workerId}&status=pending`);
      
      if (response.error) {
        console.error('Error checking pending requests:', response.error);
        setHasPendingRequest(false);
        return;
      }

      const data = response.data;
      setHasPendingRequest(Array.isArray(data) && data.length > 0);
    } catch (error) {
      console.error('Error checking pending requests:', error);
      setHasPendingRequest(false);
    }
  };

  const handleReactivationRequest = async () => {
    if (!requestReason.trim()) {
      toast.error('Please provide a reason for reactivation request');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/account-activation-requests', {
        worker_id: workerId,
        request_reason: requestReason,
        status: 'pending'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success('Reactivation request submitted successfully');
      setRequestReason('');
      setShowReactivationDialog(false);
      setHasPendingRequest(true);
      
      // Refresh account status
      checkAccountStatus();
    } catch (error) {
      console.error('Error submitting reactivation request:', error);
      toast.error('Failed to submit reactivation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If account is active, don't show anything
  if (!accountStatus || accountStatus.is_active) {
    return null;
  }

  return (
    <>
      {/* Deactivation Banner */}
      <Alert className="border-red-200 bg-red-50 mb-6">
        <UserX className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Account Deactivated</strong>
              <p className="text-sm mt-1">
                {accountStatus.deactivation_reason || 'Your account has been deactivated by admin.'}
              </p>
              {accountStatus.deactivated_at && (
                <p className="text-xs mt-1">
                  Deactivated on: {new Date(accountStatus.deactivated_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {hasPendingRequest ? (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Request Pending
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowReactivationDialog(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Request Reactivation
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Reactivation Request Dialog */}
      <Dialog open={showReactivationDialog} onOpenChange={setShowReactivationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Account Reactivation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="requestReason" className="text-sm font-medium">
                Reason for Reactivation Request
              </Label>
              <Textarea
                id="requestReason"
                placeholder="Please explain why your account should be reactivated..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleReactivationRequest} 
                disabled={isSubmitting || !requestReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReactivationDialog(false)} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
