# Enhanced Email Extraction Rules

## Overview
This document outlines the comprehensive rules for extracting customer inquiry data from emails using AI.

**Last Updated:** November 11, 2025  
**Current Year for Extraction:** 2025

---

## 1. DATE EXTRACTION RULES

### Current Year Context
- **Always use 2025** for any upcoming month without a year specified
- Example: "March trip" → assumes March 2025 (not 2024 or 2026)

### Case 1: Both Dates Provided
When customer specifies both start and end dates:

```
Email: "December 20-27, 2025"
Extracted:
{
  dates: {
    flexible: false,
    startDate: "2025-12-20",
    endDate: "2025-12-27",
    duration: 7  // calculated
  }
}
```

**Examples:**
- "March 15 to March 22" → `2025-03-15` to `2025-03-22`
- "June 10-17" → `2025-06-10` to `2025-06-17`
- "July 4th through July 11th, 2025" → `2025-07-04` to `2025-07-11`

### Case 2: Start Date + Duration
When customer specifies start date and number of days/nights:

```
Email: "December 20 for 7 nights"
Extracted:
{
  dates: {
    flexible: false,
    startDate: "2025-12-20",
    endDate: "2025-12-27",  // calculated: start + 7 nights
    duration: 7
  }
}
```

**Duration Calculation Rules:**
- "7 nights" = 7 nights (start date + 7 days = end date)
- "5 days" = 5 days with 4 nights (start date + 4 days = end date)
- "1 week" = 7 nights
- "10 days" = 10 days with 9 nights

**Examples:**
- "January 10, 5 days" → `2025-01-10` to `2025-01-14` (4 nights)
- "March 5 for 2 weeks" → `2025-03-05` to `2025-03-19` (14 nights)

### Case 3: Only Month + Duration (Flexible Dates)
When customer mentions only the month with duration but no specific date:

```
Email: "sometime in December for 7 nights"
Extracted:
{
  dates: {
    flexible: true,
    startDate: null,      // NO specific date
    endDate: null,        // NO specific date
    duration: 7           // duration only
  }
}
```

**Key Rules:**
- `flexible: true` when only month is mentioned
- Do NOT set `startDate` or `endDate`
- Only set `duration` if mentioned
- Include "specific travel dates" in `missingInfo` array

**Examples:**
- "December, 5 days" → flexible: true, duration: 5, no dates
- "sometime in March" → flexible: true, no duration or dates
- "early April for a week" → flexible: true, duration: 7

---

## 2. TRAVELER COUNT RULES

### Adults
**MANDATORY** - Must always extract adults count (minimum 1).

**Common Phrases:**
- "family of 4" → typically 2 adults + 2 children
- "couple" → 2 adults, 0 children, 0 infants
- "we are 2" / "2 people" → 2 adults, 0 children, 0 infants
- "solo traveler" / "just me" → 1 adult

### Children
**MANDATORY** - Default to 0 if not mentioned.

**Children Ages are MANDATORY:**
- If children are mentioned, ages MUST be extracted
- If children count is mentioned but ages are NOT specified:
  - Still extract children count
  - Include "children ages" in `missingInfo` array

```
Email: "2 kids aged 5 and 8"
Extracted:
{
  travelers: {
    adults: 2,
    children: 2,
    childAges: [5, 8],
    infants: 0
  }
}
```

```
Email: "3 children"  // No ages specified
Extracted:
{
  travelers: {
    adults: 2,
    children: 3,
    childAges: [],      // empty
    infants: 0
  },
  missingInfo: ["children ages"]
}
```

**Examples:**
- "2 adults and 2 children (ages 7, 10)" → adults: 2, children: 2, childAges: [7, 10]
- "family with 3 kids" → children: 3, childAges: [], missingInfo: ["children ages"]

### Infants
**SEPARATE FROM CHILDREN** - Typically under 2 years old.

```
Email: "2 adults, 1 infant (6 months old)"
Extracted:
{
  travelers: {
    adults: 2,
    children: 0,    // infants are separate
    infants: 1,
    childAges: []
  }
}
```

