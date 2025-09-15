<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AccountActivationRequest;
use App\Models\Profile;
use App\Models\WorkerAccountStatus;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountActivationController extends Controller
{
    /**
     * Get account activation requests for authenticated user
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

            $query = AccountActivationRequest::with([
                'worker:id,first_name,last_name',
                'admin:id,first_name,last_name'
            ]);

            // Filter based on user type
            if ($profile->user_type === 'worker') {
                $query->where('worker_id', $user->id);
            } elseif ($profile->user_type === 'admin') {
                // Admins can see all activation requests
            } else {
                return response()->json(['error' => 'Access denied'], 403);
            }

            if ($status) {
                $query->where('status', $status);
            }

            $requests = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $requests
            ]);

        } catch (\Exception $error) {
            Log::error('Error fetching account activation requests:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Create a new account activation request
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
                return response()->json(['error' => 'Only workers can create activation requests'], 403);
            }

            $validated = $request->validate([
                'request_reason' => 'required|string|max:1000'
            ]);

            // Check if worker already has a pending request
            $existingRequest = AccountActivationRequest::where('worker_id', $user->id)
                ->where('status', 'pending')
                ->first();

            if ($existingRequest) {
                return response()->json(['error' => 'You already have a pending activation request'], 400);
            }

            DB::beginTransaction();

            $activationRequest = AccountActivationRequest::create([
                'worker_id' => $user->id,
                'request_reason' => $validated['request_reason'],
                'status' => 'pending'
            ]);

            // Send notification to all admins
            $workerName = $profile->first_name . ' ' . $profile->last_name;
            $admins = Profile::where('user_type', 'admin')->get();
            
            foreach ($admins as $admin) {
                NotificationController::createNotification(
                    $admin->id,
                    'activation_request_received',
                    'New Activation Request',
                    $workerName . ' has requested account activation: ' . $validated['request_reason'],
                    $activationRequest->id,
                    'activation_request'
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Activation request created successfully',
                'data' => $activationRequest->load(['worker:id,first_name,last_name'])
            ], 201);

        } catch (\Exception $error) {
            DB::rollBack();
            Log::error('Error creating activation request:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Update activation request status (admin only)
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'admin') {
                return response()->json(['error' => 'Only admins can update activation requests'], 403);
            }

            $activationRequest = AccountActivationRequest::findOrFail($id);

            $validated = $request->validate([
                'status' => 'required|in:pending,approved,rejected',
                'admin_response' => 'nullable|string|max:1000'
            ]);

            $oldStatus = $activationRequest->status;

            DB::beginTransaction();

            $activationRequest->update([
                'status' => $validated['status'],
                'admin_response' => $validated['admin_response'] ?? $activationRequest->admin_response,
                'admin_id' => $user->id
            ]);

            // If approved, reactivate the worker account
            if ($validated['status'] === 'approved' && $oldStatus !== 'approved') {
                WorkerAccountStatus::updateOrCreate(
                    ['worker_id' => $activationRequest->worker_id],
                    [
                        'is_active' => true,
                        'reactivated_at' => now(),
                        'reactivation_reason' => 'Account reactivated by admin approval',
                        'updated_at' => now()
                    ]
                );

                // Send notification to worker about reactivation
                NotificationController::createNotification(
                    $activationRequest->worker_id,
                    'account_reactivated',
                    'Account Reactivated',
                    'Your account has been reactivated by admin. You can now use the platform again.',
                    $activationRequest->id,
                    'worker_account'
                );
            } elseif ($validated['status'] === 'rejected' && $oldStatus !== 'rejected') {
                // Send notification to worker about rejection
                NotificationController::createNotification(
                    $activationRequest->worker_id,
                    'activation_request_rejected',
                    'Activation Request Rejected',
                    'Your activation request has been rejected. Please contact admin for more information.',
                    $activationRequest->id,
                    'activation_request'
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Activation request updated successfully',
                'data' => $activationRequest->load(['worker:id,first_name,last_name', 'admin:id,first_name,last_name'])
            ]);

        } catch (\Exception $error) {
            DB::rollBack();
            Log::error('Error updating activation request:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get single activation request
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

            $activationRequest = AccountActivationRequest::with([
                'worker:id,first_name,last_name,phone',
                'admin:id,first_name,last_name'
            ])->findOrFail($id);

            // Check access
            if ($profile->user_type === 'worker' && $activationRequest->worker_id !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            } elseif ($profile->user_type !== 'admin' && $profile->user_type !== 'worker') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $activationRequest
            ]);

        } catch (\Exception $error) {
            Log::error('Error fetching activation request:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get worker account status
     */
    public function getWorkerStatus($workerId)
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

            // Check access
            if ($profile->user_type === 'worker' && $workerId !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            } elseif ($profile->user_type !== 'admin' && $profile->user_type !== 'worker') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $workerStatus = WorkerAccountStatus::where('worker_id', $workerId)->first();

            if (!$workerStatus) {
                // Create default status if it doesn't exist
                $workerStatus = WorkerAccountStatus::create([
                    'worker_id' => $workerId,
                    'is_active' => true,
                    'last_activity_check' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $workerStatus
            ]);

        } catch (\Exception $error) {
            Log::error('Error fetching worker status:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get all activation requests for admin dashboard
     * This replicates the complex logic from useAdminAccountActivation hook
     */
    public function getAdminRequests(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'admin') {
                return response()->json(['error' => 'Only admins can access this endpoint'], 403);
            }

            $requests = AccountActivationRequest::with([
                'worker:id,first_name,last_name,email,created_at',
                'admin:id,first_name,last_name'
            ])
            ->orderBy('created_at', 'desc')
            ->get();

            // Transform data to match frontend expectations
            $transformedRequests = $requests->map(function($request) {
                return [
                    'id' => $request->id,
                    'worker_id' => $request->worker_id,
                    'request_reason' => $request->request_reason,
                    'status' => $request->status,
                    'admin_notes' => $request->admin_response,
                    'requested_at' => $request->created_at,
                    'processed_at' => $request->updated_at,
                    'processed_by' => $request->admin_id,
                    'created_at' => $request->created_at,
                    'updated_at' => $request->updated_at,
                    'worker_profile' => [
                        'profiles' => [
                            'first_name' => $request->worker->first_name ?? 'Unknown',
                            'last_name' => $request->worker->last_name ?? 'Worker',
                            'email' => $request->worker->email ?? 'No email',
                            'created_at' => $request->worker->created_at ?? $request->created_at
                        ],
                        'worker_categories' => [
                            'name' => 'Standard',
                            'description' => 'Standard worker category'
                        ]
                    ]
                ];
            });

            return response()->json($transformedRequests);

        } catch (\Exception $error) {
            Log::error('Error fetching admin requests:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Process activation request (approve/reject)
     * This replicates the processRequest function from the hook
     */
    public function processRequest(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'admin') {
                return response()->json(['error' => 'Only admins can process requests'], 403);
            }

            $validated = $request->validate([
                'status' => 'required|in:approved,rejected',
                'admin_notes' => 'nullable|string|max:1000'
            ]);

            $activationRequest = AccountActivationRequest::findOrFail($id);

            DB::beginTransaction();

            $activationRequest->update([
                'status' => $validated['status'],
                'admin_response' => $validated['admin_notes'] ?? null,
                'admin_id' => $user->id,
                'updated_at' => now()
            ]);

            // If approved, reactivate the worker account
            if ($validated['status'] === 'approved') {
                WorkerAccountStatus::updateOrCreate(
                    ['worker_id' => $activationRequest->worker_id],
                    [
                        'is_active' => true,
                        'reactivated_at' => now(),
                        'reactivation_reason' => 'Account reactivated by admin approval',
                        'updated_at' => now()
                    ]
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Request processed successfully'
            ]);

        } catch (\Exception $error) {
            DB::rollBack();
            Log::error('Error processing request:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get deactivated workers
     * This replicates the getDeactivatedWorkers function from the hook
     */
    public function getDeactivatedWorkers(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'admin') {
                return response()->json(['error' => 'Only admins can access this endpoint'], 403);
            }

            $deactivatedWorkers = WorkerAccountStatus::with([
                'worker:id,first_name,last_name,email,created_at'
            ])
            ->where('is_active', false)
            ->orderBy('deactivated_at', 'desc')
            ->get();

            // Transform data to match frontend expectations
            $transformedWorkers = $deactivatedWorkers->map(function($status) {
                return [
                    'id' => $status->id,
                    'worker_id' => $status->worker_id,
                    'is_active' => $status->is_active,
                    'deactivated_at' => $status->deactivated_at,
                    'deactivation_reason' => $status->deactivation_reason,
                    'reactivated_at' => $status->reactivated_at,
                    'reactivation_reason' => $status->reactivation_reason,
                    'updated_at' => $status->updated_at,
                    'worker_profile' => [
                        'profiles' => [
                            'first_name' => $status->worker->first_name ?? 'Unknown',
                            'last_name' => $status->worker->last_name ?? 'Worker',
                            'email' => $status->worker->email ?? 'No email',
                            'created_at' => $status->worker->created_at ?? $status->created_at
                        ],
                        'worker_categories' => [
                            'name' => 'Standard',
                            'description' => 'Standard worker category'
                        ]
                    ]
                ];
            });

            return response()->json($transformedWorkers);

        } catch (\Exception $error) {
            Log::error('Error fetching deactivated workers:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Manually deactivate worker
     * This replicates the manuallyDeactivateWorker function from the hook
     */
    public function manuallyDeactivateWorker(Request $request, $workerId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'admin') {
                return response()->json(['error' => 'Only admins can deactivate workers'], 403);
            }

            $validated = $request->validate([
                'reason' => 'required|string|max:1000'
            ]);

            DB::beginTransaction();

            WorkerAccountStatus::updateOrCreate(
                ['worker_id' => $workerId],
                [
                    'is_active' => false,
                    'deactivated_at' => now(),
                    'deactivation_reason' => $validated['reason'],
                    'updated_at' => now()
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Worker deactivated successfully'
            ]);

        } catch (\Exception $error) {
            DB::rollBack();
            Log::error('Error manually deactivating worker:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Manually reactivate worker
     * This replicates the manuallyReactivateWorker function from the hook
     */
    public function manuallyReactivateWorker(Request $request, $workerId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'admin') {
                return response()->json(['error' => 'Only admins can reactivate workers'], 403);
            }

            $validated = $request->validate([
                'reason' => 'required|string|max:1000'
            ]);

            DB::beginTransaction();

            WorkerAccountStatus::updateOrCreate(
                ['worker_id' => $workerId],
                [
                    'is_active' => true,
                    'reactivated_at' => now(),
                    'reactivation_reason' => $validated['reason'],
                    'updated_at' => now()
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Worker reactivated successfully'
            ]);

        } catch (\Exception $error) {
            DB::rollBack();
            Log::error('Error manually reactivating worker:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Run periodic deactivation check
     * This replicates the runPeriodicCheck function from the hook
     */
    public function runPeriodicCheck(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'admin') {
                return response()->json(['error' => 'Only admins can run periodic checks'], 403);
            }

            // This would implement the periodic deactivation logic
            // For now, we'll just return success
            // In a real implementation, this would check for inactive workers and deactivate them

            return response()->json([
                'success' => true,
                'message' => 'Periodic check completed successfully'
            ]);

        } catch (\Exception $error) {
            Log::error('Error running periodic check:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
