import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DataTable } from '@/components/dashboard/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomerData } from '@/hooks/useCustomerData';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { DynamicAlertsToastCustomer } from '@/components/ui/DynamicAlertsToastCustomer';

import { useToast } from '@/hooks/use-toast';
import { CustomerBookings } from '@/components/customer/CustomerBookings';
import { CustomerReviews } from '@/components/customer/CustomerReviews';
import { MessageCenter } from '@/components/customer/MessageCenter';
import { CustomerPayments } from '@/components/customer/CustomerPayments';
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
  Trash2,
  Send,
  Filter,
  BookOpen,
  ClipboardList,
  Bell,
  Lock,
  Mail,
  Globe,
  Eye,
  EyeOff,
  Shield,
  FileText,
  BarChart3,
  TrendingUp,
  Wrench,
  AlertCircle,
  Activity,
  Target
} from 'lucide-react';
import { ServiceRequestsDashboard } from '@/components/customer/ServiceRequestsDashboard';
import { OfferManager as CustomerOffers } from '@/components/customer/OfferManager';

const CustomerDashboard = () => {
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'dashboard';
  const [showAlertsToast, setShowAlertsToast] = useState(false);
  const { user } = useAuth();



  const { 
    loading: customerDataLoading, 
    stats: customerStats, 
    recentBookings, 
    upcomingBookings, 
    recommendedServices,
    allServices,
    favorites,
    messages,
    payments,
    reviews,
    profile,
    alerts,
    bookService,
    addToFavorites,
    removeFromFavorites,
    sendMessage,
    updateProfile,
    createReview
  } = useCustomerData();

  // Get real-time dashboard data from Laravel backend
  const { 
    stats: dashboardStats, 
    charts, 
    activities, 
    loading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard
  } = useDashboardData();
  const { toast } = useToast();

  // Show alerts toast when alerts are available
  useEffect(() => {
    if (alerts.length > 0) {
      setShowAlertsToast(true);
    }
  }, [alerts.length]);

  // Debug logging to track data
  console.log('CustomerDashboard render:', { 
    customerDataLoading, 
    dashboardLoading,
    customerStats: {
      totalBookings: customerStats.totalBookings,
      totalSpent: customerStats.totalSpent,
      favoriteWorkers: customerStats.favoriteWorkers,
      averageRating: customerStats.averageRating
    },
    dashboardStats: dashboardStats ? {
      total_bookings: dashboardStats.overview.total_bookings,
      total_spent: dashboardStats.overview.total_spent,
      average_rating: dashboardStats.overview.average_rating
    } : null,
    recentBookings: recentBookings.length,
    upcomingBookings: upcomingBookings.length,
    recommendedServices: recommendedServices.length
  });

  // Enhanced stats cards with real data from Laravel backend
  const enhancedStatsCards = dashboardStats ? [
    {
      title: "Total Bookings",
      value: dashboardStats.overview.total_bookings.toString(),
      change: `${dashboardStats.overview.completed_bookings} completed`,
      icon: Calendar,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      title: "Total Spent",
      value: `$${Number(dashboardStats.overview.total_spent || 0).toFixed(2)}`,
      change: "Lifetime spending",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      title: "Service Requests",
      value: dashboardStats.service_requests.total_requests.toString(),
      change: `${dashboardStats.service_requests.responded_requests} responded`,
      icon: Target,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      title: "Average Rating",
      value: dashboardStats.overview.average_rating > 0 ? dashboardStats.overview.average_rating.toFixed(1) : "No ratings",
      change: `${dashboardStats.overview.total_reviews} reviews`,
      icon: Star,
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50"
    }
  ] : [
    // Fallback to customer data if dashboard data not available
    {
      title: "Total Bookings",
      value: customerStats.totalBookings.toString(),
      change: "All time bookings",
      icon: Calendar,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      title: "Total Spent",
      value: `$${customerStats.totalSpent.toFixed(2)}`,
      change: "Lifetime spending",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      title: "Favorite Workers",
      value: customerStats.favoriteWorkers.toString(),
      change: "Trusted providers",
      icon: Heart,
      gradient: "from-pink-500 to-rose-600",
      bgGradient: "from-pink-50 to-rose-50"
    },
    {
      title: "Average Rating",
      value: customerStats.averageRating > 0 ? customerStats.averageRating.toFixed(1) : "No ratings",
      change: "Your feedback",
      icon: Star,
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50"
    }
  ];
  
  // Simple data fetch on mount - exactly like CustomerBookings
  React.useEffect(() => {
    if (user?.id) {
      console.log('CustomerDashboard: Fetching data on mount...');
    }
  }, [user?.id]);
  
  const [reviewDialog, setReviewDialog] = useState(false);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    scheduledDate: '',
    address: '',
    notes: ''
  });
  const [messageForm, setMessageForm] = useState({
    receiverId: '',
    message: ''
  });
  const [reviewForm, setReviewForm] = useState({
    bookingId: '',
    rating: 5,
    comment: ''
  });
  const [profileForm, setProfileForm] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    phone: profile?.phone || '',
    location: profile?.location || ''
  });
  const [settingsForm, setSettingsForm] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    bookingReminders: true,
    offerNotifications: true,
    reviewReminders: true,
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    theme: 'system',
    twoFactorEnabled: false,
    profileVisibility: 'private'
  });



  // Enhanced booking columns with better visual appeal
  const bookingColumns = [
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
      key: 'worker', 
      label: 'Worker',
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
      key: 'status', 
      label: 'Status' 
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
    }
  ];

  // Recent activities
  const recentActivities = (() => {
    const activities = [];
    
    // Add recent bookings
    recentBookings.slice(0, 5).forEach((booking, index) => {
      activities.push({
        id: `booking-${booking.id || index}`,
        type: "booking",
        title: `Booking ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`,
        description: `${booking.service} with ${booking.worker}`,
        timestamp: new Date(booking.date || Date.now() - index * 60 * 60 * 1000),
        user: {
          name: booking.worker || "Worker",
          initials: (booking.worker || "W").charAt(0).toUpperCase()
        },
        status: booking.status,
        amount: booking.amount ? `$${booking.amount}` : undefined
      });
    });

    // Add payment activities if applicable
    const totalSpent = dashboardStats?.overview.total_spent || customerStats.totalSpent;
    if (totalSpent > 100) {
      activities.push({
        id: 'payment-activity',
        type: 'payment',
        title: 'Payment Activity',
        description: `You've spent $${totalSpent.toFixed(2)} on services`,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        user: {
          name: 'System',
          initials: 'S'
        },
        status: 'completed',
        amount: `$${totalSpent.toFixed(2)}`
      });
    }

    // Add review activity if applicable
    const averageRating = dashboardStats?.overview.average_rating || customerStats.averageRating;
    if (averageRating > 0) {
      activities.push({
        id: 'review-activity',
        type: 'review',
        title: 'Review Submitted',
        description: `You rated a service ${averageRating.toFixed(1)} stars`,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        user: {
          name: 'System',
          initials: 'S'
        },
        status: 'completed'
      });
    }

    // Sort by timestamp and take latest 5
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  })();

  const handleBookNow = (service: any) => {
    setSelectedService(service);
    setCheckoutDialog(true);
  };

  const handleBookService = async () => {
    try {
      // Create booking checkout session
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          workerId: selectedService.worker_id,
          ...bookingForm
        })
      });
      
      if (response.ok) {
        toast({ 
          title: "Success", 
          description: "Booking request sent! Worker will be notified." 
        });
        setCheckoutDialog(false);
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to create booking", 
        variant: "destructive" 
      });
    }
  };

  const handleProfileFormChange = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsFormChange = (field: string, value: any) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMessageFormChange = (field: string, value: string) => {
    setMessageForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReviewFormChange = (field: string, value: any) => {
    setReviewForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBookingFormChange = (field: string, value: string) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
  };

  const renderDashboardContent = () => {
    switch (section) {
      case 'requests':
        return <ServiceRequestsDashboard />;
      case 'bookings':
        return <CustomerBookings />;
      case 'profile':
        return renderProfile();
      case 'settings':
        return renderSettings();
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome back! <span className='!text-yellow-700'>🎉</span>
              </h1>
              <p className=" text-muted-foreground">
                Discover amazing services and manage your bookings with ease
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Active Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Important Updates</h3>
          </div>
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 shadow-lg transition-all duration-200 hover:shadow-xl ${
                alert.type === 'error' ? 'border-l-destructive bg-gradient-to-r from-destructive/10 to-red-100/50' :
                alert.type === 'warning' ? 'border-l-warning bg-gradient-to-r from-warning/10 to-orange-100/50' :
                alert.type === 'success' ? 'border-l-success bg-gradient-to-r from-success/10 to-green-100/50' :
                'border-l-primary bg-gradient-to-r from-primary/10 to-blue-100/50'
                }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        alert.type === 'error' ? 'bg-destructive/20' :
                        alert.type === 'warning' ? 'bg-warning/20' :
                        alert.type === 'success' ? 'bg-success/20' :
                        'bg-primary/20'
                      }`}>
                        {alert.type === 'error' ? <Bell className="h-6 w-6 text-destructive" /> :
                         alert.type === 'warning' ? <Bell className="h-6 w-6 text-warning" /> :
                         alert.type === 'success' ? <Bell className="h-6 w-6 text-success" /> :
                         <Bell className="h-6 w-6 text-primary" />}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={() => window.location.href = alert.link}
                      className="hover:scale-105 transition-transform"
                    >
                      {alert.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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



      {/* Stats */}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Statistics from Laravel Backend */}
      {dashboardStats && (
        <>
          {/* Service Requests & Offers Stats */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Service Requests & Offers</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-transparent hover:border-indigo-200 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.service_requests.total_requests}</p>
                      <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        {dashboardStats.service_requests.pending_requests} pending
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-transparent hover:border-orange-200 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.offers.pending_offers}</p>
                      <p className="text-sm font-medium text-gray-600">Pending Offers</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        {dashboardStats.offers.accepted_offers} accepted
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-transparent hover:border-pink-200 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.recent_activity.unread_notifications}</p>
                      <p className="text-sm font-medium text-gray-600">Notifications</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        New updates
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Monthly Spending Chart */}
          {dashboardStats.monthly_spending.length > 0 && (
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
                    {dashboardStats.monthly_spending.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-primary rounded-full" />
                          <span className="font-medium">{month.month}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">${Number(month.amount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Services */}
          {dashboardStats.top_services.length > 0 && (
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
                    {dashboardStats.top_services.map((service, index) => (
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
                          <p className="text-lg font-bold text-green-600">${Number((service as any).total_spent || 0).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Total spent</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Bookings from Backend */}
          {dashboardStats.recent_bookings_details.length > 0 && (
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
                    {dashboardStats.recent_bookings_details.map((booking) => (
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
                          <p className="text-lg font-bold text-green-600 mt-1">${Number((booking as any).total_amount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Real-time Activity from Backend */}
      {activities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <RecentActivity 
            activities={activities.map(activity => ({
              ...activity,
              type: activity.type === 'service_request' ? 'booking' : 
                    activity.type === 'offer' ? 'new_booking' : 'booking',
              amount: activity.amount ? `$${activity.amount}` : undefined,
              timestamp: new Date(activity.date),
              user: {
                name: 'System',
                initials: 'S'
              }
            }))} 
            variant="customer" 
            title="Latest Updates" 
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Bookings & Activity</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Bookings */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Clock className="h-5 w-5" />
                <span>Upcoming Bookings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming bookings</p>
                    <p className="text-sm">Ready to book your next service?</p>
                  </div>
                ) : (
                  upcomingBookings.map((booking, index) => (
                    <div key={index} className="p-4 border border-blue-100 rounded-lg hover:bg-blue-50/50 transition-all duration-200 hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-sm text-blue-900">{booking.service}</p>
                          <p className="text-xs text-blue-600">{booking.worker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-blue-700">{booking.date}</p>
                          <p className="text-xs text-blue-500">{booking.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-blue-600">
                        <MapPin className="h-3 w-3" />
                        <span>{booking.location}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities} variant="customer" title="Recent Activity" />
        </div>
      </div>
    </div>

      {/* Recent Bookings Table */}
      {/* <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-800">Recent Bookings</h3>
        </div>
        <DataTable
          title="Recent Bookings"
          columns={bookingColumns}
          data={recentBookings}
          variant="bookings"
          onView={(booking) => console.log('View booking:', booking)}
          onEdit={(booking) => console.log('Edit booking:', booking)}
        />
      </div> */}
    </div>
  );

 

  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">Messages</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {messages?.conversations?.map((conversation, index) => (
              <div key={index} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{conversation.worker_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{conversation.last_message}</p>
                  </div>
                  {conversation.unread_count > 0 && (
                    <Badge variant="destructive" className="rounded-full">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-96 border rounded-lg p-4 overflow-y-auto space-y-4">
              {messages?.activeChat?.map((message, index) => (
                <div key={index} className={`flex ${message.is_sender ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    message.is_sender 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{message.message_text}</p>
                    <p className="text-xs opacity-70 mt-1">{new Date(message.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={messageForm.message}
                onChange={(e) => handleMessageFormChange('message', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(messageForm.receiverId, messageForm.message)}
              />
              <Button onClick={() => sendMessage(messageForm.receiverId, messageForm.message)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">Payment History</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-success/10 rounded-full">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(dashboardStats?.overview.total_spent || customerStats.totalSpent).toFixed(2)}</p>
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
                <p className="text-2xl font-bold">{payments?.length || 0}</p>
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
                <p className="text-2xl font-bold">${payments?.reduce((sum, p) => sum + p.commission_amount, 0) || 0}</p>
                <p className="text-muted-foreground">Platform Fees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <DataTable
            title="Payment History"
            columns={[
              { key: 'service', label: 'Service' },
              { key: 'worker', label: 'Worker' },
              { key: 'date', label: 'Date' },
              { 
                key: 'totalAmount', 
                label: 'Total Amount',
                render: (value) => <span className="font-medium text-success">${value}</span>
              },
              { 
                key: 'workerPayout', 
                label: 'Worker Payout',
                render: (value) => <span className="text-muted-foreground">${value}</span>
              },
              { 
                key: 'commissionAmount', 
                label: 'Platform Fee',
                render: (value) => <span className="text-warning">${value}</span>
              }
            ]}
            data={payments || []}
            onView={(payment) => console.log('View payment:', payment)}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">My Reviews</h1>
        <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Write Review
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Star
                      key={rating}
                      className={`h-6 w-6 cursor-pointer ${
                        rating <= reviewForm.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                      onClick={() => handleReviewFormChange('rating', rating)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={reviewForm.comment}
                  onChange={(e) => handleReviewFormChange('comment', e.target.value)}
                  placeholder="Share your experience..."
                />
              </div>
              <Button onClick={() => createReview(reviewForm.bookingId, reviewForm.rating, reviewForm.comment)} className="w-full">
                Submit Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews?.map((review, index) => (
          <Card key={index} className="border-gradient">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{review.service_title}</h3>
                  <p className="text-sm text-muted-foreground">{review.worker_name}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">{review.comment}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) => handleProfileFormChange('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) => handleProfileFormChange('lastName', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => handleProfileFormChange('phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileForm.location}
                onChange={(e) => handleProfileFormChange('location', e.target.value)}
                placeholder="City, State"
              />
            </div>
            <Button onClick={() => updateProfile(profileForm)} className="w-full">
              Update Profile
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold">{profile?.first_name} {profile?.last_name}</h3>
              <p className="text-sm text-muted-foreground">Customer since {new Date(profile?.created_at || new Date()).getFullYear()}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bookings</span>
                <span className="font-medium">{dashboardStats?.overview.total_bookings || customerStats.totalBookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-medium">${(dashboardStats?.overview.total_spent || customerStats.totalSpent).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Favorite Workers</span>
                <span className="font-medium">{customerStats.favoriteWorkers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive booking updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.emailNotifications}
                onChange={(e) => handleSettingsFormChange('emailNotifications', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive urgent updates via SMS</p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.smsNotifications}
                onChange={(e) => handleSettingsFormChange('smsNotifications', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Browser push notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.pushNotifications}
                onChange={(e) => handleSettingsFormChange('pushNotifications', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Marketing Emails</Label>
                <p className="text-xs text-muted-foreground">Promotional offers and news</p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.marketingEmails}
                onChange={(e) => handleSettingsFormChange('marketingEmails', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Booking Reminders</Label>
                <p className="text-xs text-muted-foreground">Reminders for upcoming bookings</p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.bookingReminders}
                onChange={(e) => handleSettingsFormChange('bookingReminders', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Offer Notifications</Label>
                <p className="text-xs text-muted-foreground">New offers from workers</p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.offerNotifications}
                onChange={(e) => handleSettingsFormChange('offerNotifications', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Privacy & Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Profile Visibility</Label>
              <select
                value={settingsForm.profileVisibility}
                onChange={(e) => handleSettingsFormChange('profileVisibility', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="public">Public - Visible to all workers</option>
                <option value="limited">Limited - Only after booking</option>
                <option value="private">Private - Name and rating only</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Control who can see your profile details</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button size="sm" variant="outline">
                {settingsForm.twoFactorEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
            
            <div className="pt-2">
              <Button variant="outline" className="w-full mb-2">
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Download My Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>App Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Language</Label>
              <select
                value={settingsForm.language}
                onChange={(e) => handleSettingsFormChange('language', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Timezone</Label>
              <select
                value={settingsForm.timezone}
                onChange={(e) => handleSettingsFormChange('timezone', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Currency</Label>
              <select
                value={settingsForm.currency}
                onChange={(e) => handleSettingsFormChange('currency', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
              </select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <select
                value={settingsForm.theme}
                onChange={(e) => handleSettingsFormChange('theme', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="system">System Default</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Account Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Export Booking History
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Request Account Deletion
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            
            <div className="pt-4 border-t">
              <Button className="w-full" onClick={() => toast({ 
                title: "Settings saved!", 
                description: "Your preferences have been updated." 
              })}>
                Save All Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Settings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email Notifications:</span>
              <Badge variant={settingsForm.emailNotifications ? "default" : "secondary"}>
                {settingsForm.emailNotifications ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profile Visibility:</span>
              <Badge variant="outline">{settingsForm.profileVisibility}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Language:</span>
              <Badge variant="outline">{settingsForm.language.toUpperCase()}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency:</span>
              <Badge variant="outline">{settingsForm.currency}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">2FA Status:</span>
              <Badge variant={settingsForm.twoFactorEnabled ? "default" : "destructive"}>
                {settingsForm.twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Theme:</span>
              <Badge variant="outline">{settingsForm.theme}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (customerDataLoading || dashboardLoading) {
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

  // Show error state if dashboard data failed to load
  if (dashboardError) {
    return (
      <DashboardLayout userType="customer" title="Customer Dashboard">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Error Loading Dashboard Data</h2>
              <p className="text-muted-foreground mb-4">{dashboardError}</p>
              <Button onClick={refetchDashboard}>
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
      {renderDashboardContent()}
      
      {/* Booking Checkout Dialog */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">{selectedService?.title}</h3>
              <p className="text-sm text-muted-foreground">{selectedService?.provider}</p>
              <p className="text-lg font-bold text-primary">${selectedService?.price_min}-${selectedService?.price_max}</p>
            </div>
            
            <div>
              <Label htmlFor="scheduledDate">Preferred Date & Time</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={bookingForm.scheduledDate}
                onChange={(e) => handleBookingFormChange('scheduledDate', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="address">Service Address</Label>
              <Input
                id="address"
                value={bookingForm.address}
                onChange={(e) => handleBookingFormChange('address', e.target.value)}
                placeholder="Enter your address"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Special Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={bookingForm.notes}
                onChange={(e) => handleBookingFormChange('notes', e.target.value)}
                placeholder="Any special requirements..."
              />
            </div>
            
            <Button onClick={handleBookService} className="w-full">
              Book Now & Notify Worker
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dynamic Alerts Toast - Shows each alert for 3 seconds */}
      <div className="mb-8">
        <DynamicAlertsToastCustomer
          alerts={alerts}
          isVisible={showAlertsToast}
          onClose={() => setShowAlertsToast(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
