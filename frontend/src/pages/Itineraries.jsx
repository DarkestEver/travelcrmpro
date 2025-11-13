import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye,
  FiDownload,
  FiCalendar,
  FiMapPin,
  FiLayers,
  FiUpload,
  FiFilter,
  FiCopy
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImportItineraryModal from '../components/itinerary/ImportItineraryModal';
import ItineraryFilterPanel from '../components/itinerary/ItineraryFilterPanel';
import { itinerariesAPI } from '../services/apiEndpoints';

const Itineraries = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [filters, setFilters] = useState({});

  // Fetch itineraries
  const { data, isLoading } = useQuery({
    queryKey: ['itineraries', page, search, filters],
    queryFn: () => itinerariesAPI.getAll({ page, limit: 10, search, ...filters }),
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (itineraryData) =>
      selectedItinerary
        ? itinerariesAPI.update(selectedItinerary._id, itineraryData)
        : itinerariesAPI.create(itineraryData),
    onSuccess: () => {
      queryClient.invalidateQueries(['itineraries']);
      toast.success(`Itinerary ${selectedItinerary ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      setSelectedItinerary(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save itinerary');
    },
  });

  // Quick create and go to builder
  const quickCreateMutation = useMutation({
    mutationFn: async () => {
      const response = await itinerariesAPI.create({
        title: 'New Itinerary',
        overview: 'Click here to add description',
        destination: {
          country: 'India',
          city: 'New Delhi'
        },
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        numberOfDays: 7,
        numberOfNights: 6,
        status: 'draft'
      });
      return response.data;
    },
    onSuccess: (data) => {
      // API returns data.itinerary, not data.data
      const itineraryId = data.itinerary?._id || data.data?._id;
      if (!itineraryId) {
        console.error('No itinerary ID in response:', data);
        toast.error('Failed to get itinerary ID');
        return;
      }
      toast.success('Itinerary created! Opening builder...');
      queryClient.invalidateQueries(['itineraries']);
      navigate(`/itineraries/${itineraryId}/build`);
    },
    onError: (error) => {
      console.error('Quick create error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create itinerary');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => itinerariesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['itineraries']);
      toast.success('Itinerary deleted successfully');
      setShowConfirm(false);
      setSelectedItinerary(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete itinerary');
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (itineraryData) => itinerariesAPI.import(itineraryData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['itineraries']);
      const itineraryId = data?.itinerary?._id || data?._id;
      if (itineraryId) {
        toast.success('Itinerary imported successfully! Opening builder...');
        navigate(`/itineraries/${itineraryId}/build`);
      } else {
        toast.success('Itinerary imported successfully');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to import itinerary');
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id) => itinerariesAPI.duplicate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['itineraries']);
      const itineraryId = data?.itinerary?._id || data?.data?._id;
      if (itineraryId) {
        toast.success('Itinerary duplicated successfully! Opening in builder...');
        navigate(`/itineraries/${itineraryId}/build`);
      } else {
        toast.success('Itinerary duplicated successfully');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to duplicate itinerary');
    },
  });

  const handleImport = (itineraryData) => {
    importMutation.mutate(itineraryData);
  };

  const handleDuplicate = (itinerary) => {
    if (window.confirm(`Duplicate "${itinerary.title}"? This will create a copy with all days and components.`)) {
      duplicateMutation.mutate(itinerary._id);
    }
  };

  const handleEdit = (itinerary) => {
    setSelectedItinerary(itinerary);
    setShowModal(true);
  };

  const handleDelete = (itinerary) => {
    setSelectedItinerary(itinerary);
    setShowConfirm(true);
  };

  const handlePreview = (itinerary) => {
    setSelectedItinerary(itinerary);
    setShowPreview(true);
  };

  const handleDownloadPDF = (itinerary) => {
    toast.success('PDF download will be implemented');
    // TODO: Implement PDF generation
  };

  const handleExportJSON = async (itinerary) => {
    try {
      const data = await itinerariesAPI.export(itinerary._id);
      
      console.log('Export data received:', data);
      
      // Check if data is valid
      if (!data || typeof data !== 'object') {
        console.error('Invalid export data:', data);
        toast.error('Invalid data received from server');
        return;
      }
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${itinerary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Itinerary exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export itinerary');
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value || 'Untitled Itinerary'}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <FiMapPin className="w-3 h-3" />
            {row.destination?.city && row.destination?.country 
              ? `${row.destination.city}, ${row.destination.country}`
              : row.destination?.country || 'No destination set'
            }
          </div>
        </div>
      ),
    },
    {
      header: 'Duration',
      accessor: 'days',
      render: (value, row) => {
        const daysCount = value?.length || row.duration?.days || 0;
        const nightsCount = value?.length > 0 ? value.length - 1 : (row.duration?.nights || 0);
        return (
          <div className="flex items-center gap-1 text-sm">
            <FiCalendar className="w-4 h-4 text-gray-500" />
            <span>{daysCount} Days / {nightsCount} Nights</span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`badge ${
          value === 'published' ? 'badge-success' :
          value === 'draft' ? 'badge-secondary' : 'badge-warning'
        }`}>
          {value}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/itineraries/${row._id}/build`)}
            className="text-primary-600 hover:text-primary-800"
            title="Build Itinerary"
          >
            <FiLayers className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePreview(row)}
            className="text-green-600 hover:text-green-800"
            title="Preview"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDuplicate(row)}
            className="text-orange-600 hover:text-orange-800"
            title="Duplicate"
          >
            <FiCopy className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExportJSON(row)}
            className="text-indigo-600 hover:text-indigo-800"
            title="Export JSON"
          >
            <FiDownload className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownloadPDF(row)}
            className="text-purple-600 hover:text-purple-800"
            title="Download PDF"
          >
            <FiDownload className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-y-auto">
      <div className="space-y-6 p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Itineraries</h1>
            <p className="text-gray-600 mt-1">Create and manage travel itineraries</p>
          </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`btn ${showFilterPanel ? 'btn-primary' : 'btn-outline'} flex items-center gap-2`}
          >
            <FiFilter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiUpload className="w-4 h-4" />
            Import JSON
          </button>
          <button
            onClick={() => quickCreateMutation.mutate()}
            className="btn btn-primary flex items-center gap-2"
            disabled={quickCreateMutation.isLoading}
          >
            <FiLayers className="w-4 h-4" />
            {quickCreateMutation.isLoading ? 'Creating...' : 'Quick Start Builder'}
          </button>
          <button
            onClick={() => {
              setSelectedItinerary(null);
              setShowModal(true);
            }}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Create with Form
          </button>
        </div>
      </div>

      {/* Main Content with Filter Panel */}
      <div className={`grid ${showFilterPanel ? 'grid-cols-[300px_1fr]' : 'grid-cols-1'} gap-6`}>
        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="sticky top-6 self-start">
            <ItineraryFilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>
        )}

        {/* Table */}
        <div>
          <DataTable
            columns={columns}
            data={data?.data || []}
            pagination={data?.pagination}
            onPageChange={setPage}
            onSearch={setSearch}
            loading={isLoading}
            searchPlaceholder="Search itineraries..."
            showSearch={true}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <ItineraryFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedItinerary(null);
          }}
          itinerary={selectedItinerary}
          onSubmit={saveMutation.mutate}
          isLoading={saveMutation.isPending}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <ItineraryPreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedItinerary(null);
          }}
          itinerary={selectedItinerary}
        />
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => deleteMutation.mutate(selectedItinerary._id)}
        title="Delete Itinerary"
        message={`Are you sure you want to delete "${selectedItinerary?.title}"?`}
        type="danger"
      />

      {/* Import Modal */}
      <ImportItineraryModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
      </div>
    </div>
  );
};

