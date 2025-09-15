<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Offer;
use App\Models\ServiceRequest;
use App\Models\Profile;
use App\Models\WorkerProfile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OfferController extends Controller
{
    /**
     * Get offers for authenticated user
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
            $status = $request->query('status');

            $query = Offer::with([
                'customer:id,first_name,last_name',
                'worker.profile:id,first_name,last_name',
                'service:id,title',
                'serviceRequest:id,message_to_worker'
            ]);

            // Filter based on user type
            if ($profile->user_type === 'customer') {
                $query->where('customer_id', $user->id);
            } elseif ($profile->user_type === 'worker') {
                $query->where('worker_id', $user->id);
            } elseif ($profile->user_type === 'admin') {
                // Admins can see all offers
            } else {
                return response()->json(['error' => 'Access denied'], 403);
            }

            if ($status) {
                $query->where('status', $status);
            }

            $offers = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $offers
            ]);

        } catch (\Exception $error) {
            Log::error('Error fetching offers:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Create a new offer
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'worker') {
                return response()->json(['error' => 'Only workers can create offers'], 403);
            }

            $validated = $request->validate([
                'customer_id' => 'required|exists:profiles,id',
                'service_id' => 'nullable|exists:services,id',
                'service_request_id' => 'nullable|exists:service_requests,id',
                'price' => 'required|numeric|min:0',
                'estimated_hours' => 'required|numeric|min:0.5',
                'description' => 'required|string|max:1000',
                'expires_at' => 'nullable|date|after:now'
            ]);

            // Check if worker is available
            $worker = WorkerProfile::find($user->id);
            if (!$worker || !$worker->is_available) {
                return response()->json(['error' => 'Worker is not available'], 400);
            }

            DB::beginTransaction();

            $offer = Offer::create([
                'service_request_id' => $validated['service_request_id'],
                'worker_id' => $user->id,
                'customer_id' => $validated['customer_id'],
                'service_id' => $validated['service_id'],
                'price' => $validated['price'],
                'estimated_hours' => $validated['estimated_hours'],
                'description' => $validated['description'],
                'status' => 'pending',
                'expires_at' => $validated['expires_at'] ?? now()->addDays(7)
            ]);

            // Send notification to customer
            $workerName = $profile->first_name . ' ' . $profile->last_name;
            $serviceTitle = $validated['service_id'] ? 
                \App\Models\Service::find($validated['service_id'])->title : 
                'Professional Service';
            
            NotificationController::createNotification(
                $validated['customer_id'],
                'new_offer',
                'New Offer Received',
                $workerName . ' has sent you an offer for ' . $serviceTitle,
                $offer->id,
                'offer'
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Offer created successfully',
                'data' => $offer->load(['customer:id,first_name,last_name', 'service:id,title'])
            ], 201);

        } catch (\Exception $error) {
            DB::rollBack();
            Log::error('Error creating offer:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Update offer status
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

            $offer = Offer::findOrFail($id);

            // Check if user can update this offer
            if ($profile->user_type === 'customer' && $offer->customer_id !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            } elseif ($profile->user_type === 'worker' && $offer->worker_id !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            } elseif ($profile->user_type !== 'admin' && $profile->user_type !== 'worker' && $profile->user_type !== 'customer') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $validated = $request->validate([
                'status' => 'required|in:pending,accepted,rejected,withdrawn,completed'
            ]);

            $oldStatus = $offer->status;

            DB::beginTransaction();

            $offer->update(['status' => $validated['status']]);

            // Send notification if status changed
            if ($oldStatus !== $validated['status']) {
                if ($profile->user_type === 'customer') {
                    // Customer responded to offer
                    $customerName = $profile->first_name . ' ' . $profile->last_name;
                    $serviceTitle = $offer->service ? $offer->service->title : 'Professional Service';
                    
                    $responseText = match($validated['status']) {
                        'accepted' => 'accepted your offer for ',
                        'rejected' => 'rejected your offer for ',
                        default => 'updated your offer for '
                    };

                    NotificationController::createNotification(
                        $offer->worker_id,
                        'offer_response',
                        'Offer Response',
                        $customerName . ' ' . $responseText . $serviceTitle,
                        $offer->id,
                        'offer'
                    );
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Offer updated successfully',
                'data' => $offer->load(['customer:id,first_name,last_name', 'worker.profile:id,first_name,last_name', 'service:id,title'])
            ]);

        } catch (\Exception $error) {
            DB::rollBack();
            Log::error('Error updating offer:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
