import React, { useState, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkerData } from '@/hooks/useWorkerData';
import AddServiceDialog from '@/components/worker/AddServiceDialog';
import EditServiceDialog from '@/components/worker/EditServiceDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

const WorkerServices = () => {
  const { loading, workerServices: initialServices, fetchWorkerData } = useWorkerData();
  const { toast } = useToast();
  const [editService, setEditService] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [services, setServices] = useState<any[]>(initialServices);

  React.useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const syncBackend = React.useCallback(() => {
    // fire-and-forget to sync with backend
    try { fetchWorkerData?.(); } catch {}
  }, [fetchWorkerData]);

  const handleAdded = useCallback((created: any) => {
    if (!created) return;
    const optimistic = {
      ...created,
      categories: created.categories || (created.category ? { name: created.category.name } : undefined),
    };
    setServices(prev => [optimistic, ...prev]);
    syncBackend();
  }, [syncBackend]);

  const handleEdit = useCallback((service: any) => {
    setEditService(service);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (serviceId: string) => {
    const prev = services;
    setServices(prev.filter(s => s.id !== serviceId));
    try {
      const res = await apiClient.delete(`/worker/services/${serviceId}`);
      if ((res as any)?.error) throw new Error((res as any).error);
      toast({ title: 'Service deleted', description: 'Your service has been deleted successfully.' });
      syncBackend();
    } catch (error) {
      setServices(prev); // revert
      toast({ title: 'Error', description: 'Failed to delete service. Please try again.', variant: 'destructive' });
    }
  }, [services, toast, syncBackend]);

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    setEditService(null);
  }, []);

  const handleServiceUpdated = useCallback((updated?: any) => {
    handleEditDialogClose();
    if (!updated) return;
    setServices(prev => prev.map(s => (s.id === updated.id ? { ...s, ...updated } : s)));
    syncBackend();
  }, [handleEditDialogClose, syncBackend]);

  const serviceCards = useMemo(() => 
    services.map((service) => (
      <Card key={service.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{service.title}</CardTitle>
              {service.categories?.name && (
                <Badge variant="secondary" className="mt-1">
                  {service.categories.name}
                </Badge>
              )}
            </div>
            <Badge variant="default">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{service.description}</p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span>${service.price_min || 0} - ${service.price_max || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{service.duration_hours || 1}h</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(service)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Service</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{service.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(service.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    )), [services, handleEdit, handleDelete]
  );

  if (loading) {
    return (
      <DashboardLayout userType="worker" title="My Services">
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
    <DashboardLayout userType="worker" title="My Services">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Services</h1>
            <p className="text-muted-foreground">Manage your service offerings</p>
          </div>
          <AddServiceDialog onServiceAdded={handleAdded} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceCards}
        </div>

        {services.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No services yet</h3>
              <p className="text-sm text-muted-foreground">Start by adding your first service</p>
            </CardContent>
          </Card>
        )}
      </div>

      <EditServiceDialog
        service={editService}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onServiceUpdated={handleServiceUpdated}
      />
    </DashboardLayout>
  );
};

export default WorkerServices;