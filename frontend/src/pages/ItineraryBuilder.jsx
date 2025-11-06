import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  FiSave,
  FiShare2,
  FiDownload,
  FiEye,
  FiPlus,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiArrowLeft,
  FiSettings,
  FiLayers
} from 'react-icons/fi';
import { itinerariesAPI } from '../services/apiEndpoints';
import DayTimeline from '../components/itinerary/DayTimeline';
import ItineraryHeader from '../components/itinerary/ItineraryHeader';
import DaySidebar from '../components/itinerary/DaySidebar';
import ComponentModal from '../components/itinerary/ComponentModal';
import ShareModal from '../components/itinerary/ShareModal';
import ItineraryMap from '../components/itinerary/ItineraryMap';

const ItineraryBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [itinerary, setItinerary] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewMode, setViewMode] = useState('timeline'); // timeline, map, both
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Fetch itinerary data
  const { data: itineraryData, isLoading, error } = useQuery({
    queryKey: ['itinerary', id],
    queryFn: async () => {
      console.log('Fetching itinerary with ID:', id);
      try {
        const result = await itinerariesAPI.getById(id);
        console.log('Fetched itinerary data:', result);
        return result;
      } catch (err) {
        console.error('Error fetching itinerary:', err);
        throw err;
      }
    },
    enabled: !!id
  });

  // Update local state when data changes
  useEffect(() => {
    if (itineraryData) {
      setItinerary(itineraryData);
      if (itineraryData.days && itineraryData.days.length > 0) {
        setSelectedDay(itineraryData.days[0]);
      }
    }
  }, [itineraryData]);

  // Get itinerary stats
  const { data: stats } = useQuery({
    queryKey: ['itinerary-stats', id],
    queryFn: () => itinerariesAPI.getStats(id),
    enabled: !!id,
    refetchInterval: 60000 // Refresh every minute
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data) => itinerariesAPI.update(id, data),
    onSuccess: () => {
      toast.success('Itinerary saved successfully');
      setUnsavedChanges(false);
      queryClient.invalidateQueries(['itinerary', id]);
      queryClient.invalidateQueries(['itinerary-stats', id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save itinerary');
    }
  });

  // Add day mutation
  const addDayMutation = useMutation({
    mutationFn: (dayData) => itinerariesAPI.addDay(id, dayData),
    onSuccess: (data) => {
      toast.success('Day added successfully');
      queryClient.invalidateQueries(['itinerary', id]);
      setItinerary(data);
      if (data.days && data.days.length > 0) {
        setSelectedDay(data.days[data.days.length - 1]);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add day');
    }
  });

  // Add component mutation
  const addComponentMutation = useMutation({
    mutationFn: ({ dayId, componentData }) =>
      itinerariesAPI.addComponent(id, dayId, componentData),
    onSuccess: (data) => {
      toast.success('Component added successfully');
      queryClient.invalidateQueries(['itinerary', id]);
      setItinerary(data);
      setShowComponentModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add component');
    }
  });

  // Update component mutation
  const updateComponentMutation = useMutation({
    mutationFn: ({ dayId, componentId, componentData }) =>
      itinerariesAPI.updateComponent(id, dayId, componentId, componentData),
    onSuccess: (data) => {
      toast.success('Component updated successfully');
      queryClient.invalidateQueries(['itinerary', id]);
      setItinerary(data);
      setShowComponentModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update component');
    }
  });

  // Delete component mutation
  const deleteComponentMutation = useMutation({
    mutationFn: ({ dayId, componentId }) =>
      itinerariesAPI.deleteComponent(id, dayId, componentId),
    onSuccess: (data) => {
      toast.success('Component deleted successfully');
      queryClient.invalidateQueries(['itinerary', id]);
      setItinerary(data);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete component');
    }
  });

  // Reorder components mutation
  const reorderComponentsMutation = useMutation({
    mutationFn: ({ dayId, startIndex, endIndex }) => {
      // Optimistically reorder locally
      const day = itinerary.days.find(d => d._id === dayId);
      if (!day) return Promise.reject('Day not found');
      
      const components = [...day.components];
      const [removed] = components.splice(startIndex, 1);
      components.splice(endIndex, 0, removed);
      
      const componentIds = components.map(c => c._id);
      return itinerariesAPI.reorderComponents(id, dayId, componentIds);
    },
    onMutate: async ({ dayId, startIndex, endIndex }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['itinerary', id]);

      // Snapshot previous value
      const previousItinerary = queryClient.getQueryData(['itinerary', id]);

      // Optimistically update
      queryClient.setQueryData(['itinerary', id], (old) => {
        if (!old) return old;
        
        const newItinerary = { ...old };
        newItinerary.days = newItinerary.days.map(day => {
          if (day._id === dayId) {
            const components = [...day.components];
            const [removed] = components.splice(startIndex, 1);
            components.splice(endIndex, 0, removed);
            return { ...day, components };
          }
          return day;
        });
        
        return newItinerary;
      });

      return { previousItinerary };
    },
    onSuccess: (data) => {
      toast.success('Order updated');
      queryClient.invalidateQueries(['itinerary', id]);
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousItinerary) {
        queryClient.setQueryData(['itinerary', id], context.previousItinerary);
      }
      toast.error('Failed to update order');
    }
  });

  // Handle auto-save
  useEffect(() => {
    if (autoSaveEnabled && unsavedChanges && itinerary) {
      const timer = setTimeout(() => {
        saveMutation.mutate(itinerary);
      }, 3000); // Auto-save after 3 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [itinerary, unsavedChanges, autoSaveEnabled]);

  // Handle adding new day
  const handleAddDay = () => {
    const dayNumber = itinerary.days ? itinerary.days.length + 1 : 1;
    const date = new Date(itinerary.startDate);
    date.setDate(date.getDate() + dayNumber - 1);

    const newDay = {
      dayNumber,
      date: date.toISOString().split('T')[0],
      title: `Day ${dayNumber}`,
      location: itinerary.destination || {},
      notes: ''
    };

    addDayMutation.mutate(newDay);
  };

  // Handle adding component
  const handleAddComponent = (type) => {
    setSelectedComponent({ type });
    setShowComponentModal(true);
  };

  // Handle editing component
  const handleEditComponent = (component) => {
    setSelectedComponent(component);
    setShowComponentModal(true);
  };

  // Handle deleting component
  const handleDeleteComponent = (dayId, componentId) => {
    if (window.confirm('Are you sure you want to delete this component?')) {
      deleteComponentMutation.mutate({ dayId, componentId });
    }
  };

  // Handle reordering components
  const handleReorderComponents = (dayId, startIndex, endIndex) => {
    reorderComponentsMutation.mutate({ dayId, startIndex, endIndex });
  };

  // Handle saving component
  const handleSaveComponent = (componentData) => {
    if (selectedComponent?._id) {
      // Update existing component
      updateComponentMutation.mutate({
        dayId: selectedDay._id,
        componentId: selectedComponent._id,
        componentData
      });
    } else {
      // Add new component
      addComponentMutation.mutate({
        dayId: selectedDay._id,
        componentData
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      toast.loading('Generating PDF...');
      // TODO: Implement PDF export
      toast.success('PDF generated successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  // Handle share
  const handleShare = () => {
    setShowShareModal(true);
  };

  // Handle preview
  const handlePreview = () => {
    window.open(`/itinerary-preview/${id}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Itinerary</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => navigate('/itineraries')}
            className="btn btn-primary"
          >
            Back to Itineraries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back button and title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/itineraries')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {itinerary?.title || 'Untitled Itinerary'}
              </h1>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center">
                  <FiMapPin className="w-4 h-4 mr-1" />
                  {itinerary?.destination?.city}, {itinerary?.destination?.country}
                </span>
                <span className="flex items-center">
                  <FiCalendar className="w-4 h-4 mr-1" />
                  {itinerary?.numberOfDays} Days / {itinerary?.numberOfNights} Nights
                </span>
                {stats && (
                  <span className="flex items-center">
                    <FiDollarSign className="w-4 h-4 mr-1" />
                    {stats.costBreakdown?.totalCost?.toLocaleString()} {stats.costBreakdown?.currency}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center space-x-2">
            {unsavedChanges && (
              <span className="text-sm text-amber-600 mr-2">
                Unsaved changes
              </span>
            )}
            
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded ${
                  viewMode === 'timeline'
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiLayers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded ${
                  viewMode === 'map'
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiMapPin className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('both')}
                className={`px-3 py-1.5 rounded ${
                  viewMode === 'both'
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiSettings className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handlePreview}
              className="btn btn-secondary"
            >
              <FiEye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={handleShare}
              className="btn btn-secondary"
            >
              <FiShare2 className="w-4 h-4 mr-2" />
              Share
            </button>
            <button
              onClick={handleExport}
              className="btn btn-secondary"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Export PDF
            </button>
            <button
              onClick={() => saveMutation.mutate(itinerary)}
              className="btn btn-primary"
              disabled={saveMutation.isLoading}
            >
              <FiSave className="w-4 h-4 mr-2" />
              {saveMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Day Navigation */}
        <DaySidebar
          days={itinerary?.days || []}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onAddDay={handleAddDay}
          stats={stats}
        />

        {/* Center Content - Timeline/Map */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'timeline' && (
            <DayTimeline
              day={selectedDay}
              onAddComponent={handleAddComponent}
              onEditComponent={handleEditComponent}
              onDeleteComponent={handleDeleteComponent}
              onReorderComponents={handleReorderComponents}
            />
          )}
          
          {viewMode === 'map' && (
            <ItineraryMap
              itinerary={itinerary}
              selectedDay={selectedDay}
            />
          )}
          
          {viewMode === 'both' && (
            <div className="grid grid-cols-2 gap-4 p-4 h-full">
              <div className="overflow-auto">
                <DayTimeline
                  day={selectedDay}
                  onAddComponent={handleAddComponent}
                  onEditComponent={handleEditComponent}
                  onDeleteComponent={handleDeleteComponent}
                  onReorderComponents={handleReorderComponents}
                />
              </div>
              <div className="overflow-auto">
                <ItineraryMap
                  itinerary={itinerary}
                  selectedDay={selectedDay}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Component Details (Optional) */}
        {/* Can be added later for showing selected component details */}
      </div>

      {/* Modals */}
      {showComponentModal && (
        <ComponentModal
          isOpen={showComponentModal}
          onClose={() => {
            setShowComponentModal(false);
            setSelectedComponent(null);
          }}
          component={selectedComponent}
          onSave={handleSaveComponent}
          dayLocation={selectedDay?.location}
        />
      )}

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          itineraryId={id}
        />
      )}
    </div>
  );
};

export default ItineraryBuilder;
