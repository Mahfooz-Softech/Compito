import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import { Loader2, Save, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

interface ContactInfo {
  id: string;
  email: string;
  phone: string;
  address: string;
  updated_at: string;
}

const OtherThings = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await apiClient.getContact();
      if (error) throw error;

      if (!data) {
        await createDefaultContact();
        return;
      }

      const contact = data as any;
      setContactInfo(contact);
      setFormData({
        email: contact.email,
        phone: contact.phone,
        address: contact.address
      });
    } catch (error) {
      console.error('Error fetching contact info:', error);
      toast({
        title: "Error",
        description: "Failed to load contact information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultContact = async () => {
    try {
      const payload = {
        email: 'info@compito.com',
        phone: '+44 20 1234 5678',
        address: '123 Business Street, London, UK, SW1A 1AA'
      };
      const { data, error } = await apiClient.createContact(payload);
      if (error) throw error;

      const contact = data as any;
      setContactInfo(contact);
      setFormData({
        email: contact.email,
        phone: contact.phone,
        address: contact.address
      });
    } catch (error) {
      console.error('Error creating default contact:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!contactInfo) return;

    setSaving(true);
    try {
      const { error } = await apiClient.updateContact({
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      });
      if (error) throw error;

      // Refresh the data
      await fetchContactInfo();

      toast({
        title: "Success",
        description: "Contact information updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating contact info:', error);
      toast({
        title: "Error",
        description: "Failed to update contact information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    
    <DashboardLayout userType="admin" title="Other Managements">
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Building2 className="h-4 w-4" />
            Admin Panel
          </div>
          <h1 className="text-4xl font-bold text-foreground">Footer Display Information</h1>
          <p className="text-xl text-muted-foreground">
            Manage company contact information and other settings
          </p>
        </div>

        {/* Contact Information Card */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Mail className="h-8 w-8 text-primary" />
              Contact Information
            </CardTitle>
            <p className="text-muted-foreground">
              Update company contact details that will be displayed in the footer
            </p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter company email address"
                className="h-12 text-base"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter company phone number"
                className="h-12 text-base"
              />
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter company address"
                className="min-h-[80px] text-base resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            {/* Last Updated Info */}
            {contactInfo && (
              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                <p>Last updated: {new Date(contactInfo.updated_at).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
    </DashboardLayout>
  );
};

export default OtherThings;



