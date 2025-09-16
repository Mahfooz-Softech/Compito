import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable } from '@/components/dashboard/PaginatedDataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  Hash, 
  Download,
  CreditCard,
  TrendingUp,
  Users,
  Briefcase,
  Eye
} from 'lucide-react';

interface PaymentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string | null;
  workerName: string;
}

interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  worker_id: string;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  worker_payout: number;
  payment_status: string;
  worker_paid: boolean;
  created_at: string;
  updated_at?: string;
  transaction_id?: string;
  // Joined data
  customer_profiles: {
    first_name: string;
    last_name: string;
  } | null;
  worker_profiles: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  } | null;
  bookings: {
    services: {
      title: string;
    };
  } | null;
  // Transformed properties for UI
  customer?: string;
  worker?: string;
  serviceTitle?: string;
  date?: string;
  totalAmount?: number;
  commissionAmount?: number;
  commissionRate?: number;
  workerPayout?: number;
  transactionId?: string;
  status?: string;
}

export const PaymentDetailsDrawer: React.FC<PaymentDetailsDrawerProps> = ({
  isOpen,
  onClose,
  workerId,
  workerName
}) => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [workerPaidFilter, setWorkerPaidFilter] = useState('all');
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [workerEmail, setWorkerEmail] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalWorkerPayouts: 0,
    completedPayments: 0,
    pendingPayments: 0
  });
  const pageSize = 10;
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Fetch worker profile information
  useEffect(() => {
    const fetchWorkerProfile = async () => {
      if (!workerId) return;
      
      try {
        // Fetch worker details from Laravel API
        const { data, error } = await apiClient.get(`/worker-data/${workerId}`);

        if (error) {
          console.error('Error fetching worker data:', error);
          setWorkerProfile(null);
          setWorkerEmail('');
          return;
        }

        if (data && data.worker) {
          const w = data.worker;
          setWorkerProfile({
            id: w.id,
            first_name: w.first_name || (workerName.split(' ')[0] || 'Unknown'),
            last_name: w.last_name || (workerName.split(' ').slice(1).join(' ') || 'Worker'),
            phone: w.phone || '',
          });
          setWorkerEmail(w.email || '');
        } else {
          setWorkerProfile({
            id: workerId,
            first_name: workerName.split(' ')[0] || 'Unknown',
            last_name: workerName.split(' ').slice(1).join(' ') || 'Worker',
            phone: '',
          });
          setWorkerEmail('');
        }

      } catch (error) {
        console.error('Error fetching worker data:', error);
        setWorkerProfile(null);
        setWorkerEmail('');
      }
    };

    if (isOpen && workerId) {
      fetchWorkerProfile();
    }
  }, [workerId, isOpen, workerName]);

  // Fetch payments for the worker
  useEffect(() => {
    const fetchPayments = async () => {
      if (!workerId || !isOpen) return;
      
      try {
        setLoading(true);

        const params: any = { 
          worker_id: workerId,
          page: currentPage,
          per_page: pageSize,
        };
        
        if (filterStatus !== 'all') {
          params.status = filterStatus;
        }
        
        if (workerPaidFilter !== 'all') {
          params.worker_paid = workerPaidFilter === 'paid';
        }
        
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        
        const { data: paymentsData, error: paymentsError } = await apiClient.getAdminPayments(params);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          setPayments([]);
          setTotalCount(0);
          return;
        }

        if (!paymentsData) {
          setPayments([]);
          setTotalCount(0);
          return;
        }

        const paymentsArray = (paymentsData as any).payments || [];
        const transformedPayments: Payment[] = paymentsArray.map((payment: any) => ({
          ...payment,
          customer: payment.customer || 'Unknown Customer',
          worker: payment.worker || 'Unknown Worker',
          serviceTitle: payment.serviceTitle || 'Unknown Service',
          date: new Date(payment.created_at).toLocaleDateString(),
          totalAmount: payment.totalAmount || payment.total_amount || 0,
          commissionAmount: payment.commissionAmount || payment.commission_amount || 0,
          commissionRate: payment.commissionRate || payment.commission_rate || 0.15,
          workerPayout: payment.workerPayout || payment.worker_payout || 0,
          transactionId: payment.transactionId || payment.transaction_id || `${(payment.id || '')}`,
          status: payment.status || payment.payment_status || 'pending'
        }));
        
        // Use server pagination: set data directly and rely on totalCount from API
        setPayments(transformedPayments);
        setTotalCount((paymentsData as any).totalCount || (paymentsData as any).total || transformedPayments.length);

        // Calculate stats (on current page data)
        const totalRevenue = transformedPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const totalCommission = transformedPayments.reduce((sum, p) => sum + (p.commissionAmount || 0), 0);
        const totalWorkerPayouts = transformedPayments.reduce((sum, p) => sum + (p.workerPayout || 0), 0);
        const completedPayments = transformedPayments.filter(p => p.status === 'completed').length;
        const pendingPayments = transformedPayments.filter(p => p.status === 'pending').length;

        setStats({
          totalRevenue,
          totalCommission,
          totalWorkerPayouts,
          completedPayments,
          pendingPayments
        });

      } catch (error) {
        console.error('Error fetching payments:', error);
        setPayments([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && workerId) {
      fetchPayments();
    }
  }, [workerId, isOpen, currentPage, searchTerm, filterStatus, workerPaidFilter]);

  const handleViewInvoice = (payment: Payment) => {
    setSelectedInvoice(payment);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = async (payment: Payment) => {
    try {
      toast({
        title: 'PDF Generation',
        description: 'PDF generation feature is not available yet.',
        variant: 'default'
      });
      return;
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
      render: (value: any) => (
        <div>
          <span className="font-medium text-lg">${formatCurrency(Number(value || 0))}</span>
          <p className="text-xs text-muted-foreground">Total paid by customer</p>
        </div>
      )
    },
    { 
      key: 'commissionAmount', 
      label: 'Admin Commission',
      render: (value: any, row: any) => (
        <div>
          <p className="font-medium text-primary text-lg">${formatCurrency(Number(value || 0))}</p>
          <p className="text-xs text-muted-foreground">{Number((row.commissionRate || 0.15) * 100).toFixed(1)}% commission</p>
        </div>
      )
    },
    { 
      key: 'workerPayout', 
      label: 'Worker Gets',
      render: (value: any) => (
        <div>
          <span className="font-medium text-success text-lg">${formatCurrency(Number(value || 0))}</span>
          <p className="text-xs text-muted-foreground">Worker take-home</p>
        </div>
      )
    },
    { 
      key: 'transactionId', 
      label: 'Transaction',
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-sm">{value || `TXN-${(row.id || '').slice(0, 8)}`}</p>
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
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Payment) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewInvoice(row)}
            className="h-8 px-2"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadInvoice(row)}
            className="h-8 px-2"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      )
    }
  ];

  if (!workerId) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90%] sm:max-w-[90%] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-bold">Worker Payment Details</SheetTitle>
          <div className="text-sm text-muted-foreground">
            Payment transactions for {workerName}
          </div>
        </SheetHeader>
        
        <div className="space-y-6 pt-4">
          {/* Worker Profile Info */}
          {workerProfile && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Worker Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">{workerProfile.first_name} {workerProfile.last_name}</span>
                </div>
                {workerEmail !== undefined && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{workerEmail || 'Email not available'}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{workerProfile.phone || 'Phone not available'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">Worker ID: {workerId}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  ${formatCurrency(stats.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Admin Commission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  ${formatCurrency(stats.totalCommission)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/20 bg-success/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Worker Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  ${formatCurrency(stats.totalWorkerPayouts)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Worker Paid</label>
                  <select
                    value={workerPaidFilter}
                    onChange={(e) => { setWorkerPaidFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Not Paid</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payment Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PaginatedDataTable
                title=""
                columns={paymentColumns}
                data={payments}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                loading={loading}
                onPageChange={setCurrentPage}
              />
                      </CardContent>
        </Card>
      </div>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/30 pb-4">
            <DialogTitle className="text-2xl font-bold">Invoice Details</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6 pt-4">
              {/* Invoice Header */}
              <div className="text-center border-b border-border/30 pb-4">
                <h1 className="text-3xl font-bold text-primary mb-2">INVOICE</h1>
                <p className="text-gray-600">Invoice #{selectedInvoice.transactionId}</p>
                <p className="text-sm text-muted-foreground">{selectedInvoice.date}</p>
              </div>

              {/* Customer & Worker Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Customer</h3>
                  <p className="font-medium">{selectedInvoice.customer}</p>
                  <p className="text-sm text-muted-foreground">Customer ID: {selectedInvoice.customer_id}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Worker</h3>
                  <p className="font-medium">{selectedInvoice.worker}</p>
                  <p className="text-sm text-muted-foreground">Worker ID: {selectedInvoice.worker_id}</p>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Service: </span>
                    <span className="font-medium">{selectedInvoice.serviceTitle}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span className="font-medium">{selectedInvoice.date}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transaction: </span>
                    <span className="font-medium">{selectedInvoice.transactionId}</span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-3 border-t border-border/30 pt-4">
                <h3 className="font-semibold text-foreground">Financial Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Job Amount:</span>
                    <span className="font-medium">${Number(selectedInvoice.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Platform Commission ({Number((selectedInvoice.commissionRate || 0) * 100).toFixed(1)}%):</span>
                    <span>-${Number(selectedInvoice.commissionAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-success font-semibold border-t border-border/30 pt-2">
                    <span>Worker Payout:</span>
                    <span>${Number(selectedInvoice.workerPayout || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground border-t border-border/30 pt-4">
                <p>This invoice was generated automatically by our system.</p>
                <p>For any questions, please contact our support team.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SheetContent>
  </Sheet>
  );
};
