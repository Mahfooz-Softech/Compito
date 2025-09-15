<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Profile;
use Illuminate\Support\Facades\Log;

class ExportController extends Controller
{
    /**
     * Export payments (equivalent to export-payments function)
     */
    public function exportPayments(Request $request)
    {
        try {
            // Check if user is authenticated and is admin
            $user = auth()->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Check if user is admin
            $profile = Profile::where('id', $user->id)->first();
            if (!$profile || $profile->user_type !== 'admin') {
                return response()->json(['error' => 'Admin access required'], 403);
            }

            // Get query parameters for filtering
            $format = $request->query('format', 'csv');
            $startDate = $request->query('startDate');
            $endDate = $request->query('endDate');
            $status = $request->query('status');

            // Build query
            $query = Payment::with([
                'customer:id,first_name,last_name',
                'worker.profile:id,first_name,last_name',
                'booking.service:id,title'
            ])->orderBy('created_at', 'desc');

            // Apply filters
            if ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->where('created_at', '<=', $endDate);
            }
            if ($status && $status !== 'all') {
                $query->where('payment_status', $status);
            }

            $payments = $query->get();

            if ($format === 'csv') {
                // Generate CSV
                $csvHeaders = [
                    'Transaction ID',
                    'Date',
                    'Customer',
                    'Worker', 
                    'Service',
                    'Total Amount',
                    'Commission Amount',
                    'Worker Payout',
                    'Commission Rate',
                    'Status',
                    'Payment Method'
                ];

                $csvRows = $payments->map(function ($payment) {
                    return [
                        $payment->transaction_id ?: "TXN-" . substr($payment->id, 0, 8),
                        $payment->created_at->format('Y-m-d'),
                        $payment->customer ? 
                            "{$payment->customer->first_name} {$payment->customer->last_name}" : 
                            'Unknown Customer',
                        $payment->worker && $payment->worker->profile ? 
                            "{$payment->worker->profile->first_name} {$payment->worker->profile->last_name}" : 
                            'Unknown Worker',
                        $payment->booking && $payment->booking->service ? 
                            $payment->booking->service->title : 
                            'Unknown Service',
                        $payment->total_amount,
                        $payment->commission_amount,
                        $payment->worker_payout,
                        number_format($payment->commission_rate * 100, 1) . '%',
                        $payment->payment_status,
                        $payment->payment_method ?: 'N/A'
                    ];
                });

                $csv = collect([$csvHeaders])->merge($csvRows)
                    ->map(function ($row) {
                        return collect($row)->map(function ($cell) {
                            return '"' . str_replace('"', '""', $cell) . '"';
                        })->join(',');
                    })->join("\n");

                $fileName = 'payments_export_' . now()->format('Y-m-d') . '.csv';

                return response($csv, 200, [
                    'Content-Type' => 'text/csv',
                    'Content-Disposition' => "attachment; filename=\"{$fileName}\""
                ]);
            } else {
                // Return JSON
                return response()->json(['data' => $payments], 200);
            }

        } catch (\Exception $error) {
            Log::error('Error in export-payments function:', ['error' => $error->getMessage()]);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
