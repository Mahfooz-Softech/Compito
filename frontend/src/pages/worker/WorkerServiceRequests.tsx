import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/apiClient';
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

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [offer, setOffer] = useState<WorkerOffer>({
    price: 0,
    estimated_hours: 2,
    description: '',
    available_dates: []
  });

  useEffect(() => {
    if (user) {
      fetchServiceRequests();
    }
  }, [user]);

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.get('/worker/service-requests');
      if (error) {
        console.error('Error fetching requests:', error);
        toast.error("Failed to fetch service requests");
        return;
      }
      
      setRequests(data?.serviceRequests || []);
      setHasNewRequests(data?.hasNewRequests || false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error("Failed to fetch service requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (request: ServiceRequest) => {
    setChatRequest(request);
    setShowChatDialog(true);
    await fetchMessages(request.id);
  };

  const fetchMessages = async (requestId: string) => {
    try {
      const { data, error } = await apiClient.get(`/service-requests/${requestId}/messages`);
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      setMessages(data?.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRequest) return;

    try {
      const { error } = await apiClient.post(`/service-requests/${chatRequest.id}/messages`, {
        message_text: newMessage
      });

      if (error) {
        console.error('Error sending message:', error);
        toast.error("Failed to send message");
        return;
      }

      setNewMessage('');
      await fetchMessages(chatRequest.id);
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
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
      const { error } = await apiClient.post('/worker/offers', {
        service_request_id: selectedRequest.id,
        customer_id: selectedRequest.customer_id,
        service_id: selectedRequest.service_id,
        price: offer.price,
        estimated_hours: offer.estimated_hours,
        description: offer.description,
        available_dates: offer.available_dates
      });

      if (error) {
        console.error('Error submitting offer:', error);
        toast.error("Failed to submit offer");
        return;
      }

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
      const { error } = await apiClient.put(`/service-requests/${requestId}/decline`);
      if (error) {
        console.error('Error declining request:', error);
        toast.error("Failed to decline request");
        return;
      }

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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Chat with {chatRequest?.customer_name} - {chatRequest?.service_title}
            </DialogTitle>
          </DialogHeader>
          {chatRequest && (
            <div className="h-[60vh] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.message_text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  Send
                </Button>
              </div>
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
