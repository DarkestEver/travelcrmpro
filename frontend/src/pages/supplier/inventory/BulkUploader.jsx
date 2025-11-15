import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import { bulkUploadInventory } from '../../../services/api/inventoryApi';
import { ButtonLoader, ProgressBar } from '../../../components/shared/LoadingStates';

const BulkUploader = ({ onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file) => bulkUploadInventory(file, (progress) => {
      setUploadProgress(progress);
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries(['inventory']);
      alert(`Successfully uploaded ${result.successCount} items!`);
      if (result.errors && result.errors.length > 0) {
        setValidationErrors(result.errors);
      } else {
        onSuccess();
      }
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to upload inventory');
    }
  });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const validateFile = (file) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Please upload a valid CSV or Excel file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setFile(file);
    parsePreview(file);
  };

  const parsePreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('File must contain header row and at least one data row');
        setFile(null);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['name', 'sku', 'category', 'price', 'quantity'];
      const missingHeaders = requiredHeaders.filter(h => !headers.some(header => 
        header.toLowerCase() === h.toLowerCase()
      ));

      if (missingHeaders.length > 0) {
        alert(`Missing required columns: ${missingHeaders.join(', ')}`);
        setFile(null);
        return;
      }

      // Parse first 5 rows for preview
      const previewData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header.toLowerCase()] = values[index] || '';
        });
        return row;
      });

      setParseResult({
        totalRows: lines.length - 1,
        headers,
        preview: previewData
      });
    };

    reader.readAsText(file);
  };

  const handleUpload = () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setParseResult(null);
    setValidationErrors([]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `name,sku,description,category,supplierId,quantity,minQuantity,maxQuantity,price,discountPrice,currency,unit,status,location,amenities,inclusions,exclusions,cancellationPolicy,validFrom,validTo
Deluxe Hotel Room,HTL-DLX-001,Spacious room with city view,hotel,SUP123,50,5,100,150.00,135.00,USD,per night,available,"Paris, France","WiFi,Pool,Breakfast","Breakfast,WiFi","Extra beds,Pets",Free cancellation up to 24hrs,2024-06-01,2024-12-31
City Tour Package,TUR-CTY-001,Full day city sightseeing,tour,SUP124,30,2,50,89.99,,EUR,per person,available,"Rome, Italy","Guide,Transport,Lunch","Professional Guide,Lunch,Transport","Personal expenses",50% refund 48hrs before,2024-05-01,2024-10-31`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Bulk Upload Inventory"
      size="xl"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Upload Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Download the template CSV file and fill in your inventory data</li>
            <li>Required columns: name, sku, category, price, quantity</li>
            <li>Supported file formats: CSV, XLS, XLSX (max 10MB)</li>
            <li>Ensure dates are in YYYY-MM-DD format</li>
            <li>Use comma-separated values for array fields (amenities, inclusions)</li>
          </ul>
        </div>

        {/* Template Download */}
        <div className="flex items-center justify-center">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Download Template
          </button>
        </div>

        {/* File Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            file ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
          } hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />

          {file ? (
            <div className="space-y-3">
              <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto" />
              <div>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove File
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="font-semibold text-gray-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  CSV, XLS, or XLSX (max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {parseResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Preview ({parseResult.totalRows} rows)
              </h3>
              <span className="text-sm text-gray-600">
                Showing first {parseResult.preview.length} rows
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {parseResult.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parseResult.preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {parseResult.headers.map((header, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                          >
                            {row[header.toLowerCase()] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Uploading inventory...</span>
              <span className="font-semibold text-blue-600">{uploadProgress}%</span>
            </div>
            <ProgressBar progress={uploadProgress} />
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">
                  Validation Errors ({validationErrors.length})
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm text-red-800">
                      <span className="font-medium">Row {error.row}:</span> {error.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadMutation.isSuccess && validationErrors.length === 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Upload Successful!</h3>
                <p className="text-sm text-green-800">
                  All inventory items have been uploaded successfully.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isSuccess ? 'Close' : 'Cancel'}
          </button>
          
          {!uploadMutation.isSuccess && (
            <button
              onClick={handleUpload}
              disabled={!file || uploadMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMutation.isPending ? (
                <>
                  <ButtonLoader />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Upload Inventory
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BulkUploader;
