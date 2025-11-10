# Itinerary JSON Import Feature

## Overview
This feature allows users to import complete itineraries from JSON files or pasted JSON data. This is useful for:
- Migrating data from other systems
- Bulk importing itineraries
- Template sharing between teams
- Backup and restore functionality

## JSON Schema

### Required Fields
```json
{
  "title": "string (required)"
}
```

### Complete Schema Example
```json
{
  "title": "Amazing Bali Adventure",
  "overview": "7-day cultural and nature tour of Bali",
  "destination": {
    "country": "Indonesia",
    "city": "Bali",
    "coordinates": {
      "latitude": -8.3405,
      "longitude": 115.0920
    }
  },
  "startDate": "2024-03-15",
  "endDate": "2024-03-22",
  "numberOfDays": 8,
  "numberOfNights": 7,
  "budget": {
    "amount": 1500,
    "currency": "USD"
  },
  "travelStyle": "Adventure",
  "difficulty": "Moderate",
  "groupSize": {
    "min": 2,
    "max": 8
  },
  "themes": ["Cultural", "Nature", "Beach"],
  "tags": ["bali", "indonesia", "adventure"],
  "inclusions": [
    "Airport transfers",
    "7 nights accommodation",
    "Daily breakfast"
  ],
  "exclusions": [
    "International flights",
    "Travel insurance",
    "Personal expenses"
  ],
  "days": [
    {
      "dayNumber": 1,
      "title": "Arrival in Bali",
      "date": "2024-03-15",
      "overview": "Welcome to Bali! Transfer to hotel and relax.",
      "accommodation": {
        "name": "Bali Beach Resort",
        "type": "Hotel",
        "rating": 4.5,
        "checkIn": "14:00",
        "checkOut": "12:00"
      },
      "meals": {
        "breakfast": true,
        "lunch": false,
        "dinner": true
      },
      "components": [
        {
          "type": "Activity",
          "title": "Airport Transfer",
          "description": "Private transfer from airport to hotel",
          "startTime": "14:00",
          "duration": 60,
          "location": {
            "name": "Ngurah Rai International Airport",
            "address": "Bali, Indonesia",
            "coordinates": {
              "latitude": -8.7467,
              "longitude": 115.1668
            }
          },
          "cost": {
            "amount": 25,
            "currency": "USD"
          }
        },
        {
          "type": "Activity",
          "title": "Welcome Dinner",
          "description": "Traditional Balinese dinner at the hotel",
          "startTime": "19:00",
          "duration": 120,
          "location": {
            "name": "Bali Beach Resort Restaurant"
          }
        }
      ]
    }
  ]
}
```

## Field Descriptions

### Root Level
- **title** (required): Name of the itinerary
- **overview**: Brief description
- **destination**: Object with country, city, and optional coordinates
- **startDate**: ISO date string (YYYY-MM-DD)
- **endDate**: ISO date string
- **numberOfDays**: Total days
- **numberOfNights**: Total nights
- **budget**: Object with amount and currency
- **travelStyle**: e.g., "Adventure", "Luxury", "Budget", "Family"
- **difficulty**: "Easy", "Moderate", "Challenging"
- **groupSize**: Object with min and max
- **themes**: Array of theme strings
- **tags**: Array of tag strings
- **inclusions**: Array of included items
- **exclusions**: Array of excluded items
- **status**: "draft" (default), "published", "archived"

### Days Array
Each day object can include:
- **dayNumber**: Sequential number
- **title**: Day title
- **date**: ISO date string
- **overview**: Day description
- **accommodation**: Hotel/lodging details
- **meals**: Object with breakfast, lunch, dinner booleans
- **components**: Array of activities

### Components Array
Each component can include:
- **type**: "Activity", "Transportation", "Meal", "Accommodation"
- **title**: Component name
- **description**: Details
- **startTime**: HH:MM format
- **duration**: Minutes
- **location**: Object with name, address, coordinates
- **cost**: Object with amount and currency
- **notes**: Additional information

## How to Use

### Via UI
1. Navigate to Itineraries page
2. Click "Import JSON" button
3. Either:
   - Upload a .json file
   - Paste JSON directly into the text area
4. The system will validate the JSON in real-time
5. Preview the itinerary details
6. Click "Import Itinerary"
7. You'll be redirected to the builder to edit further

### Via API
```javascript
POST /api/v1/itineraries/import
Content-Type: application/json
Authorization: Bearer <token>

{
  "itineraryData": {
    "title": "My Itinerary",
    // ... rest of the fields
  }
}
```

## Validation Rules

1. **Title is required** - Every itinerary must have a title
2. **IDs are stripped** - All _id fields are removed to create new documents
3. **Days are renumbered** - dayNumber is recalculated from 1
4. **Tenant/User assigned** - tenantId and createdBy are set from the authenticated user
5. **Status defaults to draft** - Unless specified
6. **Not a template** - Imported itineraries are regular itineraries, not templates

## Error Handling

The system provides clear error messages for:
- Invalid JSON syntax
- Missing required fields
- Invalid date formats
- Invalid enum values (status, travelStyle, difficulty)

## Auto-Archive Cron Job

A background cron job runs daily at 2:00 AM to automatically archive itineraries where:
- `endDate` < today
- `status` != "archived"
- `isArchived` != true

Archived itineraries get:
- `status` = "archived"
- `isArchived` = true
- `archivedAt` = current timestamp
- `archivedBy` = "system"
- `archiveReason` = "Auto-archived: End date passed"

## Best Practices

1. **Include all dates** for proper scheduling
2. **Use consistent date formats** (ISO 8601)
3. **Set realistic budgets** with correct currency
4. **Organize components** logically within days
5. **Add location coordinates** for mapping features
6. **Include duration** for all activities
7. **Validate JSON** before importing

## Example Use Cases

### 1. Template Library
Export popular itineraries as JSON files to create a template library

### 2. Backup Strategy
Regularly export itineraries to JSON for backup purposes

### 3. Agency Collaboration
Share itinerary designs with partner agencies via JSON

### 4. System Migration
Import existing itineraries from legacy systems

### 5. Bulk Creation
Create multiple similar itineraries programmatically
