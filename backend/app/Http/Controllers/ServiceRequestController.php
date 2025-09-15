<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\ServiceRequest;
use App\Models\Offer;
use App\Models\Message;
use App\Models\Profile;
use App\Models\Service;
use App\Models\WorkerProfile;
use App\Models\Booking;
use App\Models\Notification;
use App\Models\Review;

class ServiceRequestController extends Controller
{
    /**
     * Get service requests for the authenticated worker
     */
    public function getWorkerServiceRequests(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get service requests for this worker (exclude declined requests and requests with existing offers)
            $requests = ServiceRequest::with(['service', 'customer'])
                ->where('worker_id', $user->id)
                ->where('status', '!=', 'declined')
                ->whereDoesntHave('offers')
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform the data to match frontend expectations
            $transformedRequests = $requests->map(function ($request) {
                return [
                    'id' => $request->id,
                    'customer_id' => $request->customer_id,
                    'service_id' => $request->service_id,
                    'service_title' => $request->service ? $request->service->title : 'Unknown Service',
                    'customer_name' => $request->customer ? 
                        trim(($request->customer->first_name ?? '') . ' ' . ($request->customer->last_name ?? '')) : 'Unknown Customer',
                    'location_address' => $request->location_address,
                    'preferred_date' => $request->preferred_date,
                    'budget_min' => (float) $request->budget_min,
                    'budget_max' => (float) $request->budget_max,
                    'message_to_worker' => $request->message_to_worker,
                    'status' => $request->status,
                    'created_at' => $request->created_at,
                    'expires_at' => $request->expires_at ?? $request->created_at->addDay(),
                ];
            });

            return response()->json([
                'requests' => $transformedRequests,
                'hasNewRequests' => $this->checkForNewRequests($transformedRequests)
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error fetching worker service requests: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch service requests'], 500);
        }
    }

    /**
     * Create an offer for a service request
     */
    public function createOffer(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validated = $request->validate([
                'service_request_id' => 'required|string',
                'price' => 'required|numeric|min:0',
                'estimated_hours' => 'required|numeric|min:0.5',
                'description' => 'required|string',
                'available_dates' => 'nullable|array',
            ]);

            // Get the service request
            $serviceRequest = ServiceRequest::where('id', $validated['service_request_id'])
                ->where('worker_id', $user->id)
                ->firstOrFail();

            // Create the offer
            $offer = Offer::create([
                'id' => (string) Str::uuid(),
                'service_request_id' => $validated['service_request_id'],
                'worker_id' => $user->id,
                'customer_id' => $serviceRequest->customer_id,
                'service_id' => $serviceRequest->service_id,
                'price' => $validated['price'],
                'estimated_hours' => $validated['estimated_hours'],
                'description' => $validated['description'],
                'status' => 'pending',
                'expires_at' => now()->addDay(),
            ]);

            // Update the service request status
            $serviceRequest->update([
                'status' => 'responded',
                'worker_response' => json_encode([
                    'price' => $validated['price'],
                    'estimated_hours' => $validated['estimated_hours'],
                    'description' => $validated['description'],
                    'available_dates' => $validated['available_dates'] ?? []
                ])
            ]);

            // Create a message to the customer
            $offerMessage = "💼 **Service Offer**

{$validated['description']}

💰 **Price:** $" . number_format($validated['price'], 2) . "
⏰ **Estimated Time:** {$validated['estimated_hours']} hours

This is for your {$serviceRequest->service->title} request. Would you like to accept this offer? I'm ready to get started!";

            Message::create([
                'id' => (string) Str::uuid(),
                'sender_id' => $user->id,
                'receiver_id' => $serviceRequest->customer_id,
                'message_text' => $offerMessage,
                'is_read' => false,
            ]);

            // Create notification for customer
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $serviceRequest->customer_id,
                'type' => 'offer_received',
                'title' => 'New Offer Received',
                'message' => "You have received a new offer for your service request.",
                'data' => json_encode([
                    'service_request_id' => $serviceRequest->id,
                    'offer_id' => $offer->id,
                    'worker_id' => $user->id
                ]),
                'is_read' => false,
            ]);

            return response()->json([
                'success' => true,
                'offer' => $offer,
                'message' => 'Offer sent successfully!'
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error creating offer: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create offer'], 500);
        }
    }

