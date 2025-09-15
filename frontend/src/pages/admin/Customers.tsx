/**
 * Admin Customers Page
 * 
 * FIXED: Reloading issue when switching between browser tabs/windows
 * - Removed aggressive real-time Supabase subscriptions
 * - Added intelligent data fetching with debouncing
 * - Implemented page visibility and focus/blur event handling
 * - Added data version tracking to prevent unnecessary re-renders
 * - Used React.memo and useCallback for performance optimization
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  MapPin, 
  Phone,
  Calendar,
  DollarSign,
  Star,
  Eye,
  Mail,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  BarChart3,
  CreditCard,
  MessageSquare,
  FileText
} from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  user_type: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
}

interface CustomerStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalSpent: number;
  avgOrderValue: number;
  lastBookingDate: string | null;
  favoriteServices: string[];
  totalReviews: number;
  avgRating: number;
}

const AdminCustomers = React.memo(() => {
  const { loading, allUsers, allBookings, allPayments, allReviews, refetch, dataVersion } = useAdminData();
  
  // Debug logging with data version tracking
  useEffect(() => {
    console.log('AdminCustomers Debug:', {
      loading,
      dataVersion,
      allUsersCount: allUsers?.length || 0,
      allBookingsCount: allBookings?.length || 0,
      allPaymentsCount: allPayments?.length || 0,
      allReviewsCount: allReviews?.length || 0,
      sampleUser: allUsers?.[0],
      sampleBooking: allBookings?.[0],
      samplePayment: allPayments?.[0],
      sampleReview: allReviews?.[0]
    });
  }, [loading, dataVersion, allUsers, allBookings, allPayments, allReviews]);
  
  // Additional debugging for data structure
  if (allBookings?.length > 0) {
    console.log('Sample Booking Structure:', {
      id: allBookings[0].id,
      customer_id: allBookings[0].customer_id,
      total_amount: allBookings[0].total_amount,
      status: allBookings[0].status,
      service: allBookings[0].service,
      services: allBookings[0].services
    });
  }
  
  if (allPayments?.length > 0) {
    console.log('Sample Payment Structure:', {
      id: allPayments[0].id,
      customer_id: allPayments[0].customer_id,
      total_amount: allPayments[0].total_amount,
      totalAmount: allPayments[0].totalAmount,
      payment_status: allPayments[0].payment_status,
      status: allPayments[0].status,
      method: allPayments[0].method,
      payment_method: allPayments[0].payment_method
    });
  }
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Memoize the getCustomerStats function to prevent recreation on every render
  const getCustomerStats = useCallback((customerId: string): CustomerStats => {
    const customerBookings = allBookings.filter(b => b.customer_id === customerId);
    const customerPayments = allPayments.filter(p => p.customer_id === customerId);
    const customerReviews = allReviews.filter(r => r.reviewer_id === customerId);
    
    const totalSpent = customerPayments.reduce((sum, p) => sum + Number(p.totalAmount || p.total_amount || 0), 0);
    const completedBookings = customerBookings.filter(b => b.status === 'completed');
    const cancelledBookings = customerBookings.filter(b => b.status === 'cancelled');
    const pendingBookings = customerBookings.filter(b => ['pending', 'scheduled', 'in-progress'].includes(b.status));
    
    const lastBooking = customerBookings.length > 0 
      ? customerBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : null;
    
    const favoriteServices = customerBookings
      .map(b => b.service || 'Unknown Service')
      .filter((service, index, arr) => arr.indexOf(service) === index)
      .slice(0, 3);
    
    const avgRating = customerReviews.length > 0 
      ? customerReviews.reduce((sum, r) => sum + Number(r.rating), 0) / customerReviews.length
      : 0;
    
    return {
      totalBookings: customerBookings.length,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
      pendingBookings: pendingBookings.length,
      totalSpent,
      avgOrderValue: customerBookings.length > 0 ? totalSpent / customerBookings.length : 0,
      lastBookingDate: lastBooking?.created_at || null,
      favoriteServices,
      totalReviews: customerReviews.length,
      avgRating
    };
  }, [allBookings, allPayments, allReviews]);

  // Filter customers based on search term and filters
  const filteredCustomers = useMemo(() => {
    let filtered = allUsers.filter(user => user.user_type === 'customer') as Customer[];
    

    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Location filter
    if (filterLocation !== 'all') {
      filtered = filtered.filter(customer => customer.location === filterLocation);
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => {
        const stats = getCustomerStats(customer.id);
        if (filterStatus === 'active') return stats.totalBookings > 0;
        if (filterStatus === 'inactive') return stats.totalBookings === 0;
        if (filterStatus === 'high_value') return stats.totalSpent > 1000;
        if (filterStatus === 'new') {
          const daysSinceCreation = Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceCreation <= 30;
        }
        return true;
      });
    }
    
    // Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      
      filtered = filtered.filter(customer => {
        const createdDate = new Date(customer.created_at);
        if (filterDateRange === 'last_30_days') return createdDate >= thirtyDaysAgo;
        if (filterDateRange === 'last_90_days') return createdDate >= ninetyDaysAgo;
        if (filterDateRange === 'this_year') return createdDate.getFullYear() === now.getFullYear();
        return true;
      });
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Customer];
      let bValue: any = b[sortBy as keyof Customer];
      
      if (sortBy === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }
      
      if (sortBy === 'total_spent' || sortBy === 'total_bookings') {
        const aStats = getCustomerStats(a.id);
        const bStats = getCustomerStats(b.id);
        aValue = sortBy === 'total_spent' ? aStats.totalSpent : aStats.totalBookings;
        bValue = sortBy === 'total_spent' ? bStats.totalSpent : bStats.totalBookings;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [allUsers, searchTerm, filterLocation, filterStatus, filterDateRange, sortBy, sortOrder, getCustomerStats]);

  // Get unique locations for filter
  const locations = useMemo(() => {
    const locs = allUsers
      .filter(user => user.user_type === 'customer' && user.location)
      .map(user => user.location)
      .filter(Boolean);
    return [...new Set(locs)];
  }, [allUsers]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const customers = allUsers.filter(user => user.user_type === 'customer') as Customer[];
    const totalCustomers = customers.length;
    
    const activeCustomers = customers.filter(c => {
      const stats = getCustomerStats(c.id);
      return stats.totalBookings > 0;
    }).length;
    
    const totalRevenue = allPayments.reduce((sum, p) => sum + Number(p.totalAmount || p.total_amount || 0), 0);
    const avgSpendingPerCustomer = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;
    
    const newCustomersThisMonth = customers.filter(c => {
      const createdDate = new Date(c.created_at);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length;
    
    const highValueCustomers = customers.filter(c => {
      const stats = getCustomerStats(c.id);
      return stats.totalSpent > 1000;
    }).length;
    
    return {
      totalCustomers,
      activeCustomers,
      totalRevenue,
      avgSpendingPerCustomer,
      newCustomersThisMonth,
      highValueCustomers
    };
  }, [allUsers, allPayments, getCustomerStats]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Use the manual refresh from the hook instead of page reload
      await refetch();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle customer view
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Customers">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin" title="Customers Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Customer Management</h1>
            <p className="text-muted-foreground">Monitor and manage all platform customers</p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

    

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{summaryStats.totalCustomers}</div>
              <p className="text-xs text-blue-700">Registered customers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Active Customers</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{summaryStats.activeCustomers}</div>
              <p className="text-xs text-green-700">With bookings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">${summaryStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-purple-700">From all customers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">New This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{summaryStats.newCustomersThisMonth}</div>
              <p className="text-xs text-orange-700">Recent signups</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="active">Active (with bookings)</SelectItem>
                  <SelectItem value="inactive">Inactive (no bookings)</SelectItem>
                  <SelectItem value="high_value">High Value (&gt;$1000)</SelectItem>
                  <SelectItem value="new">New (last 30 days)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sorting Options */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Join Date</SelectItem>
                  <SelectItem value="first_name">First Name</SelectItem>
                  <SelectItem value="last_name">Last Name</SelectItem>
                  <SelectItem value="total_bookings">Total Bookings</SelectItem>
                  <SelectItem value="total_spent">Total Spent</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredCustomers.length} of {allUsers.filter(u => u.user_type === 'customer').length} customers
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filters applied:</span>
            {filterLocation !== 'all' && <Badge variant="secondary">{filterLocation}</Badge>}
            {filterStatus !== 'all' && <Badge variant="secondary">{filterStatus}</Badge>}
            {filterDateRange !== 'all' && <Badge variant="secondary">{filterDateRange}</Badge>}
            {searchTerm && <Badge variant="secondary">Search: "{searchTerm}"</Badge>}
          </div>
        </div>

        {/* Enhanced Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bookings</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Spendings</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>

                  
                  {filteredCustomers.map((customer) => {
                    const stats = getCustomerStats(customer.id);
                    

                    
                    return (
                      <tr key={customer.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                            <p className="text-xs text-muted-foreground">ID: {customer.id.slice(-8)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {customer.location || 'Not specified'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium">{stats.totalBookings} bookings</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {stats.completedBookings} completed
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">${stats.totalSpent.toLocaleString()}</span>
                            </div>
                            {stats.totalBookings > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Avg: ${stats.avgOrderValue.toFixed(0)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{new Date(customer.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || filterLocation !== 'all' || filterStatus !== 'all' || filterDateRange !== 'all'
                      ? 'No customers match your current filters'
                      : 'No customers found'
                    }
                  </p>
                  {(searchTerm || filterLocation !== 'all' || filterStatus !== 'all' || filterDateRange !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterLocation('all');
                        setFilterStatus('all');
                        setFilterDateRange('all');
                      }}
                      className="mt-2"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Customer Detail Drawer */}
        <Sheet open={showCustomerModal} onOpenChange={setShowCustomerModal}>
          <SheetContent 
            className="!w-[70vw] !max-w-none !min-w-[500px] h-full overflow-y-auto bg-gray-50" 
            side="right"
          >
            <SheetHeader className="border-b border-gray-200 pb-6 mb-8 bg-white rounded-t-xl p-6">
              <SheetTitle className="flex items-center gap-4 text-3xl font-bold text-gray-800">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="text-gray-900">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</div>
                  <div className="text-base font-medium text-gray-600">Customer Profile</div>
                </div>
              </SheetTitle>
            </SheetHeader>
            {selectedCustomer && (
              <Tabs defaultValue="overview" className="w-full ">
                <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg border border-gray-200 rounded-xl p-2 mb-8 h-[70px]  ">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-6 py-3 font-medium transition-all duration-200">Overview</TabsTrigger>
                  <TabsTrigger value="bookings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-6 py-3 font-medium transition-all duration-200">Bookings</TabsTrigger>
                  <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-6 py-3 font-medium transition-all duration-200">Payments</TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-6 py-3 font-medium transition-all duration-200">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-8 px-6">
                  <div className="grid grid-cols-1  gap-8">
                    {/* Customer Info */}
                    <div className="space-y-6">
                      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                        <h3 className="font-bold text-2xl mb-6 text-gray-800 flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          {selectedCustomer.first_name} {selectedCustomer.last_name}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-700">{selectedCustomer.email}</span>
                          </div>
                          {selectedCustomer.phone && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="p-2 bg-green-100 rounded-full">
                                <Phone className="h-5 w-5 text-green-600" />
                              </div>
                              <span className="font-medium text-gray-700">{selectedCustomer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="p-2 bg-purple-100 rounded-full">
                              <MapPin className="h-5 w-5 text-purple-600" />
                            </div>
                            <span className="font-medium text-gray-700">{selectedCustomer.location || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="p-2 bg-orange-100 rounded-full">
                              <Calendar className="h-5 w-5 text-orange-600" />
                            </div>
                            <span className="font-medium text-gray-700">Joined {new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Customer Statistics */}
                    <div className="space-y-6">
                      {(() => {
                        const stats = getCustomerStats(selectedCustomer.id);
                        return (
                          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                            <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-gray-800">
                              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-full">
                                <BarChart3 className="h-6 w-6 text-white" />
                              </div>
                              Customer Statistics
                            </h4>
                            <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 font-medium">Total Bookings:</span>
                                    <span className="font-bold text-2xl text-blue-600">{stats.totalBookings}</span>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Completed:</span>
                                      <span className="font-semibold text-green-600">{stats.completedBookings}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Cancelled:</span>
                                      <span className="font-semibold text-red-600">{stats.cancelledBookings}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Pending:</span>
                                      <span className="font-semibold text-yellow-600">{stats.pendingBookings}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 font-medium">Total Spent:</span>
                                    <span className="font-bold text-2xl text-green-600">${stats.totalSpent.toLocaleString()}</span>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Avg. Order:</span>
                                      <span className="font-semibold text-gray-700">${stats.avgOrderValue.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Total Reviews:</span>
                                      <span className="font-semibold text-gray-700">{stats.totalReviews}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Avg. Rating:</span>
                                      <span className="font-semibold text-gray-700">{stats.avgRating.toFixed(1)} ⭐</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                 
                </TabsContent>
                
                <TabsContent value="bookings" className="space-y-6 px-6">
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-gray-800">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                        <ShoppingBag className="h-6 w-6 text-white" />
                      </div>
                      Recent Bookings
                    </h4>
                    <div className="space-y-4">
                    {allBookings
                      .filter(b => b.customer_id === selectedCustomer.id)
                      .slice(0, 10)
                      .map((booking, i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                          <div>
                            <p className="font-semibold text-lg text-gray-800">Booking #{booking.id.slice(-8)}</p>
                            <p className="text-gray-600 mb-1">
                              {new Date(booking.scheduled_date || booking.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">{booking.address || 'No address'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl text-gray-800 mb-1">${booking.total_amount || 'TBD'}</p>
                            <Badge variant={
                              booking.status === 'completed' ? 'default' : 
                              booking.status === 'pending' ? 'secondary' : 
                              booking.status === 'cancelled' ? 'destructive' : 'outline'
                            } className="text-xs px-3 py-1 font-medium">
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    {allBookings.filter(b => b.customer_id === selectedCustomer.id).length === 0 && (
                      <p className="text-muted-foreground text-center py-8 text-lg">No bookings found</p>
                    )}
                  </div>
                </div>
                </TabsContent>
                
                <TabsContent value="payments" className="space-y-6 px-6">
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-gray-800">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      Payment History
                    </h4>
                    <div className="space-y-4">
                    {allPayments
                      .filter(p => p.customer_id === selectedCustomer.id)
                      .slice(0, 10)
                      .map((payment, i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                          <div>
                            <p className="font-semibold text-lg text-gray-800">Payment #{payment.id.slice(-8)}</p>
                            <p className="text-gray-600 mb-1">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">{payment.method || payment.payment_method || 'Unknown method'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl text-green-600 mb-1">${payment.totalAmount || payment.total_amount || '0'}</p>
                            <Badge variant={payment.payment_status === 'completed' || payment.status === 'completed' ? 'default' : 'secondary'} className="text-xs px-3 py-1 font-medium">
                              {payment.payment_status || payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    {allPayments.filter(p => p.customer_id === selectedCustomer.id).length === 0 && (
                      <p className="text-muted-foreground text-center py-8 text-lg">No payments found</p>
                    )}
                  </div>
                </div>
                </TabsContent>
                
                <TabsContent value="activity" className="space-y-6 px-6">
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-gray-800">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full">
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      Customer Activity
                    </h4>
                    <div className="space-y-4">
                    {(() => {
                      const stats = getCustomerStats(selectedCustomer.id);
                      const activities = [];
                      
                      if (stats.lastBookingDate) {
                        activities.push({
                          type: 'Last Booking',
                          date: stats.lastBookingDate,
                          description: 'Most recent service request',
                          icon: ShoppingBag
                        });
                      }
                      
                      if (stats.totalReviews > 0) {
                        activities.push({
                          type: 'Reviews',
                          date: 'Recent',
                          description: `${stats.totalReviews} reviews with ${stats.avgRating.toFixed(1)} avg rating`,
                          icon: Star
                        });
                      }
                      
                      activities.push({
                        type: 'Account Created',
                        date: selectedCustomer.created_at,
                        description: 'Customer joined the platform',
                        icon: UserCheck
                      });
                      
                      return activities.length > 0 ? (
                        activities.map((activity, index) => (
                          <div key={index} className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                            <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                              <activity.icon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 text-lg">{activity.type}</p>
                              <p className="text-gray-600">{activity.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 font-medium">{new Date(activity.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8 text-lg">No recent activity</p>
                      );
                    })()}
                  </div>
                </div>
                </TabsContent>
              </Tabs>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
});

export default AdminCustomers;