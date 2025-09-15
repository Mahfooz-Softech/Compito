import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface CheckoutData {
  offerId: string;
  amount: number;
  serviceName: string;
  workerName: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'processing'>('pending');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [processingMessage, setProcessingMessage] = useState('');

  useEffect(() => {
    // Check if user is returning from Stripe checkout
    const handleStripeReturn = async () => {
      const sessionId = searchParams.get('session_id');
      const status = searchParams.get('status');
      const offerId = searchParams.get('offer_id');
      
      if (sessionId && status === 'success' && offerId) {
        console.log('🔄 User returned from Stripe checkout:', { sessionId, status, offerId });
        
        try {
          setLoading(true);
          setPaymentStatus('processing');
          setProcessingMessage('Verifying payment...');
          
          // Verify payment with Stripe and complete booking
          await handlePaymentCompletion(sessionId, offerId);
        } catch (error) {
          console.error('Error handling Stripe return:', error);
          setPaymentStatus('failed');
          toast({
            title: "Payment Verification Failed",
            description: error instanceof Error ? error.message : "Failed to verify payment",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      } else if (status === 'cancelled') {
        console.log('❌ User cancelled Stripe checkout');
        setPaymentStatus('failed');
        toast({
          title: "Payment Cancelled",
          description: "Payment was cancelled. You can try again.",
          variant: "destructive"
        });
      }
    };

    // Handle Stripe return first
    handleStripeReturn();
  }, [searchParams, toast]);

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to continue",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }

        const offerId = searchParams.get('offerId');
        if (!offerId) {
          toast({
            title: "Error",
            description: "No offer ID provided",
            variant: "destructive"
          });
          navigate('/customer/offers');
          return;
        }

        // Fetch offer details from Laravel API
        const { data: offerResponse, error: offerError } = await apiClient.get(`/offers/${offerId}`);

        if (offerError || !offerResponse?.offer) {
          toast({
            title: "Error",
            description: "Offer not found",
            variant: "destructive"
          });
          navigate('/customer/offers');
          return;
        }

        const offer = offerResponse.offer;

        setCheckoutData({
          offerId: offer.id,
          amount: offer.price,
          serviceName: offer.service_title || 'Unknown Service',
          workerName: offer.worker_name || 'Unknown Worker',
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching checkout data:', error);
        toast({
          title: "Error",
          description: "Failed to load checkout data",
          variant: "destructive"
        });
        navigate('/customer/offers');
      }
    };

    fetchCheckoutData();
  }, [searchParams, navigate, toast, user]);

  // Check for payment success/failure from URL params
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const status = searchParams.get('status');
    const offerId = searchParams.get('offer_id');

    console.log('=== PAYMENT RETURN PARAMS ===');
    console.log('Session ID:', sessionId);
    console.log('Status:', status);
    console.log('Offer ID:', offerId);
    console.log('Full URL params:', Object.fromEntries(searchParams.entries()));
    console.log('=============================');

    if (status === 'success' && sessionId) {
      setPaymentStatus('success');
      setPaymentLoading(false);
      
      // Get full payment details from Stripe
      getPaymentDetails(sessionId);
    } else if (status === 'cancelled') {
      setPaymentStatus('failed');
      setPaymentLoading(false);
      
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled",
        variant: "destructive"
      });
    }
  }, [searchParams]);

  const getPaymentDetails = async (sessionId: string) => {
    try {
      console.log('Getting payment details for session:', sessionId);
      
      const response = await apiClient.get(`/payments/status?sessionId=${sessionId}`);

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { data } = response;
      console.log('=== FULL STRIPE RESPONSE ===');
      console.log('Payment data:', data);
      console.log('============================');

      // Note: We don't set paymentData here since this is payment status data, not completion data

      // Check if payment is complete and process it
      if (data.status === 'completed' || data.status === 'paid') {
        console.log('🎯 Payment is complete, processing...');
        // Get offerId from URL parameters or checkout data
        const offerId = searchParams.get('offer_id') || searchParams.get('offerId') || checkoutData?.offerId;
        await processPaymentCompletion(sessionId, data, offerId);
      } else {
        // Show success with payment details
        toast({
          title: "Payment Successful!",
          description: data.message || "Payment completed successfully!",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Error getting payment details:', error);
      toast({
        title: "Payment Successful!",
        description: "Payment completed, but couldn't fetch details.",
        variant: "default"
      });
    }
  };

  const processPaymentCompletion = async (sessionId: string, paymentData?: any, offerId?: string) => {
    try {
      setPaymentStatus('processing');
      setProcessingMessage('Processing your payment...');
      
      console.log('🚀 Processing payment completion...');
      
      // Get offerId from multiple sources as backup
      const finalOfferId = offerId || checkoutData?.offerId || searchParams.get('offer_id') || searchParams.get('offerId');
      
      console.log('🔍 Offer ID sources:', {
        fromCheckoutData: checkoutData?.offerId,
        fromUrlOfferId: searchParams.get('offer_id'),
        fromUrlOfferIdAlt: searchParams.get('offerId'),
        finalOfferId: finalOfferId
      });
      
      if (!finalOfferId) {
        throw new Error('No offer ID available for payment completion');
      }
      
      const response = await apiClient.post('/payments/complete', {
        sessionId,
        offerId: finalOfferId,
        paymentData
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { data } = response;
      console.log('✅ Payment completion successful:', data);

      // Show success message
      toast({
        title: "Payment Complete!",
        description: "Your booking has been confirmed successfully!",
        variant: "default"
      });

      // Update status and show success
      setPaymentStatus('success');
      setProcessingMessage('');

      // Redirect to bookings page after a short delay
      setTimeout(() => {
        navigate('/customer/bookings');
      }, 2000);

    } catch (error) {
      console.error('Error processing payment completion:', error);
      setPaymentStatus('failed');
      setProcessingMessage('');
      
      toast({
        title: "Processing Error",
        description: error.message || "Failed to complete payment processing",
        variant: "destructive"
      });
    }
  };

  const handlePayment = async () => {
    if (!checkoutData) return;

    setPaymentLoading(true);
    setPaymentStatus('pending');

    try {
      console.log('Starting payment process for offer:', checkoutData.offerId);
      
      const returnUrl = `${window.location.origin}/checkout?offerId=${checkoutData.offerId}`;
      console.log('Return URL being sent to Stripe:', returnUrl);
      
      const response = await apiClient.post('/payments/create-checkout', {
        offerId: checkoutData.offerId,
        returnUrl: returnUrl
      });
      
      console.log('=== LARAVEL CHECKOUT RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response error:', response.error);
      console.log('================================');
      
      const { data, error } = response;

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data && data.checkoutUrl) {
        console.log('✅ Checkout URL received:', data.checkoutUrl);
        console.log('💰 Amount:', data.amount);
        console.log('🎯 Session ID:', data.sessionId);
        
        // Store session data for later use
        sessionStorage.setItem('stripe_session_id', data.sessionId);
        sessionStorage.setItem('stripe_offer_id', checkoutData.offerId);
        
        // Redirect to real Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Invalid response from server - missing checkout URL');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      setPaymentLoading(false);
      
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
    }
  };

  const handlePaymentCompletion = async (sessionId?: string, offerId?: string) => {
    try {
      const actualSessionId = sessionId || sessionStorage.getItem('stripe_session_id');
      const actualOfferId = offerId || sessionStorage.getItem('stripe_offer_id');

      if (!actualSessionId || !actualOfferId) {
        throw new Error('Missing session data');
      }

      // Complete payment with Laravel API
      const response = await apiClient.post('/payments/complete', {
        sessionId: actualSessionId,
        offerId: actualOfferId
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to complete payment');
      }

      setPaymentStatus('success');
      setPaymentData(response.data || {});
      
      // Clear session storage
      sessionStorage.removeItem('stripe_session_id');
      sessionStorage.removeItem('stripe_offer_id');

      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed.",
      });

      // Redirect to bookings page after 3 seconds
      setTimeout(() => {
        navigate('/customer/bookings');
      }, 3000);

    } catch (error) {
      console.error('Payment completion error:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to complete payment",
        variant: "destructive"
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleBackToOffers = () => {
    navigate('/customer/offers');
  };

  // Helper function to safely format amount
  const formatAmount = (amount: any): string => {
    if (typeof amount === 'number') {
      return amount.toFixed(2);
    } else if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
    }
    return '0.00';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p>Invalid checkout data</p>
          <Button onClick={handleBackToOffers} className="mt-4">
            Back to Offers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToOffers}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offers
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your payment to confirm your booking</p>
        </div>

        {/* Payment Status */}
        {paymentStatus === 'success' && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Payment Successful!</h3>
                  <p className="text-green-600">Check the webhook logs for full Stripe response</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'failed' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Payment Failed</h3>
                  <p className="text-red-600">Your payment was not successful</p>
                </div>
              </div>
              <Button onClick={handleBackToOffers} className="mt-4">
                Back to Offers
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your service details before payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{checkoutData.serviceName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Worker:</span>
              <span className="font-medium">{checkoutData.workerName}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount:</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  £{checkoutData.amount.toFixed(2)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        {paymentStatus === 'pending' && (
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full"
                size="lg"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay £${checkoutData.amount.toFixed(2)} & Confirm Booking`
                )}
              </Button>
              <p className="text-sm text-gray-500 text-center mt-3">
                You will be redirected to Stripe to complete your payment securely
              </p>
            </CardContent>
          </Card>
        )}

        {/* Processing Loader */}
        {paymentStatus === 'processing' && (
          <Card className="mt-6">
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Going to your booking...
              </h3>
              <p className="text-gray-600">{processingMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Payment Details Display */}
        {paymentData && paymentStatus === 'success' && paymentData.booking && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Complete payment information from Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Amount:</span>
                    <span className="ml-2">${formatAmount(paymentData?.booking?.total_amount || checkoutData?.amount)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">{paymentData?.booking?.status || 'completed'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Booking ID:</span>
                    <span className="ml-2">{paymentData?.booking?.id || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Scheduled Date:</span>
                    <span className="ml-2">{paymentData?.booking?.scheduled_date ? new Date(paymentData.booking.scheduled_date).toLocaleDateString() : 'To be determined'}</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <div className="text-sm text-gray-600">
                    <p>✅ Payment completed successfully!</p>
                    <p>Your booking has been confirmed and the worker has been notified.</p>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600">
                    View Full Payment Response
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(paymentData, null, 2)}
                  </pre>
                </details>

                {/* Success Message and Redirect */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-green-800">Payment Successful!</h4>
                      <p className="text-sm text-green-600 mt-1">
                        Your booking has been confirmed. Redirecting to bookings page...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Checkout;
