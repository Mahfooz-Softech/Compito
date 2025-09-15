import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, DollarSign, User, CheckCircle, XCircle, Eye, AlertCircle, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { categorizeOffers, getOfferStatusColor, getOfferStatusIcon, type Offer } from '@/lib/offerUtils';

export const CustomerOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { activeOffers, expiredOffers } = categorizeOffers(offers);

  // Debug logging for categorization
  // useEffect(() => {
  //   console.log('Offers updated:', offers);
  //   console.log('Categorized results:', { activeOffers, expiredOffers });
  // }, [offers, activeOffers, expiredOffers]);

  const fetchOffers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await apiClient.get('/customer/offers');
      
      if (error) {
        console.error('Error fetching offers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch offers. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const formattedOffers = data?.offers || [];
      setOffers(formattedOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject') => {
    setActionLoading(true);
    try {
      if (action === 'accept') {
        // Find the offer first
        const currentOffer = offers.find(o => o.id === offerId);
        if (!currentOffer) {
          throw new Error('Offer not found');
        }

        // Validate required fields
        if (!currentOffer.worker_id || !currentOffer.service_id) {
          throw new Error('Offer is missing required worker information');
        }

        // console.log('Processing payment for offer:', {
        //   offerId: currentOffer.id,
        //   workerId: currentOffer.worker_id,
        //   serviceId: currentOffer.service_id,
        //   price: currentOffer.price
        // });

        // Navigate to checkout page with offer ID
        // console.log('Navigating to checkout for offer:', currentOffer.id);
        
        // Close dialog and navigate to checkout
        setShowDialog(false);
        setSelectedOffer(null);
        
        // Navigate to checkout page
        navigate(`/checkout?offerId=${currentOffer.id}`);
        
        toast({
          title: "Redirecting to Checkout",
          description: "Please complete your payment to confirm your booking.",
        });

      } else {
        // Reject the offer
        const { error } = await apiClient.put(`/offers/${offerId}/reject`);

        if (error) {
          console.error('Error rejecting offer:', error);
          throw new Error(error.message || 'Failed to reject offer');
        }

        toast({
          title: "Offer Rejected",
          description: "The offer has been rejected successfully.",
        });

        // Close dialog and refresh offers
        setShowDialog(false);
        setSelectedOffer(null);
        await fetchOffers();
      }

    } catch (error) {
      console.error('Error handling offer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process offer",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Booking creation is now handled in the checkout page

  // Payment success is now handled in the checkout page

  useEffect(() => {
    fetchOffers();
  }, [user]);

  const renderOfferCard = (offer: Offer) => (
    <Card key={offer.id} className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{offer.service_title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4" />
              {offer.worker_name}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getOfferStatusColor(offer.status)}>
              <span className="mr-1">{getOfferStatusIcon(offer.status)}</span>
              {offer.status === 'accepted' && offer.stripe_session_id ? 'Payment Pending' : 
               offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
            </Badge>
            {offer.status === 'accepted' && offer.stripe_session_id && (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                💳 Payment Required
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-medium">${offer.price}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{offer.estimated_hours}h</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span>{formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{offer.description}</p>
        
        {offer.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setSelectedOffer(offer);
                setShowDialog(true);
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={actionLoading}
            >
              <Eye className="w-4 h-4 mr-1" />
              {actionLoading ? 'Processing...' : 'View & Respond'}
            </Button>
          </div>
        )}
        
        {offer.status === 'accepted' && offer.stripe_session_id && (
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/checkout?offerId=${offer.id}`)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={actionLoading}
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Complete Payment
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/customer/bookings`)}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              View Bookings
            </Button>
          </div>
        )}
        
        {offer.status === 'completed' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/customer/bookings`)}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              View Booking
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Offers</h2>
          <p className="text-gray-600">Review and respond to worker offers</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {activeOffers.length} Active
          </Badge>
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {expiredOffers.length} Expired
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Active Offers ({activeOffers.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Expired Offers ({expiredOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeOffers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Offers</h3>
                <p className="text-gray-600">You don't have any pending offers to review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeOffers.map(renderOfferCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          {expiredOffers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Expired Offers</h3>
                <p className="text-gray-600">All your offers are currently active.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {expiredOffers.map(renderOfferCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Offer Response Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Offer</DialogTitle>
            <DialogDescription>
              Review the offer details and choose to accept (proceed to payment) or reject it.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Price:</span>
                  <p className="text-lg font-bold text-green-600">${selectedOffer.price}</p>
                </div>
                <div>
                  <span className="font-medium">Duration:</span>
                  <p>{selectedOffer.estimated_hours} hours</p>
                </div>
              </div>
              
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-gray-700 mt-1">{selectedOffer.description}</p>
              </div>
              
              <div>
                <span className="font-medium">Worker:</span>
                <p className="text-gray-700 mt-1">{selectedOffer.worker_name}</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>What happens when you accept:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• You'll be redirected to the checkout page</li>
                  <li>• Complete your payment securely with Stripe</li>
                  <li>• A booking will be created after successful payment</li>
                  <li>• The offer will be marked as completed</li>
                  <li>• The worker will be notified of your acceptance</li>
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedOffer && handleOfferAction(selectedOffer.id, 'reject')}
              disabled={actionLoading}
            >
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button
              onClick={() => selectedOffer && handleOfferAction(selectedOffer.id, 'accept')}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? 'Processing...' : 'Accept & Pay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};