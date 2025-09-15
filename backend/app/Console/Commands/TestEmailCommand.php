<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\EmailService;

class TestEmailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email') ?? 'test@example.com';
        
        $this->info("Testing email configuration...");
        $this->info("Sending test email to: {$email}");
        
        $emailService = new EmailService();
        
        $success = $emailService->sendNotificationEmail(
            $email,
            'Test Email - Compito',
            'This is a test email to verify SMTP configuration.',
            'test'
        );
        
        if ($success) {
            $this->info("✅ Test email sent successfully!");
            $this->info("Check your inbox for the test email.");
        } else {
            $this->error("❌ Failed to send test email.");
            $this->error("Please check your SMTP configuration in .env file.");
        }
    }
}
