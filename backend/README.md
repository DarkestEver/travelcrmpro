# Travel CRM Backend API

Backend API for the B2B Travel CRM system built with Node.js, Express, MongoDB, and Redis.

## 🚀 Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- MongoDB 6.0+
- Redis 7.0+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/travel-crm
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Travel CRM
SMTP_FROM_EMAIL=noreply@travelcrm.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

4. Seed the database (optional):
```bash
npm run seed
```

5. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database and configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware (auth, error handling, etc.)
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts (seed, migrations)
│   ├── utils/           # Helper functions
│   ├── validations/     # Request validation schemas
│   └── server.js        # Express app entry point
├── logs/                # Application logs
├── uploads/             # Uploaded files
├── .env.example         # Environment variable template
└── package.json
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register** or **Login** to get access and refresh tokens
2. Include access token in requests: `Authorization: Bearer <token>`
3. Access tokens expire in 7 days
4. Use refresh token endpoint to get new access token

### Default Users (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@travelcrm.com | Admin@123 |
| Operator | operator@travelcrm.com | Operator@123 |
| Agent | agent@travelcrm.com | Agent@123 |
| Supplier | supplier@travelcrm.com | Supplier@123 |

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout (requires auth)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password/:token` - Reset password
- `POST /api/v1/auth/change-password` - Change password (requires auth)
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `PUT /api/v1/auth/me` - Update profile (requires auth)

### Agents
- `GET /api/v1/agents` - Get all agents (admin only)
- `POST /api/v1/agents` - Create agent profile
- `GET /api/v1/agents/:id` - Get agent details
- `PUT /api/v1/agents/:id` - Update agent
- `PATCH /api/v1/agents/:id/approve` - Approve agent (admin only)
- `PATCH /api/v1/agents/:id/suspend` - Suspend agent (admin only)
- `GET /api/v1/agents/:id/stats` - Get agent statistics

### Customers
- `GET /api/v1/customers` - Get all customers (agent sees only theirs)
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id` - Get customer details
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer
- `POST /api/v1/customers/:id/notes` - Add note to customer
- `GET /api/v1/customers/:id/stats` - Get customer statistics
- `POST /api/v1/customers/bulk-import` - Bulk import customers

### Suppliers
- `GET /api/v1/suppliers` - Get all suppliers
- `POST /api/v1/suppliers` - Create supplier profile
- `GET /api/v1/suppliers/:id` - Get supplier details
- `PUT /api/v1/suppliers/:id` - Update supplier
- `PATCH /api/v1/suppliers/:id/approve` - Approve supplier (admin only)
- `PATCH /api/v1/suppliers/:id/rating` - Update supplier rating (admin only)
- `GET /api/v1/suppliers/:id/stats` - Get supplier statistics

### Itineraries
- `GET /api/v1/itineraries` - Get all itineraries
- `GET /api/v1/itineraries/templates` - Get public templates
- `POST /api/v1/itineraries` - Create itinerary
- `GET /api/v1/itineraries/:id` - Get itinerary details
- `PUT /api/v1/itineraries/:id` - Update itinerary
- `DELETE /api/v1/itineraries/:id` - Delete itinerary
- `POST /api/v1/itineraries/:id/duplicate` - Duplicate itinerary
- `PATCH /api/v1/itineraries/:id/archive` - Archive itinerary
- `GET /api/v1/itineraries/:id/calculate-cost` - Calculate cost

### Quotes
- `GET /api/v1/quotes` - Get all quotes
- `POST /api/v1/quotes` - Create quote
- `GET /api/v1/quotes/:id` - Get quote details
- `PUT /api/v1/quotes/:id` - Update quote
- `DELETE /api/v1/quotes/:id` - Delete quote
- `POST /api/v1/quotes/:id/send` - Send quote to customer
- `PATCH /api/v1/quotes/:id/accept` - Accept quote
- `PATCH /api/v1/quotes/:id/reject` - Reject quote
- `GET /api/v1/quotes/stats` - Get quote statistics

