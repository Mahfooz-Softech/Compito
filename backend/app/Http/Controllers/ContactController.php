<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    /**
     * Get contact information
     */
    public function index()
    {
        try {
            $contact = Contact::first();
            
            if (!$contact) {
                return response()->json([
                    'error' => 'Contact information not found'
                ], 404);
            }

            return response()->json($contact);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch contact information',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create contact information
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'phone' => 'required|string',
                'address' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            // Check if contact already exists
            $existingContact = Contact::first();
            if ($existingContact) {
                return response()->json([
                    'error' => 'Contact information already exists'
                ], 409);
            }

            $contact = Contact::create([
                'id' => Str::uuid(),
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
            ]);

            return response()->json($contact, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create contact information',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update contact information
     */
    public function update(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'phone' => 'required|string',
                'address' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $contact = Contact::first();
            
            if (!$contact) {
                return response()->json([
                    'error' => 'Contact information not found'
                ], 404);
            }

            $contact->update([
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
            ]);

            return response()->json($contact);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update contact information',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}








