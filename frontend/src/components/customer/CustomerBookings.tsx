
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ReviewDialog } from './ReviewDialog';
import { ApprovalDialog } from './ApprovalDialog';
import { Calendar, MapPin, DollarSign, Clock, Star, CheckCircle, MessageSquare } from 'lucide-react';

export const CustomerBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to safely render data that might be an object
  const safeRender = (data: any, fallback: string = 'Unknown'): string => {
    if (typeof data === 'string' || typeof data === 'number') {
      return String(data);
    }
    if (data && typeof data === 'object') {
      return data.name || data.title || data.label || fallback;
    }
    return fallback;
  };
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    amount: number;
    serviceTitle: string;
    workerName: string;
    details: {
      step: string;
      timestamp: string;
      bookingData?: any;
      error?: any;
      stripeResponse?: any;
      successData?: any;
      finalStatus?: string;
    };
  } | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const response = await apiClient.get('/customer/bookings');

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

  const handleConfirmCompletion = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          customer_confirmed_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job confirmed as completed. You can now leave a review!"
      });

      fetchBookings();
    } catch (error) {
      console.error('Error confirming completion:', error);
      toast({
        title: "Error",
        description: "Failed to confirm completion",
        variant: "destructive"
      });
    }
  };

  const handlePayment = async (booking: any) => {
    try {
      console.log('🚀 Starting payment process for booking:', {
        bookingId: booking.id,
        serviceTitle: booking.service_title,
        workerName: booking.worker_name,
        totalAmount: booking.total_amount,
        status: booking.status
      });

      // Update payment status display
      setPaymentStatus({
        status: 'Creating checkout session...',
        amount: booking.total_amount,
        serviceTitle: booking.service_title,
        workerName: booking.worker_name,
        details: {
          step: 'checkout_creation',
          timestamp: new Date().toISOString(),
          bookingData: booking
        }
      });

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          offerId: booking.id, // Using booking ID as offer ID for now
          returnUrl: window.location.origin
        }
      });

      if (error) {
        console.error('❌ Stripe checkout error:', error);
        
        // Update payment status with error
        setPaymentStatus(prev => ({
          ...prev,
          status: 'Checkout creation failed',
          details: {
            ...prev.details,
            step: 'error',
            error: error,
            timestamp: new Date().toISOString()
          }
        }));
        
        throw error;
      }

      console.log('✅ Stripe checkout response received:', {
        sessionId: data.sessionId,
        checkoutUrl: data.url,
        offerId: data.offerId,
        fullResponse: data
      });

      // Update payment status with success
      setPaymentStatus(prev => ({
        ...prev,
        status: 'Checkout session created',
        details: {
          ...prev.details,
          step: 'checkout_created',
          stripeResponse: data,
          timestamp: new Date().toISOString()
        }
      }));

      if (data.url) {
        // Store booking data for after payment success
        localStorage.setItem('pendingPayment', JSON.stringify({
          bookingId: booking.id,
          serviceTitle: booking.service_title,
          workerName: booking.worker_name,
          totalAmount: booking.total_amount,
          sessionId: data.sessionId
        }));

        // Open Stripe checkout in new window
        const checkoutWindow = window.open(data.url, '_blank', 'width=500,height=600');
        
        if (!checkoutWindow) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Update payment status
        setPaymentStatus(prev => ({
          ...prev,
          status: 'Payment window opened',
          details: {
            ...prev.details,
            step: 'payment_window_opened',
            timestamp: new Date().toISOString()
          }
        }));

        // Listen for payment success messages from popup window
        const handlePaymentMessage = async (event: MessageEvent) => {
          // Only accept messages from our own origin
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'PAYMENT_SUCCESS') {
            console.log('🎉 Payment success message received:', event.data);
            
            // Update payment status
            setPaymentStatus(prev => ({
              ...prev,
              status: 'Payment successful!',
              details: {
                ...prev.details,
                step: 'payment_success',
                successData: event.data,
                timestamp: new Date().toISOString()
              }
            }));
            
            try {
              // Get the pending payment data
              const pendingPaymentData = localStorage.getItem('pendingPayment');
              if (pendingPaymentData) {
                const paymentData = JSON.parse(pendingPaymentData);
                
                console.log('📝 Processing successful payment for:', paymentData);
                
                // Update payment status
                setPaymentStatus(prev => ({
                  ...prev,
                  status: 'Processing payment...',
                  details: {
                    ...prev.details,
                    step: 'processing_payment',
                    timestamp: new Date().toISOString()
                  }
                }));
                
                // Update booking status to confirmed
                const { error: updateError } = await supabase
                  .from('bookings')
                  .update({
                    status: 'confirmed',
                    stripe_session_id: paymentData.sessionId,
                    stripe_payment_status: 'succeeded',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', paymentData.bookingId);

                if (updateError) {
                  console.error('❌ Error updating booking status:', updateError);
                  throw updateError;
                }

                console.log('✅ Booking status updated successfully');

                // Create payment record
                const { error: paymentRecordError } = await supabase
                  .from('payments')
                  .insert({
                    booking_id: paymentData.bookingId,
                    customer_id: user?.id,
                    worker_id: booking.worker_id,
                    total_amount: paymentData.totalAmount,
                    commission_rate: 0.15, // 15% commission
                    commission_amount: paymentData.totalAmount * 0.15,
                    worker_payout: paymentData.totalAmount * 0.85,
                    payment_status: 'completed',
                    transaction_id: paymentData.sessionId,
                    payment_method: 'stripe',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });

                if (paymentRecordError) {
                  console.error('❌ Error creating payment record:', paymentRecordError);
                  // Don't throw error here, continue with success flow
                } else {
                  console.log('✅ Payment record created successfully');
                }

                // Clear pending data
                localStorage.removeItem('pendingPayment');
                
                // Final payment status update
                setPaymentStatus(prev => ({
                  ...prev,
                  status: 'Payment completed successfully! 🎉',
                  details: {
                    ...prev.details,
                    step: 'completed',
                    finalStatus: 'success',
                    timestamp: new Date().toISOString()
                  }
                }));
                
                toast({
                  title: "Payment Successful! 🎉",
                  description: `Payment of $${paymentData.totalAmount} completed successfully for ${paymentData.serviceTitle}.`,
                });

                // Refresh bookings to show updated status
                await fetchBookings();
                
                // Remove the message listener
                window.removeEventListener('message', handlePaymentMessage);
              }
            } catch (error) {
              console.error('❌ Error handling payment success message:', error);
              
              // Update payment status with error
              setPaymentStatus(prev => ({
                ...prev,
                status: 'Payment processing failed',
                details: {
                  ...prev.details,
                  step: 'error',
                  error: error,
                  timestamp: new Date().toISOString()
                }
              }));
              
              toast({
                title: "Error",
                description: "Failed to process payment success",
                variant: "destructive",
              });
            }
          }
        };

        window.addEventListener('message', handlePaymentMessage);
        
        toast({
          title: "Payment Session Created!",
          description: "Please complete your payment in the new window to confirm your booking.",
        });

        console.log('🔗 Stripe checkout window opened successfully');
        
      } else {
        console.error('❌ No checkout URL received from Stripe');
        throw new Error('No checkout URL received from Stripe');
      }
    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      
      // Update payment status with error
      setPaymentStatus(prev => ({
        ...prev,
        status: 'Payment failed',
        details: {
          ...prev.details,
          step: 'error',
          error: error,
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create payment session",
        variant: "destructive",
      });
    }
  };

  const handleApprovalAction = (booking: any) => {
    setSelectedBooking(booking);
    setShowApprovalDialog(true);
  };

  const handleReviewAction = (booking: any) => {
    setSelectedBooking(booking);
    setShowReviewDialog(true);
  };

  const getActionButton = (booking: any) => {
    switch (booking.status) {
      case 'pending_payment':
        return (
          <Button 
            onClick={() => handlePayment(booking)} 
            size="sm"
            className="min-w-[100px]"
          >
            Pay Now
          </Button>
        );
      case 'worker_completed':
        return (
          <Button 
            onClick={() => handleApprovalAction(booking)} 
            size="sm"
            className="min-w-[100px]"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        );
      case 'completed':
        if (!booking.has_review) {
          return (
            <Button 
              onClick={() => handleReviewAction(booking)} 
              size="sm"
              variant="outline"
              className="min-w-[100px]"
            >
              <Star className="h-4 w-4 mr-2" />
              Review
            </Button>
          );
        }
        return (
          <span className="text-sm text-muted-foreground">Completed</span>
        );
      default:
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => console.log('Message worker:', booking.worker_id)}
            className="min-w-[100px]"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { label: 'Payment Required', variant: 'outline' as const },
      confirmed: { label: 'In Progress', variant: 'secondary' as const },
      worker_completed: { label: 'Ready for Review', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'default' as const }
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

  const activeBookings = bookings.filter((b: any) => !['completed', 'cancelled'].includes(b.status));
  const completedBookings = bookings.filter((b: any) => ['completed'].includes(b.status));

  return (
    <div className="space-y-6">

      
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Orders</h2>
        <div className="grid gap-4">
          {activeBookings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No active orders at the moment.
              </CardContent>
            </Card>
          ) : (
            activeBookings.map((booking: any) => (
              <Card key={booking.id} className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{safeRender(booking.service_title, 'Unknown Service')}</h3>
                      <p className="text-sm text-muted-foreground">
                        Category: {safeRender(booking.service_category, 'Uncategorized')} • Worker: {safeRender(booking.worker_name, 'Unknown Worker')}
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

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {booking.status === 'worker_completed' && (
                        <span className="text-primary font-medium">
                          ⏳ Waiting for your approval
                        </span>
                      )}
                      {booking.status === 'completed' && booking.customer_confirmed_at && (
                        <span className="text-green-600">
                          ✅ Approved on {new Date(booking.customer_confirmed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getActionButton(booking)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Booking History</h2>
        <div className="space-y-4">
          {completedBookings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No completed bookings yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedBookings.map((booking: any) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{safeRender(booking.service_title, 'Unknown Service')}</h3>
                        <p className="text-sm text-muted-foreground">
                          Category: {safeRender(booking.service_category, 'Uncategorized')} • Worker: {safeRender(booking.worker_name, 'Unknown Worker')}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">
                            Completed: {new Date(booking.customer_confirmed_at || booking.created_at).toLocaleDateString()}
                          </span>
                          <span className="font-medium text-lg">${booking.total_amount}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        {getStatusBadge(booking.status)}
                        {getActionButton(booking)}
                      </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="mt-4 space-y-3">
                      {/* Customer Review */}
                      {booking.customer_review ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-blue-800">Your Review</h4>
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
                          <p className="text-sm text-gray-600">No review submitted yet</p>
                        </div>
                      )}

                      {/* Worker Review */}
                      {booking.worker_review ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-green-800">Worker Review</h4>
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
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-600">No worker review yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    
    {/* Payment Status Display */}
    {paymentStatus && (
      <div className="mt-6">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              💳 Payment Status
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                className="h-6 w-6 p-0"
              >
                {showPaymentDetails ? '−' : '+'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Status:</span>
                  <span className="ml-2 text-blue-800">{paymentStatus.status}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Amount:</span>
                  <span className="ml-2 text-blue-800">${paymentStatus.amount}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Service:</span>
                  <span className="ml-2 text-blue-800">{paymentStatus.serviceTitle}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Worker:</span>
                  <span className="ml-2 text-blue-800">{paymentStatus.workerName}</span>
                </div>
              </div>
              
              {showPaymentDetails && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Payment Details:</h4>
                  <pre className="text-xs text-blue-700 bg-blue-100 p-2 rounded overflow-auto">
                    {JSON.stringify(paymentStatus.details, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentStatus(null)}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('📊 Full payment status:', paymentStatus);
                    toast({
                      title: "Payment Info Logged",
                      description: "Check console for detailed payment information",
                    });
                  }}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Log to Console
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    
    {/* Approval Dialog */}
    <ApprovalDialog
      open={showApprovalDialog}
      onOpenChange={setShowApprovalDialog}
      booking={selectedBooking}
      onApprovalComplete={fetchBookings}
    />

    {/* Review Dialog */}
    <ReviewDialog
      open={showReviewDialog}
      onOpenChange={setShowReviewDialog}
      booking={selectedBooking}
      onReviewSubmitted={fetchBookings}
    />
    </div>
  );
};
