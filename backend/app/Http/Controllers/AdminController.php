<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\Profile;
use App\Models\WorkerProfile;
use App\Models\Service;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Category;
use App\Models\WorkerCategory;
use App\Models\CommissionSetting;
use App\Models\AdminUser;
use App\Models\Notification;
use App\Models\AccountActivationRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class AdminController extends Controller
{
    /**
     * Admin dashboard comprehensive data
     */
    public function getAdminData(Request $request)
    {
        try {
            // Base datasets
            $users = Profile::all();
            $customers = Profile::where('user_type', 'customer')->get();
            $workersProfiles = WorkerProfile::with('profile', 'category')->get();
            $workers = $workersProfiles->map(function ($w) {
                return [
                    'id' => $w->id,
                    'name' => trim(($w->profile->first_name ?? '') . ' ' . ($w->profile->last_name ?? '')),
                    'profile' => $w->profile,
                    'rating' => (float) ($w->rating ?? 0),
                    'experience_years' => (int) ($w->experience_years ?? 0),
                    'hourly_rate' => (float) ($w->hourly_rate ?? 0),
                    'is_available' => (bool) ($w->is_available ?? false),
                    'status' => $w->is_verified ? 'verified' : 'pending',
                    'category' => $w->category ? ($w->category->name ?? 'Uncategorized') : 'Uncategorized',
                    'created_at' => $w->created_at,
                ];
            })->values();

            $services = Service::with(['category', 'worker.profile'])->get();

            $bookings = Booking::with(['service.category', 'customer', 'worker'])
                ->orderBy('created_at', 'desc')
                ->get();

            // If Payments table exists use it, otherwise compute from bookings
            $payments = Payment::query()->get();
            if ($payments->isEmpty()) {
                $payments = $bookings->map(function ($b) {
                    return (object) [
                        'id' => $b->id,
                        'customer_id' => $b->customer_id,
                        'worker_id' => $b->worker_id,
                        'total_amount' => (float) ($b->total_amount ?? 0),
                        'commission_amount' => (float) ($b->commission_amount ?? 0),
                        'created_at' => $b->created_at,
                    ];
                });
            }

            $reviews = Review::with(['customer', 'worker'])->get();
            $categories = Category::all();

            // Financial calculations
            $completedRevenue = (float) $bookings->where('status', 'completed')->sum('total_amount');
            $platformFees = (float) $bookings->sum('commission_amount');
            $workerPayouts = (float) $bookings->sum('worker_payout');
            $activeStatuses = ['pending', 'confirmed', 'scheduled', 'worker_completed'];
            $activeBookingsCount = $bookings->whereIn('status', $activeStatuses)->count();

            // Growth rate MoM
            $now = Carbon::now();
            $startCurrent = $now->copy()->startOfMonth();
            $endCurrent = $now->copy()->endOfMonth();
            $startPrev = $now->copy()->subMonth()->startOfMonth();
            $endPrev = $now->copy()->subMonth()->endOfMonth();

            $currentMonthRevenue = (float) Booking::where('status', 'completed')
                ->whereBetween('created_at', [$startCurrent, $endCurrent])
                ->sum('total_amount');
            $prevMonthRevenue = (float) Booking::where('status', 'completed')
                ->whereBetween('created_at', [$startPrev, $endPrev])
                ->sum('total_amount');
            $growthRate = $prevMonthRevenue > 0
                ? round((($currentMonthRevenue - $prevMonthRevenue) / $prevMonthRevenue) * 100, 2)
                : 0.0;

            $completedBookingsCount = $bookings->where('status', 'completed')->count();
            $totalBookingsCount = $activeBookingsCount + $completedBookingsCount;
            
            $stats = [
                'totalUsers' => $users->count(),
                'totalCustomers' => $customers->count(),
                'totalWorkers' => $workers->count(),
                'newThisMonth' => $users->filter(function ($u) { return Carbon::parse($u->created_at)->isCurrentMonth(); })->count(),
                'totalRevenue' => $completedRevenue,
                'totalProfit' => $platformFees,
                'workerPayouts' => $workerPayouts,
                'activeBookings' => $activeBookingsCount,
                'completedBookings' => $completedBookingsCount,
                'totalBookings' => $totalBookingsCount,
                'growthRate' => $growthRate,
            ];

            $platformStats = [
                'jobsCompleted' => $bookings->where('status', 'completed')->count(),
                'activeWorkers' => $workersProfiles->where('is_available', true)->count(),
                'customerSatisfaction' => $reviews->count() > 0 ? round(($reviews->avg('rating') / 5) * 100, 0) : 96,
                'platformFees' => $platformFees,
                'workerPayouts' => $workerPayouts,
                'totalCategories' => $categories->count(),
                'avgRating' => $reviews->count() > 0 ? round($reviews->avg('rating'), 2) : 4.8,
            ];

            // Shape bookings minimally for UI
            $formattedBookings = $bookings->map(function ($b) {
                return [
                    'id' => $b->id,
                    'service_title' => $b->service->title ?? 'Unknown Service',
                    'service_category' => $b->service->category->name ?? 'Unknown Category',
                    'customer_name' => $b->customer ? trim(($b->customer->first_name ?? '') . ' ' . ($b->customer->last_name ?? '')) : 'Unknown Customer',
                    'customer_id' => $b->customer_id,
                    'worker_name' => $b->worker ? (method_exists($b->worker, 'profile') && $b->worker->profile ? trim(($b->worker->profile->first_name ?? '') . ' ' . ($b->worker->profile->last_name ?? '')) : ($b->worker->first_name ?? '') . ' ' . ($b->worker->last_name ?? '')) : 'Unknown Worker',
                    'worker_id' => $b->worker_id,
                    'total_amount' => (float) ($b->total_amount ?? 0),
                    'status' => $b->status,
                    'scheduled_date' => $b->scheduled_date,
                    'created_at' => $b->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'users' => $users,
                'customers' => $customers,
                'workers' => $workers,
                'services' => $services,
                'bookings' => $formattedBookings,
                'payments' => $payments,
                'reviews' => $reviews,
                'categories' => $categories,
                'workerCategories' => [],
                'commissionSettings' => [],
                'stats' => $stats,
                'platformStats' => $platformStats,
            ]);

        } catch (\Throwable $e) {
            \Log::error('Error fetching admin data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch admin data'], 500);
        }
    }

    /**
     * DEBUG: Get raw worker_account_status row
     */
    public function debugGetWorkerStatus($workerId)
    {
        try {
            $row = DB::table('worker_account_status')->where('worker_id', $workerId)->first();
            return response()->json(['worker_id' => $workerId, 'status' => $row]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * DEBUG: Force deactivate logic for a worker (no auth)
     */
    public function debugForceDeactivate($workerId)
    {
        try {
            $reason = 'Debug deactivate';
            $worker = WorkerProfile::findOrFail($workerId);
            $worker->is_available = false;
            $worker->save();

            $cols = Schema::getColumnListing('worker_account_status');
            $base = ['worker_id' => $workerId, 'is_active' => false];
            if (in_array('deactivated_at', $cols)) { $base['deactivated_at'] = now(); }
            if (in_array('deactivation_reason', $cols)) { $base['deactivation_reason'] = $reason; }
            if (in_array('updated_at', $cols)) { $base['updated_at'] = now(); }
            if (in_array('created_at', $cols) && !DB::table('worker_account_status')->where('worker_id', $workerId)->exists()) {
                $base['created_at'] = now();
            }
            if (DB::table('worker_account_status')->where('worker_id', $workerId)->exists()) {
                DB::table('worker_account_status')->where('worker_id', $workerId)->update($base);
            } else {
                // Ensure primary key id is provided if table requires it
                if (in_array('id', $cols)) { $base['id'] = (string) Str::uuid(); }
                DB::table('worker_account_status')->insert($base);
            }

            $row = DB::table('worker_account_status')->where('worker_id', $workerId)->first();
            return response()->json(['ok' => true, 'status' => $row]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Paginated Workers list for Admin Workers page
     */
    public function getWorkersPagination(Request $request)
    {
        try {
            $page = (int) ($request->input('page', 0));
            $pageSize = (int) ($request->input('pageSize', 10));
            $filters = $request->input('filters', []);

            $query = WorkerProfile::with(['profile', 'category']);

            // Status filter: verified | pending | rejected | all
            if (!empty($filters['status']) && $filters['status'] !== 'all') {
                if ($filters['status'] === 'verified') {
                    $query->where('is_verified', true);
                } elseif ($filters['status'] === 'pending') {
                    $query->where('is_verified', false)->where(function ($q) {
                        $q->whereNull('verification_status')->orWhere('verification_status', 'pending');
                    });
                } elseif ($filters['status'] === 'rejected') {
                    $query->where('verification_status', 'rejected');
                }
            }

            // Search by name, email, phone, location
            if (!empty($filters['search'])) {
                $term = '%' . strtolower($filters['search']) . '%';
                $query->whereHas('profile', function ($q) use ($term) {
                    $q->whereRaw('LOWER(first_name) LIKE ?', [$term])
                      ->orWhereRaw('LOWER(last_name) LIKE ?', [$term])
                      ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                      ->orWhereRaw('LOWER(phone) LIKE ?', [$term])
                      ->orWhereRaw('LOWER(location) LIKE ?', [$term]);
                });
            }

            // Rating filter (simple bands)
            if (!empty($filters['rating']) && $filters['rating'] !== 'all') {
                if ($filters['rating'] === '4+') {
                    $query->where('rating', '>=', 4);
                } elseif ($filters['rating'] === '3-4') {
                    $query->whereBetween('rating', [3, 4]);
                }
            }

            // Experience filter
            if (!empty($filters['experience']) && $filters['experience'] !== 'all') {
                if ($filters['experience'] === '3+') {
                    $query->where('experience_years', '>=', 3);
                } elseif ($filters['experience'] === '1-3') {
                    $query->whereBetween('experience_years', [1, 3]);
                }
            }

            // Category filter by name
            if (!empty($filters['category']) && $filters['category'] !== 'all') {
                $catName = $filters['category'];
                $query->whereHas('category', function ($q) use ($catName) {
                    $q->where('name', $catName);
                });
            }

            $totalCount = (clone $query)->count();
            $items = $query
                ->orderByDesc('created_at')
                ->skip($page * $pageSize)
                ->take($pageSize)
                ->get();

            $mapped = $items->map(function ($w) {
                $profile = $w->profile;
                $category = $w->category;

                // Derive status
                $status = $w->verification_status ?? ($w->is_verified ? 'verified' : 'pending');

                return [
                    'id' => (string) $w->id,
                    'name' => trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '')),
                    'phone' => $profile->phone ?? null,
                    'location' => $profile->location ?? null,
                    'rating' => (float) ($w->rating ?? 0),
                    'total_reviews' => (int) ($w->total_reviews ?? 0),
                    'success_rate' => (int) ($w->success_rate ?? 0),
                    'experience' => (int) ($w->experience_years ?? 0),
                    'hourly_rate' => (float) ($w->hourly_rate ?? 0),
                    'total_earnings' => (float) ($w->total_earnings ?? 0),
                    'completedJobs' => (int) ($w->completed_jobs ?? 0),
                    'status' => $status,
                    'categoryInfo' => [
                        'category' => [
                            'name' => $category->name ?? 'Unassigned',
                            'color' => '#6b7280',
                        ],
                        'uniqueCustomers' => 0,
                    ],
                    'created_at' => $w->created_at,
                ];
            })->values();

            $totalPages = $pageSize > 0 ? (int) ceil($totalCount / $pageSize) : 0;

            return response()->json([
                'data' => $mapped,
                'totalCount' => $totalCount,
                'page' => $page,
                'pageSize' => $pageSize,
                'totalPages' => $totalPages,
            ]);
        } catch (\Throwable $e) {
            \Log::error('getWorkersPagination error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch workers'], 500);
        }
    }

    /**
     * Verify worker
     */
    public function verifyWorker($workerId)
    {
        try {
            $worker = WorkerProfile::findOrFail($workerId);
            $worker->is_verified = true;
            $worker->verification_status = 'verified';
            $worker->verified_at = Carbon::now();
            $worker->verified_by = Auth::id();
            $worker->save();

            return response()->json(['success' => true, 'message' => 'Worker verified successfully']);
        } catch (\Throwable $e) {
            \Log::error('verifyWorker error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to verify worker'], 500);
        }
    }

    /**
     * Reject worker
     */
    public function rejectWorker($workerId)
    {
        try {
            $worker = WorkerProfile::findOrFail($workerId);
            $worker->is_verified = false;
            $worker->verification_status = 'rejected';
            $worker->save();

            return response()->json(['success' => true, 'message' => 'Worker rejected successfully']);
        } catch (\Throwable $e) {
            \Log::error('rejectWorker error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to reject worker'], 500);
        }
    }
    /**
     * Account activation requests (supports ?status=...)
     */
    public function getAccountActivationRequests(Request $request)
    {
        try {
            $status = $request->query('status');
            $workerId = $request->query('worker_id');
            $q = AccountActivationRequest::query();
            if ($status) {
                $q->where('status', $status);
            }
            if ($workerId) {
                $q->where('worker_id', $workerId);
            }
            $requests = $q->orderBy('created_at', 'desc')->get();
            // Return plain array to match frontend expectations
            return response()->json($requests);
        } catch (\Throwable $e) {
            \Log::error('getAccountActivationRequests error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch requests'], 500);
        }
    }

    /**
     * Create a reactivation request (worker → admin)
     */
    public function createAccountActivationRequest(Request $request)
    {
        try {
            $validated = $request->validate([
                'worker_id' => 'required|string',
                'request_reason' => 'required|string',
            ]);

            // Insert new request as pending
            $id = (string) Str::uuid();
            DB::table('account_activation_requests')->insert([
                'id' => $id,
                'worker_id' => $validated['worker_id'],
                'request_reason' => $validated['request_reason'],
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Notify admins
            try {
                $admins = Profile::where('user_type', 'admin')->pluck('id');
                foreach ($admins as $adminId) {
                    Notification::create([
                        'id' => (string) Str::uuid(),
                        'user_id' => $adminId,
                        'type' => 'reactivation_request_admin',
                        'title' => 'Reactivation Request',
                        'message' => 'Worker requested reactivation.',
                        'data' => json_encode([
                            'request_id' => $id,
                            'worker_id' => $validated['worker_id'],
                        ]),
                        'is_read' => false,
                    ]);
                }
            } catch (\Throwable $e) {}

            return response()->json(['success' => true, 'id' => $id], 201);
        } catch (\Throwable $e) {
            \Log::error('createAccountActivationRequest error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create request'], 500);
        }
    }

    /**
     * Update reactivation request (admin action: approve/reject)
     */
    public function updateAccountActivationRequest(Request $request, $id)
    {
        try {
            // Accept both admin_note and admin_notes from frontend
            $validated = $request->validate([
                'status' => 'required|string|in:approved,rejected,pending',
                'admin_note' => 'nullable|string',
                'admin_notes' => 'nullable|string',
                'processed_at' => 'nullable|date',
            ]);

            $req = DB::table('account_activation_requests')->where('id', $id)->first();
            if (!$req) {
                return response()->json(['error' => 'Request not found'], 404);
            }

            $update = [
                'status' => $validated['status'],
                'updated_at' => now(),
            ];
            // Determine which admin notes column exists
            try {
                $cols = \Schema::getColumnListing('account_activation_requests');
                $notesValue = $validated['admin_note'] ?? ($validated['admin_notes'] ?? null);
                if (in_array('admin_note', $cols)) {
                    $update['admin_note'] = $notesValue;
                } elseif (in_array('admin_notes', $cols)) {
                    $update['admin_notes'] = $notesValue;
                }
                if (in_array('processed_at', $cols)) {
                    $update['processed_at'] = $validated['processed_at'] ?? now();
                }
                if (in_array('processed_by', $cols)) {
                    $update['processed_by'] = \Auth::id();
                }
            } catch (\Throwable $e) {}
            DB::table('account_activation_requests')->where('id', $id)->update($update);

            // If approved → reactivate via status table and notify worker
            if ($validated['status'] === 'approved') {
                $cols = Schema::getColumnListing('worker_account_status');
                $exists = DB::table('worker_account_status')->where('worker_id', $req->worker_id)->exists();
                if ($exists) {
                    $update = [
                        'is_active' => true,
                        'reactivated_at' => now(),
                    ];
                    if (in_array('updated_at', $cols)) { $update['updated_at'] = now(); }
                    DB::table('worker_account_status')->where('worker_id', $req->worker_id)->update($update);
                } else {
                    $insert = [
                        'worker_id' => $req->worker_id,
                        'is_active' => true,
                    ];
                    if (in_array('id', $cols)) { $insert['id'] = (string) Str::uuid(); }
                    if (in_array('reactivated_at', $cols)) { $insert['reactivated_at'] = now(); }
                    if (in_array('created_at', $cols)) { $insert['created_at'] = now(); }
                    if (in_array('updated_at', $cols)) { $insert['updated_at'] = now(); }
                    DB::table('worker_account_status')->insert($insert);
                }

                // Notify worker
                try {
                    Notification::create([
                        'id' => (string) Str::uuid(),
                        'user_id' => $req->worker_id,
                        'type' => 'account_reactivated',
                        'title' => 'Account Reactivated',
                        'message' => 'Your reactivation request was approved by admin.',
                        'data' => json_encode(['request_id' => $id]),
                        'is_read' => false,
                    ]);
                } catch (\Throwable $e) {}
            }

            if ($validated['status'] === 'rejected') {
                try {
                    Notification::create([
                        'id' => (string) Str::uuid(),
                        'user_id' => $req->worker_id,
                        'type' => 'reactivation_rejected',
                        'title' => 'Reactivation Rejected',
                        'message' => 'Your reactivation request was rejected by admin.',
                        'data' => json_encode(['request_id' => $id]),
                        'is_read' => false,
                    ]);
                } catch (\Throwable $e) {}
            }

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            \Log::error('updateAccountActivationRequest error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update request'], 500);
        }
    }

    /**
     * Worker Accounts list for Admin Worker Account Management page
     */
    public function getWorkerAccounts(Request $request)
    {
        try {
            $workers = WorkerProfile::with(['profile', 'category'])->get();

            $data = $workers->map(function ($w) {
                $profile = $w->profile;
                $category = $w->category;

                // Derive is_active from availability + verification
                $isActive = (bool) ($w->is_available && ($w->is_verified || ($w->verification_status === 'verified')));

                // Compute months since creation
                $monthsSinceCreation = $w->created_at ? Carbon::parse($w->created_at)->diffInMonths(Carbon::now()) : 0;

                // Unique customers based on bookings table
                $uniqueCustomers = Booking::where('worker_id', $w->id)->distinct('customer_id')->count('customer_id');

                // Risk heuristics
                $riskLevel = 'No Risk';
                if ($monthsSinceCreation >= 3 && $uniqueCustomers === 0) {
                    $riskLevel = 'High Risk';
                } elseif ($monthsSinceCreation >= 2 && $uniqueCustomers === 0) {
                    $riskLevel = 'Medium Risk';
                } elseif ($monthsSinceCreation >= 1 && $uniqueCustomers === 0) {
                    $riskLevel = 'Low Risk';
                }

                return [
                    'worker_id' => (string) $w->id,
                    'first_name' => $profile->first_name ?? '',
                    'last_name' => $profile->last_name ?? '',
                    'email' => $profile->email ?? '',
                    'created_at' => $w->created_at,
                    'category_name' => $category->name ?? 'Unassigned',
                    'category_description' => $category->description ?? '',
                    'is_active' => $isActive,
                    'deactivated_at' => null,
                    'deactivation_reason' => null,
                    'reactivated_at' => null,
                    'reactivation_reason' => null,
                    'last_activity_check' => null,
                    'months_since_creation' => $monthsSinceCreation,
                    'unique_customers_count' => (int) $uniqueCustomers,
                    'risk_level' => $riskLevel,
                    'risk_details' => null,
                ];
            })->values();

            return response()->json($data);
        } catch (\Throwable $e) {
            \Log::error('getWorkerAccounts error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch worker accounts'], 500);
        }
    }

    /**
     * Deactivate a worker account (stores minimal state using is_available)
     */
    public function deactivateWorkerAccount(Request $request)
    {
        try {
            $workerId = $request->input('worker_id');
            $reason = $request->input('reason'); // currently not persisted (no column)

            $worker = WorkerProfile::findOrFail($workerId);
            $worker->is_available = false;
            $worker->save();

            // Upsert into worker_account_status using only existing columns
            $cols = Schema::getColumnListing('worker_account_status');
            $base = ['worker_id' => $workerId, 'is_active' => false];
            if (in_array('deactivated_at', $cols)) { $base['deactivated_at'] = now(); }
            if (in_array('deactivation_reason', $cols)) { $base['deactivation_reason'] = $reason; }
            if (in_array('created_at', $cols) && in_array('updated_at', $cols)) {
                $base['updated_at'] = now();
                if (!DB::table('worker_account_status')->where('worker_id', $workerId)->exists()) {
                    $base['created_at'] = now();
                }
            }
            if (DB::table('worker_account_status')->where('worker_id', $workerId)->exists()) {
                DB::table('worker_account_status')->where('worker_id', $workerId)->update($base);
            } else {
                // Ensure primary key id is provided if table requires it
                if (in_array('id', $cols)) { $base['id'] = (string) Str::uuid(); }
                DB::table('worker_account_status')->insert($base);
            }

            // Notify worker
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $workerId,
                    'type' => 'account_deactivated',
                    'title' => 'Account Deactivated',
                    'message' => 'Your account has been deactivated by admin.' . ($reason ? ' Reason: ' . $reason : ''),
                    'data' => json_encode(['worker_id' => $workerId]),
                    'is_read' => false,
                ]);
            } catch (\Throwable $e) {}

            return response()->json(['success' => true, 'message' => 'Worker account deactivated']);
        } catch (\Throwable $e) {
            \Log::error('deactivateWorkerAccount error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to deactivate worker account'], 500);
        }
    }

    /**
     * Reactivate a worker account (stores minimal state using is_available)
     */
    public function reactivateWorkerAccount(Request $request)
    {
        try {
            $workerId = $request->input('worker_id');
            $reason = $request->input('reason'); // currently not persisted (no column)

            $worker = WorkerProfile::findOrFail($workerId);
            $worker->is_available = true;
            $worker->save();

            // Upsert into worker_account_status: set active=true and reactivated_at using existing columns
            $cols = Schema::getColumnListing('worker_account_status');
            $base = ['worker_id' => $workerId, 'is_active' => true];
            if (in_array('reactivated_at', $cols)) { $base['reactivated_at'] = now(); }
            if (in_array('updated_at', $cols)) { $base['updated_at'] = now(); }
            if (in_array('created_at', $cols) && !DB::table('worker_account_status')->where('worker_id', $workerId)->exists()) {
                $base['created_at'] = now();
            }
            if (DB::table('worker_account_status')->where('worker_id', $workerId)->exists()) {
                DB::table('worker_account_status')->where('worker_id', $workerId)->update($base);
            } else {
                if (in_array('id', $cols)) { $base['id'] = (string) Str::uuid(); }
                DB::table('worker_account_status')->insert($base);
            }

            // Notify worker
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $workerId,
                    'type' => 'account_reactivated',
                    'title' => 'Account Reactivated',
                    'message' => 'Your account has been reactivated by admin.',
                    'data' => json_encode(['worker_id' => $workerId]),
                    'is_read' => false,
                ]);
            } catch (\Throwable $e) {}

            // Notify admins that a worker requested/reactivated account
            try {
                $admins = Profile::where('user_type', 'admin')->pluck('id');
                foreach ($admins as $adminId) {
                    Notification::create([
                        'id' => (string) Str::uuid(),
                        'user_id' => $adminId,
                        'type' => 'worker_reactivation_request',
                        'title' => 'Worker Reactivation',
                        'message' => 'Worker ' . $workerId . ' requested account reactivation.',
                        'data' => json_encode([
                            'worker_id' => $workerId,
                            'reason' => $reason,
                        ]),
                        'is_read' => false,
                    ]);
                }
            } catch (\Throwable $e) {
                \Log::warning('Admin worker reactivation notification failed: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'message' => 'Worker account reactivated']);
        } catch (\Throwable $e) {
            \Log::error('reactivateWorkerAccount error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to reactivate worker account'], 500);
        }
    }

    /**
     * Run periodic deactivation check (mock implementation)
     */
    public function runPeriodicDeactivationCheck(Request $request)
    {
        try {
            // Here you could implement business rules to auto-deactivate idle workers
            return response()->json(['success' => true, 'message' => 'Periodic deactivation check completed']);
        } catch (\Throwable $e) {
            \Log::error('runPeriodicDeactivationCheck error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to run periodic check'], 500);
        }
    }

    /**
     * Get admin services with stats and filtering
     */
    public function getAdminServices(Request $request)
    {
        try {
            $includeStats = $request->get('stats', false);
            $page = (int) $request->get('page', 1);
            $pageSize = (int) $request->get('pageSize', 10);
            $search = $request->get('search', '');
            $category = $request->get('category', 'all');

            // Base query for services
            $query = Service::with(['category', 'worker.profile', 'bookings'])
                ->orderBy('created_at', 'desc');

            // Apply search filter
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Apply category filter
            if (!empty($category) && $category !== 'all') {
                $query->whereHas('category', function ($q) use ($category) {
                    $q->where('name', $category);
                });
            }

            // Get total count
            $totalCount = (clone $query)->count();

            // Apply pagination
            $services = $query->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();

            // Transform services data
            $transformedServices = $services->map(function ($service) {
                $worker = $service->worker;
                $profile = $worker ? $worker->profile : null;
                $category = $service->category;

                return [
                    'id' => (string) $service->id,
                    'title' => $service->title,
                    'description' => $service->description,
                    'price_min' => (float) $service->price_min,
                    'price_max' => (float) $service->price_max,
                    'priceMin' => (float) $service->price_min,
                    'priceMax' => (float) $service->price_max,
                    'duration_hours' => (float) $service->duration_hours,
                    'duration' => (float) $service->duration_hours,
                    'category' => $category ? $category->name : 'Uncategorized',
                    'category_id' => $service->category_id,
                    'worker_id' => $service->worker_id,
                    'worker_name' => $profile ? trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '')) : 'Unknown Worker',
                    'worker' => $profile ? trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '')) : 'Unknown Worker',
                    'worker_rating' => $worker ? (float) ($worker->rating ?? 0) : 0,
                    'worker_experience' => $worker ? (int) ($worker->experience_years ?? 0) : 0,
                    'total_bookings' => $service->bookings ? $service->bookings->count() : 0,
                    'created_at' => $service->created_at,
                    'updated_at' => $service->updated_at,
                ];
            });

            $response = [
                'data' => $transformedServices,
                'totalCount' => $totalCount,
                'page' => $page,
                'pageSize' => $pageSize,
                'totalPages' => $pageSize > 0 ? (int) ceil($totalCount / $pageSize) : 0,
            ];

            // Add stats if requested
            if ($includeStats) {
                $stats = $this->getServicesStats();
                $response = array_merge($response, $stats);
            }

            return response()->json($response);

        } catch (\Throwable $e) {
            \Log::error('getAdminServices error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch services'], 500);
        }
    }

    /**
     * Delete a service
     */
    public function deleteService($serviceId)
    {
        try {
            $service = Service::findOrFail($serviceId);
            $service->delete();

            return response()->json(['success' => true, 'message' => 'Service deleted successfully']);
        } catch (\Throwable $e) {
            \Log::error('deleteService error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete service'], 500);
        }
    }

    /**
     * Get services statistics
     */
    private function getServicesStats()
    {
        try {
            $totalServices = Service::count();
            $totalCategories = Category::count();
            $totalBookings = Booking::count();
            $totalEarnings = Booking::sum('total_amount');

            // Category performance
            $categoryPerformance = Service::with('category')
                ->selectRaw('category_id, COUNT(*) as service_count')
                ->groupBy('category_id')
                ->get()
                ->map(function ($item) {
                    $category = $item->category;
                    return [
                        'category' => $category ? $category->name : 'Uncategorized',
                        'count' => $item->service_count,
                        'percentage' => 0, // Will be calculated on frontend
                    ];
                });

            // Available categories
            $availableCategories = Category::where('is_active', true)
                ->select('id', 'name')
                ->get()
                ->map(function ($category) {
                    return [
                        'id' => (string) $category->id,
                        'name' => $category->name
                    ];
                })
                ->toArray();


            // Calculate average service value
            $avgServiceValue = 0;
            if ($totalServices > 0) {
                $services = Service::all();
                $totalValue = $services->sum(function ($service) {
                    return ($service->price_min + $service->price_max) / 2;
                });
                $avgServiceValue = $totalValue / $totalServices;
            }

            // Calculate active providers (unique workers with services)
            $activeProviders = Service::distinct('worker_id')->count();

            return [
                'stats' => [
                    'totalServices' => $totalServices,
                    'totalCategories' => $totalCategories,
                    'totalBookings' => $totalBookings,
                    'totalEarnings' => (float) $totalEarnings,
                    'avgServiceValue' => (float) $avgServiceValue,
                    'activeProviders' => $activeProviders,
                ],
                'categoryPerformance' => $categoryPerformance,
                'availableCategories' => $availableCategories,
                'adminTotals' => [
                    'services' => $totalServices,
                    'categories' => $totalCategories,
                    'bookings' => $totalBookings,
                    'earnings' => (float) $totalEarnings,
                ]
            ];
        } catch (\Throwable $e) {
            \Log::error('getServicesStats error: ' . $e->getMessage());
            return [
                'stats' => [
                    'totalServices' => 0,
                    'totalCategories' => 0,
                    'totalBookings' => 0,
                    'totalEarnings' => 0,
                    'avgServiceValue' => 0,
                    'activeProviders' => 0,
                ],
                'categoryPerformance' => [],
                'availableCategories' => [],
                'adminTotals' => [
                    'services' => 0,
                    'categories' => 0,
                    'bookings' => 0,
                    'earnings' => 0,
                ]
            ];
        }
    }

    /**
     * Get admin categories
     */
    public function getAdminCategories(Request $request)
    {
        try {
            $categories = Category::orderBy('name')->get();
            
            $transformedCategories = $categories->map(function ($category) {
                $serviceCount = Service::where('category_id', $category->id)->count();
                
                return [
                    'id' => (string) $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'icon' => $category->icon,
                    'is_active' => (bool) $category->is_active,
                    'service_count' => $serviceCount,
                    'created_at' => $category->created_at,
                    'updated_at' => $category->updated_at,
                ];
            });

            return response()->json([
                'data' => $transformedCategories,
                'totalCount' => $categories->count(),
            ]);

        } catch (\Throwable $e) {
            \Log::error('getAdminCategories error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch categories'], 500);
        }
    }

    /**
     * Create admin category
     */
    public function createAdminCategory(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255|unique:categories,name',
                'description' => 'nullable|string',
                'icon' => 'nullable|string|max:255',
                'is_active' => 'boolean',
            ]);

            $category = Category::create([
                'id' => \Str::uuid(),
                'name' => $request->name,
                'description' => $request->description,
                'icon' => $request->icon,
                'is_active' => $request->get('is_active', true),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Category created successfully',
                'data' => $category
            ]);

        } catch (\Throwable $e) {
            \Log::error('createAdminCategory error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create category'], 500);
        }
    }

    /**
     * Update admin category
     */
    public function updateAdminCategory(Request $request, $id)
    {
        try {
            $category = Category::findOrFail($id);

            $request->validate([
                'name' => 'required|string|max:255|unique:categories,name,' . $id,
                'description' => 'nullable|string',
                'icon' => 'nullable|string|max:255',
                'is_active' => 'boolean',
            ]);

            $category->update([
                'name' => $request->name,
                'description' => $request->description,
                'icon' => $request->icon,
                'is_active' => $request->get('is_active', true),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Category updated successfully',
                'data' => $category
            ]);

        } catch (\Throwable $e) {
            \Log::error('updateAdminCategory error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update category'], 500);
        }
    }

    /**
     * Delete admin category
     */
    public function deleteAdminCategory($id)
    {
        try {
            $category = Category::findOrFail($id);
            
            // Check if category has services
            $serviceCount = Service::where('category_id', $id)->count();
            if ($serviceCount > 0) {
                return response()->json([
                    'error' => 'Cannot delete category. It has ' . $serviceCount . ' services associated with it.'
                ], 400);
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully'
            ]);

        } catch (\Throwable $e) {
            \Log::error('deleteAdminCategory error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete category'], 500);
        }
    }

    /**
     * Get admin bookings with filtering and pagination
     */
    public function getAdminBookings(Request $request)
    {
        try {
            $page = (int) $request->get('page', 1);
            $perPage = (int) $request->get('per_page', 10);
            $search = $request->get('search', '');
            $status = $request->get('status', 'all');
            $period = $request->get('period', 'all');

            // Base query for bookings
            $query = Booking::with([
                'customer:id,first_name,last_name',
                'worker.profile:id,first_name,last_name',
                'service:id,title,category_id',
                'service.category:id,name'
            ])->orderBy('created_at', 'desc');

            // Apply search filter
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%")
                      ->orWhere('notes', 'like', "%{$search}%")
                      ->orWhereHas('customer', function ($customerQuery) use ($search) {
                          $customerQuery->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
                      })
                      ->orWhereHas('worker.profile', function ($workerQuery) use ($search) {
                          $workerQuery->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
                      })
                      ->orWhereHas('service', function ($serviceQuery) use ($search) {
                          $serviceQuery->where('title', 'like', "%{$search}%");
                      });
                });
            }

            // Apply status filter
            if (!empty($status) && $status !== 'all') {
                $query->where('status', $status);
            }

            // Apply period filter
            if (!empty($period) && $period !== 'all') {
                $now = now();
                switch ($period) {
                    case 'today':
                        $query->whereDate('scheduled_date', $now->toDateString());
                        break;
                    case 'week':
                        $query->where('scheduled_date', '>=', $now->subWeek());
                        break;
                    case 'month':
                        $query->where('scheduled_date', '>=', $now->subMonth());
                        break;
                }
            }

            // Get total count
            $totalCount = (clone $query)->count();

            // Apply pagination
            $bookings = $query->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            // Transform bookings data
            $transformedBookings = $bookings->map(function ($booking) {
                $customer = $booking->customer;
                $worker = $booking->worker;
                $profile = $worker ? $worker->profile : null;
                $service = $booking->service;
                $category = $service ? $service->category : null;

                return [
                    'id' => (string) $booking->id,
                    'sid' => (string) $booking->id, // Short ID for display
                    'customer_id' => (string) $booking->customer_id,
                    'worker_id' => (string) $booking->worker_id,
                    'service_id' => $booking->service_id ? (string) $booking->service_id : null,
                    'scheduled_date' => $booking->scheduled_date,
                    'duration_hours' => $booking->total_amount ? round($booking->total_amount / 50, 1) : null, // Estimate based on amount
                    'total_amount' => (float) $booking->total_amount,
                    'status' => $booking->status,
                    'address' => $booking->address,
                    'notes' => $booking->notes,
                    'created_at' => $booking->created_at,
                    'commission_rate' => (float) $booking->commission_rate,
                    'commission_amount' => (float) $booking->commission_amount,
                    'worker_payout' => (float) $booking->worker_payout,
                    
                    // Joined data
                    'customer_name' => $customer ? trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? '')) : 'Unknown Customer',
                    'worker_name' => $profile ? trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '')) : 'Unknown Worker',
                    'service_title' => $service ? $service->title : null,
                    'service_category' => $category ? $category->name : null,
                ];
            });

            // Calculate stats
            $stats = $this->getBookingsStats();

            return response()->json([
                'bookings' => $transformedBookings,
                'total' => $totalCount,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => $perPage > 0 ? (int) ceil($totalCount / $perPage) : 0,
                'stats' => $stats
            ]);

        } catch (\Throwable $e) {
            \Log::error('getAdminBookings error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch bookings'], 500);
        }
    }

    /**
     * Get bookings statistics
     */
    private function getBookingsStats()
    {
        try {
            $totalBookings = Booking::count();
            $completedBookings = Booking::where('status', 'completed')->count();
            $pendingBookings = Booking::whereIn('status', ['pending', 'pending_payment', 'confirmed'])->count();
            $totalRevenue = Booking::where('status', 'completed')->sum('total_amount');

            return [
                'totalBookings' => $totalBookings,
                'completedBookings' => $completedBookings,
                'pendingBookings' => $pendingBookings,
                'totalRevenue' => (float) $totalRevenue,
            ];
        } catch (\Throwable $e) {
            \Log::error('getBookingsStats error: ' . $e->getMessage());
            return [
                'totalBookings' => 0,
                'completedBookings' => 0,
                'pendingBookings' => 0,
                'totalRevenue' => 0,
            ];
        }
    }

    /**
     * Get worker payment summary aggregated strictly from payments table
     */
    public function getWorkerPaymentSummary(Request $request)
    {
        try {
            $page = (int) $request->get('page', 1);
            $pageSize = (int) $request->get('pageSize', 10);
            $search = $request->get('search', '');

            $baseQuery = Payment::query()
                ->with(['worker.profile:id,first_name,last_name', 'worker.category:id,name'])
                ->whereNotNull('worker_id');

            if (!empty($search)) {
                $baseQuery->whereHas('worker.profile', function ($q) use ($search) {
                    $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
                });
            }

            $payments = $baseQuery->get();

            $workerMap = [];
            $workerCustomerSet = [];
            $workerBookingSet = [];

            foreach ($payments as $p) {
                $workerId = (string) $p->worker_id;
                $profile = $p->worker ? $p->worker->profile : null;
                $category = $p->worker ? $p->worker->category : null;
                if (!isset($workerMap[$workerId])) {
                    $workerMap[$workerId] = [
                        'worker_id' => $workerId,
                        'worker_name' => $profile ? trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '')) : 'Unknown Worker',
                        'category' => $category ? $category->name : 'Uncategorized',
                        'total_services' => 0, // deprecated in UI
                        'bookings' => 0,
                        'total_customers' => 0,
                        'total_amount' => 0.0,
                        'total_commission' => 0.0,
                        'required_payout' => 0.0,
                        'paid_amount' => 0.0,
                    ];
                    $workerCustomerSet[$workerId] = [];
                    $workerBookingSet[$workerId] = [];
                }

                // Unique sets
                if (!empty($p->customer_id) && !in_array((string)$p->customer_id, $workerCustomerSet[$workerId], true)) {
                    $workerCustomerSet[$workerId][] = (string)$p->customer_id;
                }
                if (!empty($p->booking_id) && !in_array((string)$p->booking_id, $workerBookingSet[$workerId], true)) {
                    $workerBookingSet[$workerId][] = (string)$p->booking_id;
                }

                // Totals
                $workerMap[$workerId]['total_services']++; // kept for compatibility
                $workerMap[$workerId]['total_amount'] += (float) ($p->total_amount ?? 0);
                $workerMap[$workerId]['total_commission'] += (float) ($p->commission_amount ?? 0);
                $workerMap[$workerId]['required_payout'] += (float) ($p->worker_payout ?? 0);
                if ((bool) ($p->worker_paid ?? false)) {
                    $workerMap[$workerId]['paid_amount'] += (float) ($p->worker_payout ?? 0);
                }
            }

            // Finalize unique counts
            foreach ($workerMap as $wid => &$summary) {
                $summary['total_customers'] = isset($workerCustomerSet[$wid]) ? count($workerCustomerSet[$wid]) : 0;
                $summary['bookings'] = isset($workerBookingSet[$wid]) ? count($workerBookingSet[$wid]) : 0;
            }
            unset($summary);

            $allSummaries = array_values($workerMap);
            usort($allSummaries, function ($a, $b) { return strcmp($a['worker_name'], $b['worker_name']); });

            foreach ($allSummaries as &$summary) {
                $summary['total_amount'] = round((float)$summary['total_amount'], 2);
                $summary['total_commission'] = round((float)$summary['total_commission'], 2);
                $summary['required_payout'] = round((float)$summary['required_payout'], 2);
                $summary['paid_amount'] = round((float)$summary['paid_amount'], 2);
            }
            unset($summary);

            $totalCount = count($allSummaries);
            $offset = max(0, ($page - 1) * $pageSize);
            $paginatedSummaries = $pageSize > 0 ? array_slice($allSummaries, $offset, $pageSize) : $allSummaries;

            return response()->json([
                'workerSummaries' => $paginatedSummaries,
                'totalCount' => $totalCount,
                'page' => $page,
                'pageSize' => $pageSize,
                'totalPages' => $pageSize > 0 ? (int) ceil($totalCount / $pageSize) : 1,
            ]);
        } catch (\Throwable $e) {
            \Log::error('getWorkerPaymentSummary error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch worker payment summary'], 500);
        }
    }

    /**
     * Admin payments: paginate raw payments with filters; include totals for the current page and total count
     */
    public function getAdminPayments(Request $request)
    {
        try {
            $page = (int) ($request->get('page') ?? $request->get('pageNumber') ?? 1);
            $perPage = (int) ($request->get('per_page') ?? $request->get('pageSize') ?? 10);
            $status = $request->get('status', 'all');
            $workerId = $request->get('worker_id');
            $workerPaid = $request->get('worker_paid');
            $search = $request->get('search');

            $query = Payment::with(['booking.service', 'customer', 'worker.profile'])
                ->orderBy('created_at', 'desc');

            if ($workerId) { $query->where('worker_id', $workerId); }
            if ($status && $status !== 'all') { $query->where('payment_status', $status); }
            if ($workerPaid !== null && $workerPaid !== 'all' && $workerPaid !== '') {
                if ($workerPaid === 'true' || $workerPaid === true || $workerPaid === 1 || $workerPaid === '1') {
                    $query->where('worker_paid', true);
                } else if ($workerPaid === 'false' || $workerPaid === false || $workerPaid === 0 || $workerPaid === '0') {
                    $query->where('worker_paid', false);
                }
            }
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->whereHas('customer', function($q2) use ($search) {
                        $q2->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
                    })->orWhereHas('worker.profile', function($q3) use ($search) {
                        $q3->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
                    })->orWhere('transaction_id', 'like', "%{$search}%");
                });
            }

            $totalCount = (clone $query)->count();
            if ($perPage > 0) {
                $query->skip(max(0, ($page - 1) * $perPage))->take($perPage);
            }
            $rows = $query->get();

            $payments = $rows->map(function($p) {
                return [
                    'id' => (string) $p->id,
                    'booking_id' => (string) $p->booking_id,
                    'customer_id' => (string) $p->customer_id,
                    'worker_id' => (string) $p->worker_id,
                    'total_amount' => round((float) $p->total_amount, 2),
                    'commission_rate' => (float) $p->commission_rate,
                    'commission_amount' => round((float) $p->commission_amount, 2),
                    'worker_payout' => round((float) $p->worker_payout, 2),
                    'payment_status' => $p->payment_status,
                    'worker_paid' => (bool) $p->worker_paid,
                    'payment_method' => $p->payment_method,
                    'transaction_id' => $p->transaction_id,
                    'created_at' => $p->created_at,
                    // Joined
                    'customer' => $p->customer ? trim(($p->customer->first_name ?? '') . ' ' . ($p->customer->last_name ?? '')) : 'Customer',
                    'worker' => ($p->worker && $p->worker->profile) ? trim(($p->worker->profile->first_name ?? '') . ' ' . ($p->worker->profile->last_name ?? '')) : 'Worker',
                    'serviceTitle' => ($p->booking && $p->booking->service) ? $p->booking->service->title : 'Service',
                ];
            });

            // Page totals
            $pageTotals = [
                'totalRevenue' => round((float) $payments->sum('total_amount'), 2),
                'totalCommission' => round((float) $payments->sum('commission_amount'), 2),
                'totalWorkerPayouts' => round((float) $payments->sum('worker_payout'), 2),
            ];

            return response()->json([
                'payments' => $payments,
                'totalCount' => $totalCount,
                'page' => $page,
                'per_page' => $perPage,
                'totalPages' => $perPage > 0 ? (int) ceil($totalCount / $perPage) : 1,
                'totals' => $pageTotals,
            ]);
        } catch (\Throwable $e) {
            \Log::error('getAdminPayments error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch payments'], 500);
        }
    }

    /**
     * Get worker account status info
     */
    public function getWorkerAccountStatus($workerId)
    {
        try {
            $worker = WorkerProfile::with(['profile', 'category'])->findOrFail($workerId);

            $isVerified = (bool) ($worker->is_verified || ($worker->verification_status === 'verified'));
            $isAvailable = (bool) $worker->is_available;
            $derivedStatus = $isVerified ? 'verified' : ($worker->verification_status ?? 'pending');

            // Prefer worker_account_status table if present
            $cols = Schema::getColumnListing('worker_account_status');
            $row = null;
            if (!empty($cols)) {
                $row = \DB::table('worker_account_status')->where('worker_id', $workerId)->first();
            }

            $isActive = null;
            $deactivatedAt = null;
            $deactivationReason = null;
            $reactivatedAt = null;

            if ($row) {
                $isActive = (bool) ($row->is_active ?? true);
                $deactivatedAt = $row->deactivated_at ?? null;
                $deactivationReason = $row->deactivation_reason ?? null;
                $reactivatedAt = $row->reactivated_at ?? null;
            } else {
                // Fallback to availability + verification if no status row exists
                $isActive = (bool) ($isAvailable && $isVerified);
            }

            return response()->json([
                'worker_id' => (string) $worker->id,
                'is_verified' => $isVerified,
                'is_available' => $isAvailable,
                'is_active' => $isActive,
                'status' => $derivedStatus,
                'deactivated_at' => $deactivatedAt,
                'deactivation_reason' => $deactivationReason,
                'reactivated_at' => $reactivatedAt,
                'can_message' => $isVerified && $isActive,
            ]);
        } catch (\Throwable $e) {
            \Log::error('getWorkerAccountStatus error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch worker status'], 500);
        }
    }

    /**
     * Worker Categories - List
     */
    public function getWorkerCategories(Request $request)
    {
        try {
            $categories = WorkerCategory::orderBy('created_at', 'desc')->get();
            return response()->json($categories->map(function ($cat) {
                return [
                    'id' => (string) $cat->id,
                    'name' => $cat->name,
                    'description' => $cat->description,
                    'commission_rate' => (float) $cat->commission_rate,
                    'min_rating' => (float) $cat->min_rating,
                    'min_experience' => (int) $cat->min_experience,
                    'min_customers' => (int) $cat->min_customers,
                    'color' => $cat->color ?? '#6b7280',
                    'created_at' => $cat->created_at,
                    'updated_at' => $cat->updated_at,
                ];
            }));
        } catch (\Throwable $e) {
            \Log::error('getWorkerCategories error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch worker categories'], 500);
        }
    }

    /**
     * Worker Categories - Create
     */
    public function createWorkerCategory(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:worker_categories,name',
                'commission_rate' => 'required|numeric|min:0|max:1',
                'min_customers' => 'required|integer|min:0',
                'min_rating' => 'required|numeric|min:0|max:5',
                'description' => 'nullable|string',
                'min_experience' => 'nullable|integer|min:0',
                'color' => 'nullable|string|max:20',
            ]);

            $category = WorkerCategory::create([
                'id' => (string) Str::uuid(),
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'commission_rate' => $validated['commission_rate'],
                'min_rating' => $validated['min_rating'],
                'min_experience' => $validated['min_experience'] ?? 0,
                'min_customers' => $validated['min_customers'],
                'color' => $validated['color'] ?? '#6b7280',
            ]);

            return response()->json($category, 201);
        } catch (\Throwable $e) {
            \Log::error('createWorkerCategory error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create worker category'], 500);
        }
    }

    /**
     * Worker Categories - Update
     */
    public function updateWorkerCategory(Request $request, $id)
    {
        try {
            $category = WorkerCategory::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:worker_categories,name,' . $id,
                'commission_rate' => 'required|numeric|min:0|max:1',
                'min_customers' => 'required|integer|min:0',
                'min_rating' => 'required|numeric|min:0|max:5',
                'description' => 'nullable|string',
                'min_experience' => 'nullable|integer|min:0',
                'color' => 'nullable|string|max:20',
            ]);

            $category->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? $category->description,
                'commission_rate' => $validated['commission_rate'],
                'min_rating' => $validated['min_rating'],
                'min_experience' => $validated['min_experience'] ?? $category->min_experience,
                'min_customers' => $validated['min_customers'],
                'color' => $validated['color'] ?? $category->color,
            ]);

            return response()->json($category);
        } catch (\Throwable $e) {
            \Log::error('updateWorkerCategory error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update worker category'], 500);
        }
    }

    /**
     * Worker Categories - Delete
     */
    public function deleteWorkerCategory($id)
    {
        try {
            $category = WorkerCategory::findOrFail($id);
            $category->delete();
            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            \Log::error('deleteWorkerCategory error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete worker category'], 500);
        }
    }

    /**
     * Update global commission setting
     */
    public function updateGlobalCommission(Request $request)
    {
        try {
            $validated = $request->validate([
                'commission_rate' => 'required|numeric|min:0|max:1',
            ]);

            $setting = CommissionSetting::firstOrNew(['is_global' => true]);
            if (!$setting->exists) {
                $setting->id = (string) Str::uuid();
                $setting->is_global = true;
            }
            $setting->commission_rate = $validated['commission_rate'];
            $setting->save();

            return response()->json(['success' => true, 'commission_rate' => (float) $setting->commission_rate]);
        } catch (\Throwable $e) {
            \Log::error('updateGlobalCommission error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update commission'], 500);
        }
    }

    /**
     * Sub Admins - List
     */
    public function listSubAdmins()
    {
        try {
            $admins = AdminUser::with('profile')->get()->map(function ($a) {
                return [
                    'id' => (string) $a->id,
                    'email' => $a->email,
                    'role' => $a->role ?? 'sub_admin',
                    'is_active' => (bool) ($a->is_active ?? true),
                    'profiles' => [
                        'first_name' => $a->profile->first_name ?? '',
                        'last_name' => $a->profile->last_name ?? '',
                    ],
                    'created_at' => $a->created_at,
                ];
            });
            return response()->json($admins);
        } catch (\Throwable $e) {
            \Log::error('listSubAdmins error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch sub admins'], 500);
        }
    }

    /**
     * Sub Admins - Create
     */
    public function createSubAdmin(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'permissions' => 'nullable|array',
            ]);

            $admin = AdminUser::create([
                'id' => (string) Str::uuid(),
                'email' => $validated['email'],
                'role' => 'sub_admin',
                'is_active' => true,
            ]);

            // Optionally create or link Profile here if needed

            return response()->json(['success' => true, 'id' => (string) $admin->id]);
        } catch (\Throwable $e) {
            \Log::error('createSubAdmin error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create sub admin'], 500);
        }
    }
}
