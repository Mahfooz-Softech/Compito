<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Profile;
use App\Models\Service;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    /**
     * Display a listing of bookings
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $profile = Profile::where('id', $user->id)->first();
            
            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }
            
            $query = Booking::with(['customer', 'worker', 'service']);
            
            // Filter based on user type
            if ($profile->user_type === 'customer') {
                $query->where('customer_id', $profile->id);
            } elseif ($profile->user_type === 'worker') {
                $query->where('worker_id', $profile->id);
            }
            // Admin can see all bookings
            
            $bookings = $query->orderBy('created_at', 'desc')->paginate(15);
            
            return response()->json($bookings);
        } catch (\Exception $e) {
            Log::error('Error fetching bookings: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch bookings'], 500);
        }
    }
    
    /**
     * Store a newly created booking
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            $profile = Profile::where('id', $user->id)->first();
            
            if (!$profile || $profile->user_type !== 'customer') {
                return response()->json(['error' => 'Only customers can create bookings'], 403);
            }
            
            $validated = $request->validate([
                'worker_id' => 'required|uuid|exists:worker_profiles,id',
                'service_id' => 'required|uuid|exists:services,id',
                'scheduled_date' => 'required|date',
                'address' => 'required|string',
                'notes' => 'nullable|string',
                'total_amount' => 'required|numeric|min:0',
            ]);
            
            $booking = Booking::create([
                'customer_id' => $profile->id,
                'worker_id' => $validated['worker_id'],
                'service_id' => $validated['service_id'],
                'scheduled_date' => $validated['scheduled_date'],
                'address' => $validated['address'],
                'notes' => $validated['notes'],
                'total_amount' => $validated['total_amount'],
                'status' => 'pending',
            ]);
            
            // Notify all admins about new booking (from SQL logic)
            $this->notifyNewBooking($booking);
            
            return response()->json($booking->load(['customer', 'worker', 'service']), 201);
        } catch (\Exception $e) {
            Log::error('Error creating booking: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create booking'], 500);
        }
    }
    
    /**
     * Display the specified booking
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            $profile = Profile::where('id', $user->id)->first();
            
            $booking = Booking::with(['customer', 'worker', 'service'])->findOrFail($id);
            
            // Check if user can view this booking
            if ($profile->user_type !== 'admin' && 
                $booking->customer_id !== $profile->id && 
                $booking->worker_id !== $profile->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            return response()->json($booking);
        } catch (\Exception $e) {
            Log::error('Error fetching booking: ' . $e->getMessage());
            return response()->json(['error' => 'Booking not found'], 404);
        }
    }
    
    /**
     * Update the specified booking
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $profile = Profile::where('id', $user->id)->first();
            
            $booking = Booking::findOrFail($id);
            
            // Check if user can update this booking
            if ($profile->user_type !== 'admin' && 
                $booking->customer_id !== $profile->id && 
                $booking->worker_id !== $profile->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            $oldStatus = $booking->status;
            
            $validated = $request->validate([
                'status' => 'nullable|string|in:pending,confirmed,in_progress,worker_completed,completed,cancelled',
                'scheduled_date' => 'nullable|date',
                'address' => 'nullable|string',
                'notes' => 'nullable|string',
                'total_amount' => 'nullable|numeric|min:0',
            ]);
            
            $booking->update($validated);
            
            // Notify about status changes (from SQL logic)
            if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
                $this->notifyBookingStatusChanged($booking, $oldStatus, $validated['status']);
            }
            
            return response()->json($booking->load(['customer', 'worker', 'service']));
        } catch (\Exception $e) {
            Log::error('Error updating booking: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update booking'], 500);
        }
    }
    
    /**
     * Remove the specified booking
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $profile = Profile::where('id', $user->id)->first();
            
            $booking = Booking::findOrFail($id);
            
            // Only admin or customer can delete booking
            if ($profile->user_type !== 'admin' && $booking->customer_id !== $profile->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            $booking->delete();
            
            return response()->json(['message' => 'Booking deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting booking: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete booking'], 500);
        }
    }
    
    /**
     * Notify all admins about new booking (from SQL logic)
     */
    private function notifyNewBooking(Booking $booking)
    {
        try {
            // Get customer and worker names
            $customer = Profile::find($booking->customer_id);
            $worker = Profile::find($booking->worker_id);
            $service = Service::find($booking->service_id);
            
            $customerName = $customer ? $customer->first_name . ' ' . $customer->last_name : 'Unknown User';
            $workerName = $worker ? $worker->first_name . ' ' . $worker->last_name : 'Unknown User';
            $serviceTitle = $service ? $service->title : 'service';
            
            // Notify all admins about new booking
            $adminProfiles = Profile::where('user_type', 'admin')->get();
            
            foreach ($adminProfiles as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'new_booking',
                    'title' => 'New Booking Created',
                    'message' => $customerName . ' has booked ' . $workerName . ' for ' . $serviceTitle,
                    'related_id' => $booking->id,
                    'related_type' => 'booking',
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error notifying about new booking: ' . $e->getMessage());
        }
    }
    
    /**
     * Notify about booking status changes (from SQL logic)
     */
    private function notifyBookingStatusChanged(Booking $booking, string $oldStatus, string $newStatus)
    {
        try {
            // Only trigger on status changes
            if ($newStatus === $oldStatus) return;
            
            // Get names
            $customer = Profile::find($booking->customer_id);
            $worker = Profile::find($booking->worker_id);
            $service = Service::find($booking->service_id);
            
            $customerName = $customer ? $customer->first_name . ' ' . $customer->last_name : 'Unknown User';
            $workerName = $worker ? $worker->first_name . ' ' . $worker->last_name : 'Unknown User';
            $serviceTitle = $service ? $service->title : 'service';
            
            // Set status text
            $statusText = match($newStatus) {
                'confirmed' => 'confirmed',
                'in_progress' => 'started',
                'worker_completed' => 'marked as complete by worker',
                'completed' => 'completed',
                'cancelled' => 'cancelled',
                default => 'updated'
            };
            
            // Notify customer
            Notification::create([
                'user_id' => $booking->customer_id,
                'type' => 'booking_status_changed',
                'title' => 'Booking Update',
                'message' => 'Your booking with ' . $workerName . ' for ' . $serviceTitle . ' has been ' . $statusText,
                'related_id' => $booking->id,
                'related_type' => 'booking',
            ]);
            
            // Notify worker
            Notification::create([
                'user_id' => $booking->worker_id,
                'type' => 'booking_status_changed',
                'title' => 'Booking Update',
                'message' => 'Your booking with ' . $customerName . ' for ' . $serviceTitle . ' has been ' . $statusText,
                'related_id' => $booking->id,
                'related_type' => 'booking',
            ]);
        } catch (\Exception $e) {
            Log::error('Error notifying about booking status change: ' . $e->getMessage());
        }
    }
}