**Examples:**
- "couple with a baby" → adults: 2, children: 0, infants: 1
- "2 adults, 1 toddler, 1 infant" → adults: 2, children: 1, infants: 1

---

## 3. BUDGET RULES

### Budget is OPTIONAL
- If budget is NOT mentioned in email, this is acceptable
- Set `amount: null` and `flexible: true`
- Do NOT include "budget amount" in `missingInfo` array

### Budget Extraction

**Total Budget:**
```
Email: "$8,000 total"
Extracted:
{
  budget: {
    amount: 8000,
    currency: "USD",
    flexible: false,
    perPerson: false
  }
}
```

**Per Person Budget:**
```
Email: "$2,000 per person"
Extracted:
{
  budget: {
    amount: 2000,
    currency: "USD",
    flexible: false,
    perPerson: true
  }
}
```

**No Budget Mentioned:**
```
Email: "Please share packages"  // No budget mentioned
Extracted:
{
  budget: {
    amount: null,
    currency: "USD",
    flexible: true,
    perPerson: false
  },
  missingInfo: []  // Budget NOT in missing info (it's optional)
}
```

### Currency Detection

**Currency Symbols:**
- `$` → USD
- `€` → EUR
- `£` → GBP
- `₹` → INR

**Examples:**
- "€5,000" → amount: 5000, currency: "EUR"
- "10000 INR" → amount: 10000, currency: "INR"
- "around $6k" → amount: 6000, currency: "USD", flexible: true

---

## 4. SIGNATURE EXTRACTION

### Text Signatures
Extract ALL available information from text-based signatures:

```
Email body ends with:
"
Best regards,
John Doe
Senior Manager, Tech Corp
Phone: +1-555-123-4567
john.doe@techcorp.com
123 Business St, New York, NY 10001
"

Extracted customerInfo:
{
  name: "John Doe",
  email: "john.doe@techcorp.com",
  phone: "+1-555-123-4567",
  company: "Tech Corp",
  jobTitle: "Senior Manager",
  address: {
    street: "123 Business St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  }
}
```

### Phone Number Formats
Extract phone numbers in ANY format:
- `+1-555-123-4567`
- `(555) 123-4567`
- `555.123.4567`
- `+44 7700 900123`
- `5551234567`

### Image Signatures
When signature appears to be in an image:

```
{
  hasImageSignature: true,
  customerInfo: {
    // Extract what's available from text portion
  }
}
```

**Detection:**
- Look for image attachments (PNG, JPG, GIF)
- Common signature image filenames: "signature.png", "sig.jpg"
- Note: Image signatures require separate vision processing (GPT-4 Vision)

### Signature Markers
Common phrases indicating start of signature:
- "Thanks"
- "Thank you"
- "Best regards"
- "Regards"
- "Sincerely"
- "Best"
- "Cheers"

---

## 5. MISSING INFORMATION HANDLING

### Only Report MANDATORY Missing Fields

**MANDATORY Fields:**
1. ✅ `destination` - Primary destination city/country
2. ✅ `adults count` - Number of adult travelers
3. ✅ `specific travel dates` - Only if month mentioned but no date (Case 3)
4. ✅ `children ages` - Only if children > 0 but ages not specified

**OPTIONAL Fields (NOT in missingInfo):**
- ❌ `budget amount` - Budget is optional
- ❌ `infants` - Optional, defaults to 0
- ❌ `activities` - Optional preferences
- ❌ `accommodation preferences` - Optional

### Examples

**All Required Fields Present:**
```json
{
  "destination": "Paris",
  "dates": { "flexible": false, "startDate": "2025-12-20", "endDate": "2025-12-27" },
  "travelers": { "adults": 2, "children": 0, "infants": 0 },
  "budget": { "amount": null, "flexible": true },
  "missingInfo": []  // Empty - all required fields present
}
```

**Missing Specific Dates:**
```json
{
  "destination": "Paris",
  "dates": { "flexible": true, "startDate": null, "endDate": null, "duration": 7 },
  "travelers": { "adults": 2, "children": 0, "infants": 0 },
  "missingInfo": ["specific travel dates"]  // Month mentioned but no date
}
```

