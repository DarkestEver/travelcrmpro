import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  ArchiveBoxIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import DataTable from '../../../components/shared/DataTable';
import StatusBadge from '../../../components/shared/StatusBadge';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import DateRangePicker from '../../../components/shared/DateRangePicker';
import RateSheetForm from './RateSheetForm';
import RateSheetVersioning from './RateSheetVersioning';
import RateComparison from './RateComparison';
import { 
  getRateSheets, 
  deleteRateSheet, 
  archiveRateSheet,
  publishRateSheet 
} from '../../../services/api/rateSheetApi';

const RateSheets = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: 'all',
    supplierId: '',
    startDate: null,
    endDate: null,
    search: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [showVersioning, setShowVersioning] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedRateSheet, setSelectedRateSheet] = useState(null);

  // Fetch rate sheets
  const { data: rateSheets = [], isLoading } = useQuery({
    queryKey: ['rateSheets', filters],
    queryFn: () => getRateSheets(filters),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRateSheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['rateSheets']);
      alert('Rate sheet deleted successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete rate sheet');
    }
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id) => archiveRateSheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['rateSheets']);
      alert('Rate sheet archived successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to archive rate sheet');
    }
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (id) => publishRateSheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['rateSheets']);
      alert('Rate sheet published successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to publish rate sheet');
    }
  });

  const handleEdit = (rateSheet) => {
    setSelectedRateSheet(rateSheet);
    setShowForm(true);
  };

  const handleViewVersions = (rateSheet) => {
    setSelectedRateSheet(rateSheet);
    setShowVersioning(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this rate sheet? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleArchive = (id) => {
    if (window.confirm('Archive this rate sheet? It will no longer be active but can be restored later.')) {
      archiveMutation.mutate(id);
    }
  };

  const handlePublish = (id) => {
    if (window.confirm('Publish this rate sheet? It will become active and visible to all users.')) {
      publishMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedRateSheet(null);
    queryClient.invalidateQueries(['rateSheets']);
  };

  const handleAddNew = () => {
    setSelectedRateSheet(null);
    setShowForm(true);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Calculate stats
  const stats = [
    {
      label: 'Total Rate Sheets',
      value: rateSheets.length,
      icon: '📊',
      color: 'blue'
    },
    {
      label: 'Published',
      value: rateSheets.filter(rs => rs.status === 'published').length,
      icon: '✓',
      color: 'green'
    },
    {
      label: 'Drafts',
      value: rateSheets.filter(rs => rs.status === 'draft').length,
      icon: '📝',
      color: 'yellow'
    },
    {
      label: 'Archived',
      value: rateSheets.filter(rs => rs.status === 'archived').length,
      icon: '📦',
      color: 'gray'
    }
  ];

  const columns = [
    {
      key: 'name',
      label: 'Rate Sheet Name',
      render: (rateSheet) => (
        <div>
          <div className="font-medium text-gray-900">{rateSheet.name}</div>
          <div className="text-sm text-gray-500">Version {rateSheet.version}</div>
        </div>
      )
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (rateSheet) => (
        <div className="text-sm text-gray-900">{rateSheet.supplier?.name || 'N/A'}</div>
      )
    },
    {
      key: 'validPeriod',
      label: 'Valid Period',
      render: (rateSheet) => (
        <div className="text-sm text-gray-900">
          {formatDate(rateSheet.validFrom)} - {formatDate(rateSheet.validTo)}
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (rateSheet) => (
        <div className="text-sm text-gray-900">
          {rateSheet.itemCount || 0} items
        </div>
      )
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      render: (rateSheet) => (
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(rateSheet.totalValue || 0, rateSheet.currency)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (rateSheet) => <StatusBadge status={rateSheet.status} />
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (rateSheet) => (
        <div className="text-sm text-gray-500">
          {formatDate(rateSheet.updatedAt)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (rateSheet) => (
        <div className="flex items-center gap-2">
          {rateSheet.status === 'draft' && (
            <button
              onClick={() => handlePublish(rateSheet.id)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Publish"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleEdit(rateSheet)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewVersions(rateSheet)}
            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            title="Version History"
          >
            <ClockIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleArchive(rateSheet.id)}
            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
            title="Archive"
          >
            <ArchiveBoxIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(rateSheet.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Sheet Management</h1>
          <p className="text-gray-600 mt-1">
            Manage supplier rate sheets, track versions, and compare rates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComparison(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
            Compare Rates
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            Add Rate Sheet
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search rate sheets..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valid Period
            </label>
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onRangeChange={(start, end) => {
                setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
              }}
            />
          </div>
        </div>
      </div>

      {/* Rate Sheets Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={rateSheets.filter(rs => {
            if (filters.search && !rs.name.toLowerCase().includes(filters.search.toLowerCase())) {
              return false;
            }
            if (filters.status !== 'all' && rs.status !== filters.status) {
              return false;
            }
            return true;
          })}
          searchable={false}
          sortable={true}
          pagination={true}
          pageSize={10}
        />
      </div>

      {/* Modals */}
      {showForm && (
        <RateSheetForm
          rateSheet={selectedRateSheet}
          onClose={() => {
            setShowForm(false);
            setSelectedRateSheet(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showVersioning && selectedRateSheet && (
        <RateSheetVersioning
          rateSheet={selectedRateSheet}
          onClose={() => {
            setShowVersioning(false);
            setSelectedRateSheet(null);
          }}
          onRestore={() => {
            queryClient.invalidateQueries(['rateSheets']);
          }}
        />
      )}

      {showComparison && (
        <RateComparison
          rateSheets={rateSheets.filter(rs => rs.status === 'published')}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
};

export default RateSheets;
