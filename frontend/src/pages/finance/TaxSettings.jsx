import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, Plus, Edit2, Trash2, RefreshCw, Save } from 'lucide-react';
import financeAPI from '../../services/financeAPI';
import toast from 'react-hot-toast';

export default function TaxSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    globalTaxRate: 0,
    taxName: '',
    taxNumber: '',
    enableTax: true,
  });
  const [newTaxCategory, setNewTaxCategory] = useState({
    name: '',
    rate: 0,
    description: '',
    applicableFor: [],
  });

  const queryClient = useQueryClient();

  const { data: taxData, isLoading } = useQuery({
    queryKey: ['taxSettings'],
    queryFn: () => financeAPI.getTaxSettings(),
    placeholderData: { data: { globalSettings: {}, categories: [], regions: [] } },
    onSuccess: (data) => {
      setGlobalSettings(data.data.globalSettings || {});
    },
  });

  const settings = taxData?.data?.globalSettings || {};
  const categories = taxData?.data?.categories || [];
  const regions = taxData?.data?.regions || [];

  const updateGlobalSettingsMutation = useMutation({
    mutationFn: (data) => financeAPI.updateTaxSettings(data),
    onSuccess: () => {
      toast.success('Tax settings updated successfully');
      queryClient.invalidateQueries(['taxSettings']);
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update tax settings');
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: (data) => financeAPI.addTaxCategory(data),
    onSuccess: () => {
      toast.success('Tax category added successfully');
      queryClient.invalidateQueries(['taxSettings']);
      setShowAddModal(false);
      setNewTaxCategory({ name: '', rate: 0, description: '', applicableFor: [] });
    },
    onError: () => {
      toast.error('Failed to add tax category');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId) => financeAPI.deleteTaxCategory(categoryId),
    onSuccess: () => {
      toast.success('Tax category deleted successfully');
      queryClient.invalidateQueries(['taxSettings']);
    },
    onError: () => {
      toast.error('Failed to delete tax category');
    },
  });

  const handleSaveGlobalSettings = () => {
    updateGlobalSettingsMutation.mutate(globalSettings);
  };

  const handleAddCategory = () => {
    if (!newTaxCategory.name || newTaxCategory.rate <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    addCategoryMutation.mutate(newTaxCategory);
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this tax category?')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure tax rates and categories</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries(['taxSettings'])}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Global Tax Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Global Tax Configuration</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setGlobalSettings(settings);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGlobalSettings}
                    disabled={updateGlobalSettingsMutation.isPending}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Name (e.g., VAT, GST)
                  </label>
                  <input
                    type="text"
                    value={globalSettings.taxName || ''}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, taxName: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Registration Number
                  </label>
                  <input
                    type="text"
                    value={globalSettings.taxNumber || ''}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, taxNumber: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Global Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={globalSettings.globalTaxRate || 0}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, globalTaxRate: parseFloat(e.target.value) })}
                    disabled={!isEditing}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={globalSettings.enableTax || false}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, enableTax: e.target.checked })}
                    disabled={!isEditing}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Enable tax calculation globally
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Categories */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Tax Categories</h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </button>
            </div>
            <div className="overflow-x-auto">
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tax categories</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new tax category.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicable For
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category.rate}%
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {category.description || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {category.applicableFor?.join(', ') || 'All'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toast.info('Edit category coming soon')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Regional Tax Rates */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Regional Tax Rates</h3>
              <button
                onClick={() => toast.info('Add regional rate coming soon')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Region
              </button>
            </div>
            <div className="overflow-x-auto">
              {regions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No regional rates</h3>
                  <p className="mt-1 text-sm text-gray-500">Configure region-specific tax rates.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax Rate (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {regions.map((region) => (
                      <tr key={region._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {region.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {region.country}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {region.taxRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            region.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {region.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => toast.info('Edit region coming soon')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add Tax Category</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={newTaxCategory.name}
                    onChange={(e) => setNewTaxCategory({ ...newTaxCategory, name: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., Service Tax"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTaxCategory.rate}
                    onChange={(e) => setNewTaxCategory({ ...newTaxCategory, rate: parseFloat(e.target.value) })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newTaxCategory.description}
                    onChange={(e) => setNewTaxCategory({ ...newTaxCategory, description: e.target.value })}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewTaxCategory({ name: '', rate: 0, description: '', applicableFor: [] });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCategory}
                    disabled={addCategoryMutation.isPending}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
