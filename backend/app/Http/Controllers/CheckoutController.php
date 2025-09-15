<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Offer;
use App\Models\StripeCheckout;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    /**
     * Create checkout session (equivalent to create-checkout function)
     */
    public function createCheckout(Request $request)
    {
        try {
            $offerId = $request->input('offerId');
            $returnUrl = $request->input('returnUrl');
            
            Log::info('📥 Received request:', ['offerId' => $offerId, 'returnUrl' => $returnUrl]);
            
            if (!$offerId) {
                throw new \Exception('Offer ID is required');
            }

            if (!$returnUrl) {
                throw new \Exception('Return URL is required');
            }

            // Get offer details from database
            Log::info('🔍 Fetching offer details for ID:', ['offerId' => $offerId]);
            $offer = Offer::findOrFail($offerId);
            
            Log::info('✅ Offer found:', [
                'id' => $offer->id,
                'amount' => $offer->price,
                'description' => $offer->description
            ]);

            // Initialize Stripe
            $stripeKey = config('services.stripe.secret');
            if (!$stripeKey) {
                throw new \Exception('Stripe key not configured');
            }

            \Stripe\Stripe::setApiKey($stripeKey);

            // Create dynamic checkout session
            $sessionData = [
                'payment_method_types' => ['card'],
                'line_items' => [
                    [
                        'price_data' => [
                            'currency' => 'usd',
                            'product_data' => [
                                'name' => $offer->description ?: 'Professional Service',
                                'description' => "Service offer for " . ($offer->description ?: 'professional service')
                            ],
                            'unit_amount' => round(($offer->price ?: 0) * 100), // Convert to cents
                        ],
                        'quantity' => 1,
                    ],
                ],
                'mode' => 'payment',
                'success_url' => "{$returnUrl}&session_id={CHECKOUT_SESSION_ID}&status=success&offer_id={$offerId}",
                'cancel_url' => "{$returnUrl}&status=cancelled&offer_id={$offerId}",
                'metadata' => [
                    'offer_id' => $offerId,
                    'offer_amount' => ($offer->price ?: $offer->amount ?: 0),
                    'offer_description' => $offer->description ?: 'Professional Service',
                    'timestamp' => now()->toISOString(),
                    'customer_id' => $offer->customer_id ?: 'unknown'
                ],
                'customer_creation' => 'if_required',
                'billing_address_collection' => 'auto',
                'phone_number_collection' => [
                    'enabled' => true
                ]
            ];

            Log::info('🚀 Creating Stripe session with data:', $sessionData);

            $session = \Stripe\Checkout\Session::create($sessionData);

            // Get expanded session details
            $fullSession = \Stripe\Checkout\Session::retrieve($session->id, [
                'expand' => ['payment_intent', 'customer', 'line_items']
            ]);

            Log::info('✅ Stripe session created successfully:', [
                'id' => $fullSession->id,
                'url' => $fullSession->url,
                'status' => $fullSession->status,
                'payment_status' => $fullSession->payment_status,
                'amount_total' => $fullSession->amount_total,
                'currency' => $fullSession->currency,
                'customer_email' => $fullSession->customer_email,
                'metadata' => $fullSession->metadata
            ]);

            // Create StripeCheckout record
            try {
                $stripeCheckout = StripeCheckout::create([
                    'id' => (string) Str::uuid(),
                    'session_id' => $fullSession->id,
                    'payment_intent_id' => $fullSession->payment_intent,
                    'offer_id' => $offerId,
                    'customer_id' => $offer->customer_id,
                    'worker_id' => $offer->worker_id,
                    'service_id' => $offer->service_id,
                    'amount' => $fullSession->amount_total,
                    'currency' => $fullSession->currency,
                    'payment_status' => $fullSession->payment_status,
                    'stripe_response' => $fullSession->toArray(),
                ]);
                
                Log::info('✅ StripeCheckout record created:', [
                    'id' => $stripeCheckout->id,
                    'session_id' => $stripeCheckout->session_id,
                    'offer_id' => $stripeCheckout->offer_id
                ]);
            } catch (\Exception $e) {
                Log::error('❌ Failed to create StripeCheckout record:', [
                    'error' => $e->getMessage(),
                    'session_id' => $fullSession->id
                ]);
                // Don't fail the entire request if StripeCheckout record creation fails
            }

            // Return complete response
            $responseData = [
                'success' => true,
                'sessionId' => $fullSession->id,
                'checkoutUrl' => $fullSession->url,
                'status' => $fullSession->status,
                'paymentStatus' => $fullSession->payment_status,
                'amount' => $fullSession->amount_total,
                'currency' => $fullSession->currency,
                'customerEmail' => $fullSession->customer_email,
                'metadata' => $fullSession->metadata,
                'offer' => [
                    'id' => $offer->id,
                    'amount' => $offer->amount,
                    'price' => $offer->price,
                    'description' => $offer->description,
                    'customerId' => $offer->customer_id
                ],
                'fullSession' => $fullSession
            ];

            Log::info('📤 Sending response:', $responseData);

            return response()->json($responseData, 200);

        } catch (\Exception $error) {
            Log::error('❌ Checkout error:', ['error' => $error->getMessage()]);
            
            $errorResponse = [
                'success' => false,
                'error' => $error->getMessage(),
                'details' => $error->getTraceAsString(),
                'timestamp' => now()->toISOString()
            ];
            
            Log::error('📤 Sending error response:', $errorResponse);
            
            return response()->json($errorResponse, 500);
        }
    }
}