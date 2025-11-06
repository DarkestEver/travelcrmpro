# Quick Reference - Travel CRM

## 🚀 Start Commands

### Docker (All Services)
```powershell
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # View logs
docker-compose ps             # Check status
```

### Manual Development
```powershell
# Backend
cd backend
npm install
npm run seed
npm run dev                   # Runs on :3000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                   # Runs on :5173
```

## 🔐 Default Logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@travelcrm.com | Admin@123 |
| Operator | operator@travelcrm.com | Operator@123 |
| Agent | agent@travelcrm.com | Agent@123 |

## 🌐 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/api/v1/health
- **MongoDB**: mongodb://localhost:27017/travel-crm
- **Redis**: localhost:6379

## 📁 Key Files

### Configuration
- `backend/.env` - Backend environment variables
- `frontend/.env` - Frontend environment variables
- `docker-compose.yml` - Docker services configuration

### Documentation
- `README.md` - Main project overview
- `SETUP.md` - Complete setup guide
- `PROJECT-STATUS.md` - Completion summary
- `docs/01-PHASE-A-MVP.md` - Phase A details

### Entry Points
- `backend/src/server.js` - Backend entry point
- `frontend/src/main.jsx` - Frontend entry point

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
```
POST /auth/login              # Login
POST /auth/register           # Register
POST /auth/logout             # Logout
GET  /auth/me                 # Current user
```

### Resources
```
GET    /agents                # List agents
POST   /agents                # Create agent
GET    /agents/:id            # Get agent
PUT    /agents/:id            # Update agent
DELETE /agents/:id            # Delete agent

# Same pattern for:
# /customers, /suppliers, /itineraries, /quotes, /bookings
```

## 🔧 Common Commands

### Backend
```powershell
npm install                   # Install dependencies
npm run dev                   # Development server
npm start                     # Production server
npm test                      # Run tests
npm run seed                  # Seed database
```

### Frontend
```powershell
npm install                   # Install dependencies
npm run dev                   # Development server
npm run build                 # Production build
npm run preview               # Preview build
npm run lint                  # Lint code
```

### Database
```powershell
# MongoDB
mongosh mongodb://localhost:27017/travel-crm

# Common queries
db.users.find().pretty()
db.agents.countDocuments()
db.bookings.find({status: "confirmed"})

# Redis
redis-cli
KEYS *
GET user:*
```

## 🐛 Troubleshooting

### Port in Use
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### MongoDB Not Running
```powershell
# Windows
net start MongoDB

# Docker
docker-compose up -d mongodb
```

### Clear Everything
```powershell
# Stop all
docker-compose down -v

# Remove all containers
docker system prune -a
```

### Reset Database
```powershell
cd backend
npm run seed
```

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/travel-crm
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-key-min-32-chars
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 🔐 Authentication Flow

1. Login → Get access + refresh tokens
2. Store tokens in localStorage (Zustand)
3. Include access token in API requests
4. On 401 error → Use refresh token
5. Get new access token
6. Retry original request
7. On refresh failure → Logout

## 📊 Database Models

| Model | Auto-Number | Key Fields |
|-------|-------------|------------|
| User | - | email, password, role |
| Agent | - | agencyName, creditLimit, tier |
| Customer | - | name, email, agentId |
| Supplier | - | companyName, serviceTypes |
| Itinerary | - | title, days[], estimatedCost |
| Quote | Q2025-000001 | quoteNumber, pricing, status |
| Booking | B2025-000001 | bookingNumber, financial, travelers |

## 🎨 UI Components

### Tailwind Classes
```jsx
className="card"              // White card with shadow
className="btn btn-primary"   // Primary button
className="btn-secondary"     // Secondary button
className="btn-danger"        // Delete button
className="input"             // Text input
className="label"             // Form label
className="badge badge-success" // Success badge
```

### Icons
```jsx
import { FiHome, FiUsers, FiCalendar } from 'react-icons/fi'
```

## 🚢 Deployment

### Build Production
```powershell
# Backend
cd backend
$env:NODE_ENV="production"
npm start

# Frontend
cd frontend
npm run build
# Deploy dist/ folder
```

### Docker Production
```powershell
docker-compose up -d --build
```

## 📖 Documentation

| File | Purpose |
|------|---------|
| README.md | Project overview |
| SETUP.md | Complete setup guide |
| PROJECT-STATUS.md | What's been built |
| backend/README.md | Backend API docs |
| frontend/README.md | Frontend docs |
| docs/ARCHITECTURE.md | System architecture |

## 🆘 Getting Help

1. Check SETUP.md troubleshooting section
2. Review logs: `backend/logs/error.log`
3. Check browser console for frontend errors
4. Verify all services running: `docker-compose ps`
5. Test API health: http://localhost:3000/api/v1/health

## 🎯 Quick Test

```powershell
# Test backend
curl http://localhost:3000/api/v1/health

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@travelcrm.com","password":"Admin@123"}'

# Test frontend
# Just open http://localhost:5173
```

## 📞 Support

- Documentation: `/docs` folder
- API Reference: `backend/README.md`
- Setup Guide: `SETUP.md`
- Project Status: `PROJECT-STATUS.md`

---

**🎉 You're all set! Happy coding!**
