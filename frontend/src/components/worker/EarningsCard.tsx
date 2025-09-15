import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Award } from 'lucide-react';

interface EarningsCardProps {
  stats: {
    monthlyEarnings: number;
    monthlyGrossEarnings: number;
    monthlyCommission: number;
    jobsCompleted: number;
    averageRating: number;
    activeClients: number;
    category: string;
    commissionRate: number;
  };
}

export const EarningsCard: React.FC<EarningsCardProps> = ({ stats }) => {
  // Normalize to prevent calling toFixed on undefined
  const monthlyEarnings = Number((stats as any)?.monthlyEarnings ?? 0);
  const monthlyGrossEarnings = Number((stats as any)?.monthlyGrossEarnings ?? 0);
  const monthlyCommission = Number((stats as any)?.monthlyCommission ?? 0);
  const commissionRate = Number((stats as any)?.commissionRate ?? 0);
  const activeClients = Number((stats as any)?.activeClients ?? 0);
  const category = (stats as any)?.category ?? 'Uncategorized';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">${monthlyEarnings.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">After commission</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gross Earnings</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${monthlyGrossEarnings.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Before commission</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
          <Award className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">${monthlyCommission.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">{(commissionRate * 100).toFixed(1)}% rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Worker Category</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm font-medium">
              {category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {activeClients} unique customers served
          </p>
        </CardContent>
      </Card>
    </div>
  );
};