import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkerAvailability } from '@/hooks/useWorkerAvailability';
import SetAvailabilityDialog from '@/components/worker/SetAvailabilityDialog';
import { Calendar, Clock, MapPin, User, CheckCircle, Phone } from 'lucide-react';

const WorkerSchedule = () => {
  const { loading, todayAppointments, weekAvailability, refetch } = useWorkerAvailability();

  if (loading) {
    return (
      <DashboardLayout userType="worker" title="My Schedule">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading schedule...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="worker" title="My Schedule">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Schedule</h1>
            <p className="text-muted-foreground">Manage your upcoming appointments</p>
          </div>
          <SetAvailabilityDialog onAvailabilitySet={refetch} />
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Today's Appointments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{appointment.service}</h3>
                          <Badge variant={appointment.status === 'scheduled' ? 'secondary' : 'default'}>
                            {appointment.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{appointment.client}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-success">{appointment.amount}</p>
                        <p className="text-xs text-muted-foreground">{appointment.duration}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <MapPin className="h-4 w-4 mr-1" />
                        Directions
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4 mr-1" />
                        Contact Client
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Availability Overview */}
        <Card>
          <CardHeader>
            <CardTitle>This Week's Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {weekAvailability.map((day) => (
                <div key={day.dayName} className={`text-center p-3 rounded-lg border ${day.isToday ? 'bg-primary/5 border-primary/20' : ''}`}>
                  <div className="font-medium text-sm mb-2">
                    {day.shortName}
                    {day.isToday && <Badge variant="secondary" className="ml-1 text-xs">Today</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {day.date.getDate()}/{day.date.getMonth() + 1}
                  </div>
                  <div className="space-y-1">
                    {day.availability.length === 0 ? (
                      <div className="text-xs text-muted-foreground">Not Available</div>
                    ) : (
                      day.availability.map((slot, index) => (
                        <div key={index} className="bg-success/10 text-success text-xs p-1 rounded">
                          {slot.start_time} - {slot.end_time}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {weekAvailability.every(day => day.availability.length === 0) && (
              <div className="text-center mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground mb-2">No availability set for this week</p>
                <SetAvailabilityDialog onAvailabilitySet={refetch} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WorkerSchedule;