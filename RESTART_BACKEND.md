# Backend Restart Required ⚠️

## Why Restart is Needed

You modified the Itinerary model schema to add new fields:
- `singleUse`
- `firstAccessedAt`
- `accessCount`
- `isActive`

**Node.js does not hot-reload model changes!** The backend server is still running with the old model schema in memory.

## How to Restart Backend

### Option 1: Using PowerShell Terminal
```powershell
# Find the terminal running the backend (usually shows "node server.js" or "nodemon")
# Press Ctrl+C to stop it

# Then restart:
cd backend
node server.js
# OR if using nodemon:
npm run dev
```

### Option 2: Find and Kill Process
```powershell
# Find Node process
Get-Process node

# Kill all node processes (WARNING: closes all Node apps)
Stop-Process -Name node -Force

# Then restart backend
cd backend
node server.js
```

### What to Look For After Restart

When you generate a share link, the console should show:
```
✅ Share link response data: {shareUrl: "...", token: "...", expiresAt: "...", hasPassword: false, singleUse: false}
```

Instead of:
```
❌ Share link response data: undefined
```

## Quick Test After Restart

1. Refresh the browser (Ctrl+Shift+R)
2. Open itinerary detail page
3. Click "Share" button
4. Check "Single-use link" checkbox
5. Click "Generate Share Link"
6. Should see success message with shareable URL

---

**Current Issue**: Backend server has old model schema cached in memory and cannot save the new `singleUse` field properly.
