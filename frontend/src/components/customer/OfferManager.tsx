import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  User,
  Star,
  Calendar,
  MapPin
} from 'lucide-react';

interface ServiceOffer {
  id: string;
  service_id: string;
  service_title: string;
  worker_id: string;
  worker_name: string;
  worker_rating: number;
  location_address: string;
  original_budget_min: number;
  original_budget_max: number;
  offer_details: {
    price: number;
    estimated_hours: number;
    description: string;
    available_dates: string[];
  };
  status: string;
  created_at: string;
  expires_at: string;
}

export const OfferManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<ServiceOffer | null>(null);
  const [showOfferDialog, setShowOfferDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOffers();
      
      // Set up real-time subscription for offer updates
      const subscription = supabase
        .channel('offers-customer')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'service_requests',
            filter: `customer_id=eq.${user.id}`
          }, 
          (payload) => {
            if (payload.new.status === 'quoted') {
              fetchOffers();
              toast({
                title: "New Offer Received!",
                description: "A worker has sent you an offer for your service request.",
              });
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      const { data: requestsData } = await supabase
        .from('service_requests')
        .select(`
          *,
          services(id, title, description),
          worker_profiles!service_requests_worker_id_fkey(
            rating,
            profiles!worker_profiles_id_fkey(first_name, last_name)
          )
        `)
        .eq('customer_id', user?.id)
        .eq('status', 'quoted')
        .order('created_at', { ascending: false });

      const processedOffers = requestsData?.map(request => ({
        id: request.id,
        service_id: request.service_id,
        service_title: request.services?.title || 'Unknown Service',
        worker_id: request.worker_id,
        worker_name: request.worker_profiles?.profiles ? 
          `${request.worker_profiles.profiles.first_name} ${request.worker_profiles.profiles.last_name}` : 'Unknown Worker',
        worker_rating: request.worker_profiles?.rating || 0,
        location_address: request.location_address,
        original_budget_min: request.budget_min,
        original_budget_max: request.budget_max,
        offer_details: request.worker_response ? JSON.parse(request.worker_response) : null,
        status: request.status,
        created_at: request.created_at,
        expires_at: request.expires_at
      })).filter(offer => offer.offer_details) || [];

      setOffers(processedOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({ title: "Error", description: "Failed to fetch offers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer: ServiceOffer) => {
    try {
      // Update service request status
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({ status: 'accepted' })
        .eq('id', offer.id);

      if (updateError) throw updateError;

      // Create booking from accepted offer
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: user?.id,
          worker_id: offer.worker_id,
          service_id: offer.service_id, // Use correct service_id from offer
          scheduled_date: new Date().toISOString(), // Customer can adjust this later
          address: offer.location_address,
          total_amount: offer.offer_details.price,
          duration_hours: offer.offer_details.estimated_hours,
          status: 'confirmed',
          commission_rate: 0.15
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Send acceptance message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: offer.worker_id,
          message_text: `Great! I accept your offer of $${offer.offer_details.price} for ${offer.service_title}. Let's proceed with the booking.`,
          booking_id: booking.id
        });

      if (messageError) throw messageError;

      toast({
        title: "Offer Accepted!",
        description: "The offer has been accepted. You can now proceed to payment.",
      });

      // Redirect to payment or show booking details
      window.location.href = `/customer/bookings`;
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({ title: "Error", description: "Failed to accept offer", variant: "destructive" });
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'declined' })
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: "Offer Declined",
        description: "The offer has been declined.",
      });

      fetchOffers();
    } catch (error) {
      console.error('Error declining offer:', error);
      toast({ title: "Error", description: "Failed to decline offer", variant: "destructive" });
    }
  };

  const openOfferDetails = (offer: ServiceOffer) => {
    setSelectedOffer(offer);
    setShowOfferDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold gradient-text">Service Offers</h1>
          {offers.length > 0 && (
            <Badge variant="default" className="rounded-full">
              {offers.length}
            </Badge>
          )}
        </div>
        <Button variant="outline" onClick={fetchOffers}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Offers Yet</h3>
            <p className="text-muted-foreground">
              Workers will send you offers for your service requests. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="border-gradient hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{offer.service_title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{offer.worker_name}</span>
                      {offer.worker_rating > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{offer.worker_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Offer Received
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <span className="text-sm text-muted-foreground">Offered Price</span>
                      <span className="text-lg font-bold text-primary">
                        ${offer.offer_details.price}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Your Budget</span>
                      <span className="text-sm">
                        ${offer.original_budget_min} - ${offer.original_budget_max}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Estimated time: {offer.offer_details.estimated_hours} hours
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{offer.location_address}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg mb-4">
                  <p className="text-sm font-medium mb-1">Worker's Proposal:</p>
                  <p className="text-sm">{offer.offer_details.description}</p>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    onClick={() => handleAcceptOffer(offer)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Offer (${offer.offer_details.price})
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => openOfferDetails(offer)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDeclineOffer(offer.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                  <p>Offer received: {new Date(offer.created_at).toLocaleString()}</p>
                  <p>Expires: {new Date(offer.expires_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Offer Details Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Offer Details</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">{selectedOffer.service_title}</h3>
                <p className="text-sm text-muted-foreground">From: {selectedOffer.worker_name}</p>
                {selectedOffer.worker_rating > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{selectedOffer.worker_rating.toFixed(1)} rating</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="font-medium">Offered Price</span>
                  <span className="text-lg font-bold text-primary">
                    ${selectedOffer.offer_details.price}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estimated Duration</span>
                  <span className="text-sm font-medium">
                    {selectedOffer.offer_details.estimated_hours} hours
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your Original Budget</span>
                  <span className="text-sm">
                    ${selectedOffer.original_budget_min} - ${selectedOffer.original_budget_max}
                  </span>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Proposal Details:</p>
                  <p className="text-sm text-blue-800">{selectedOffer.offer_details.description}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    setShowOfferDialog(false);
                    handleAcceptOffer(selectedOffer);
                  }}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowOfferDialog(false);
                    handleDeclineOffer(selectedOffer.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};