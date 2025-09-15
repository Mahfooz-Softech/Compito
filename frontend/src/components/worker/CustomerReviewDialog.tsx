import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

interface CustomerReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onReviewSubmitted: () => void;
}

export const CustomerReviewDialog = ({ open, onOpenChange, booking, onReviewSubmitted }: CustomerReviewDialogProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      const response = await apiClient.post(`/worker/bookings/${booking.id}/review`, {
        rating,
        comment
      });

      if (response.error) {
        throw new Error(response.error || 'Failed to submit customer review');
      }

      toast({
        title: "Success",
        description: "Customer review submitted successfully!"
      });

      onReviewSubmitted();
      onOpenChange(false);
      setComment('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting customer review:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit customer review",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Customer</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {booking && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">{booking.customer_name}</h3>
              <p className="text-sm text-muted-foreground">{booking.service_title}</p>
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
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience working with this customer..."
              rows={4}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
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