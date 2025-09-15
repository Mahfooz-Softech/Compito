import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAdminData } from '@/hooks/useAdminData';
import { apiClient } from '@/lib/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  UserPlus, 
  Shield, 
  DollarSign,
  Users,
  Award,
  Key,
  Save
} from 'lucide-react';

const AdminSettings = () => {
  const { loading, allWorkerCategories, allCommissionSettings } = useAdminData();
  const [localWorkerCategories, setLocalWorkerCategories] = useState([]);
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryRate, setNewCategoryRate] = useState('');
  const [newCategoryMinCustomers, setNewCategoryMinCustomers] = useState('');
  const [newCategoryMinRating, setNewCategoryMinRating] = useState('');
  const [globalCommission, setGlobalCommission] = useState('15');
  const [subAdmins, setSubAdmins] = useState([]);
  const [newSubAdmin, setNewSubAdmin] = useState({
    email: '',
    firstName: '',
    lastName: '',
    permissions: []
  });

  // Edit category dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editMinCustomers, setEditMinCustomers] = useState('');
  const [editMinRating, setEditMinRating] = useState('');
  const [editColor, setEditColor] = useState('#6b7280');

  // Load categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await apiClient.get('/admin/worker-categories');
        if ((error as any)) throw error;
        setLocalWorkerCategories((data as any) || []);
      } catch (err) {
        console.error('Error fetching worker categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Sync global commission rate with data from database
  useEffect(() => {
    const globalCommissionSetting = allCommissionSettings.find(setting => setting.is_global);
    if (globalCommissionSetting) {
      setGlobalCommission((globalCommissionSetting.commission_rate * 100).toString());
    }
  }, [allCommissionSettings]);

  const createWorkerCategory = async () => {
    if (!newCategoryName || !newCategoryRate || !newCategoryMinCustomers || !newCategoryMinRating) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Optimistic update - add to local state immediately
      const optimisticCategory = {
        id: `temp-${Date.now()}`,
        name: newCategoryName,
        commission_rate: parseFloat(newCategoryRate) / 100,
        description: `${newCategoryName} workers category - Min customers: ${newCategoryMinCustomers}, Min rating: ${newCategoryMinRating}`,
        color: '#6b7280',
        created_at: new Date().toISOString(),
        min_rating: parseFloat(newCategoryMinRating),
        min_experience: 0
      };

      setLocalWorkerCategories(prev => [...prev, optimisticCategory]);

      const { data, error } = await apiClient.post('/admin/worker-categories', {
        name: newCategoryName,
        commission_rate: parseFloat(newCategoryRate) / 100,
        min_customers: parseInt(newCategoryMinCustomers),
        min_rating: parseFloat(newCategoryMinRating),
        description: `${newCategoryName} workers category - Min customers: ${newCategoryMinCustomers}, Min rating: ${newCategoryMinRating}`
      });

      if ((error as any)) throw error;

      // Replace optimistic entry with real data and refetch
      setLocalWorkerCategories(prev => prev.map(cat => (cat.id === optimisticCategory.id ? (data as any) : cat)));
      try {
        const { data: refreshed } = await apiClient.get('/admin/worker-categories');
        setLocalWorkerCategories((refreshed as any) || []);
      } catch {}

      toast({
        title: "Success",
        description: "Worker category created successfully"
      });

      setNewCategoryName('');
      setNewCategoryRate('');
      setNewCategoryMinCustomers('');
      setNewCategoryMinRating('');
    } catch (error) {
      // Remove optimistic entry on error
      setLocalWorkerCategories(prev => 
        prev.filter(cat => !cat.id.toString().startsWith('temp-'))
      );
      
      toast({
        title: "Error",
        description: "Failed to create worker category",
        variant: "destructive"
      });
    }
  };

  const updateGlobalCommission = async () => {
    try {
      // Update the single global commission setting row
      const { error } = await apiClient.put('/admin/commission', {
        commission_rate: parseFloat(globalCommission) / 100,
      });
      if ((error as any)) throw error;

      toast({
        title: "Success",
        description: "Global commission rate updated successfully"
      });
    } catch (error) {
      console.error('Commission update error:', error);
      toast({
        title: "Error",
        description: "Failed to update global commission rate",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchSubAdmins();
    }
  }, [loading]);

  const fetchSubAdmins = async () => {
    try {
      const { data, error } = await apiClient.get('/admin/sub-admins');
      if ((error as any)) throw error;
      setSubAdmins((data as any) || []);
    } catch (error) {
      console.error('Error fetching sub admins:', error);
    }
  };

  const createSubAdmin = async () => {
    if (!newSubAdmin.email || !newSubAdmin.firstName || !newSubAdmin.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await apiClient.post('/admin/sub-admins', {
        email: newSubAdmin.email,
        first_name: newSubAdmin.firstName,
        last_name: newSubAdmin.lastName,
        permissions: newSubAdmin.permissions,
      });
      if ((error as any)) throw error;

      toast({
        title: "Success",
        description: "Sub admin created successfully"
      });

      setNewSubAdmin({
        email: '',
        firstName: '',
        lastName: '',
        permissions: []
      });

      fetchSubAdmins();
    } catch (error) {
      console.error('Error creating sub admin:', error);
      toast({
        title: "Error",
        description: "Failed to create sub admin",
        variant: "destructive"
      });
    }
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    setEditName(category.name ?? '');
    setEditRate(((Number(category.commission_rate ?? 0)) * 100).toString());
    setEditMinCustomers(String(category.min_customers ?? 0));
    setEditMinRating(String(Number(category.min_rating ?? 0).toFixed(1)));
    setEditColor(category.color ?? '#6b7280');
    setIsEditOpen(true);
  };

  const saveEditedCategory = async () => {
    if (!editingCategory) return;
    try {
      const payload = {
        name: editName,
        commission_rate: parseFloat(editRate) / 100,
        min_customers: parseInt(editMinCustomers || '0'),
        min_rating: parseFloat(editMinRating || '0'),
        color: editColor,
      };
      const { error } = await apiClient.put(`/admin/worker-categories/${editingCategory.id}`, payload);
      if ((error as any)) throw error;

      // Refresh categories
      const { data: refreshed } = await apiClient.get('/admin/worker-categories');
      setLocalWorkerCategories((refreshed as any) || []);

      toast({
        title: 'Updated',
        description: 'Worker category updated successfully'
      });
      setIsEditOpen(false);
      setEditingCategory(null);
    } catch (err) {
      console.error('Error updating category:', err);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive'
      });
    }
  };

  const categoryColumns = [
    { key: 'name', label: 'Category Name' },
    { 
      key: 'commission_rate', 
      label: 'Commission Rate',
      render: (value: number) => `${(value * 100).toFixed(1)}%`
    },
    { 
      key: 'min_customers', 
      label: 'Min Customers',
      render: (value: number) => value || 0
    },
    { 
      key: 'min_rating', 
      label: 'Min Rating',
      render: (value: number) => value ? value.toFixed(1) : '0.0'
    },
    { 
      key: 'color', 
      label: 'Color',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: value }}
          />
          {value}
        </div>
      )
    },
    { 
      key: 'created_at', 
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Settings">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin" title="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Manage platform configuration and permissions</p>
        </div>

        <Tabs defaultValue="commission" className="space-y-6">
          <TabsList>
            <TabsTrigger value="commission">Commission Settings</TabsTrigger>
            <TabsTrigger value="categories">Worker Categories</TabsTrigger>
            <TabsTrigger value="admins">Sub Admins</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="commission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Global Commission Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Current Global Commission Rate</h3>
                      <p className="text-sm text-muted-foreground">
                        Applied to all uncategorized workers
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {allCommissionSettings.find(s => s.is_global)?.commission_rate 
                          ? (allCommissionSettings.find(s => s.is_global).commission_rate * 100).toFixed(1)
                          : '15.0'}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {allCommissionSettings.find(s => s.is_global)?.updated_at 
                          ? new Date(allCommissionSettings.find(s => s.is_global).updated_at).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor="global-commission">New Commission Percentage</Label>
                    <Input
                      id="global-commission"
                      type="number"
                      value={globalCommission}
                      onChange={(e) => setGlobalCommission(e.target.value)}
                      placeholder="15"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {allCommissionSettings.find(s => s.is_global)?.commission_rate 
                        ? (allCommissionSettings.find(s => s.is_global).commission_rate * 100).toFixed(1)
                        : '15.0'}%
                    </p>
                  </div>
                  <Button onClick={updateGlobalCommission}>
                    <Save className="h-4 w-4 mr-2" />
                    Update Rate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Create Worker Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Platinum"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-rate">Commission Rate (%)</Label>
                    <Input
                      id="category-rate"
                      type="number"
                      value={newCategoryRate}
                      onChange={(e) => setNewCategoryRate(e.target.value)}
                      placeholder="10"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-customers">Min Completed Customers</Label>
                    <Input
                      id="min-customers"
                      type="number"
                      value={newCategoryMinCustomers}
                      onChange={(e) => setNewCategoryMinCustomers(e.target.value)}
                      placeholder="20"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-rating">Min Rating</Label>
                    <Input
                      id="min-rating"
                      type="number"
                      value={newCategoryMinRating}
                      onChange={(e) => setNewCategoryMinRating(e.target.value)}
                      placeholder="4.5"
                      min="0"
                      max="5"
                      step="0.1"
                    />
                  </div>
                  <Button onClick={createWorkerCategory} className="col-span-2">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Category Logic:</strong> Workers will be automatically assigned to categories based on their performance metrics.</p>
                  <p><strong>Examples:</strong> Platinum (20+ customers, 4.5+ rating), Gold (5+ customers, 4.7+ rating), Silver (below thresholds)</p>
                </div>
              </CardContent>
            </Card>

            <DataTable
              title="Worker Categories"
              columns={categoryColumns}
              data={localWorkerCategories}
              onView={(category) => alert(`Category: ${category.name}\nCommission: ${(category.commission_rate * 100).toFixed(1)}%\nColor: ${category.color}`)}
              onEdit={(category) => openEditCategory(category)}
            />

            {/* Edit Category Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Worker Category</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Category Name</Label>
                    <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="edit-rate">Commission Rate (%)</Label>
                    <Input id="edit-rate" type="number" min="0" max="100" step="0.1" value={editRate} onChange={(e) => setEditRate(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="edit-min-customers">Min Customers</Label>
                    <Input id="edit-min-customers" type="number" min="0" value={editMinCustomers} onChange={(e) => setEditMinCustomers(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="edit-min-rating">Min Rating</Label>
                    <Input id="edit-min-rating" type="number" min="0" max="5" step="0.1" value={editMinRating} onChange={(e) => setEditMinRating(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-color">Color</Label>
                    <Input id="edit-color" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button onClick={saveEditedCategory}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="admins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Add Sub Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sub-admin-email">Email</Label>
                    <Input
                      id="sub-admin-email"
                      type="email"
                      value={newSubAdmin.email}
                      onChange={(e) => setNewSubAdmin(prev => ({...prev, email: e.target.value}))}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sub-admin-first-name">First Name</Label>
                    <Input
                      id="sub-admin-first-name"
                      value={newSubAdmin.firstName}
                      onChange={(e) => setNewSubAdmin(prev => ({...prev, firstName: e.target.value}))}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sub-admin-last-name">Last Name</Label>
                    <Input
                      id="sub-admin-last-name"
                      value={newSubAdmin.lastName}
                      onChange={(e) => setNewSubAdmin(prev => ({...prev, lastName: e.target.value}))}
                      placeholder="Doe"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={createSubAdmin}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Sub Admin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DataTable
              title={`Sub Admins (${subAdmins.length})`}
              columns={[
                { 
                  key: 'name', 
                  label: 'Name',
                  render: (value: any, row: any) => 
                    `${row.profiles?.first_name || ''} ${row.profiles?.last_name || ''}`.trim()
                },
                { 
                  key: 'role', 
                  label: 'Role',
                  render: (value: string) => (
                    <Badge variant="secondary">{value?.replace('_', ' ') || 'Sub Admin'}</Badge>
                  )
                },
                { 
                  key: 'created_at', 
                  label: 'Created',
                  render: (value: string) => new Date(value).toLocaleDateString()
                },
                { 
                  key: 'is_active', 
                  label: 'Status',
                  render: (value: boolean) => (
                    <Badge variant={value ? 'default' : 'destructive'}>
                      {value ? 'Active' : 'Inactive'}
                    </Badge>
                  )
                }
              ]}
              data={subAdmins}
              onView={(admin) => console.log('View admin:', admin)}
              onEdit={(admin) => console.log('Edit admin:', admin)}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button>
                    <Key className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;