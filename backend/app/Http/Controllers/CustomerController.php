<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Profile;
use App\Models\Service;
use App\Models\Message;
use App\Models\WorkerProfile;

class CustomerController extends Controller
{
    /**
     * Get customer dashboard data including allServices for Browse page
     */
    public function getCustomerData(Request $request, string $customerId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Allow self or admin to access
            $requesterProfile = Profile::where('id', $user->id)->first();
            if (!$requesterProfile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }
            if ($requesterProfile->user_type !== 'admin' && $user->id !== $customerId) {
                return response()->json(['error' => 'Access denied'], 403);
            }

            // Fetch active services with relations (include direct profile for location)
            $services = Service::with(['category', 'worker', 'worker.profile', 'profile'])
                ->where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform into the shape Browse.tsx expects
            $allServices = $services->map(function($service) {
                $workerProfile = $service->worker; // WorkerProfile model
                // Prefer direct service->profile, fallback to worker->profile
                $worker = $service->profile ?: ($workerProfile ? $workerProfile->profile : null);
                $category = $service->category;

                return [
                    'id' => $service->id,
                    'title' => $service->title,
                    'description' => $service->description ?? '',
                    'category' => $category ? ($category->name ?? 'Service') : 'Service',
                    'provider' => $worker ? trim(($worker->first_name ?? '') . ' ' . ($worker->last_name ?? '')) : 'Provider',
                    'rating' => (float) ($workerProfile->rating ?? 0),
                    'price_min' => (float) ($service->price_min ?? 0),
                    'price_max' => (float) ($service->price_max ?? 0),
                    'duration_hours' => (float) ($service->duration_hours ?? 1),
                    'online_available' => (bool) ($workerProfile->online_services ?? false),
                    'worker_location' => ($worker && isset($worker->location) && trim((string)$worker->location) !== '')
                        ? trim((string)$worker->location)
                        : null,
                    'worker_id' => $workerProfile ? $workerProfile->id : null,
                ];
            })->values();

            // Minimal payload for other dashboard fields to avoid UI breaks
            return response()->json([
                'stats' => [
                    'totalBookings' => 0,
                    'totalSpent' => 0,
                    'favoriteWorkers' => 0,
                    'averageRating' => 4.8,
                ],
                'recentBookings' => [],
                'upcomingBookings' => [],
                'recommendedServices' => $allServices->take(6)->values(),
                'allServices' => $allServices,
                'favorites' => [],
                'messages' => [ 'conversations' => [], 'activeChat' => [] ],
                'payments' => [],
                'reviews' => [],
                'profile' => Profile::where('id', $customerId)->first(),
                'alerts' => [],
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error fetching customer data: '.$e->getMessage());
            return response()->json(['error' => 'Failed to fetch customer data'], 500);
        }
    }

    /**
     * Create a service request for a worker (and optional initial message)
     */
    public function createServiceRequest(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validated = $request->validate([
                'service_id' => 'required|string',
                'worker_id' => 'required|string', // worker_profiles.id
                'message_to_worker' => 'nullable|string',
                'preferred_date' => 'nullable|date',
                'location_address' => 'nullable|string',
                'location_latitude' => 'nullable|numeric',
                'location_longitude' => 'nullable|numeric',
                'budget_min' => 'nullable|numeric',
                'budget_max' => 'nullable|numeric',
            ]);

            // Ensure worker exists
            $worker = WorkerProfile::where('id', $validated['worker_id'])->first();
            if (!$worker) {
                return response()->json(['error' => 'Worker not found'], 404);
            }

            // Ensure service exists (do not require ownership match to unblock requests)
            $service = Service::where('id', $validated['service_id'])->first();
            if (!$service) {
                return response()->json(['error' => 'Service not found'], 400);
            }

            // Insert into service_requests (use DB to avoid model requirement)
            $serviceRequestId = (string) Str::uuid();
            DB::table('service_requests')->insert([
                'id' => $serviceRequestId,
                'customer_id' => $user->id,
                'service_id' => $validated['service_id'],
                'worker_id' => $validated['worker_id'],
                'message_to_worker' => $validated['message_to_worker'] ?? null,
                'preferred_date' => $validated['preferred_date'] ?? null,
                'location_address' => $validated['location_address'] ?? null,
                'location_latitude' => $validated['location_latitude'] ?? null,
                'location_longitude' => $validated['location_longitude'] ?? null,
                'budget_min' => $validated['budget_min'] ?? null,
                'budget_max' => $validated['budget_max'] ?? null,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Notify worker about new service request
            try {
                \App\Models\Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $validated['worker_id'],
                    'type' => 'service_request_received',
                    'title' => 'New Service Request',
                    'message' => 'You received a new service request from a customer.',
                    'data' => json_encode([
                        'service_request_id' => $serviceRequestId,
                        'service_id' => $validated['service_id'],
                        'customer_id' => $user->id,
                    ]),
                    'is_read' => false,
                ]);
            } catch (\Throwable $e) {
                \Log::warning('Failed to create worker service request notification: '.$e->getMessage());
            }

            // Note: We cannot create an initial message without a valid booking_id due to FK/NOT NULL.
            // Frontend should create a message later once a booking is created.

            return response()->json(['serviceRequest' => [
                'id' => $serviceRequestId,
                'service_id' => $validated['service_id'],
                'worker_id' => $validated['worker_id'],
                'status' => 'pending',
            ]], 201);
        } catch (\Throwable $e) {
            \Log::error('Error creating service request: '.$e->getMessage());
            return response()->json(['error' => 'Failed to create service request', 'message' => $e->getMessage()], 400);
        }
    }
}
