<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleMapsService
{
    private $apiKey;
    private $baseUrl = 'https://places.googleapis.com/v1/places:searchText';

    public function __construct()
    {
        $this->apiKey = config('services.google_maps.api_key');
    }

    /**
     * Get coordinates for a postcode using Google Places API
     */
    public function getPostcodeCoordinates(string $postcode): ?array
    {
        try {
            $cleanPostcode = preg_replace('/\s+/', '', $postcode);
            
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-Goog-FieldMask' => 'places.displayName,places.location,places.types'
            ])->post($this->baseUrl . '?key=' . $this->apiKey, [
                'textQuery' => $cleanPostcode,
                'locationBias' => [
                    'circle' => [
                        'center' => [
                            'latitude' => 51.5074, // London center
                            'longitude' => -0.1278
                        ],
                        'radius' => 500000.0 // 500km radius for UK coverage
                    ]
                ],
                'languageCode' => 'en',
                'regionCode' => 'GB'
            ]);

            if (!$response->successful()) {
                Log::error('Google Places API error: ' . $response->status() . ' ' . $response->body());
                return null;
            }

            $data = $response->json();
            
            if (isset($data['places']) && count($data['places']) > 0) {
                $place = $data['places'][0];
                if (isset($place['location']['latitude']) && isset($place['location']['longitude'])) {
                    return [
                        'lat' => $place['location']['latitude'],
                        'lon' => $place['location']['longitude']
                    ];
                }
            }
            
            return null;
        } catch (\Exception $e) {
            Log::error('Error getting postcode coordinates: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $R = 3959; // Earth's radius in miles
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) + 
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * 
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $R * $c; // Distance in miles
    }
}






