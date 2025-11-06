import { useState, useEffect } from 'react';
import Modal from '../Modal';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import LocationInput from '../LocationInput';
import ImageUploader from '../ImageUploader';

const ComponentModal = ({ isOpen, onClose, component, onSave, dayLocation }) => {
  const [formData, setFormData] = useState(component || { type: 'activity' });

  // Reset form when component changes
  useEffect(() => {
    setFormData(component || { type: 'activity' });
  }, [component]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {component?._id ? 'Edit' : 'Add'} {formData.type === 'stay' ? 'Hotel' : formData.type === 'transfer' ? 'Transfer' : formData.type === 'meal' ? 'Meal' : formData.type === 'activity' ? 'Activity' : 'Note'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Basic Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime || ''}
                onChange={(e) => updateField('startTime', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime || ''}
                onChange={(e) => updateField('endTime', e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Type-specific fields */}
          {formData.type === 'stay' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-900">Hotel Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel Name *
                </label>
                <input
                  type="text"
                  value={formData.accommodation?.hotelName || ''}
                  onChange={(e) => updateNestedField('accommodation', 'hotelName', e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.accommodation?.category || ''}
                    onChange={(e) => updateNestedField('accommodation', 'category', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="budget">Budget</option>
                    <option value="3-star">3 Star</option>
                    <option value="4-star">4 Star</option>
                    <option value="5-star">5 Star</option>
                    <option value="luxury">Luxury</option>
                    <option value="boutique">Boutique</option>
                    <option value="resort">Resort</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Star Rating
                  </label>
                  <select
                    value={formData.accommodation?.starRating || ''}
                    onChange={(e) => updateNestedField('accommodation', 'starRating', parseInt(e.target.value))}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="1">1 Star</option>
                    <option value="2">2 Star</option>
                    <option value="3">3 Star</option>
                    <option value="4">4 Star</option>
                    <option value="5">5 Star</option>
                  </select>
                </div>
              </div>

              <LocationInput
                label="Address"
                value={formData.location}
                onChange={(locationData) => updateField('location', locationData)}
                placeholder="Search for hotel address"
                className="input"
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={formData.accommodation?.checkInDate?.split('T')[0] || ''}
                    onChange={(e) => updateNestedField('accommodation', 'checkInDate', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    value={formData.accommodation?.checkInTime || '14:00'}
                    onChange={(e) => updateNestedField('accommodation', 'checkInTime', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nights
                  </label>
                  <input
                    type="number"
                    value={formData.accommodation?.nights || 1}
                    onChange={(e) => updateNestedField('accommodation', 'nights', parseInt(e.target.value))}
                    className="input"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={formData.accommodation?.checkOutDate?.split('T')[0] || ''}
                    onChange={(e) => updateNestedField('accommodation', 'checkOutDate', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    value={formData.accommodation?.checkOutTime || '11:00'}
                    onChange={(e) => updateNestedField('accommodation', 'checkOutTime', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Rooms
                  </label>
                  <input
                    type="number"
                    value={formData.accommodation?.numberOfRooms || 1}
                    onChange={(e) => updateNestedField('accommodation', 'numberOfRooms', parseInt(e.target.value))}
                    className="input"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type
                  </label>
                  <input
                    type="text"
                    value={formData.accommodation?.roomType || ''}
                    onChange={(e) => updateNestedField('accommodation', 'roomType', e.target.value)}
                    className="input"
                    placeholder="e.g., Deluxe Double, Suite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Plan
                  </label>
                  <select
                    value={formData.accommodation?.mealPlan || ''}
                    onChange={(e) => updateNestedField('accommodation', 'mealPlan', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="room-only">Room Only</option>
                    <option value="bed-breakfast">Bed & Breakfast</option>
                    <option value="half-board">Half Board (Breakfast + Dinner)</option>
                    <option value="full-board">Full Board (All Meals)</option>
                    <option value="all-inclusive">All Inclusive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Number
                </label>
                <input
                  type="text"
                  value={formData.accommodation?.confirmationNumber || ''}
                  onChange={(e) => updateNestedField('accommodation', 'confirmationNumber', e.target.value)}
                  className="input"
                  placeholder="Booking confirmation number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                  {['Wi-Fi', 'Parking', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Room Service', 'Bar', 'Airport Shuttle', 'Business Center', 'Concierge', 'Laundry', 'Air Conditioning', 'Mini Bar', 'TV', 'Safe', 'Balcony', 'Kitchen', 'Pet Friendly', 'Non-Smoking', 'Beach Access', 'Wheelchair Accessible', 'Kids Club'].map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.accommodation?.amenities?.includes(amenity) || false}
                        onChange={(e) => {
                          const current = formData.accommodation?.amenities || [];
                          const updated = e.target.checked
                            ? [...current, amenity]
                            : current.filter(a => a !== amenity);
                          updateNestedField('accommodation', 'amenities', updated);
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests / Notes
                </label>
                <textarea
                  value={formData.accommodation?.specialRequests || ''}
                  onChange={(e) => updateNestedField('accommodation', 'specialRequests', e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Any special requests or important notes"
                />
              </div>
            </div>
          )}

          {formData.type === 'transfer' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-900">Transportation Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode of Transport *
                </label>
                <select
                  value={formData.transportation?.mode || ''}
                  onChange={(e) => updateNestedField('transportation', 'mode', e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select...</option>
                  <option value="flight">Flight ✈️</option>
                  <option value="train">Train 🚂</option>
                  <option value="bus">Bus 🚌</option>
                  <option value="car">Car 🚗</option>
                  <option value="taxi">Taxi 🚕</option>
                  <option value="uber">Uber/Ola 🚙</option>
                  <option value="metro">Metro 🚇</option>
                  <option value="ferry">Ferry ⛴️</option>
                  <option value="cruise">Cruise 🛳️</option>
                  <option value="walking">Walking 🚶</option>
                  <option value="bicycle">Bicycle 🚲</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Location *
                  </label>
                  <input
                    type="text"
                    value={formData.transportation?.from?.name || ''}
                    onChange={(e) => updateNestedField('transportation', 'from', { ...formData.transportation?.from, name: e.target.value })}
                    className="input"
                    placeholder="Departure location"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Location *
                  </label>
                  <input
                    type="text"
                    value={formData.transportation?.to?.name || ''}
                    onChange={(e) => updateNestedField('transportation', 'to', { ...formData.transportation?.to, name: e.target.value })}
                    className="input"
                    placeholder="Arrival location"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terminal/Station (From)
                  </label>
                  <input
                    type="text"
                    value={formData.transportation?.from?.terminal || ''}
                    onChange={(e) => updateNestedField('transportation', 'from', { ...formData.transportation?.from, terminal: e.target.value })}
                    className="input"
                    placeholder="e.g., Terminal 3, Platform 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terminal/Station (To)
                  </label>
                  <input
                    type="text"
                    value={formData.transportation?.to?.terminal || ''}
                    onChange={(e) => updateNestedField('transportation', 'to', { ...formData.transportation?.to, terminal: e.target.value })}
                    className="input"
                    placeholder="e.g., Terminal 2, Platform 8"
                  />
                </div>
              </div>

              {(formData.transportation?.mode === 'flight' || formData.transportation?.mode === 'train' || formData.transportation?.mode === 'bus') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {formData.transportation?.mode === 'flight' ? 'Flight Number' : 
                         formData.transportation?.mode === 'train' ? 'Train Number' : 'Bus Number'}
                      </label>
                      <input
                        type="text"
                        value={formData.transportation?.vehicleNumber || ''}
                        onChange={(e) => updateNestedField('transportation', 'vehicleNumber', e.target.value)}
                        className="input"
                        placeholder={formData.transportation?.mode === 'flight' ? 'e.g., AI 101' : 
                                   formData.transportation?.mode === 'train' ? 'e.g., 12345' : 'e.g., BUS123'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {formData.transportation?.mode === 'flight' ? 'Airline' : 
                         formData.transportation?.mode === 'train' ? 'Railway' : 'Bus Operator'}
                      </label>
                      <input
                        type="text"
                        value={formData.transportation?.provider || ''}
                        onChange={(e) => updateNestedField('transportation', 'provider', e.target.value)}
                        className="input"
                        placeholder={formData.transportation?.mode === 'flight' ? 'e.g., Air India' : 
                                   formData.transportation?.mode === 'train' ? 'e.g., Indian Railways' : 'e.g., Volvo'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PNR / Booking Reference
                      </label>
                      <input
                        type="text"
                        value={formData.transportation?.pnr || ''}
                        onChange={(e) => updateNestedField('transportation', 'pnr', e.target.value)}
                        className="input"
                        placeholder="Booking reference number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seat Number
                      </label>
                      <input
                        type="text"
                        value={formData.transportation?.seatNumber || ''}
                        onChange={(e) => updateNestedField('transportation', 'seatNumber', e.target.value)}
                        className="input"
                        placeholder="e.g., 12A, S4-24"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class
                      </label>
                      <select
                        value={formData.transportation?.class || ''}
                        onChange={(e) => updateNestedField('transportation', 'class', e.target.value)}
                        className="input"
                      >
                        <option value="">Select...</option>
                        <option value="economy">Economy</option>
                        <option value="premium-economy">Premium Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                      </select>
                    </div>
                    {formData.transportation?.mode === 'flight' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Baggage Allowance
                        </label>
                        <input
                          type="text"
                          value={formData.transportation?.baggageAllowance || ''}
                          onChange={(e) => updateNestedField('transportation', 'baggageAllowance', e.target.value)}
                          className="input"
                          placeholder="e.g., 23kg checked, 7kg cabin"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={formData.transportation?.departureTime || ''}
                    onChange={(e) => updateNestedField('transportation', 'departureTime', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Time
                  </label>
                  <input
                    type="time"
                    value={formData.transportation?.arrivalTime || ''}
                    onChange={(e) => updateNestedField('transportation', 'arrivalTime', e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.transportation?.duration || ''}
                    onChange={(e) => updateNestedField('transportation', 'duration', e.target.value)}
                    className="input"
                    placeholder="e.g., 2h 30m"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance
                  </label>
                  <input
                    type="text"
                    value={formData.transportation?.distance || ''}
                    onChange={(e) => updateNestedField('transportation', 'distance', e.target.value)}
                    className="input"
                    placeholder="e.g., 250 km"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Notes / Instructions
                </label>
                <textarea
                  value={formData.transportation?.notes || ''}
                  onChange={(e) => updateNestedField('transportation', 'notes', e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Any special instructions, pickup points, or important details"
                />
              </div>
            </div>
          )}

          {formData.type === 'meal' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-900">Meal Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Type *
                  </label>
                  <select
                    value={formData.meal?.mealType || ''}
                    onChange={(e) => updateNestedField('meal', 'mealType', e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="breakfast">Breakfast 🍳</option>
                    <option value="brunch">Brunch 🥐</option>
                    <option value="lunch">Lunch 🍱</option>
                    <option value="dinner">Dinner 🍽️</option>
                    <option value="snack">Snack 🍪</option>
                    <option value="high-tea">High Tea ☕</option>
                    <option value="buffet">Buffet 🍴</option>
                    <option value="tasting-menu">Tasting Menu 🍷</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                  <select
                    value={formData.meal?.cuisineType || ''}
                    onChange={(e) => updateNestedField('meal', 'cuisineType', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="indian">Indian</option>
                    <option value="chinese">Chinese</option>
                    <option value="italian">Italian</option>
                    <option value="thai">Thai</option>
                    <option value="japanese">Japanese</option>
                    <option value="mexican">Mexican</option>
                    <option value="mediterranean">Mediterranean</option>
                    <option value="french">French</option>
                    <option value="american">American</option>
                    <option value="continental">Continental</option>
                    <option value="fusion">Fusion</option>
                    <option value="seafood">Seafood</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="local">Local/Street Food</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant/Venue Name
                </label>
                <input
                  type="text"
                  value={formData.meal?.restaurantName || ''}
                  onChange={(e) => updateNestedField('meal', 'restaurantName', e.target.value)}
                  className="input"
                  placeholder="Name of restaurant or venue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Type
                </label>
                <select
                  value={formData.meal?.venueType || ''}
                  onChange={(e) => updateNestedField('meal', 'venueType', e.target.value)}
                  className="input"
                >
                  <option value="">Select...</option>
                  <option value="fine-dining">Fine Dining</option>
                  <option value="casual-dining">Casual Dining</option>
                  <option value="cafe">Café</option>
                  <option value="bistro">Bistro</option>
                  <option value="food-court">Food Court</option>
                  <option value="street-food">Street Food</option>
                  <option value="food-truck">Food Truck</option>
                  <option value="rooftop">Rooftop</option>
                  <option value="beachside">Beachside</option>
                  <option value="hotel-restaurant">Hotel Restaurant</option>
                  <option value="home-dining">Home Dining</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <LocationInput
                label="Address"
                value={formData.location}
                onChange={(locationData) => updateField('location', locationData)}
                placeholder="Search for restaurant address"
                className="input"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Requirements / Preferences
                </label>
                <div className="grid grid-cols-4 gap-2 border rounded p-3">
                  {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Dairy-Free', 'Nut-Free', 'Low-Carb'].map(diet => (
                    <label key={diet} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.meal?.dietaryRequirements?.includes(diet) || false}
                        onChange={(e) => {
                          const current = formData.meal?.dietaryRequirements || [];
                          const updated = e.target.checked
                            ? [...current, diet]
                            : current.filter(d => d !== diet);
                          updateNestedField('meal', 'dietaryRequirements', updated);
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{diet}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties / Must-Try Dishes
                </label>
                <textarea
                  value={formData.meal?.specialties || ''}
                  onChange={(e) => updateNestedField('meal', 'specialties', e.target.value)}
                  className="input"
                  rows="2"
                  placeholder="Recommended dishes, signature items"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reservation Required?
                  </label>
                  <select
                    value={formData.meal?.reservationRequired ? 'yes' : 'no'}
                    onChange={(e) => updateNestedField('meal', 'reservationRequired', e.target.value === 'yes')}
                    className="input"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reservation Number
                  </label>
                  <input
                    type="text"
                    value={formData.meal?.reservationNumber || ''}
                    onChange={(e) => updateNestedField('meal', 'reservationNumber', e.target.value)}
                    className="input"
                    placeholder="If reservation made"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.meal?.notes || ''}
                  onChange={(e) => updateNestedField('meal', 'notes', e.target.value)}
                  className="input"
                  rows="2"
                  placeholder="Any special instructions or notes"
                />
              </div>
            </div>
          )}

          {formData.type === 'activity' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-900">Activity Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.activity?.category || ''}
                    onChange={(e) => updateNestedField('activity', 'category', e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="sightseeing">Sightseeing 🏛️</option>
                    <option value="adventure">Adventure 🏔️</option>
                    <option value="cultural">Cultural 🎭</option>
                    <option value="historical">Historical 🏰</option>
                    <option value="leisure">Leisure 🏖️</option>
                    <option value="shopping">Shopping 🛍️</option>
                    <option value="nightlife">Nightlife 🌃</option>
                    <option value="sports">Sports ⚽</option>
                    <option value="wellness">Wellness/Spa 💆</option>
                    <option value="wildlife">Wildlife 🦁</option>
                    <option value="water-sports">Water Sports 🏄</option>
                    <option value="entertainment">Entertainment 🎪</option>
                    <option value="religious">Religious 🕌</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.activity?.difficulty || ''}
                    onChange={(e) => updateNestedField('activity', 'difficulty', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="very-easy">Very Easy 😊</option>
                    <option value="easy">Easy ⭐</option>
                    <option value="moderate">Moderate ⭐⭐</option>
                    <option value="challenging">Challenging ⭐⭐⭐</option>
                    <option value="difficult">Difficult ⭐⭐⭐⭐</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location/Venue Name
                </label>
                <input
                  type="text"
                  value={formData.location?.name || ''}
                  onChange={(e) => updateNestedField('location', 'name', e.target.value)}
                  className="input"
                  placeholder="e.g., Taj Mahal, Central Park"
                />
              </div>

              <LocationInput
                label="Address"
                value={formData.location}
                onChange={(locationData) => updateField('location', locationData)}
                placeholder="Search for activity location"
                className="input"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.activity?.duration || ''}
                    onChange={(e) => updateNestedField('activity', 'duration', e.target.value)}
                    className="input"
                    placeholder="e.g., 3 hours, Full day"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Best Time to Visit
                  </label>
                  <input
                    type="text"
                    value={formData.activity?.bestTime || ''}
                    onChange={(e) => updateNestedField('activity', 'bestTime', e.target.value)}
                    className="input"
                    placeholder="e.g., Morning, Sunset"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Highlights
                </label>
                <textarea
                  value={formData.activity?.highlights?.join('\n') || ''}
                  onChange={(e) => updateNestedField('activity', 'highlights', e.target.value.split('\n').filter(h => h.trim()))}
                  className="input"
                  rows="3"
                  placeholder="Enter each highlight on a new line"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's Included
                </label>
                <textarea
                  value={formData.activity?.included?.join('\n') || ''}
                  onChange={(e) => updateNestedField('activity', 'included', e.target.value.split('\n').filter(i => i.trim()))}
                  className="input"
                  rows="2"
                  placeholder="Enter each item on a new line (e.g., Guide, Entry tickets, Lunch)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's Excluded
                </label>
                <textarea
                  value={formData.activity?.excluded?.join('\n') || ''}
                  onChange={(e) => updateNestedField('activity', 'excluded', e.target.value.split('\n').filter(e => e.trim()))}
                  className="input"
                  rows="2"
                  placeholder="Enter each item on a new line (e.g., Personal expenses, Tips)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements & Restrictions
                </label>
                <textarea
                  value={formData.activity?.requirements || ''}
                  onChange={(e) => updateNestedField('activity', 'requirements', e.target.value)}
                  className="input"
                  rows="2"
                  placeholder="Age restrictions, fitness level, permits, dress code, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={formData.activity?.operatingHours || ''}
                    onChange={(e) => updateNestedField('activity', 'operatingHours', e.target.value)}
                    className="input"
                    placeholder="e.g., 9 AM - 6 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closed On
                  </label>
                  <input
                    type="text"
                    value={formData.activity?.closedOn || ''}
                    onChange={(e) => updateNestedField('activity', 'closedOn', e.target.value)}
                    className="input"
                    placeholder="e.g., Mondays, Public holidays"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ticket Information
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={formData.activity?.ticketInfo?.type || ''}
                      onChange={(e) => updateNestedField('activity', 'ticketInfo', { ...formData.activity?.ticketInfo, type: e.target.value })}
                      className="input"
                      placeholder="Ticket type (e.g., Adult, Child, Senior)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.activity?.ticketInfo?.bookingReference || ''}
                      onChange={(e) => updateNestedField('activity', 'ticketInfo', { ...formData.activity?.ticketInfo, bookingReference: e.target.value })}
                      className="input"
                      placeholder="Booking reference number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Guide Details
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={formData.activity?.guide?.name || ''}
                      onChange={(e) => updateNestedField('activity', 'guide', { ...formData.activity?.guide, name: e.target.value })}
                      className="input"
                      placeholder="Guide name"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.activity?.guide?.contact || ''}
                      onChange={(e) => updateNestedField('activity', 'guide', { ...formData.activity?.guide, contact: e.target.value })}
                      className="input"
                      placeholder="Guide contact number"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.activity?.guide?.language || ''}
                    onChange={(e) => updateNestedField('activity', 'guide', { ...formData.activity?.guide, language: e.target.value })}
                    className="input"
                    placeholder="Languages spoken (e.g., English, Hindi)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.activity?.notes || ''}
                  onChange={(e) => updateNestedField('activity', 'notes', e.target.value)}
                  className="input"
                  rows="2"
                  placeholder="Any other important information"
                />
              </div>
            </div>
          )}

          {/* Images */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-gray-900">Images</h3>
            <ImageUploader
              images={formData.images || []}
              onChange={(images) => updateField('images', images)}
              maxImages={5}
              type={formData.type}
            />
          </div>

          {/* Cost */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-gray-900">Cost</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.cost?.amount || ''}
                  onChange={(e) => updateNestedField('cost', 'amount', parseFloat(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.cost?.currency || 'INR'}
                  onChange={(e) => updateNestedField('cost', 'currency', e.target.value)}
                  className="input"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {component?._id ? 'Update' : 'Add'} Component
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ComponentModal;
