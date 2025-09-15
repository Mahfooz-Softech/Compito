import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onApprovalComplete: () => void;
}

export const ApprovalDialog = ({ open, onOpenChange, booking, onApprovalComplete }: ApprovalDialogProps) => {
  const [step, setStep] = useState<'approve' | 'review'>('approve');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      const response = await apiClient.put(`/customer/bookings/${booking.id}/approve`);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to approve completion');
      }

      toast({
        title: "Success",
        description: "Work completion approved! Please leave a review."
      });

      setStep('review');
    } catch (error) {
      console.error('Error approving completion:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve completion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      const response = await apiClient.post(`/customer/bookings/${booking.id}/review`, {
        rating,
        comment
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to submit review');
      }

      toast({
        title: "Success",
        description: "Review submitted successfully!"
      });

      onApprovalComplete();
      onOpenChange(false);
      setStep('approve');
      setComment('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipReview = () => {
    onApprovalComplete();
    onOpenChange(false);
    setStep('approve');
    setComment('');
    setRating(5);
  };

  if (step === 'approve') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Approve Work Completion
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {booking && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">{booking.service_title}</h3>
                <p className="text-sm text-muted-foreground">Worker: {booking.worker_name}</p>
                <p className="text-sm text-muted-foreground">Amount: ${booking.total_amount}</p>
              </div>
            )}
            
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                The worker has marked this job as completed. Please review and approve if the work has been done to your satisfaction.
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Not Yet
              </Button>
              <Button 
                onClick={handleApprove} 
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Approving...' : 'Approve Completion'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Leave a Review
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Work Approved!</span>
            </div>
            <p className="text-sm text-green-600">
              You've successfully approved the completion of this work.
            </p>
          </div>

          {booking && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">{booking.service_title}</h3>
              <p className="text-sm text-muted-foreground">Worker: {booking.worker_name}</p>
            </div>
          )}
          
          <div>
            <Label>Rating</Label>
            <div className="flex space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground hover:text-yellow-400'
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this worker..."
              rows={3}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleSkipReview}
              className="flex-1"
              disabled={loading}
            >
              Skip Review
            </Button>
            <Button 
              onClick={handleSubmitReview} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};