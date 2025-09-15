import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DataTable } from '@/components/dashboard/DataTable';
import { PaginatedDataTable } from '@/components/dashboard/PaginatedDataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminBookings } from '@/hooks/useAdminBookings';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  DollarSign, 
  Briefcase, 
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Shield,
  Star,
  Clock,
  MapPin,
  Calendar,
  Search,
  Filter,
  Hash,
  User,
  Eye
} from 'lucide-react';

const AdminDashboard = () => {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const currentSection = urlParams.get('section') || 'dashboard';
  const { loading, stats, recentWorkers, recentBookings, allUsers, platformStats, systemAlerts } = useAdminData();

  // Bookings section pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  
  // View dialog state
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const { 
    loading: bookingsLoading, 
    bookings, 
    totalCount, 
    stats: bookingStats 
  } = useAdminBookings(
    currentPage,
    pageSize,
    { search: searchTerm, status: filterStatus, period: filterPeriod }
  );

  // Fetch latest notifications from database
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <DashboardLayout userType="admin" title={`Admin ${currentSection === 'dashboard' ? 'Dashboard' : currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading {currentSection}...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'users': return 'User Management';
      case 'workers': return 'Worker Management';
      case 'services': return 'Service Management';
      case 'bookings': return 'Booking Management';
      case 'payments': return 'Payment Management';
      case 'reviews': return 'Review Management';
      case 'analytics': return 'Analytics & Reports';
      case 'reports': return 'Reports';
      case 'settings': return 'System Settings';
      default: return 'Admin Dashboard';
    }
  };

  // Define booking columns outside the render function to avoid hoisting issues
  const bookingColumns = [
    { 
      key: 'sr_number', 
      label: 'SR #',
      render: (value: any, row: any) => {
        // Find the index of this row in the data array
        const index = recentBookings.findIndex(booking => booking.id === row.id);
        return (
          <div className="">
            <span className="font-bold text-primary text-sm">{index + 1}</span>
          </div>
        );
      }
    },
    { 
      key: 'service_title', 
      label: 'Service',
      render: (value: string, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Briefcase className="h-3 w-3 text-primary" />
            <p className="font-medium text-foreground">
              {value ?? (typeof row.service === 'string' ? row.service : row.service?.title) ?? 'Unknown Service'}
            </p>
          </div>
          {(row.service_category || row.serviceCategory || row.service?.category?.name) && (
            <Badge variant="outline" className="text-xs">
              {row.service_category || row.serviceCategory || row.service?.category?.name}
            </Badge>
          )}
        </div>
      )
    },
    { 
      key: 'customer_name', 
      label: 'Customer',
      render: (value: string, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-primary" />
            <p className="font-medium text-foreground">{value ?? row.customer ?? 'Unknown Customer'}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="truncate">{row.customer_id?.slice(-8) || 'N/A'}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'worker_name', 
      label: 'Worker',
      render: (value: string, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-primary" />
            <p className="font-medium text-foreground">{value ?? row.worker ?? 'Unknown Worker'}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="truncate">{row.worker_id?.slice(-8) || 'N/A'}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'total_amount', 
      label: 'Amount',
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-emerald-600" />
          <span className="font-semibold text-emerald-600">{value ? `$${value}` : 'TBD'}</span>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => {
        const statusConfig = {
          completed: { variant: 'default' as const, color: 'bg-emerald-500/10 text-emerald-700' },
          pending: { variant: 'secondary' as const, color: 'bg-amber-500/10 text-amber-700' },
          confirmed: { variant: 'outline' as const, color: 'bg-blue-500/10 text-blue-700' },
          cancelled: { variant: 'destructive' as const, color: 'bg-red-500/10 text-red-700' }
        };
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
        
        return (
          <Badge variant={config.variant} className={`${config.color} font-medium capitalize`}>
            {value || 'pending'}
          </Badge>
        )
      }
    },
    { 
      key: 'scheduled_date', 
      label: 'Date',
      render: (value: string) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" />
            <p className="font-medium text-sm">{new Date(value).toLocaleDateString()}</p>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(value).toLocaleTimeString()}</p>
        </div>
      )
    }
  ];

  const renderSectionContent = () => {
    switch (currentSection) {
      case 'users':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Users"
                value={stats.totalUsers.toString()}
                change="+12% this month"
                changeType="positive"
                icon={Users}
              />
              <StatCard
                title="Customers"
                value={stats.totalCustomers.toString()}
                change="+8% this month"
                changeType="positive"
                icon={UserCheck}
              />
              <StatCard
                title="Workers"
                value={stats.totalWorkers.toString()}
                change="+5 this week"
                changeType="positive"
                icon={TrendingUp}
              />
            </div>
            <DataTable
              title="All Users"
              columns={[
                { 
                  key: 'name', 
                  label: 'Name',
                  render: (value: any, row: any) => (
                    <div>
                      <p className="font-medium">{row.first_name} {row.last_name}</p>
                      <p className="text-xs text-muted-foreground">{row.phone || 'No phone'}</p>
                    </div>
                  )
                },
                { 
                  key: 'user_type', 
                  label: 'Type',
                  render: (value: string) => (
                    <Badge variant={value === 'admin' ? 'destructive' : value === 'worker' ? 'default' : 'secondary'}>
                      {value}
                    </Badge>
                  )
                },
                { key: 'location', label: 'Location' },
                { 
                  key: 'created_at', 
                  label: 'Joined',
                  render: (value: string) => new Date(value).toLocaleDateString()
                }
              ]}
              data={allUsers}
              onView={(user) => console.log('View user:', user)}
              onEdit={(user) => console.log('Edit user:', user)}
            />
          </div>
        );

      case 'workers':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Workers"
                value={recentWorkers.length.toString()}
                change="+5 this week"
                changeType="positive"
                icon={UserCheck}
              />
              <StatCard
                title="Verified Workers"
                value={recentWorkers.filter(w => w.status === 'verified').length.toString()}
                change="+3 this week"
                changeType="positive"
                icon={Shield}
              />
              <StatCard
                title="Pending Verification"
                value={recentWorkers.filter(w => w.status === 'pending').length.toString()}
                change="2 pending"
                changeType="neutral"
                icon={Clock}
              />
              <StatCard
                title="Average Rating"
                value="4.8"
                change="+0.2 this month"
                changeType="positive"
                icon={Star}
              />
            </div>
            <DataTable
              title="Worker Management"
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'rating', label: 'Rating' },
                { key: 'status', label: 'Status' },
                { key: 'experience', label: 'Experience' },
                { key: 'hourlyRate', label: 'Rate' }
              ]}
              data={recentWorkers}
              onView={(worker) => console.log('View worker:', worker)}
              onEdit={(worker) => console.log('Edit worker:', worker)}
              onDelete={(worker) => console.log('Delete worker:', worker)}
            />
          </div>
        );

      case 'bookings':

        return (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Bookings"
                value={bookingStats.totalBookings.toString()}
                change="+15 today"
                changeType="positive"
                icon={Calendar}
              />
              <StatCard
                title="Completed"
                value={bookingStats.completedBookings.toString()}
                change="+45 this week"
                changeType="positive"
                icon={UserCheck}
              />
              <StatCard
                title="Pending"
                value={bookingStats.pendingBookings.toString()}
                change="awaiting action"
                changeType="neutral"
                icon={Clock}
              />
              <StatCard
                title="Revenue"
                value={`$${bookingStats.totalRevenue.toLocaleString()}`}
                change="+12% this month"
                changeType="positive"
                icon={DollarSign}
              />
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="bg-muted/30 rounded-t-lg border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Filter className="h-4 w-4 text-primary" />
                  </div>
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Search Bookings</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by customer, worker, service, booking ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-border/60 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="border-border/60 focus:border-primary transition-colors">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Period</label>
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger className="border-border/60 focus:border-primary transition-colors">
                        <SelectValue placeholder="Filter by period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paginated Bookings Table */}
            <PaginatedDataTable
              title="Bookings Management"
              columns={bookingColumns}
              data={bookings}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              loading={bookingsLoading}
              onPageChange={setCurrentPage}
              onView={(booking) => {
                setSelectedBooking(booking);
                setIsViewDialogOpen(true);
              }}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Admin Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Button 
                variant="outline" 
                className="h-32 flex flex-col items-center justify-center space-y-3 worker-card hover:border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 py-8 px-6 hover:shadow-xl hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/admin/workers?filter=pending'}
              >
                <div className="p-3 bg-primary/10 rounded-full">
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-semibold text-foreground">Verify Workers</div>
                  <div className="text-xs text-muted-foreground">
                    {recentWorkers.filter(w => w.status === 'pending').length} pending verification
                  </div>
                </div>
              </Button>
              
              <Button variant="outline" className="h-32 flex flex-col items-center justify-center space-y-3 worker-card hover:border-primary/30 bg-gradient-to-br from-warning/5 to-warning/10 py-8 px-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="p-3 bg-warning/10 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-semibold text-foreground">Review Reports</div>
                  <div className="text-xs text-muted-foreground">Check system issues</div>
                </div>
              </Button>
              
              <Button variant="outline" className="h-32 flex flex-col items-center justify-center space-y-3 worker-card hover:border-primary/30 bg-gradient-to-br from-success/5 to-success/10 py-8 px-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="p-3 bg-success/10 rounded-full">
                  <Shield className="h-8 w-8 text-success" />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-semibold text-foreground">Security</div>
                  <div className="text-xs text-muted-foreground">Platform safety center</div>
                </div>
              </Button>
              
              <Button variant="outline" className="h-32 flex flex-col items-center justify-center space-y-3 worker-card hover:border-primary/30 bg-gradient-to-br from-accent to-muted/50 py-8 px-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-semibold text-foreground">Analytics</div>
                  <div className="text-xs text-muted-foreground">View platform insights</div>
                </div>
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsConfig.map((stat, index) => {
                const backgrounds = [
                  'bg-gradient-to-br from-primary/8 to-primary/5',
                  'bg-gradient-to-br from-success/8 to-success/5', 
                  'bg-gradient-to-br from-warning/8 to-warning/5',
                  'bg-gradient-to-br from-accent to-muted/30'
                ];
                return (
                  <StatCard key={index} {...stat} className={`worker-card ${backgrounds[index % 4]}`} />
                );
              })}
            </div>

            {/* Overview Cards - Full Width */}
            <div className="space-y-6">
              {/* Platform Health - Full Width */}
              {/* <Card className="worker-card bg-gradient-to-br from-success/8 to-success/5 border-success/20">
                <CardHeader className="pb-4 border-b border-success/10">
                  <CardTitle className="flex items-center space-x-3 text-foreground">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <Shield className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Platform Health</h3>
                      <p className="text-sm text-muted-foreground font-normal">Real-time system performance metrics</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="text-center p-4 bg-success/5 rounded-xl border border-success/10">
                      <div className="text-2xl font-bold text-success mb-1">{platformStats.jobsCompleted}</div>
                      <div className="text-sm text-muted-foreground">Jobs Completed</div>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="text-2xl font-bold text-primary mb-1">{platformStats.activeWorkers}</div>
                      <div className="text-sm text-muted-foreground">Active Workers</div>
                    </div>
                    <div className="text-center p-4 bg-success/5 rounded-xl border border-success/10">
                      <div className="text-2xl font-bold text-success mb-1">{platformStats.customerSatisfaction}%</div>
                      <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                    </div>
                    <div className="text-center p-4 bg-warning/5 rounded-xl border border-warning/10">
                      <div className="text-2xl font-bold text-warning mb-1">2.4 min</div>
                      <div className="text-sm text-muted-foreground">Response Time</div>
                    </div>
                    <div className="text-center p-4 bg-success/5 rounded-xl border border-success/10">
                      <div className="text-2xl font-bold text-success mb-1">99.9%</div>
                      <div className="text-sm text-muted-foreground">Platform Uptime</div>
                    </div>
                  </div>
                </CardContent>
              </Card> */}

              {/* Financial Overview - Full Width */}
              <Card className="worker-card bg-gradient-to-br from-primary/8 to-primary/5 border-primary/20">
                <CardHeader className="pb-4 border-b border-primary/10">
                  <CardTitle className="flex items-center space-x-3 text-foreground">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Financial Overview</h3>
                      <p className="text-sm text-muted-foreground font-normal">Revenue and payment analytics</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="text-center p-4 bg-success/5 rounded-xl border border-success/10">
                      <div className="text-2xl font-bold text-success mb-1">${stats.totalRevenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="text-2xl font-bold text-primary mb-1">${platformStats.platformFees.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Platform Fees</div>
                    </div>
                    <div className="text-center p-4 bg-accent/50 rounded-xl border border-border">
                      <div className="text-2xl font-bold text-foreground mb-1">${(stats.totalRevenue - platformStats.platformFees).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Worker Payouts</div>
                    </div>
                    <div className="text-center p-4 bg-destructive/5 rounded-xl border border-destructive/10">
                      <div className="text-2xl font-bold text-destructive mb-1">$892</div>
                      <div className="text-sm text-muted-foreground">Refunds</div>
                    </div>
                    <div className="text-center p-4 bg-success/5 rounded-xl border border-success/10">
                      <div className="text-2xl font-bold text-success mb-1">${(platformStats.platformFees - 892).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Net Profit</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Alerts - Full Width */}
              <Card className="worker-card bg-gradient-to-br from-warning/8 to-warning/5 border-warning/20">
                <CardHeader className="pb-4 border-b border-warning/10">
                  <CardTitle className="flex items-center space-x-3 text-foreground">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold">Admin Alerts</h3>
                        {systemAlerts.length > 0 && (
                          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                            {systemAlerts.length} Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-normal">Recent activity and notifications</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">Recent Activities</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={fetchNotifications}
                          disabled={notificationsLoading}
                        >
                          {notificationsLoading ? 'Loading...' : 'Refresh'}
                        </Button>
                      </div>
                      {notificationsLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p>Loading notifications...</p>
                        </div>
                      ) : recentActivities.length > 0 ? (
                        <RecentActivity activities={recentActivities} title="" />
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                          </div>
                          <p className="font-medium text-foreground">No notifications yet</p>
                          <p className="text-sm">Recent activities will appear here once they occur</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground mb-3">System Alerts</h4>
                      <div className="space-y-3">
                        {systemAlerts.length > 0 ? systemAlerts.slice(0, 4).map((alert, index) => (
                          <div key={alert.id || index} className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-xl hover:shadow-md transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                alert.type === 'urgent' ? 'bg-destructive' :
                                alert.type === 'warning' ? 'bg-warning' : 'bg-primary'
                              }`} />
                              <span className="text-sm font-medium text-foreground">{alert.message}</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => alert.link && (window.location.href = alert.link)}
                            >
                              {alert.action}
                            </Button>
                          </div>
                        )) : (
                          <div className="text-center py-8 text-muted-foreground bg-background/30 rounded-xl border border-dashed border-border">
                            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50 text-success" />
                            <p className="font-medium text-success">All Systems Operational</p>
                            <p className="text-sm">No alerts at this time - platform running smoothly</p>
                          </div>
                        )}
                        
                        {/* Show count indicator if there are more than 4 alerts */}
                        {systemAlerts.length > 4 && (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            Showing latest 4 of {systemAlerts.length} alerts
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Tables */}
            <div className="grid grid-cols-1 gap-6">
              <Card className="worker-card bg-gradient-to-br from-accent to-muted/50 border-border/50">
                <DataTable
                  title="Recent Worker Applications"
                  columns={workerColumns}
                  data={recentWorkers}
                  onView={(worker) => console.log('View worker:', worker)}
                  onEdit={(worker) => console.log('Edit worker:', worker)}
                  onDelete={(worker) => console.log('Delete worker:', worker)}
                />
              </Card>

              <Card className="worker-card bg-gradient-to-br from-muted/30 to-accent border-border/50">
                <DataTable
                  title="Recent Bookings"
                  columns={bookingColumns}
                  data={recentBookings}
                  actions={false}
                />
              </Card>
            </div>

          </div>
        );
    }
  };

  // Dynamic stats from database
  const statsConfig = [
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      change: "+573 new this month",
      changeType: "positive" as const,
      icon: Users
    },
    {
      title: "Platform Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: "+12% from last month", 
      changeType: "positive" as const,
      icon: DollarSign
    },
    {
      title: "Active Bookings",
      value: stats.activeBookings.toString(),
      change: "+89 today",
      changeType: "positive" as const,
      icon: Briefcase
    },
    {
      title: "Growth Rate",
      value: `+${stats.growthRate}%`,
      change: "vs last quarter",
      changeType: "positive" as const,
      icon: TrendingUp
    }
  ];

        // Helper functions to convert notification types
  const getNotificationType = (type: string) => {
    switch (type) {
      case 'worker_account_deactivated':
      case 'account_deactivated':
        return 'user' as const;
      case 'new_booking':
      case 'booking_created':
        return 'booking' as const;
      case 'payment_received':
      case 'payment_processed':
        return 'payment' as const;
      case 'new_review':
      case 'review_submitted':
        return 'review' as const;
      default:
        return 'user' as const;
    }
  };

  const getNotificationStatus = (type: string) => {
    switch (type) {
      case 'worker_account_deactivated':
      case 'account_deactivated':
        return 'completed';
      case 'new_booking':
      case 'booking_created':
        return 'pending';
      case 'payment_received':
      case 'payment_processed':
        return 'completed';
      case 'new_review':
      case 'review_submitted':
        return 'completed';
      default:
        return 'pending';
    }
  };

  const getNotificationUser = (type: string) => {
    switch (type) {
      case 'worker_account_deactivated':
        return 'Admin Action';
      case 'account_deactivated':
        return 'System';
      case 'new_booking':
      case 'booking_created':
        return 'Customer';
      case 'payment_received':
      case 'payment_processed':
        return 'Payment System';
      case 'new_review':
      case 'review_submitted':
        return 'Customer';
      default:
        return 'System';
    }
  };

  const getNotificationInitials = (type: string) => {
    switch (type) {
      case 'worker_account_deactivated':
        return 'AA';
      case 'account_deactivated':
        return 'S';
      case 'new_booking':
      case 'booking_created':
        return 'C';
      case 'payment_received':
      case 'payment_processed':
        return 'PS';
      case 'new_review':
      case 'review_submitted':
        return 'C';
      default:
        return 'S';
    }
  };

  // Convert notifications to activities format
  const recentActivities = notifications.map(notification => ({
    id: notification.id,
    type: getNotificationType(notification.type),
    title: notification.title,
    description: notification.message,
    timestamp: new Date(notification.created_at),
    status: getNotificationStatus(notification.type),
    user: {
      name: getNotificationUser(notification.type),
      initials: getNotificationInitials(notification.type)
    }
  }));

  const workerColumns = [
    { key: 'name', label: 'Name' },
    { key: 'rating', label: 'Rating' },
    { key: 'status', label: 'Status' },
    { key: 'experience', label: 'Experience' }
  ];

  return (
    <DashboardLayout userType="admin" title={getSectionTitle()}>
      {renderSectionContent()}
      
      {/* Booking View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6 p-6">
              {/* Booking Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Booking ID</label>
                      <p className="font-mono text-sm">#{selectedBooking.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge 
                          variant={selectedBooking.status === 'completed' ? 'default' : 
                                   selectedBooking.status === 'confirmed' ? 'outline' : 'secondary'}
                          className="capitalize"
                        >
                          {selectedBooking.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Scheduled Date</label>
                      <p>{new Date(selectedBooking.scheduled_date).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Duration</label>
                      <p>{selectedBooking.duration_hours} hours</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                      <p className="font-semibold text-emerald-600">${selectedBooking.total_amount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p>{new Date(selectedBooking.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {selectedBooking.address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p>{selectedBooking.address}</p>
                    </div>
                  )}
                  
                  {selectedBooking.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <p className="text-sm bg-muted p-3 rounded-md">{selectedBooking.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer & Worker Details */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Name</label>
                       <p className="font-medium">{selectedBooking.customer}</p>
                     </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                      <p className="font-mono text-sm">#{selectedBooking.customer_id?.slice(-8)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Worker Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Name</label>
                       <p className="font-medium">{selectedBooking.worker}</p>
                     </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Worker ID</label>
                      <p className="font-mono text-sm">#{selectedBooking.worker_id?.slice(-8)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Service Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Service Title</label>
                       <p className="font-medium">{selectedBooking.service_title || 'No Service'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Category</label>
                       <p>{selectedBooking.service_category || 'N/A'}</p>
                     </div>
                    {selectedBooking.service_id && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Service ID</label>
                        <p className="font-mono text-sm">#{selectedBooking.service_id.slice(-8)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                      <p className="text-lg font-semibold text-emerald-600">${selectedBooking.total_amount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Commission ({(selectedBooking.commission_rate * 100).toFixed(1)}%)</label>
                      <p className="text-lg font-semibold text-orange-600">${selectedBooking.commission_amount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Worker Payout</label>
                      <p className="text-lg font-semibold text-blue-600">${selectedBooking.worker_payout}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                        <Badge variant="outline" className="mt-1">
                          {selectedBooking.stripe_payment_status || 'Pending'}
                        </Badge>
                      </div>
                      {selectedBooking.stripe_session_id && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Stripe Session</label>
                          <p className="font-mono text-xs">{selectedBooking.stripe_session_id.slice(-16)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Status Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium">Booking Created</p>
                        <p className="text-sm text-muted-foreground">{new Date(selectedBooking.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {selectedBooking.worker_completed_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Work Completed</p>
                          <p className="text-sm text-muted-foreground">{new Date(selectedBooking.worker_completed_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedBooking.customer_confirmed_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Customer Confirmed</p>
                          <p className="text-sm text-muted-foreground">{new Date(selectedBooking.customer_confirmed_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDashboard;