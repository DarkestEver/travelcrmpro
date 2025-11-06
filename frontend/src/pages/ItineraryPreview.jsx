import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { itinerariesAPI } from '../services/apiEndpoints';
import { FiArrowLeft, FiDownload, FiPrinter, FiMapPin, FiCalendar, FiClock, FiDollarSign } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const ItineraryPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: itinerary, isLoading, error } = useQuery({
    queryKey: ['itinerary-preview', id],
    queryFn: () => itinerariesAPI.getById(id),
    enabled: !!id
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const loadingToast = toast.loading('Generating PDF...');
    
    try {
      // Get the preview content element
      const element = document.getElementById('preview-content');
      
      // Hide the header buttons temporarily
      const header = document.querySelector('.print\\:hidden');
      if (header) header.style.display = 'none';
      
      // Create canvas from the HTML element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        windowWidth: 1200,
      });
      
      // Show the header again
      if (header) header.style.display = '';
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Top margin
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      const fileName = `${itinerary.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF downloaded successfully!', { id: loadingToast });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', { id: loadingToast });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Itinerary</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'Itinerary not found'}</p>
          <button onClick={() => navigate('/itineraries')} className="btn btn-primary">
            Back to Itineraries
          </button>
        </div>
      </div>
    );
  }

  const getComponentIcon = (type) => {
    switch (type) {
      case 'stay': return '🏨';
      case 'transfer': return '🚗';
      case 'activity': return '🎭';
      case 'meal': return '🍽️';
      case 'note': return '📝';
      default: return '📍';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden when printing */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/itineraries/${id}/build`)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
            Back to Builder
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={handlePrint} className="btn btn-secondary">
              <FiPrinter className="w-4 h-4 mr-2" />
              Print
            </button>
            <button onClick={handleDownloadPDF} className="btn btn-primary">
              <FiDownload className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div id="preview-content" className="max-w-6xl mx-auto p-8 bg-white my-8 shadow-lg print:shadow-none print:my-0">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{itinerary.title}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <div className="flex items-center">
              <FiMapPin className="w-5 h-5 mr-2" />
              <span>{itinerary.destination?.city}, {itinerary.destination?.country}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="w-5 h-5 mr-2" />
              <span>{itinerary.numberOfDays} Days / {itinerary.numberOfNights} Nights</span>
            </div>
            {itinerary.estimatedCost?.baseCost > 0 && (
              <div className="flex items-center">
                <FiDollarSign className="w-5 h-5 mr-2" />
                <span>{itinerary.estimatedCost.currency} {itinerary.estimatedCost.baseCost.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        {itinerary.overview && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 whitespace-pre-line">{itinerary.overview}</p>
          </div>
        )}

        {/* Highlights */}
        {itinerary.highlights && itinerary.highlights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Highlights</h2>
            <ul className="list-disc list-inside space-y-2">
              {itinerary.highlights.map((highlight, index) => (
                <li key={index} className="text-gray-700">{highlight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Days Itinerary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Itinerary</h2>
          {itinerary.days && itinerary.days.length > 0 ? (
            <div className="space-y-8">
              {itinerary.days.map((day, dayIndex) => (
                <div key={day._id || dayIndex} className="border-l-4 border-primary-500 pl-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Day {day.dayNumber}: {day.title}
                    </h3>
                    {day.date && (
                      <p className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                    {day.notes && (
                      <p className="text-gray-700 mt-2 italic">{day.notes}</p>
                    )}
                  </div>

                  {/* Components */}
                  {day.components && day.components.length > 0 && (
                    <div className="space-y-4">
                      {day.components.map((component, compIndex) => (
                        <div key={component._id || compIndex} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start">
                            <span className="text-2xl mr-3">{getComponentIcon(component.type)}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{component.title}</h4>
                              
                              {/* Time */}
                              {(component.startTime || component.endTime) && (
                                <p className="text-sm text-gray-600 mb-2">
                                  <FiClock className="inline w-4 h-4 mr-1" />
                                  {component.startTime} {component.endTime && `- ${component.endTime}`}
                                </p>
                              )}

                              {/* Location */}
                              {(component.location?.name || component.location?.address) && (
                                <p className="text-sm text-gray-600 mb-2">
                                  <FiMapPin className="inline w-4 h-4 mr-1" />
                                  {component.location.name || component.location.address}
                                </p>
                              )}

                              {/* Type-specific details */}
                              {component.type === 'stay' && component.accommodation && (
                                <div className="mt-2 text-sm text-gray-700">
                                  <p><strong>Hotel:</strong> {component.accommodation.hotelName}</p>
                                  {component.accommodation.roomType && <p><strong>Room:</strong> {component.accommodation.roomType}</p>}
                                  {component.accommodation.mealPlan && <p><strong>Meal Plan:</strong> {component.accommodation.mealPlan}</p>}
                                </div>
                              )}

                              {component.type === 'activity' && component.activity && (
                                <div className="mt-2 text-sm text-gray-700">
                                  {component.activity.category && <p><strong>Category:</strong> {component.activity.category}</p>}
                                  {component.activity.duration && <p><strong>Duration:</strong> {component.activity.duration}</p>}
                                  {component.activity.highlights && component.activity.highlights.length > 0 && (
                                    <div className="mt-2">
                                      <strong>Highlights:</strong>
                                      <ul className="list-disc list-inside ml-4">
                                        {component.activity.highlights.map((h, i) => <li key={i}>{h}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {component.type === 'meal' && component.meal && (
                                <div className="mt-2 text-sm text-gray-700">
                                  {component.meal.restaurantName && <p><strong>Restaurant:</strong> {component.meal.restaurantName}</p>}
                                  {component.meal.cuisineType && <p><strong>Cuisine:</strong> {component.meal.cuisineType}</p>}
                                  {component.meal.mealType && <p><strong>Type:</strong> {component.meal.mealType}</p>}
                                </div>
                              )}

                              {component.type === 'transfer' && component.transportation && (
                                <div className="mt-2 text-sm text-gray-700">
                                  {component.transportation.mode && <p><strong>Mode:</strong> {component.transportation.mode}</p>}
                                  {component.transportation.from?.name && component.transportation.to?.name && (
                                    <p><strong>Route:</strong> {component.transportation.from.name} → {component.transportation.to.name}</p>
                                  )}
                                </div>
                              )}

                              {/* Cost */}
                              {component.cost?.amount > 0 && (
                                <p className="text-sm font-semibold text-green-600 mt-2">
                                  {component.cost.currency} {component.cost.amount.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No days added yet.</p>
          )}
        </div>

        {/* Inclusions & Exclusions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {itinerary.inclusions && itinerary.inclusions.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Inclusions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {itinerary.inclusions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {itinerary.exclusions && itinerary.exclusions.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Exclusions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {itinerary.exclusions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Generated by Travel CRM • {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ItineraryPreview;
