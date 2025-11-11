# Mandatory Field Extraction - Implementation Guide

## 🎯 Overview
This document explains the mandatory fields required for proper customer inquiry processing and itinerary matching in the Travel CRM system.

---

## 📋 Mandatory Fields

These fields are **REQUIRED** for the system to process customer inquiries and match them with itineraries:

### 1. **Destination** ✈️
- **Field**: `destination`
- **Type**: String
- **Example**: "Paris", "France", "Tokyo, Japan"
- **Validation**: Must not be null or empty
- **Why Required**: Cannot search for itineraries without knowing where the customer wants to go

### 2. **Travel Start Date** 📅
- **Field**: `dates.startDate`
- **Type**: String (YYYY-MM-DD format)
- **Example**: "2025-12-20"
- **Validation**: Must be a valid date
- **Why Required**: Needed to check itinerary availability and calculate duration

### 3. **Travel End Date** 📅
- **Field**: `dates.endDate`
- **Type**: String (YYYY-MM-DD format)
- **Example**: "2025-12-27"
- **Validation**: Must be a valid date, must be after startDate
- **Why Required**: Needed to calculate trip duration and match with itinerary length

### 4. **Number of Adults** 👥
- **Field**: `travelers.adults`
- **Type**: Number
- **Example**: 2
- **Validation**: Must be >= 1
- **Why Required**: Needed to check itinerary capacity and calculate pricing

### 5. **Budget Amount** 💰
- **Field**: `budget.amount`
- **Type**: Number
- **Example**: 8000
- **Validation**: Must be > 0
- **Why Required**: Needed to filter itineraries within customer's budget range

---

## 📊 Validation Logic

The validation is performed in `itineraryMatchingService.js`:

```javascript
validateRequiredFields(extractedData) {
  const requiredFields = {
    destination: 'Destination (where they want to go)',
    'dates.startDate': 'Travel start date',
    'dates.endDate': 'Travel end date',
    'travelers.adults': 'Number of adult travelers',
    'budget.amount': 'Budget amount'
  };
  
  // Returns:
  // - isValid: boolean (true if all fields present)
  // - completeness: 0-1 (percentage of fields present)
  // - missingFields: array (list of missing fields)
}
```

---

## 🤖 AI Extraction Improvements

The AI extraction prompt in `openaiService.js` has been enhanced with:

### 1. **Explicit Field Requirements**
```
CRITICAL INSTRUCTIONS:
1. MANDATORY FIELDS - These MUST be extracted if present in the email:
   - destination: The city/country they want to visit
   - dates.startDate: Specific departure date in YYYY-MM-DD format
   - dates.endDate: Specific return date in YYYY-MM-DD format
   - travelers.adults: Number of adults
   - travelers.children: Number of children
   - budget.amount: Total budget amount as a number
```

### 2. **Date Parsing Rules**
- Converts relative dates: "December 20-27, 2025" → "2025-12-20" to "2025-12-27"
- Handles various date formats
- Uses year 2025 if not specified
- Calculates duration automatically

### 3. **Traveler Count Rules**
- "family of 4" → 2 adults + 2 children
- "couple" → 2 adults, 0 children
- "we are 2" → 2 adults, 0 children
- Extracts exact numbers when specified

### 4. **Budget Rules**
- Extracts total amount: "$8,000 total" → amount: 8000, perPerson: false
- Extracts per person: "$2,000 per person" → amount: 2000, perPerson: true
- Detects currency: $ = USD, € = EUR, £ = GBP, ₹ = INR

---

## 📧 Example Email Processing

### Input Email:
```
Hi, we're a family of 4 looking to visit Paris from
December 20-27, 2025. Budget is around $8,000 total.
We'd like hotel near Eiffel Tower and some sightseeing
tours. Can you help us plan this trip?

Thanks,
John Doe
john@example.com
+1-555-1234
```

