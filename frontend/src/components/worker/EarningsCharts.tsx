import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Award, BarChart3, PieChart, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EarningsChartsProps {
  stats: {
    monthlyEarnings: number;
    monthlyGrossEarnings: number;
    monthlyCommission: number;
    jobsCompleted: number;
    averageRating: number;
    activeClients: number;
    category: string;
    commissionRate: number;
    monthlyEarningsData: Array<{
      month: string;
      gross: number;
      net: number;
      commission: number;
    }>;
  };
}

export const EarningsCharts: React.FC<EarningsChartsProps> = ({ stats }) => {
  // Convert all stats to numbers to prevent toFixed errors
  const monthlyEarnings = Number(stats.monthlyEarnings || 0);
  const monthlyGrossEarnings = Number(stats.monthlyGrossEarnings || 0);
  const monthlyCommission = Number(stats.monthlyCommission || 0);
  const jobsCompleted = Number(stats.jobsCompleted || 0);
  const averageRating = Number(stats.averageRating || 0);
  const activeClients = Number(stats.activeClients || 0);
  const commissionRate = Number(stats.commissionRate || 0);

  // Debug logging to see what data we're receiving
  console.log('EarningsCharts: Received stats:', {
    monthlyEarnings,
    monthlyGrossEarnings,
    monthlyCommission,
    monthlyEarningsData: stats.monthlyEarningsData,
    monthlyEarningsDataLength: stats.monthlyEarningsData?.length || 0
  });

  // Calculate percentages for pie chart (with safety checks)
  const netEarningsPercent = monthlyGrossEarnings > 0 ? (monthlyEarnings / monthlyGrossEarnings) * 100 : 0;
  const commissionPercent = monthlyGrossEarnings > 0 ? (monthlyCommission / monthlyGrossEarnings) * 100 : 0;

  // Transform API data to match component expectations (ensure all values are numbers)
  const monthlyData = (stats.monthlyEarningsData || []).map(item => {
    const earnings = Number(item.earnings || 0);
    return {
      month: item.month,
      gross: earnings,
      net: earnings * 0.85, // Assume 15% commission
      commission: earnings * 0.15 // Assume 15% commission
    };
  });

  return (
    <div className="space-y-6">
      {/* No Data Message */}
      {monthlyGrossEarnings === 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800">No Earnings Data Available</h3>
            </div>
            <p className="text-yellow-700">
              You haven't completed any jobs yet this month. Complete jobs to see your earnings data and charts.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards Row */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-green-800">Net Earnings</CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 mb-2">${monthlyEarnings.toFixed(2)}</div>
            <p className="text-sm text-green-600 font-medium">After commission</p>
            <div className="mt-3 w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${netEarningsPercent}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-blue-800">Gross Earnings</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 mb-2">${monthlyGrossEarnings.toFixed(2)}</div>
            <p className="text-sm text-blue-600 font-medium">Before commission</p>
            <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-4 pb-3">
            <CardTitle className="text-base font-semibold text-purple-800">Commission Paid</CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 mb-2">${monthlyCommission.toFixed(2)}</div>
            <p className="text-sm text-purple-600 font-medium">{(commissionRate * 100).toFixed(1)}% rate</p>
            <div className="mt-3 w-full bg-purple-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${commissionPercent}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Earnings Breakdown Pie Chart */}
         <Card className="border-2 border-transparent hover:border-green-200 transition-all duration-300 shadow-lg hover:shadow-xl">
           <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
             <CardTitle className="flex items-center space-x-2 text-green-800">
               <PieChart className="h-6 w-6 text-green-600" />
               <span className="text-lg font-semibold">Earnings Breakdown</span>
             </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
             <div className="space-y-6">
               {/* Enhanced Pie Chart */}
               <div className="relative w-40 h-40 mx-auto">
                 {/* Outer ring for better visual appeal */}
                 <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 border-4 border-green-200 shadow-inner"></div>
                 
                 {/* Net Earnings Segment */}
                 <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg"></div>
                 
                                   {/* Commission Segment with proper pie slice */}
                  {commissionPercent > 0 && (
                    <div 
                      className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 shadow-lg"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + (commissionPercent * 0.4)}% 0%, 50% 50%)`
                      }}
                    ></div>
                  )}
                 
                 {/* Center circle with total */}
                 <div className="absolute inset-6 rounded-full bg-white border-2 border-green-200 shadow-lg flex items-center justify-center">
                   <div className="text-center">
                     <div className="text-xl font-bold text-green-800">${monthlyGrossEarnings.toFixed(0)}</div>
                     <div className="text-xs text-green-600 font-medium">Total</div>
                   </div>
                 </div>
                 
                 {/* Hover tooltips for segments */}
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div 
                         className="absolute inset-2 rounded-full cursor-pointer"
                         style={{ clipPath: `polygon(50% 50%, 50% 0%, ${50 + (commissionPercent * 0.4)}% 0%, 50% 50%)` }}
                       ></div>
                     </TooltipTrigger>
                     <TooltipContent className="bg-purple-600 text-white border-0">
                       <p>Commission: ${monthlyCommission.toFixed(2)}</p>
                       <p>({commissionPercent.toFixed(1)}%)</p>
                     </TooltipContent>
                   </Tooltip>
                   
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="absolute inset-2 rounded-full cursor-pointer"></div>
                     </TooltipTrigger>
                     <TooltipContent className="bg-green-600 text-white border-0">
                       <p>Net Earnings: ${monthlyEarnings.toFixed(2)}</p>
                       <p>({netEarningsPercent.toFixed(1)}%)</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
               </div>
               
               {/* Enhanced Legend */}
               <div className="grid grid-cols-2 gap-4 pt-3">
                 <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                   <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-sm"></div>
                   <div>
                     <div className="text-sm font-semibold text-green-800">Net Earnings</div>
                     <div className="text-xs text-green-600">{netEarningsPercent.toFixed(1)}%</div>
                   </div>
                 </div>
                 <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                   <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full shadow-sm"></div>
                   <div>
                     <div className="text-sm font-semibold text-purple-800">Commission</div>
                     <div className="text-xs text-purple-600">{commissionPercent.toFixed(1)}%</div>
                   </div>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>

                 {/* Monthly Trend Line Chart */}
         <Card className="border-2 border-transparent hover:border-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl">
           <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
             <CardTitle className="flex items-center space-x-2 text-blue-800">
               <BarChart3 className="h-6 w-6 text-blue-600" />
               <span className="text-lg font-semibold">12-Month Trend</span>
             </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
             <div className="space-y-6">
                               {/* Enhanced Line Chart */}
                <div className="h-40 relative">
                  {/* Calculate max value for Y-axis scaling */}
                  {monthlyData.length > 0 && (
                    <>
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs font-medium text-blue-600">
                        <span>${Math.max(...monthlyData.map(d => d.gross)).toFixed(0)}</span>
                        <span>${(Math.max(...monthlyData.map(d => d.gross)) * 0.5).toFixed(0)}</span>
                        <span>$0</span>
                      </div>
                      
                      {/* Chart area */}
                      <div className="ml-12 h-full relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 grid grid-cols-11 divide-x divide-blue-100">
                          {[...Array(11)].map((_, i) => (
                            <div key={i} className="h-full border-l border-blue-100"></div>
                          ))}
                        </div>
                        
                        {/* Horizontal grid lines */}
                        <div className="absolute inset-0 grid grid-rows-3 divide-y divide-blue-100">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-full border-t border-blue-100"></div>
                          ))}
                        </div>
                        
                        {/* Line chart with enhanced styling */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {/* Gross earnings line with shadow */}
                          <defs>
                            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#3B82F6" floodOpacity="0.3"/>
                            </filter>
                          </defs>
                          
                          {/* Gross earnings line */}
                          <polyline
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#shadow)"
                            points={monthlyData.map((data, i) => {
                              const maxGross = Math.max(...monthlyData.map(d => d.gross));
                              const y = maxGross > 0 ? 100 - ((data.gross / maxGross) * 100) : 50;
                              return `${(i / (monthlyData.length - 1)) * 100},${y}`;
                            }).join(' ')}
                          />
                          
                          {/* Net earnings line */}
                          <polyline
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#shadow)"
                            points={monthlyData.map((data, i) => {
                              const maxGross = Math.max(...monthlyData.map(d => d.gross));
                              const y = maxGross > 0 ? 100 - ((data.net / maxGross) * 100) : 50;
                              return `${(i / (monthlyData.length - 1)) * 100},${y}`;
                            }).join(' ')}
                          />
                        </svg>
                        
                        {/* Interactive Data Points with Tooltips */}
                        <TooltipProvider>
                          {monthlyData.map((data, i) => {
                            const maxGross = Math.max(...monthlyData.map(d => d.gross));
                            const y = maxGross > 0 ? 100 - ((data.gross / maxGross) * 100) : 50;
                            return (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1.5 -translate-y-1.5 cursor-pointer hover:scale-150 hover:bg-blue-600 transition-all duration-200 shadow-lg"
                                    style={{
                                      left: `${(i / (monthlyData.length - 1)) * 100}%`,
                                      top: `${y}%`
                                    }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="bg-blue-600 text-white border-0">
                                  <p className="font-semibold">{data.month}</p>
                                  <p>Gross: ${data.gross.toFixed(2)}</p>
                                  <p>Net: ${data.net.toFixed(2)}</p>
                                  <p>Commission: ${data.commission.toFixed(2)}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </TooltipProvider>
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="ml-12 mt-4 flex justify-between text-sm font-medium text-blue-600">
                        {monthlyData.map((data, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 rounded-md">{data.month}</span>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Show message if no data */}
                  {monthlyData.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>No earnings data available</p>
                    </div>
                  )}
                </div>
               
               {/* Enhanced Legend */}
               <div className="grid grid-cols-2 gap-4 pt-10">
                 <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                   <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full shadow-sm"></div>
                   <div>
                     <div className="text-sm font-semibold text-blue-800">Gross Earnings</div>
                     <div className="text-xs text-blue-600">Before commission</div>
                   </div>
                 </div>
                 <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                   <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-sm"></div>
                   <div>
                     <div className="text-sm font-semibold text-green-800">Net Earnings</div>
                     <div className="text-xs text-green-600">After commission</div>
                   </div>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-slate-100 border-b border-gray-200">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-gray-600" />
            <span>Performance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors duration-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">{jobsCompleted}</div>
              <div className="text-sm font-medium text-blue-700">Jobs Completed</div>
              <div className="w-16 h-1 bg-blue-200 rounded-full mx-auto mt-2">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${Math.min((jobsCompleted / 50) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors duration-200">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{averageRating.toFixed(1)}</div>
              <div className="text-sm font-medium text-yellow-700">Average Rating</div>
              <div className="w-16 h-1 bg-yellow-200 rounded-full mx-auto mt-2">
                <div className="bg-yellow-500 h-1 rounded-full" style={{ width: `${(averageRating / 5) * 100}%` }}></div>
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200">
              <div className="text-3xl font-bold text-green-600 mb-2">{activeClients}</div>
              <div className="text-sm font-medium text-green-700">Active Clients</div>
              <div className="w-16 h-1 bg-green-200 rounded-full mx-auto mt-2">
                <div className="bg-green-500 h-1 rounded-full" style={{ width: `${Math.min((activeClients / 20) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors duration-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">{(commissionRate * 100).toFixed(1)}%</div>
              <div className="text-sm font-medium text-purple-700">Commission Rate</div>
              <div className="w-16 h-1 bg-purple-200 rounded-full mx-auto mt-2">
                <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${(commissionRate * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
