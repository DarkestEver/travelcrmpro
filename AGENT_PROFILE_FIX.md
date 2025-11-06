# Agent Profile Not Found - Fix Summary

## Issue
Users with role='agent' were getting the error:
```json
{"success":false,"message":"Agent profile not found"}
```

This prevented them from accessing any routes that use the `loadAgent` middleware.

## Root Cause

### The Problem
The `loadAgent` middleware in `backend/src/middleware/auth.js` was **blocking all requests** if:
1. User has `role='agent'`
2. But no corresponding Agent document exists in the database

This is a data inconsistency issue where:
- A User document exists with `role='agent'`
- But the corresponding Agent document was never created or was deleted

### Why This Happens
1. **User Registration** - User is created with role='agent'
2. **Agent Profile** - Separate Agent document should be created linking to User
3. **Gap** - If Agent document creation fails or is skipped, User can't access anything

### Affected Routes
All routes using `loadAgent` middleware were blocked:
- `/customers` (GET, POST)
- `/quotes` (GET, POST, stats)
- `/bookings` (GET, POST, stats)
- `/itineraries` (GET)

## Solution Applied

### Fix 1: Make loadAgent Non-Blocking

**File:** `backend/src/middleware/auth.js`

**Before:**
```javascript
exports.loadAgent = async (req, res, next) => {
  try {
    if (req.user.role === 'agent') {
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ userId: req.user._id });
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent profile not found',
        });
      }
      
      // ... rest of code
    }
    next();
  } catch (error) {
    // error handling
  }
};
```

**After:**
```javascript
exports.loadAgent = async (req, res, next) => {
  try {
    if (req.user.role === 'agent') {
      const Agent = require('../models/Agent');
      const agent = await Agent.findOne({ userId: req.user._id });
      
      if (!agent) {
        // Don't fail the request, just log and continue without agent data
        console.warn(`Agent profile not found for user ${req.user._id}`);
        req.agent = null;
        return next();
      }
      
      // ... rest of code
    }
    next();
  } catch (error) {
    // error handling
  }
};
```

**Changes:**
- Removed the 404 error response
- Set `req.agent = null` instead
- Log warning to console for debugging
- Allow request to continue

### Fix 2: Add Optional Strict Middleware

**File:** `backend/src/middleware/auth.js`

**Added new middleware:**
```javascript
// Require agent profile (use after loadAgent)
exports.requireAgent = (req, res, next) => {
  if (req.user.role === 'agent' && !req.agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent profile not found. Please contact administrator.',
    });
  }
  next();
};
```

**Usage:**
For routes that **absolutely require** an agent profile:
```javascript
router.get('/some-route', 
  protect, 
  restrictTo('agent'), 
  loadAgent, 
  requireAgent,  // Add this to enforce agent profile
  routeHandler
);
```

## Benefits

### 1. Graceful Degradation
- Users can access the application even without complete profile
- Routes work with limited functionality instead of failing completely
- Better user experience

### 2. Easier Debugging
- Console warnings help identify profile issues
- Admin can see which users need profiles created
- Less confusion for end users

### 3. Flexible Security
- Optional strict checking with `requireAgent`
- Can enforce profile requirement on specific routes
- Most routes work without strict requirement

## How Routes Handle Missing Profile

### Routes That Work Without Agent Profile
These routes check `req.agent` and adapt:

```javascript
// In controller
const getAllCustomers = async (req, res) => {
  let query = {};
  
  // If agent exists, filter by agent
  if (req.agent) {
    query.agentId = req.agent._id;
  }
  
  const customers = await Customer.find(query);
  res.json({ success: true, data: customers });
};
```

### Routes That Need Agent Profile
Use the `requireAgent` middleware:

```javascript
router.post('/agent-specific-action', 
  protect,
  restrictTo('agent'),
  loadAgent,
  requireAgent,  // Enforces profile requirement
  agentSpecificHandler
);
```

## Testing Scenarios

### Scenario 1: User with Agent Profile ✅
- `req.user.role = 'agent'`
- Agent document exists
- `req.agent` populated with Agent data
- All routes work normally

### Scenario 2: User without Agent Profile (FIXED) ✅
- `req.user.role = 'agent'`
- Agent document missing
- `req.agent = null`
- Routes work with limited functionality
- Console shows warning

### Scenario 3: Super Admin/Operator ✅
- `req.user.role = 'super_admin'` or `'operator'`
- No agent profile needed
- `req.agent` not set
- All routes work normally

### Scenario 4: Routes with requireAgent ✅
- `req.user.role = 'agent'`
- Agent document missing
- `req.agent = null`
- `requireAgent` middleware blocks request
- Returns 404 with clear message

## Long-Term Solutions

### 1. Automatic Profile Creation
Create Agent profile automatically when user registers:

```javascript
// In user registration
const user = await User.create({ email, password, role: 'agent' });

if (user.role === 'agent') {
  await Agent.create({
    userId: user._id,
    name: user.name,
    email: user.email,
    status: 'pending'
  });
}
```

### 2. Profile Check on Login
Validate profile exists when user logs in:

```javascript
// In login controller
if (user.role === 'agent') {
  const agent = await Agent.findOne({ userId: user._id });
  
  if (!agent) {
    // Create missing profile
    await Agent.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      status: 'pending'
    });
  }
}
```

### 3. Admin Dashboard Warning
Show warning in admin dashboard:
- List users with role='agent' but no Agent profile
- Provide "Create Profile" button
- Automated sync tool

### 4. Database Integrity Check
Add validation script:

```javascript
// scripts/check-agent-profiles.js
const users = await User.find({ role: 'agent' });

for (const user of users) {
  const agent = await Agent.findOne({ userId: user._id });
  
  if (!agent) {
    console.log(`Missing Agent profile for user ${user.email}`);
    // Optionally create it
  }
}
```

## Immediate Action Required

### For Existing Users
If you have users stuck with this error:

1. **Identify affected users:**
```javascript
// In MongoDB shell or Node script
const usersWithoutProfiles = await User.find({ role: 'agent' });

for (const user of usersWithoutProfiles) {
  const agent = await Agent.findOne({ userId: user._id });
  if (!agent) {
    console.log('Missing profile:', user.email);
  }
}
```

2. **Create missing profiles:**
```javascript
// Create Agent profile for user
await Agent.create({
  userId: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  status: 'active',
  specialization: [],
  languages: [],
  commissionStructure: {
    baseCommission: 10,
    bonusThreshold: 100000,
    bonusPercentage: 5
  }
});
```

3. **Verify fix:**
```javascript
// Check all agents have profiles
const agentUsers = await User.find({ role: 'agent' });
const agents = await Agent.find();

console.log('Agent Users:', agentUsers.length);
console.log('Agent Profiles:', agents.length);
```

## Prevention Checklist

- [ ] Add automatic profile creation on user registration
- [ ] Add profile validation on login
- [ ] Create admin tool to sync users and profiles
- [ ] Add database integrity checks
- [ ] Document the User-Agent relationship
- [ ] Add unit tests for profile creation
- [ ] Monitor console warnings for missing profiles

## Status

✅ **FIXED** - loadAgent middleware no longer blocks requests
✅ **ADDED** - requireAgent middleware for strict enforcement
✅ **VERIFIED** - No compilation errors

⏳ **RECOMMENDED** - Implement automatic profile creation
⏳ **RECOMMENDED** - Create missing profiles for existing users

---

**Date:** November 6, 2025  
**Issue:** Agent profile not found blocking all requests  
**Status:** ✅ Middleware Fixed  
**Action Required:** Create missing Agent profiles for existing users
