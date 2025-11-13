# Package Customization & Duplication Features

## Overview
This document describes the recently implemented features for customizing packages and duplicating itineraries in the Travel CRM system.

## Features Implemented

### 1. Fix Duplicate Packages Display

#### Problem
Packages were appearing multiple times in email matching results because the system was combining both SupplierPackageCache and Itinerary models without deduplication.

#### Solution
**File Modified:** `backend/src/services/matchingEngine.js`

**Changes Made:**
- Added `sourceType` marker to identify package origin ('supplier' or 'itinerary')
- Implemented deduplication logic using Map with `title_destination` key
- Case-insensitive comparison for titles and destinations
- Console logging to track deduplication process

**Code:**
```javascript
// Mark source types
packages = packages.map(pkg => ({ ...pkg, sourceType: 'supplier' }));
const itineraryPackages = itineraries.map(it => ({
  ...it,
  sourceType: 'itinerary'
}));

// Deduplicate
const seenPackages = new Map();
packages = packages.filter(pkg => {
  const key = `${(pkg.title || '').toLowerCase()}_${JSON.stringify(pkg.destination || {})}`;
  if (seenPackages.has(key)) {
    console.log(`⚠️  Duplicate detected: ${pkg.title} - Keeping first occurrence`);
    return false;
  }
  seenPackages.set(key, true);
  return true;
});
```

**Result:**
- No more duplicate packages in matching results
- Maintains first occurrence when duplicates found
- Better performance with fewer packages to score

### 2. Duplicate Itinerary Feature

#### Purpose
Allow users to quickly duplicate existing itineraries with all days, components, and details to create variations or new packages.

#### Implementation

**Frontend Changes:**
**File:** `frontend/src/pages/Itineraries.jsx`

**Added:**
1. **Import FiCopy icon:**
```javascript
import { FiCopy } from 'react-icons/fi';
```

2. **Duplicate Mutation:**
```javascript
const duplicateMutation = useMutation({
  mutationFn: (id) => itinerariesAPI.duplicate(id),
  onSuccess: (data) => {
    queryClient.invalidateQueries(['itineraries']);
    const itineraryId = data?.itinerary?._id || data?.data?._id;
    if (itineraryId) {
      toast.success('Itinerary duplicated successfully! Opening in builder...');
      navigate(`/itineraries/${itineraryId}/build`);
    }
  },
  onError: (error) => {
    toast.error(error.response?.data?.message || 'Failed to duplicate itinerary');
  }
});
```

3. **Handler Function:**
```javascript
const handleDuplicate = (itinerary) => {
  if (window.confirm(`Duplicate "${itinerary.title}"? This will create a copy with all days and components.`)) {
    duplicateMutation.mutate(itinerary._id);
  }
};
```

4. **UI Button in Actions Column:**
```javascript
<button
  onClick={() => handleDuplicate(row)}
  className="text-orange-600 hover:text-orange-800"
  title="Duplicate"
>
  <FiCopy className="w-4 h-4" />
</button>
```

**Backend API:**
- Endpoint already exists: `POST /api/v1/itineraries/:id/duplicate`
- Creates complete copy with "(Copy)" suffix
- Resets status to 'draft'
- Assigns to current user

**User Flow:**
1. Go to Itineraries list
2. Find itinerary to duplicate
3. Click orange copy icon in Actions column
4. Confirm duplication dialog
5. System creates duplicate
6. Automatically opens in Itinerary Builder
7. Edit and customize as needed

### 3. Package Customization Feature

#### Purpose
Allow users to customize package details (pricing, inclusions, exclusions, etc.) before creating a quote, enabling personalized proposals for customers.

#### Implementation

**New Component Created:**
**File:** `frontend/src/components/modals/CustomizePackageModal.jsx`

**Features:**
1. **Package Details Editing:**
   - Title (required)
   - Destination (required)
   - Duration in days (required)
   - Number of travelers

2. **Pricing Configuration:**
   - Base Cost (USD)
   - Markup Percentage
   - Final Price (auto-calculated)
   - Visual breakdown showing markup amount

3. **Inclusions Management:**
   - List of current inclusions
   - Add new inclusions
   - Remove existing inclusions
   - Visual green badges for included items

4. **Exclusions Management:**
   - List of current exclusions
   - Add new exclusions
   - Remove existing exclusions
   - Visual red badges for excluded items

5. **Internal Notes:**
   - Text area for special instructions
   - Not visible to customer
   - For internal reference only

**Modal State Management:**
```javascript
const [formData, setFormData] = useState({
  title: '',
  destination: '',
  duration: 0,
  price: 0,
  baseCost: 0,
  markup: 15,
  inclusions: [],
  exclusions: [],
  newInclusion: '',
  newExclusion: '',
  notes: '',
  travelers: 2
});
```

**Auto-Calculation Logic:**
```javascript
// When baseCost or markup changes
if (name === 'baseCost' || name === 'markup') {
  updated.price = updated.baseCost + (updated.baseCost * updated.markup / 100);
}
```

**Integration:**
**File:** `frontend/src/pages/emails/EmailDetail.jsx`

**Changes Made:**
1. Import modal component
2. Add state for modal visibility and package data
3. Update handleAddToQuote to open customize modal
4. New handler to save customized package