### Expected Extraction:
```json
{
  "destination": "Paris",
  "dates": {
    "startDate": "2025-12-20",
    "endDate": "2025-12-27",
    "duration": 7,
    "flexible": false
  },
  "travelers": {
    "adults": 2,
    "children": 2,
    "childAges": [],
    "infants": 0
  },
  "budget": {
    "amount": 8000,
    "currency": "USD",
    "flexible": true,
    "perPerson": false
  },
  "accommodation": {
    "preferences": ["near Eiffel Tower"]
  },
  "activities": ["sightseeing tours"],
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234"
  }
}
```

### Validation Result:
```json
{
  "isValid": true,
  "completeness": 1.0,
  "missingFields": [],
  "hasRequiredFields": {
    "destination": true,
    "dates": true,
    "travelers": true,
    "budget": true
  }
}
```

---

## 🔄 Workflow Decision Logic

Based on mandatory field validation:

### Scenario 1: All Fields Present ✅
```javascript
{
  isValid: true,
  completeness: 1.0 (100%)
}
→ Action: SEND_ITINERARIES or FORWARD_TO_SUPPLIER
```

### Scenario 2: Missing 1-2 Fields ⚠️
```javascript
{
  isValid: false,
  completeness: 0.6-0.8 (60-80%)
}
→ Action: ASK_CUSTOMER (request missing info)
```

### Scenario 3: Missing 3+ Fields ❌
```javascript
{
  isValid: false,
  completeness: 0-0.4 (0-40%)
}
→ Action: ASK_CUSTOMER (request all missing info)
```

---

## 🧪 Testing

Run the test script to validate extraction:

```bash
node test-mandatory-field-extraction.js
```

This will:
1. ✅ Test AI extraction with sample email
2. ✅ Validate mandatory fields
3. ✅ Show what's extracted vs what's missing
4. ✅ Display workflow decision
5. ✅ Show cost and confidence scores

---

## 🐛 Troubleshooting

### Problem: Fields not extracted properly
**Solution**: 
1. Check OpenAI API key is configured
2. Verify prompt in `openaiService.js`
3. Review AI processing logs in database
4. Check `missingInfo` array in extracted data

### Problem: Dates not in correct format
**Solution**:
- AI should convert to YYYY-MM-DD format
- If not, update the date parsing rules in prompt
- Verify date is present in email body

### Problem: Traveler count incorrect
**Solution**:
- Review traveler count rules in prompt
- Check if email has ambiguous phrasing
- Update extraction logic for edge cases

### Problem: Budget not extracted
**Solution**:
- Ensure budget mentions number: "$8,000" not just "reasonable budget"
- Check currency detection logic
- Verify perPerson vs total budget distinction

---

## 📈 Monitoring

Track extraction quality:

```javascript
// Check AI processing logs
AIProcessingLog.find({
  processingType: 'extraction',
  status: 'completed'
}).sort({ createdAt: -1 });

// Check emails with missing fields
EmailLog.find({
  'extractedData.missingInfo.0': { $exists: true }
});

// Track validation completeness
EmailLog.aggregate([
  { $group: {
    _id: null,
    avgCompleteness: { $avg: '$itineraryMatching.validation.completeness' }
  }}
]);
```

---

## ✅ Best Practices

1. **Always validate** extracted data before processing
2. **Ask customer** for missing critical information
3. **Track costs** of AI extraction calls
4. **Monitor confidence** scores (aim for >80%)
5. **Log failures** for prompt improvement
6. **Test regularly** with real customer emails

---

## 🔗 Related Files

- `backend/src/services/openaiService.js` - AI extraction logic
- `backend/src/services/itineraryMatchingService.js` - Validation logic
- `backend/test-mandatory-field-extraction.js` - Test script
- `backend/src/models/EmailLog.js` - Data storage schema

---

**Last Updated**: November 11, 2025
**Version**: 2.0 (Enhanced Mandatory Field Extraction)
