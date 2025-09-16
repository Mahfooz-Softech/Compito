import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface AddServiceDialogProps {
  onServiceAdded?: (service: any) => void;
}

const AddServiceDialog = ({ onServiceAdded }: AddServiceDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    price_min: '',
    price_max: '',
    duration_hours: '1',
    location_type: 'client_location'
  });

  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  // Fetch categories from Laravel (public endpoint)
  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/public/categories');
      const payload: any = (res as any)?.data;
      const list: any[] = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.categories) ? payload.categories : []);
      setCategories(list.map((c: any) => ({ id: String(c.id), name: c.name })));
    } catch (e) {
      setCategories([]);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id || undefined,
        price_min: parseFloat(formData.price_min) || 0,
        price_max: parseFloat(formData.price_max) || 0,
        duration_hours: parseFloat(formData.duration_hours) || 1,
      };

      const res: any = await apiClient.post('/worker/services', payload);
      if (res?.error) throw new Error(res.error);
      const created = res?.data?.service || res?.service || null;

      toast({
        title: "Service added",
        description: "Your new service has been added successfully.",
      });

      // Optimistic update callback
      if (created && onServiceAdded) {
        onServiceAdded(created);
      }

      setFormData({
        title: '',
        description: '',
        category_id: '',
        price_min: '',
        price_max: '',
        duration_hours: '1',
        location_type: 'client_location'
      });
      setOpen(false);
    } catch (error) {
      console.error('Error adding service:', error);
      toast({
        title: "Error",
        description: "Failed to add service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., House Cleaning, Plumbing Repair"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your service in detail..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_min">Minimum Price ($)</Label>
              <Input
                id="price_min"
                type="number"
                min="0"
                step="0.01"
                value={formData.price_min}
                onChange={(e) => setFormData(prev => ({ ...prev, price_min: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="price_max">Maximum Price ($)</Label>
              <Input
                id="price_max"
                type="number"
                min="0"
                step="0.01"
                value={formData.price_max}
                onChange={(e) => setFormData(prev => ({ ...prev, price_max: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location_type">Service Location</Label>
            <Select value={formData.location_type} onValueChange={(value) => setFormData(prev => ({ ...prev, location_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client_location">At Client's Location</SelectItem>
                <SelectItem value="worker_location">At My Location</SelectItem>
                <SelectItem value="remote">Remote/Online</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceDialog;