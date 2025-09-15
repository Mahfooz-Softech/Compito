<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Profile;
use App\Models\Booking;
use App\Models\ServiceRequest;
use App\Models\Offer;
use App\Models\Review;
use App\Models\Notification;
use App\Models\Service;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get customer dashboard statistics
     */
    public function getCustomerDashboardStats(Request $request)
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

            $customerId = $profile->id;

            // Get basic statistics
            $totalBookings = Booking::where('customer_id', $customerId)->count();
            $completedBookings = Booking::where('customer_id', $customerId)
                ->where('status', 'completed')
                ->count();
            $pendingBookings = Booking::where('customer_id', $customerId)
                ->whereIn('status', ['pending', 'confirmed', 'worker_completed'])
                ->count();
            $cancelledBookings = Booking::where('customer_id', $customerId)
                ->where('status', 'cancelled')
                ->count();

            // Get total spent
            $totalSpent = Booking::where('customer_id', $customerId)
                ->where('status', 'completed')
                ->sum('total_amount');

            // Get average rating received
            $customerReviews = Review::where('customer_id', $customerId)
                ->where('review_type', 'worker_to_customer')
                ->get();
            $averageRating = $customerReviews->count() > 0 ? $customerReviews->avg('rating') : 0;

            // Get service requests statistics
            $totalServiceRequests = ServiceRequest::where('customer_id', $customerId)->count();
            $pendingServiceRequests = ServiceRequest::where('customer_id', $customerId)
                ->where('status', 'pending')
                ->count();
            $respondedServiceRequests = ServiceRequest::where('customer_id', $customerId)
                ->where('status', 'responded')
                ->count();

            // Get offers statistics
            $totalOffers = Offer::where('customer_id', $customerId)->count();
            $pendingOffers = Offer::where('customer_id', $customerId)
                ->where('status', 'pending')
                ->where('expires_at', '>', now())
                ->count();
            $acceptedOffers = Offer::where('customer_id', $customerId)
                ->where('status', 'accepted')
                ->count();

            // Get recent activity (last 30 days)
            $thirtyDaysAgo = Carbon::now()->subDays(30);
            
            $recentBookings = Booking::where('customer_id', $customerId)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->count();

            $recentServiceRequests = ServiceRequest::where('customer_id', $customerId)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->count();

            // Get monthly spending data for the last 6 months
            $monthlySpending = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $monthStart = $month->copy()->startOfMonth();
                $monthEnd = $month->copy()->endOfMonth();
                
                $spending = Booking::where('customer_id', $customerId)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->sum('total_amount');
                
                $monthlySpending[] = [
                    'month' => $month->format('M Y'),
                    'amount' => (float) $spending
                ];
            }

            // Get top services used
            $topServices = Booking::where('customer_id', $customerId)
                ->where('status', 'completed')
                ->join('services', 'bookings.service_id', '=', 'services.id')
                ->select('services.title', 'services.id', DB::raw('COUNT(*) as usage_count'), DB::raw('SUM(bookings.total_amount) as total_spent'))
                ->groupBy('services.id', 'services.title')
                ->orderBy('usage_count', 'desc')
                ->limit(5)
                ->get();

            // Get recent bookings with details
            $recentBookingsDetails = Booking::with(['service', 'worker.profile'])
                ->where('customer_id', $customerId)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($booking) {
                    return [
                        'id' => $booking->id,
                        'service_title' => $booking->service ? $booking->service->title : 'Unknown Service',
                        'worker_name' => $booking->worker && $booking->worker->profile ? 
                            $booking->worker->profile->first_name . ' ' . $booking->worker->profile->last_name : 
                            'Unknown Worker',
                        'total_amount' => $booking->total_amount,
                        'status' => $booking->status,
                        'scheduled_date' => $booking->scheduled_date,
                        'created_at' => $booking->created_at,
                    ];
                });

            // Get unread notifications count
            $unreadNotifications = Notification::where('user_id', $customerId)
                ->where('is_read', false)
                ->count();

            // Get customer rating distribution
            $ratingDistribution = [
                5 => $customerReviews->where('rating', 5)->count(),
                4 => $customerReviews->where('rating', 4)->count(),
                3 => $customerReviews->where('rating', 3)->count(),
                2 => $customerReviews->where('rating', 2)->count(),
                1 => $customerReviews->where('rating', 1)->count(),
            ];

            return response()->json([
                'success' => true,
                'stats' => [
                    'overview' => [
                        'total_bookings' => $totalBookings,
                        'completed_bookings' => $completedBookings,
                        'pending_bookings' => $pendingBookings,
                        'cancelled_bookings' => $cancelledBookings,
                        'total_spent' => (float) $totalSpent,
                        'average_rating' => round($averageRating, 2),
                        'total_reviews' => $customerReviews->count(),
                    ],
                    'service_requests' => [
                        'total_requests' => $totalServiceRequests,
                        'pending_requests' => $pendingServiceRequests,
                        'responded_requests' => $respondedServiceRequests,
                    ],
                    'offers' => [
                        'total_offers' => $totalOffers,
                        'pending_offers' => $pendingOffers,
                        'accepted_offers' => $acceptedOffers,
                    ],
                    'recent_activity' => [
                        'recent_bookings' => $recentBookings,
                        'recent_service_requests' => $recentServiceRequests,
                        'unread_notifications' => $unreadNotifications,
                    ],
                    'monthly_spending' => $monthlySpending,
                    'top_services' => $topServices,
                    'recent_bookings_details' => $recentBookingsDetails,
                    'rating_distribution' => $ratingDistribution,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching customer dashboard stats: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch dashboard statistics'], 500);
        }
    }

    /**
     * Get customer dashboard charts data
     */
    public function getCustomerDashboardCharts(Request $request)
    {
        try {
            $authUser = Auth::user();
            if (!$authUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $authUser->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $customerId = $profile->id;

            // Get booking status distribution
            $bookingStatusData = Booking::where('customer_id', $customerId)
                ->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status')
                ->toArray();

            // Get service category distribution
            $serviceCategoryData = Booking::where('customer_id', $customerId)
                ->where('status', 'completed')
                ->join('services', 'bookings.service_id', '=', 'services.id')
                ->join('categories', 'services.category_id', '=', 'categories.id')
                ->select('categories.name', DB::raw('COUNT(*) as count'), DB::raw('SUM(bookings.total_amount) as total_spent'))
                ->groupBy('categories.id', 'categories.name')
                ->orderBy('count', 'desc')
                ->get();

            // Get weekly activity for the last 8 weeks
            $weeklyActivity = [];
            for ($i = 7; $i >= 0; $i--) {
                $week = Carbon::now()->subWeeks($i);
                $weekStart = $week->copy()->startOfWeek();
                $weekEnd = $week->copy()->endOfWeek();
                
                $bookings = Booking::where('customer_id', $customerId)
                    ->whereBetween('created_at', [$weekStart, $weekEnd])
                    ->count();
                
                $serviceRequests = ServiceRequest::where('customer_id', $customerId)
                    ->whereBetween('created_at', [$weekStart, $weekEnd])
                    ->count();
                
                $weeklyActivity[] = [
                    'week' => $week->format('M d'),
                    'bookings' => $bookings,
                    'service_requests' => $serviceRequests,
                ];
            }

            // Get spending by month for the last 12 months
            $yearlySpending = [];
            for ($i = 11; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $monthStart = $month->copy()->startOfMonth();
                $monthEnd = $month->copy()->endOfMonth();
                
                $spending = Booking::where('customer_id', $customerId)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->sum('total_amount');
                
                $yearlySpending[] = [
                    'month' => $month->format('M'),
                    'year' => $month->format('Y'),
                    'amount' => (float) $spending
                ];
            }

            return response()->json([
                'success' => true,
                'charts' => [
                    'booking_status_distribution' => $bookingStatusData,
                    'service_category_distribution' => $serviceCategoryData,
                    'weekly_activity' => $weeklyActivity,
                    'yearly_spending' => $yearlySpending,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching customer dashboard charts: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch dashboard charts'], 500);
        }
    }

    /**
     * Get customer recent activity
     */
    public function getCustomerRecentActivity(Request $request)
    {
        try {
            $authUser = Auth::user();
            if (!$authUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $authUser->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $customerId = $profile->id;
            $limit = $request->get('limit', 10);

            // Get recent bookings
            $recentBookings = Booking::with(['service', 'worker.profile'])
                ->where('customer_id', $customerId)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($booking) {
                    return [
                        'type' => 'booking',
                        'id' => $booking->id,
                        'title' => 'Booking: ' . ($booking->service ? $booking->service->title : 'Unknown Service'),
                        'description' => 'Status: ' . ucfirst($booking->status),
                        'amount' => $booking->total_amount,
                        'date' => $booking->created_at,
                        'status' => $booking->status,
                    ];
                });

            // Get recent service requests
            $recentServiceRequests = ServiceRequest::with(['service'])
                ->where('customer_id', $customerId)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($request) {
                    return [
                        'type' => 'service_request',
                        'id' => $request->id,
                        'title' => 'Service Request: ' . ($request->service ? $request->service->title : 'Unknown Service'),
                        'description' => 'Status: ' . ucfirst($request->status),
                        'amount' => null,
                        'date' => $request->created_at,
                        'status' => $request->status,
                    ];
                });

            // Get recent offers
            $recentOffers = Offer::with(['service', 'worker.profile'])
                ->where('customer_id', $customerId)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($offer) {
                    return [
                        'type' => 'offer',
                        'id' => $offer->id,
                        'title' => 'Offer: ' . ($offer->service ? $offer->service->title : 'Unknown Service'),
                        'description' => 'From: ' . ($offer->worker && $offer->worker->profile ? 
                            $offer->worker->profile->first_name . ' ' . $offer->worker->profile->last_name : 
                            'Unknown Worker'),
                        'amount' => $offer->price,
                        'date' => $offer->created_at,
                        'status' => $offer->status,
                    ];
                });

            // Combine and sort all activities
            $allActivities = collect()
                ->merge($recentBookings)
                ->merge($recentServiceRequests)
                ->merge($recentOffers)
                ->sortByDesc('date')
                ->take($limit);

            return response()->json([
                'success' => true,
                'activities' => $allActivities->values()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching customer recent activity: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch recent activity'], 500);
        }
    }

    /**
     * Get customer payments (derived from bookings)
     */
    public function getCustomerPayments(Request $request)
    {
        try {
            $authUser = Auth::user();
            if (!$authUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $authUser->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $bookings = Booking::with(['service.category', 'worker.profile'])
                ->where('customer_id', $profile->id)
                ->orderBy('created_at', 'desc')
                ->get();

            $payments = $bookings->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'service' => $booking->service ? $booking->service->title : 'Unknown Service',
                    'service_category' => $booking->service && $booking->service->category ?
                        (is_object($booking->service->category) ? ($booking->service->category->name ?? 'Uncategorized') : $booking->service->category)
                        : 'Uncategorized',
                    'worker' => $booking->worker && $booking->worker->profile ?
                        trim(($booking->worker->profile->first_name ?? '') . ' ' . ($booking->worker->profile->last_name ?? '')) : 'Unknown Worker',
                    'date' => optional($booking->created_at)->toDateString(),
                    'total_amount' => (float) ($booking->total_amount ?? 0),
                    'commission_amount' => (float) ($booking->commission_amount ?? 0),
                    'payment_status' => $booking->stripe_payment_status ?? ($booking->status === 'completed' ? 'completed' : 'pending'),
                    'created_at' => $booking->created_at,
                ];
            });

            $totalSpent = (float) $bookings->sum('total_amount');
            $platformFees = (float) $bookings->sum('commission_amount');

            return response()->json([
                'success' => true,
                'payments' => $payments,
                'stats' => [
                    'totalSpent' => $totalSpent,
                    'totalPayments' => $payments->count(),
                    'platformFees' => $platformFees,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching customer payments: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch payments'], 500);
        }
    }

    /**
     * Get customer reviews received from workers
     */
    public function getCustomerReviews(Request $request)
    {
        try {
            $authUser = Auth::user();
            if (!$authUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $authUser->id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $reviews = Review::with(['reviewer', 'booking.service'])
                ->where('customer_id', $profile->id)
                ->where('review_type', 'worker_to_customer')
                ->orderBy('created_at', 'desc')
                ->get();

            $total = $reviews->count();
            $avg = $total > 0 ? (float) $reviews->avg('rating') : 0.0;
            $distribution = [
                5 => $reviews->where('rating', 5)->count(),
                4 => $reviews->where('rating', 4)->count(),
                3 => $reviews->where('rating', 3)->count(),
                2 => $reviews->where('rating', 2)->count(),
                1 => $reviews->where('rating', 1)->count(),
            ];

            $formatted = $reviews->map(function ($review) {
                return [
                    'id' => $review->id,
                    'rating' => (int) $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at,
                    'reviewer' => $review->reviewer ? [
                        'first_name' => $review->reviewer->first_name,
                        'last_name' => $review->reviewer->last_name,
                        'avatar_url' => $review->reviewer->avatar_url ?? null,
                    ] : null,
                    'booking' => $review->booking ? [
                        'service' => $review->booking->service ? [
                            'title' => $review->booking->service->title
                        ] : null
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'reviews' => $formatted,
                'stats' => [
                    'averageRating' => round($avg, 2),
                    'totalReviews' => $total,
                    'ratingDistribution' => $distribution,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching customer reviews: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch reviews'], 500);
        }
    }
}
