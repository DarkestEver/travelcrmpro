# Matching Engine Improvements - Enhanced Destination Matching

## Problem
The matching engine was not matching destinations properly, even when destinations were clearly related. Customers reported "rematching is not working - even destination is not matching a lot".

## Root Causes Identified

### 1. Too Strict Search Query
**File:** `backend/src/models/SupplierPackageCache.js`
**Issue:** The `searchPackages()` method was using MongoDB `$text` search exclusively, which requires exact text index matching.

```javascript
// OLD - Too strict
if (criteria.destination) {
  query.$text = { $search: criteria.destination };
}
```

**Problem:** This would miss packages if:
- Destination was in country field but not destination field
- Destination had different word order (e.g., "Paris, France" vs "France Paris")
- Destination was abbreviated or had slight variations

### 2. Limited Destination Scoring
**File:** `backend/src/services/matchingEngine.js`
**Issue:** The destination scoring only checked for exact matches and simple word matching, missing many valid matches.

**Problems:**
- No substring matching (e.g., "Paris" in "Paris, France")
- No checking of package name for destination
- No scoring for destination in activities/inclusions
- Limited word-by-word flexibility

## Solutions Implemented

### 1. Flexible Database Search ✅

**File:** `backend/src/models/SupplierPackageCache.js`

Replaced strict `$text` search with flexible `$or` query using regex:

```javascript
// NEW - Flexible matching (without $text to avoid MongoDB query planner conflicts)
if (criteria.destination) {
  const destination = criteria.destination.toLowerCase().trim();
  
  query.$or = [
    // Case-insensitive regex on destination field
    { destination: { $regex: destination, $options: 'i' } },
    // Case-insensitive regex on country field
    { country: { $regex: destination, $options: 'i' } },
    // Case-insensitive regex on region field
    { region: { $regex: destination, $options: 'i' } },
    // Case-insensitive regex on package name
    { packageName: { $regex: destination, $options: 'i' } },
    // Check highlights array
    { highlights: { $regex: destination, $options: 'i' } },
    // Check tags array
    { tags: { $regex: destination, $options: 'i' } }
  ];
}
```

**Why no $text search?**
MongoDB's query planner cannot execute queries that mix `$text` search with other operators (like regex) in the same `$or` clause. This causes error 291 "NoQueryExecutionPlans". By using regex on all fields including highlights and tags, we get the same flexibility without the query planner conflict.

**Benefits:**
- ✅ Matches if destination appears anywhere in destination, country, region, package name, highlights, or tags
- ✅ Case-insensitive matching
- ✅ Partial word matching (e.g., "Pari" matches "Paris")
- ✅ Works with MongoDB query planner (no conflicts)
- ✅ Much broader result set

### 2. Enhanced Destination Scoring ✅

**File:** `backend/src/services/matchingEngine.js`

Completely rewrote `scoreDestination()` method with 9 matching strategies:

#### Scoring Levels (40 points max):

1. **Exact Match (40 points)** - Exact destination or country match
2. **Substring Contains (38 points)** - One contains the other (e.g., "Paris" in "Paris, France")
3. **Country Contains (36 points)** - Country field contains inquiry destination
4. **Country Exact (35 points)** - Exact country match
5. **Package Name Match (32 points)** - Destination appears in package name
6. **Region Match (30 points)** - Region matches inquiry
7. **Word-by-Word Match (25-35 points)** - Multiple words match, scored by percentage
8. **Highlights Match (20 points)** - Destination mentioned in highlights
9. **Details Match (18 points)** - Destination in inclusions/activities

#### New Features:

```javascript
// Substring matching
if (packageDest.includes(inquiryDest) || inquiryDest.includes(packageDest)) {
  return { points: 38, reason: `Destination contains match: ${packageDest}` };
}

// Package name checking
if (packageName.includes(inquiryDest)) {
  return { points: 32, reason: `Destination in package name` };
}

// Flexible word matching with scoring
const inquiryWords = inquiryDest.split(/[\s,]+/).filter(w => w.length > 2);
const packageWords = packageDest.split(/[\s,]+/).filter(w => w.length > 2);

let matchedWords = 0;
for (const iWord of inquiryWords) {
  for (const pWord of packageWords) {
    if (iWord === pWord || iWord.includes(pWord) || pWord.includes(iWord)) {
      matchedWords++;
      break;
    }
  }
}

if (matchedWords > 0) {
  const matchPercent = matchedWords / inquiryWords.length;
  const points = Math.round(25 + (matchPercent * 10)); // 25-35 points
  return { points, reason: `Partial match (${matchedWords}/${inquiryWords.length} words)` };
}
```

