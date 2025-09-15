<?php

namespace App\Services;

use App\Mail\WelcomeEmail;
use App\Mail\EmailConfirmation;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailService
{
    /**
     * Send welcome email to new user
     */
    public function sendWelcomeEmail($email, $userName, $userType, $dashboardUrl = null)
    {
        try {
            Mail::to($email)->send(new WelcomeEmail($userName, $userType, $dashboardUrl));
            
            Log::info('Welcome email sent successfully', [
                'email' => $email,
                'user_name' => $userName,
                'user_type' => $userType
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send welcome email', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
    
    /**
     * Send email confirmation
     */
    public function sendEmailConfirmation($email, $confirmationUrl)
    {
        try {
            Mail::to($email)->send(new EmailConfirmation($confirmationUrl));
            
            Log::info('Email confirmation sent successfully', [
                'email' => $email
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send email confirmation', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
    
    /**
     * Send notification email (for various notifications)
     */
    public function sendNotificationEmail($email, $subject, $message, $type = 'notification')
    {
        try {
            // Create a simple notification email
            Mail::raw($message, function ($mail) use ($email, $subject) {
                $mail->to($email)
                     ->subject($subject);
            });
            
            Log::info('Notification email sent successfully', [
                'email' => $email,
                'type' => $type
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send notification email', [
                'email' => $email,
                'type' => $type,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
    
    /**
     * Send booking confirmation email
     */
    public function sendBookingConfirmation($email, $bookingDetails)
    {
        try {
            $subject = 'Booking Confirmed - Compito';
            $message = "Your booking has been confirmed!\n\n";
            $message .= "Service: " . $bookingDetails['service_title'] . "\n";
            $message .= "Worker: " . $bookingDetails['worker_name'] . "\n";
            $message .= "Date: " . $bookingDetails['scheduled_date'] . "\n";
            $message .= "Amount: $" . $bookingDetails['total_amount'] . "\n\n";
            $message .= "Thank you for using Compito!";
            
            return $this->sendNotificationEmail($email, $subject, $message, 'booking_confirmation');
        } catch (\Exception $e) {
            Log::error('Failed to send booking confirmation email', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
    
    /**
     * Send offer notification email
     */
    public function sendOfferNotification($email, $offerDetails)
    {
        try {
            $subject = 'New Offer Received - Compito';
            $message = "You have received a new offer!\n\n";
            $message .= "Service: " . $offerDetails['service_title'] . "\n";
            $message .= "Worker: " . $offerDetails['worker_name'] . "\n";
            $message .= "Price: $" . $offerDetails['price'] . "\n";
            $message .= "Description: " . $offerDetails['description'] . "\n\n";
            $message .= "Please log in to view and respond to this offer.";
            
            return $this->sendNotificationEmail($email, $subject, $message, 'offer_notification');
        } catch (\Exception $e) {
            Log::error('Failed to send offer notification email', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
}






