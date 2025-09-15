<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\BlockedConversation;
use App\Models\WorkerProfile;
use Illuminate\Support\Str;

class BlockedConversationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

            $role = $request->query('role', 'customer');
            if ($role === 'customer') {
                $rows = BlockedConversation::where('customer_id', $user->id)->get(['worker_id']);
                return response()->json($rows);
            }
            if ($role === 'worker') {
                $rows = BlockedConversation::where('worker_id', $user->id)->get(['customer_id']);
                return response()->json($rows);
            }
            return response()->json([]);
        } catch (\Throwable $e) {
            Log::error('BlockedConversation index error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch blocked conversations'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

            $validated = $request->validate([
                'worker_id' => 'required|uuid'
            ]);

            // Ensure worker exists
            $workerExists = WorkerProfile::where('id', $validated['worker_id'])->exists();
            if (!$workerExists) {
                return response()->json(['error' => 'Worker not found'], 404);
            }

            $row = BlockedConversation::where('customer_id', $user->id)
                ->where('worker_id', $validated['worker_id'])
                ->first();
            if (!$row) {
                $row = BlockedConversation::create([
                    'id' => (string) Str::uuid(),
                    'customer_id' => $user->id,
                    'worker_id' => $validated['worker_id'],
                    'blocked_at' => now(),
                ]);
            }

            return response()->json($row, 201);
        } catch (\Throwable $e) {
            Log::error('BlockedConversation store error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to block conversation'], 500);
        }
    }

    public function destroy($workerId)
    {
        try {
            $user = Auth::user();
            if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

            BlockedConversation::where('customer_id', $user->id)
                ->where('worker_id', $workerId)
                ->delete();

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            Log::error('BlockedConversation destroy error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to unblock conversation'], 500);
        }
    }
}



