<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Profile;
use App\Models\Notification;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Get notifications for a user
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

            $request->validate([
                'user_id' => 'nullable|string',
                'type' => 'nullable|string',
                'is_read' => 'nullable|boolean'
            ]);

            $userId = $request->input('user_id', $user->id);
            $type = $request->input('type');
            $isRead = $request->input('is_read');

            // Check if user is accessing their own data or is admin
            if ($profile->user_type !== 'admin' && $user->id !== $userId) {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $query = Notification::where('user_id', $userId);

            if ($type) {
                $query->where('type', $type);
            }

            if ($isRead !== null) {
                $query->where('is_read', $isRead);
            }

            $notifications = $query->orderBy('created_at', 'desc')->get();

            return response()->json($notifications);

        } catch (\Exception $e) {
            \Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch notifications'], 500);
        }
    }

    /**
     * Get unread count for a user
     */
    public function unreadCount(Request $request)
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

            $request->validate([
                'user_id' => 'nullable|string'
            ]);

            $userId = $request->input('user_id', $user->id);

            // Check if user is accessing their own data or is admin
            if ($profile->user_type !== 'admin' && $user->id !== $userId) {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $unreadCount = Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->count();

            return response()->json($unreadCount);

        } catch (\Exception $e) {
            \Log::error('Error getting unread count: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get unread count'], 500);
        }
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id)
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

            $request->validate([
                'is_read' => 'required|boolean'
            ]);

            $notification = Notification::find($id);
            if (!$notification) {
                return response()->json(['error' => 'Notification not found'], 404);
            }

            // Check if user owns this notification or is admin
            if ($profile->user_type !== 'admin' && $notification->user_id !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $notification->is_read = $request->input('is_read');
            $notification->save();

            return response()->json(['message' => 'Notification updated successfully']);

        } catch (\Exception $e) {
            \Log::error('Error marking notification as read: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update notification'], 500);
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead(Request $request)
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

            $request->validate([
                'user_id' => 'nullable|string'
            ]);

            $userId = $request->input('user_id', $user->id);

            // Check if user is accessing their own data or is admin
            if ($profile->user_type !== 'admin' && $user->id !== $userId) {
                return response()->json(['error' => 'Access denied'], 403);
            }

            Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json(['message' => 'All notifications marked as read']);

        } catch (\Exception $e) {
            \Log::error('Error marking all notifications as read: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to mark all notifications as read'], 500);
        }
    }

    /**
     * Create a new notification
     */
    public function store(Request $request)
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

            // Only admins can create notifications
            if ($profile->user_type !== 'admin') {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $request->validate([
                'user_id' => 'required|string',
                'type' => 'required|string',
                'title' => 'required|string',
                'message' => 'required|string',
                'related_id' => 'nullable|string',
                'related_type' => 'nullable|string'
            ]);

            $notification = Notification::create([
                'user_id' => $request->input('user_id'),
                'type' => $request->input('type'),
                'title' => $request->input('title'),
                'message' => $request->input('message'),
                'related_id' => $request->input('related_id'),
                'related_type' => $request->input('related_type'),
                'is_read' => false
            ]);

            return response()->json($notification, 201);

        } catch (\Exception $e) {
            \Log::error('Error creating notification: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create notification'], 500);
        }
    }

    /**
     * Delete a notification
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

            $notification = Notification::find($id);
            if (!$notification) {
                return response()->json(['error' => 'Notification not found'], 404);
            }

            // Check if user owns this notification or is admin
            if ($profile->user_type !== 'admin' && $notification->user_id !== $user->id) {
                return response()->json(['error' => 'Access denied'], 403);
            }

            $notification->delete();

            return response()->json(['message' => 'Notification deleted successfully']);

        } catch (\Exception $e) {
            \Log::error('Error deleting notification: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete notification'], 500);
        }
    }

}