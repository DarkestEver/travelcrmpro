# 🔴 Missing Backend Endpoints - Email Features

**Date:** November 14, 2025  
**Issue:** Frontend UI exists but backend APIs not implemented

---

## Problem

Three email feature pages are live in the frontend but showing zero counts/no data:

1. **Email Dashboard** (`/emails`) - Shows 0 emails, 0 needs review, $0.00 AI cost
2. **Email Analytics** (`/emails/analytics`) - Shows 0% accuracy, 0 total emails
3. **Manual Review Queue** (`/emails/review-queue`) - Shows "No items in review queue"

**Root Cause:** Backend API endpoints are NOT implemented yet!

---

## Missing Endpoints

### 1. Email Dashboard Stats
**Route:** `GET /api/v1/emails/dashboard-stats`  
**Status:** ❌ NOT IMPLEMENTED  
**Expected Response:**
- Today's email count with % change
- Needs review count
- AI cost (total)
- Queue count
- Recent emails list

### 2. Email Analytics
**Route:** `GET /api/v1/emails/analytics`  
**Status:** ❌ NOT IMPLEMENTED  
**Expected Response:**
- Total emails count
- AI accuracy percentage
- Total AI cost
- Average response time
- Email categories breakdown
- Processing status breakdown
- Manual review queue count

### 3. Review Queue
**Route:** `GET /api/v1/emails/review-queue`  
**Status:** ❌ NOT IMPLEMENTED  
**Expected Response:**
- Pending count
- SLA breached count
- In review count
- Avg response time
- List of emails needing review

---

## What EXISTS Currently

### ✅ Working Endpoints:
- `GET /api/v1/emails` - Get all emails (with filters)
- `GET /api/v1/emails/stats` - Basic stats (total, by status, by source, by category)
- `GET /api/v1/emails/:id` - Get single email
- `POST /api/v1/emails/:id/*` - Various processing actions

### ✅ Database Model:
- EmailLog model exists with all necessary fields
- No schema changes needed

---

## Implementation Required

### Step 1: Add Routes (backend/src/routes/emailRoutes.js)
```javascript
// Add after line 14 (after router.get('/stats', ...))
router.get('/dashboard-stats', emailController.getDashboardStats);
router.get('/analytics', emailController.getAnalytics);
router.get('/review-queue', emailController.getReviewQueue);
```

### Step 2: Add Controller Methods (backend/src/controllers/emailController.js)
Need to implement:
1. `getDashboardStats(req, res)` - Aggregate today's data
2. `getAnalytics(req, res)` - Aggregate analytics data with date range
3. `getReviewQueue(req, res)` - Query emails flagged for review

### Step 3: Add Review Fields to EmailLog Model (if not exists)
Check if these fields exist:
- `needsReview` (Boolean)
- `reviewReason` (String - low_confidence, no_match, etc.)
- `reviewedAt` (Date)
- `reviewedBy` (ObjectId)

---

## Quick Fix Options

### Option A: Implement Full Backend (Recommended)
- Time: 4-6 hours
- Benefit: Complete feature functionality
- Risk: None, proper implementation

### Option B: Return Mock Data (Temporary)
- Time: 30 minutes
- Benefit: UI shows something instead of zeros
- Risk: Not real data, needs real implementation later

### Option C: Hide Features Until Ready
- Time: 5 minutes
- Benefit: No confusion with zero counts
- Risk: Features already visible to users

---

## Current State

**Frontend:** ✅ 100% Complete (UI exists and looks good)  
**Backend:** ❌ 0% Complete (No API endpoints)  
**Overall:** 🟡 50% Complete (UI only, no data)

---

## Recommended Action

**Implement the backend endpoints ASAP** to make these features functional!

See `docs/PENDING_FEATURES_PLAN.md` for detailed implementation guide.

---

**Priority:** 🔴 HIGH (Features are already visible to users)  
**Complexity:** 🟢 LOW (Just aggregation queries)  
**Time:** 4-6 hours for full implementation
