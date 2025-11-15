import React, { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, DocumentArrowDownIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

const RateLineItems = ({ items, currency, onChange }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({
    service: '',
    description: '',
    unit: 'per night',
    costPrice: 0,
    sellPrice: 0,
    markup: 0,
    markupType: 'percentage', // percentage or fixed
    minQuantity: 1,
    maxQuantity: null,
    validDays: []
  });

  const handleAdd = () => {
    const newItem = {
      id: Date.now(),
      service: editForm.service,
      description: editForm.description,
      unit: editForm.unit,
      costPrice: editForm.costPrice,
      sellPrice: editForm.sellPrice,
      markup: editForm.markup,
      markupType: editForm.markupType,
      minQuantity: editForm.minQuantity,
      maxQuantity: editForm.maxQuantity,
      validDays: editForm.validDays
    };

    onChange([...items, newItem]);
    resetForm();
  };

  const handleUpdate = () => {
    const updatedItems = items.map((item, index) =>
      index === editingIndex
        ? {
            ...item,
            service: editForm.service,
            description: editForm.description,
            unit: editForm.unit,
            costPrice: editForm.costPrice,
            sellPrice: editForm.sellPrice,
            markup: editForm.markup,
            markupType: editForm.markupType,
            minQuantity: editForm.minQuantity,
            maxQuantity: editForm.maxQuantity,
            validDays: editForm.validDays
          }
        : item
    );

    onChange(updatedItems);
    resetForm();
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    const item = items[index];
    setEditForm({
      service: item.service,
      description: item.description,
      unit: item.unit,
      costPrice: item.costPrice,
      sellPrice: item.sellPrice,
      markup: item.markup,
      markupType: item.markupType,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      validDays: item.validDays || []
    });
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm('Remove this rate item?')) {
      onChange(items.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setEditForm({
      service: '',
      description: '',
      unit: 'per night',
      costPrice: 0,
      sellPrice: 0,
      markup: 0,
      markupType: 'percentage',
      minQuantity: 1,
      maxQuantity: null,
      validDays: []
    });
  };

  const calculateSellPrice = () => {
    if (editForm.markupType === 'percentage') {
      return editForm.costPrice + (editForm.costPrice * editForm.markup / 100);
    } else {
      return editForm.costPrice + editForm.markup;
    }
  };

  const handleMarkupChange = (value) => {
    setEditForm(prev => {
      const newMarkup = parseFloat(value) || 0;
      let newSellPrice;
      
      if (prev.markupType === 'percentage') {
        newSellPrice = prev.costPrice + (prev.costPrice * newMarkup / 100);
      } else {
        newSellPrice = prev.costPrice + newMarkup;
      }
      
      return { ...prev, markup: newMarkup, sellPrice: newSellPrice };
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const downloadTemplate = () => {
    const template = `service,description,unit,costPrice,sellPrice,markup,markupType,minQuantity,maxQuantity
Deluxe Room,Spacious room with city view,per night,100,150,50,percentage,1,10
City Tour,Full day sightseeing with guide,per person,50,75,25,fixed,2,30
Airport Transfer,Private car service,per trip,30,45,50,percentage,1,`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rate_items_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
        <h3 className="font-semibold text-blue-900">
          {editingIndex !== null ? 'Edit Rate Item' : 'Add New Rate Item'}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={editForm.service}
              onChange={(e) => setEditForm(prev => ({ ...prev, service: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Deluxe Room, City Tour"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              value={editForm.unit}
              onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="per night">Per Night</option>
              <option value="per person">Per Person</option>
              <option value="per day">Per Day</option>
              <option value="per trip">Per Trip</option>
              <option value="per hour">Per Hour</option>
              <option value="per package">Per Package</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details about this rate item..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Price <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={editForm.costPrice}
              onChange={(e) => {
                const newCost = parseFloat(e.target.value) || 0;
                let newSellPrice;
                if (editForm.markupType === 'percentage') {
                  newSellPrice = newCost + (newCost * editForm.markup / 100);
                } else {
                  newSellPrice = newCost + editForm.markup;
                }
                setEditForm(prev => ({ ...prev, costPrice: newCost, sellPrice: newSellPrice }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Markup Type
            </label>
            <select
              value={editForm.markupType}
              onChange={(e) => {
                const newType = e.target.value;
                let newSellPrice;
                if (newType === 'percentage') {
                  newSellPrice = editForm.costPrice + (editForm.costPrice * editForm.markup / 100);
                } else {
                  newSellPrice = editForm.costPrice + editForm.markup;
                }
                setEditForm(prev => ({ ...prev, markupType: newType, sellPrice: newSellPrice }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Markup Value
            </label>
            <input
              type="number"
              step="0.01"
              value={editForm.markup}
              onChange={(e) => handleMarkupChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sell Price (Calculated)
            </label>
            <input
              type="number"
              step="0.01"
              value={editForm.sellPrice}
              onChange={(e) => setEditForm(prev => ({ ...prev, sellPrice: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Quantity
            </label>
            <input
              type="number"
              value={editForm.minQuantity}
              onChange={(e) => setEditForm(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Quantity
            </label>
            <input
              type="number"
              value={editForm.maxQuantity || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, maxQuantity: parseInt(e.target.value) || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              placeholder="Unlimited"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-blue-200">
          {editingIndex !== null && (
            <button
              onClick={() => {
                setEditingIndex(null);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel Edit
            </button>
          )}
          <button
            onClick={editingIndex !== null ? handleUpdate : handleAdd}
            disabled={!editForm.service || editForm.costPrice <= 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingIndex !== null ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Rate Items ({items.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Download Template
          </button>
        </div>
      </div>

      {/* Items Table */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No rate items added yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first rate item using the form above</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Markup</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Sell Price</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Qty Range</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.service}</div>
                    {item.description && (
                      <div className="text-sm text-gray-500">{item.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 capitalize">{item.unit}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {formatCurrency(item.costPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span className="text-green-600 font-medium">
                      {item.markupType === 'percentage' 
                        ? `+${item.markup}%`
                        : `+${formatCurrency(item.markup)}`
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(item.sellPrice)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {item.minQuantity} - {item.maxQuantity || '∞'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(index)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-900">
                  Total:
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {formatCurrency(items.reduce((sum, item) => sum + item.sellPrice, 0))}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default RateLineItems;
