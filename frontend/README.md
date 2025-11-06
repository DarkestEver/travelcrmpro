# Travel CRM Frontend

Modern React frontend for the B2B Travel CRM system built with Vite, React Router, Zustand, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── layouts/     # Layout components
│   │   ├── Sidebar.jsx  # Navigation sidebar
│   │   └── Header.jsx   # Top header bar
│   ├── pages/           # Page components
│   │   ├── auth/        # Authentication pages
│   │   ├── Dashboard.jsx
│   │   ├── Agents.jsx
│   │   ├── Customers.jsx
│   │   └── ...
│   ├── services/        # API services
│   │   ├── api.js       # Axios instance
│   │   └── apiEndpoints.js  # API endpoint functions
│   ├── stores/          # Zustand state stores
│   │   └── authStore.js # Authentication state
│   ├── App.jsx          # Main app component with routes
│   ├── main.jsx         # App entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── package.json
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite 5** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Zustand** - State management
- **React Query (TanStack Query)** - Server state management
- **Axios** - HTTP client
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Hook Form** - Form handling
- **React Hot Toast** - Toast notifications
- **React Icons** - Icon library
- **date-fns** - Date utilities

## 🔐 Authentication

The app uses JWT-based authentication with automatic token refresh:

1. Login with credentials
2. Access and refresh tokens stored in localStorage (via Zustand persist)
3. Tokens automatically included in API requests
4. Automatic token refresh on 401 errors
5. Automatic logout on refresh failure

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@travelcrm.com | Admin@123 |
| Operator | operator@travelcrm.com | Operator@123 |
| Agent | agent@travelcrm.com | Agent@123 |

## 📱 Pages

### Dashboard
- Overview statistics (bookings, revenue, quotes)
- Booking status breakdown
- Quote conversion metrics
- Quick action buttons

### Agents (Admin/Operator only)
- List all travel agents
- Approve/suspend agents
- View agent statistics
- Manage credit limits

### Customers (Agent/Admin/Operator)
- Customer list (agents see only their customers)
- Add/edit/delete customers
- Customer notes and documents
- Bulk import functionality

### Suppliers
- Supplier directory
- Service types and availability
- Rating and performance metrics
- Approve/manage suppliers

### Itineraries
- Create multi-day travel plans
- Template library
- Duplicate and customize itineraries
- Automatic cost calculation

### Quotes
- Generate quotes from itineraries
- Send quotes to customers
- Track quote status (draft, sent, viewed, accepted, rejected)
- Conversion analytics

### Bookings
- Create bookings from accepted quotes
- Payment tracking
- Traveler management
- Confirmation and voucher generation

## 🎨 Styling

The app uses Tailwind CSS with custom utility classes:

```css
/* Cards */
.card - White background card with shadow

/* Buttons */
.btn - Base button styles
.btn-primary - Primary action button
.btn-secondary - Secondary button
.btn-danger - Danger/delete button

/* Form inputs */
.input - Text input styling
.label - Form label styling

/* Badges */
.badge - Base badge styling
.badge-success - Green badge
.badge-warning - Yellow badge
.badge-danger - Red badge
.badge-info - Blue badge
```

## 🔄 State Management

### Authentication State (Zustand)
```javascript
import { useAuthStore } from './stores/authStore'

const { user, accessToken, logout, hasRole } = useAuthStore()
```

### Server State (React Query)
```javascript
import { useQuery, useMutation } from '@tanstack/react-query'
import { customersAPI } from './services/apiEndpoints'

const { data, isLoading, error } = useQuery({
  queryKey: ['customers'],
  queryFn: () => customersAPI.getAll(),
})
```

## 🌐 API Integration

All API calls go through the centralized `api.js` service:

```javascript
import { customersAPI } from './services/apiEndpoints'

// Get all customers
const customers = await customersAPI.getAll({ page: 1, limit: 10 })

// Create customer
const newCustomer = await customersAPI.create(customerData)

// Update customer
await customersAPI.update(id, updatedData)
```

Automatic features:
- Token injection in headers
- Token refresh on 401
- Error toast notifications
- Response data extraction

## 🚀 Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

Build output will be in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 📦 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API base URL | http://localhost:3000/api/v1 |

## 🎯 Features

### Implemented
- ✅ JWT authentication with auto-refresh
- ✅ Protected routes with role-based access
- ✅ Responsive sidebar navigation
- ✅ Dashboard with statistics
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling
- ✅ Axios interceptors
- ✅ Persistent auth state

### Coming Soon
- 🔄 Full CRUD for all entities
- 🔄 Advanced filtering and search
- 🔄 Data tables with sorting/pagination
- 🔄 Form validation with React Hook Form
- 🔄 Modal dialogs
- 🔄 File uploads
- 🔄 PDF generation (quotes/bookings)
- 🔄 Real-time notifications
- 🔄 Dark mode
- 🔄 Multi-language support

## 🛡️ Security

- Tokens stored in localStorage (consider httpOnly cookies for production)
- Automatic logout on token expiration
- Protected routes with authentication checks
- Role-based access control
- XSS protection via React's built-in escaping

## 📄 License

ISC

## 🆘 Support

For issues and questions, please open an issue in the repository.
