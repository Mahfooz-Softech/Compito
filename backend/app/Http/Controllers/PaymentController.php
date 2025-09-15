<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Offer;
use App\Models\Profile;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\StripeCheckout;
use App\Models\Notification;
use Stripe\Stripe;
use Stripe\Checkout\Session;

class PaymentController extends Controller
{
    /**
     * Create a checkout session for an offer
     */
    public function createCheckout(Request $request)
    {
        try {
            $authUser = Auth::user();
            if (!$authUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get the profile for this auth user
            $profile = Profile::where('id', $authUser->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $offerId = $request->input('offerId');
            if (!$offerId) {
                return response()->json(['error' => 'Offer ID is required'], 400);
            }

            // Get the offer
            $offer = Offer::with(['worker', 'worker.profile', 'service'])
                ->where('id', $offerId)
                ->where('customer_id', $profile->id)
                ->first();

            if (!$offer) {
                return response()->json(['error' => 'Offer not found'], 404);
            }

            if ($offer->status !== 'pending') {
                return response()->json(['error' => 'Offer is not pending'], 400);
            }

            // For now, simulate a successful checkout session
            // In a real implementation, this would integrate with Stripe/PayPal
            $sessionId = 'laravel_session_' . Str::uuid();
            $checkoutUrl = $request->input('returnUrl', 'http://localhost:3000/payment-success');

            return response()->json([
                'success' => true,
                'sessionId' => $sessionId,
                'checkoutUrl' => $checkoutUrl,
                'amount' => $offer->price,
                'offer' => [
                    'id' => $offer->id,
                    'price' => $offer->price,
                    'worker_name' => $offer->worker && $offer->worker->profile ? 
                        trim(($offer->worker->profile->first_name ?? '') . ' ' . ($offer->worker->profile->last_name ?? '')) : 'Unknown Worker',
                    'service_title' => $offer->service ? $offer->service->title : 'Unknown Service',
                ]
            ]);

        } catch (\Throwable $e) {
            \Log::error('Error creating checkout: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create checkout session'], 500);
        }
    }

    /**
     * Complete payment and create booking
     */
    public function completePayment(Request $request)
    {
        try {
            $authUser = Auth::user();
            if (!$authUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get the profile for this auth user
            $profile = Profile::where('id', $authUser->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $offerId = $request->input('offerId');
            $sessionId = $request->input('sessionId');

            if (!$offerId || !$sessionId) {
                return response()->json(['error' => 'Offer ID and Session ID are required'], 400);
            }

            // Initialize Stripe
            Stripe::setApiKey(config('services.stripe.secret'));

            // Verify Stripe session
            try {
                $stripeSession = Session::retrieve($sessionId);
                
                if ($stripeSession->payment_status !== 'paid') {
                    return response()->json(['error' => 'Payment not completed'], 400);
                }
                
                // Verify the session metadata matches our offer
                if (isset($stripeSession->metadata->offer_id) && $stripeSession->metadata->offer_id !== $offerId) {
                    \Log::warning('Offer ID mismatch', [
                        'requested_offer_id' => $offerId,
                        'session_offer_id' => $stripeSession->metadata->offer_id,
                        'session_id' => $sessionId
                    ]);
                    
                    // Use the offer ID from the session metadata instead
                    $offerId = $stripeSession->metadata->offer_id;
                    
                    // Re-fetch the offer with the correct ID
                    $offer = Offer::with(['worker', 'service'])
                        ->where('id', $offerId)
                        ->where('customer_id', $profile->id)
                        ->first();
                        
                    if (!$offer) {
                        return response()->json(['error' => 'Offer not found with session metadata ID'], 404);
                    }
                }
            } catch (\Exception $e) {
                \Log::error('Stripe session verification failed: ' . $e->getMessage());
                return response()->json(['error' => 'Invalid payment session'], 400);
            }

            // Get the offer (if not already fetched in metadata check)
            if (!isset($offer)) {
                $offer = Offer::with(['worker', 'service'])
                    ->where('id', $offerId)
                    ->where('customer_id', $profile->id)
                    ->first();

                if (!$offer) {
                    return response()->json(['error' => 'Offer not found'], 404);
                }
            }

            // Check if offer is still pending (not already accepted)
            if ($offer->status !== 'pending') {
                \Log::warning('Offer already processed', [
                    'offer_id' => $offerId,
                    'current_status' => $offer->status,
                    'session_id' => $sessionId
                ]);
                
                // If offer is already accepted, that's okay - payment was already processed
                if ($offer->status === 'accepted') {
                    // Find the existing booking for this offer
                    $existingBooking = Booking::where('customer_id', $profile->id)
                        ->where('worker_id', $offer->worker_id)
                        ->where('service_id', $offer->service_id)
                        ->where('total_amount', $offer->price)
                        ->orderBy('created_at', 'desc')
                        ->first();
                        
                    return response()->json([
                        'success' => true,
                        'message' => 'Payment already processed',
                        'booking' => [
                            'id' => $existingBooking ? $existingBooking->id : 'already-processed',
                            'status' => 'confirmed',
                            'total_amount' => $offer->price,
                        ]
                    ]);
                }
                
                return response()->json(['error' => 'Offer has already been processed'], 400);
            }

            DB::beginTransaction();

            // Update offer status to accepted
            $offer->update(['status' => 'accepted']);

            // Create booking
            $booking = Booking::create([
                'id' => (string) Str::uuid(),
                'customer_id' => $profile->id,
                'worker_id' => $offer->worker_id,
                'service_id' => $offer->service_id,
                'total_amount' => $offer->price,
                'commission_rate' => 0.15, // 15% commission
                'commission_amount' => $offer->price * 0.15,
                'worker_payout' => $offer->price * 0.85,
                'status' => 'confirmed',
                'scheduled_date' => now()->addDays(1), // Default to tomorrow
                'address' => 'To be determined',
                'notes' => $offer->description,
                'stripe_session_id' => $sessionId,
                'stripe_payment_status' => 'paid',
                'stripe_payment_intent_id' => $stripeSession->payment_intent,
            ]);

            // Create payment record
            Payment::create([
                'id' => (string) Str::uuid(),
                'booking_id' => $booking->id,
                'customer_id' => $profile->id,
                'worker_id' => $offer->worker_id,
                'total_amount' => $offer->price,
                'commission_rate' => 0.15, // 15% commission
                'commission_amount' => $offer->price * 0.15,
                'worker_payout' => $offer->price * 0.85,
                'payment_status' => 'completed',
                'payment_method' => 'stripe',
                'transaction_id' => $sessionId,
            ]);

            // Update StripeCheckout record with payment completion
            try {
                $stripeCheckout = StripeCheckout::where('session_id', $sessionId)->first();
                if ($stripeCheckout) {
                    $stripeCheckout->update([
                        'payment_status' => 'paid',
                        'payment_intent_id' => $stripeSession->payment_intent,
                        'stripe_response' => array_merge(
                            $stripeCheckout->stripe_response ?? [],
                            ['payment_completed' => true, 'booking_id' => $booking->id]
                        ),
                    ]);
                    
                    \Log::info('✅ StripeCheckout record updated:', [
                        'session_id' => $sessionId,
                        'payment_status' => 'paid',
                        'booking_id' => $booking->id
                    ]);
                } else {
                    \Log::warning('⚠️ StripeCheckout record not found for session:', ['session_id' => $sessionId]);
                }
            } catch (\Exception $e) {
                \Log::error('❌ Failed to update StripeCheckout record:', [
                    'error' => $e->getMessage(),
                    'session_id' => $sessionId
                ]);
                // Don't fail the entire request if StripeCheckout update fails
            }

            // Create notification for worker
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $offer->worker_id,
                'type' => 'booking_confirmed',
                'title' => 'Booking Confirmed',
                'message' => "Your offer has been accepted and payment completed. Booking ID: " . $booking->id,
                'data' => json_encode([
                    'booking_id' => $booking->id,
                    'offer_id' => $offer->id,
                    'customer_id' => $profile->id
                ]),
                'is_read' => false,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment completed successfully',
                'booking' => [
                    'id' => $booking->id,
                    'status' => $booking->status,
                    'total_amount' => $booking->total_amount,
                    'scheduled_date' => $booking->scheduled_date,
                ]
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Error completing payment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to complete payment'], 500);
        }
    }

    /**
     * Get payment status
     */
    public function getPaymentStatus(Request $request)
    {
        try {
            $authUser = Auth::user();
            if (!$authUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $sessionId = $request->input('sessionId');
            if (!$sessionId) {
                return response()->json(['error' => 'Session ID is required'], 400);
            }

            // For now, simulate successful payment status
            // In a real implementation, this would check with Stripe/PayPal
            return response()->json([
                'success' => true,
                'status' => 'completed',
                'sessionId' => $sessionId,
                'message' => 'Payment completed successfully'
            ]);

        } catch (\Throwable $e) {
            \Log::error('Error getting payment status: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get payment status'], 500);
        }
    }
}