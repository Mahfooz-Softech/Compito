import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');
  const offerId = searchParams.get('offer_id');
  const status = searchParams.get('status');
  const autoClose = searchParams.get('auto_close') === 'true';

  useEffect(() => {
    if (sessionId && offerId && status === 'success') {
      handlePaymentSuccess();
    } else {
      setError('Invalid payment parameters');
      setLoading(false);
    }
  }, [sessionId, offerId, status]);

  const handlePaymentSuccess = async () => {
    try {
      console.log('Payment success detected:', { sessionId, offerId, status, autoClose });
      
      // Fetch offer details
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError || !offer) {
        throw new Error('Offer not found');
      }

      console.log('Offer found:', offer);

      // Calculate commission and worker payout
      const commissionRate = 0.15; // 15%
      const totalAmount = offer.price;
      const commissionAmount = totalAmount * commissionRate;
      const workerPayout = totalAmount - commissionAmount;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: user?.id,
          worker_id: offer.worker_id,
          service_id: offer.service_id,
          scheduled_date: new Date().toISOString(),
          status: 'confirmed',
          total_amount: totalAmount,
          duration_hours: offer.estimated_hours,
          notes: offer.description || 'Service booking from accepted offer',
          created_at: new Date().toISOString(),
          stripe_session_id: sessionId,
          stripe_payment_status: 'succeeded'
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        throw new Error('Failed to create booking');
      }

      console.log('Booking created successfully:', booking.id);

      // Create payment record with transaction ID from Stripe session
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          customer_id: user?.id,
          worker_id: offer.worker_id,
          total_amount: totalAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          worker_payout: workerPayout,
          payment_status: 'completed',
          transaction_id: sessionId, // Using Stripe session ID as transaction ID
          payment_method: 'stripe',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw new Error('Failed to create payment record');
      }

      console.log('Payment record created successfully');

      // Update offer status to accepted
      const { error: offerUpdateError } = await supabase
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', offerId);

      if (offerUpdateError) {
        console.error('Error updating offer status:', offerUpdateError);
        // Don't throw error here as the main functionality is complete
      }

      // Set success state
      setSuccess(true);
      setLoading(false);
      setBookingData(booking);

      // Show success toast
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed and the worker has been notified.",
        variant: "default",
      });

      // Auto-close after 5 seconds if autoClose is true
      if (autoClose) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 5000);
      }

    } catch (error) {
      console.error('Error in payment success:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setLoading(false);
      
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please contact support.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2 text-destructive">Payment Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center pb-4">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your booking has been confirmed and the worker has been notified.
            </p>
            
            {bookingData && (
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <h3 className="font-semibold mb-2">Booking Details</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Booking ID:</span> {bookingData.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Amount:</span> £{bookingData.total_amount}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Duration:</span> {bookingData.duration_hours} hours
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Back to Home
              </Button>
            </div>

            {autoClose && (
              <p className="text-xs text-muted-foreground">
                This page will automatically redirect to your dashboard in a few seconds...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default PaymentSuccess;
