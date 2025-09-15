import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, 
  Clock, 
  DollarSign, 
  MapPin, 
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { ConversationManager } from './ConversationManager';

interface ServiceRequest {
  id: string;
  customer_id: string;
  service_id: string;
  service_title: string;
  customer_name: string;
  location_address: string;
  preferred_date: string;
  budget_min: number;
  budget_max: number;
  message_to_worker: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface WorkerOffer {
  price: number;
  estimated_hours: number;
  description: string;
  available_dates: string[];
}

export const WorkerServiceRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [hasNewRequests, setHasNewRequests] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatRequest, setChatRequest] = useState<ServiceRequest | null>(null);
  const [offer, setOffer] = useState<WorkerOffer>({
    price: 0,
    estimated_hours: 2,
    description: '',
    available_dates: []
  });

  useEffect(() => {
    if (user) {
      fetchServiceRequests();
      
      // Set up real-time subscription for new requests
      const subscription = supabase
        .channel('service-requests-worker')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'service_requests',
            filter: `worker_id=eq.${user.id}`
          }, 
          (payload) => {
            fetchServiceRequests();
            setHasNewRequests(true);
            toast.success("🔔 New Service Request! You have received a new service request.");
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchServiceRequests = async () => {
    try {
      const { data: requestsData } = await supabase
        .from('service_requests')
        .select('*')
        .eq('worker_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Get services separately
      const serviceIds = requestsData?.map(r => r.service_id) || [];
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, title')
        .in('id', serviceIds);

      // Get customer profiles separately
      const customerIds = requestsData?.map(r => r.customer_id) || [];
      const { data: customersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', customerIds);

      const customerMap = new Map();
      customersData?.forEach(customer => {
        customerMap.set(customer.id, customer);
      });

      const serviceMap = new Map();
      servicesData?.forEach(service => {
        serviceMap.set(service.id, service);
      });

      const processedRequests = requestsData?.map(request => {
        const customer = customerMap.get(request.customer_id);
        const service = serviceMap.get(request.service_id);
        return {
          id: request.id,
          customer_id: request.customer_id,
          service_id: request.service_id,
          service_title: service?.title || 'Unknown Service',
          customer_name: customer ? 
            `${customer.first_name} ${customer.last_name}` : 'Unknown Customer',
          location_address: request.location_address,
          preferred_date: request.preferred_date,
          budget_min: request.budget_min,
          budget_max: request.budget_max,
          message_to_worker: request.message_to_worker,
          status: request.status,
          created_at: request.created_at,
          expires_at: request.expires_at
        };
      }) || [];

      setRequests(processedRequests);
      
      // Check if there are new requests (less than 1 hour old)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const newRequests = processedRequests.filter(request => 
        new Date(request.created_at) > oneHourAgo
      );
      setHasNewRequests(newRequests.length > 0);
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error("Failed to fetch service requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (request: ServiceRequest) => {
    setChatRequest(request);
    setShowChatDialog(true);
  };

  const handleMakeOffer = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setOffer({
      price: request.budget_max || 100,
      estimated_hours: 2,
      description: `I'd be happy to help you with ${request.service_title}. Here's my proposal:`,
      available_dates: []
    });
    setShowOfferDialog(true);
  };

  const submitOffer = async () => {
    if (!selectedRequest) return;

    try {
      // Create offer in the offers table
      const { error: offerError } = await supabase
        .from('offers')
        .insert({
          service_request_id: selectedRequest.id,
          worker_id: user?.id,
          customer_id: selectedRequest.customer_id,
          service_id: selectedRequest.service_id,
          price: offer.price,
          estimated_hours: offer.estimated_hours,
          description: offer.description,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        });

      if (offerError) throw offerError;

      // Update the service request with worker response
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({
          status: 'responded',
          worker_response: JSON.stringify({
            price: offer.price,
            estimated_hours: offer.estimated_hours,
            description: offer.description,
            available_dates: offer.available_dates
          })
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Create offer message in the conversation
      const offerMessage = `💼 **Service Offer**

${offer.description}

💰 **Price:** $${offer.price}
⏰ **Estimated Time:** ${offer.estimated_hours} hours

This is for your ${selectedRequest.service_title} request. Would you like to accept this offer? I'm ready to get started!`;

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: selectedRequest.customer_id,
          message_text: offerMessage,
          is_read: false
        });

      if (messageError) throw messageError;

      toast.success("Offer Sent! Your offer has been sent to the customer. They can now review and accept it.");

      setShowOfferDialog(false);
      fetchServiceRequests();
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error("Failed to submit offer");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success("Request Declined");
      fetchServiceRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error("Failed to decline request");
    }
  };

  const dismissAlert = () => {
    setHasNewRequests(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert for new requests */}
      {hasNewRequests && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex justify-between items-center">
            <span className="text-orange-800">
              You have new service requests! Check them out below.
            </span>
            <Button variant="ghost" size="sm" onClick={dismissAlert}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold">Service Requests</h1>
          {requests.length > 0 && (
            <Badge variant="destructive" className="rounded-full animate-pulse">
              {requests.length}
            </Badge>
          )}
        </div>
        <Button variant="outline" onClick={fetchServiceRequests}>
          <Bell className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No New Requests</h3>
            <p className="text-muted-foreground">
              You don't have any pending service requests at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{request.service_title}</h3>
                    <p className="text-muted-foreground">From {request.customer_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 animate-pulse">
                      <Bell className="h-3 w-3 mr-1" />
                      New Request
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.location_address}</span>
                  </div>

                  {request.preferred_date && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Preferred date: {new Date(request.preferred_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Budget: ${request.budget_min} - ${request.budget_max}
                    </span>
                  </div>

                  {request.message_to_worker && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Customer Message:</p>
                      <p className="text-sm">{request.message_to_worker}</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button 
                    onClick={() => handleStartChat(request)}
                    variant="outline"
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                  <Button 
                    onClick={() => handleMakeOffer(request)}
                    className="flex-1"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Send Offer
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDeclineRequest(request.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                  <p>Received: {new Date(request.created_at).toLocaleString()}</p>
                  <p>Expires: {new Date(request.expires_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Chat with {chatRequest?.customer_name} - {chatRequest?.service_title}
            </DialogTitle>
          </DialogHeader>
          {chatRequest && (
            <div className="h-[70vh] overflow-hidden">
              <ConversationManager 
                serviceIdFromRequest={chatRequest.service_id}
                conversationIdFromRequest={chatRequest.id}
                serviceRequestIdFromRequest={chatRequest.id}
                isEmbedded={true}
                onClose={() => setShowChatDialog(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Make Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">{selectedRequest.service_title}</h3>
                <p className="text-sm text-muted-foreground">For: {selectedRequest.customer_name}</p>
                <p className="text-sm">Budget: ${selectedRequest.budget_min} - ${selectedRequest.budget_max}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="price">Your Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={offer.price}
                    onChange={(e) => setOffer(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="hours">Estimated Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    value={offer.estimated_hours}
                    onChange={(e) => setOffer(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }))}
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
                  <Button onClick={submitOffer} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Send Offer
                  </Button>
                  <Button variant="outline" onClick={() => setShowOfferDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};