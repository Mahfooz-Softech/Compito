import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { WorkerProfileDrawer } from '@/components/admin/WorkerProfileDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminData } from '@/hooks/useAdminData';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Shield, 
  Star, 
  DollarSign, 
  Search, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MapPin,
  Clock,
  Award,
  Phone,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Sparkles,
  UserCheck,
  Loader2
} from 'lucide-react';

const AdminWorkers = () => {
  const { 
    loading, 
    workersLoading,
    allWorkers, 
    allWorkerCategories, 
    verifyWorker, 
    rejectWorker, 
    fetchWorkersWithPagination 
  } = useAdminData();
  const { toast } = useToast();
  const [processingVerification, setProcessingVerification] = useState<string | null>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [selectedWorkerForProfile, setSelectedWorkerForProfile] = useState<string | null>(null);
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(0);
  const [workers, setWorkers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const itemsPerPage = 10;

  // Fetch workers with server-side pagination
  const fetchWorkers = async (page: number = 0) => {
    const filters = {
      search: searchTerm,
      status: filterStatus,
      rating: filterRating,
      experience: filterExperience,
      category: filterCategory
    };
    
    const result = await fetchWorkersWithPagination(page, itemsPerPage, filters);
    setWorkers(result.data || []);
    setTotalCount(result.totalCount || 0);
    setTotalPages(result.totalPages || 0);
  };

  // Initial load and filter changes
  useEffect(() => {
    if (!loading) {
      fetchWorkers(0);
      setCurrentPage(0);
    }
  }, [searchTerm, filterStatus, filterRating, filterExperience, filterCategory, loading]);

  // Page changes
  useEffect(() => {
    if (!loading) {
      fetchWorkers(currentPage);
    }
  }, [currentPage]);

  const handleViewProfile = (workerId: string) => {
    console.log('handleViewProfile called with:', workerId, typeof workerId);
    if (!workerId) {
      console.error('workerId is null or undefined');
      return;
    }
    setSelectedWorkerForProfile(workerId);
    setShowProfileDrawer(true);
  };

  const handleVerifyWorker = async (workerId: string) => {
    setProcessingVerification(workerId);
    try {
      const result = await verifyWorker(workerId);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        // Refresh current page
        await fetchWorkers(currentPage);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setProcessingVerification(null);
    }
  };

  const handleRejectWorker = async (workerId: string) => {
    setProcessingVerification(workerId);
    try {
      const result = await rejectWorker(workerId);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        // Refresh current page
        await fetchWorkers(currentPage);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setProcessingVerification(null);
    }
  };

  const workerColumns = [
    { 
      key: 'name', 
      label: 'Worker Details',
      render: (value: any, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="font-semibold text-foreground">{row.name}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-10">
            <Phone className="h-3 w-3" />
            <span>{row.phone}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-10">
            <MapPin className="h-3 w-3" />
            <span>{row.location}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'categoryInfo', 
      label: 'Category',
      render: (value: any, row: any) => (
        <div className="space-y-2">
          <Badge 
            variant="outline" 
            className="font-medium"
            style={{ backgroundColor: value?.category?.color + '20', borderColor: value?.category?.color }}
          >
            <Award className="h-3 w-3 mr-1" />
            {value?.category?.name || 'Unassigned'}
          </Badge>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{value?.uniqueCustomers || 0} unique customers</span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              <span>{row.completedJobs} jobs completed</span>
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <div className="flex flex-col gap-1">
          <Badge variant={
            value === 'verified' ? 'default' : 
            value === 'pending' ? 'secondary' : 'destructive'
          } className="w-fit">
            {value === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
            {value === 'pending' && <Clock className="h-3 w-3 mr-1" />}
            {value === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
            {value}
          </Badge>
        </div>
      )
    },
    { 
      key: 'rating', 
      label: 'Ratings',
      render: (value: any, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{(Number(value) || 0).toFixed(1)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {row.total_reviews || 0} reviews
          </p>
          <div className="text-xs text-success font-medium">
            {row.success_rate || 0}% success rate
          </div>
        </div>
      )
    },
    { 
      key: 'experience', 
      label: 'Experience/Rate',
      render: (value: number, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{Number(value) || 0} years</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-success" />
            <span className="font-medium text-success">${Number(row.hourly_rate) || 0}/hr</span>
          </div>
          <div className="text-xs text-muted-foreground">
            ${(Number(row.total_earnings) || 0).toFixed(2)} earned
          </div>
        </div>
      )
    },
    {
      key: 'verifications',
      label: 'Verifications',
      render: (value: any, row: any) => (
        <div className="flex flex-col gap-2">
          {row.status === 'pending' && (
            <div className="flex gap-1">
              <Button 
                size="sm" 
                onClick={() => handleVerifyWorker(row.id)}
                className="h-7 px-2 text-xs bg-success hover:bg-success/90"
                disabled={processingVerification === row.id}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {processingVerification === row.id ? 'Verifying...' : 'Verify'}
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleRejectWorker(row.id)}
                className="h-7 px-2 text-xs"
                disabled={processingVerification === row.id}
              >
                <XCircle className="h-3 w-3 mr-1" />
                {processingVerification === row.id ? 'Processing...' : 'Reject'}
              </Button>
            </div>
          )}
          {row.status === 'verified' && (
            <Badge variant="default" className="h-7 px-2 justify-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {row.status === 'rejected' && (
            <Badge variant="destructive" className="h-7 px-2 justify-center">
              <XCircle className="h-3 w-3 mr-1" />
              Rejected
            </Badge>
          )}

        </div>
      )
    }
  ];

  const pendingWorkers = allWorkers.filter(w => w.status === 'pending').length;
  const verifiedWorkers = allWorkers.filter(w => w.status === 'verified').length;
  const avgRating = allWorkers.length > 0 ? 
    allWorkers.reduce((sum, w) => sum + (Number(w.rating) || 0), 0) / allWorkers.length : 0;

  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Worker Management">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading workers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin" title="Worker Management">
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-8 border border-border/50">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50"></div>
          <div className="relative flex justify-between items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Worker Management
                </h1>
              </div>
              <p className="text-muted-foreground/80 text-lg">Manage and verify your platform's service providers</p>
              <div className="flex items-center gap-2 mt-4">
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {verifiedWorkers} Verified Workers
                </Badge>
                <Badge variant="outline" className="border-primary/20 text-primary">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {pendingWorkers} Pending
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Total Workers</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{allWorkers.length}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Sparkles className="h-3 w-3" />
                All registered workers
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card via-card to-success/5 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-success">Verified Workers</CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <Shield className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{verifiedWorkers}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <CheckCircle className="h-3 w-3" />
                Approved for work
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card via-card to-destructive/5 border-destructive/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Pending Verification</CardTitle>
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{pendingWorkers}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card via-card to-accent/30 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
              <div className="p-2 rounded-lg bg-accent/10">
                <Star className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{(Number(avgRating) || 0).toFixed(1)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                Platform quality score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Workers Table with Integrated Filters */}
        <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Workers Directory</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Showing {workers?.length || 0} of {totalCount} workers
                  </p>
                </div>
              </div>
              
              {workersLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              )}
            </div>
            
            {/* Integrated Filters */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search workers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl">
                    <SelectItem value="all" className="focus:bg-primary/10">All Status</SelectItem>
                    <SelectItem value="verified" className="focus:bg-primary/10">Verified</SelectItem>
                    <SelectItem value="pending" className="focus:bg-primary/10">Pending</SelectItem>
                    <SelectItem value="rejected" className="focus:bg-primary/10">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200">
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl">
                    <SelectItem value="all" className="focus:bg-primary/10">All Ratings</SelectItem>
                    <SelectItem value="4+" className="focus:bg-primary/10">4+ Stars</SelectItem>
                    <SelectItem value="3-4" className="focus:bg-primary/10">3-4 Stars</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterExperience} onValueChange={setFilterExperience}>
                  <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200">
                    <SelectValue placeholder="Filter by experience" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl">
                    <SelectItem value="all" className="focus:bg-primary/10">All Experience</SelectItem>
                    <SelectItem value="3+" className="focus:bg-primary/10">3+ Years</SelectItem>
                    <SelectItem value="1-3" className="focus:bg-primary/10">1-3 Years</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl">
                    <SelectItem value="all" className="focus:bg-primary/10">All Categories</SelectItem>
                    {allWorkerCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name} className="focus:bg-primary/10">
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Unassigned" className="focus:bg-primary/10">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filter Summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {totalCount} total workers
                  </Badge>
                  {(searchTerm || filterStatus !== 'all' || filterRating !== 'all' || filterExperience !== 'all' || filterCategory !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                        setFilterRating('all');
                        setFilterExperience('all');
                        setFilterCategory('all');
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              title=""
              columns={workerColumns}
              data={workers || []}
              onView={(worker) => {
                console.log('DataTable onView called with worker:', worker);
                console.log('worker.id:', worker.id);
                handleViewProfile(worker.id);
              }}
            />
            
            {/* Server-side Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 p-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0 || workersLoading}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {totalCount} total
                  </Badge>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage >= totalPages - 1 || workersLoading}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>



        {/* Worker Profile Drawer */}
        <WorkerProfileDrawer
          isOpen={showProfileDrawer}
          onClose={() => setShowProfileDrawer(false)}
          workerId={selectedWorkerForProfile}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminWorkers;