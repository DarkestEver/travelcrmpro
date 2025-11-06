const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Travel CRM API Documentation',
      version: '1.0.0',
      description: 'B2B Travel CRM Backend API - Complete REST API documentation',
      contact: {
        name: 'API Support',
        email: 'support@travelcrm.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.travelcrm.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'operator', 'agent'],
              example: 'agent',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            emailVerified: {
              type: 'boolean',
              example: true,
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            company: {
              type: 'string',
            },
            country: {
              type: 'string',
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            bookingNumber: {
              type: 'string',
              example: 'BK-2024-001',
            },
            customer: {
              type: 'string',
            },
            itinerary: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            },
            totalAmount: {
              type: 'number',
              example: 5000,
            },
            paidAmount: {
              type: 'number',
              example: 2500,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Agents',
        description: 'Agent management operations',
      },
      {
        name: 'Customers',
        description: 'Customer management operations',
      },
      {
        name: 'Suppliers',
        description: 'Supplier management operations',
      },
      {
        name: 'Itineraries',
        description: 'Itinerary creation and management',
      },
      {
        name: 'Quotes',
        description: 'Quote generation and tracking',
      },
      {
        name: 'Bookings',
        description: 'Booking management and payments',
      },
      {
        name: 'Analytics',
        description: 'Reports and analytics',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  // Swagger JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Travel CRM API Documentation',
    })
  );

  console.log('📚 Swagger documentation available at http://localhost:5000/api-docs');
};

module.exports = setupSwagger;