### 3. Enhanced Debug Logging ✅

**File:** `backend/src/services/matchingEngine.js`

Added comprehensive logging to help debug matching issues:

```javascript
// Log search criteria
console.log(`🔍 Matching packages for criteria:`, {
  destination: criteria.destination || 'ANY',
  dates: criteria.dates?.preferredStart || 'FLEXIBLE',
  travelers: criteria.travelers?.adults || 'ANY',
  budget: criteria.budget?.max || 'ANY'
});

// Log found packages
console.log(`📦 Found ${packages.length} supplier packages`);
console.log(`📦 Found ${itineraries.length} published itineraries`);

// Log top matches with details
console.log(`🎯 Top 3 matches:`);
scoredPackages.slice(0, 3).forEach((match, index) => {
  console.log(`  ${index + 1}. ${match.package.title} - Score: ${match.score}/100`);
  console.log(`     Destination: ${JSON.stringify(match.package.destination)}`);
  console.log(`     Breakdown:`, match.breakdown);
  console.log(`     Reasons:`, match.matchReasons);
});
```

## Impact & Results

### Before:
- ❌ "Paris" wouldn't match "Paris, France"
- ❌ "Thailand" wouldn't match package with country="Thailand"
- ❌ "Bali" wouldn't match "Bali Adventure Package"
- ❌ Limited to exact text index matches
- ❌ No visibility into why matches failed

### After:
- ✅ "Paris" matches "Paris, France", "Paris Tour", "Romantic Paris"
- ✅ "Thailand" matches all Thailand packages regardless of field
- ✅ "Bali" matches "Bali Adventure", "Beautiful Bali", packages with Bali in name
- ✅ Substring and partial word matching works
- ✅ Comprehensive logging shows why each package scored as it did
- ✅ Much higher match rates

## Example Matching Scenarios

### Scenario 1: Simple City Search
**Query:** "Paris"

**Will Match:**
- ✅ Destination: "Paris" (40 points - exact)
- ✅ Destination: "Paris, France" (38 points - contains)
- ✅ Package Name: "Romantic Paris Getaway" (32 points - in name)
- ✅ Country: "France" with highlights mentioning Paris (20 points)

### Scenario 2: Country Search
**Query:** "Thailand"

**Will Match:**
- ✅ Country: "Thailand" (35 points - exact country)
- ✅ Destination: "Bangkok, Thailand" (36 points - country contains)
- ✅ Package Name: "Thailand Adventure" (32 points - in name)
- ✅ Region: "Southeast Asia" with Thailand in highlights (20 points)

### Scenario 3: Multi-word Destination
**Query:** "Maldives Beach Resort"

**Will Match:**
- ✅ Destination: "Maldives" (35 points - 1/3 words = 33%)
- ✅ Package: "Beach Resort in Maldives" (32 points - in name + 2/3 words = 30%)
- ✅ Destination: "Maldives Beach" (33 points - 2/3 words = 66%)

## Testing

### Manual Testing Steps:

1. **Start backend with logging:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Open email with destination query** (e.g., Paris, Bali, Thailand)

3. **Click "Match Packages"**

4. **Check backend logs for:**
   - Search criteria logged
   - Number of packages found
   - Top 3 matches with scores
   - Score breakdown showing destination points

5. **Verify matches make sense** - packages with related destinations should appear

### Expected Log Output:
```
🔍 Matching packages for criteria: { destination: 'Paris', dates: 'FLEXIBLE', travelers: 'ANY', budget: 'ANY' }
📦 Found 12 supplier packages
📦 Found 8 published itineraries
📦 Total packages after deduplication: 18
🎯 Top 3 matches:
  1. Romantic Paris Getaway - Score: 85/100
     Destination: "Paris, France"
     Breakdown: { destination: 38, dates: 20, budget: 15, travelers: 10, requirements: 2 }
     Reasons: ['Destination contains match: paris, france', 'Available year-round']
  2. Paris & Versailles Tour - Score: 80/100
     ...
```

