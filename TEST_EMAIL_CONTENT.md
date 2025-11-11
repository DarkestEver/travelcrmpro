# 📧 Test Email Content for Travel CRM

## 🧪 Test Case 1: Missing Information (Auto-Reply Test)

### Email to Send:
```
To: app@travelmanagerpro.com
From: (your personal email)
Subject: Bali Honeymoon Trip

Body:
Hi there,

We're planning our honeymoon to Bali and would love to get some 
package recommendations. We're looking for a romantic beachfront 
resort with good reviews.

We want something luxurious but not too expensive.

Looking forward to hearing from you!

Best regards,
Michael & Sarah
```

### Expected AI Behavior:
- ✅ Category: CUSTOMER
- ✅ Destination: Bali, Indonesia
- ✅ Trip Type: Honeymoon
- ❌ Travel Dates: **MISSING**
- ❌ Number of Travelers: **MISSING** (assumes 2 adults from "honeymoon" context)
- ❌ Budget: Vague ("not too expensive")
- ✅ Accommodation: Beachfront resort

### Expected Workflow:
```
Workflow: ASK_CUSTOMER
Reason: Missing critical information (specific travel dates)

Auto-Reply Should Ask For:
- Specific travel dates (e.g., "December 15-25, 2025")
- Confirm number of travelers
- Optional: Budget range
```

### Expected Auto-Reply (Within 2 minutes):
```
Subject: Re: Bali Honeymoon Trip - A few quick questions

Dear Michael & Sarah,

Thank you so much for reaching out about your Bali honeymoon! 
How exciting - Bali is a perfect destination for a romantic getaway.

We'd love to help you find the perfect beachfront resort. To create 
the best recommendations for you, I just need a few more details:

1. **Travel Dates**: When would you like to travel to Bali? 
   (e.g., December 15-25, 2025)

2. **Duration**: How many nights would you like to stay?

3. **Budget**: What's your approximate budget per person or total 
   budget for the trip?

This information will help us match you with the perfect romantic 
beachfront resort that meets your expectations!

Looking forward to planning your dream honeymoon!

Best regards,
Travel Manager Pro Team
```

---

## 🧪 Test Case 2: Complete Information (Itinerary Match Test)

### Email to Send:
```
To: app@travelmanagerpro.com
From: (your personal email)
Subject: Dubai Trip Request

Body:
Hello,

I'm interested in booking a luxury vacation to Dubai. Here are my 
requirements:

- Destination: Dubai, UAE
- Travel Dates: December 20-27, 2025 (7 nights, 8 days)
- Travelers: 2 adults, 1 child (age 8)
- Budget: $3,000 per person (total $9,000)
- Accommodation: 5-star hotel on or near the beach
- Interests: Shopping, fine dining, desert safari, water activities

Please send me suitable package options.

Thanks,
Robert Johnson
robert.j@email.com
+1-555-0123
```

### Expected AI Behavior:
- ✅ Category: CUSTOMER
- ✅ Destination: Dubai, UAE
- ✅ Travel Dates: December 20-27, 2025
- ✅ Duration: 7 nights, 8 days
- ✅ Travelers: 2 adults, 1 child (8 years)
- ✅ Budget: $3,000 per person ($9,000 total)
- ✅ Accommodation: 5-star, beachfront
- ✅ Interests: Shopping, desert safari, etc.
- ✅ Customer: Robert Johnson, email, phone

### Expected Workflow:
```
Workflow: SEND_ITINERARIES (if matches found with score ≥70%)
         OR
         SEND_ITINERARIES_WITH_NOTE (if moderate matches 50-69%)
         OR
         FORWARD_TO_SUPPLIER (if no good matches)

Auto-Reply Should Include:
- Personalized greeting
- 1-3 matching itineraries with:
  * Title and description
  * Price comparison
  * Match percentage
  * Highlights
- Call to action (book now, request changes, etc.)
```

### Expected Auto-Reply (Within 2 minutes):
```
Subject: Re: Dubai Trip Request - Perfect Itineraries for Your Family

Dear Robert,

Thank you for your inquiry about a Dubai vacation! We're excited 
to help you plan an amazing trip for your family.

Based on your requirements (December 20-27, 2 adults + 1 child, 
$3,000/person budget), here are our top recommendations:

---

🌟 **Dubai Luxury Experience** (95% Match)
📍 5-Star Beachfront Resort
⏰ 7 Nights / 8 Days
💰 $8,950 total ($2,983 per person)

Highlights:
• Premium suite with ocean view
• Daily breakfast buffet
• Desert safari with BBQ dinner
• Dubai Mall shopping experience
• Burj Khalifa observation deck
• Private airport transfers

[View Details] [Book Now]

---

🌟 **Dubai Premium Family Package** (88% Match)
📍 Jumeirah Beach Hotel
⏰ 7 Nights / 8 Days
💰 $9,200 total ($3,067 per person)

Highlights:
• Family-friendly resort
• Wild Wadi Waterpark access
• Kids club activities
• Fine dining experiences
• Desert safari
• City tour included

[View Details] [Book Now]

---

All packages include:
✓ Accommodation
✓ Daily breakfast
✓ Airport transfers
✓ Travel insurance
✓ 24/7 support

Which package interests you most? I'm happy to customize any 
itinerary to perfectly match your preferences!

Best regards,
Travel Manager Pro Team
```

