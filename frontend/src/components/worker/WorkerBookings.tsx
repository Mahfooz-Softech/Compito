
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, DollarSign, Clock, Star, MessageCircle } from 'lucide-react';
import { CustomerReviewDialog } from './CustomerReviewDialog';

export const WorkerBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const response = await apiClient.get('/worker/bookings');

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch bookings');
      }

      setBookings(response.data?.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleMarkComplete = async (bookingId: string) => {
    try {
      const response = await apiClient.put(`/worker/bookings/${bookingId}/complete`);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to mark booking as complete');
      }

      toast({
        title: "Success",
        description: "Booking marked as complete. Waiting for customer confirmation."
      });

      // Refresh the bookings list
      fetchBookings();

    } catch (error) {
      console.error('Error marking complete:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark booking as complete",
        variant: "destructive"
      });
    }
  };

  const handleReviewCustomer = (booking: any) => {
    setSelectedBooking({
      ...booking,
      customer_name: booking.customer_name,
      service_title: booking.service_title
    });
    setReviewDialogOpen(true);
  };

  const handleReviewSubmitted = () => {
    fetchBookings();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: 'To Do', variant: 'default' as const },
      in_progress: { label: 'In Progress', variant: 'secondary' as const },
      worker_completed: { label: 'Waiting for Customer', variant: 'outline' as const },
      completed: { label: 'Completed', variant: 'default' as const },
      pending_payment: { label: 'Pending Payment', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  const todoBookings = bookings.filter((b: any) => ['confirmed', 'in_progress'].includes(b.status));
  const completedBookings = bookings.filter((b: any) => ['worker_completed', 'completed'].includes(b.status));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">To Do List</h2>
        <div className="grid gap-4">
          {todoBookings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No active bookings at the moment.
              </CardContent>
            </Card>
          ) : (
            todoBookings.map((booking: any) => (
              <Card key={booking.id} className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.service_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Category: {booking.service_category} • Customer: {booking.customer_name}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{booking.duration_hours || 2} hours</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign className="h-4 w-4" />
                      <span>${booking.total_amount}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{booking.address || 'Address TBD'}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">{booking.notes}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {booking.status === 'confirmed' && (
                      <Button
                        onClick={() => handleMarkComplete(booking.id)}
                        size="sm"
                      >
                        Mark as Complete
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/worker/messages`}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message Customer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Completed Jobs</h2>
        <div className="grid gap-4">
          {completedBookings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No completed jobs yet.
              </CardContent>
            </Card>
          ) : (
            completedBookings.map((booking: any) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">{booking.service_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Category: {booking.service_category} • Customer: {booking.customer_name}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                   <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                     <span>Completed: {new Date(booking.worker_completed_at || booking.created_at).toLocaleDateString()}</span>
                     <span className="font-medium text-success">${booking.worker_payout || booking.total_amount}</span>
                   </div>

                   {booking.status === 'completed' && (
                     <div className="space-y-3">
                       {/* Customer Review Section */}
                       {booking.customer_review ? (
                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                           <div className="flex items-center justify-between mb-2">
                             <h4 className="font-medium text-sm text-blue-800">Customer Review</h4>
                             <div className="flex items-center space-x-1">
                               {[...Array(5)].map((_, i) => (
                                 <Star
                                   key={i}
                                   className={`h-4 w-4 ${
                                     i < booking.customer_review.rating
                                       ? 'fill-yellow-400 text-yellow-400'
                                       : 'text-gray-300'
                                   }`}
                                 />
                               ))}
                               <span className="text-sm font-medium ml-1 text-blue-800">
                                 {booking.customer_review.rating}/5
                               </span>
                             </div>
                           </div>
                           {booking.customer_review.comment && (
                             <p className="text-sm text-blue-700 italic">
                               "{booking.customer_review.comment}"
                             </p>
                           )}
                           <p className="text-xs text-blue-600 mt-2">
                             Reviewed on {new Date(booking.customer_review.created_at).toLocaleDateString()}
                           </p>
                         </div>
                       ) : (
                         <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                           <p className="text-sm text-gray-600">No customer review yet</p>
                         </div>
                       )}

                       {/* Worker Review Section */}
                       {booking.has_review ? (
                         <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                           <div className="flex items-center justify-between mb-2">
                             <h4 className="font-medium text-sm text-green-800">Your Review</h4>
                             <div className="flex items-center space-x-1">
                               {[...Array(5)].map((_, i) => (
                                 <Star
                                   key={i}
                                   className={`h-4 w-4 ${
                                     i < booking.worker_review.rating
                                       ? 'fill-yellow-400 text-yellow-400'
                                       : 'text-gray-300'
                                   }`}
                                 />
                               ))}
                               <span className="text-sm font-medium ml-1 text-green-800">
                                 {booking.worker_review.rating}/5
                               </span>
                             </div>
                           </div>
                           {booking.worker_review.comment && (
                             <p className="text-sm text-green-700 italic">
                               "{booking.worker_review.comment}"
                             </p>
                           )}
                           <p className="text-xs text-green-600 mt-2">
                             Reviewed on {new Date(booking.worker_review.created_at).toLocaleDateString()}
                           </p>
                         </div>
                       ) : (
                         <div className="flex justify-end">
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => handleReviewCustomer(booking)}
                           >
                             <Star className="h-4 w-4 mr-1" />
                             Review Customer
                           </Button>
                         </div>
                       )}
                     </div>
                   )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <CustomerReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        booking={selectedBooking}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};
