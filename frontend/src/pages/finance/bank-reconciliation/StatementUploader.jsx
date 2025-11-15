import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CloudArrowUpIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import FileUploader from '../../../components/shared/FileUploader';
import DateRangePicker from '../../../components/shared/DateRangePicker';
import { uploadBankStatement } from '../../../services/api/bankReconciliationApi';
import { ButtonLoader } from '../../../components/shared/LoadingStates';

const StatementUploader = ({ account, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statementFormat, setStatementFormat] = useState('csv'); // csv, xlsx, pdf, qbo
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadBankStatement(account.id, formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return result;
    },
    onSuccess: (data) => {
      setTimeout(() => {
        alert(`Statement uploaded successfully! ${data.transactionsCount} transactions imported.`);
        onSuccess();
      }, 500);
    },
    onError: (error) => {
      setUploadProgress(0);
      alert(error.response?.data?.message || 'Failed to upload statement');
    }
  });

  const handleUpload = () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select statement date range');
      return;
    }

    const formData = new FormData();
    formData.append('statement', file);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('format', statementFormat);

    uploadMutation.mutate(formData);
  };

  const getAcceptedFormats = () => {
    switch (statementFormat) {
      case 'csv':
        return '.csv';
      case 'xlsx':
        return '.xlsx,.xls';
      case 'pdf':
        return '.pdf';
      case 'qbo':
        return '.qbo,.qfx';
      default:
        return '.csv,.xlsx,.xls,.pdf,.qbo,.qfx';
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Upload Bank Statement"
      size="lg"
    >
      <div className="space-y-6">
        {/* Account Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Account</p>
              <p className="font-semibold text-gray-900">{account.bankName}</p>
              <p className="text-sm text-gray-500">****{account.accountNumber.slice(-4)}</p>
            </div>
            <DocumentTextIcon className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Upload Instructions:</strong>
          </p>
          <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Download your bank statement from your online banking portal</li>
            <li>Supported formats: CSV, Excel (.xlsx/.xls), PDF, QuickBooks (.qbo/.qfx)</li>
            <li>Ensure the date range matches your statement period</li>
            <li>The system will automatically parse and import transactions</li>
          </ul>
        </div>

        {/* Statement Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statement Format
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: 'csv', label: 'CSV' },
              { value: 'xlsx', label: 'Excel' },
              { value: 'pdf', label: 'PDF' },
              { value: 'qbo', label: 'QuickBooks' }
            ].map((format) => (
              <button
                key={format.value}
                onClick={() => setStatementFormat(format.value)}
                disabled={uploadMutation.isPending}
                className={`px-4 py-2 border rounded-lg font-medium ${
                  statementFormat === format.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {format.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <DateRangePicker
          label="Statement Period"
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          disabled={uploadMutation.isPending}
        />

        {/* File Upload */}
        <FileUploader
          onFileSelect={setFile}
          accept={getAcceptedFormats()}
          maxSize={50 * 1024 * 1024} // 50MB
          disabled={uploadMutation.isPending}
          showPreview={true}
        />

        {/* Upload Progress */}
        {uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Uploading and processing...</span>
              <span className="font-medium text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadProgress === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">Statement uploaded and processed successfully!</p>
          </div>
        )}

        {/* Additional Options */}
        {statementFormat === 'csv' && !uploadMutation.isPending && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-2">CSV Format Requirements:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Required columns: Date, Description, Amount</p>
              <p>• Optional columns: Reference, Balance, Category</p>
              <p>• Date format: YYYY-MM-DD or DD/MM/YYYY</p>
              <p>• Amount: Negative for debits, positive for credits</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end space-x-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          disabled={uploadMutation.isPending}
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || !startDate || !endDate || uploadMutation.isPending}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadMutation.isPending ? (
            <ButtonLoader />
          ) : (
            <>
              <CloudArrowUpIcon className="w-5 h-5 mr-2" />
              Upload Statement
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default StatementUploader;
