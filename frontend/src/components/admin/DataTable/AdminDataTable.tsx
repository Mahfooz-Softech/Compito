import React from 'react';
import { DataTable } from '@/components/dashboard/DataTable';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface AdminDataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  actions?: boolean;
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}

// Wrapper that injects admin-safe default renderers for common nested fields
export const AdminDataTable: React.FC<AdminDataTableProps> = ({
  title,
  columns,
  data,
  actions,
  onView,
  onEdit,
  onDelete,
}) => {
  const withDefaults: Column[] = columns.map((col) => {
    if (col.render) return col;

    // Common admin defaults
    if (col.key === 'worker') {
      return {
        ...col,
        render: (_: any, row: any) =>
          row.worker?.profile
            ? `${row.worker.profile.first_name ?? ''} ${row.worker.profile.last_name ?? ''}`.trim() || 'Unknown'
            : (typeof row.worker === 'string' ? row.worker : 'Unknown'),
      };
    }
    if (col.key === 'customer' || col.key === 'profile' || col.key === 'user') {
      return {
        ...col,
        render: (_: any, row: any) =>
          row.profile
            ? `${row.profile.first_name ?? ''} ${row.profile.last_name ?? ''}`.trim() || 'Unknown'
            : row.user
              ? `${row.user.first_name ?? ''} ${row.user.last_name ?? ''}`.trim() || 'Unknown'
              : 'Unknown',
      };
    }
    if (col.key === 'category') {
      return {
        ...col,
        render: (_: any, row: any) => row.category?.name ?? (typeof row.category === 'string' ? row.category : 'Uncategorized'),
      };
    }
    if (col.key === 'amount' || col.key === 'total' || col.key === 'total_amount' || col.key === 'commission_amount') {
      return {
        ...col,
        render: (value: any) => `$${Number(value ?? 0).toFixed(2)}`,
      };
    }
    return col;
  });

  return (
    <DataTable
      title={title}
      columns={withDefaults}
      data={data}
      actions={actions}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};







