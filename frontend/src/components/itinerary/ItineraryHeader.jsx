const ItineraryHeader = ({ itinerary, onSave, onShare, onExport }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{itinerary?.title}</h1>
          <p className="text-sm text-gray-600">{itinerary?.destination?.city}</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={onSave} className="btn btn-primary">Save</button>
          <button onClick={onShare} className="btn btn-secondary">Share</button>
          <button onClick={onExport} className="btn btn-secondary">Export</button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryHeader;
