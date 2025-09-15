import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/dashboard/DataTable';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  DollarSign,
  User,
  MapPin,
  Calendar
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  service_id: string;
  worker_id: string;
  service_title: string;
  worker_name: string;
  status: string;
  preferred_date: string;
  location_address: string;
  budget_min: number;
  budget_max: number;
  worker_response?: string;
  created_at: string;
  expires_at: string;
}

export const ServiceRequestsDashboard = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: requestsData } = await supabase
        .from('service_requests')
        .select(`
          *,
          services(title),
          worker_profiles!service_requests_worker_id_fkey(
            profiles!worker_profiles_id_fkey(first_name, last_name)
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      const processedRequests = requestsData?.map(request => ({
        id: request.id,
        service_id: request.service_id,
        worker_id: request.worker_id,
        service_title: request.services?.title || 'Unknown Service',
        worker_name: request.worker_profiles?.profiles ? 
          `${request.worker_profiles.profiles.first_name} ${request.worker_profiles.profiles.last_name}` : 'Unknown',
        status: request.status,
        preferred_date: request.preferred_date || 'Not specified',
        location_address: request.location_address,
        budget_min: request.budget_min,
        budget_max: request.budget_max,
        worker_response: request.worker_response,
        created_at: request.created_at,
        expires_at: request.expires_at
      })) || [];

      setRequests(processedRequests);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch service requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500';
      case 'declined':
        return 'bg-red-500';
      case 'expired':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const proceedToBooking = async (request: ServiceRequest) => {
    // Create actual booking from accepted request
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: booking } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          service_id: request.service_id, // Use correct service_id
          worker_id: request.worker_id, // Use correct worker_id
          scheduled_date: request.preferred_date,
          address: request.location_address,
          total_amount: request.budget_max,
          status: 'confirmed'
        })
        .select()
        .single();

      if (booking) {
        toast({ title: "Success", description: "Booking confirmed! Proceeding to payment..." });
        // Redirect to payment or show payment modal
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create booking", variant: "destructive" });
    }
  };

  const columns = [
    { key: 'service_title', label: 'Service' },
    { key: 'worker_name', label: 'Worker' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(value)}
          <Badge variant="outline" className={`text-white ${getStatusColor(value)}`}>
            {value}
          </Badge>
        </div>
      )
    },
    { 
      key: 'budget_max', 
      label: 'Budget',
      render: (value: number, row: ServiceRequest) => (
        <span className="font-medium">${row.budget_min}-${value}</span>
      )
    },
    { 
      key: 'created_at', 
      label: 'Sent',
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  const handleViewRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">Service Requests</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter(r => r.status === 'pending').length}</p>
                <p className="text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter(r => r.status === 'accepted').length}</p>
                <p className="text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter(r => r.status === 'declined').length}</p>
                <p className="text-muted-foreground">Declined</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.length}</p>
                <p className="text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            title="Your Service Requests"
            columns={columns}
            data={requests}
            onView={handleViewRequest}
          />
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">{selectedRequest.service_title}</h3>
                <p className="text-sm text-muted-foreground">To: {selectedRequest.worker_name}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {getStatusIcon(selectedRequest.status)}
                  <Badge variant="outline" className={`text-white ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {selectedRequest.preferred_date === 'Not specified' 
                      ? 'Date not specified' 
                      : new Date(selectedRequest.preferred_date).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span className="text-sm">{selectedRequest.location_address}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">
                    Budget: ${selectedRequest.budget_min}-${selectedRequest.budget_max}
                  </span>
                </div>

                {selectedRequest.worker_response && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Worker Response:</p>
                    <p className="text-sm text-blue-800">{selectedRequest.worker_response}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  <p>Sent: {new Date(selectedRequest.created_at).toLocaleString()}</p>
                  <p>Expires: {new Date(selectedRequest.expires_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedRequest.status === 'accepted' && (
                <Button 
                  onClick={() => proceedToBooking(selectedRequest)}
                  className="w-full"
                >
                  Proceed to Booking & Payment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};