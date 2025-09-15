<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\Profile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Notification;

class MessageController extends Controller
{
    /**
     * Get messages for authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $perPage = $request->query('per_page', 20);
            $conversationWith = $request->query('conversation_with');

            $query = Message::with([
                'sender:id,first_name,last_name',
                'receiver:id,first_name,last_name'
            ])->where(function($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            });

            if ($conversationWith) {
                $query->where(function($q) use ($user, $conversationWith) {
                    $q->where('sender_id', $user->id)
                      ->where('receiver_id', $conversationWith)
                      ->orWhere('sender_id', $conversationWith)
                      ->where('receiver_id', $user->id);
                });
            }

            $messages = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $messages
            ]);

        } catch (\Exception $error) {
            Log::error('Error fetching messages:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get conversation list for authenticated user with partner names and stats
     */
    public function getConversations(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

            // Get all messages where current user is sender or receiver
            $messages = Message::query()
                ->select(['id','sender_id','receiver_id','message_text','is_read','created_at'])
                ->where(function($q) use ($user) {
                    $q->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
                })
                ->orderByDesc('created_at')
                ->get();

            // Determine partner IDs
            $partnerIds = [];
            foreach ($messages as $m) {
                $partnerIds[] = $m->sender_id == $user->id ? $m->receiver_id : $m->sender_id;
            }
            $partnerIds = array_values(array_unique($partnerIds));

            // Load partner profiles
            $profiles = Profile::whereIn('id', $partnerIds)->get(['id','first_name','last_name']);
            $profileMap = [];
            foreach ($profiles as $p) {
                $profileMap[$p->id] = trim(($p->first_name ?? '') . ' ' . ($p->last_name ?? '')) ?: 'Unknown User';
            }

            // Group messages by partner and build conversation objects
            $convMap = [];
            foreach ($messages as $m) {
                $partnerId = $m->sender_id == $user->id ? $m->receiver_id : $m->sender_id;
                if (!isset($convMap[$partnerId])) {
                    $convMap[$partnerId] = [
                        'id' => (string) $partnerId,
                        'partner_id' => (string) $partnerId,
                        'partner_name' => $profileMap[$partnerId] ?? 'Unknown User',
                        'last_message' => $m->message_text,
                        'last_message_time' => $m->created_at,
                        'unread' => 0,
                    ];
                }
                // Count unread messages received by the user
                if ($m->receiver_id == $user->id && !$m->is_read) {
                    $convMap[$partnerId]['unread']++;
                }
            }

            // Return as array
            $conversations = array_values($convMap);
            return response()->json(['success' => true, 'data' => $conversations]);
        } catch (\Throwable $e) {
            Log::error('getConversations error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch conversations'], 500);
        }
    }

    /**
     * Send a new message
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validated = $request->validate([
                'receiver_id' => 'required|string',
                'message' => 'required|string|max:1000',
                'message_type' => 'nullable|in:text,image,file'
            ]);

            // Check if receiver exists
            $receiver = Profile::find($validated['receiver_id']);
            if (!$receiver) {
                return response()->json(['error' => 'Receiver not found'], 404);
            }

            // Prevent self-messaging
            if ($validated['receiver_id'] === $user->id) {
                return response()->json(['error' => 'Cannot send message to yourself'], 400);
            }

            // Enforce customer block rules: if a customer has blocked this worker, worker cannot send
            $senderProfile = Profile::find($user->id);
            if ($senderProfile && $senderProfile->user_type === 'worker' && $receiver->user_type === 'customer') {
                $isBlocked = \App\Models\BlockedConversation::where('customer_id', $receiver->id)
                    ->where('worker_id', $user->id)
                    ->exists();
                if ($isBlocked) {
                    return response()->json(['error' => 'Conversation blocked by customer'], 403);
                }
            }

            DB::beginTransaction();

            $message = Message::create([
                'id' => (string) Str::uuid(),
                'sender_id' => $user->id,
                'receiver_id' => $validated['receiver_id'],
                'message_text' => $validated['message'],
                'is_read' => false
            ]);

            // Send notification to receiver (inline)
            $senderName = trim(($senderProfile->first_name ?? '') . ' ' . ($senderProfile->last_name ?? ''));
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $validated['receiver_id'],
                'type' => 'new_message',
                'title' => 'New Message',
                'message' => 'You received a new message from ' . ($senderName ?: 'Someone'),
                'related_id' => $message->id,
                'related_type' => 'message',
                'is_read' => false,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'data' => $message->load(['sender:id,first_name,last_name', 'receiver:id,first_name,last_name'])
            ], 201);

        } catch (\Exception $error) {
            DB::rollBack();
            Log::error('Error sending message:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Mark message as read
     */
    public function markAsRead($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $message = Message::where('id', $id)
                ->where('receiver_id', $user->id)
                ->first();

            if (!$message) {
                return response()->json(['error' => 'Message not found'], 404);
            }

            $message->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Message marked as read'
            ]);

        } catch (\Exception $error) {
            Log::error('Error marking message as read:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Batch mark messages as read (customer panel helper)
     */
    public function markReadBatch(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

            $validated = $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'string'
            ]);

            Message::whereIn('id', $validated['ids'] ?? [])
                ->where('receiver_id', $user->id)
                ->update(['is_read' => true]);

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            Log::error('markReadBatch error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to mark as read'], 500);
        }
    }

    /**
     * Get conversation between two users
     */
    public function getConversation($userId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $messages = Message::with([
                'sender:id,first_name,last_name',
                'receiver:id,first_name,last_name'
            ])->where(function($q) use ($user, $userId) {
                $q->where('sender_id', $user->id)
                  ->where('receiver_id', $userId)
                  ->orWhere('sender_id', $userId)
                  ->where('receiver_id', $user->id);
            })->orderBy('created_at', 'asc')->get();

            // Mark all messages as read
            Message::where('sender_id', $userId)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'data' => $messages
            ]);

        } catch (\Exception $error) {
            Log::error('Error fetching conversation:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get unread message count
     */
    public function getUnreadCount()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $count = Message::where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'success' => true,
                'unread_count' => $count
            ]);

        } catch (\Exception $error) {
            Log::error('Error getting unread count:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Delete message
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $message = Message::where('id', $id)
                ->where(function($q) use ($user) {
                    $q->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
                })
                ->first();

            if (!$message) {
                return response()->json(['error' => 'Message not found'], 404);
            }

            $message->delete();

            return response()->json([
                'success' => true,
                'message' => 'Message deleted successfully'
            ]);

        } catch (\Exception $error) {
            Log::error('Error deleting message:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
