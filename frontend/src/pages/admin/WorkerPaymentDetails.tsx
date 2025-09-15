import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PaginatedDataTable } from '@/components/dashboard/PaginatedDataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminPayments } from '@/hooks/useAdminPayments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Download,
  Search,
  Eye,
  CreditCard
} from 'lucide-react';

const WorkerPaymentDetails = () => {
  const { workerId } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [workerPaidFilter, setWorkerPaidFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [workerEmail, setWorkerEmail] = useState<string>('');
  const [workerLoading, setWorkerLoading] = useState(true);
  const pageSize = 10;
  const { toast } = useToast();
  
  // Filter payments for specific worker
  const { loading, payments, totalCount } = useAdminPayments(
    currentPage, 
    pageSize, 
    searchTerm, 
    filterStatus, 
    workerPaidFilter,
    workerId
  );

  // Fetch worker profile information
  useEffect(() => {
    const fetchWorkerProfile = async () => {
      if (!workerId) return;
      
      try {
        setWorkerLoading(true);
        
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, phone')
          .eq('id', workerId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setWorkerProfile(null);
        } else {
          setWorkerProfile(profileData);
        }

        // Try to fetch email using the function (may not be available in types yet)
        try {
          const { data: emailData, error: emailError } = await supabase
            .rpc('get_user_email_by_profile_id' as any, { profile_id: workerId });

          if (emailError) {
            console.error('Error fetching email:', emailError);
            setWorkerEmail('Email not available');
          } else {
            setWorkerEmail(emailData as string || 'Email not available');
          }
        } catch (emailErr) {
          console.error('Email function not available:', emailErr);
          setWorkerEmail('Email not available');
        }

      } catch (error) {
        console.error('Error fetching worker profile:', error);
        setWorkerProfile(null);
        setWorkerEmail('');
      } finally {
        setWorkerLoading(false);
      }
    };

    fetchWorkerProfile();
  }, [workerId]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleWorkerPaidChange = (workerPaid: string) => {
    setWorkerPaidFilter(workerPaid);
    setCurrentPage(1);
  };

  const handleViewInvoice = (payment: any) => {
    setSelectedInvoice(payment);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = async (payment: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://nyhbeyurlejwfgreyzoc.supabase.co/functions/v1/generate-invoice-pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payment_id: payment.id
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${payment.transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error('Download invoice error:', error);
      toast({
        title: "Error",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const paymentColumns = [
    { 
      key: 'serviceTitle', 
      label: 'Service',
      render: (value: string) => (
        <div className="font-medium text-sm">
          {value || 'Unknown Service'}
        </div>
      )
    },
    { 
      key: 'customer', 
      label: 'Customer'
    },
    { 
      key: 'totalAmount', 
      label: 'Job Amount',
      render: (value: number) => (
        <div>
          <span className="font-medium text-lg">${value.toFixed(2)}</span>
          <p className="text-xs text-muted-foreground">Total paid by customer</p>
        </div>
      )
    },
    { 
      key: 'commissionAmount', 
      label: 'Admin Commission',
      render: (value: number, row: any) => (
        <div>
          <p className="font-medium text-primary text-lg">${value.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{(row.commissionRate * 100).toFixed(1)}% commission</p>
        </div>
      )
    },
    { 
      key: 'workerPayout', 
      label: 'Worker Gets',
      render: (value: number) => (
        <div>
          <span className="font-medium text-success text-lg">${value.toFixed(2)}</span>
          <p className="text-xs text-muted-foreground">Worker take-home</p>
        </div>
      )
    },
    { 
      key: 'transactionId', 
      label: 'Transaction',
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-sm">{value || `TXN-${row.id.slice(0, 8)}`}</p>
          <p className="text-xs text-muted-foreground">{row.date}</p>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'completed' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    { 
      key: 'worker_paid', 
      label: 'Worker Paid',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'destructive'}>
          {value ? 'Paid' : 'Not Paid'}
        </Badge>
      )
    },
  ];

  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Worker Payment Details">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading worker payments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin" title="Worker Payment Details">
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin/payments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Worker Summary
            </Button>
          </Link>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Worker Payment Details
            </h1>
            {workerLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground">Loading worker information...</p>
              </div>
            ) : workerProfile ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">
                      {workerProfile.first_name} {workerProfile.last_name}
                    </p>
                    {workerEmail && (
                      <p className="text-sm text-muted-foreground">
                        Email: {workerEmail}
                      </p>
                    )}
                    {workerProfile.phone && (
                      <p className="text-sm text-muted-foreground">
                        Phone: {workerProfile.phone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono">
                      Worker ID: {workerId}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg">All payment transactions for this worker</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-lg">Worker information not available</p>
            )}
          </div>
        </div>

        {/* Payments Table */}
        <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/10 shadow-xl">
          <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Payment Transactions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {totalCount} total transactions found
                  </p>
                </div>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 min-w-0 lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-12 h-11 text-base bg-background/80 border-primary/20 focus:border-primary focus:ring-primary/20 shadow-sm"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-11 w-full sm:w-32 text-base bg-background/80 border-primary/20 focus:border-primary focus:ring-primary/20 shadow-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={workerPaidFilter} onValueChange={handleWorkerPaidChange}>
                  <SelectTrigger className="h-11 w-full sm:w-36 text-base bg-background/80 border-primary/20 focus:border-primary focus:ring-primary/20 shadow-sm">
                    <SelectValue placeholder="Worker Paid" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workers</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="not_paid">Not Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <PaginatedDataTable
                title=""
                columns={paymentColumns}
                data={payments}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                loading={loading}
                onPageChange={setCurrentPage}
                onView={handleViewInvoice}
                onEdit={handleDownloadInvoice}
                viewLabel="View Invoice"
                editLabel="Download Invoice"
                viewIcon={Eye}
                editIcon={Download}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Modal */}
        <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Invoice Details</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="bg-white text-black p-8 rounded-lg shadow-lg">
                {/* Invoice content - same as main payments page */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-primary mb-2">INVOICE</h1>
                    <p className="text-gray-600">Invoice #{selectedInvoice.transactionId}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary mb-2">Service Platform</div>
                    <p className="text-gray-600">123 Business St</p>
                    <p className="text-gray-600">City, State 12345</p>
                    <p className="text-gray-600">contact@platform.com</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-800">Bill To:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{selectedInvoice.customer}</p>
                      <p className="text-gray-600">Customer</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-800">Service Provider:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{selectedInvoice.worker}</p>
                      <p className="text-gray-600">Service Worker</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">Service Details:</h3>
                  <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{selectedInvoice.serviceTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{selectedInvoice.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-medium">{selectedInvoice.transactionId}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">Payment Breakdown:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span>Service Amount:</span>
                      <span className="font-medium">${selectedInvoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Platform Commission ({(selectedInvoice.commissionRate * 100).toFixed(1)}%):</span>
                      <span>-${selectedInvoice.commissionAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-xl font-bold text-primary">
                      <span>Worker Payout:</span>
                      <span>${selectedInvoice.workerPayout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Thank you for using our platform!
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    This invoice was generated automatically by our system.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default WorkerPaymentDetails;