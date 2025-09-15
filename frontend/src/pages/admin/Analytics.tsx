import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useAdminData } from '@/hooks/useAdminData';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Calendar,
  TrendingUp,
  Award,
  Star,
  Clock
} from 'lucide-react';

const AdminAnalytics = () => {
  const { loading, stats, allPayments, allReviews, allBookings, allWorkers } = useAdminData();

  // Helpers to prevent NaN in calculations and handle variant backend keys
  const toNumber = (value: any, fallback: number = 0) => {
    if (value === null || value === undefined) return fallback;
    const raw = typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : value;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };

  const formatCurrency = (value: number) => `$${toNumber(value).toLocaleString()}`;

  const getPaymentTotal = (p: any) => toNumber(
    p?.totalAmount ?? p?.total_amount ?? p?.amount ?? p?.total ?? p?.value,
    0
  );

  const getCommissionAmount = (p: any) => toNumber(
    p?.commissionAmount ?? p?.commission_amount ?? p?.platform_fee ?? p?.fee,
    0
  );

  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Analytics">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalRevenue = (allPayments || []).reduce((sum, payment) => sum + getPaymentTotal(payment), 0);
  const totalCommission = (allPayments || []).reduce((sum, payment) => sum + getCommissionAmount(payment), 0);
  const avgRating = allReviews.length > 0 ? 
    allReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / allReviews.length : 0;
  const completedBookings = allBookings.filter(b => b.status === 'completed').length;

  const verifiedWorkers = allWorkers.filter(w => w.isVerified).length;

  const completionRate = allBookings.length > 0 ? Math.round((completedBookings / allBookings.length) * 100) : 0;

  return (
    <DashboardLayout userType="admin" title="Analytics">
      <div className="space-y-8">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="worker-card bg-gradient-to-br from-primary/8 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="p-2 rounded-full bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="worker-card bg-gradient-to-br from-success/8 to-success/5 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Profit</CardTitle>
              <div className="p-2 rounded-full bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{formatCurrency(totalCommission)}</div>
              <p className="text-xs text-muted-foreground">Commission earned</p>
            </CardContent>
          </Card>

          <Card className="worker-card bg-gradient-to-br from-warning/8 to-warning/5 border-warning/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <div className="p-2 rounded-full bg-warning/10">
                <Star className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Platform average</p>
            </CardContent>
          </Card>

          <Card className="worker-card bg-gradient-to-br from-accent to-muted/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <div className="p-2 rounded-full bg-primary/10">
                <Award className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{completionRate}%</div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${completionRate}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Job success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="worker-card bg-background/60">
            <CardHeader>
              <CardTitle>Worker Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Total Workers</span>
                <span className="font-medium">{allWorkers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Workers</span>
                <span className="font-medium text-success">{verifiedWorkers}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Verification</span>
                <span className="font-medium text-warning">{allWorkers.length - verifiedWorkers}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="worker-card bg-background/60">
            <CardHeader>
              <CardTitle>Booking Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Total Bookings</span>
                <span className="font-medium">{allBookings.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed</span>
                <span className="font-medium text-success">{completedBookings}</span>
              </div>
              <div className="flex justify-between">
                <span>In Progress</span>
                <span className="font-medium text-primary">
                  {allBookings.filter(b => b.status === 'confirmed').length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="worker-card bg-background/60">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Total Revenue</span>
                <span className="font-medium">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Commission</span>
                <span className="font-medium text-primary">{formatCurrency(totalCommission)}</span>
              </div>
              <div className="flex justify-between">
                <span>Worker Payouts</span>
                <span className="font-medium">{formatCurrency(totalRevenue - totalCommission)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;