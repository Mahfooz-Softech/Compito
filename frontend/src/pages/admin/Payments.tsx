import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PaginatedDataTable } from '@/components/dashboard/PaginatedDataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkerPaymentSummary } from '@/hooks/useWorkerPaymentSummary';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentDetailsDrawer } from '@/components/admin/PaymentDetailsDrawer';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Users,
  Download,
  Search,
  Eye
} from 'lucide-react';

const AdminPayments = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedWorkerName, setSelectedWorkerName] = useState<string>('');
  const pageSize = 10;
  const { toast } = useToast();
  
  const { loading, workerSummaries, totalCount } = useWorkerPaymentSummary(currentPage, pageSize, searchTerm);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleViewPaymentDetails = (workerId: string, workerName: string) => {
    setSelectedWorkerId(workerId);
    setSelectedWorkerName(workerName);
    setShowPaymentDrawer(true);
  };

  const workerColumns = [
    { 
      key: 'worker_name', 
      label: 'Worker',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-sm">{value}</div>
          <button
            onClick={() => handleViewPaymentDetails(row.worker_id, value)}
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 hover:text-primary/80 transition-colors"
          >
            View Payment Details <Eye className="h-3 w-3" />
          </button>
        </div>
      )
    },
    { 
      key: 'category', 
      label: 'Category',
      render: (value: string) => (
        <Badge variant="secondary" className="font-medium">
          {value}
        </Badge>
      )
    },
    { 
      key: 'total_services', 
      label: 'Services',
      render: (value: number) => (
        <div className="text-center">
          <span className="font-medium text-lg">{value}</span>
          <p className="text-xs text-muted-foreground">Total services</p>
        </div>
      )
    },
    { 
      key: 'total_customers', 
      label: 'Customers',
      render: (value: number) => (
        <div className="text-center">
          <span className="font-medium text-lg">{value}</span>
          <p className="text-xs text-muted-foreground">Unique customers</p>
        </div>
      )
    },
    { 
      key: 'total_amount', 
      label: 'Total',
      render: (value: number) => (
        <div>
          <span className="font-medium text-lg">${value.toFixed(2)}</span>
          <p className="text-xs text-muted-foreground">Total amount</p>
        </div>
      )
    },
    { 
      key: 'total_commission', 
      label: 'Commission',
      render: (value: number) => (
        <div>
          <span className="font-medium text-primary text-lg">${value.toFixed(2)}</span>
          <p className="text-xs text-muted-foreground">Total commission</p>
        </div>
      )
    },
    { 
      key: 'required_payout', 
      label: 'Required Payout',
      render: (value: number) => (
        <div>
          <span className="font-medium text-warning text-lg">${value.toFixed(2)}</span>
          <p className="text-xs text-muted-foreground">Amount to pay</p>
        </div>
      )
    },
    { 
      key: 'paid_amount', 
      label: 'Paid Amount',
      render: (value: number) => (
        <div>
          <span className="font-medium text-success text-lg">${value.toFixed(2)}</span>
          <p className="text-xs text-muted-foreground">Already paid</p>
        </div>
      )
    },
    { 
      key: 'pay', 
      label: 'Actions',
      render: (value: number) => (
        <div>
        <Button >Pay Worker</Button>
        </div>
      )
    }
  ];


  const handleExportPayments = async () => {
    try {
      setIsExporting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const queryParams = new URLSearchParams({
        format: 'csv',
        status: 'all'
      });

      const response = await fetch(
        `https://nyhbeyurlejwfgreyzoc.supabase.co/functions/v1/export-payments?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export payments. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Payment Management">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin" title="Payment Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Payment Management
            </h1>
            <p className="text-muted-foreground text-lg">Monitor platform transactions and revenue</p>
          </div>
          <Button 
            onClick={handleExportPayments} 
            disabled={isExporting}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
          >
            <Download className="h-5 w-5 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Workers"
            value={totalCount.toString()}
            icon={Users}
            className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          />
          
          <StatCard
            title="Total Revenue"
            value={`$${workerSummaries.reduce((sum, w) => sum + w.total_amount, 0).toLocaleString()}`}
            icon={DollarSign}
            className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          />
          
          <StatCard
            title="Commission Earned"
            value={`$${workerSummaries.reduce((sum, w) => sum + w.total_commission, 0).toLocaleString()}`}
            icon={TrendingUp}
            className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          />
          
          <StatCard
            title="Pending Payouts"
            value={`$${workerSummaries.reduce((sum, w) => sum + w.required_payout, 0).toLocaleString()}`}
            icon={CreditCard}
            className="bg-gradient-to-br from-accent/10 to-accent/20 border-accent/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          />
        </div>

        {/* Workers Summary Table */}
        <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/10 shadow-xl">
          <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Worker Payment Summary</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {totalCount} workers with active payments
                  </p>
                </div>
              </div>
              
              {/* Search Controls */}
              <div className="flex flex-col sm:flex-row gap-4 min-w-0 lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search workers..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-12 h-11 text-base bg-background/80 border-primary/20 focus:border-primary focus:ring-primary/20 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <PaginatedDataTable
                title=""
                columns={workerColumns}
                data={workerSummaries}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                loading={loading}
                onPageChange={setCurrentPage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Details Drawer */}
        <PaymentDetailsDrawer
          isOpen={showPaymentDrawer}
          onClose={() => setShowPaymentDrawer(false)}
          workerId={selectedWorkerId}
          workerName={selectedWorkerName}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminPayments;