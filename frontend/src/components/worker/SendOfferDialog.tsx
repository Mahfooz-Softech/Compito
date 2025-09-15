import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Clock, Send } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface SendOfferDialogProps {
  customerId: string;
  customerName: string;
  serviceId: string | null;
  serviceRequestId?: string;
}

export const SendOfferDialog = ({ customerId, customerName, serviceId, serviceRequestId }: SendOfferDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState({
    price: 100,
    estimatedHours: 2,
    description: "I'd be happy to help you with this service. Here's my proposal:"
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Create the offer via backend endpoint
      await apiClient.post('/service-requests/offers', {
        service_request_id: serviceRequestId,
        customer_id: customerId,
        service_id: serviceId,
        price: offer.price,
        estimated_hours: offer.estimatedHours,
        description: offer.description,
      });

      // Create offer message with basic details
      const offerMessage = `💼 **Service Offer**

${offer.description}

💰 **Price:** $${offer.price}
⏰ **Estimated Time:** ${offer.estimatedHours} hours

Would you like to accept this offer?`;

      const { error: messageError } = await apiClient.post('/messages', {
        receiver_id: customerId,
        message: offerMessage,
      });
      if ((messageError as any)) throw messageError;

      toast({
        title: "Offer sent successfully",
        description: `Your offer has been sent to ${customerName}`,
      });

      setOpen(false);
      setOffer({
        price: 100,
        estimatedHours: 2,
        description: "I'd be happy to help you with this service. Here's my proposal:"
      });
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error sending offer",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <DollarSign className="h-4 w-4 mr-2" />
          Send Offer to {customerName}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Service Offer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Sending offer to: <span className="font-medium">{customerName}</span></p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Your Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={offer.price}
                onChange={(e) => setOffer(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                min="1"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="hours">Estimated Hours</Label>
              <Input
                id="hours"
                type="number"
                value={offer.estimatedHours}
                onChange={(e) => setOffer(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                min="0.5"
                step="0.5"
              />
            </div>

            <div>
              <Label htmlFor="description">Offer Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you'll provide and why you're the right choice..."
                value={offer.description}
                onChange={(e) => setOffer(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Offer'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};