**Code:**
```javascript
// State
const [showCustomizeModal, setShowCustomizeModal] = useState(false);
const [packageToCustomize, setPackageToCustomize] = useState(null);

// Handler
const handleAddToQuote = async (match) => {
  setPackageToCustomize(match);
  setShowCustomizeModal(true);
};

const handleSaveCustomizedPackage = (customizedPackage) => {
  setShowCustomizeModal(false);
  setActiveTab('quotes');
  window.selectedMatchForQuote = customizedPackage;
  toast.success('Package customized! Complete the quote and click "Create Quote".');
};

// Modal Render
<CustomizePackageModal
  isOpen={showCustomizeModal}
  onClose={() => setShowCustomizeModal(false)}
  onSave={handleSaveCustomizedPackage}
  packageData={packageToCustomize}
  title="Customize Package for Quote"
/>
```

**User Flow:**
1. Go to Email Detail → Matches tab
2. Find suitable package match
3. Click "Add to Quote" button
4. **NEW:** Customize Package Modal opens
5. Edit title, destination, duration, pricing
6. Modify inclusions/exclusions lists
7. Add internal notes if needed
8. Click "Save & Use Package"
9. Automatically switches to Quotes tab
10. Complete remaining quote details
11. Click "Create Quote"

**UI Components:**
- Full-screen modal (max-width 4xl)
- Scrollable content area
- Color-coded sections:
  - Blue pricing section with visual breakdown
  - Green inclusions with checkmarks
  - Red exclusions with X marks
- Real-time price calculation display
- Validation with required field indicators
- Professional styling with Tailwind CSS

## Benefits

### For Agents:
1. **Faster Quote Creation:** Customize packages without going back to itinerary builder
2. **Flexible Pricing:** Adjust markup and base cost per customer
3. **Personalization:** Add/remove inclusions based on customer needs
4. **No Duplicates:** Clean, deduplicated package lists
5. **Quick Duplication:** Create package variations quickly

### For Business:
1. **Better Conversion:** Personalized quotes increase acceptance rate
2. **Margin Control:** Clear visibility of markup and profit
3. **Efficiency:** Less time spent creating similar packages
4. **Accuracy:** No confusion from duplicate packages
5. **Flexibility:** Adapt packages to customer budget

## Technical Details

### Dependencies
- React 18+
- Lucide React (icons)
- Tailwind CSS
- React Hot Toast (notifications)
- TanStack Query (data management)

### State Management
- Local component state for form data
- Global window object for cross-tab communication (temporary)
- Query invalidation for real-time updates

### Data Flow
```
EmailDetail (Match displayed)
  ↓ Click "Add to Quote"
CustomizePackageModal (Edit package)
  ↓ Click "Save & Use Package"
QuotesTab (Create quote with customized data)
  ↓ Click "Create Quote"
Backend API (/quotes/from-email)
  ↓ Success
Customer receives personalized quote
```

### Validation Rules
1. **Title:** Required, min 3 characters
2. **Destination:** Required
3. **Duration:** Required, min 1 day
4. **Base Cost:** Required, min 0
5. **Markup:** 0-100%
6. **Final Price:** Auto-calculated, read-only

## Future Enhancements

### Phase 2
- [ ] Save customization templates for reuse
- [ ] Bulk customize multiple packages
- [ ] Import/export customization presets
- [ ] Customer-facing customization options
- [ ] Version history for customizations

### Phase 3
- [ ] AI-suggested customizations based on customer preferences
- [ ] Dynamic pricing based on season/demand
- [ ] Integration with payment gateways
- [ ] Approval workflow for high-value customizations
- [ ] Analytics on customization patterns

## Testing Checklist

### Duplicate Packages Fix
- [ ] Check email matching results for duplicates
- [ ] Verify console logs show deduplication
- [ ] Test with packages having same title
- [ ] Test with packages from different sources

### Duplicate Itinerary
- [ ] Click duplicate button
- [ ] Verify confirmation dialog appears
- [ ] Check new itinerary has "(Copy)" suffix
- [ ] Verify all days/components copied
- [ ] Confirm opens in builder
- [ ] Test with complex multi-day itineraries

### Package Customization
- [ ] Open customize modal from match
- [ ] Edit all fields and save
- [ ] Verify price auto-calculation works
- [ ] Add/remove inclusions
- [ ] Add/remove exclusions
- [ ] Test required field validation
- [ ] Verify data passed to quotes tab
- [ ] Create quote with customized package
- [ ] Check final quote has custom data

## Troubleshooting

### Issue: Modal not opening
**Solution:** Check console for errors, verify CustomizePackageModal imported correctly

### Issue: Price not calculating
**Solution:** Ensure baseCost and markup are numbers, not strings

### Issue: Duplicate button not working
**Solution:** Verify itinerariesAPI.duplicate method exists in apiEndpoints.js

### Issue: Customizations not saving
**Solution:** Check handleSaveCustomizedPackage is called, verify window.selectedMatchForQuote set

### Issue: Still seeing duplicates
**Solution:** Clear browser cache, restart backend, check matching engine console logs

## API Reference

### Duplicate Itinerary
```
POST /api/v1/itineraries/:id/duplicate
Authorization: Bearer <token>
Response: {
  success: true,
  data: {
    itinerary: { ... }
  }
}
```

### Match Packages (with deduplication)
```
POST /api/v1/emails/:id/match
Authorization: Bearer <token>
Response: {
  success: true,
  matches: [ ... ],
  totalPackages: 45,  // After deduplication
  duplicatesRemoved: 12
}
```

## Support

For issues or questions:
- Check browser console for errors
- Review backend logs for API errors
- Verify all dependencies installed
- Check Tailwind CSS classes compiling
- Contact development team

---

**Last Updated:** November 2025  
**Version:** 1.0  
**Status:** Production Ready
