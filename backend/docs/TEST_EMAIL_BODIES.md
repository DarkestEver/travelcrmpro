# Test Email Bodies for Enhanced Extraction

## 📧 Test Email Templates

Send these emails to your configured email address to test the extraction system.

---

## Test 1: Complete Email with Specific Dates (Case 1)
**Purpose:** Test both dates provided + dynamic year (2025)

**Subject:** Paris Family Vacation Inquiry

**Body:**
```
Hi,

I'm interested in planning a family trip to Paris from December 20-27. We are 2 adults and 2 children aged 8 and 12 years old.

Our budget is around $8,000 total for the entire trip.

We'd prefer 4-star hotels near the Eiffel Tower, and we're interested in sightseeing tours and museum visits.

Looking forward to your suggestions!

Best regards,
Sarah Johnson
Senior Marketing Manager
Tech Innovations Inc.
Phone: +1-555-123-4567
Email: sarah.johnson@techinnovations.com
123 Business Avenue, Suite 500
New York, NY 10001
```

**Expected Extraction:**
```json
{
  "destination": "Paris",
  "dates": {
    "flexible": false,
    "startDate": "2025-12-20",
    "endDate": "2025-12-27",
    "duration": 7
  },
  "travelers": {
    "adults": 2,
    "children": 2,
    "childAges": [8, 12],
    "infants": 0
  },
  "budget": {
    "amount": 8000,
    "currency": "USD",
    "flexible": true,
    "perPerson": false
  },
  "customerInfo": {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@techinnovations.com",
    "phone": "+1-555-123-4567",
    "company": "Tech Innovations Inc.",
    "jobTitle": "Senior Marketing Manager"
  },
  "missingInfo": []
}
```

---

## Test 2: Start Date + Duration (Case 2)
**Purpose:** Test date calculation from start date + nights

**Subject:** Bali Honeymoon Package

**Body:**
```
Hello,

My fiancé and I are planning our honeymoon to Bali starting March 15 for 10 nights.

We're looking for a romantic, luxury experience. Budget is flexible, around $5,000 per person.

We love beaches, spa treatments, and cultural experiences.

Thanks,
Michael Chen
(555) 987-6543
michael.chen@email.com
```

**Expected Extraction:**
```json
{
  "destination": "Bali",
  "dates": {
    "flexible": false,
    "startDate": "2025-03-15",
    "endDate": "2025-03-25",
    "duration": 10
  },
  "travelers": {
    "adults": 2,
    "children": 0,
    "infants": 0
  },
  "budget": {
    "amount": 5000,
    "currency": "USD",
    "flexible": true,
    "perPerson": true
  },
  "packageType": "honeymoon",
  "missingInfo": []
}
```

---

## Test 3: Flexible Dates - Month Only (Case 3)
**Purpose:** Test flexible dates when only month mentioned

**Subject:** Dubai Trip Inquiry

**Body:**
```
Hi there,

We're interested in visiting Dubai sometime in April for about 5 days.

We are 2 adults traveling. No specific dates yet, we're flexible.

Budget around €4,000 total.

Please share available packages.

Regards,
Emma Wilson
emma.w@email.com
+44 7700 900123
```

**Expected Extraction:**
```json
{
  "destination": "Dubai",
  "dates": {
    "flexible": true,
    "startDate": null,
    "endDate": null,
    "duration": 5
  },
  "travelers": {
    "adults": 2,
    "children": 0,
    "infants": 0
  },
  "budget": {
    "amount": 4000,
    "currency": "EUR",
    "flexible": true,
    "perPerson": false
  },
  "missingInfo": ["specific travel dates"]
}
```

---

## Test 4: Children Without Ages
**Purpose:** Test missing info detection for child ages

**Subject:** London Family Trip

**Body:**
```
Hello,

Planning a trip to London from June 15-22, 2025.

We are 2 adults and 3 children.

Budget is $10,000 total.

Best regards,
Robert Taylor
robert.t@email.com
555-444-3333
```

**Expected Extraction:**
```json
{
  "destination": "London",
  "dates": {
    "flexible": false,
    "startDate": "2025-06-15",
    "endDate": "2025-06-22",
    "duration": 7
  },
  "travelers": {
    "adults": 2,
    "children": 3,
    "childAges": [],
    "infants": 0
  },
  "budget": {
    "amount": 10000,
    "currency": "USD",
    "flexible": false,
    "perPerson": false
  },
  "missingInfo": ["children ages"]
}
```

---

## Test 5: No Budget (Optional Field)
**Purpose:** Test that budget is optional

**Subject:** Tokyo Adventure

**Body:**
```
Hi,

Interested in a Tokyo trip from August 5-12, 2025.

Just 2 adults traveling.

Please share what packages you have available.

Thank you,
Lisa Anderson
(555) 222-1111
lisa.anderson@email.com
```

**Expected Extraction:**
```json
{
  "destination": "Tokyo",
  "dates": {
    "flexible": false,
    "startDate": "2025-08-05",
    "endDate": "2025-08-12",
    "duration": 7
  },
  "travelers": {
    "adults": 2,
    "children": 0,
    "infants": 0
  },
  "budget": {
    "amount": null,
    "currency": "USD",
    "flexible": true,
    "perPerson": false
  },
  "missingInfo": []
}
```

