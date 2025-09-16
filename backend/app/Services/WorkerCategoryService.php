<?php

namespace App\Services;

use App\Models\WorkerCategory;
use App\Models\WorkerProfile;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;

class WorkerCategoryService
{
    /**
     * Determine and apply the best category for a worker. Returns category_id or null.
     */
    public function assignBestCategory(string $workerId): ?string
    {
        try {
            $workerProfile = WorkerProfile::where('id', $workerId)->first();
            if (!$workerProfile) {
                return null;
            }

            $categories = WorkerCategory::orderByDesc('min_rating')
                ->orderByDesc('min_experience')
                ->orderByDesc('min_customers')
                ->get();

            if ($categories->isEmpty()) {
                return $workerProfile->category_id;
            }

            $rating = (float) ($workerProfile->rating ?? 0);
            $experience = (int) ($workerProfile->experience_years ?? 0);
            $uniqueCustomers = Booking::where('worker_id', $workerId)
                ->whereIn('status', ['completed', 'worker_completed'])
                ->distinct('customer_id')
                ->count('customer_id');

            $eligible = $categories->filter(function ($cat) use ($rating, $experience, $uniqueCustomers) {
                $minRating = (float) ($cat->min_rating ?? 0);
                $minExp = (int) ($cat->min_experience ?? 0);
                $minCust = (int) ($cat->min_customers ?? 0);
                return $rating >= $minRating && $experience >= $minExp && $uniqueCustomers >= $minCust;
            })->values();

            if ($eligible->isEmpty()) {
                return $workerProfile->category_id;
            }

            $chosen = $eligible->first();
            if ($workerProfile->category_id !== $chosen->id) {
                $workerProfile->category_id = $chosen->id;
                $workerProfile->save();
            }
            return $chosen->id;
        } catch (\Throwable $e) {
            Log::warning('Assign worker category failed: ' . $e->getMessage());
            return null;
        }
    }
}
