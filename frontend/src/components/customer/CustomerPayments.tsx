import React, { useState, useEffect } from 'react';
import { PaginatedDataTable } from '@/components/dashboard/PaginatedDataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, BookOpen, Eye, Download } from 'lucide-react';
import { DashboardLayout } from '../dashboard/DashboardLayout';

interface PaymentData {
  id: string;
  service: string;
  service_category: string;
  worker: string;
  date: string;
  total_amount: number;
  commission_amount: number;
  payment_status: string;
  created_at: string;
}

interface PaymentStats {
  totalSpent: number;
  totalPayments: number;
  platformFees: number;
}

interface InvoiceData {
  id: string;
  service: string;
  service_category: string;
  worker: string;
  worker_email?: string;
  worker_phone?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  date: string;
  total_amount: number;
  commission_amount: number;
  payment_status: string;
  payment_method?: string;
  booking_date?: string;
  booking_address?: string;
  booking_notes?: string;
}

export const CustomerPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalSpent: 0,
    totalPayments: 0,
    platformFees: 0
  });
  const [totalCount, setTotalCount] = useState(0);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  const paymentColumns = [
    { 
      key: 'service', 
      label: 'Service',
      render: (value: string, row: PaymentData) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-muted-foreground">{row.service_category}</p>
        </div>
      )
    },
    { key: 'worker', label: 'Worker' },
    { key: 'date', label: 'Date' },
    { 
      key: 'total_amount', 
      label: 'Amount',
      render: (value: number) => (
        <span className="font-medium text-success">${value.toFixed(2)}</span>
      )
    },
    { 
      key: 'commission_amount', 
      label: 'Platform Fee',
      render: (value: number) => (
        <span className="text-warning">${value.toFixed(2)}</span>
      )
    },
    { 
      key: 'payment_status', 
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-success/10 text-success' :
          value === 'pending' ? 'bg-warning/10 text-warning' :
          'bg-muted text-muted-foreground'
        }`}>
          {value?.charAt(0).toUpperCase() + value?.slice(1) || 'Unknown'}
        </span>
      )
    }
  ];

  const fetchPayments = async () => {
    if (!user?.id) return;
    
    console.log('Fetching payments for user:', user.id);
    setLoading(true);
    try {
      const { data, error } = await apiClient.get('/dashboard/payments');
      if (error || !data?.success) {
        throw error || new Error('Failed to fetch payments');
      }

      const paymentsData = (data as any).payments || [];
      const statsData = (data as any).stats || { totalSpent: 0, totalPayments: 0, platformFees: 0 };

      const processedPayments: PaymentData[] = paymentsData.map((p: any) => ({
        id: p.id,
        service: p.service,
        service_category: p.service_category,
        worker: p.worker,
        date: p.date,
        total_amount: Number(p.total_amount || 0),
        commission_amount: Number(p.commission_amount || 0),
        payment_status: p.payment_status,
        created_at: p.created_at,
      }));

      setPayments(processedPayments);
      setTotalCount(processedPayments.length);
      setStats({
        totalSpent: Number(statsData.totalSpent || 0),
        totalPayments: Number(statsData.totalPayments || 0),
        platformFees: Number(statsData.platformFees || 0),
      });

    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user?.id]);

  const handleViewPayment = async (payment: PaymentData) => {
    try {
      // Fetch detailed payment info for invoice
      // Build invoice data from current payment row (no extra API yet)
      const invoiceData: InvoiceData = {
        id: payment.id,
        service: payment.service,
        service_category: payment.service_category,
        worker: payment.worker,
        customer_name: 'You',
        date: payment.date,
        total_amount: payment.total_amount,
        commission_amount: payment.commission_amount,
        payment_status: payment.payment_status,
        payment_method: 'Card',
        booking_date: payment.date,
        booking_address: 'N/A',
        booking_notes: 'No notes'
      };

      setSelectedInvoice(invoiceData);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast({
        title: "Error",
        description: "Failed to load payment details",
        variant: "destructive"
      });
    }
  };

  const handleDownloadInvoice = async (payment: PaymentData) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { paymentId: payment.id }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${payment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive"
      });
    }
  };

  return (
    
    <DashboardLayout userType="customer" title="Payments">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">Payment History</h1>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-success/10 rounded-full">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
                <p className="text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPayments}</p>
                <p className="text-muted-foreground">Total Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-warning/10 rounded-full">
                <BookOpen className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.platformFees.toFixed(2)}</p>
                <p className="text-muted-foreground">Platform Fees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Payments Table */}
      <PaginatedDataTable
        title="Payment History"
        columns={paymentColumns}
        data={payments}
        totalCount={totalCount}
        currentPage={1}
        pageSize={10}
        loading={loading}
        onPageChange={() => {}}
        onView={handleViewPayment}
        onEdit={handleDownloadInvoice}
      />

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Invoice Details
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedInvoice && handleDownloadInvoice({ id: selectedInvoice.id } as PaymentData)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="invoice-content bg-white text-black p-8 rounded-lg border">
              {/* Invoice Header */}
              <div className="border-b-2 border-gray-800 pb-6 mb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                    <p className="text-gray-600 mt-2">Professional Service Platform</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Invoice #</p>
                    <p className="font-mono text-lg">{selectedInvoice.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-600 mt-2">Date: {selectedInvoice.date}</p>
                  </div>
                </div>
              </div>

              {/* Customer & Service Provider Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-800">Bill To:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-800">{selectedInvoice.customer_name}</p>
                    {selectedInvoice.customer_phone && (
                      <p className="text-gray-600">Phone: {selectedInvoice.customer_phone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-800">Service Provider:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-800">{selectedInvoice.worker}</p>
                    {selectedInvoice.worker_phone && (
                      <p className="text-gray-600">Phone: {selectedInvoice.worker_phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-4 text-gray-800">Service Details</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-700">Service</th>
                        <th className="text-left p-4 font-medium text-gray-700">Category</th>
                        <th className="text-left p-4 font-medium text-gray-700">Date</th>
                        <th className="text-left p-4 font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-4 font-medium text-gray-800">{selectedInvoice.service}</td>
                        <td className="p-4 text-gray-600">{selectedInvoice.service_category}</td>
                        <td className="p-4 text-gray-600">{selectedInvoice.booking_date}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {selectedInvoice.payment_status.charAt(0).toUpperCase() + selectedInvoice.payment_status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-4 text-gray-800">Payment Breakdown</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Amount:</span>
                      <span className="font-medium">${(selectedInvoice.total_amount - selectedInvoice.commission_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee:</span>
                      <span className="font-medium">${selectedInvoice.commission_amount.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold text-gray-800">
                        <span>Total Amount:</span>
                        <span>${selectedInvoice.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-2 gap-6 text-sm text-gray-600">
                  <div>
                    <p><strong>Payment Method:</strong> {selectedInvoice.payment_method}</p>
                    <p><strong>Transaction ID:</strong> {selectedInvoice.id}</p>
                  </div>
                  <div>
                    <p><strong>Payment Date:</strong> {selectedInvoice.date}</p>
                    <p><strong>Service Address:</strong> {selectedInvoice.booking_address}</p>
                  </div>
                </div>
                
                {selectedInvoice.booking_notes && selectedInvoice.booking_notes !== 'No notes' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Service Notes:</strong> {selectedInvoice.booking_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
                <p>Thank you for using our professional service platform!</p>
                <p>For support, please contact our customer service team.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};