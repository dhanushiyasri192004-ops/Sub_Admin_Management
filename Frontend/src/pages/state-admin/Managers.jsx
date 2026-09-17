import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/Badge';
import { ManagerApprovalModal } from '../../components/ManagerApprovalModal';
import { useTheme } from '../../context/ThemeContext';
import {
  UserCog,
  Phone,
  Building2,
  Layers,
  MapPin,
  Award,
  Users,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  Eye,
  Check,
  RefreshCw,
  Filter
} from 'lucide-react';

const LEVEL_CONFIGS = {
  state: {
    title: 'State Managers',
    subtitle: 'Apex state-level operations managers, nodal coordinators, and zone directors across Tamil Nadu.',
    breadcrumb: 'State Managers',
    badge: 'State Manager',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
    icon: Award,
    tableTitle: 'State Operations Management Directory',
    tableSubtitle: 'Master executive managers overseeing district nodes, strategic ops, and state compliance',
    exportFile: 'state_managers.csv'
  },
  district: {
    title: 'District Managers',
    subtitle: 'District-level operational leaders managing divisional networks, logistics hubs, and territorial compliance.',
    breadcrumb: 'District Managers',
    badge: 'District Manager',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
    icon: Building2,
    tableTitle: 'District Manager Roster',
    tableSubtitle: 'Regional management leads managing division clusters, field supervisors, and admin operations',
    exportFile: 'district_managers.csv'
  },
  divisional: {
    title: 'Divisional Managers',
    subtitle: 'Divisional operations managers supervising pincode clusters, delivery terminals, and local coordinators.',
    breadcrumb: 'Divisional Managers',
    badge: 'Divisional Manager',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: Layers,
    tableTitle: 'Divisional Manager Directory',
    tableSubtitle: 'Zonal hub leaders monitoring daily dispatch, field workforce, and local customer escalations',
    exportFile: 'divisional_managers.csv'
  },
  pincode: {
    title: 'Pincode Managers',
    subtitle: 'Hyperlocal pincode managers responsible for last-mile delivery SLA, agent coordination, and merchant liaison.',
    breadcrumb: 'Pincode Managers',
    badge: 'Pincode Manager',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
    icon: MapPin,
    tableTitle: 'Pincode Micro-Zone Manager Roster',
    tableSubtitle: 'Last-mile facility managers and field operations leads assigned to postal zones',
    exportFile: 'pincode_managers.csv'
  }
};

export function StateManagers({ level }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'active'
  const [selectedManager, setSelectedManager] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Identify admin role
  const userRole = (user?.role || '').toLowerCase();

  // Determine active level from path or prop
  let activeLevel = 'state';
  if (location.pathname.includes('/managers/district')) activeLevel = 'district';
  else if (location.pathname.includes('/managers/divisional')) activeLevel = 'divisional';
  else if (location.pathname.includes('/managers/pincode')) activeLevel = 'pincode';
  else if (location.pathname.includes('/managers/state')) activeLevel = 'state';
  else if (level) activeLevel = level;
  else {
    activeLevel = userRole.includes('district')
      ? 'district'
      : userRole.includes('division') || userRole.includes('divisional')
      ? 'divisional'
      : userRole.includes('pincode')
      ? 'pincode'
      : 'state';
  }

  const config = LEVEL_CONFIGS[activeLevel] || LEVEL_CONFIGS.state;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dataService.getManagers({ level: activeLevel });
      if (res.success && Array.isArray(res.subordinates || res.data)) {
        setManagers(res.subordinates || res.data || []);
      } else {
        setManagers([]);
      }
    } catch (err) {
      console.error('Failed to load managers directory:', err);
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeLevel]);

  // Filtered managers based on status tab
  const filteredManagers = useMemo(() => {
    if (statusFilter === 'pending') {
      return managers.filter(m => m.status === 'under_review' || m.status === 'pending');
    }
    if (statusFilter === 'active') {
      return managers.filter(m => m.status === 'active');
    }
    return managers;
  }, [managers, statusFilter]);

  const totalCount = managers.length;
  const pendingCount = managers.filter(m => m.status === 'under_review' || m.status === 'pending').length;
  const activeCount = managers.filter(m => m.status === 'active').length;

  const handleOpenModal = (manager) => {
    setSelectedManager(manager);
    setModalOpen(true);
  };

  const handleManagerUpdated = (updatedManager) => {
    setManagers(prev => prev.map(m => (m.id === updatedManager.id || m._id === updatedManager._id ? updatedManager : m)));
    loadData();
  };

  const columns = [
    {
      header: 'Manager Details',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center font-bold text-xs shrink-0">
            {row.name ? row.name.charAt(0).toUpperCase() : <UserCog className="w-4 h-4" />}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <span>{row.name}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${config.badgeColor}`}>
                {config.badge}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Jurisdiction & Territory',
      accessor: 'jurisdiction',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {row.jurisdiction || 'Tamil Nadu'}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={row.assignedArea}>
            {row.assignedArea || 'State Zone'}
          </div>
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" /> {row.mobile || row.phone}
        </span>
      )
    },
    {
      header: 'Applied / Joined Date',
      accessor: 'joinedDate',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {row.joinedDate || 'Recently Registered'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'Active'} />
    },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) => {
        const isPending = row.status === 'under_review' || row.status === 'pending';
        return (
          <div className="flex items-center gap-2">
            {isPending ? (
              <button
                type="button"
                onClick={() => handleOpenModal(row)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Review & Approve
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenModal(row)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                View Details
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{config.title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{config.subtitle}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total {config.title}</span>
            <UserCog className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">{totalCount}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Jurisdiction directory</div>
        </div>

        <div className={`p-3.5 rounded-2xl border shadow-sm transition ${
          pendingCount > 0
            ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
            : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${pendingCount > 0 ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
              Pending Approvals
            </span>
            <AlertCircle className={`w-4 h-4 ${pendingCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className={`text-lg font-bold mt-1.5 ${pendingCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
            {pendingCount}
          </div>
          <div className={`text-[10px] font-medium mt-0.5 ${pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
            {pendingCount > 0 ? 'Awaiting your admin review' : 'All registrations verified'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Roster</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">{activeCount}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Approved & active</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Territory Coverage</span>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">100%</div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">Hierarchical alignment</div>
        </div>
      </div>

      {/* Pending Approvals Quick Alert Banner */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/80 dark:border-amber-800/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {pendingCount} New Manager Registration{pendingCount > 1 ? 's' : ''} Awaiting Admin Approval
              </h4>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400 mt-0.5">
                Managers cannot access their dashboard portal until their KYC documents are reviewed and approved.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700 transition self-start sm:self-auto cursor-pointer"
          >
            Filter Pending Requests
          </button>
        </div>
      )}

      {/* Status Filter Tabs & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Managers ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              statusFilter === 'pending'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Active Managers ({activeCount})
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        title={config.tableTitle}
        subtitle={config.tableSubtitle}
        columns={columns}
        data={filteredManagers}
        onRowClick={(row) => handleOpenModal(row)}
        loading={loading}
        searchPlaceholder={`Search ${config.title.toLowerCase()} by name, jurisdiction, or phone...`}
        exportFileName={config.exportFile}
      />

      {/* Manager Registration & KYC Review Modal */}
      <ManagerApprovalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        manager={selectedManager}
        onManagerUpdated={handleManagerUpdated}
      />
    </div>
  );
}