---

## 🧪 Test Case 3: Vague/Minimal Information

### Email to Send:
```
To: app@travelmanagerpro.com
From: (your personal email)
Subject: Paris Trip

Body:
Hi,

Looking for Paris trip next month.

Thanks
```

### Expected AI Behavior:
- ✅ Category: CUSTOMER
- ✅ Destination: Paris, France
- ❌ Travel Dates: Vague ("next month")
- ❌ Duration: MISSING
- ❌ Travelers: MISSING
- ❌ Budget: MISSING

### Expected Workflow:
```
Workflow: ASK_CUSTOMER
Reason: Multiple critical fields missing

Auto-Reply Should Ask For:
- Specific travel dates
- Duration (how many days/nights)
- Number of travelers (adults/children)
- Budget range
- Interests/preferences
```

---

## 🧪 Test Case 4: Multi-Destination Request

### Email to Send:
```
To: app@travelmanagerpro.com
From: (your personal email)
Subject: Southeast Asia Tour Package

Body:
Good morning,

We're a group of 6 adults planning a 3-week tour of Southeast Asia.

We want to visit:
1. Thailand (Bangkok, Phuket) - 7 days
2. Vietnam (Hanoi, Ho Chi Minh, Halong Bay) - 7 days
3. Cambodia (Siem Reap) - 4 days
4. Singapore - 3 days

Travel Period: February 10 - March 3, 2026
Budget: Around $2,500-3,000 per person
Accommodation: Mid-range to upscale (3-4 star)

We're interested in cultural experiences, local cuisine, and some 
beach time. We prefer guided tours with some free time.

Can you provide a complete package with flights, hotels, transfers, 
and key activities?

Thank you,
Amanda Wilson
Group Coordinator
```

### Expected AI Behavior:
- ✅ Category: CUSTOMER
- ✅ Destinations: Thailand, Vietnam, Cambodia, Singapore (multi-destination)
- ✅ Travel Dates: February 10 - March 3, 2026
- ✅ Duration: 21 days/20 nights
- ✅ Travelers: 6 adults
- ✅ Budget: $2,500-3,000 per person ($15,000-18,000 total)
- ✅ Accommodation: 3-4 star
- ✅ Interests: Culture, food, beach, guided tours

### Expected Workflow:
```
Workflow: FORWARD_TO_SUPPLIER (likely)
Reason: Complex multi-destination request requiring custom quote

Auto-Reply Should Say:
- Acknowledge the detailed request
- Explain this requires custom planning
- Indicate timeline for response (24-48 hours)
- Confirm all details understood
- Assign to travel specialist
```

---

## 🧪 Test Case 5: Reply to Auto-Reply (Conversation Test)

### Initial Email:
```
Subject: Santorini Trip
Body: I want to go to Santorini for my anniversary
```

### After Auto-Reply Asks for Dates:

### Your Reply:
```
Subject: Re: Santorini Trip - A few quick questions
Body: 
Hi,

Thanks for getting back to me!

We'd like to travel June 15-22, 2026 (7 nights).
It's just my wife and me (2 adults).
Budget is flexible, around $4,000-5,000 total.

Looking for a romantic hotel with caldera views and 
good restaurants nearby.

Best,
John
```

### Expected AI Behavior:
- ✅ Recognizes as reply (inReplyTo header)
- ✅ Links to original email thread
- ✅ Extracts updated information:
  * Dates: June 15-22, 2026
  * Travelers: 2 adults
  * Budget: $4,000-5,000 total
  * Preferences: Caldera view, romantic, restaurants
- ✅ NOW has complete information
- ✅ Workflow: SEND_ITINERARIES

### Expected Auto-Reply:
Should now send matching Santorini packages since all info is complete.

---

## 🧪 Test Case 6: Manual Reply Test (UI Test)

### Scenario:
1. Send Test Case 1 (Bali Honeymoon - missing info)
2. AI auto-replies asking for dates
3. **BEFORE customer replies**, operator manually replies from UI

