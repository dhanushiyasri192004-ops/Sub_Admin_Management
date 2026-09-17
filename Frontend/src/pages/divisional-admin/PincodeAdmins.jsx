import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/DataTable';
import { ShieldCheck, MapPin } from 'lucide-react';

export function DivisionalPincodeAdmins() {
  const { user } = useAuth();
  const divisionName = user?.division || 'Salem North';

  const [admins] = useState([]);

  const columns = [
    {
      header: 'Pincode Administrator',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">{row.name}</div>
            <div className="text-[11px] text-slate-500 font-mono">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Pincode',
      accessor: 'pincode',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-blue-600 dark:text-emerald-300 text-xs">
            PIN: {row.pincode}
          </span>
          <div className="text-[11px] text-slate-500">{row.area}</div>
        </div>
      )
    },
    {
      header: 'Division',
      accessor: 'division',
      render: (row) => <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{row.division}</span>
    },
    {
      header: 'Contact Phone',
      accessor: 'phone',
      render: (row) => <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{row.phone}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40">
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Supervised Pincode Admins</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pincode administrators operating under {divisionName} Division jurisdiction.
        </p>
      </div>

      <DataTable
        title="Pincode Administrators Roster"
        subtitle="Manage and monitor appointed local administrators"
        columns={columns}
        data={admins}
        searchPlaceholder="Search admin name..."
        exportFileName="divisional_pincode_admins.csv"
      />
    </div>
  );
}