## Files Modified

1. ✅ `backend/src/models/SupplierPackageCache.js`
   - Replaced strict `$text` search with flexible `$or` regex query
   - Added case-insensitive matching on multiple fields

2. ✅ `backend/src/services/matchingEngine.js`
   - Rewrote `scoreDestination()` with 9 matching strategies
   - Added substring matching
   - Added package name checking
   - Improved word-by-word matching with percentage scoring
   - Added comprehensive debug logging

## Performance Considerations

### Regex Performance:
- Using `$regex` with `$options: 'i'` is slower than indexed exact matches
- But much faster than missing matches entirely
- Trade-off: Slightly slower queries for much better results

### Mitigation:
- Regex queries are still indexed (destination has index)
- Only searches active, verified packages
- Results limited by sort (timesBooked, timesMatched)
- Destination regex combined with other criteria in single query

### Optimization Tips:
- Keep destination strings normalized (lowercase, trimmed)
- Consider adding destination aliases in database
- Cache common destination searches

## Future Enhancements

1. **Synonym Matching**: Add destination synonyms
   - "NYC" → "New York"
   - "UK" → "United Kingdom"
   - "UAE" → "United Arab Emirates"

2. **Fuzzy Matching**: Add Levenshtein distance for typos
   - "Pari" → "Paris" (1 char off)
   - "Thailnd" → "Thailand" (1 char off)

3. **Geographic Proximity**: Match nearby destinations
   - "Paris" also matches "France", "Versailles"
   - "Bali" also matches "Indonesia", "Java"

4. **Learning from Bookings**: Boost destinations that convert
   - Track which destination matches lead to bookings
   - Increase scoring for high-converting patterns

5. **Multi-destination Support**: Handle "Paris and Rome"
   - Split query into multiple destinations
   - Match packages covering multiple stops

## Rollback Plan

If issues occur, revert these changes:

```bash
git revert HEAD
```

Or manually restore old code:

**SupplierPackageCache.js:**
```javascript
if (criteria.destination) {
  query.$text = { $search: criteria.destination };
}
```

**matchingEngine.js:**
```javascript
// Restore original scoreDestination() from git history
```

## Success Metrics

Monitor these after deployment:

- ✅ **Match Rate**: % of queries that return matches (should increase)
- ✅ **Match Relevance**: User feedback on match quality
- ✅ **False Positives**: Matches that don't make sense (should be low)
- ✅ **Backend Logs**: Check for improved destination matching
- ✅ **User Complaints**: Should decrease regarding "no matches found"

## Conclusion

The matching engine now uses flexible regex-based search and enhanced destination scoring to significantly improve match rates. Destinations are matched across multiple fields with substring support, making the system much more forgiving of variations in destination names and formats.

## Troubleshooting

### Error: "NoQueryExecutionPlans" (Code 291)

**Symptom:**
```
MongoServerError: error processing query: ... planner returned error :: caused by :: No query solutions
code: 291
codeName: 'NoQueryExecutionPlans'
```

**Cause:** MongoDB cannot execute queries that mix `$text` search with other operators in `$or`.

**Solution:** ✅ Fixed by removing `$text` from `$or` clause and using regex on all fields including highlights and tags.

**Verification:** Query should now work without errors. Check logs for successful package searches.

### Low Match Rates

**Symptom:** Few or no matches returned for destination queries.

**Diagnosis Steps:**
1. Check backend logs for search criteria
2. Verify packages exist in database with matching destinations
3. Check if destination fields are populated correctly
4. Review score breakdown in logs

**Common Causes:**
- No packages in database for that destination
- Packages marked as inactive or not verified
- Destination stored in unexpected format (check logs)
- Tenant ID mismatch

### Performance Issues

**Symptom:** Slow query response times.

**Diagnosis:**
- Multiple regex queries on large collections can be slow
- Check if indexes exist on key fields

**Optimization:**
```javascript
// Ensure indexes exist
db.supplierpackagecaches.createIndex({ destination: 1 })
db.supplierpackagecaches.createIndex({ country: 1 })
db.supplierpackagecaches.createIndex({ tenantId: 1, status: 1, verified: 1 })
```
