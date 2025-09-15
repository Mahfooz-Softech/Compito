import React, { useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkerAnalytics } from '@/hooks/useWorkerAnalytics';
import { TrendingUp, Users, Star, DollarSign, Calendar, Clock, BarChart3 } from 'lucide-react';

const WorkerAnalytics = () => {
  const { loading, analytics, monthlyPerformance, servicePerformance } = useWorkerAnalytics();

  // Memoize analytics cards to prevent unnecessary re-renders
  const analyticsCards = useMemo(() => [
    {
      icon: Users,
      title: "Total Clients",
      value: analytics.totalClients,
      subtitle: `+${analytics.newClientsThisMonth} new this month`
    },
    {
      icon: Calendar,
      title: "Jobs Completed",
      value: analytics.jobsCompleted,
      subtitle: `${analytics.jobsThisMonth} this month`
    },
    {
      icon: Star,
      title: "Average Rating",
      value: analytics.averageRating.toFixed(1),
      subtitle: `Based on ${analytics.totalReviews} reviews`
    },
    {
      icon: DollarSign,
      title: "Avg. Hourly Rate",
      value: `$${analytics.hourlyRate.toFixed(0)}`,
      subtitle: "Current rate"
    }
  ], [analytics.totalClients, analytics.newClientsThisMonth, analytics.jobsCompleted, analytics.jobsThisMonth, analytics.averageRating, analytics.totalReviews, analytics.hourlyRate]);

  // Memoize monthly performance display to prevent unnecessary re-renders
  const monthlyPerformanceDisplay = useMemo(() => {
    if (monthlyPerformance.length === 0) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No performance data yet</p>
          <p className="text-sm text-muted-foreground">Complete jobs to see monthly trends</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {monthlyPerformance.slice(-3).map((month, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <h3 className="font-medium">{month.month}</h3>
              <p className="text-sm text-muted-foreground">{month.jobs} jobs</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-success">${month.earnings.toFixed(2)}</p>
              <p className={`text-sm ${month.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {month.growth >= 0 ? '+' : ''}{month.growth}% growth
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }, [monthlyPerformance]);

  // Memoize service performance display to prevent unnecessary re-renders
  const servicePerformanceDisplay = useMemo(() => {
    if (servicePerformance.length === 0) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No service data yet</p>
          <p className="text-sm text-muted-foreground">Complete jobs to see service performance</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {servicePerformance.slice(0, 5).map((service, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <h3 className="font-medium">{service.service}</h3>
              <p className="text-sm text-muted-foreground">{service.bookings} bookings</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{service.rating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-success">${service.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }, [servicePerformance]);

  if (loading) {
    return (
      <DashboardLayout userType="worker" title="Analytics">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="worker" title="Analytics">
      <div className="space-y-6">
        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                  <card.icon className="h-4 w-4" />
                  <span>{card.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Monthly Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyPerformanceDisplay}
            </CardContent>
          </Card>

          {/* Service Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Service Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {servicePerformanceDisplay}
            </CardContent>
          </Card>
        </div>

        {/* Additional Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Response Time</h3>
                <p className="text-sm text-muted-foreground">Track how quickly you respond to requests</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-8 w-8 text-success" />
                </div>
                <h3 className="font-semibold mb-1">Customer Satisfaction</h3>
                <p className="text-sm text-muted-foreground">Monitor your rating trends over time</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-8 w-8 text-warning" />
                </div>
                <h3 className="font-semibold mb-1">Earnings Growth</h3>
                <p className="text-sm text-muted-foreground">Analyze your income patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WorkerAnalytics;