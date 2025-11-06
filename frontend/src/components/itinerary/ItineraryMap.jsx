import { useEffect, useRef } from 'react';

const ItineraryMap = ({ itinerary, selectedDay }) => {
  const mapRef = useRef(null);

  // Placeholder for map implementation
  // TODO: Integrate Google Maps or Mapbox

  return (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-xl font-semibold mb-2">Map View</h3>
        <p className="text-sm">Interactive map coming soon</p>
        <p className="text-xs mt-2">Google Maps / Mapbox integration</p>
      </div>
    </div>
  );
};

export default ItineraryMap;