---

## Test 6: With Infant (Not Children)
**Purpose:** Test infant separation from children

**Subject:** Maldives Family Holiday

**Body:**
```
Hello,

We'd like to visit Maldives from February 10 for 7 nights.

Travelers: 2 adults and 1 infant (8 months old).

Budget: $12,000 total.

Looking for family-friendly resorts.

Regards,
David Kim
david.kim@email.com
+1 (555) 888-9999
```

**Expected Extraction:**
```json
{
  "destination": "Maldives",
  "dates": {
    "flexible": false,
    "startDate": "2025-02-10",
    "endDate": "2025-02-17",
    "duration": 7
  },
  "travelers": {
    "adults": 2,
    "children": 0,
    "infants": 1
  },
  "budget": {
    "amount": 12000,
    "currency": "USD",
    "flexible": false,
    "perPerson": false
  },
  "packageType": "family",
  "missingInfo": []
}
```

---

## 📝 How to Verify Results

### Step 1: Send Test Email
Send any of the above emails to your configured email address for the tenant.

### Step 2: Check Email Processing
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const EmailLog = require('./src/models/EmailLog');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/travel-crm');
  
  const emails = await EmailLog.find({ 
    direction: 'incoming',
    'aiProcessing.status': 'completed'
  })
  .sort({ createdAt: -1 })
  .limit(1);
  
  if (emails.length > 0) {
    console.log('Latest Email:');
    console.log('From:', emails[0].from.email);
    console.log('Subject:', emails[0].subject);
    console.log('\\nExtracted Data:');
    console.log(JSON.stringify(emails[0].aiProcessing.extractedData, null, 2));
    console.log('\\nMissing Info:', emails[0].aiProcessing.extractedData?.missingInfo || []);
  } else {
    console.log('No processed emails found');
  }
  
  await mongoose.disconnect();
})();
"
```

### Step 3: Check AI Processing Logs
```bash
node -e "
const mongoose = require('mongoose');
const AIProcessingLog = require('./src/models/AIProcessingLog');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/travel-crm');
  
  const logs = await AIProcessingLog.find({ 
    processingType: 'extraction',
    status: 'completed'
  })
  .sort({ createdAt: -1 })
  .limit(1);
  
  if (logs.length > 0) {
    const log = logs[0];
    console.log('AI Processing Log:');
    console.log('Model:', log.model);
    console.log('Tokens:', log.totalTokens);
    console.log('Cost: $', log.estimatedCost.toFixed(4));
    console.log('\\nPrompt Preview:');
    console.log(log.prompt.substring(0, 500) + '...');
    console.log('\\nExtracted Result:');
    console.log(JSON.stringify(log.result, null, 2));
  }
  
  await mongoose.disconnect();
})();
"
```

### Step 4: Verify Dynamic Year in Prompt
```bash
node -e "
const mongoose = require('mongoose');
const AIProcessingLog = require('./src/models/AIProcessingLog');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/travel-crm');
  
  const logs = await AIProcessingLog.find({ 
    processingType: 'extraction'
  })
  .sort({ createdAt: -1 })
  .limit(1);
  
  if (logs.length > 0) {
    const prompt = logs[0].prompt;
    
    // Check if current year (2025) is in the prompt
    if (prompt.includes('Current year is 2025')) {
      console.log('✅ Dynamic year is working!');
      console.log('✅ Prompt contains: \"Current year is 2025\"');
    } else {
      console.log('❌ Dynamic year not found in prompt');
    }
    
    // Extract the date parsing rules section
    const dateRulesMatch = prompt.match(/2\. DATE PARSING RULES:.*?3\. TRAVELER/s);
    if (dateRulesMatch) {
      console.log('\\nDate Parsing Rules from Prompt:');
      console.log(dateRulesMatch[0].substring(0, 400));
    }
  }
  
  await mongoose.disconnect();
})();
"
```

---

## 🎯 What to Look For

### ✅ Success Indicators:

1. **Dynamic Year (2025)**
   - All dates without year should use 2025
   - Check prompt contains "Current year is 2025"

2. **Date Parsing**
   - Case 1: Both dates extracted correctly
   - Case 2: End date calculated from start + duration
   - Case 3: Flexible=true when only month mentioned

3. **Travelers**
   - Children separated from infants
   - Child ages extracted when mentioned
   - Missing info includes "children ages" if not provided

4. **Budget**
   - Can be null (optional)
   - Not in missingInfo when not mentioned
   - Currency detected correctly

5. **Signature Extraction**
   - Name extracted
   - Phone extracted (any format)
   - Email, company, job title extracted

---

## 💡 Quick Test

**Use this simple one for quick testing:**

**Subject:** Test Email - Paris Trip

**Body:**
```
Hi,

I want to visit Paris from December 20 for 7 nights with my family of 4 (kids are 6 and 9 years old). Budget is $6,000.

Thanks,
John Doe
john@email.com
555-1234
```

**Expected:**
- Destination: Paris
- Start: 2025-12-20
- End: 2025-12-27 (calculated)
- Adults: 2, Children: 2, Ages: [6, 9]
- Budget: 6000 USD
- No missing info

---

**Send any of these test emails and check the results!** 🚀
