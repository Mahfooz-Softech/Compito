import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from 'lucide-react';

interface SetAvailabilityDialogProps {
  onAvailabilitySet: () => void;
}

const SetAvailabilityDialog = ({ onAvailabilitySet }: SetAvailabilityDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [availability, setAvailability] = useState({
    monday: { enabled: false, start_time: '09:00', end_time: '17:00' },
    tuesday: { enabled: false, start_time: '09:00', end_time: '17:00' },
    wednesday: { enabled: false, start_time: '09:00', end_time: '17:00' },
    thursday: { enabled: false, start_time: '09:00', end_time: '17:00' },
    friday: { enabled: false, start_time: '09:00', end_time: '17:00' },
    saturday: { enabled: false, start_time: '09:00', end_time: '17:00' },
    sunday: { enabled: false, start_time: '09:00', end_time: '17:00' }
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  const handleDayToggle = (day: string, enabled: boolean) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], enabled }
    }));
  };

  const handleTimeChange = (day: string, timeType: 'start_time' | 'end_time', time: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [timeType]: time }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      // Delete existing availability
      await supabase
        .from('worker_availability')
        .delete()
        .eq('worker_id', user.id);

      // Insert new availability
      const dayMapping: { [key: string]: number } = {
        'monday': 1,
        'tuesday': 2, 
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
        'sunday': 0
      };

      const availabilityData = Object.entries(availability)
        .filter(([_, dayData]) => dayData.enabled)
        .map(([day, dayData]) => ({
          worker_id: user.id,
          day_of_week: dayMapping[day],
          start_time: dayData.start_time,
          end_time: dayData.end_time,
          is_available: true
        }));

      if (availabilityData.length > 0) {
        const { error } = await supabase
          .from('worker_availability')
          .insert(availabilityData);

        if (error) throw error;
      }

      toast({
        title: "Availability updated",
        description: "Your availability has been set successfully.",
      });

      setOpen(false);
      onAvailabilitySet();
    } catch (error) {
      console.error('Error setting availability:', error);
      toast({
        title: "Error",
        description: "Failed to set availability. Please try again.",
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
          <Calendar className="h-4 w-4 mr-2" />
          Set Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Your Availability</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {daysOfWeek.map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <Checkbox
                    id={key}
                    checked={availability[key as keyof typeof availability].enabled}
                    onCheckedChange={(checked) => handleDayToggle(key, checked as boolean)}
                  />
                  <Label htmlFor={key} className="font-medium">
                    {label}
                  </Label>
                </div>
                
                {availability[key as keyof typeof availability].enabled && (
                  <div className="flex items-center space-x-2 flex-1">
                    <Select
                      value={availability[key as keyof typeof availability].start_time}
                      onValueChange={(value) => handleTimeChange(key, 'start_time', value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <span className="text-muted-foreground">to</span>
                    
                    <Select
                      value={availability[key as keyof typeof availability].end_time}
                      onValueChange={(value) => handleTimeChange(key, 'end_time', value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Availability"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SetAvailabilityDialog;