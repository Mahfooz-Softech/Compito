<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Profile;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class InvoiceController extends Controller
{
    /**
     * Generate invoice PDF (equivalent to generate-invoice-pdf function)
     */
    public function generateInvoicePdf(Request $request)
    {
        try {
            // Check if user is authenticated
            $user = auth()->user();
            if (!$user) {
                return response()->json(['error' => 'Authorization header is required'], 401);
            }

            $paymentId = $request->input('payment_id');
            
            if (!$paymentId) {
                return response()->json(['error' => 'Payment ID is required'], 400);
            }

            Log::info('Fetching payment details for:', ['payment_id' => $paymentId]);

            // Fetch payment details with relationships
            $payment = Payment::with([
                'booking.service.category',
                'booking.worker.profile',
                'customer'
            ])->findOrFail($paymentId);

            Log::info('Payment found, generating PDF');

            // Prepare data for PDF
            $data = [
                'payment' => $payment,
                'customerName' => $payment->customer ? 
                    "{$payment->customer->first_name} {$payment->customer->last_name}" : 
                    'Unknown Customer',
                'customerPhone' => $payment->customer->phone ?? null,
                'workerName' => $payment->booking && $payment->booking->worker && $payment->booking->worker->profile ? 
                    "{$payment->booking->worker->profile->first_name} {$payment->booking->worker->profile->last_name}" : 
                    'Unknown Worker',
                'workerPhone' => $payment->booking && $payment->booking->worker && $payment->booking->worker->profile ? 
                    $payment->booking->worker->profile->phone : null,
                'serviceTitle' => $payment->booking && $payment->booking->service ? 
                    $payment->booking->service->title : 
                    'Unknown Service',
                'categoryName' => $payment->booking && $payment->booking->service && $payment->booking->service->category ? 
                    $payment->booking->service->category->name : 
                    'N/A',
                'serviceAmount' => $payment->total_amount - $payment->commission_amount,
                'invoiceNumber' => strtoupper(substr($payment->id, 0, 8)),
                'invoiceDate' => $payment->created_at->format('Y-m-d'),
                'serviceDate' => $payment->booking ? $payment->booking->scheduled_date->format('Y-m-d') : 'N/A',
                'serviceAddress' => $payment->booking->address ?? 'N/A',
                'notes' => $payment->booking->notes ?? null
            ];

            // Generate PDF
            $pdf = Pdf::loadView('invoice', $data);
            
            Log::info('PDF generated successfully');
            
            $fileName = "invoice-{$data['invoiceNumber']}.pdf";
            
            return $pdf->download($fileName);

        } catch (\Exception $error) {
            Log::error('Error generating invoice:', ['error' => $error->getMessage()]);
            return response()->json([
                'error' => 'Internal server error', 
                'details' => $error->getMessage()
            ], 500);
        }
    }
}