### Bookings
- `GET /api/v1/bookings` - Get all bookings
- `POST /api/v1/bookings` - Create booking from quote
- `GET /api/v1/bookings/:id` - Get booking details
- `PUT /api/v1/bookings/:id` - Update booking
- `POST /api/v1/bookings/:id/payment` - Add payment
- `PATCH /api/v1/bookings/:id/confirm` - Confirm booking
- `PATCH /api/v1/bookings/:id/cancel` - Cancel booking
- `PATCH /api/v1/bookings/:id/complete` - Complete booking (admin only)
- `GET /api/v1/bookings/stats` - Get booking statistics

## 🔒 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **super_admin** | Full system access, manage all users and resources |
| **operator** | Manage agents, suppliers, bookings, view all data |
| **agent** | Manage own customers, itineraries, quotes, bookings |
| **supplier** | View assigned bookings, update availability |
| **auditor** | Read-only access to all data for compliance |

## 🗄️ Database Models

### User
- Authentication and profile data
- Roles: super_admin, operator, agent, supplier, auditor
- Password hashing with bcrypt
- JWT token generation

### Agent
- Agency information and contact details
- Credit limit and available credit
- Commission rules and tier (standard, silver, gold, platinum)
- Status: pending, active, suspended, inactive

### Customer
- Agent-scoped customer data
- Passport information and preferences
- Travel history and total spent
- Emergency contacts and documents

### Supplier
- Company information and services
- Service types: hotel, transport, activity, tour, meal
- Rating and performance metrics
- Bank details and contracts

### Itinerary
- Multi-day travel plans
- Nested days and components structure
- Automatic cost calculation
- Template system with visibility control

### Quote
- Auto-generated quote numbers (Q2025-000001)
- Pricing breakdown with markup and discounts
- Status tracking: draft, sent, viewed, accepted, rejected, expired
- Auto-expiration based on validUntil date

### Booking
- Auto-generated booking numbers (B2025-000001)
- Payment tracking with records
- Multiple travelers support
- Supplier confirmation tracking
- Cancellation and refund handling

### AuditLog
- Comprehensive audit trail
- Automatic logging via middleware
- TTL index (2 years retention)
- IP address and user agent tracking

## 🛠️ Middleware

### Authentication (`auth.js`)
- `protect()` - Verify JWT token
- `restrictTo(...roles)` - Role-based authorization
- `loadAgent()` - Load agent profile for agent users
- `loadSupplier()` - Load supplier profile for supplier users
- `checkAgentOwnership()` - Verify resource ownership

### Error Handling (`errorHandler.js`)
- Global error handler with formatted responses
- MongoDB error handling (validation, cast, duplicate key)
- JWT error handling
- Custom AppError class

### Validation (`validator.js`)
- Express-validator integration
- Field-level error messages
- Request validation for all endpoints

### Audit Logging (`auditLogger.js`)
- Automatic logging of all operations
- Non-blocking background logging
- Captures user, action, resource, IP, user agent

## 🔧 Utilities

### Response Helpers (`response.js`)
- `successResponse()` - Standard success format
- `paginatedResponse()` - Paginated data format

### Pagination (`pagination.js`)
- `parsePagination()` - Extract page, limit, skip from request
- `parseSort()` - Extract sort parameters
- `buildSearchQuery()` - Build MongoDB text search query

### Email Service (`email.js`)
- Nodemailer configuration
- Email templates (verification, password reset, quotes, bookings)
- Retry logic and error handling

### Logger (`logger.js`)
- Winston logger configuration
- Console and file transports
- Different log levels (error, warn, info, http, debug)

### File Upload (`fileUpload.js`)
- Multer configuration
- File type validation
- 5MB file size limit

## 📊 Monitoring & Logs

Logs are stored in `backend/logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚢 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong JWT secrets (minimum 32 characters)
3. Configure proper SMTP settings
4. Set up MongoDB authentication
5. Configure Redis password
6. Enable HTTPS
7. Set appropriate CORS origins
8. Configure rate limiting
9. Set up monitoring and logging
10. Regular database backups

### Docker Deployment

```bash
# Build image
docker build -t travel-crm-backend .

# Run container
docker run -p 3000:3000 --env-file .env travel-crm-backend
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run seed` - Seed database with default users

## 🔄 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🤝 Contributing

1. Create a new branch for your feature
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit a pull request

## 📄 License

ISC

## 🆘 Support

For issues and questions, please open an issue in the repository.
