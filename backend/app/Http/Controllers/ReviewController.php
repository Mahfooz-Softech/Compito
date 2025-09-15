<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Review;
use App\Models\Profile;
use App\Models\Booking;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReviewController extends Controller
{
    /**
     * Get reviews for authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $perPage = $request->query('per_page', 20);
            $workerId = $request->query('worker_id');

            $query = Review::with([
                'reviewer:id,first_name,last_name',
                'worker.profile:id,first_name,last_name',
                'booking:id,service_id',
                'service:id,title'
            ]);

            // Filter based on user type
            if ($profile->user_type === 'customer') {
                $query->where('reviewer_id', $user->id);
            } elseif ($profile->user_type === 'worker') {
                $query->where('worker_id', $user->id);
            } elseif ($profile->user_type === 'admin') {
                // Admins can see all reviews
            } else {
                return response()->json(['error' => 'Access denied'], 403);
            }

            if ($workerId) {
                $query->where('worker_id', $workerId);
            }

            $reviews = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $reviews
            ]);

        } catch (\Exception $error) {
            Log::error('Error fetching reviews:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Create a new review
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'customer') {
                return response()->json(['error' => 'Only customers can create reviews'], 403);
            }

            $validated = $request->validate([
                'worker_id' => 'required|exists:worker_profiles,id',
                'booking_id' => 'required|exists:bookings,id',
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000'
            ]);

            // Check if booking belongs to the customer
            $booking = Booking::where('id', $validated['booking_id'])
                ->where('customer_id', $user->id)
                ->where('worker_id', $validated['worker_id'])
                ->where('status', 'completed')
                ->first();

            if (!$booking) {
                return response()->json(['error' => 'Booking not found or not completed'], 400);
            }

            // Check if review already exists for this booking
            $existingReview = Review::where('booking_id', $validated['booking_id'])
                ->where('reviewer_id', $user->id)
                ->first();

            if ($existingReview) {
                return response()->json(['error' => 'Review already exists for this booking'], 400);
            }

            DB::beginTransaction();

            $review = Review::create([
                'reviewer_id' => $user->id,
                'worker_id' => $validated['worker_id'],
                'booking_id' => $validated['booking_id'],
                'service_id' => $booking->service_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment']
            ]);

            // Send notification to worker
            $customerName = $profile->first_name . ' ' . $profile->last_name;
            $serviceTitle = $booking->service ? $booking->service->title : 'Professional Service';
            
            NotificationController::createNotification(
                $validated['worker_id'],
                'new_review',
                'New Review Received',
                $customerName . ' has posted a review for ' . $serviceTitle,
                $review->id,
                'review'
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Review created successfully',
                'data' => $review->load(['reviewer:id,first_name,last_name', 'service:id,title'])
            ], 201);

        } catch (\Exception $error) {
            DB::rollBack();
            Log::error('Error creating review:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Update review
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $review = Review::findOrFail($id);

            // Check if user can update this review
            if ($profile->user_type === 'customer' && $review->reviewer_id !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            } elseif ($profile->user_type !== 'admin' && $profile->user_type !== 'customer') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $validated = $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000'
            ]);

            $review->update([
                'rating' => $validated['rating'],
                'comment' => $validated['comment']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Review updated successfully',
                'data' => $review->load(['reviewer:id,first_name,last_name', 'worker.profile:id,first_name,last_name', 'service:id,title'])
            ]);

        } catch (\Exception $error) {
            Log::error('Error updating review:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get single review
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $review = Review::with([
                'reviewer:id,first_name,last_name',
                'worker.profile:id,first_name,last_name',
                'booking:id,service_id',
                'service:id,title'
            ])->findOrFail($id);

            // Check access
            if ($profile->user_type === 'customer' && $review->reviewer_id !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            } elseif ($profile->user_type === 'worker' && $review->worker_id !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            } elseif ($profile->user_type !== 'admin' && $profile->user_type !== 'worker' && $profile->user_type !== 'customer') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $review
            ]);

        } catch (\Exception $error) {
            Log::error('Error fetching review:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Delete review
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $review = Review::findOrFail($id);

            // Check if user can delete this review
            if ($profile->user_type === 'customer' && $review->reviewer_id !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            } elseif ($profile->user_type !== 'admin' && $profile->user_type !== 'customer') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $review->delete();

            return response()->json([
                'success' => true,
                'message' => 'Review deleted successfully'
            ]);

        } catch (\Exception $error) {
            Log::error('Error deleting review:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get worker's average rating
     */
    public function getWorkerRating($workerId)
    {
        try {
            $reviews = Review::where('worker_id', $workerId)->get();
            
            if ($reviews->count() === 0) {
                return response()->json([
                    'success' => true,
                    'average_rating' => 0,
                    'total_reviews' => 0
                ]);
            }

            $averageRating = $reviews->avg('rating');
            $totalReviews = $reviews->count();

            return response()->json([
                'success' => true,
                'average_rating' => round($averageRating, 2),
                'total_reviews' => $totalReviews
            ]);

        } catch (\Exception $error) {
            Log::error('Error getting worker rating:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