**Missing Children Ages:**
```json
{
  "destination": "London",
  "dates": { "flexible": false, "startDate": "2025-06-15", "endDate": "2025-06-22" },
  "travelers": { "adults": 2, "children": 3, "childAges": [] },
  "missingInfo": ["children ages"]  // Children count present but ages not specified
}
```

---

## 6. COMPLETE EXTRACTION SCHEMA

```json
{
  "destination": "string (REQUIRED)",
  "additionalDestinations": ["array of other destinations if multi-city"],
  "dates": {
    "flexible": "boolean (true if only month, false if specific dates)",
    "startDate": "YYYY-MM-DD or null",
    "endDate": "YYYY-MM-DD or null", 
    "duration": "number (nights)"
  },
  "travelers": {
    "adults": "number (REQUIRED, minimum 1)",
    "children": "number (REQUIRED, default 0)",
    "childAges": ["array of numbers - REQUIRED if children > 0"],
    "infants": "number (default 0)"
  },
  "budget": {
    "amount": "number or null (OPTIONAL)",
    "currency": "USD|EUR|GBP|INR",
    "flexible": "boolean",
    "perPerson": "boolean"
  },
  "packageType": "honeymoon|family|adventure|luxury|budget|group|solo|business|custom",
  "accommodation": {
    "hotelType": "budget|standard|premium|luxury",
    "starRating": "3|4|5 or null",
    "preferences": ["array"]
  },
  "activities": ["array of requested activities"],
  "specialRequirements": ["array"],
  "customerInfo": {
    "name": "string (REQUIRED - from signature)",
    "email": "string (REQUIRED)",
    "phone": "string or null (any format)",
    "mobile": "string or null",
    "company": "string or null",
    "jobTitle": "string or null",
    "address": {
      "street": "string or null",
      "city": "string or null",
      "state": "string or null",
      "country": "string or null",
      "zipCode": "string or null"
    }
  },
  "urgency": "low|normal|high|urgent",
  "confidence": "0-100",
  "hasImageSignature": "boolean",
  "missingInfo": ["array of ONLY mandatory missing fields"]
}
```

---

## 7. TESTING

Run comprehensive tests:

```bash
cd backend
node test-enhanced-extraction.js
```

This test suite covers:
- ✅ Case 1: Both dates provided
- ✅ Case 2: Start date + duration
- ✅ Case 3: Only month + duration (flexible)
- ✅ Children with/without ages
- ✅ Budget optional handling
- ✅ Image signature detection
- ✅ Various phone number formats
- ✅ Infant vs children separation

---

## 8. BENEFITS

### For Customer Experience
- **Accurate Date Handling**: Correctly interprets flexible vs specific dates
- **Complete Traveler Info**: Captures all traveler details including child ages
- **Flexible Budget**: Doesn't force customers to provide budget
- **Contact Extraction**: Gets complete contact info from signatures

### For Agent Workflow
- **Smart Missing Info**: Only asks for truly required missing fields
- **Better Matching**: More accurate data = better itinerary matching
- **Reduced Follow-ups**: Gets more information in first extraction

### For Business
- **Higher Conversion**: Better initial response quality
- **Time Savings**: Less back-and-forth communication
- **Data Quality**: Consistent, structured customer data
- **Vision Ready**: Prepared for image signature extraction

---

## 9. IMPLEMENTATION STATUS

- ✅ Date parsing rules (all 3 cases)
- ✅ Traveler count rules (adults, children, infants)
- ✅ Children ages requirement
- ✅ Budget optional handling
- ✅ Signature extraction (text)
- ✅ Image signature detection flag
- ✅ Missing info validation
- ✅ Test suite with 6 test cases
- ✅ Current year context (2025)

**Next Steps:**
1. Run test suite to validate all rules
2. Test with real customer emails
3. Implement GPT-4 Vision for image signatures (already has method)
4. Monitor extraction accuracy and adjust prompts as needed

---

## Support
For questions or issues with extraction rules, refer to:
- `backend/src/services/openaiService.js` - Extraction implementation
- `backend/test-enhanced-extraction.js` - Test suite
- `backend/docs/MANDATORY_FIELD_EXTRACTION.md` - Original documentation
