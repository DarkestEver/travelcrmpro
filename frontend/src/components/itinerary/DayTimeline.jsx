import { FiPlus, FiEdit, FiTrash2, FiClock, FiMapPin, FiDollarSign, FiMove } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const DayTimeline = ({ day, onAddComponent, onEditComponent, onDeleteComponent, onReorderComponents }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    
    if (startIndex === endIndex) return;
    
    if (onReorderComponents) {
      onReorderComponents(day._id, startIndex, endIndex);
    }
  };

  if (!day) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center text-gray-400">
          <p className="text-lg">Select a day to view timeline</p>
          <p className="text-sm mt-2">Choose a day from the sidebar to get started</p>
        </div>
      </div>
    );
  }

  const components = day.components || [];

  const getComponentIcon = (type) => {
    switch (type) {
      case 'stay':
        return '🏨';
      case 'transfer':
        return '🚗';
      case 'activity':
        return '🎭';
      case 'meal':
        return '🍽️';
      case 'note':
        return '📝';
      default:
        return '📍';
    }
  };

  const getComponentTitle = (component) => {
    return component.title || component.accommodation?.hotelName || component.activity?.title || 'Untitled';
  };

  const getComponentTime = (component) => {
    if (component.startTime) {
      return component.endTime 
        ? `${component.startTime} - ${component.endTime}`
        : component.startTime;
    }
    return null;
  };

  const getComponentCost = (component) => {
    if (component.cost?.amount) {
      return `${component.cost.currency || 'INR'} ${component.cost.amount.toLocaleString()}`;
    }
    return null;
  };

  const renderComponentCard = (component, index) => {
    const time = getComponentTime(component);
    const cost = getComponentCost(component);
    const location = component.location?.name || component.location?.address;

    return (
      <Draggable
        key={component._id || `component-${index}`}
        draggableId={component._id || `component-${index}`}
        index={index}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all group ${
              snapshot.isDragging 
                ? 'border-primary-500 shadow-lg' 
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1">
                {/* Drag Handle */}
                <div
                  {...provided.dragHandleProps}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded cursor-move text-gray-400 hover:text-gray-600"
                  title="Drag to reorder"
                >
                  <FiMove className="w-4 h-4" />
                </div>
                <div className="text-3xl flex-shrink-0">
                  {getComponentIcon(component.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {getComponentTitle(component)}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2 text-sm">
                    {time && (
                      <span className="flex items-center text-gray-600">
                        <FiClock className="w-3 h-3 mr-1" />
                        {time}
                      </span>
                    )}
                    {cost && (
                      <span className="flex items-center text-green-600 font-medium">
                        <FiDollarSign className="w-3 h-3 mr-1" />
                        {cost}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditComponent(component)}
                  className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                  title="Edit"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteComponent(day._id, component._id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Location */}
            {location && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <FiMapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}

            {/* Type-specific details */}
            {component.type === 'stay' && component.accommodation && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  {component.accommodation.starRating && (
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
                      ⭐ {component.accommodation.starRating} Star
                    </span>
                  )}
                  {component.accommodation.roomType && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded capitalize">
                      {component.accommodation.roomType}
                    </span>
                  )}
                  {component.accommodation.mealPlan && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded capitalize">
                      {component.accommodation.mealPlan}
                    </span>
                  )}
                </div>
              </div>
            )}

            {component.type === 'transfer' && component.transportation && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  {component.transportation.mode && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded capitalize">
                      {component.transportation.mode}
                    </span>
                  )}
                  {component.transportation.class && (
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded capitalize">
                      {component.transportation.class}
                    </span>
                  )}
                </div>
              </div>
            )}

            {component.type === 'meal' && component.meal && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  {component.meal.mealType && (
                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded capitalize">
                      {component.meal.mealType}
                    </span>
                  )}
                  {component.meal.cuisineType && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded capitalize">
                      {component.meal.cuisineType}
                    </span>
                  )}
                </div>
              </div>
            )}

            {component.type === 'activity' && component.activity && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  {component.activity.category && (
                    <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded capitalize">
                      {component.activity.category}
                    </span>
                  )}
                  {component.activity.difficulty && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded capitalize">
                      {component.activity.difficulty}
                    </span>
                  )}
                  {component.activity.duration && (
                    <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded">
                      ⏱️ {component.activity.duration}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Images */}
            {component.images && component.images.length > 0 && (
              <div className="mt-3 flex space-x-2 overflow-x-auto">
                {component.images.slice(0, 3).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt=""
                    className="w-16 h-16 object-cover rounded"
                  />
                ))}
                {component.images.length > 3 && (
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                    +{component.images.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Day Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
              D{day.dayNumber}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{day.title}</h2>
              <p className="text-gray-600">
                {day.date && new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {day.location && (
            <div className="mt-2 flex items-center text-gray-600">
              <FiMapPin className="w-4 h-4 mr-2" />
              <span>
                {[day.location.city, day.location.state, day.location.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}

          {day.notes && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">{day.notes}</p>
            </div>
          )}
        </div>

        {/* Add Component Buttons */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <button
            onClick={() => onAddComponent('stay')}
            className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-2xl mb-1">🏨</div>
            <div className="text-xs font-medium text-gray-700">Hotel</div>
          </button>
          <button
            onClick={() => onAddComponent('transfer')}
            className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-2xl mb-1">🚗</div>
            <div className="text-xs font-medium text-gray-700">Transfer</div>
          </button>
          <button
            onClick={() => onAddComponent('activity')}
            className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-2xl mb-1">🎭</div>
            <div className="text-xs font-medium text-gray-700">Activity</div>
          </button>
          <button
            onClick={() => onAddComponent('meal')}
            className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-2xl mb-1">🍽️</div>
            <div className="text-xs font-medium text-gray-700">Meal</div>
          </button>
          <button
            onClick={() => onAddComponent('note')}
            className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-2xl mb-1">📝</div>
            <div className="text-xs font-medium text-gray-700">Note</div>
          </button>
        </div>

        {/* Components Timeline */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`day-${day._id}`}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-4 ${snapshot.isDraggingOver ? 'bg-primary-50 rounded-lg p-2' : ''}`}
              >
                {components.length > 0 ? (
                  <>
                    {components.map((component, index) => renderComponentCard(component, index))}
                    {provided.placeholder}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-lg mb-2">No activities added yet</p>
                    <p className="text-sm">Add hotels, transfers, activities, meals, or notes above</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default DayTimeline;
