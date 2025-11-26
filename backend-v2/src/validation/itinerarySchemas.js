const Joi = require('joi');

// Activity schema
const activitySchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(200),
  description: Joi.string().allow('').max(1000),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: Joi.number().min(0).max(1440),
  type: Joi.string().valid('sightseeing', 'adventure', 'cultural', 'leisure', 'dining', 'transport', 'other'),
  location: Joi.object({
    name: Joi.string().max(200),
    address: Joi.string().max(500),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
    }),
  }),
  cost: Joi.object({
    amount: Joi.number().min(0),
    currency: Joi.string().length(3),
    includedInPackage: Joi.boolean(),
  }),
  supplier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  notes: Joi.string().max(1000),
  images: Joi.array().items(Joi.string().uri()),
});

// Accommodation schema
const accommodationSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(200),
  type: Joi.string().valid('hotel', 'resort', 'guesthouse', 'apartment', 'hostel', 'villa', 'other'),
  checkIn: Joi.date(),
  checkOut: Joi.date(),
  roomType: Joi.string().max(100),
  numberOfRooms: Joi.number().min(1).max(50),
  address: Joi.string().max(500),
  rating: Joi.number().min(0).max(5),
  amenities: Joi.array().items(Joi.string().max(100)),
  cost: Joi.object({
    amount: Joi.number().required().min(0),
    currency: Joi.string().length(3),
    perNight: Joi.boolean(),
    includedInPackage: Joi.boolean(),
  }).required(),
  supplier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  confirmationNumber: Joi.string().max(100),
  notes: Joi.string().max(1000),
  images: Joi.array().items(Joi.string().uri()),
});

// Transport schema
const transportSchema = Joi.object({
  type: Joi.string().required().valid('flight', 'train', 'bus', 'car', 'boat', 'taxi', 'transfer', 'other'),
  from: Joi.string().required().trim().min(1).max(200),
  to: Joi.string().required().trim().min(1).max(200),
  departureTime: Joi.date(),
  arrivalTime: Joi.date(),
  duration: Joi.number().min(0),
  provider: Joi.string().max(200),
  flightNumber: Joi.string().max(50),
  trainNumber: Joi.string().max(50),
  class: Joi.string().max(50),
  cost: Joi.object({
    amount: Joi.number().min(0),
    currency: Joi.string().length(3),
    includedInPackage: Joi.boolean(),
  }),
  supplier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  bookingReference: Joi.string().max(100),
  notes: Joi.string().max(1000),
});

// Meal schema
const mealSchema = Joi.object({
  type: Joi.string().required().valid('breakfast', 'lunch', 'dinner', 'snack'),
  venue: Joi.string().max(200),
  time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  cost: Joi.object({
    amount: Joi.number().min(0),
    currency: Joi.string().length(3),
    includedInPackage: Joi.boolean(),
  }),
  notes: Joi.string().max(500),
});

// Day schema
const daySchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(200),
  description: Joi.string().allow('').max(2000),
  destination: Joi.string().max(200),
  date: Joi.date(),
  activities: Joi.array().items(activitySchema),
  accommodation: accommodationSchema,
  transport: Joi.array().items(transportSchema),
  meals: Joi.array().items(mealSchema),
  notes: Joi.string().max(2000),
  images: Joi.array().items(Joi.string().uri()),
});

// Create itinerary schema
const createItinerarySchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(200),
  description: Joi.string().allow('').max(2000),
  destination: Joi.string().required().trim().min(1).max(200),
  startDate: Joi.date().required(),
  endDate: Joi.date().required().greater(Joi.ref('startDate')),
  duration: Joi.number().min(1).max(365),
  numberOfTravelers: Joi.object({
    adults: Joi.number().min(0).max(50),
    children: Joi.number().min(0).max(50),
    infants: Joi.number().min(0).max(50),
  }),
  days: Joi.array().items(daySchema),
  pricing: Joi.object({
    basePrice: Joi.number().min(0),
    currency: Joi.string().length(3),
    taxes: Joi.number().min(0),
    discount: Joi.number().min(0),
    totalPrice: Joi.number().min(0),
    pricePerPerson: Joi.number().min(0),
    breakdown: Joi.object({
      accommodation: Joi.number().min(0),
      transport: Joi.number().min(0),
      activities: Joi.number().min(0),
      meals: Joi.number().min(0),
      other: Joi.number().min(0),
    }),
  }),
  status: Joi.string().valid('draft', 'pending-review', 'approved', 'sent-to-client', 'accepted', 'rejected', 'archived'),
  tags: Joi.array().items(Joi.string().max(50)),
  isTemplate: Joi.boolean(),
  templateName: Joi.string().max(200),
  lead: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  booking: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  internalNotes: Joi.string().max(5000),
  clientNotes: Joi.string().max(5000),
});

// Update itinerary schema
const updateItinerarySchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().allow('').max(2000),
  destination: Joi.string().trim().min(1).max(200),
  startDate: Joi.date(),
  endDate: Joi.date(),
  duration: Joi.number().min(1).max(365),
  numberOfTravelers: Joi.object({
    adults: Joi.number().min(0).max(50),
    children: Joi.number().min(0).max(50),
    infants: Joi.number().min(0).max(50),
  }),
  days: Joi.array().items(daySchema),
  pricing: Joi.object({
    basePrice: Joi.number().min(0),
    currency: Joi.string().length(3),
    taxes: Joi.number().min(0),
    discount: Joi.number().min(0),
    totalPrice: Joi.number().min(0),
    pricePerPerson: Joi.number().min(0),
    breakdown: Joi.object({
      accommodation: Joi.number().min(0),
      transport: Joi.number().min(0),
      activities: Joi.number().min(0),
      meals: Joi.number().min(0),
      other: Joi.number().min(0),
    }),
  }),
  status: Joi.string().valid('draft', 'pending-review', 'approved', 'sent-to-client', 'accepted', 'rejected', 'archived'),
  tags: Joi.array().items(Joi.string().max(50)),
  isTemplate: Joi.boolean(),
  templateName: Joi.string().max(200),
  internalNotes: Joi.string().max(5000),
  clientNotes: Joi.string().max(5000),
}).min(1);

// Add day schema
const addDaySchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(200),
  description: Joi.string().allow('').max(2000),
  destination: Joi.string().max(200),
  date: Joi.date(),
  activities: Joi.array().items(activitySchema),
  accommodation: accommodationSchema,
  transport: Joi.array().items(transportSchema),
  meals: Joi.array().items(mealSchema),
  notes: Joi.string().max(2000),
  images: Joi.array().items(Joi.string().uri()),
});

// Update day schema
const updateDaySchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().allow('').max(2000),
  destination: Joi.string().max(200),
  date: Joi.date(),
  activities: Joi.array().items(activitySchema),
  accommodation: accommodationSchema,
  transport: Joi.array().items(transportSchema),
  meals: Joi.array().items(mealSchema),
  notes: Joi.string().max(2000),
  images: Joi.array().items(Joi.string().uri()),
}).min(1);

// Clone itinerary schema
const cloneItinerarySchema = Joi.object({
  templateName: Joi.string().max(200),
  asTemplate: Joi.boolean(),
});

// Send to client schema
const sendToClientSchema = Joi.object({
  clientEmail: Joi.string().required().email(),
});

module.exports = {
  createItinerarySchema,
  updateItinerarySchema,
  addDaySchema,
  updateDaySchema,
  cloneItinerarySchema,
  sendToClientSchema,
};
