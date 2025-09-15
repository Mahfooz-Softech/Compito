import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DataTable } from '@/components/dashboard/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Star, 
  DollarSign, 
  Clock,
  Plus,
  Search,
  MapPin,
  Heart,
  MessageSquare,
  CreditCard,
  User,
  Settings,
  Bell,
  BarChart3,
  TrendingUp,
  Wrench,
  Activity,
  BookOpen,
  Target,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface DashboardStats {
  overview: {
    total_bookings: number;
    completed_bookings: number;
    pending_bookings: number;
    cancelled_bookings: number;
    total_spent: number;
    average_rating: number;
    total_reviews: number;
  };
  service_requests: {
    total_requests: number;
    pending_requests: number;
    responded_requests: number;
  };
  offers: {
    total_offers: number;
    pending_offers: number;
    accepted_offers: number;
  };
  recent_activity: {
    recent_bookings: number;
    recent_service_requests: number;
    unread_notifications: number;
  };
  monthly_spending: Array<{
    month: string;
    amount: number;
  }>;
  top_services: Array<{
    title: string;
    id: string;
    usage_count: number;
    total_spent: number;
  }>;
  recent_bookings_details: Array<{
    id: string;
    service_title: string;
    worker_name: string;
    total_amount: number;
    status: string;
    scheduled_date: string;
    created_at: string;
  }>;
  rating_distribution: {
    [key: number]: number;
  };
}

interface ChartData {
  booking_status_distribution: { [key: string]: number };
  service_category_distribution: Array<{
    name: string;
    count: number;
    total_spent: number;
  }>;
  weekly_activity: Array<{
    week: string;
    bookings: number;
    service_requests: number;
  }>;
  yearly_spending: Array<{
    month: string;
    year: string;
    amount: number;
  }>;
}

interface ActivityItem {
  type: 'booking' | 'service_request' | 'offer';
  id: string;
  title: string;
  description: string;
  amount?: number;
  date: string;
  status: string;
}

