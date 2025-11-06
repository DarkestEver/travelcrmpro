# Travel CRM - Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Travel CRM to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Server Requirements](#server-requirements)
3. [Deployment Methods](#deployment-methods)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [SSL/TLS Certificate](#ssltls-certificate)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [Post-Deployment](#post-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

- [ ] All environment variables configured (.env.production)
- [ ] SSL certificate obtained and configured
- [ ] Database backup strategy implemented
- [ ] Monitoring tools configured (optional)
- [ ] Domain name configured and DNS updated
- [ ] Email service (SMTP) configured and tested
- [ ] Payment gateways tested (Stripe/PayPal)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured (Sentry/optional)

---

## Server Requirements

### Minimum Requirements

- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 50 GB SSD
- **OS:** Ubuntu 20.04 LTS or later
- **Network:** Public IP address

### Recommended for Production

- **CPU:** 4+ cores
- **RAM:** 8+ GB
- **Storage:** 100+ GB SSD
- **OS:** Ubuntu 22.04 LTS
- **Network:** Load balancer, CDN (optional)

### Software Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Node.js (optional, for local builds)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB tools (for backups)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-database-tools
```

---

## Deployment Methods

### Method 1: Docker Compose (Recommended)

#### 1. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/your-org/travel-crm.git
cd travel-crm
```

#### 2. Configure Environment

```bash
# Backend environment
cp backend/.env.example backend/.env
nano backend/.env

# Frontend environment  
cp frontend/.env.example frontend/.env
nano frontend/.env

# Docker environment
cp .env.example .env
nano .env
```

**Required variables in .env:**

```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password
MONGO_DB=travel-crm

# Redis
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_key

# Frontend
FRONTEND_URL=https://your-domain.com
VITE_API_URL=https://your-domain.com/api
VITE_SOCKET_URL=https://your-domain.com
```

#### 3. Build and Deploy

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 4. Verify Deployment

```bash
# Check running containers
docker-compose -f docker-compose.prod.yml ps

# Test backend health
curl http://localhost:5000/health

# Test frontend
curl http://localhost
```

### Method 2: PM2 (Node.js Process Manager)

#### 1. Install PM2

```bash
sudo npm install -g pm2
```

#### 2. Setup Backend

```bash
cd backend
npm install --production
cp .env.example .env
nano .env

# Start with PM2
pm2 start server.js --name travel-crm-backend
pm2 save
pm2 startup
```

#### 3. Setup Frontend

```bash
cd frontend
npm install
npm run build

# Serve with nginx or PM2
pm2 serve dist 3000 --spa --name travel-crm-frontend
```

#### 4. Setup Nginx Reverse Proxy

```bash
sudo apt install nginx -y

# Create nginx configuration
sudo nano /etc/nginx/sites-available/travel-crm
```

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/travel-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Configuration

### 1. Environment Variables

**Backend (.env):**

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://username:password@mongodb:27017/travel-crm
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
FRONTEND_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password
STRIPE_SECRET_KEY=sk_live_...
LOG_LEVEL=error
ENABLE_SWAGGER=false
```

**Frontend (.env):**

```env
VITE_API_URL=https://your-domain.com/api
VITE_SOCKET_URL=https://your-domain.com
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_DEBUG=false
```

### 2. Security Configuration

```bash
# Enable firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Configure fail2ban (optional)
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Database Setup

### Option 1: MongoDB in Docker (Included in docker-compose.prod.yml)

Already configured. Just ensure strong passwords in .env

### Option 2: MongoDB Atlas (Cloud)

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGO_URI in .env:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/travel-crm?retryWrites=true&w=majority
```

### Option 3: Self-Hosted MongoDB

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "your_secure_password",
  roles: ["root"]
})
exit

# Enable authentication
sudo nano /etc/mongod.conf
```

Add:
```yaml
security:
  authorization: enabled
```

```bash
sudo systemctl restart mongod
```

---

## SSL/TLS Certificate

### Option 1: Let's Encrypt (Free, Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

### Option 2: Custom Certificate

```bash
# Place certificate files
sudo mkdir -p /etc/nginx/ssl
sudo cp your-cert.crt /etc/nginx/ssl/
sudo cp your-key.key /etc/nginx/ssl/

# Update nginx configuration
sudo nano /etc/nginx/sites-available/travel-crm
```

Add:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/your-cert.crt;
    ssl_certificate_key /etc/nginx/ssl/your-key.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

---

## Monitoring & Logging

### 1. Application Logs

```bash
# Docker logs
docker-compose -f docker-compose.prod.yml logs -f backend

# PM2 logs
pm2 logs travel-crm-backend

# View log files
tail -f backend/logs/error.log
tail -f backend/logs/combined.log
```

### 2. System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor resources
htop

# Monitor disk usage
df -h
du -sh /opt/travel-crm/*
```

### 3. Setup Logrotate

```bash
sudo nano /etc/logrotate.d/travel-crm
```

Add:
```
/opt/travel-crm/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 www-data www-data
}
```

---

## Backup Strategy

### 1. Automated Database Backups

```bash
# Make backup script executable
chmod +x scripts/backup.sh

# Test backup
./scripts/backup.sh

# Schedule with cron
crontab -e
```

Add:
```
# Daily backup at 2 AM
0 2 * * * /opt/travel-crm/scripts/backup.sh >> /var/log/mongodb-backup.log 2>&1

# Weekly backup on Sunday
0 3 * * 0 /opt/travel-crm/scripts/backup.sh >> /var/log/mongodb-backup.log 2>&1
```

### 2. Offsite Backups

```bash
# Install AWS CLI
sudo apt install awscli -y
aws configure

# Add to backup script
aws s3 sync /backups s3://your-bucket/travel-crm-backups/
```

See [BACKUP_GUIDE.md](BACKUP_GUIDE.md) for detailed instructions.

---

## Post-Deployment

### 1. Health Checks

```bash
# Check all services
curl https://your-domain.com/health
curl https://your-domain.com/api/health

# Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### 2. Performance Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Load test
ab -n 1000 -c 10 https://your-domain.com/
```

### 3. Security Scan

```bash
# Check SSL configuration
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# Security headers
curl -I https://your-domain.com
```

### 4. Setup Monitoring Alerts

```bash
# Install monitoring agent (optional)
# - New Relic
# - Datadog
# - Prometheus + Grafana
```

---

## Troubleshooting

### Common Issues

**1. Cannot connect to database**

```bash
# Check MongoDB status
docker-compose -f docker-compose.prod.yml ps mongodb
docker-compose -f docker-compose.prod.yml logs mongodb

# Test connection
mongosh -u admin -p password --authenticationDatabase admin
```

**2. Frontend not loading**

```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

**3. API errors**

```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep -i mongo
```

**4. SSL certificate issues**

```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

### Rollback Procedure

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore from backup
./scripts/restore.sh backup_travel-crm_YYYYMMDD_HHMMSS.tar.gz

# Deploy previous version
git checkout previous-tag
docker-compose -f docker-compose.prod.yml up -d
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Check application logs for errors
- Monitor disk space
- Verify backups completed

**Weekly:**
- Review system resource usage
- Update dependencies (if needed)
- Test backup restoration

**Monthly:**
- Security updates
- Performance optimization
- Backup retention cleanup

### Updates

```bash
# Pull latest code
cd /opt/travel-crm
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Or with PM2
pm2 restart all
```

---

## Support & Resources

- **Documentation:** [README.md](README.md)
- **Environment Setup:** [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
- **Backup Guide:** [BACKUP_GUIDE.md](BACKUP_GUIDE.md)
- **API Documentation:** https://your-domain.com/api-docs (if enabled)

For additional support, contact your development team.