import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Eye, Calendar, Clock, MapPin, DollarSign, User, Wrench } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  actions?: boolean;
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  variant?: 'default' | 'bookings' | 'jobs';
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  actions = true,
  onView,
  onEdit,
  onDelete,
  variant = 'default'
}) => {
  const renderCell = (column: Column, row: any) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }

    // Global safety: never render raw objects/arrays as children
    const safePrimitive = (v: any) => {
      if (v == null) return '';
      const t = typeof v;
      if (t === 'string' || t === 'number' || t === 'boolean') return String(v);
      return '';
    };
    
    // Enhanced status badge rendering with better colors and icons
    if (column.key === 'status') {
      const statusConfig: Record<string, { color: string; bgColor: string; icon?: React.ReactNode }> = {
        'completed': { color: 'text-green-700', bgColor: 'bg-green-100 border-green-200' },
        'pending': { color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-200' },
        'cancelled': { color: 'text-red-700', bgColor: 'bg-red-100 border-red-200' },
        'confirmed': { color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200' },
        'in_progress': { color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-200' },
        'scheduled': { color: 'text-indigo-700', bgColor: 'bg-indigo-100 border-indigo-200' },
        'pending_payment': { color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-200' },
        'worker_completed': { color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-200' }
      };
      
      const config = statusConfig[value] || { color: 'text-gray-700', bgColor: 'bg-gray-100 border-gray-200' };
      
      return (
        <Badge 
          variant="outline" 
          className={`${config.bgColor} ${config.color} border-2 font-semibold px-3 py-1 rounded-full text-xs`}
        >
          {value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      );
    }
    
    // Enhanced amount rendering with currency styling
    if (column.key === 'amount' && typeof value === 'string' && value.includes('$')) {
      return (
        <span className="font-bold text-green-600 text-lg">
          {safePrimitive(value)}
        </span>
      );
    }
    
    // Enhanced date rendering with calendar icon
    if (column.key === 'date') {
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-gray-700">{safePrimitive(value)}</span>
        </div>
      );
    }
    
    // Enhanced time rendering with clock icon
    if (column.key === 'time') {
      return (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span className="font-medium text-gray-700">{safePrimitive(value)}</span>
        </div>
      );
    }
    
    // Enhanced service rendering with wrench icon
    if (column.key === 'service') {
      return (
        <div className="flex items-center space-x-2">
          <Wrench className="h-4 w-4 text-purple-500" />
          <span className="font-medium text-gray-800">{safePrimitive(value)}</span>
        </div>
      );
    }
    
    // Enhanced worker/client rendering with user icon
    if (column.key === 'worker' || column.key === 'client') {
      return (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-gray-800">{safePrimitive(value)}</span>
        </div>
      );
    }
    
    return (
      <span className="text-gray-700 font-medium">{safePrimitive(value)}</span>
    );
  };

  const getTableStyles = () => {
    switch (variant) {
      case 'bookings':
        return 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-xl';
      case 'jobs':
        return 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-xl';
      default:
        return 'bg-white border-border shadow-lg';
    }
  };

  const getHeaderStyles = () => {
    switch (variant) {
      case 'bookings':
        return 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-b-purple-300';
      case 'jobs':
        return 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-b-purple-300';
      default:
        return 'bg-muted/50 text-foreground border-b-border';
    }
  };

  return (
    <Card className={`${getTableStyles()} border-2 transition-all duration-300 hover:shadow-2xl`}>
      <CardHeader className={`${getHeaderStyles()} rounded-t-lg`}>
        <CardTitle className="flex items-center space-x-3 text-xl font-bold">
          {variant === 'bookings' && <Calendar className="h-6 w-6 text-purple-100" />}
          {variant === 'jobs' && <Wrench className="h-6 w-6 text-purple-100" />}
          <span>{title}</span>
          <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
            {data.length} {data.length === 1 ? 'item' : 'items'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${getHeaderStyles()} border-b-2`}>
                {columns.map((column) => (
                  <th key={column.key} className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wide">
                    {column.label}
                  </th>
                ))}
                {actions && <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-3 text-muted-foreground">
                      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                        {variant === 'bookings' ? (
                          <Calendar className="h-8 w-8" />
                        ) : variant === 'jobs' ? (
                          <Wrench className="h-8 w-8" />
                        ) : (
                          <MoreHorizontal className="h-8 w-8" />
                        )}
                      </div>
                      <p className="text-lg font-medium">No {variant === 'bookings' ? 'bookings' : variant === 'jobs' ? 'jobs' : 'data'} found</p>
                      <p className="text-sm">Start by creating your first {variant === 'bookings' ? 'booking' : variant === 'jobs' ? 'job' : 'item'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`
                      border-b border-border/50 hover:bg-white/80 transition-all duration-200 
                      ${index % 2 === 0 ? 'bg-white/50' : 'bg-white/30'}
                      hover:shadow-md hover:scale-[1.01] transform
                    `}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="py-4 px-6">
                        {renderCell(column, row)}
                      </td>
                    ))}
                    {actions && (
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(row)} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2 text-blue-500" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(row)} className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2 text-green-500" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(row)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};