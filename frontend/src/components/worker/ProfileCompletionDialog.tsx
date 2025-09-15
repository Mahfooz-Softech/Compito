import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { User, MapPin, DollarSign, Briefcase, Globe } from 'lucide-react';
import { GoogleMapsAutocomplete, AddressData } from '@/components/ui/GoogleMapsAutocomplete';

interface ProfileCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  isUpdate?: boolean;
  onProfileUpdated?: () => void;
}

export const ProfileCompletionDialog = ({ open, onOpenChange, onComplete, isUpdate = false, onProfileUpdated }: ProfileCompletionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [profile, setProfile] = useState({
    bio: '',
    hourly_rate: '',
    experience_years: '',
    location: '',
    city: '',
    postcode: '',
    country: 'USA',
    service_radius_miles: '5',
    online_services: false,
    phone: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  // Fetch existing profile data when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      fetchProfileData();
    }
  }, [open, user?.id]);

  const fetchProfileData = async () => {
    if (!user?.id) return;
    
    setFetchingData(true);
    try {
      // Fetch worker profile and auth profile via Laravel API
      const [workerRes, authRes] = await Promise.all([
        apiClient.get('/worker/profile'),
        apiClient.get('/auth/profile')
      ]);
      
      const workerProfile = (workerRes.data as any)?.worker_profile || {};
      const authData = (authRes.data as any) || {};
      const mainProfile = authData?.profile || {};
      const userData = authData?.user || {};

      // Populate form with existing data or keep empty strings for new entries
      const profileData = {
        bio: workerProfile?.bio || '',
        hourly_rate: workerProfile?.hourly_rate?.toString() || '',
        experience_years: workerProfile?.experience_years?.toString() || '',
        location: mainProfile?.location || '',
        city: mainProfile?.city || '',
        postcode: mainProfile?.postcode || '',
        country: mainProfile?.country || 'USA',
        service_radius_miles: workerProfile?.service_radius_miles?.toString() || '5',
        online_services: workerProfile?.online_services || false,
        phone: mainProfile?.phone || '',
        latitude: mainProfile?.latitude ? parseFloat(mainProfile.latitude) : null,
        longitude: mainProfile?.longitude ? parseFloat(mainProfile.longitude) : null
      };
      
      setProfile(profileData);

    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Update worker profile via Laravel API (worker-specific fields only)
      const workerPayload = {
        bio: profile.bio,
        hourly_rate: parseFloat(profile.hourly_rate) || 0,
        experience_years: parseInt(profile.experience_years) || 0,
        service_radius_miles: parseInt(profile.service_radius_miles) || 5,
        online_services: profile.online_services
      };
      
      await apiClient.put('/worker/profile', workerPayload);

      // Update main auth profile via Laravel API
      const authPayload = {
        phone: profile.phone,
        location: profile.location,
        city: profile.city,
        postcode: profile.postcode,
        country: profile.country,
        latitude: profile.latitude,
        longitude: profile.longitude
      };
      
      await apiClient.put('/auth/profile', authPayload);

      toast({
        title: isUpdate ? "Profile updated" : "Profile completed",
        description: "Your profile has been updated successfully.",
      });
      
      onComplete?.();
      onProfileUpdated?.(); // Refresh worker data to update profile completion
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const handleAddressSelect = (addressData: AddressData) => {
    setProfile(prev => ({
      ...prev,
      location: addressData.formattedAddress,
      city: addressData.locality || '',
      postcode: addressData.postalCode || '',
      country: addressData.country || 'USA',
      latitude: addressData.latitude,
      longitude: addressData.longitude
    }));
    
    toast({
      title: "Address updated",
      description: `Location set for ${addressData.locality ? addressData.locality + ', ' : ''}${addressData.country}`,
    });
  };

  const handleManualLocationChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="profile-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{isUpdate ? 'Update Your Worker Profile' : 'Complete Your Worker Profile'}</span>
          </DialogTitle>
          <p id="profile-dialog-description" className="text-sm text-muted-foreground">
            {isUpdate ? 'Update your professional information and location details.' : 'Complete your profile to start receiving bookings and increase your visibility.'}
          </p>
        </DialogHeader>
        
        {fetchingData && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading profile data...</span>
          </div>
        )}
        
        <div className={`space-y-6 ${fetchingData ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <Briefcase className="h-4 w-4" />
              <span>Professional Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={profile.hourly_rate}
                  onChange={(e) => setProfile(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  placeholder="Your hourly rate"
                  required
                />
              </div>
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  type="number"
                  value={profile.experience_years}
                  onChange={(e) => setProfile(prev => ({ ...prev, experience_years: e.target.value }))}
                  placeholder="Years of experience"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleManualLocationChange('phone', e.target.value)}
                  placeholder="Your phone number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="service_radius">Service Radius (miles)</Label>
                <Input
                  id="service_radius"
                  type="number"
                  value={profile.service_radius_miles}
                  onChange={(e) => handleManualLocationChange('service_radius_miles', e.target.value)}
                  placeholder="Service radius in miles"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleManualLocationChange('bio', e.target.value)}
                placeholder="Tell clients about yourself and your services..."
                rows={3}
                required
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Location & Service Area</span>
            </h3>
            
            {/* Google Maps Autocomplete */}
            <div className="space-y-4">
              <Label>Address Lookup</Label>
              <GoogleMapsAutocomplete
                onAddressSelect={handleAddressSelect}
                placeholder="Enter postcode or address"
                label="Search Address"
                className="w-full"
              />
            </div>

            {/* Address Fields Display */}
            {(profile.location || profile.city || profile.postcode) && (
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Address Set</p>
                {profile.location && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Address: {profile.location}
                  </p>
                )}
                {(profile.city || profile.postcode || profile.country) && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Location: {profile.city}{profile.city && profile.postcode ? ', ' : ''}{profile.postcode}{(profile.city || profile.postcode) && profile.country ? ', ' : ''}{profile.country}
                  </p>
                )}
                {(profile.latitude && profile.longitude) && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Coordinates: {profile.latitude.toFixed(6)}, {profile.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            )}

            {/* Manual Address Fields for editing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="location">Street Address</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => handleManualLocationChange('location', e.target.value)}
                  placeholder="Your street address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => handleManualLocationChange('city', e.target.value)}
                  placeholder="Your city"
                  required
                />
              </div>
              <div>
                <Label htmlFor="postcode">Postal Code</Label>
                <Input
                  id="postcode"
                  value={profile.postcode}
                  onChange={(e) => handleManualLocationChange('postcode', e.target.value)}
                  placeholder="Postal code"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profile.country}
                  onChange={(e) => handleManualLocationChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Service Radius - Always Show */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_radius">Service Radius (miles)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="service_radius"
                    type="number"
                    value={profile.service_radius_miles}
                    onChange={(e) => setProfile(prev => ({ ...prev, service_radius_miles: e.target.value }))}
                    placeholder="Service radius in miles"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="online_services">Offer Online Services</Label>
                  <p className="text-sm text-muted-foreground">Provide remote/online services without location restrictions</p>
                </div>
              </div>
              <Switch
                id="online_services"
                checked={profile.online_services}
                onCheckedChange={(checked) => setProfile(prev => ({ ...prev, online_services: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Skip for Now
            </Button>
            <Button onClick={handleSubmit} disabled={loading || fetchingData}>
              {loading ? "Saving..." : isUpdate ? "Update Profile" : "Complete Profile"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};