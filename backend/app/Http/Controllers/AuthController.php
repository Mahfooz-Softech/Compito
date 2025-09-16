<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Models\AuthUser;
use App\Models\Profile;
use App\Services\EmailService;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

class AuthController extends Controller
{
    protected $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|unique:auth_users,email',
                'password' => 'required|min:8',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'user_type' => 'required|in:customer,worker,admin',
                'phone' => 'nullable|string|max:20',
                'location' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:255',
                'postcode' => 'nullable|string|max:20',
                'postcode_p1' => 'nullable|string|max:10',
                'postcode_p2' => 'nullable|string|max:10',
                'postcode_p3' => 'nullable|string|max:10',
                'country' => 'nullable|string|max:100',
                'longitude' => 'nullable|numeric',
                'latitude' => 'nullable|numeric',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }

            // Create auth user
            $authUser = AuthUser::create([
                'id' => Str::uuid(),
                'email' => $request->email,
                'encrypted_password' => Hash::make($request->password),
                'email_confirmed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create profile
            $profile = Profile::create([
                'id' => $authUser->id,
                'user_type' => $request->user_type,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone' => $request->phone,
                'location' => $request->location,
                'city' => $request->city,
                'postcode' => $request->postcode,
                'postcode_p1' => $request->postcode_p1,
                'postcode_p2' => $request->postcode_p2,
                'postcode_p3' => $request->postcode_p3,
                'country' => $request->country ?? 'UK',
                'longitude' => $request->longitude,
                'latitude' => $request->latitude,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create token
            $token = $authUser->createToken('auth-token')->plainTextToken;

            // Send welcome email (optional - don't fail registration if email fails)
            try {
                $this->emailService->sendWelcomeEmail(
                    $request->email,
                    $request->first_name . ' ' . $request->last_name,
                    $request->user_type
                );
            } catch (\Exception $e) {
                // Log email error but don't fail registration
                \Log::error('Welcome email failed: ' . $e->getMessage());
            }

            return response()->json([
                'user' => $authUser,
                'profile' => $profile,
                'token' => $token,
                'message' => 'User registered successfully'
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Registration error: ' . $e->getMessage());
            return response()->json(['error' => 'Registration failed'], 500);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }

            $authUser = AuthUser::where('email', $request->email)->first();

            if (!$authUser || !Hash::check($request->password, $authUser->encrypted_password)) {
                return response()->json(['error' => 'Invalid credentials'], 401);
            }

            // Get profile
            $profile = Profile::where('id', $authUser->id)->first();

            if (!$profile) {
                return response()->json(['error' => 'User profile not found'], 404);
            }

            // Create token
            $token = $authUser->createToken('auth-token')->plainTextToken;

            return response()->json([
                'user' => $authUser,
                'profile' => $profile,
                'token' => $token,
                'message' => 'Login successful'
            ]);

        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());
            return response()->json(['error' => 'Login failed'], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json(['message' => 'Logout successful']);
        } catch (\Exception $e) {
            \Log::error('Logout error: ' . $e->getMessage());
            return response()->json(['error' => 'Logout failed'], 500);
        }
    }

    /**
     * Get user profile
     */
    public function profile(Request $request)
    {
        try {
            $user = $request->user();
            $profile = Profile::where('id', $user->id)->first();

            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            return response()->json([
                'user' => $user,
                'profile' => $profile
            ]);
        } catch (\Exception $e) {
            \Log::error('Profile fetch error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch profile'], 500);
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();
            $profile = Profile::where('id', $user->id)->first();

            if (!$profile) {
                return response()->json(['error' => 'Profile not found'], 404);
            }

            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'phone' => 'nullable|string|max:20',
                'location' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:255',
                'postcode' => 'nullable|string|max:20',
                'postcode_p1' => 'nullable|string|max:10',
                'postcode_p2' => 'nullable|string|max:10',
                'postcode_p3' => 'nullable|string|max:10',
                'country' => 'nullable|string|max:100',
                'longitude' => 'nullable|numeric',
                'latitude' => 'nullable|numeric',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => $validator->errors()], 400);
            }

            $profile->update($request->only([
                'first_name', 'last_name', 'phone', 'location', 'city',
                'postcode', 'postcode_p1', 'postcode_p2', 'postcode_p3',
                'country', 'longitude', 'latitude'
            ]));

            return response()->json([
                'profile' => $profile,
                'message' => 'Profile updated successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Profile update error: ' . $e->getMessage());
            return response()->json(['error' => 'Profile update failed'], 500);
        }
    }

    /**
     * Forgot password: issue reset token and send email
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $email = $request->input('email');

        try {
            $user = AuthUser::where('email', $email)->first();
            if (!$user) {
                // Do not reveal if user exists
                return response()->json(['message' => 'If the email exists, a reset link has been sent.']);
            }

            $token = Str::random(64);
            DB::table('password_resets')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => Hash::make($token),
                    'created_at' => now(),
                ]
            );

            $frontendBase = config('app.frontend_url');
            $resetUrl = rtrim($frontendBase, '/') . '/reset-password?token=' . $token . '&email=' . urlencode($email);
            try {
                // Render and send a branded password reset email view
                \Mail::send('emails.password-reset', ['resetUrl' => $resetUrl], function($m) use ($email) {
                    $m->to($email)->subject('Reset Your Password - Compito');
                    $logoPath = public_path('compito.png');
                    if (file_exists($logoPath)) {
                        $m->getSymfonyMessage()->embed($logoPath, 'compito_logo');
                    }
                });
            } catch (\Throwable $e) {
                \Log::error('Failed to send reset email: ' . $e->getMessage());
            }

            return response()->json(['message' => 'If the email exists, a reset link has been sent.']);
        } catch (\Throwable $e) {
            // Log and still return generic success to avoid user enumeration
            \Log::error('Forgot password failure: ' . $e->getMessage());
            return response()->json(['message' => 'If the email exists, a reset link has been sent.']);
        }
    }

    /**
     * Reset password: validate token and update password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|min:8|confirmed',
        ]);

        $email = $request->input('email');
        $tokenPlain = $request->input('token');
        $password = $request->input('password');

        $record = DB::table('password_resets')->where('email', $email)->first();
        if (!$record || !Hash::check($tokenPlain, $record->token)) {
            return response()->json(['error' => 'Invalid or expired token'], 400);
        }

        // Optional: check token age (e.g., 60 minutes)
        if (isset($record->created_at) && now()->diffInMinutes(\Carbon\Carbon::parse($record->created_at)) > 60) {
            return response()->json(['error' => 'Token expired'], 400);
        }

        $user = AuthUser::where('email', $email)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->encrypted_password = Hash::make($password);
        $user->save();

        // Cleanup token
        DB::table('password_resets')->where('email', $email)->delete();

        return response()->json(['message' => 'Password has been reset successfully']);
    }
}
