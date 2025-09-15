import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PaginatedDataTable } from '@/components/dashboard/PaginatedDataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminBookings } from '@/hooks/useAdminBookings';
import { BookingDetailsDrawer } from '@/components/admin/BookingDetailsDrawer';
import { 
  Calendar, 
  Search, 
  Filter,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  Eye,
  MapPin,
  Phone,
  Hash,
  User
} from 'lucide-react';

const AdminBookings = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);
  
  const { loading, bookings, totalCount, stats, updateBookingOptimistically, deleteBookingOptimistically } = useAdminBookings(
    currentPage,
    pageSize,
    { search: searchTerm, status: filterStatus, period: filterPeriod }
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingDrawer(true);
  };

  const bookingColumns = [
    { 
      key: 'id', 
      label: 'Sr #',
      render: (value: string, row: any) => {
        // Find the index of this row in the current bookings array
        const rowIndex = bookings.findIndex(booking => booking.id === value);
        const sequentialNumber = rowIndex >= 0 ? (currentPage - 1) * pageSize + rowIndex + 1 : 1;
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary ">{sequentialNumber}</span>
            </div>
          </div>
        );
      }
    },
    // { 
    //   key: 'service_id', 
    //   label: 'Service ID',
    //   render: (value: string | null, row: any) => (
    //     <div className="space-y-1">
    //       {value ? (
    //         <>
    //           <span className="font-mono text-sm">#{value.slice(-8)}</span>
    //           <div className="flex items-center gap-1 text-xs text-muted-foreground">
    //             <Hash className="h-3 w-3" />
    //             <span className="truncate">{value}</span>
    //           </div>
    //         </>
    //       ) : (
    //         <span className="text-muted-foreground text-sm">No Service</span>
    //       )}
    //     </div>
    //   )
    // },
    { 
      key: 'customer_name', 
      label: 'Customer',
      render: (value: string, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-primary" />
            <p className="font-medium text-foreground">{value}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="truncate">{row.customer_id.slice(-8)}</span>
          </div>
          {/* <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{row.address || 'No address'}</span>
          </div> */}
        </div>
      )
    },
    { 
      key: 'worker_name', 
      label: 'Worker',
      render: (value: string, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-primary" />
            <p className="font-medium text-foreground">{value}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="truncate">{row.worker_id.slice(-8)}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {row.worker_id ? 'Assigned' : 'Unassigned'}
          </Badge>
        </div>
      )
    },
    { 
      key: 'service_title', 
      label: 'Service & Category',
      render: (value: string | null, row: any) => {
        const hasService = value && value !== 'Unknown Service';
        const hasCategory = row.service_category && row.service_category !== 'Uncategorized';
        
        return (
          <div className="space-y-2">
            <div className="font-medium text-foreground text-sm leading-tight">
              {hasService ? value : 
               row.service_id ? 'Service Unavailable' : 'No Service Linked'}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={hasCategory ? "default" : "secondary"} 
                className={`text-xs px-2 py-1 ${hasCategory ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'}`}
              >
                {hasCategory ? row.service_category : 
                 row.service_id ? 'Category Unknown' : 'Direct Booking'}
              </Badge>
            </div>
          </div>
        )
      }
    },
    { 
      key: 'scheduled_date', 
      label: 'Date & Time',
      render: (value: string) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" />
            <p className="font-medium text-sm">{new Date(value).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{new Date(value).toLocaleTimeString()}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'total_amount', 
      label: 'Amount',
      render: (value: number) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-emerald-600" />
            <span className="font-semibold text-emerald-600">{value ? `$${value}` : 'TBD'}</span>
          </div>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => {
        const statusConfig = {
          completed: { variant: 'default' as const, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
          pending: { variant: 'secondary' as const, color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
          confirmed: { variant: 'outline' as const, color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
          cancelled: { variant: 'destructive' as const, color: 'bg-red-500/10 text-red-700 border-red-200' }
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
      key: 'duration_hours', 
      label: 'Duration',
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{value ? `${value}h` : 'TBD'}</span>
        </div>
      )
    }
  ];

  // Stats are now coming from the hook
  const { totalBookings, completedBookings, pendingBookings, totalRevenue } = stats;
  


  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Bookings Management">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading bookings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin" title="Bookings Management">
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-6 rounded-xl border border-primary/10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Bookings Management
          </h1>
          <p className="text-muted-foreground mt-2">Monitor and manage all platform bookings with enhanced visibility</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Bookings</CardTitle>
              <div className="p-2 rounded-full bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalBookings}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
              <div className="mt-2 h-1 bg-primary/20 rounded-full">
                <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-emerald-500/15 border-emerald-500/20 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Completed</CardTitle>
              <div className="p-2 rounded-full bg-emerald-500/10">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{completedBookings}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
              <div className="mt-2 h-1 bg-emerald-500/20 rounded-full">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-amber-500/15 border-amber-500/20 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Pending</CardTitle>
              <div className="p-2 rounded-full bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
                        <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendingBookings}</div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              <div className="mt-2 h-1 bg-amber-500/20 rounded-full">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${totalBookings > 0 ? (pendingBookings / totalBookings) * 100 : 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/5 via-violet-500/10 to-violet-500/15 border-violet-500/20 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
              <div className="p-2 rounded-full bg-violet-500/10">
                <DollarSign className="h-4 w-4 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-600">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From all bookings</p>
              <div className="mt-2 h-1 bg-violet-500/20 rounded-full">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </CardContent>
          </Card>
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
                    placeholder="Search by customer, worker, service, booking ID, service ID, customer ID, worker ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border/60 focus:border-primary transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Booking Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="border-border/60 focus:border-primary transition-colors">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Time Period</label>
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

        {/* Bookings Table */}
        <PaginatedDataTable
          title="Bookings Management"
          columns={bookingColumns}
          data={bookings}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          loading={loading}
          onPageChange={handlePageChange}
          onView={handleViewBooking}
          onOptimisticUpdate={updateBookingOptimistically}
          onOptimisticDelete={deleteBookingOptimistically}
        />

        {/* Booking Details Drawer */}
        <BookingDetailsDrawer
          isOpen={showBookingDrawer}
          onClose={() => setShowBookingDrawer(false)}
          booking={selectedBooking}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminBookings;