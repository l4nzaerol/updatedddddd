<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\PasswordResetOtp;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    // Get user profile
    public function getProfile(Request $request)
    {
        $user = $request->user();
        $profile = $user->profile;
        
        return response()->json([
            'user' => $user,
            'profile' => $profile
        ]);
    }

    // Update user profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'bio' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update user basic info
        if ($request->has('name')) {
            $user->update(['name' => $request->name]);
        }
        if ($request->has('email')) {
            $user->update(['email' => $request->email]);
        }

        // Update or create profile
        $profileData = $request->only([
            'phone', 'address', 'city', 'state', 'zip_code', 
            'country', 'date_of_birth', 'gender', 'bio'
        ]);

        $profile = $user->profile;
        if ($profile) {
            $profile->update($profileData);
        } else {
            $profile = UserProfile::create(array_merge($profileData, ['user_id' => $user->id]));
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(),
            'profile' => $profile->fresh()
        ]);
    }

    // Send OTP for password reset
    public function sendPasswordResetOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = $request->email;
        $otpRecord = PasswordResetOtp::generateOtp($email);

        // Send OTP via email
        try {
            Mail::raw("Your password reset OTP is: {$otpRecord->otp_code}\n\nThis OTP will expire in 10 minutes.", function ($message) use ($email) {
                $message->to($email)
                        ->subject('Password Reset OTP - UNICK FURNITURE');
            });

            return response()->json([
                'message' => 'OTP sent successfully to your email',
                'expires_in' => 600 // 10 minutes in seconds
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send OTP. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Verify OTP and reset password
    public function resetPasswordWithOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|size:6',
            'new_password' => 'required|string|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $otpRecord = PasswordResetOtp::where('email', $request->email)
            ->where('otp_code', $request->otp)
            ->first();

        if (!$otpRecord || !$otpRecord->isValid()) {
            return response()->json([
                'message' => 'Invalid or expired OTP'
            ], 400);
        }

        // Update password
        $user = User::where('email', $request->email)->first();
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        // Mark OTP as used
        $otpRecord->markAsUsed();

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }

    // Change password (for authenticated users)
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 400);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }
}
