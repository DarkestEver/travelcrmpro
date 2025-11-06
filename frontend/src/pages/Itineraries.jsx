import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye,
  FiDownload,
  FiCalendar,
  FiMapPin
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { itinerariesAPI } from '../services/apiEndpoints';

const Itineraries = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null);

  // Fetch itineraries
  const { data, isLoading } = useQuery({
    queryKey: ['itineraries', page, search],
    queryFn: () => itinerariesAPI.getAll({ page, limit: 10, search }),
  });

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

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">
            {row.destinations?.join(', ')}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (value) => value?.name || 'N/A',
    },
    {
      header: 'Duration',
      accessor: 'days',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <FiCalendar className="w-4 h-4 text-gray-500" />
          <span>{value?.length || 0} days</span>
        </div>
      ),
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
            onClick={() => handlePreview(row)}
            className="text-green-600 hover:text-green-800"
            title="Preview"
          >
            <FiEye className="w-4 h-4" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Itineraries</h1>
          <p className="text-gray-600 mt-1">Create and manage travel itineraries</p>
        </div>
        <button
          onClick={() => {
            setSelectedItinerary(null);
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create Itinerary
        </button>
      </div>

      {/* Table */}
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
    </div>
  );
};

// Itinerary Form Modal Component
const ItineraryFormModal = ({ isOpen, onClose, itinerary, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: itinerary?.title || '',
    description: itinerary?.description || '',
    destinations: itinerary?.destinations?.join(', ') || '',
    status: itinerary?.status || 'draft',
    days: itinerary?.days || [
      {
        day: 1,
        title: '',
        activities: [
          { time: '09:00', description: '', location: '' }
        ]
      }
    ],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert destinations string to array
    const payload = {
      ...formData,
      destinations: formData.destinations.split(',').map(d => d.trim()).filter(Boolean),
    };
    
    onSubmit(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addDay = () => {
    setFormData(prev => ({
      ...prev,
      days: [
        ...prev.days,
        {
          day: prev.days.length + 1,
          title: '',
          activities: [{ time: '09:00', description: '', location: '' }]
        }
      ]
    }));
  };

  const removeDay = (index) => {
    if (formData.days.length > 1) {
      setFormData(prev => ({
        ...prev,
        days: prev.days.filter((_, i) => i !== index).map((day, i) => ({ ...day, day: i + 1 }))
      }));
    }
  };

  const updateDay = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => i === index ? { ...day, [field]: value } : day)
    }));
  };

  const addActivity = (dayIndex) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => 
        i === dayIndex 
          ? { ...day, activities: [...day.activities, { time: '09:00', description: '', location: '' }] }
          : day
      )
    }));
  };

  const removeActivity = (dayIndex, activityIndex) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => 
        i === dayIndex 
          ? { ...day, activities: day.activities.filter((_, ai) => ai !== activityIndex) }
          : day
      )
    }));
  };

  const updateActivity = (dayIndex, activityIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => 
        i === dayIndex 
          ? {
              ...day,
              activities: day.activities.map((activity, ai) => 
                ai === activityIndex ? { ...activity, [field]: value } : activity
              )
            }
          : day
      )
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itinerary ? 'Edit Itinerary' : 'Create New Itinerary'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
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
          <label className="label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="input"
            placeholder="Brief overview of the itinerary..."
          />
        </div>

        <div>
          <label className="label">Destinations (comma-separated) *</label>
          <input
            type="text"
            name="destinations"
            value={formData.destinations}
            onChange={handleChange}
            required
            className="input"
            placeholder="Bangkok, Phuket, Singapore"
          />
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

        {/* Day-by-Day Planner */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Day-by-Day Activities</h3>
            <button
              type="button"
              onClick={addDay}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FiPlus className="w-3 h-3" />
              Add Day
            </button>
          </div>

          {formData.days.map((day, dayIndex) => (
            <div key={dayIndex} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-800">Day {day.day}</h4>
                {formData.days.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDay(dayIndex)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Day
                  </button>
                )}
              </div>

              <div className="mb-3">
                <label className="label text-sm">Day Title</label>
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => updateDay(dayIndex, 'title', e.target.value)}
                  className="input input-sm"
                  placeholder="Arrival in Bangkok"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="label text-sm">Activities</label>
                  <button
                    type="button"
                    onClick={() => addActivity(dayIndex)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Activity
                  </button>
                </div>

                {day.activities.map((activity, activityIndex) => (
                  <div key={activityIndex} className="flex gap-2 bg-white p-2 rounded">
                    <input
                      type="time"
                      value={activity.time}
                      onChange={(e) => updateActivity(dayIndex, activityIndex, 'time', e.target.value)}
                      className="input input-sm w-32"
                    />
                    <input
                      type="text"
                      value={activity.description}
                      onChange={(e) => updateActivity(dayIndex, activityIndex, 'description', e.target.value)}
                      placeholder="Activity description"
                      className="input input-sm flex-1"
                    />
                    <input
                      type="text"
                      value={activity.location}
                      onChange={(e) => updateActivity(dayIndex, activityIndex, 'location', e.target.value)}
                      placeholder="Location"
                      className="input input-sm w-40"
                    />
                    {day.activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeActivity(dayIndex, activityIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
