
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { EarningsCharts } from '@/components/worker/EarningsCharts';
import { DataTable } from '@/components/dashboard/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWorkerData } from '@/hooks/useWorkerData';
import { useWeeklyEarnings } from '@/hooks/useWeeklyEarnings';

import { WorkerBookings } from '@/components/worker/WorkerBookings';
import { WorkerReviews } from '@/components/worker/WorkerReviews';
import { ServiceRequestNotifications } from '@/components/worker/ServiceRequestNotifications';
import { ConversationManager } from '@/components/worker/ConversationManager';
import { ProfileCompletionDialog } from '@/components/worker/ProfileCompletionDialog';
import { AccountStatusBanner } from '@/components/worker/AccountStatusBanner';
import { ProfileCompletionToast } from '@/components/worker/ProfileCompletionToast';
import { DynamicAlertsToast } from '@/components/ui/DynamicAlertsToast';
import { ToastManager } from '@/components/ui/ToastManager';
import { useSearchParams } from 'react-router-dom';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useAuth } from '@/contexts/AuthContext';

import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  Calendar, 
  Star, 
  Users,
  Clock,
  Plus,
  TrendingUp,
  CheckCircle,
  MapPin,
  MessageSquare,
  AlertCircle,
  BarChart3,
  Bell,
  Briefcase,
  CircleDollarSign,
  User,
  Wrench
} from 'lucide-react';

