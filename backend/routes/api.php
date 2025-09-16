<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\WorkerController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ServiceRequestController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReviewController; // ADDED

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// TEMP debug endpoints (no auth) for testing worker status flows
Route::get('/debug/worker-status/{workerId}', [AdminController::class, 'debugGetWorkerStatus']);
Route::post('/debug/force-deactivate/{workerId}', [AdminController::class, 'debugForceDeactivate']);

// Authentication routes (public)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Contact routes (public)
Route::get('/contact', [ContactController::class, 'index']);
Route::post('/contact', [ContactController::class, 'store']);
Route::put('/contact', [ContactController::class, 'update']);

// Public routes (no authentication required)
Route::get('/public/services', [PublicController::class, 'getServices']);
Route::get('/public/categories', [PublicController::class, 'getCategories']);
Route::get('/public/profiles', [PublicController::class, 'getProfiles']);
Route::get('/public/reviews', [PublicController::class, 'getReviews']);
Route::get('/public/worker-profiles', [PublicController::class, 'getWorkerProfiles']);
Route::get('/public/data', [PublicController::class, 'getPublicData']);
// Customer browse needs to search workers without auth
Route::post('/worker-location-search', [WorkerController::class, 'searchWorkersByLocation']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Admin routes
    Route::get('/admin/data', [AdminController::class, 'getAdminData']);
    Route::get('/admin/bookings', [AdminController::class, 'getAdminBookings']);
    Route::get('/admin/services', [AdminController::class, 'getAdminServices']);
    Route::get('/admin/categories', [AdminController::class, 'getAdminCategories']);
    Route::post('/admin/categories', [AdminController::class, 'createAdminCategory']);
    Route::put('/admin/categories/{id}', [AdminController::class, 'updateAdminCategory']);
    Route::delete('/admin/categories/{id}', [AdminController::class, 'deleteAdminCategory']);
    Route::put('/admin/commission', [AdminController::class, 'updateGlobalCommission']);
    Route::get('/admin/sub-admins', [AdminController::class, 'listSubAdmins']);
    Route::post('/admin/sub-admins', [AdminController::class, 'createSubAdmin']);
    // Worker categories CRUD
    Route::get('/admin/worker-categories', [AdminController::class, 'getWorkerCategories']);
    Route::post('/admin/worker-categories', [AdminController::class, 'createWorkerCategory']);
    Route::put('/admin/worker-categories/{id}', [AdminController::class, 'updateWorkerCategory']);
    Route::delete('/admin/worker-categories/{id}', [AdminController::class, 'deleteWorkerCategory']);
    // Worker category auto-assignment
    Route::post('/admin/workers/{workerId}/assign-category', [AdminController::class, 'assignWorkerCategory']);
    Route::post('/admin/worker-categories/assign-all', [AdminController::class, 'assignAllWorkersCategories']);
    Route::get('/admin/payments', [AdminController::class, 'getAdminPayments']);
    Route::post('/admin/users', [AdminController::class, 'createUser']);
    Route::post('/admin/workers/{workerId}/verify', [AdminController::class, 'verifyWorker']);
    Route::post('/admin/workers/{workerId}/reject', [AdminController::class, 'rejectWorker']);
    Route::put('/admin/workers/{workerId}/commission', [AdminController::class, 'updateWorkerCommission']);
    Route::post('/admin/workers-pagination', [AdminController::class, 'getWorkersPagination']);
    Route::delete('/admin/services/{serviceId}', [AdminController::class, 'deleteService']);

    // Admin Reviews
    Route::get('/admin/reviews', [ReviewController::class, 'adminIndex']);
    Route::get('/admin/reviews/{id}', [ReviewController::class, 'show']);
    Route::delete('/admin/reviews/{id}', [ReviewController::class, 'destroy']);

    // Worker Account Management routes
    Route::get('/admin/worker-accounts', [AdminController::class, 'getWorkerAccounts']);
    Route::post('/admin/worker-accounts/deactivate', [AdminController::class, 'deactivateWorkerAccount']);
    Route::post('/admin/worker-accounts/reactivate', [AdminController::class, 'reactivateWorkerAccount']);
    Route::post('/admin/worker-accounts/periodic-check', [AdminController::class, 'runPeriodicDeactivationCheck']);
    // Debug helpers (temporarily exposed while testing)
    Route::get('/admin/debug/worker-status/{workerId}', [AdminController::class, 'debugGetWorkerStatus']);
    Route::post('/admin/debug/force-deactivate/{workerId}', [AdminController::class, 'debugForceDeactivate']);
    // Reactivation requests
    Route::get('/account-activation-requests', [AdminController::class, 'getAccountActivationRequests']);
    Route::post('/account-activation-requests', [AdminController::class, 'createAccountActivationRequest']);
    Route::put('/account-activation-requests/{id}', [AdminController::class, 'updateAccountActivationRequest']);

    // Worker account status routes
    Route::get('/worker-account-status/{workerId}', [AdminController::class, 'getWorkerAccountStatus']);

    // Account activation request routes
    Route::get('/account-activation-requests', [AdminController::class, 'getAccountActivationRequests']);
    Route::post('/account-activation-requests', [AdminController::class, 'createAccountActivationRequest']);
    Route::put('/account-activation-requests/{id}', [AdminController::class, 'updateAccountActivationRequest']);
    // Admin-prefixed aliases for frontend compatibility
    Route::get('/admin/account-activation-requests', [AdminController::class, 'getAccountActivationRequests']);
    Route::put('/admin/account-activation-requests/{id}', [AdminController::class, 'updateAccountActivationRequest']);

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Messaging routes
    Route::get('/messages', [\App\Http\Controllers\MessageController::class, 'index']);
    Route::get('/messages/conversations', [\App\Http\Controllers\MessageController::class, 'getConversations']);
    Route::post('/messages', [\App\Http\Controllers\MessageController::class, 'store']);
    Route::get('/messages/unread-count', [\App\Http\Controllers\MessageController::class, 'getUnreadCount']);
    Route::put('/messages/{id}/read', [\App\Http\Controllers\MessageController::class, 'markAsRead']);
    Route::put('/messages/mark-read-batch', [\App\Http\Controllers\MessageController::class, 'markReadBatch']);
    Route::get('/messages/conversation/{userId}', [\App\Http\Controllers\MessageController::class, 'getConversation']);
    Route::delete('/messages/{id}', [\App\Http\Controllers\MessageController::class, 'destroy']);

    // Blocked conversations
    Route::get('/blocked-conversations', [\App\Http\Controllers\BlockedConversationController::class, 'index']);
    Route::post('/blocked-conversations', [\App\Http\Controllers\BlockedConversationController::class, 'store']);
    Route::delete('/blocked-conversations/{workerId}', [\App\Http\Controllers\BlockedConversationController::class, 'destroy']);

    // Worker routes
    Route::get('/worker-data/{id}', [WorkerController::class, 'getWorkerData']);
    Route::get('/worker-analytics/{id}', [WorkerController::class, 'getWorkerAnalytics']);
    Route::get('/worker-earnings/{id}', [WorkerController::class, 'getWorkerEarnings']);
    Route::get('/worker-availability/{id}', [WorkerController::class, 'getWorkerAvailability']);
    Route::get('/worker-can-perform-action/{id}', [WorkerController::class, 'canWorkerPerformAction']);
    Route::get('/worker-unique-customers-count/{id}', [WorkerController::class, 'getWorkerUniqueCustomersCount']);
    Route::get('/worker-category-info/{id}', [WorkerController::class, 'getWorkerCategoryInfo']);
    Route::get('/worker-deactivation-criteria/{id}', [WorkerController::class, 'checkWorkerDeactivationCriteria']);
    Route::get('/worker-payment-summary', [AdminController::class, 'getWorkerPaymentSummary']);
    Route::get('/weekly-earnings/{id}', [WorkerController::class, 'getWeeklyEarnings']);
    // Worker services CRUD
    Route::get('/worker/services', [WorkerController::class, 'listWorkerServices']);
    Route::post('/worker/services', [WorkerController::class, 'createWorkerService']);
    Route::put('/worker/services/{serviceId}', [WorkerController::class, 'updateWorkerService']);
    Route::delete('/worker/services/{serviceId}', [WorkerController::class, 'deleteWorkerService']);
    // Worker service requests
    Route::get('/worker/service-requests', [WorkerController::class, 'listWorkerServiceRequests']);
    Route::put('/worker/service-requests/{id}/status', [WorkerController::class, 'updateServiceRequestStatus']);
    Route::post('/worker/offers', [WorkerController::class, 'createWorkerOffer']);
    // Worker profile
    Route::get('/worker/profile', [WorkerController::class, 'getWorkerProfile']);
    Route::put('/worker/profile', [WorkerController::class, 'updateWorkerProfile']);
    Route::post('/worker-search', [WorkerController::class, 'searchWorkers']);
    Route::post('/worker-location-search', [WorkerController::class, 'searchWorkersByLocation']);

    // Customer routes
    Route::get('/customer-data/{id}', [CustomerController::class, 'getCustomerData']);
    Route::post('/customer/book-service', [CustomerController::class, 'bookService']);
    Route::post('/customer/add-favorite', [CustomerController::class, 'addToFavorites']);
    Route::delete('/customer/remove-favorite/{serviceId}', [CustomerController::class, 'removeFromFavorites']);
    Route::post('/customer/send-message', [CustomerController::class, 'sendMessage']);
    Route::post('/customer/create-review', [CustomerController::class, 'createReview']);
    Route::put('/customer/update-profile', [CustomerController::class, 'updateProfile']);
    // Service request creation (customer → worker)
    Route::post('/customer/create-service-request', [CustomerController::class, 'createServiceRequest']);

    // Service Request routes (new comprehensive routes)
    Route::get('/service-requests/worker', [ServiceRequestController::class, 'getWorkerServiceRequests']);
    Route::post('/service-requests/offers', [ServiceRequestController::class, 'createOffer']);
    Route::put('/service-requests/{id}/decline', [ServiceRequestController::class, 'declineRequest']);
    Route::get('/service-requests/{id}/messages', [ServiceRequestController::class, 'getMessages']);
    Route::post('/service-requests/{id}/messages', [ServiceRequestController::class, 'sendMessage']);
    Route::get('/service-requests/{id}/offers', [ServiceRequestController::class, 'getOffers']);
    Route::put('/offers/{id}/accept', [ServiceRequestController::class, 'acceptOffer']);
    Route::put('/offers/{id}/reject', [ServiceRequestController::class, 'rejectOffer']);
    Route::get('/service-requests/{id}', [ServiceRequestController::class, 'getServiceRequestDetails']);

    // Customer offer routes
    Route::get('/customer/offers', [ServiceRequestController::class, 'getCustomerOffers']);
    Route::get('/customer/bookings', [ServiceRequestController::class, 'getCustomerBookings']);
    Route::get('/offers/{id}', [ServiceRequestController::class, 'getOfferById']);
    Route::put('/customer/bookings/{id}/approve', [ServiceRequestController::class, 'approveWorkCompletion']);
    Route::post('/customer/bookings/{id}/review', [ServiceRequestController::class, 'submitCustomerReview']);

    // Worker routes
    Route::get('/worker/bookings', [ServiceRequestController::class, 'getWorkerBookings']);
    Route::put('/worker/bookings/{id}/complete', [ServiceRequestController::class, 'markBookingComplete']);
    Route::post('/worker/bookings/{id}/review', [ServiceRequestController::class, 'submitWorkerReview']);
    Route::get('/worker/reviews/{workerId}', [ServiceRequestController::class, 'getWorkerReviews']);

    // Payment routes
    Route::post('/payments/create-checkout', [CheckoutController::class, 'createCheckout']);
    Route::post('/payments/complete', [PaymentController::class, 'completePayment']);
    Route::post('/payments/cancel', [PaymentController::class, 'cancelPayment']);
    Route::post('/payments/fail', [PaymentController::class, 'failPayment']);
    Route::get('/payments/status', [PaymentController::class, 'getPaymentStatus']);

    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'getCustomerDashboardStats']);
    Route::get('/dashboard/charts', [DashboardController::class, 'getCustomerDashboardCharts']);
    Route::get('/dashboard/activity', [DashboardController::class, 'getCustomerRecentActivity']);
    Route::get('/dashboard/payments', [DashboardController::class, 'getCustomerPayments']);
    Route::get('/dashboard/reviews', [DashboardController::class, 'getCustomerReviews']);
});