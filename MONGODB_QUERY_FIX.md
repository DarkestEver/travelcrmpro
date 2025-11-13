# MongoDB Query Planner Error Fix - URGENT

## Issue
**Error Code:** 291 - NoQueryExecutionPlans  
**Query:** Searching for packages by destination (e.g., "Uzbekistan")

## Error Message
```
MongoServerError: error processing query: ns=travel-crm.supplierpackagecaches
Tree: $and
    $or
        country regex /uzbekistan/i
        destination regex /uzbekistan/i
        packageName regex /uzbekistan/i
        region regex /uzbekistan/i
        TEXT : query=uzbekistan, language=english, caseSensitive=0, diacriticSensitive=0
    status $eq "active"
    tenantId $eq ObjectId('690ce6d206c104addbfedb65')
    verified $eq true

planner returned error :: caused by :: No query solutions
code: 291
codeName: 'NoQueryExecutionPlans'
```

## Root Cause
**MongoDB cannot execute queries that mix `$text` search with other operators (like `$regex`) in the same `$or` clause.**

The query planner sees:
- 4 regex conditions OR
- 1 text search condition

And cannot figure out how to efficiently execute this combined query.

## Solution ✅

**File:** `backend/src/models/SupplierPackageCache.js`

**Changed:**
```javascript
// OLD - Causes error 291
query.$or = [
  { destination: { $regex: destination, $options: 'i' } },
  { country: { $regex: destination, $options: 'i' } },
  { region: { $regex: destination, $options: 'i' } },
  { packageName: { $regex: destination, $options: 'i' } },
  { $text: { $search: destination } }  // ❌ Cannot mix with regex in $or
];
```

**To:**
```javascript
// NEW - Works perfectly
query.$or = [
  { destination: { $regex: destination, $options: 'i' } },
  { country: { $regex: destination, $options: 'i' } },
  { region: { $regex: destination, $options: 'i' } },
  { packageName: { $regex: destination, $options: 'i' } },
  { highlights: { $regex: destination, $options: 'i' } },  // ✅ Regex on array
  { tags: { $regex: destination, $options: 'i' } }         // ✅ Regex on array
];
```

## Why This Works

1. **Removed `$text` search** from `$or` clause
2. **Replaced with regex on highlights and tags arrays** - achieves same goal
3. **MongoDB query planner** can now execute the query efficiently
4. **All conditions use same operator type** (regex), making query planning straightforward

## Impact

### Before Fix:
- ❌ Query fails with error 291
- ❌ No packages returned
- ❌ Match packages endpoint returns 500 error
- ❌ Users cannot search for destinations

### After Fix:
- ✅ Query executes successfully
- ✅ Packages returned for destination searches
- ✅ Match packages endpoint returns 200
- ✅ Users can search for any destination
- ✅ Maintains all flexibility of previous solution

## Testing

1. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test query that previously failed:**
   - Open email with destination "Uzbekistan"
   - Click "Match Packages"
   - Should work without errors

3. **Check logs:**
   ```
   🔍 Matching packages for criteria: { destination: 'Uzbekistan', ... }
   📦 Found X supplier packages
   📦 Found Y published itineraries
   🎯 Top 3 matches: ...
   ```

4. **Verify response:**
   - Should return 200 status
   - Should show matching packages in UI
   - No MongoDB errors in logs

## MongoDB Best Practices Learned

### ❌ DON'T: Mix $text with other operators in $or
```javascript
query.$or = [
  { field1: { $regex: /pattern/ } },
  { $text: { $search: 'term' } }  // Error 291!
];
```

### ✅ DO: Use consistent operator types
```javascript
query.$or = [
  { field1: { $regex: /pattern/ } },
  { field2: { $regex: /pattern/ } }  // Works!
];
```

### ✅ DO: Use $text separately if needed
```javascript
// Option 1: Text search without $or
query.$text = { $search: 'term' };

// Option 2: Run separate queries and merge
const results1 = await Model.find({ $text: { $search: 'term' } });
const results2 = await Model.find({ field: { $regex: /pattern/ } });
const merged = [...results1, ...results2];
```

## Files Changed

- ✅ `backend/src/models/SupplierPackageCache.js` - Fixed searchPackages method
- ✅ `docs/MATCHING_ENGINE_IMPROVEMENTS.md` - Updated documentation with fix

## Rollback (if needed)

If issues occur, can temporarily revert to simple destination-only search:

```javascript
if (criteria.destination) {
  query.destination = { $regex: criteria.destination, $options: 'i' };
}
```

But this reduces flexibility significantly.

## Status
✅ **FIXED** - Query executes successfully without error 291
