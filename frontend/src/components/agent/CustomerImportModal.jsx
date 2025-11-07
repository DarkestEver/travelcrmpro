import { useState, useRef } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { importCustomers } from '../../services/agentCustomerAPI';

export default function CustomerImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);

      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvText(e.target.result);
      };
      reader.readAsText(selectedFile);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const selectedFile = e.dataTransfer.files[0];
    handleFileSelect(selectedFile);
  };

  const handleTextChange = (e) => {
    setCsvText(e.target.value);
    setFile(null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      alert('Please upload a CSV file or paste CSV data');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await importCustomers(csvText);
      setResult(response.data);
      
      if (response.data.success) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to import customers');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvText('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Customers from CSV</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* File Upload Area */}
            {!result && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV File
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <span className="text-gray-500"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">CSV file up to 10MB</p>
                    {file && (
                      <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or paste CSV data</span>
                  </div>
                </div>

                {/* CSV Text Input */}
                <div>
                  <label htmlFor="csvText" className="block text-sm font-medium text-gray-700 mb-2">
                    CSV Data
                  </label>
                  <textarea
                    id="csvText"
                    rows={10}
                    value={csvText}
                    onChange={handleTextChange}
                    placeholder="firstName,lastName,email,phone,city,country&#10;John,Doe,john@example.com,+1234567890,New York,USA"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Required columns: firstName, lastName, email
                  </p>
                </div>
              </>
            )}

            {/* Import Results */}
            {result && (
              <div className="space-y-4">
                <div
                  className={`rounded-lg p-4 ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <h4
                    className={`text-sm font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.message}
                  </h4>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>Total rows: {result.totalRows || 0}</p>
                    <p className="text-green-600">Successfully imported: {result.imported || 0}</p>
                    {result.failed > 0 && (
                      <p className="text-red-600">Failed: {result.failed}</p>
                    )}
                  </div>
                </div>

                {/* Error Details */}
                {result.errors && result.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Errors:</h4>
                    <div className="max-h-64 overflow-y-auto rounded-md bg-gray-50 p-4 space-y-2">
                      {result.errors.map((error, index) => (
                        <div key={index} className="text-sm border-l-4 border-red-400 pl-3 py-1">
                          <span className="font-medium text-red-700">Line {error.line}:</span>
                          <ul className="list-disc list-inside ml-2 text-gray-600">
                            {error.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                          {error.data && (
                            <p className="text-xs text-gray-500 mt-1">
                              Data: {JSON.stringify(error.data)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.success && (
                  <div className="text-center text-sm text-gray-600">
                    Redirecting to customer list...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 flex justify-end gap-3">
            {!result ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                {(file || csvText) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading || (!file && !csvText.trim())}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Importing...' : 'Import Customers'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Import Another File
                </button>
                <button
                  type="button"
                  onClick={onSuccess}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
