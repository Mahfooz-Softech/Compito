<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Profile;
use App\Models\WorkerProfile;
use App\Models\Booking;
use App\Models\Service;
use App\Models\Payment;
use App\Models\Review;
use Illuminate\Support\Str;

class WorkerController extends Controller
{
    /**
     * List service requests assigned to the authenticated worker
     */
    public function listWorkerServiceRequests(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Fetch raw requests (exclude declined requests and requests with existing offers)
            $requests = DB::table('service_requests')
                ->where('worker_id', $user->id)
                ->where('status', '!=', 'declined')
                ->whereNotExists(function ($query) {
                    $query->select(DB::raw(1))
                          ->from('offers')
                          ->whereColumn('offers.service_request_id', 'service_requests.id');
                })
                ->orderBy('created_at', 'desc')
                ->get();

            if ($requests->isEmpty()) {
                return response()->json([
                    'serviceRequests' => [],
                    'hasNewRequests' => false
                ]);
            }

            // Collect ids for joins
            $serviceIds = $requests->pluck('service_id')->filter()->unique()->values();
            $customerIds = $requests->pluck('customer_id')->filter()->unique()->values();

            // Fetch services (id, title)
            $services = DB::table('services')
                ->select(['id', 'title'])
                ->whereIn('id', $serviceIds)
                ->get()
                ->keyBy('id');

            // Fetch customer profiles (first_name, last_name)
            $customers = DB::table('profiles')
                ->select(['id', 'first_name', 'last_name'])
                ->whereIn('id', $customerIds)
                ->get()
                ->keyBy('id');

            // Map into enriched payload
            $enriched = $requests->map(function($r) use ($services, $customers) {
                $service = $services->get($r->service_id);
                $customer = $customers->get($r->customer_id);
                $createdAt = $r->created_at ? \Carbon\Carbon::parse($r->created_at) : null;
                $expiresAt = $createdAt ? $createdAt->copy()->addDay() : null;
                return [
                    'id' => $r->id,
                    'customer_id' => $r->customer_id,
                    'service_id' => $r->service_id,
                    'service_title' => $service->title ?? 'Service',
                    'customer_name' => $customer ? trim(($customer->first_name ?? '').' '.($customer->last_name ?? '')) : 'Customer',
                    'location_address' => $r->location_address,
                    'preferred_date' => $r->preferred_date,
                    'budget_min' => (float) ($r->budget_min ?? 0),
                    'budget_max' => (float) ($r->budget_max ?? 0),
                    'message_to_worker' => $r->message_to_worker,
                    'status' => $r->status,
                    'created_at' => $r->created_at,
                    'expires_at' => $expiresAt ? $expiresAt->toDateTimeString() : ($r->expires_at ?? $r->created_at),
                ];
            })->values();

            // Check if there are new requests (less than 1 hour old)
            $oneHourAgo = now()->subHour();
            $hasNewRequests = $enriched->filter(function ($request) use ($oneHourAgo) {
                return $request['created_at'] && \Carbon\Carbon::parse($request['created_at'])->gt($oneHourAgo);
            })->count() > 0;

            return response()->json([
                'serviceRequests' => $enriched,
                'hasNewRequests' => $hasNewRequests
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error listing worker service requests: '.$e->getMessage());
            return response()->json([
                'serviceRequests' => [],
                'hasNewRequests' => false
            ], 200);
        }
    }

    /**
     * Create an offer from worker for a service request
     */
    public function createWorkerOffer(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validated = $request->validate([
                'service_request_id' => 'required|string',
                'customer_id' => 'required|string',
                'service_id' => 'required|string',
                'price' => 'required|numeric|min:0',
                'estimated_hours' => 'required|numeric|min:0.5',
                'description' => 'required|string',
            ]);

            // Insert into offers table
            DB::table('offers')->insert([
                'id' => (string) \Str::uuid(),
                'service_request_id' => $validated['service_request_id'],
                'worker_id' => $user->id,
                'customer_id' => $validated['customer_id'],
                'service_id' => $validated['service_id'],
                'price' => $validated['price'],
                'estimated_hours' => $validated['estimated_hours'],
                'description' => $validated['description'],
                'status' => 'pending',
                'expires_at' => now()->addDay(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Mark service request as responded
            DB::table('service_requests')
                ->where('id', $validated['service_request_id'])
                ->where('worker_id', $user->id)
                ->update([
                    'status' => 'responded',
                    'worker_response' => json_encode([
                        'price' => $validated['price'],
                        'estimated_hours' => $validated['estimated_hours'],
                        'description' => $validated['description'],
                    ]),
                    'updated_at' => now(),
                ]);

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            \Log::error('Error creating worker offer: '.$e->getMessage());
            return response()->json(['error' => 'Failed to create offer'], 400);
        }
    }

    /**
     * Search workers by location (customer browse)
     */
    public function searchWorkersByLocation(Request $request)
    {
        try {
            // Public endpoint: no auth required
            // Parse inputs
            $postcode = (string) $request->input('postcode', '');
            $latitude = $request->input('latitude');
            $longitude = $request->input('longitude');
            $maxDistance = (float) ($request->input('maxDistance', 10));

            // If neither coords nor postcode provided → empty result
            if ((empty($latitude) || empty($longitude)) && empty($postcode)) {
                return response()->json([
                    'workers' => [],
                    'workerCounts' => [
                        'within5Miles' => 0,
                        'within10Miles' => 0,
                        'within20Miles' => 0,
                        'total' => 0,
                    ],
                ]);
            }

            // Normalize postcode (uppercase, remove spaces) for comparison
            $normPostcode = $postcode ? strtoupper(str_replace(' ', '', $postcode)) : '';

            // Postcode-only fallback: if no coords but postcode provided, match same-postcode workers and return with distance = 0
            if ((empty($latitude) || empty($longitude)) && !empty($normPostcode)) {
                $candidates = Profile::where('user_type', 'worker')
                    ->select(['id', 'first_name', 'last_name', 'postcode', 'latitude', 'longitude'])
                    ->get();

                if ($candidates->isEmpty()) {
                    return response()->json([
                        'workers' => [],
                        'workerCounts' => [
                            'within5Miles' => 0,
                            'within10Miles' => 0,
                            'within20Miles' => 0,
                            'total' => 0,
                        ],
                    ]);
                }

                $workerProfiles = WorkerProfile::whereIn('id', $candidates->pluck('id')->all())
                    ->get()
                    ->keyBy('id');

                $results = [];
                foreach ($candidates as $p) {
                    $pPostcode = strtoupper(str_replace(' ', '', (string) ($p->postcode ?? '')));
                    if ($pPostcode !== $normPostcode) { continue; }
                    $wp = $workerProfiles->get($p->id);
                    $results[] = [
                        'id' => $p->id,
                        'worker_profile_id' => $p->id,
                        'first_name' => $p->first_name ?? '',
                        'last_name' => $p->last_name ?? '',
                        'postcode' => $p->postcode ?? '',
                        'latitude' => is_numeric($p->latitude) ? (float) $p->latitude : null,
                        'longitude' => is_numeric($p->longitude) ? (float) $p->longitude : null,
                        'distance' => 0.0,
                        'is_available' => (bool) ($wp->is_available ?? true),
                        'is_online' => (bool) ($wp->is_online ?? false),
                        'rating' => (float) ($wp->rating ?? 0),
                        'total_reviews' => (int) ($wp->total_reviews ?? 0),
                        'hourly_rate' => (float) ($wp->hourly_rate ?? 0),
                        'bio' => $wp->bio ?? null,
                    ];
                }

                return response()->json([
                    'workers' => array_values($results),
                    'workerCounts' => [
                        'within5Miles' => count($results),
                        'within10Miles' => count($results),
                        'within20Miles' => count($results),
                        'total' => count($results),
                    ],
                ]);
            }

            // Coordinate-based search with distance calculation
            // Get all workers with coordinates
            $candidates = Profile::where('user_type', 'worker')
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->select(['id', 'first_name', 'last_name', 'postcode', 'latitude', 'longitude'])
                ->get();

            if ($candidates->isEmpty()) {
                return response()->json([
                    'workers' => [],
                    'workerCounts' => [
                        'within5Miles' => 0,
                        'within10Miles' => 0,
                        'within20Miles' => 0,
                        'total' => 0,
                    ],
                ]);
            }

            // Get worker profiles
            $workerProfiles = WorkerProfile::whereIn('id', $candidates->pluck('id')->all())
                ->get()
                ->keyBy('id');

            $results = [];
            $within5Miles = 0;
            $within10Miles = 0;
            $within20Miles = 0;

            foreach ($candidates as $p) {
                // Calculate distance using Haversine formula
                $distance = $this->calculateDistance($latitude, $longitude, $p->latitude, $p->longitude);
                
                // Only include workers within maxDistance
                if ($distance <= $maxDistance) {
                    $wp = $workerProfiles->get($p->id);
                    
                    $results[] = [
                        'id' => $p->id,
                        'worker_profile_id' => $p->id,
                        'first_name' => $p->first_name ?? '',
                        'last_name' => $p->last_name ?? '',
                        'postcode' => $p->postcode ?? '',
                        'latitude' => (float) $p->latitude,
                        'longitude' => (float) $p->longitude,
                        'distance' => round($distance, 2),
                        'is_available' => (bool) ($wp->is_available ?? true),
                        'is_online' => (bool) ($wp->is_online ?? false),
                        'rating' => (float) ($wp->rating ?? 0),
                        'total_reviews' => (int) ($wp->total_reviews ?? 0),
                        'hourly_rate' => (float) ($wp->hourly_rate ?? 0),
                        'bio' => $wp->bio ?? null,
                    ];

                    // Count by distance ranges
                    if ($distance <= 5) $within5Miles++;
                    if ($distance <= 10) $within10Miles++;
                    if ($distance <= 20) $within20Miles++;
                }
            }

            return response()->json([
                'workers' => array_values($results),
                'workerCounts' => [
                    'within5Miles' => $within5Miles,
                    'within10Miles' => $within10Miles,
                    'within20Miles' => $within20Miles,
                    'total' => count($results),
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error searching workers by location: ' . $e->getMessage());
            return response()->json([
                'workers' => [],
                'workerCounts' => [
                    'within5Miles' => 0,
                    'within10Miles' => 0,
                    'within20Miles' => 0,
                    'total' => 0,
                ],
            ], 200);
        }
    }

    /**
     * Get worker data for dashboard
     */
    public function getWorkerData($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get worker profile
            $workerProfile = WorkerProfile::where('id', $id)->first();
            if (!$workerProfile) {
                return response()->json(['error' => 'Worker profile not found'], 404);
            }

            // Get profile data
            $profile = Profile::where('id', $id)->first();
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            // Get recent bookings
            $recentBookings = Booking::with(['service', 'customer'])
                ->where('worker_id', $id)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            // Get total earnings
            $totalEarnings = Payment::where('worker_id', $id)
                ->where('payment_status', 'completed')
                ->sum('worker_payout');

            // Get monthly earnings (current month)
            $monthlyEarnings = Payment::where('worker_id', $id)
                ->where('payment_status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('worker_payout');

            // Get completed jobs count
            $completedJobs = Booking::where('worker_id', $id)
                ->where('status', 'completed')
                ->count();

            // Get average rating
            $averageRating = Review::where('worker_id', $id)
                ->avg('rating') ?? 0;

            // Get total reviews
            $totalReviews = Review::where('worker_id', $id)->count();

            // Calculate comprehensive statistics
            
            // Monthly gross earnings (total amount before commission)
            $monthlyGrossEarnings = Payment::where('worker_id', $id)
                ->where('payment_status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total_amount');

            // Monthly commission
            $monthlyCommission = $monthlyGrossEarnings - $monthlyEarnings;

            // Commission rate (average)
            $avgCommissionRate = Payment::where('worker_id', $id)
                ->where('payment_status', 'completed')
                ->avg('commission_rate') ?? 0.15; // Default 15%

            // Active clients (unique customers with completed bookings)
            $activeClients = Booking::where('worker_id', $id)
                ->where('status', 'completed')
                ->distinct('customer_id')
                ->count('customer_id');

            // New clients this month
            $newClientsThisMonth = Booking::where('worker_id', $id)
                ->where('status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->distinct('customer_id')
                ->count('customer_id');

            // Jobs this month
            $jobsThisMonth = Booking::where('worker_id', $id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            // Repeat customers
            $repeatCustomers = Booking::selectRaw('customer_id, COUNT(*) as booking_count')
                ->where('worker_id', $id)
                ->where('status', 'completed')
                ->groupBy('customer_id')
                ->havingRaw('COUNT(*) > 1')
                ->count();

            // Response rate (percentage of service requests responded to)
            $totalServiceRequests = \App\Models\ServiceRequest::where('worker_id', $id)->count();
            $respondedServiceRequests = \App\Models\ServiceRequest::where('worker_id', $id)
                ->where('status', 'responded')
                ->count();
            $responseRate = $totalServiceRequests > 0 ? round(($respondedServiceRequests / $totalServiceRequests) * 100, 1) : 100;

            // On-time rate (bookings completed on or before scheduled date)
            $onTimeBookings = Booking::where('worker_id', $id)
                ->where('status', 'completed')
                ->whereNotNull('worker_completed_at')
                ->whereRaw('worker_completed_at <= created_at + INTERVAL \'1 day\'') // Assuming 1 day buffer
                ->count();
            $onTimeRate = $completedJobs > 0 ? round(($onTimeBookings / $completedJobs) * 100, 1) : 100;

            // Monthly earnings data for last 6 months
            $monthlyEarningsData = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $monthlyTotal = Payment::where('worker_id', $id)
                    ->where('payment_status', 'completed')
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->sum('worker_payout');

                $monthlyEarningsData[] = [
                    'month' => $date->format('M'),
                    'earnings' => $monthlyTotal,
                ];
            }

            // Get worker category from services
            $primaryCategory = \App\Models\Service::where('worker_id', $id)
                ->with('category')
                ->first();
            $category = $primaryCategory && $primaryCategory->category ? $primaryCategory->category->name : 'General';

            return response()->json([
                'success' => true,
                'worker' => [
                    'id' => $workerProfile->id,
                    'first_name' => $profile->first_name,
                    'last_name' => $profile->last_name,
                    'email' => $profile->email,
                    'phone' => $profile->phone,
                    'location' => $profile->location,
                    'bio' => $workerProfile->bio,
                    'hourly_rate' => $workerProfile->hourly_rate,
                    'rating' => $workerProfile->rating,
                    'total_reviews' => $workerProfile->total_reviews,
                    'is_available' => $workerProfile->is_available,
                    'is_online' => $workerProfile->is_online,
                    'experience_years' => $workerProfile->experience_years,
                    'completed_jobs' => $workerProfile->completed_jobs,
                    'total_earnings' => $workerProfile->total_earnings,
                ],
                'stats' => [
                    // Basic stats
                    'total_earnings' => $totalEarnings,
                    'monthly_earnings' => $monthlyEarnings,
                    'monthly_gross_earnings' => $monthlyGrossEarnings,
                    'monthly_commission' => $monthlyCommission,
                    'completed_jobs' => $completedJobs,
                    'average_rating' => round($averageRating, 2),
                    'total_reviews' => $totalReviews,
                    
                    // Advanced stats
                    'active_clients' => $activeClients,
                    'new_clients_this_month' => $newClientsThisMonth,
                    'jobs_this_month' => $jobsThisMonth,
                    'repeat_customers' => $repeatCustomers,
                    'response_rate' => $responseRate,
                    'on_time_rate' => $onTimeRate,
                    'commission_rate' => round($avgCommissionRate, 4),
                    'category' => $category,
                    
                    // Goals and targets
                    'monthly_goal' => 3000, // Could be made dynamic later
                    'monthly_job_goal' => 20, // Could be made dynamic later
                    
                    // Monthly earnings data for charts
                    'monthly_earnings_data' => $monthlyEarningsData,
                ],
                'recent_jobs' => $recentBookings->map(function ($booking) {
                    return [
                        'id' => $booking->id,
                        'service_title' => $booking->service->title ?? 'Unknown Service',
                        'customer_name' => $booking->customer->first_name . ' ' . $booking->customer->last_name,
                        'status' => $booking->status,
                        'total_amount' => $booking->total_amount,
                        'created_at' => $booking->created_at,
                    ];
                }),
                // Additional data arrays that frontend expects
                'upcoming_schedule' => [],
                'worker_profile' => $workerProfile,
                'worker_services' => [],
                'messages' => ['conversations' => [], 'active_chat' => []],
                'reviews' => [],
                'earnings' => [],
                'availability' => [],
                'alerts' => [],
                'profile_completion' => $this->calculateProfileCompletion($id),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching worker data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch worker data'], 500);
        }
    }

    /**
     * Get worker earnings data
     */
    public function getWorkerEarnings($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get worker profile
            $workerProfile = WorkerProfile::where('id', $id)->first();
            if (!$workerProfile) {
                return response()->json(['error' => 'Worker profile not found'], 404);
            }

            // Get earnings by month for the last 12 months
            $monthlyEarnings = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $monthlyTotal = Payment::where('worker_id', $id)
                    ->where('payment_status', 'completed')
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->sum('worker_payout');

                $monthlyEarnings[] = [
                    'month' => $date->format('M Y'),
                    'earnings' => $monthlyTotal,
                ];
            }

            // Get total lifetime earnings
            $totalEarnings = Payment::where('worker_id', $id)
                ->where('payment_status', 'completed')
                ->sum('worker_payout');

            // Get current month earnings
            $currentMonthEarnings = Payment::where('worker_id', $id)
                ->where('payment_status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('worker_payout');

            // Get last month earnings
            $lastMonthEarnings = Payment::where('worker_id', $id)
                ->where('payment_status', 'completed')
                ->whereMonth('created_at', now()->subMonth()->month)
                ->whereYear('created_at', now()->subMonth()->year)
                ->sum('worker_payout');

            // Get pending payments
            $pendingEarnings = Payment::where('worker_id', $id)
                ->where('payment_status', 'pending')
                ->sum('worker_payout');

            // Get recent transactions
            $recentTransactions = Payment::with(['booking.service', 'booking.customer'])
                ->where('worker_id', $id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => $payment->worker_payout,
                        'status' => $payment->payment_status,
                        'service_title' => $payment->booking->service->title ?? 'Unknown Service',
                        'customer_name' => $payment->booking->customer->first_name . ' ' . $payment->booking->customer->last_name,
                        'created_at' => $payment->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'earnings' => [
                    'total_earnings' => $totalEarnings,
                    'current_month_earnings' => $currentMonthEarnings,
                    'last_month_earnings' => $lastMonthEarnings,
                    'pending_earnings' => $pendingEarnings,
                    'monthly_breakdown' => $monthlyEarnings,
                ],
                'recent_transactions' => $recentTransactions,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching worker earnings: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch worker earnings'], 500);
        }
    }

    /**
     * Get weekly earnings data for worker
     */
    public function getWeeklyEarnings($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get worker profile
            $workerProfile = WorkerProfile::where('id', $id)->first();
            if (!$workerProfile) {
                return response()->json(['error' => 'Worker profile not found'], 404);
            }

            // Calculate weekly earnings (last 7 days)
            $oneWeekAgo = now()->subDays(7);
            $weeklyEarnings = Payment::where('worker_id', $id)
                ->where('payment_status', 'completed')
                ->where('created_at', '>=', $oneWeekAgo)
                ->sum('worker_payout');

            // Calculate weekly jobs
            $weeklyJobs = Booking::where('worker_id', $id)
                ->where('status', 'completed')
                ->where('created_at', '>=', $oneWeekAgo)
                ->count();

            // Calculate daily breakdown for the last 7 days
            $dailyBreakdown = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dayEarnings = Payment::where('worker_id', $id)
                    ->where('payment_status', 'completed')
                    ->whereDate('created_at', $date->toDateString())
                    ->sum('worker_payout');

                $dayJobs = Booking::where('worker_id', $id)
                    ->where('status', 'completed')
                    ->whereDate('created_at', $date->toDateString())
                    ->count();

                $dailyBreakdown[] = [
                    'day' => $date->format('D'),
                    'date' => $date->format('M j'),
                    'earnings' => $dayEarnings,
                    'jobs' => $dayJobs,
                ];
            }

            return response()->json([
                'success' => true,
                'weeklyEarnings' => [
                    'total' => $weeklyEarnings,
                    'jobs' => $weeklyJobs,
                    'average' => $weeklyJobs > 0 ? $weeklyEarnings / $weeklyJobs : 0,
                    'daily_breakdown' => $dailyBreakdown,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching weekly earnings: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch weekly earnings'], 500);
        }
    }

    /**
     * Get worker analytics data
     */
    public function getWorkerAnalytics($workerId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get worker profile for hourly rate
            $workerProfile = WorkerProfile::where('id', $workerId)->first();
            $hourlyRate = $workerProfile ? (float)$workerProfile->hourly_rate : 0;

            // Get total clients (unique customers who have booked with this worker)
            $totalClients = Booking::where('worker_id', $workerId)
                ->whereIn('status', ['completed', 'worker_completed'])
                ->distinct('customer_id')
                ->count('customer_id');

            // Get new clients this month
            $newClientsThisMonth = Booking::where('worker_id', $workerId)
                ->whereIn('status', ['completed', 'worker_completed'])
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->distinct('customer_id')
                ->count('customer_id');

            // Get total jobs completed
            $jobsCompleted = Booking::where('worker_id', $workerId)
                ->whereIn('status', ['completed', 'worker_completed'])
                ->count();

            // Get jobs completed this month
            $jobsThisMonth = Booking::where('worker_id', $workerId)
                ->whereIn('status', ['completed', 'worker_completed'])
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            // Get average rating and total reviews
            $reviews = Review::where('worker_id', $workerId)->get();
            $totalReviews = $reviews->count();
            $averageRating = $totalReviews > 0 ? $reviews->avg('rating') : 0;

            // Get monthly performance data (last 6 months)
            $monthlyPerformance = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $monthStart = $date->copy()->startOfMonth();
                $monthEnd = $date->copy()->endOfMonth();
                
                $monthJobs = Booking::where('worker_id', $workerId)
                    ->whereIn('status', ['completed', 'worker_completed'])
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();
                
                $monthEarnings = Payment::whereHas('booking', function($query) use ($workerId, $monthStart, $monthEnd) {
                        $query->where('worker_id', $workerId)
                              ->whereBetween('created_at', [$monthStart, $monthEnd]);
                    })
                    ->where('payment_status', 'completed')
                    ->sum('worker_payout');
                
                // Calculate growth compared to previous month
                $prevMonthJobs = $i > 0 ? Booking::where('worker_id', $workerId)
                    ->whereIn('status', ['completed', 'worker_completed'])
                    ->whereBetween('created_at', [now()->subMonths($i-1)->startOfMonth(), now()->subMonths($i-1)->endOfMonth()])
                    ->count() : 0;
                
                $growth = $prevMonthJobs > 0 ? (($monthJobs - $prevMonthJobs) / $prevMonthJobs) * 100 : 0;
                
                $monthlyPerformance[] = [
                    'month' => $date->format('M Y'),
                    'jobs' => $monthJobs,
                    'earnings' => (float)$monthEarnings,
                    'growth' => round($growth, 1)
                ];
            }

            // Get service performance data
            $servicePerformance = Booking::where('worker_id', $workerId)
                ->whereIn('status', ['completed', 'worker_completed'])
                ->with('service')
                ->get()
                ->groupBy('service_id')
                ->map(function ($bookings, $serviceId) {
                    $service = $bookings->first()->service;
                    $serviceName = $service ? $service->title : 'Unknown Service';
                    
                    $totalEarnings = Payment::whereHas('booking', function($query) use ($serviceId) {
                        $query->where('service_id', $serviceId);
                    })
                    ->where('payment_status', 'completed')
                    ->sum('worker_payout');
                    
                    $reviews = Review::whereIn('booking_id', $bookings->pluck('id'))->get();
                    $avgRating = $reviews->count() > 0 ? $reviews->avg('rating') : 0;
                    
                    return [
                        'service' => $serviceName,
                        'bookings' => $bookings->count(),
                        'rating' => round($avgRating, 1),
                        'totalEarnings' => (float)$totalEarnings
                    ];
                })
                ->values()
                ->sortByDesc('totalEarnings')
                ->take(5)
                ->toArray();

            return response()->json([
                'success' => true,
                'analytics' => [
                    'totalClients' => $totalClients,
                    'jobsCompleted' => $jobsCompleted,
                    'averageRating' => round($averageRating, 2),
                    'hourlyRate' => $hourlyRate,
                    'newClientsThisMonth' => $newClientsThisMonth,
                    'jobsThisMonth' => $jobsThisMonth,
                    'totalReviews' => $totalReviews,
                    'hourlyRateChange' => 0 // Could be calculated if we track rate changes over time
                ],
                'monthlyPerformance' => $monthlyPerformance,
                'servicePerformance' => $servicePerformance
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching worker analytics: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch worker analytics'], 500);
        }
    }

    /**
     * Get worker profile
     */
    public function getWorkerProfile()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $workerProfile = WorkerProfile::where('id', $user->id)->first();

            return response()->json([
                'success' => true,
                'worker_profile' => $workerProfile
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching worker profile: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch worker profile'], 500);
        }
    }

    /**
     * Update worker profile
     */
    public function updateWorkerProfile(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validatedData = $request->validate([
                'bio' => 'nullable|string|max:1000',
                'hourly_rate' => 'nullable|numeric|min:0',
                'experience_years' => 'nullable|integer|min:0',
                'service_radius_miles' => 'nullable|integer|min:1|max:100',
                'online_services' => 'nullable|boolean',
            ]);

            $workerProfile = WorkerProfile::updateOrCreate(
                ['id' => $user->id],
                $validatedData
            );

            return response()->json([
                'success' => true,
                'message' => 'Worker profile updated successfully',
                'worker_profile' => $workerProfile
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating worker profile: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update worker profile'], 500);
        }
    }

    /**
     * Calculate profile completion percentage based on filled fields
     */
    private function calculateProfileCompletion($workerId)
    {
        try {
            // Get worker profile and auth user data
            $workerProfile = WorkerProfile::where('id', $workerId)->first();
            $authUser = \App\Models\AuthUser::find($workerId);
            
            if (!$workerProfile || !$authUser) {
                return 0;
            }
            
            // Define required fields and their weights
            $fields = [
                // Basic info (30%)
                'bio' => ['weight' => 15, 'value' => !empty($workerProfile->bio)],
                'hourly_rate' => ['weight' => 10, 'value' => !empty($workerProfile->hourly_rate) && $workerProfile->hourly_rate > 0],
                'experience_years' => ['weight' => 5, 'value' => !empty($workerProfile->experience_years)],
                
                // Contact info (25%)
                'phone' => ['weight' => 10, 'value' => !empty($authUser->phone)],
                'first_name' => ['weight' => 8, 'value' => !empty($authUser->first_name)],
                'last_name' => ['weight' => 7, 'value' => !empty($authUser->last_name)],
                
                // Location info (30%)
                'location' => ['weight' => 10, 'value' => !empty($authUser->location) || !empty($workerProfile->location)],
                'city' => ['weight' => 8, 'value' => !empty($authUser->city) || !empty($workerProfile->city)],
                'postcode' => ['weight' => 7, 'value' => !empty($authUser->postcode) || !empty($workerProfile->postcode)],
                'country' => ['weight' => 5, 'value' => !empty($authUser->country) || !empty($workerProfile->country)],
                
                // Service settings (15%)
                'service_radius_miles' => ['weight' => 8, 'value' => !empty($workerProfile->service_radius_miles)],
                'online_services' => ['weight' => 4, 'value' => isset($workerProfile->online_services)],
                'is_available' => ['weight' => 3, 'value' => isset($workerProfile->is_available)],
            ];
            
            // Calculate completion percentage
            $totalWeight = 0;
            $completedWeight = 0;
            
            foreach ($fields as $field => $config) {
                $totalWeight += $config['weight'];
                if ($config['value']) {
                    $completedWeight += $config['weight'];
                }
            }
            
            return $totalWeight > 0 ? round(($completedWeight / $totalWeight) * 100) : 0;
            
        } catch (\Exception $e) {
            \Log::error('Error calculating profile completion: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 3959; // Earth's radius in miles
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }
}
