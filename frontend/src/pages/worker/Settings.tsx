import React, { useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useWorkerData } from '@/hooks/useWorkerData';
import { ProfileCompletionDialog } from '@/components/worker/ProfileCompletionDialog';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Edit,
  Save
} from 'lucide-react';

const WorkerSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading, workerProfile, profileCompletion, fetchWorkerData } = useWorkerData();
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    bio: '',
    hourly_rate: '',
    experience_years: '',
    skills: [] as string[]
  });
  
  const [notificationSettings, setNotificationSettings] = React.useState({
    email_notifications: true,
    sms_notifications: false,
    booking_alerts: true,
    review_alerts: true,
    payment_alerts: true
  });
  
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
    confirm: false
  });

  React.useEffect(() => {
    if (workerProfile) {
      setFormData({
        bio: workerProfile.bio || '',
        hourly_rate: workerProfile.hourly_rate?.toString() || '',
        experience_years: workerProfile.experience_years?.toString() || '',
        skills: Array.isArray(workerProfile.skills) ? workerProfile.skills : []
      });
    }
  }, [workerProfile]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleSaveProfile = useCallback(async () => {
    try {
      const updateData = {
        bio: formData.bio,
        hourly_rate: parseFloat(formData.hourly_rate) || null,
        experience_years: parseInt(formData.experience_years) || null,
        skills: formData.skills
      };

      const { error } = await supabase
        .from('worker_profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
      fetchWorkerData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    }
  }, [formData, toast]);

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNotificationChange = useCallback((field: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePasswordChange = useCallback((field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTogglePasswordVisibility = useCallback((field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleProfileDialogOpen = useCallback(() => {
    setProfileDialogOpen(true);
  }, []);

  const handleProfileDialogClose = useCallback(() => {
    setProfileDialogOpen(false);
  }, []);

  const handleProfileDialogComplete = useCallback(() => {
    handleProfileDialogClose();
    fetchWorkerData();
  }, [handleProfileDialogClose, fetchWorkerData]);

  // Memoize profile completion display to prevent unnecessary re-renders
  const profileCompletionDisplay = useMemo(() => {
    const percentage = profileCompletion;
    const color = percentage >= 80 ? 'text-success' : percentage >= 60 ? 'text-warning' : 'text-destructive';
    
    return (
      <div className="text-center">
        <CircularProgress 
          value={percentage} 
          size={80} 
          strokeWidth={8}
          className={color}
        />
        <p className="text-sm text-muted-foreground mt-2">
          {percentage}% Complete
        </p>
      </div>
    );
  }, [profileCompletion]);

  // Memoize skills display to prevent unnecessary re-renders
  const skillsDisplay = useMemo(() => 
    formData.skills.map((skill, index) => (
      <Badge key={index} variant="secondary" className="mr-2 mb-2">
        {skill}
      </Badge>
    )), [formData.skills]
  );

  if (loading) {
    return (
      <DashboardLayout userType="worker" title="Settings">
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
    <DashboardLayout userType="worker" title="Settings">
      <div className="space-y-6">
        {/* Profile Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Completion</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {profileCompletionDisplay}
              <div className="text-left">
                <h3 className="font-semibold mb-2">Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  A complete profile helps you get more bookings and build trust with customers.
                </p>
                <Button onClick={handleProfileDialogOpen}>
                  Complete Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Settings</span>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={formData.bio}
                onChange={(e) => handleFormChange('bio', e.target.value)}
                disabled={!isEditing}
                placeholder="Tell customers about yourself and your services..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => handleFormChange('hourly_rate', e.target.value)}
                  disabled={!isEditing}
                  placeholder="25"
                />
              </div>
              
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => handleFormChange('experience_years', e.target.value)}
                  disabled={!isEditing}
                  placeholder="5"
                />
              </div>
            </div>
            
            <div>
              <Label>Skills</Label>
              <div className="mt-2">
                {skillsDisplay}
              </div>
              {isEditing && (
                <Input
                  placeholder="Add a skill and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleFormChange('skills', [...formData.skills, e.currentTarget.value.trim()]);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="mt-2"
                />
              )}
            </div>
            
            {isEditing && (
              <div className="flex space-x-2">
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={notificationSettings.email_notifications}
                onCheckedChange={(checked) => handleNotificationChange('email_notifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive urgent updates via SMS</p>
              </div>
              <Switch
                checked={notificationSettings.sms_notifications}
                onCheckedChange={(checked) => handleNotificationChange('sms_notifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Booking Alerts</Label>
                <p className="text-xs text-muted-foreground">New booking notifications</p>
              </div>
              <Switch
                checked={notificationSettings.booking_alerts}
                onCheckedChange={(checked) => handleNotificationChange('booking_alerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Review Alerts</Label>
                <p className="text-xs text-muted-foreground">New review notifications</p>
              </div>
              <Switch
                checked={notificationSettings.review_alerts}
                onCheckedChange={(checked) => handleNotificationChange('review_alerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Payment Alerts</Label>
                <p className="text-xs text-muted-foreground">Payment and earnings updates</p>
              </div>
              <Switch
                checked={notificationSettings.payment_alerts}
                onCheckedChange={(checked) => handleNotificationChange('payment_alerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => handleTogglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => handleTogglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => handleTogglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion Dialog */}
      <ProfileCompletionDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onComplete={handleProfileDialogComplete}
        onProfileUpdated={fetchWorkerData}
        isUpdate={true}
      />
    </DashboardLayout>
  );
};

export default WorkerSettings;