# Travel CRM - Complete Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 20 LTS or higher
- **MongoDB** 6.0+ (or use Docker)
- **Redis** 7.0+ (or use Docker)
- **npm** or **yarn**
- **Git**

## 🚀 Quick Start (3 Options)

### Option 1: Full Docker Setup (Easiest)

1. **Clone the repository**
```powershell
git clone <repository-url>
cd Travel-crm
```

2. **Start all services**
```powershell
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MongoDB: mongodb://localhost:27017
- Redis: localhost:6379

4. **Seed the database** (optional)
```powershell
docker exec -it travel-crm-backend npm run seed
```

### Option 2: Local Development Setup

#### Backend Setup

1. **Navigate to backend directory**
```powershell
cd backend
```

2. **Install dependencies**
```powershell
npm install
```

3. **Create environment file**
```powershell
copy .env.example .env
```

4. **Configure .env file**
Edit `.env` with your settings:
```env
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/travel-crm
REDIS_URL=redis://localhost:6379

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM_NAME=Travel CRM
SMTP_FROM_EMAIL=noreply@travelcrm.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

5. **Seed database with demo data**
```powershell
npm run seed
```

6. **Start development server**
```powershell
npm run dev
```

Backend will run on **http://localhost:3000**

#### Frontend Setup

1. **Open new terminal and navigate to frontend**
```powershell
cd frontend
```

2. **Install dependencies**
```powershell
npm install
```

3. **Create environment file**
```powershell
copy .env.example .env
```

4. **Configure .env file**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

5. **Start development server**
```powershell
npm run dev
```

Frontend will run on **http://localhost:5173**

### Option 3: Hybrid Setup (Docker DB + Local Code)

1. **Start only databases with Docker**
```powershell
docker-compose up -d mongodb redis
```

2. **Follow "Option 2" steps** for backend and frontend

## 🔐 Default Login Credentials

After running `npm run seed`, you can login with:

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | admin@travelcrm.com | Admin@123 |
| **Operator** | operator@travelcrm.com | Operator@123 |
| **Agent** | agent@travelcrm.com | Agent@123 |
| **Supplier** | supplier@travelcrm.com | Supplier@123 |

## 📧 Email Configuration (Gmail)

To enable email notifications:

1. **Enable 2-Factor Authentication** in your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
3. **Update .env**:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<16-character-app-password>
```

## ✅ Verify Installation

### Backend Health Check
```powershell
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Database Connection
Check MongoDB connection in backend logs:
```
✅ MongoDB connected successfully
✅ Redis connected successfully
```

### Frontend Connection
Open http://localhost:5173 - you should see the login page.

## 🛠️ Development Workflow

### Backend Development
```powershell
cd backend
npm run dev     # Start with hot reload (nodemon)
npm test        # Run tests
npm run seed    # Reseed database
```

### Frontend Development
```powershell
cd frontend
npm run dev     # Start Vite dev server
npm run build   # Production build
npm run preview # Preview production build
npm run lint    # Lint code
```

### View Logs
```powershell
# Backend logs
cd backend
dir logs

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔍 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running
```powershell
# Check if MongoDB service is running
net start MongoDB

# Or start with Docker
docker-compose up -d mongodb
```

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Ensure Redis is running
```powershell
# Start with Docker
docker-compose up -d redis
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Kill the process using the port
```powershell
# Find process
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Frontend Can't Connect to Backend
**Solution**: Check CORS settings
1. Ensure backend `.env` has correct `FRONTEND_URL`
2. Check frontend `.env` has correct `VITE_API_URL`
3. Verify both servers are running

### Email Not Sending
**Solution**: 
1. Verify Gmail app password is correct
2. Check SMTP settings in `.env`
3. Enable "Less secure app access" if needed (not recommended)
4. Check backend logs for email errors

## 📊 Database Management

### MongoDB Commands
```powershell
# Connect to MongoDB
mongosh mongodb://localhost:27017/travel-crm

# List all collections
show collections

# Count documents
db.users.countDocuments()
db.agents.countDocuments()
db.bookings.countDocuments()

# Find all users
db.users.find().pretty()

# Drop database (careful!)
use travel-crm
db.dropDatabase()
```

### Redis Commands
```powershell
# Connect to Redis
redis-cli

# List all keys
KEYS *

# Get user data
GET user:<user-id>

# Clear all data (careful!)
FLUSHALL
```

### Reseed Database
```powershell
cd backend
npm run seed
```

## 🚢 Production Deployment

### Environment Variables Checklist
- [ ] Change JWT_SECRET and JWT_REFRESH_SECRET (32+ characters)
- [ ] Set NODE_ENV=production
- [ ] Configure production MongoDB URI
- [ ] Set up Redis password
- [ ] Update FRONTEND_URL to production domain
- [ ] Configure SMTP with production email service
- [ ] Enable HTTPS
- [ ] Set up CORS for production domain

### Build for Production

#### Backend
```powershell
cd backend
# Set production environment
$env:NODE_ENV="production"
npm start
```

#### Frontend
```powershell
cd frontend
npm run build
# Serve dist folder with nginx or similar
```

### Docker Production
```powershell
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## 📖 API Testing

### Using curl (PowerShell)
```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
  -Method POST `
  -Body (@{email="admin@travelcrm.com"; password="Admin@123"} | ConvertTo-Json) `
  -ContentType "application/json"

$token = $response.data.accessToken

# Get current user
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/me" `
  -Method GET `
  -Headers @{Authorization="Bearer $token"}
```

### Using Postman
1. Import API collection (create one if needed)
2. Set environment variable `{{baseUrl}}` = `http://localhost:3000/api/v1`
3. Login to get access token
4. Set `{{token}}` variable
5. Use `Bearer {{token}}` in Authorization header

## 🧪 Testing

### Backend Tests
```powershell
cd backend
npm test
```

### Frontend Tests
```powershell
cd frontend
npm test
```

## 📚 Additional Resources

- **Backend API Documentation**: [backend/README.md](backend/README.md)
- **Frontend Documentation**: [frontend/README.md](frontend/README.md)
- **Project Documentation**: [docs/](docs/)
- **Phase A MVP Plan**: [docs/01-PHASE-A-MVP.md](docs/01-PHASE-A-MVP.md)
- **Architecture Overview**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 🆘 Getting Help

1. Check the **Troubleshooting** section above
2. Review logs in `backend/logs/`
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Ensure all services (MongoDB, Redis) are running
6. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

## 🎯 Next Steps

After successful setup:

1. **Explore the Dashboard** - Login and check statistics
2. **Create a Customer** - Add your first test customer
3. **Build an Itinerary** - Create a multi-day travel plan
4. **Generate a Quote** - Create and send a quote
5. **Make a Booking** - Convert a quote to booking
6. **Review Documentation** - Read through `/docs` for detailed features

## 📝 Development Notes

### Hot Reload
- Backend: Uses `nodemon` for automatic restart
- Frontend: Uses Vite HMR for instant updates

### Code Style
- Backend: Uses ESLint with Express best practices
- Frontend: Uses ESLint with React hooks rules

### Git Workflow
```powershell
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"

# Push to remote
git push origin feature/my-feature
```

---

**🎉 Congratulations! Your Travel CRM is now running!**

For any questions or issues, please refer to the documentation or open an issue.