const WorkerDashboard = () => {
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'dashboard';
  const { loading, stats, recentJobs, upcomingSchedule, alerts, profileCompletion, workerProfile } = useWorkerData();
  const { weeklyEarnings, totalWeeklyEarnings, totalWeeklyJobs } = useWeeklyEarnings();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showAlertsPopup, setShowAlertsPopup] = useState(false);

  const { user } = useAuth();


  // Debug logging to track data
  console.log('WorkerDashboard render:', { 
    loading, 
    stats: {
      jobsCompleted: stats.jobsCompleted,
      averageRating: stats.averageRating,
      activeClients: stats.activeClients,
      category: stats.category
    },
    recentJobs: recentJobs.length,
    upcomingSchedule: upcomingSchedule.length,
    workerProfile: !!workerProfile
  });

  // Enhanced stats cards with better visual appeal
  const enhancedStatsCards = [
    {
      title: "Jobs Completed",
      value: stats.jobsCompleted.toString(),
      change: `${totalWeeklyJobs} this week`,
      changeType: totalWeeklyJobs > 0 ? "positive" as const : "neutral" as const,
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      title: "Average Rating",
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "No ratings yet",
      change: `${stats.totalReviews || 0} reviews total`,
      changeType: "neutral" as const,
      icon: Star,
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50"
    },
    {
      title: "Active Clients",
      value: stats.activeClients.toString(),
      change: `${stats.newClientsThisMonth || 0} new this month`,
      changeType: (stats.newClientsThisMonth || 0) > 0 ? "positive" as const : "neutral" as const,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      title: "Worker Category",
      value: stats.category || "Uncategorized",
      change: `${(stats.commissionRate * 100).toFixed(1)}% commission`,
      changeType: "neutral" as const,
      icon: Star,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50"
    }
  ];

  // Stats cards
  const statsCards = [
    {
      title: "Jobs Completed",
      value: stats.jobsCompleted.toString(),
      change: `${totalWeeklyJobs} this week`,
      changeType: totalWeeklyJobs > 0 ? "positive" as const : "neutral" as const,
      icon: CheckCircle
    },
    {
      title: "Average Rating",
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "No ratings yet",
      change: `${stats.totalReviews || 0} reviews total`,
      changeType: "neutral" as const,
      icon: Star
    },
    {
      title: "Active Clients",
      value: stats.activeClients.toString(),
      change: `${stats.newClientsThisMonth || 0} new this month`,
      changeType: (stats.newClientsThisMonth || 0) > 0 ? "positive" as const : "neutral" as const,
      icon: Users
    },
    {
      title: "Worker Category",
      value: stats.category || "Uncategorized",
      change: `${(stats.commissionRate * 100).toFixed(1)}% commission`,
      changeType: "neutral" as const,
      icon: Star
    }
  ];

  // Recent activities
  const recentActivities = (() => {
    const activities = [];
    
    // Add recent jobs
    recentJobs.slice(0, 3).forEach((job, index) => {
      activities.push({
        id: `job-${job.id || index}`,
        type: job.status === 'completed' ? "payment" : "booking",
        title: job.status === 'completed' ? "Job Completed Successfully" : "New Job Assignment",
        description: `${job.service_title || 'Service'} for ${job.customer_name || 'Customer'}`,
        timestamp: new Date(job.created_at || Date.now() - index * 60 * 60 * 1000),
        user: {
          name: job.customer_name || "Customer",
          initials: (job.customer_name || "C").charAt(0).toUpperCase()
        },
        status: job.status,
        amount: job.total_amount ? `$${job.total_amount}` : undefined
      });
    });

    // Add profile completion activity if profile is incomplete
    if (profileCompletion < 100) {
      activities.push({
        id: 'profile-completion',
        type: 'user',
        title: 'Profile Completion Required',
        description: 'Complete your profile to get more job opportunities',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        user: {
          name: 'System',
          initials: 'S'
        },
        status: 'pending'
      });
    }

    // Add earnings milestone if applicable
    if (stats.monthlyEarnings > 1000) {
      activities.push({
        id: 'earnings-milestone',
        type: 'payment',
        title: 'Monthly Earnings Milestone!',
        description: `Great month! You've earned over $${Math.floor(stats.monthlyEarnings / 1000)}k this month`,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        user: {
          name: 'System',
          initials: 'S'
        },
        status: 'success',
        amount: `$${stats.monthlyEarnings.toFixed(2)}`
      });
    }

    // Sort by timestamp and take latest 5
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  })();
  
  // Enhanced job columns with better visual appeal
  const jobColumns = [
    { 
      key: 'client', 
      label: 'Client',
      render: (value: string) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <span className="font-semibold text-gray-800">{value}</span>
        </div>
      )
    },
    { 
      key: 'service', 
      label: 'Service',
      render: (value: string) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Wrench className="h-5 w-5 text-purple-600" />
          </div>
          <span className="font-semibold text-gray-800">{value}</span>
        </div>
      )
    },
    { 
      key: 'date', 
      label: 'Date',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-gray-700">{value}</span>
        </div>
      )
    },
    { 
      key: 'time', 
      label: 'Time',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span className="font-medium text-gray-700">{value}</span>
        </div>
      )
    },
    { 
      key: 'amount', 
      label: 'Amount',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          <span className="font-bold text-green-600 text-lg">{value}</span>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status' 
    }
  ];
  
  // Show profile completion popup when profile is 100% complete
  useEffect(() => {
    if (profileCompletion === 100) {
      setShowProfilePopup(true);
    }
  }, [profileCompletion]);

  // Show alerts popup when alerts are available
  useEffect(() => {
    if (alerts.length > 0) {
      setShowAlertsPopup(true);
    }
  }, [alerts.length]);

  // Simple data fetch on mount - exactly like WorkerBookings
  useEffect(() => {
    if (user?.id) {
      console.log('WorkerDashboard: Fetching data on mount...');
    }
  }, [user?.id]);

  const handleProfileDialogOpen = () => {
    setProfileDialogOpen(true);
  };
  
  const handleProfileDialogClose = () => {
    setProfileDialogOpen(false);
  };
  
  const renderDashboardContent = () => {
    switch (section) {
      case 'bookings':
        return <WorkerBookings />;
      case 'reviews':
        return <WorkerReviews />;
      case 'requests':
        return <ServiceRequestNotifications />;
      case 'messages':
        return <ConversationManager />;
      default:
        return renderMainDashboard();
    }
  };
  
  const renderMainDashboard = () => (
              <div className="space-y-6">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-primary/20">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-[rgba(0,0,0,0.7)]">
                <span className='text-yellow-400'>👋</span> Welcome back, {user?.user_metadata?.first_name }! 
              </h1>
              <p className="text-muted-foreground">
                Ready to tackle today's challenges and grow your business?
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Online & Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status Banner */}
      <AccountStatusBanner workerId={user?.id || ''} />

      {/* Profile Completion Alert */}
      {profileCompletion < 80 ? (
        <Card className="border-l-4 border-l-warning bg-gradient-to-r from-warning/10 to-orange-100/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-warning-800">Complete Your Profile</h4>
                  <p className="text-sm text-warning-700">
                    Your profile is {profileCompletion}% complete. Complete it to get more jobs and increase your earnings!
                  </p>
                  <div className="mt-3">
                    <Progress value={profileCompletion} className="w-full h-2" />
                    <p className="text-xs text-warning-600 mt-1">{profileCompletion}% Complete</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleProfileDialogOpen} size="lg" className="bg-warning hover:bg-warning/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Complete Profile
              </Button>
            </div>
          </CardContent>
        </Card>
              ) : 
              ""}

      {/* Dynamic Alerts - Popup Style */}
      

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-primary/20" onClick={() => window.location.href = '/worker/services'}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Add Service</h4>
              <p className="text-sm text-muted-foreground">Expand your service offerings to attract more clients</p>
            </CardContent>
          </Card>
          
          <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-warning/20" onClick={() => window.location.href = '/worker/earnings'}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-warning/20 transition-colors">
                <CircleDollarSign className="h-8 w-8 text-warning" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Your Earnings</h4>
              <p className="text-sm text-muted-foreground">View Your earnings and financials</p>
            </CardContent>
          </Card>
          
          <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-blue-500/20" onClick={() => window.location.href = '/worker/messages'}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Messages</h4>
              <p className="text-sm text-muted-foreground">Connect with clients and manage conversations</p>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Stats */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Performance Overview</h3>
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
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-600'
                      }`}>
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

      {/* Earnings Overview */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Earnings & Financials</h3>
        </div>
        <EarningsCharts stats={stats} />
      </div>

            {/* Main Content Grid */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Schedule & Activity</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Schedule */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Clock className="h-5 w-5" />
                <span>Upcoming Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {upcomingSchedule.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming bookings</p>
                    <p className="text-sm">Your schedule is clear for now</p>
                  </div>
                ) : (
                  upcomingSchedule.map((booking, index) => (
                    <div key={index} className="p-4 border border-blue-100 rounded-lg hover:bg-blue-50/50 transition-all duration-200 hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-sm text-blue-900">{booking.service}</p>
                          <p className="text-xs text-blue-600">{booking.client}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-blue-700">{booking.date}</p>
                          <p className="text-xs text-blue-500">{booking.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-blue-600">
                        <MapPin className="h-3 w-3" />
                        <span>{booking.address}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity activities={recentActivities} variant="worker" title="Worker Activity" />
          </div>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-800">Recent Jobs & Bookings</h3>
        </div>
        <DataTable
          title="Recent Jobs"
          columns={jobColumns}
          data={recentJobs.map(job => ({
            id: job.id,
            client: job.customer_name || 'Customer',
            service: job.service_title || 'Service',
            date: job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A',
            status: job.status,
            amount: job.total_amount ? `$${job.total_amount}` : 'N/A'
          }))}
          variant="jobs"
          onView={(job) => console.log('View job:', job)}
          onEdit={(job) => console.log('Edit job:', job)}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout userType="worker" title="Worker Dashboard">
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
              <p className="text-muted-foreground">Preparing your personalized workspace...</p>
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
  
  return (
    <DashboardLayout userType="worker" title="Worker Dashboard">
      {renderDashboardContent()}
      
      {/* Profile Completion Dialog */}
      <ProfileCompletionDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onComplete={() => {
          handleProfileDialogClose();
        }}
      />

      {/* Profile Completion Toast - Shows for 3 seconds */}
      <div className="mb-8">
        <ProfileCompletionToast
          isVisible={showProfilePopup}
          onClose={() => setShowProfilePopup(false)}
        />
      </div>

      {/* Dynamic Alerts Toast - Shows each alert for 3 seconds */}
      <div className="mb-8">
        <DynamicAlertsToast
          alerts={alerts}
          isVisible={showAlertsPopup}
          onClose={() => setShowAlertsPopup(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default WorkerDashboard;
