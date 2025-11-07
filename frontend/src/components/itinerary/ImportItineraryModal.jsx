import { useState } from 'react';
import { FiUpload, FiFileText, FiX, FiCheck } from 'react-icons/fi';
import Modal from '../Modal';

const ImportItineraryModal = ({ isOpen, onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const validateJSON = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Check for required fields
      if (!parsed.title) {
        throw new Error('JSON must contain a "title" field');
      }

      setIsValid(true);
      setError('');
      setPreview(parsed);
      return true;
    } catch (err) {
      setIsValid(false);
      setError(err.message);
      setPreview(null);
      return false;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setJsonInput(content);
      validateJSON(content);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setJsonInput(value);
    
    if (value.trim()) {
      validateJSON(value);
    } else {
      setIsValid(null);
      setError('');
      setPreview(null);
    }
  };

  const handleImport = () => {
    if (isValid && preview) {
      onImport(preview);
      handleClose();
    }
  };

  const handleClose = () => {
    setJsonInput('');
    setIsValid(null);
    setError('');
    setPreview(null);
    onClose();
  };

  const exampleJSON = {
    title: "Amazing Bali Adventure",
    overview: "7-day cultural and nature tour of Bali",
    destination: {
      country: "Indonesia",
      city: "Bali"
    },
    startDate: "2024-03-15",
    endDate: "2024-03-22",
    numberOfDays: 8,
    numberOfNights: 7,
    budget: {
      amount: 1500,
      currency: "USD"
    },
    travelStyle: "Adventure",
    difficulty: "Moderate",
    groupSize: {
      min: 2,
      max: 8
    },
    themes: ["Cultural", "Nature", "Beach"],
    days: [
      {
        dayNumber: 1,
        title: "Arrival in Bali",
        date: "2024-03-15",
        overview: "Welcome to Bali!",
        components: [
          {
            type: "Activity",
            title: "Airport Transfer",
            description: "Private transfer from airport to hotel",
            startTime: "14:00",
            duration: 60,
            location: {
              name: "Ngurah Rai International Airport"
            }
          }
        ]
      }
    ]
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Itinerary from JSON"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload JSON File
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">JSON file only</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or paste JSON directly</span>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JSON Data
            {isValid === true && (
              <span className="ml-2 text-green-600 text-xs">
                <FiCheck className="inline w-4 h-4" /> Valid JSON
              </span>
            )}
            {isValid === false && (
              <span className="ml-2 text-red-600 text-xs">
                <FiX className="inline w-4 h-4" /> Invalid JSON
              </span>
            )}
          </label>
          <textarea
            value={jsonInput}
            onChange={handleTextChange}
            placeholder={JSON.stringify(exampleJSON, null, 2)}
            className={`w-full h-64 px-3 py-2 border rounded-lg font-mono text-sm ${
              isValid === true
                ? 'border-green-500 focus:ring-green-500'
                : isValid === false
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Title:</strong> {preview.title}</p>
              {preview.destination && (
                <p><strong>Destination:</strong> {preview.destination.city}, {preview.destination.country}</p>
              )}
              {preview.days && (
                <p><strong>Days:</strong> {preview.days.length} day(s)</p>
              )}
              {preview.budget && (
                <p><strong>Budget:</strong> {preview.budget.currency} {preview.budget.amount}</p>
              )}
            </div>
          </div>
        )}

        {/* Example */}
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
            <FiFileText className="inline w-4 h-4 mr-1" />
            Show Example JSON Format
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded overflow-x-auto text-xs">
            {JSON.stringify(exampleJSON, null, 2)}
          </pre>
        </details>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            onClick={handleClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!isValid}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiUpload className="w-4 h-4 mr-2" />
            Import Itinerary
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportItineraryModal;
