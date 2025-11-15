# Automated Testing Guide

## Quick Start (Recommended)

### Run PowerShell Test Script
```powershell
# From project root
.\test-api-quick.ps1
```

**What it does:**
- ✅ Tests 20+ API endpoints automatically
- ✅ Logs in as super admin
- ✅ Identifies 404, 403, 401 errors
- ✅ Reports which APIs work/fail
- ✅ Saves results to `test-results-quick.json`
- ⏱️ **Takes ~30 seconds**

---

## Full Node.js Test Suite

### Prerequisites
```bash
cd backend
npm install axios  # If not already installed
```

### Run Complete Tests
```bash
# From project root
node test-ui-apis.js
```

**What it does:**
- ✅ Tests all API endpoints
- ✅ Checks frontend file structure
- ✅ Analyzes API service files for issues
- ✅ Checks for duplicate menu items
- ✅ Verifies role-based access control
- ✅ Generates detailed reports:
  - `test-results.json` - Full data
  - `TEST_RESULTS.md` - Human-readable report
- ⏱️ **Takes ~2 minutes**

---

## Before Running Tests

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Update Test Credentials (if needed)

**For PowerShell script (`test-api-quick.ps1`):**
```powershell
# Edit line 5-6
$LOGIN_EMAIL = "your-admin@email.com"
$LOGIN_PASSWORD = "your-password"
```

**For Node.js script (`test-ui-apis.js`):**
```javascript
// Edit line 10-13 or use environment variables
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'your-admin@email.com',
  password: process.env.TEST_PASSWORD || 'your-password'
};
```

---

## Quick Reference

| Script | Time | Output | Use When |
|--------|------|--------|----------|
| `test-api-quick.ps1` | 30s | Console + JSON | Quick check |
| `test-ui-apis.js` | 2min | Console + JSON + MD | Complete analysis |
| `api-diagnostics.html` | N/A | Browser UI | Visual testing |

---

## Ready to Test?

**Run this now:**
```powershell
# Make sure backend is running first!
cd backend
npm run dev

# In another terminal, from project root:
.\test-api-quick.ps1
```

Then share the output with me! 🚀