### Manual Reply from UI:
```
Subject: Re: Bali Honeymoon Trip
Body:
Hi Michael & Sarah,

Thank you for your interest in Bali! I'm Emma, your personal 
travel consultant.

I noticed you're planning a honeymoon - how wonderful! I'd love 
to help you create the perfect romantic getaway.

Could you please share:
- Your preferred travel dates
- How many nights you'd like to stay
- Your budget range

I have some exclusive honeymoon packages with private pool villas 
that might interest you!

Let's schedule a quick call to discuss your dream honeymoon.

Best regards,
Emma Thompson
Senior Travel Consultant
Travel Manager Pro
emma@travelmanagerpro.com
+1-555-0199
```

### Expected Behavior:
1. ✅ Email marked as `manuallyReplied: true`
2. ✅ Button changes to "Reply Again" (gray)
3. ✅ When customer replies, AI processes BUT doesn't auto-send
4. ✅ Operator can see AI suggestion in UI
5. ✅ Operator manually sends follow-up

---

## 📋 Quick Test Email Templates

### Template A: Missing Dates
```
To: app@travelmanagerpro.com
Subject: Maldives Honeymoon
Body: Planning honeymoon to Maldives. Want overwater villa. Budget $5000 total.
```

### Template B: Missing Travelers
```
To: app@travelmanagerpro.com
Subject: Tokyo Trip
Body: Flying to Tokyo December 1-10, 2025. Need hotel and activities. Budget $2000 per person.
```

### Template C: Missing Destination
```
To: app@travelmanagerpro.com
Subject: Beach Vacation
Body: Looking for tropical beach vacation in January 2026. 2 adults, 5 nights. Budget $3500.
```

### Template D: Complete Info
```
To: app@travelmanagerpro.com
Subject: Barcelona Family Vacation
Body: Family of 4 (2 adults, 2 kids ages 10 & 12) traveling to Barcelona July 15-25, 2026. Need 4-star hotel near city center. Budget $4000 total. Interested in Sagrada Familia, Park Guell, beach day, food tours.
```

---

## ✅ Testing Checklist

### Backend Tests:
- [ ] Backend started: `cd backend && npm start`
- [ ] See log: "✅ Email polling cron job initialized"
- [ ] See log: "📝 Using in-memory queue"
- [ ] Every 2 min: "⏰ Email polling cron job triggered"

### Email Receiving Tests:
- [ ] Send Test Case 1 (Missing Info)
- [ ] Wait 2 minutes max
- [ ] Check backend logs: "✅ Fetched X new email(s)"
- [ ] Check UI: Email appears in dashboard
- [ ] Click email: See extracted data

### Auto-Reply Tests:
- [ ] Backend log: "Step 6: Sending response email..."
- [ ] Backend log: "📤 Sending auto-reply via tenant SMTP"
- [ ] Backend log: "✅ Auto-reply sent to..."
- [ ] Check customer inbox: Reply received
- [ ] Check reply From: "Travel Manager Pro <app@travelmanagerpro.com>"
- [ ] Check reply asks for missing info

### Complete Info Tests:
- [ ] Send Test Case 2 (Complete Info)
- [ ] Auto-reply presents matching itineraries
- [ ] Or asks supplier if no matches

### Manual Reply Tests:
- [ ] Open email in UI
- [ ] Click "Reply" button
- [ ] See modal with AI suggestion
- [ ] Edit message
- [ ] Click "Send Reply"
- [ ] Toast: "Reply sent successfully!"
- [ ] Button: "Reply Again" (gray)
- [ ] Check customer inbox: Manual reply received

### Conversation Tests:
- [ ] Customer replies to auto-reply
- [ ] Email linked to thread
- [ ] AI processes new info
- [ ] If complete: sends itineraries
- [ ] If manually replied before: AI skips auto-send

---

## 🎯 Success Criteria

✅ **IMAP Polling**: Fetches emails every 2 minutes  
✅ **AI Categorization**: Correctly identifies CUSTOMER emails  
✅ **AI Extraction**: Extracts all provided fields  
✅ **Missing Info Detection**: Identifies what's missing  
✅ **Auto-Reply**: Sends within 2 minutes via tenant SMTP  
✅ **Personalization**: Uses customer name in greeting  
✅ **Email Threading**: Maintains conversation chain  
✅ **Manual Override**: Skips auto-send if operator replied  
✅ **UI Reply**: Can send manual reply from dashboard  
✅ **Status Tracking**: Shows processing status in UI  

---

## 📧 Email Addresses to Use

**Send TO:** `app@travelmanagerpro.com`  
**Send FROM:** Your personal email (Gmail, Outlook, etc.)

**Important:** Use a real email address you can check to verify auto-replies!

---

## 🚀 Ready to Test!

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Send Test Email**: Copy any template above
4. **Wait**: Max 2 minutes for auto-reply
5. **Check UI**: `http://localhost:5173/emails`
6. **Check Inbox**: Look for auto-reply
7. **Test Manual Reply**: Click email → Reply button
8. **Send Customer Reply**: Reply to auto-reply email

Good luck! 🎉
