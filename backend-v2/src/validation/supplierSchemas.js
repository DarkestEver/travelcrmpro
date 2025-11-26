const Joi = require('joi');

const createSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  type: Joi.string()
    .valid('hotel', 'airline', 'transport', 'activity', 'restaurant', 'guide', 'other')
    .required(),
  status: Joi.string().valid('active', 'inactive', 'blacklisted').default('active'),
  contact: Joi.object({
    name: Joi.string().max(100),
    email: Joi.string().email().required(),
    phone: Joi.string().max(20),
    mobile: Joi.string().max(20),
    website: Joi.string().uri(),
  }),
  address: Joi.object({
    street: Joi.string().max(200),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    country: Joi.string().max(100),
    postalCode: Joi.string().max(20),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90),
      lng: Joi.number().min(-180).max(180),
    }),
  }),
  services: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string(),
      pricing: Joi.object({
        amount: Joi.number().min(0),
        currency: Joi.string().length(3).uppercase(),
        unit: Joi.string(),
      }),
      availability: Joi.string().valid('available', 'limited', 'unavailable'),
    })
  ),
  paymentTerms: Joi.object({
    method: Joi.string().valid('cash', 'bank_transfer', 'credit_card', 'cheque'),
    creditDays: Joi.number().min(0).max(365),
    currency: Joi.string().length(3).uppercase(),
    taxId: Joi.string(),
  }),
  notes: Joi.string().max(2000),
  tags: Joi.array().items(Joi.string().max(50)),
});

const updateSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  type: Joi.string().valid(
    'hotel',
    'airline',
    'transport',
    'activity',
    'restaurant',
    'guide',
    'other'
  ),
  status: Joi.string().valid('active', 'inactive', 'blacklisted'),
  contact: Joi.object({
    name: Joi.string().max(100),
    email: Joi.string().email(),
    phone: Joi.string().max(20),
    mobile: Joi.string().max(20),
    website: Joi.string().uri(),
  }),
  address: Joi.object({
    street: Joi.string().max(200),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    country: Joi.string().max(100),
    postalCode: Joi.string().max(20),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90),
      lng: Joi.number().min(-180).max(180),
    }),
  }),
  services: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string(),
      pricing: Joi.object({
        amount: Joi.number().min(0),
        currency: Joi.string().length(3).uppercase(),
        unit: Joi.string(),
      }),
      availability: Joi.string().valid('available', 'limited', 'unavailable'),
    })
  ),
  paymentTerms: Joi.object({
    method: Joi.string().valid('cash', 'bank_transfer', 'credit_card', 'cheque'),
    creditDays: Joi.number().min(0).max(365),
    currency: Joi.string().length(3).uppercase(),
    taxId: Joi.string(),
  }),
  notes: Joi.string().max(2000),
  tags: Joi.array().items(Joi.string().max(50)),
}).min(1);

const updateRatingSchema = Joi.object({
  quality: Joi.number().min(0).max(5),
  service: Joi.number().min(0).max(5),
  value: Joi.number().min(0).max(5),
}).min(1);

const addDocumentSchema = Joi.object({
  name: Joi.string().max(200).required(),
  type: Joi.string()
    .valid('contract', 'license', 'insurance', 'certification', 'other')
    .required(),
  url: Joi.string().uri(),
  expiryDate: Joi.date(),
  notes: Joi.string().max(500),
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
  updateRatingSchema,
  addDocumentSchema,
};
