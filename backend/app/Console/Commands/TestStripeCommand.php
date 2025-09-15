<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\Stripe;
use Stripe\Customer;
use Stripe\PaymentIntent;
use Exception;

class TestStripeCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stripe:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Stripe configuration and connectivity';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Testing Stripe configuration...");
        
        // Set Stripe API key
        Stripe::setApiKey(config('services.stripe.secret'));
        
        try {
            // Test 1: Check API key validity by retrieving account info
            $this->info("1. Testing API key validity...");
            $account = \Stripe\Account::retrieve();
            $this->info("✅ API key is valid");
            $this->info("   Account ID: " . $account->id);
            $this->info("   Country: " . $account->country);
            $this->info("   Currency: " . $account->default_currency);
            
            // Test 2: Test customer creation
            $this->info("\n2. Testing customer creation...");
            $customer = Customer::create([
                'email' => 'test@example.com',
                'name' => 'Test Customer',
                'description' => 'Test customer for Stripe integration'
            ]);
            $this->info("✅ Customer created successfully");
            $this->info("   Customer ID: " . $customer->id);
            
            // Test 3: Test payment intent creation
            $this->info("\n3. Testing payment intent creation...");
            $paymentIntent = PaymentIntent::create([
                'amount' => 2000, // $20.00
                'currency' => 'usd',
                'customer' => $customer->id,
                'description' => 'Test payment intent'
            ]);
            $this->info("✅ Payment intent created successfully");
            $this->info("   Payment Intent ID: " . $paymentIntent->id);
            $this->info("   Status: " . $paymentIntent->status);
            
            // Clean up test data
            $this->info("\n4. Cleaning up test data...");
            $customer->delete();
            $this->info("✅ Test customer deleted");
            
            $this->info("\n🎉 All Stripe tests passed! Your Stripe integration is working correctly.");
            
        } catch (Exception $e) {
            $this->error("❌ Stripe test failed: " . $e->getMessage());
            $this->error("Please check your Stripe configuration and API key.");
            return 1;
        }
        
        return 0;
    }
}