// Itinerary Form Modal Component
const ItineraryFormModal = ({ isOpen, onClose, itinerary, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: itinerary?.title || '',
    overview: itinerary?.overview || '',
    country: itinerary?.destination?.country || '',
    city: itinerary?.destination?.city || '',
    startDate: itinerary?.startDate?.split('T')[0] || '',
    endDate: itinerary?.endDate?.split('T')[0] || '',
    numberOfDays: itinerary?.numberOfDays || 1,
    numberOfNights: itinerary?.numberOfNights || 0,
    status: itinerary?.status || 'draft',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert to new schema format
    const payload = {
      title: formData.title,
      overview: formData.overview,
      destination: {
        country: formData.country,
        city: formData.city
      },
      startDate: formData.startDate,
      endDate: formData.endDate,
      numberOfDays: parseInt(formData.numberOfDays),
      numberOfNights: parseInt(formData.numberOfNights),
      status: formData.status
    };
    
    onSubmit(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itinerary ? 'Edit Itinerary' : 'Create New Itinerary'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="input"
            placeholder="Amazing Southeast Asia Tour"
          />
        </div>

        <div>
          <label className="label">Overview</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            rows={3}
            className="input"
            placeholder="Brief overview of the itinerary..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Country *</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className="input"
              placeholder="Thailand"
            />
          </div>
          <div>
            <label className="label">City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="input"
              placeholder="Bangkok"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Number of Days *</label>
            <input
              type="number"
              name="numberOfDays"
              value={formData.numberOfDays}
              onChange={handleChange}
              required
              min="1"
              className="input"
            />
          </div>
          <div>
            <label className="label">Number of Nights *</label>
            <input
              type="number"
              name="numberOfNights"
              value={formData.numberOfNights}
              onChange={handleChange}
              required
              min="0"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Status *</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Itinerary'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Itinerary Preview Modal Component
const ItineraryPreviewModal = ({ isOpen, onClose, itinerary }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itinerary?.title}
      size="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <p className="text-gray-600">{itinerary?.description}</p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <FiMapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {itinerary?.destinations?.join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {itinerary?.days?.length || 0} days
            </span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-6">
          {itinerary?.days?.map((day) => (
            <div key={day.day} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold text-gray-900 mb-2">
                Day {day.day}: {day.title}
              </h3>
              <div className="space-y-2">
                {day.activities?.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-sm font-medium text-gray-700 w-16">
                      {activity.time}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.description}</p>
                      {activity.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" />
                          {activity.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Itineraries;
