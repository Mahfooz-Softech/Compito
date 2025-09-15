<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice</title>
    <style>
        body {
            font-family: 'Helvetica', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
        }
        
        .header {
            margin-bottom: 30px;
        }
        
        .invoice-title {
            font-size: 24px;
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-weight: bold;
        }
        
        .company-name {
            font-size: 12px;
            color: #6c757d;
            margin: 0;
        }
        
        .invoice-details {
            position: absolute;
            top: 20px;
            right: 20px;
            text-align: right;
            font-size: 10px;
        }
        
        .line-separator {
            border-top: 1px solid #2c3e50;
            margin: 20px 0;
        }
        
        .section-title {
            font-size: 14px;
            color: #2c3e50;
            margin: 20px 0 10px 0;
            font-weight: bold;
        }
        
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .bill-to, .service-provider {
            width: 45%;
        }
        
        .bill-to h3, .service-provider h3 {
            font-size: 14px;
            color: #2c3e50;
            margin: 0 0 10px 0;
        }
        
        .bill-to p, .service-provider p {
            font-size: 11px;
            margin: 5px 0;
            color: #000;
        }
        
        .service-table {
            width: 100%;
            margin-bottom: 20px;
        }
        
        .table-header {
            background-color: #f8f9fa;
            padding: 8px;
            font-size: 10px;
            font-weight: bold;
        }
        
        .table-content {
            padding: 8px;
            font-size: 10px;
        }
        
        .payment-breakdown {
            margin-top: 20px;
        }
        
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 11px;
        }
        
        .total-line {
            border-top: 1px solid #333;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: bold;
            font-size: 12px;
        }
        
        .payment-info {
            margin-top: 20px;
            font-size: 10px;
            color: #6c757d;
        }
        
        .footer {
            position: absolute;
            bottom: 20px;
            left: 20px;
            font-size: 9px;
            color: #808080;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1 class="invoice-title">INVOICE</h1>
        <p class="company-name">Professional Service Platform</p>
    </div>
    
    <!-- Invoice Details -->
    <div class="invoice-details">
        <p>Invoice #: {{ $invoiceNumber }}</p>
        <p>Date: {{ $invoiceDate }}</p>
    </div>
    
    <!-- Line Separator -->
    <div class="line-separator"></div>
    
    <!-- Customer and Service Provider Info -->
    <div class="info-section">
        <div class="bill-to">
            <h3>Bill To:</h3>
            <p>{{ $customerName }}</p>
            @if($customerPhone)
                <p>Phone: {{ $customerPhone }}</p>
            @endif
        </div>
        
        <div class="service-provider">
            <h3>Service Provider:</h3>
            <p>{{ $workerName }}</p>
            @if($workerPhone)
                <p>Phone: {{ $workerPhone }}</p>
            @endif
        </div>
    </div>
    
    <!-- Service Details -->
    <h3 class="section-title">Service Details</h3>
    
    <table class="service-table">
        <tr>
            <td class="table-header">Service</td>
            <td class="table-header">Category</td>
            <td class="table-header">Date</td>
            <td class="table-header">Status</td>
        </tr>
        <tr>
            <td class="table-content">{{ $serviceTitle }}</td>
            <td class="table-content">{{ $categoryName }}</td>
            <td class="table-content">{{ $serviceDate }}</td>
            <td class="table-content">{{ strtoupper($payment->payment_status) }}</td>
        </tr>
    </table>
    
    <!-- Payment Breakdown -->
    <h3 class="section-title">Payment Breakdown</h3>
    
    <div class="payment-breakdown">
        <div class="breakdown-item">
            <span>Service Amount:</span>
            <span>${{ number_format($serviceAmount, 2) }}</span>
        </div>
        
        <div class="breakdown-item">
            <span>Platform Fee:</span>
            <span>${{ number_format($payment->commission_amount, 2) }}</span>
        </div>
        
        <div class="breakdown-item total-line">
            <span>Total Amount:</span>
            <span>${{ number_format($payment->total_amount, 2) }}</span>
        </div>
    </div>
    
    <!-- Payment Information -->
    <div class="payment-info">
        <p>Payment Method: {{ $payment->payment_method ?: 'Credit Card' }}</p>
        <p>Transaction ID: {{ $payment->id }}</p>
        <p>Service Address: {{ $serviceAddress }}</p>
        @if($notes)
            <p>Notes: {{ Str::limit($notes, 60) }}...</p>
        @endif
    </div>
    
    <!-- Footer -->
    <div class="footer">
        <p>Thank you for using our professional service platform!</p>
        <p>For support, please contact our customer service team.</p>
    </div>
</body>
</html>