    /**
     * Decline a service request
     */
    public function declineRequest(Request $request, string $requestId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $serviceRequest = ServiceRequest::where('id', $requestId)
                ->where('worker_id', $user->id)
                ->firstOrFail();

            $serviceRequest->update(['status' => 'declined']);

            // Create notification for customer
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $serviceRequest->customer_id,
                'type' => 'request_declined',
                'title' => 'Service Request Declined',
                'message' => "Your service request has been declined by the worker.",
                'data' => json_encode([
                    'service_request_id' => $serviceRequest->id,
                    'worker_id' => $user->id
                ]),
                'is_read' => false,
            ]);

            return response()->json(['success' => true, 'message' => 'Request declined successfully']);
        } catch (\Throwable $e) {
            \Log::error('Error declining request: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to decline request'], 500);
        }
    }

    /**
     * Get messages for a service request conversation
     */
    public function getMessages(Request $request, string $requestId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get the service request to verify access
            $serviceRequest = ServiceRequest::where('id', $requestId)
                ->where(function ($query) use ($user) {
                    $query->where('worker_id', $user->id)
                          ->orWhere('customer_id', $user->id);
                })
                ->firstOrFail();

            // Get messages between worker and customer
            $messages = Message::where(function ($query) use ($user, $serviceRequest) {
                $query->where('sender_id', $user->id)
                      ->where('receiver_id', $serviceRequest->customer_id);
            })->orWhere(function ($query) use ($user, $serviceRequest) {
                $query->where('sender_id', $serviceRequest->customer_id)
                      ->where('receiver_id', $user->id);
            })
            ->orderBy('created_at', 'asc')
            ->get();

            return response()->json(['messages' => $messages]);
        } catch (\Throwable $e) {
            \Log::error('Error fetching messages: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch messages'], 500);
        }
    }

    /**
     * Send a message in a service request conversation
     */
    public function sendMessage(Request $request, string $requestId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validated = $request->validate([
                'message_text' => 'required|string|max:1000',
            ]);

            // Get the service request to verify access
            $serviceRequest = ServiceRequest::where('id', $requestId)
                ->where(function ($query) use ($user) {
                    $query->where('worker_id', $user->id)
                          ->orWhere('customer_id', $user->id);
                })
                ->firstOrFail();

            // Determine receiver
            $receiverId = $user->id === $serviceRequest->worker_id 
                ? $serviceRequest->customer_id 
                : $serviceRequest->worker_id;

            // Create message
            $message = Message::create([
                'id' => (string) Str::uuid(),
                'sender_id' => $user->id,
                'receiver_id' => $receiverId,
                'message_text' => $validated['message_text'],
                'is_read' => false,
            ]);

            // Create notification for receiver
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $receiverId,
                'type' => 'message_received',
                'title' => 'New Message',
                'message' => "You have received a new message.",
                'data' => json_encode([
                    'service_request_id' => $serviceRequest->id,
                    'message_id' => $message->id,
                    'sender_id' => $user->id
                ]),
                'is_read' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => $message
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error sending message: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to send message'], 500);
        }
    }

    /**
     * Get offers for the authenticated customer
     */
    public function getCustomerOffers(Request $request)
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

            // Get offers for this customer with related data
            $offers = Offer::with(['worker', 'worker.profile', 'service', 'serviceRequest'])
                ->where('customer_id', $profile->id)
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform the data to match frontend expectations
            $transformedOffers = $offers->map(function ($offer) {
                return [
                    'id' => $offer->id,
                    'service_request_id' => $offer->service_request_id,
                    'worker_id' => $offer->worker_id,
                    'customer_id' => $offer->customer_id,
                    'service_id' => $offer->service_id,
                    'price' => (float) $offer->price,
                    'estimated_hours' => (float) $offer->estimated_hours,
                    'description' => $offer->description,
                    'status' => $offer->status,
                    'expires_at' => $offer->expires_at,
                    'created_at' => $offer->created_at,
                    'updated_at' => $offer->updated_at,
                    'worker_name' => $offer->worker && $offer->worker->profile ? 
                        trim(($offer->worker->profile->first_name ?? '') . ' ' . ($offer->worker->profile->last_name ?? '')) : 'Unknown Worker',
                    'service_title' => $offer->service ? $offer->service->title : 'Unknown Service',
                    'worker_rating' => $offer->worker ? (float) $offer->worker->rating : 0,
                    'worker_reviews_count' => $offer->worker ? (int) $offer->worker->total_reviews : 0,
                ];
            });

            // Categorize offers
            $activeOffers = $transformedOffers->filter(function ($offer) {
                return $offer['status'] === 'pending' && 
                       $offer['expires_at'] && 
                       now()->lt($offer['expires_at']);
            });

            $expiredOffers = $transformedOffers->filter(function ($offer) {
                return $offer['expires_at'] && 
                       now()->gte($offer['expires_at']);
            });

            return response()->json([
                'offers' => $transformedOffers,
                'activeOffers' => $activeOffers->values(),
                'expiredOffers' => $expiredOffers->values(),
                'totalOffers' => $transformedOffers->count(),
                'activeCount' => $activeOffers->count(),
                'expiredCount' => $expiredOffers->count(),
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error fetching customer offers: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch offers'], 500);
        }
    }

    /**
     * Get a specific offer by ID
     */
    public function getOfferById(Request $request, string $offerId)
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

            // Get the offer with related data
            $offer = Offer::with(['worker', 'worker.profile', 'service', 'serviceRequest'])
                ->where('id', $offerId)
                ->where('customer_id', $profile->id)
                ->first();

            if (!$offer) {
                return response()->json(['error' => 'Offer not found'], 404);
            }

            // Transform the data to match frontend expectations
            $transformedOffer = [
                'id' => $offer->id,
                'service_request_id' => $offer->service_request_id,
                'worker_id' => $offer->worker_id,
                'customer_id' => $offer->customer_id,
                'service_id' => $offer->service_id,
                'price' => (float) $offer->price,
                'estimated_hours' => (float) $offer->estimated_hours,
                'description' => $offer->description,
                'status' => $offer->status,
                'expires_at' => $offer->expires_at,
                'created_at' => $offer->created_at,
                'updated_at' => $offer->updated_at,
                'worker_name' => $offer->worker && $offer->worker->profile ? 
                    trim(($offer->worker->profile->first_name ?? '') . ' ' . ($offer->worker->profile->last_name ?? '')) : 'Unknown Worker',
                'service_title' => $offer->service ? $offer->service->title : 'Unknown Service',
                'worker_rating' => $offer->worker ? (float) $offer->worker->rating : 0,
                'worker_reviews_count' => $offer->worker ? (int) $offer->worker->total_reviews : 0,
            ];

            return response()->json([
                'offer' => $transformedOffer
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error fetching offer: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch offer'], 500);
        }
    }

    /**
     * Accept an offer
     */
    public function acceptOffer(Request $request, string $offerId)
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

            $offer = Offer::where('id', $offerId)
                ->where('customer_id', $profile->id)
                ->firstOrFail();

            if ($offer->status !== 'pending') {
                return response()->json(['error' => 'Offer is not pending'], 400);
            }

            DB::beginTransaction();

            // Update offer status
            $offer->update(['status' => 'accepted']);

            // Create notification for worker
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $offer->worker_id,
                'type' => 'offer_accepted',
                'title' => 'Offer Accepted',
                'message' => "Your offer has been accepted by the customer.",
                'data' => json_encode([
                    'offer_id' => $offer->id,
                    'customer_id' => $profile->id
                ]),
                'is_read' => false,
            ]);

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Offer accepted successfully']);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Error accepting offer: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to accept offer'], 500);
        }
    }

    /**
     * Get worker bookings
     */
    public function getWorkerBookings(Request $request)
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

            // Get worker profile
            $workerProfile = WorkerProfile::where('id', $profile->id)->first();
            if (!$workerProfile) {
                return response()->json(['error' => 'Worker profile not found'], 404);
            }

            // Get bookings with related data including reviews
            $bookings = Booking::with([
                'service.category', 
                'customer', 
                'worker.profile',
                'reviews.reviewer'
            ])
                ->where('worker_id', $workerProfile->id)
                ->orderBy('created_at', 'desc')
                ->get();

            // Format the response
            $formattedBookings = $bookings->map(function ($booking) use ($workerProfile) {
                // Safely get category name
                $categoryName = 'Uncategorized';
                if ($booking->service && $booking->service->category) {
                    if (is_object($booking->service->category)) {
                        $categoryName = $booking->service->category->name ?? 'Uncategorized';
                    } else {
                        $categoryName = $booking->service->category;
                    }
                }

                return [
                    'id' => $booking->id,
                    'service_title' => $booking->service ? $booking->service->title : 'Unknown Service',
                    'service_category' => $categoryName,
                    'customer_name' => $booking->customer ? 
                        $booking->customer->first_name . ' ' . $booking->customer->last_name : 
                        'Unknown Customer',
                    'total_amount' => $booking->total_amount,
                    'worker_payout' => $booking->worker_payout,
                    'status' => $booking->status,
                    'scheduled_date' => $booking->scheduled_date,
                    'duration_hours' => $booking->duration_hours ?? 2,
                    'address' => $booking->address,
                    'notes' => $booking->notes,
                    'worker_completed_at' => $booking->worker_completed_at,
                    'customer_confirmed_at' => $booking->customer_confirmed_at,
                    'created_at' => $booking->created_at,
                    'updated_at' => $booking->updated_at,
                    'has_review' => Review::where('booking_id', $booking->id)
                        ->where('reviewer_id', $workerProfile->id)
                        ->where('review_type', 'worker_to_customer')
                        ->exists(),
                    'worker_review' => $booking->reviews
                        ->where('reviewer_id', $workerProfile->id)
                        ->where('review_type', 'worker_to_customer')
                        ->first(),
                    'customer_review' => $booking->reviews
                        ->where('reviewer_id', $booking->customer_id)
                        ->where('review_type', 'customer_to_worker')
                        ->first(),
                ];
            });

            return response()->json([
                'success' => true,
                'bookings' => $formattedBookings
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching worker bookings: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch bookings'], 500);
        }
    }

    /**
     * Mark booking as complete by worker
     */
    public function markBookingComplete(Request $request, $bookingId)
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

            // Get worker profile
            $workerProfile = WorkerProfile::where('id', $profile->id)->first();
            if (!$workerProfile) {
                return response()->json(['error' => 'Worker profile not found'], 404);
            }

            // Find the booking
            $booking = Booking::where('id', $bookingId)
                ->where('worker_id', $workerProfile->id)
                ->first();

            if (!$booking) {
                return response()->json(['error' => 'Booking not found'], 404);
            }

            // Update booking status
            $booking->update([
                'worker_completed_at' => now(),
                'status' => 'worker_completed'
            ]);

            // Create notification for customer
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $booking->customer_id,
                'type' => 'booking_completed',
                'title' => 'Job Completed',
                'message' => 'Your service has been completed. Please confirm and leave a review.',
                'data' => json_encode([
                    'booking_id' => $booking->id,
                    'worker_id' => $workerProfile->id,
                    'service_title' => $booking->service ? $booking->service->title : 'Service'
                ]),
                'is_read' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Booking marked as complete successfully',
                'booking' => [
                    'id' => $booking->id,
                    'status' => $booking->status,
                    'worker_completed_at' => $booking->worker_completed_at,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error marking booking complete: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to mark booking as complete'], 500);
        }
    }

    /**
     * Approve work completion by customer
     */
    public function approveWorkCompletion(Request $request, $bookingId)
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

            // Find the booking
            $booking = Booking::where('id', $bookingId)
                ->where('customer_id', $profile->id)
                ->where('status', 'worker_completed')
                ->first();

            if (!$booking) {
                return response()->json(['error' => 'Booking not found or not ready for approval'], 404);
            }

            // Update booking status
            $booking->update([
                'customer_confirmed_at' => now(),
                'status' => 'completed'
            ]);

            // Create notification for worker
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $booking->worker_id,
                'type' => 'work_approved',
                'title' => 'Work Approved',
                'message' => 'Your work has been approved by the customer. Great job!',
                'data' => json_encode([
                    'booking_id' => $booking->id,
                    'customer_id' => $profile->id,
                    'service_title' => $booking->service ? $booking->service->title : 'Service'
                ]),
                'is_read' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Work completion approved successfully',
                'booking' => [
                    'id' => $booking->id,
                    'status' => $booking->status,
                    'customer_confirmed_at' => $booking->customer_confirmed_at,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error approving work completion: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to approve work completion'], 500);
        }
    }

    /**
     * Submit customer review for worker
     */
    public function submitCustomerReview(Request $request, $bookingId)
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

            // Validate request
            $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            // Find the booking
            $booking = Booking::where('id', $bookingId)
                ->where('customer_id', $profile->id)
                ->where('status', 'completed')
                ->first();

            if (!$booking) {
                return response()->json(['error' => 'Booking not found or not completed'], 404);
            }

            // Check if review already exists
            $existingReview = Review::where('booking_id', $bookingId)
                ->where('reviewer_id', $profile->id)
                ->where('review_type', 'customer_to_worker')
                ->first();

            if ($existingReview) {
                return response()->json(['error' => 'Review already submitted for this booking'], 400);
            }

            // Create the review
            $review = Review::create([
                'id' => (string) Str::uuid(),
                'booking_id' => $bookingId,
                'reviewer_id' => $profile->id,
                'worker_id' => $booking->worker_id,
                'rating' => $request->rating,
                'comment' => $request->comment,
                'review_type' => 'customer_to_worker',
            ]);

            // Update worker profile rating stats
            $this->updateWorkerRatingStats($booking->worker_id);

            return response()->json([
                'success' => true,
                'message' => 'Review submitted successfully',
                'review' => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error submitting review: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to submit review'], 500);
        }
    }

    /**
     * Submit worker review for customer
     */
    public function submitWorkerReview(Request $request, $bookingId)
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

            // Get worker profile
            $workerProfile = WorkerProfile::where('id', $profile->id)->first();
            if (!$workerProfile) {
                return response()->json(['error' => 'Worker profile not found'], 404);
            }

            // Validate request
            $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            // Find the booking
            $booking = Booking::where('id', $bookingId)
                ->where('worker_id', $workerProfile->id)
                ->where('status', 'completed')
                ->first();

            if (!$booking) {
                return response()->json(['error' => 'Booking not found or not completed'], 404);
            }

            // Check if review already exists
            $existingReview = Review::where('booking_id', $bookingId)
                ->where('reviewer_id', $profile->id)
                ->where('review_type', 'worker_to_customer')
                ->first();

            if ($existingReview) {
                return response()->json(['error' => 'Review already submitted for this booking'], 400);
            }

            // Create the review
            $review = Review::create([
                'id' => (string) Str::uuid(),
                'booking_id' => $bookingId,
                'reviewer_id' => $profile->id,
                'worker_id' => $booking->worker_id,
                'customer_id' => $booking->customer_id,
                'rating' => $request->rating,
                'comment' => $request->comment,
                'review_type' => 'worker_to_customer',
            ]);

            // Update customer profile rating stats
            $this->updateCustomerRatingStats($booking->customer_id);

            return response()->json([
                'success' => true,
                'message' => 'Customer review submitted successfully',
                'review' => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error submitting worker review: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to submit review'], 500);
        }
    }

    /**
     * Update customer rating statistics
     */
    private function updateCustomerRatingStats($customerId)
    {
        try {
            $customerProfile = Profile::find($customerId);
            if (!$customerProfile) {
                return;
            }

            // Calculate average rating and total reviews
            $reviews = Review::where('customer_id', $customerId)
                ->where('review_type', 'worker_to_customer')
                ->get();

            $totalReviews = $reviews->count();
            $averageRating = $totalReviews > 0 ? $reviews->avg('rating') : 0;

            // Update customer profile (if rating fields exist)
            $customerProfile->update([
                'customer_rating' => round($averageRating, 2),
                'customer_total_reviews' => $totalReviews,
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating customer rating stats: ' . $e->getMessage());
        }
    }

    /**
     * Update worker rating statistics
     */
    private function updateWorkerRatingStats($workerId)
    {
        try {
            $workerProfile = WorkerProfile::find($workerId);
            if (!$workerProfile) {
                return;
            }

            // Calculate average rating and total reviews
            $reviews = Review::where('worker_id', $workerId)
                ->where('review_type', 'customer_to_worker')
                ->get();

            $totalReviews = $reviews->count();
            $averageRating = $totalReviews > 0 ? $reviews->avg('rating') : 0;

            // Update worker profile
            $workerProfile->update([
                'rating' => round($averageRating, 2),
                'total_reviews' => $totalReviews,
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating worker rating stats: ' . $e->getMessage());
        }
    }

    /**
     * Get customer bookings
     */
    public function getCustomerBookings(Request $request)
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

            // Get bookings with related data including reviews
            $bookings = Booking::with([
                'service.category', 
                'worker.profile',
                'reviews.reviewer'
            ])
                ->where('customer_id', $profile->id)
                ->orderBy('created_at', 'desc')
                ->get();

            // Format the response
            $formattedBookings = $bookings->map(function ($booking) {
                // Safely get category name
                $categoryName = 'Uncategorized';
                if ($booking->service && $booking->service->category) {
                    if (is_object($booking->service->category)) {
                        $categoryName = $booking->service->category->name ?? 'Uncategorized';
                    } else {
                        $categoryName = $booking->service->category;
                    }
                }

                return [
                    'id' => $booking->id,
                    'service_title' => $booking->service ? $booking->service->title : 'Unknown Service',
                    'service_category' => $categoryName,
                    'worker_name' => $booking->worker && $booking->worker->profile ? 
                        $booking->worker->profile->first_name . ' ' . $booking->worker->profile->last_name : 
                        'Unknown Worker',
                    'total_amount' => $booking->total_amount,
                    'status' => $booking->status,
                    'scheduled_date' => $booking->scheduled_date,
                    'duration_hours' => $booking->duration_hours ?? 2,
                    'address' => $booking->address,
                    'notes' => $booking->notes,
                    'customer_confirmed_at' => $booking->customer_confirmed_at,
                    'created_at' => $booking->created_at,
                    'updated_at' => $booking->updated_at,
                    'has_review' => Review::where('booking_id', $booking->id)
                        ->where('reviewer_id', $booking->customer_id)
                        ->where('review_type', 'customer_to_worker')
                        ->exists(),
                    'customer_review' => $booking->reviews
                        ->where('reviewer_id', $booking->customer_id)
                        ->where('review_type', 'customer_to_worker')
                        ->first(),
                    'worker_review' => $booking->reviews
                        ->where('reviewer_id', $booking->worker_id)
                        ->where('review_type', 'worker_to_customer')
                        ->first(),
                ];
            });

            return response()->json([
                'success' => true,
                'bookings' => $formattedBookings
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching customer bookings: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch bookings'], 500);
        }
    }

    /**
     * Reject an offer
     */
    public function rejectOffer(Request $request, string $offerId)
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

            $offer = Offer::where('id', $offerId)
                ->where('customer_id', $profile->id)
                ->firstOrFail();

            if ($offer->status !== 'pending') {
                return response()->json(['error' => 'Offer is not pending'], 400);
            }

            DB::beginTransaction();

            // Update offer status
            $offer->update(['status' => 'rejected']);

            // Create notification for worker
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $offer->worker_id,
                'type' => 'offer_rejected',
                'title' => 'Offer Rejected',
                'message' => "Your offer has been rejected by the customer.",
                'data' => json_encode([
                    'offer_id' => $offer->id,
                    'customer_id' => $profile->id
                ]),
                'is_read' => false,
            ]);

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Offer rejected successfully']);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Error rejecting offer: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to reject offer'], 500);
        }
    }

    /**
     * Check if there are new requests (less than 1 hour old)
     */
    private function checkForNewRequests($requests)
    {
        $oneHourAgo = now()->subHour();
        return $requests->filter(function ($request) use ($oneHourAgo) {
            return $request['created_at'] > $oneHourAgo;
        })->count() > 0;
    }

    /**
     * Get worker reviews
     */
    public function getWorkerReviews($workerId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get worker reviews with customer and service information
            $reviews = Review::with(['reviewer', 'booking.service'])
                ->where('worker_id', $workerId)
                ->orderBy('created_at', 'desc')
                ->get();

            // Calculate statistics
            $totalReviews = $reviews->count();
            $averageRating = $totalReviews > 0 ? $reviews->avg('rating') : 0;
            
            // Calculate rating distribution
            $ratingDistribution = [
                5 => $reviews->where('rating', 5)->count(),
                4 => $reviews->where('rating', 4)->count(),
                3 => $reviews->where('rating', 3)->count(),
                2 => $reviews->where('rating', 2)->count(),
                1 => $reviews->where('rating', 1)->count(),
            ];

            // Format reviews for frontend
            $formattedReviews = $reviews->map(function ($review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at,
                    'customer_name' => $review->reviewer ? $review->reviewer->first_name . ' ' . $review->reviewer->last_name : 'Anonymous',
                    'service_title' => $review->booking && $review->booking->service ? $review->booking->service->title : 'Unknown Service',
                    'booking_id' => $review->booking_id,
                ];
            });

            return response()->json([
                'success' => true,
                'reviews' => $formattedReviews,
                'stats' => [
                    'total_reviews' => $totalReviews,
                    'average_rating' => round($averageRating, 2),
                    'rating_distribution' => $ratingDistribution,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching worker reviews: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch worker reviews'], 500);
        }
    }
}