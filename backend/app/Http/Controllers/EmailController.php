<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\EmailService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EmailController extends Controller
{
    protected $emailService;
    
    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }
    
    /**
     * Send welcome email (equivalent to frontend send-email function)
     */
    public function sendWelcomeEmail(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'subject' => 'required|string',
                'message' => 'required|string',
                'type' => 'required|string|in:signup,welcome',
                'user_name' => 'nullable|string',
                'user_type' => 'nullable|string|in:customer,worker,admin',
                'dashboard_url' => 'nullable|url'
            ]);
            
            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }
            
            $email = $request->email;
            $userName = $request->user_name ?? 'User';
            $userType = $request->user_type ?? 'customer';
            $dashboardUrl = $request->dashboard_url;
            
            $success = $this->emailService->sendWelcomeEmail($email, $userName, $userType, $dashboardUrl);
            
            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Welcome email sent successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send welcome email'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error in sendWelcomeEmail controller', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Send email confirmation
     */
    public function sendEmailConfirmation(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'confirmation_url' => 'required|url'
            ]);
            
            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }
            
            $email = $request->email;
            $confirmationUrl = $request->confirmation_url;
            
            $success = $this->emailService->sendEmailConfirmation($email, $confirmationUrl);
            
            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Email confirmation sent successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send email confirmation'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error in sendEmailConfirmation controller', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Send notification email
     */
    public function sendNotificationEmail(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'subject' => 'required|string',
                'message' => 'required|string',
                'type' => 'nullable|string'
            ]);
            
            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }
            
            $email = $request->email;
            $subject = $request->subject;
            $message = $request->message;
            $type = $request->type ?? 'notification';
            
            $success = $this->emailService->sendNotificationEmail($email, $subject, $message, $type);
            
            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Notification email sent successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send notification email'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error in sendNotificationEmail controller', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Test email configuration
     */
    public function testEmailConfiguration(Request $request)
    {
        try {
            $testEmail = $request->email ?? 'test@example.com';
            
            $success = $this->emailService->sendNotificationEmail(
                $testEmail,
                'Test Email - Compito',
                'This is a test email to verify SMTP configuration.',
                'test'
            );
            
            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Test email sent successfully. Check your inbox.'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send test email. Check SMTP configuration.'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error in testEmailConfiguration', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'SMTP configuration error: ' . $e->getMessage()
            ], 500);
        }
    }
}
