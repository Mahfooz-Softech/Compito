import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminData } from '@/hooks/useAdminData';
import { Download, Calendar, FileText, Filter } from 'lucide-react';

const AdminReports = () => {
  const { loading, allPayments, allBookings, allUsers, allWorkers } = useAdminData();
  const [reportType, setReportType] = useState('payments');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const generateReport = () => {
    const filteredData = getFilteredData();
    const csv = convertToCSV(filteredData);
    downloadCSV(csv, `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getFilteredData = () => {
    let data: any[] = [];
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    switch (reportType) {
      case 'payments':
        data = allPayments.filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return (!start || paymentDate >= start) && (!end || paymentDate <= end);
        });
        break;
      case 'bookings':
        data = allBookings.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return (!start || bookingDate >= start) && (!end || bookingDate <= end);
        });
        break;
      case 'users':
        data = allUsers.filter(user => {
          const userDate = new Date(user.created_at);
          return (!start || userDate >= start) && (!end || userDate <= end);
        });
        break;
      case 'workers':
        data = allWorkers.filter(worker => {
          const workerDate = new Date(worker.created_at || '');
          return (!start || workerDate >= start) && (!end || workerDate <= end);
        });
        break;
    }
    return data;
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Reports">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredData = getFilteredData();

  return (
    <DashboardLayout userType="admin" title="Reports">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Downloads</h1>
          <p className="text-muted-foreground">Generate and download platform reports</p>
        </div>

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payments">Payments Report</SelectItem>
                    <SelectItem value="bookings">Bookings Report</SelectItem>
                    <SelectItem value="users">Users Report</SelectItem>
                    <SelectItem value="workers">Workers Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <Button onClick={generateReport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Preview ({filteredData.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{allPayments.length}</div>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{allBookings.length}</div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{allUsers.length}</div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{allWorkers.length}</div>
                  <p className="text-sm text-muted-foreground">Total Workers</p>
                </div>
              </div>

              {reportType === 'payments' && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Payment Summary</h4>
                  <div className="text-sm text-muted-foreground">
                    Total Revenue: ${allPayments.reduce((sum, p) => sum + Number(p.total_amount), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Commission: ${allPayments.reduce((sum, p) => sum + Number(p.commission_amount), 0).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;