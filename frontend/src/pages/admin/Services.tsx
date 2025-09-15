import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PaginatedDataTable } from '@/components/dashboard/PaginatedDataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useAdminServices } from '@/hooks/useAdminServices';
import { 
  Briefcase, 
  DollarSign, 
  Users, 
  TrendingUp,
  Plus,
  BarChart3,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';

const AdminServices = () => {
  console.log('AdminServices component loaded - no handleSearch function defined');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const pageSize = 10;
  const { toast } = useToast();
  const { 
    loading, 
    services, 
    totalCount, 
    stats, 
    categoryPerformance, 
    adminTotals,
    availableCategories,
    updateServiceOptimistically,
    deleteServiceOptimistically
  } = useAdminServices(currentPage, pageSize, searchTerm, selectedCategory);

  console.log('Hook data loaded:', { loading, servicesCount: services.length, totalCount });

  // Reset to first page when search or category changes
  const handleCategoryChange = (category: string) => {
    console.log('Category changed to:', category);
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchTermChange = (value: string) => {
    console.log('Search term changed to:', value);
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDeleteService = async (service: any) => {
    try {
      // Optimistic update
      deleteServiceOptimistically(service.id);
      
      const response = await apiClient.delete(`/admin/services/${service.id}`);
      
      if (response.error) throw new Error(response.error);

      toast({
        title: "Success",
        description: "Service deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive"
      });
      // Revert optimistic update on error
      window.location.reload();
    }
  };

  const serviceColumns = [
    { 
      key: 'title', 
      label: 'Service Details',
      render: (value: any, row: any) => (
        <div className="space-y-2">
          <p className="font-semibold text-foreground">{row.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{row.description}</p>
          <Badge variant="secondary" className="mt-2 text-xs bg-primary/10 text-primary border-primary/20">
            {row.category}
          </Badge>
        </div>
      )
    },
    { 
      key: 'worker', 
      label: 'Provider',
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">Service Provider</p>
          </div>
        </div>
      )
    },
    { 
      key: 'priceMin', 
      label: 'Price & Duration',
      render: (value: any, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-success" />
            <p className="font-semibold text-success">${row.priceMin} - ${row.priceMax}</p>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{row.duration}hr duration</p>
          </div>
        </div>
      )
    },
    { 
      key: 'category', 
      label: 'Category',
      render: (value: string) => (
        <Badge variant="outline" className="font-medium">
          {value}
        </Badge>
      )
    }
  ];


  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Service Management">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin" title="Service Management">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-8 border border-border/50">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50"></div>
          <div className="relative flex justify-between items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Service Management
                </h1>
              </div>
              <p className="text-muted-foreground/80 text-lg">Oversee and optimize your platform's service offerings</p>
              <div className="flex items-center gap-2 mt-4">
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {stats.totalServices} Active Services
                </Badge>
                <Badge variant="outline" className="border-primary/20 text-primary">
                  {stats.totalCategories} Categories
                </Badge>
              </div>
            </div>
            <Button 
              onClick={() => alert('Service creation will be available in the worker dashboard')}
              className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Service
            </Button>
          </div>
        </div>


        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Services"
            value={stats.totalServices}
            icon={Briefcase}
            className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20"
          />
          
          <StatCard
            title="Categories"
            value={stats.totalCategories}
            icon={BarChart3}
            className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card via-card to-secondary/5 border-secondary/20"
          />
          
          <StatCard
            title="Avg Service Value"
            value={`$${Math.round(stats.avgServiceValue)}`}
            icon={DollarSign}
            className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card via-card to-success/5 border-success/20"
          />
          
          <StatCard
            title="Active Providers"
            value={stats.activeProviders}
            icon={Users}
            className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-card via-card to-accent/5 border-accent/20"
          />
        </div>


        {/* Enhanced Services Table */}
        <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-6 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">All Services</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {totalCount} Total Services
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      Page {currentPage}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Search and Category Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search services by name..."
                    value={searchTerm}
                    onChange={(e) => handleSearchTermChange(e.target.value)}
                    className="pl-10 w-72 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-56 pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl z-50">
                      <SelectItem value="all" className="focus:bg-primary/10">All Categories</SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name} className="focus:bg-primary/10">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {(searchTerm || selectedCategory !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setCurrentPage(1);
                    }}
                    size="sm"
                    className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 transition-all duration-200"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-lg overflow-hidden">
              <PaginatedDataTable
                title=""
                columns={serviceColumns}
                data={services}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                loading={loading}
                onPageChange={setCurrentPage}
                onDelete={handleDeleteService}
                onOptimisticUpdate={updateServiceOptimistically}
                onOptimisticDelete={deleteServiceOptimistically}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminServices;