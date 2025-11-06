#!/bin/bash

# 🚀 One-Command Deployment Script for Linux/Mac
# This script deploys Travel CRM in production mode

echo "========================================"
echo "  Travel CRM - Production Deployment   "
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Docker is installed
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose found${NC}"
echo ""

# Check environment files
echo -e "${YELLOW}Checking environment configuration...${NC}"

NEEDS_CONFIG=false

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found. Creating from example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${RED}⚠️  IMPORTANT: Edit backend/.env with production values!${NC}"
    NEEDS_CONFIG=true
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env not found. Creating from example...${NC}"
    cp frontend/.env.example frontend/.env
    echo -e "${RED}⚠️  IMPORTANT: Edit frontend/.env with production values!${NC}"
    NEEDS_CONFIG=true
fi

if [ "$NEEDS_CONFIG" = true ]; then
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  CONFIGURATION REQUIRED${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Please configure the following files:${NC}"
    echo "1. backend/.env - Set JWT secrets, SMTP credentials, etc."
    echo "2. frontend/.env - Set API URL"
    echo ""
    read -p "Continue with current configuration? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled. Please configure .env files and run again.${NC}"
        exit 0
    fi
fi

echo -e "${GREEN}✅ Environment files present${NC}"
echo ""

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down > /dev/null 2>&1
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# Pull latest images
echo -e "${YELLOW}Pulling base images...${NC}"
docker-compose pull
echo ""

# Build images
echo -e "${YELLOW}Building application images...${NC}"
docker-compose build --no-cache
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Images built successfully${NC}"
echo ""

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"

MONGO_READY=false
REDIS_READY=false
BACKEND_READY=false
FRONTEND_READY=false

for i in {1..30}; do
    # Check MongoDB
    if [ "$MONGO_READY" = false ]; then
        if docker-compose ps mongodb | grep -q "running"; then
            MONGO_READY=true
            echo -e "${GREEN}✅ MongoDB is ready${NC}"
        fi
    fi

    # Check Redis
    if [ "$REDIS_READY" = false ]; then
        if docker-compose ps redis | grep -q "running"; then
            REDIS_READY=true
            echo -e "${GREEN}✅ Redis is ready${NC}"
        fi
    fi

    # Check Backend
    if [ "$BACKEND_READY" = false ]; then
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health 2>/dev/null | grep -q "200"; then
            BACKEND_READY=true
            echo -e "${GREEN}✅ Backend API is ready${NC}"
        fi
    fi

    # Check Frontend
    if [ "$FRONTEND_READY" = false ]; then
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null | grep -q "200"; then
            FRONTEND_READY=true
            echo -e "${GREEN}✅ Frontend is ready${NC}"
        fi
    fi

    if [ "$MONGO_READY" = true ] && [ "$REDIS_READY" = true ] && [ "$BACKEND_READY" = true ] && [ "$FRONTEND_READY" = true ]; then
        break
    fi

    sleep 2
done

echo ""

# Run database seed
echo -e "${YELLOW}Seeding database...${NC}"
docker-compose exec -T backend npm run seed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Database seeding failed (may already be seeded)${NC}"
fi
echo ""

# Display deployment summary
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete! 🎉${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo "📱 Frontend:      http://localhost:5173"
echo "🔌 Backend API:   http://localhost:3000"
echo "💚 Health Check:  http://localhost:3000/api/v1/health"
echo ""
echo -e "${YELLOW}Default Login Credentials:${NC}"
echo "  Email:    admin@travelcrm.com"
echo "  Password: Admin@123"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change default passwords in production!${NC}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View logs:    docker-compose logs -f"
echo "  Stop:         docker-compose down"
echo "  Restart:      docker-compose restart"
echo "  Status:       docker-compose ps"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "  Setup Guide:  SETUP.md"
echo "  Production:   PRODUCTION-READY.md"
echo "  Quick Ref:    QUICK-REFERENCE.md"
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo -e "${CYAN}========================================${NC}"