const EnhancedCustomerDashboard = () => {
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'dashboard';
  const { user } = useAuth();
  const { toast } = useToast();

  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data from Laravel backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch all dashboard data in parallel
      const [statsResponse, chartsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/dashboard/charts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/dashboard/activity', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (!statsResponse.ok || !chartsResponse.ok || !activitiesResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [statsData, chartsData, activitiesData] = await Promise.all([
        statsResponse.json(),
        chartsResponse.json(),
        activitiesResponse.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
      }
      if (chartsData.success) {
        setCharts(chartsData.charts);
      }
      if (activitiesData.success) {
        setActivities(activitiesData.activities);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  // Enhanced stats cards with real data
  const enhancedStatsCards = stats ? [
    {
      title: "Total Bookings",
      value: stats.overview.total_bookings.toString(),
      change: `${stats.overview.completed_bookings} completed`,
      icon: Calendar,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      trend: stats.overview.total_bookings > 0 ? 'up' : 'neutral'
    },
    {
      title: "Total Spent",
      value: `$${stats.overview.total_spent.toFixed(2)}`,
      change: "Lifetime spending",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50",
      trend: stats.overview.total_spent > 0 ? 'up' : 'neutral'
    },
    {
      title: "Average Rating",
      value: stats.overview.average_rating > 0 ? stats.overview.average_rating.toFixed(1) : "No ratings",
      change: `${stats.overview.total_reviews} reviews`,
      icon: Star,
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50",
      trend: stats.overview.average_rating > 4 ? 'up' : 'neutral'
    },
    {
      title: "Active Requests",
      value: stats.service_requests.pending_requests.toString(),
      change: `${stats.service_requests.responded_requests} responded`,
      icon: Target,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
      trend: stats.service_requests.pending_requests > 0 ? 'up' : 'neutral'
    }
  ] : [];

  // Service request stats cards
  const serviceRequestCards = stats ? [
    {
      title: "Service Requests",
      value: stats.service_requests.total_requests.toString(),
      change: "Total submitted",
      icon: BookOpen,
      gradient: "from-indigo-500 to-blue-600",
      bgGradient: "from-indigo-50 to-blue-50"
    },
    {
      title: "Pending Offers",
      value: stats.offers.pending_offers.toString(),
      change: `${stats.offers.accepted_offers} accepted`,
      icon: Clock,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50"
    },
    {
      title: "Unread Notifications",
      value: stats.recent_activity.unread_notifications.toString(),
      change: "New updates",
      icon: Bell,
      gradient: "from-pink-500 to-rose-600",
      bgGradient: "from-pink-50 to-rose-50"
    }
  ] : [];

  const renderMainDashboard = () => (
    <div className="space-y-6">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-primary/20">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome back! <span className='!text-yellow-700'>🎉</span>
              </h1>
              <p className="text-muted-foreground">
                Here's your complete activity overview and statistics
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Active Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-primary/20" onClick={() => window.location.href = '/customer/browse'}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Browse Services</h4>
              <p className="text-sm text-muted-foreground">Discover amazing services from trusted providers</p>
            </CardContent>
          </Card>
          
          <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-success/20" onClick={() => window.location.href = '/customer/browse'}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-success/20 transition-colors">
                <Plus className="h-8 w-8 text-success" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Book a Service</h4>
              <p className="text-sm text-muted-foreground">Schedule your next service appointment</p>
            </CardContent>
          </Card>
          
          <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-blue-500/20" onClick={() => window.location.href = '/customer/messages'}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Messages & Offers</h4>
              <p className="text-sm text-muted-foreground">Stay connected with service providers</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Your Activity Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {enhancedStatsCards.map((stat, index) => (
            <div key={index} className="group">
              <Card className={`bg-gradient-to-br ${stat.bgGradient} border-2 border-transparent hover:border-${stat.gradient.split('-')[1]}-200 transition-all duration-300 hover:shadow-xl hover:scale-105`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        {stat.change}
                      </span>
                      {stat.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                      {stat.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Service Requests & Offers Stats */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Service Requests & Offers</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceRequestCards.map((stat, index) => (
            <div key={index} className="group">
              <Card className={`bg-gradient-to-br ${stat.bgGradient} border-2 border-transparent hover:border-${stat.gradient.split('-')[1]}-200 transition-all duration-300 hover:shadow-xl hover:scale-105`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Spending Chart */}
      {stats && stats.monthly_spending.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Monthly Spending Trend</h3>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Spending Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.monthly_spending.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <span className="font-medium">{month.month}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${month.amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Services */}
      {stats && stats.top_services.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Your Top Services</h3>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Most Used Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.top_services.map((service, index) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{service.title}</p>
                        <p className="text-sm text-muted-foreground">Used {service.usage_count} times</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${service.total_spent.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Total spent</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Bookings */}
      {stats && stats.recent_bookings_details.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recent Bookings</h3>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Latest Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recent_bookings_details.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.service_title}</p>
                        <p className="text-sm text-muted-foreground">with {booking.worker_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={
                          booking.status === 'completed' ? 'default' :
                          booking.status === 'pending' ? 'secondary' :
                          booking.status === 'cancelled' ? 'destructive' : 'outline'
                        }
                      >
                        {booking.status}
                      </Badge>
                      <p className="text-lg font-bold text-green-600 mt-1">${booking.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <RecentActivity activities={activities} variant="customer" title="Latest Updates" />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout userType="customer" title="Customer Dashboard">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-pulse mx-auto" />
              <div className="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Loading Your Dashboard
              </h2>
              <p className="text-muted-foreground">Fetching your statistics and activity data...</p>
            </div>
            <div className="flex space-x-2 justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userType="customer" title="Customer Dashboard">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchDashboardData}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="customer" title="Customer Dashboard">
      {renderMainDashboard()}
    </DashboardLayout>
  );
};

export default EnhancedCustomerDashboard;



