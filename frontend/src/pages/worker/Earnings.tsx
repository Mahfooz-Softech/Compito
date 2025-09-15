import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EarningsCard } from '@/components/worker/EarningsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useWorkerEarnings } from '@/hooks/useWorkerEarnings';
import { useWorkerData } from '@/hooks/useWorkerData';
import { DollarSign, TrendingUp, Calendar, Clock, User } from 'lucide-react';

const WorkerEarnings = () => {
  const { loading, earnings, recentEarnings, getGrowthPercentage } = useWorkerEarnings();
  const { stats } = useWorkerData();

  if (loading) {
    return (
      <DashboardLayout userType="worker" title="Earnings">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading earnings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="worker" title="Earnings">
      <div className="space-y-6">


        {/* Commission & Category Overview */}
        <EarningsCard stats={stats} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                <span>Total Earnings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${earnings.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{getGrowthPercentage()} from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                <span>This Month</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${earnings.thisMonth.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{earnings.jobsThisMonth} jobs completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>Average per Job</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${earnings.average.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Based on completed jobs</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEarnings.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No earnings yet</p>
                <p className="text-sm text-muted-foreground">Complete jobs to start earning</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEarnings.map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium">{earning.service}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{earning.customer}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{earning.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{earning.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Job Total: ${Number(earning.grossAmount || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-destructive">
                        Commission: -${Number(earning.commissionAmount || 0).toFixed(2)} ({(Number(earning.commissionRate || 0) * 100).toFixed(1)}%)
                      </div>
                       <p className="font-medium text-success text-lg">Take-home: ${Number(earning.amount || 0).toFixed(2)}</p>
                       <Badge 
                         variant={earning.isPending ? "destructive" : "default"} 
                         className="text-xs"
                       >
                         {earning.status}
                       </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WorkerEarnings;