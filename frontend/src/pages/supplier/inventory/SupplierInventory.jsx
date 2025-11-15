import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { getInventoryItems, deleteInventory } from '../../../services/api/inventoryApi';
import DataTable from '../../../components/shared/DataTable';
import StatusBadge from '../../../components/shared/StatusBadge';
import { LoadingSpinner } from '../../../components/shared/LoadingStates';
import InventoryForm from './InventoryForm';
import AvailabilityCalendar from './AvailabilityCalendar';
import SeasonalPricing from './SeasonalPricing';
import BulkUploader from './BulkUploader';

const SupplierInventory = () => {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    supplier: 'all'
  });

  // Fetch inventory items
  const { data: inventory = [], isLoading, error } = useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => getInventoryItems(filters)
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteInventory,
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      alert('Inventory item deleted successfully');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete inventory item');
    }
  });

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleCalendar = (item) => {
    setSelectedItem(item);
    setShowCalendar(true);
  };

  const handlePricing = (item) => {
    setSelectedItem(item);
    setShowPricing(true);
  };

  const columns = [
    {
      key: 'name',
      header: 'Item Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-sm text-gray-500">{row.sku}</p>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="capitalize">{row.category}</span>
      )
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => row.supplier?.name || '-'
    },
    {
      key: 'quantity',
      header: 'Available',
      render: (row) => (
        <span className={`font-medium ${row.quantity < row.minQuantity ? 'text-red-600' : 'text-gray-900'}`}>
          {row.quantity} / {row.maxQuantity || '∞'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'price',
      header: 'Price',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{formatCurrency(row.price, row.currency)}</p>
          {row.discountPrice && (
            <p className="text-sm text-green-600">Sale: {formatCurrency(row.discountPrice, row.currency)}</p>
          )}
        </div>
      ),
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      render: (row) => formatDate(row.updatedAt),
      sortable: true
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCalendar(row)}
            className="p-1 text-green-600 hover:text-green-800"
            title="Availability"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePricing(row)}
            className="p-1 text-purple-600 hover:text-purple-800"
            title="Pricing"
          >
            <FunnelIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const stats = {
    total: inventory.length,
    available: inventory.filter(i => i.status === 'available').length,
    lowStock: inventory.filter(i => i.quantity < i.minQuantity).length,
    outOfStock: inventory.filter(i => i.quantity === 0).length
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Inventory Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your inventory, availability, and seasonal pricing
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-green-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="low_stock">Low Stock</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              <option value="hotel">Hotels</option>
              <option value="tour">Tours</option>
              <option value="transport">Transport</option>
              <option value="activity">Activities</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              Bulk Upload
            </button>
            <button
              onClick={() => {
                setSelectedItem(null);
                setShowForm(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={inventory}
          searchable
          pagination
          pageSize={15}
          emptyMessage="No inventory items found"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <InventoryForm
          item={selectedItem}
          onClose={() => {
            setShowForm(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedItem(null);
            queryClient.invalidateQueries(['inventory']);
          }}
        />
      )}

      {showCalendar && (
        <AvailabilityCalendar
          item={selectedItem}
          onClose={() => {
            setShowCalendar(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['inventory']);
          }}
        />
      )}

      {showPricing && (
        <SeasonalPricing
          item={selectedItem}
          onClose={() => {
            setShowPricing(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['inventory']);
          }}
        />
      )}

      {showBulkUpload && (
        <BulkUploader
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            setShowBulkUpload(false);
            queryClient.invalidateQueries(['inventory']);
          }}
        />
      )}
    </div>
  );
};

export default SupplierInventory;
