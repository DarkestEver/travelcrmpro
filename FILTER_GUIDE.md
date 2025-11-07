# Itinerary Filters - Quick Reference Guide

## Filter Panel Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Itineraries                                  [🔍 Filters]   │
│ Create and manage travel itineraries        [...buttons]   │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬───────────────────────────────────────────┐
│                │                                           │
│  FILTER PANEL  │         ITINERARIES TABLE                │
│  (300px wide)  │         (Flexible width)                 │
│                │                                           │
│  ┌──────────┐  │  ┌─────────────────────────────────────┐│
│  │ Filters  │  │  │ Title | Duration | Status | Actions ││
│  │  Active  │  │  ├─────────────────────────────────────┤│
│  │Clear All │  │  │ Bali Trip | 8D/7N | Published | ... ││
│  └──────────┘  │  │ Thailand | 5D/4N | Draft     | ... ││
│                │  │ Europe   | 14D/13N| Published | ... ││
│  ▼ Status     │  │  ...                                 ││
│  ☑ Draft      │  │                                       ││
│  ☑ Published  │  │  [Pagination: 1 2 3 >]              ││
│  ☐ Archived   │  └─────────────────────────────────────┘│
│                │                                           │
│  ▼ Travel Style│                                           │
│  ☑ Adventure   │                                           │
│  ☑ Luxury      │                                           │
│  ☐ Budget      │                                           │
│  ☐ Family      │                                           │
│  ☐ Solo        │                                           │
│                │                                           │
│  ▲ Difficulty  │  (Collapsed)                             │
│  ▲ Date Range  │  (Collapsed)                             │
│  ▲ Budget      │  (Collapsed)                             │
│  ▼ Destination │                                           │
│  [Country__]   │                                           │
│  [City_____]   │                                           │
│                │                                           │
└────────────────┴───────────────────────────────────────────┘
```

## Action Buttons in Table

Each itinerary row has these action buttons:

```
┌────────────────────────────────────────────────────┐
│ Actions                                            │
├────────────────────────────────────────────────────┤
│ 🔧 Build     (Blue)    - Open itinerary builder   │
│ 👁 Preview   (Green)   - Preview itinerary         │
│ ⬇ Export     (Indigo)  - Download as JSON         │
│ 📄 PDF       (Purple)  - Download as PDF           │
│ ✏ Edit       (Blue)    - Edit basic info          │
│ 🗑 Delete    (Red)     - Delete itinerary         │
└────────────────────────────────────────────────────┘
```

## Filter Categories

### 1. Status (Multi-select)
```
☑ Draft      - In progress, not published
☑ Published  - Live and visible
☐ Archived   - Ended or inactive
```

### 2. Travel Style (Multi-select)
```
☑ Adventure  - Active, outdoor activities
☑ Luxury     - High-end, premium experience
☐ Budget     - Cost-effective options
☐ Family     - Family-friendly
☐ Solo       - Individual travelers
☐ Group      - Group tours
☐ Honeymoon  - Romantic getaways
☐ Business   - Business travel
```

### 3. Difficulty (Multi-select)
```
☐ Easy        - Relaxed pace, minimal physical activity
☑ Moderate    - Some walking, moderate activities
☐ Challenging - Strenuous, requires good fitness
```

### 4. Date Range
```
Start Date From: [2024-01-01▼]
Start Date To:   [2024-12-31▼]

Use case: Find trips starting between specific dates
```

### 5. Budget Range
```
Currency:   [USD ▼]
Min Budget: [1000    ]
Max Budget: [5000    ]

Available: USD, EUR, GBP, INR, AUD
```

### 6. Destination
```
Country: [Thailand______]
City:    [Bangkok_______]

Partial text search supported
```

### 7. Themes (Multi-select)
```
☑ Cultural     - Museums, heritage, local culture
☑ Nature       - Natural landscapes, parks
☐ Beach        - Coastal, seaside
☐ Wildlife     - Safari, animal watching
☐ Historical   - Ancient sites, monuments
☐ Food & Wine  - Culinary experiences
☐ Photography  - Photo-focused tours
☐ Wellness     - Spa, yoga, relaxation
```

### 8. Duration (Days)
```
Min Days: [5  ]
Max Days: [10 ]

Range: 1 to 365 days
```

## Filter Combinations Examples

### Example 1: Luxury Beach Vacations
```
✓ Travel Style: Luxury
✓ Themes: Beach, Wellness
✓ Budget: Min 3000, Max 10000, USD
✓ Duration: Min 7, Max 14 days
```

### Example 2: Budget Adventure Trips
```
✓ Travel Style: Budget, Adventure
✓ Themes: Nature, Wildlife
✓ Budget: Min 500, Max 2000, USD
✓ Difficulty: Moderate, Challenging
```

### Example 3: Family Cultural Tours
```
✓ Travel Style: Family
✓ Themes: Cultural, Historical
✓ Difficulty: Easy
✓ Duration: Min 5, Max 10 days
```

### Example 4: Upcoming Business Trips
```
✓ Travel Style: Business
✓ Status: Published
✓ Date Range: Today → Next 90 days
✓ Destination: Specific city
```

## Export Workflow

```
1. Locate itinerary in table
        ↓
2. Click Export JSON button (indigo ⬇)
        ↓
3. Browser downloads file automatically
        ↓
4. File saved as: itinerary_title.json
        ↓
5. Success notification appears
```

### Example Export Filename
```
Input:  "Amazing Bali Adventure 2024"
Output: "amazing_bali_adventure_2024.json"
```

## Import Workflow

```
1. Click "Import JSON" button in header
        ↓
2. Choose import method:
   a) Upload .json file (drag & drop)
   b) Paste JSON text directly
        ↓
3. Real-time validation
   - ✓ Valid JSON → Green border
   - ✗ Invalid   → Red border + error message
        ↓
4. Preview shows:
   - Title
   - Destination
   - Number of days
   - Budget
        ↓
5. Click "Import Itinerary"
        ↓
6. Success → Redirect to builder
```

## Keyboard Shortcuts

```
Filter Panel:
- Click "Filters" button → Toggle panel
- ESC (when focused) → Close panel

Modals:
- ESC → Close any open modal
- Enter → Submit form (when applicable)
```

## UI States

### Filter Panel Closed
```
┌────────────────────────────────────────┐
│ [Filters] [Import] [Quick Start] [...] │
│                                        │
│     Full-width Itineraries Table      │
│                                        │
└────────────────────────────────────────┘
```

### Filter Panel Open
```
┌────────┬──────────────────────────────┐
│ FILTER │    Itineraries Table         │
│ PANEL  │    (Narrower width)          │
│        │                              │
│ Active │                              │
│ Clear  │                              │
└────────┴──────────────────────────────┘
```

### Active Filters Indicator
```
┌────────────────────┐
│ 🔍 Filters  Active │  ← Badge shows filters are applied
│    Clear All       │  ← Button to reset
└────────────────────┘
```

## Responsive Behavior

### Desktop (>1200px)
- Filter panel: 300px fixed width
- Table: Flexible remaining space
- All filters visible

### Tablet (768px - 1199px)
- Filter panel: Overlay/drawer mode
- Table: Full width when panel closed
- Panel slides over content

### Mobile (<768px)
- Filter button opens full-screen drawer
- Table stacks columns
- Touch-friendly controls

## Performance Notes

- Filters debounced (300ms delay)
- React Query caching by filter combination
- Lazy loading for large lists
- Smooth transitions (200ms)
- Sticky filter panel (no re-render on scroll)

## API Query String Example

When filters are applied, the API request looks like:

```
GET /api/v1/itineraries?
  page=1&
  limit=10&
  search=bali&
  status=draft,published&
  travelStyle=Luxury,Adventure&
  minBudget=1000&
  maxBudget=5000&
  currency=USD&
  country=Indonesia&
  themes=Beach,Cultural&
  minDays=5&
  maxDays=10
```

## Tips for Users

1. **Start Broad:** Begin with 1-2 filters, then add more
2. **Combine Wisely:** Too many filters may return no results
3. **Use Clear All:** Reset when changing search direction
4. **Export Often:** Backup important itineraries as JSON
5. **Check Active Badge:** Know when filters are applied
6. **Collapse Unused:** Keep panel organized by collapsing sections

---

## Quick Actions Summary

| Action | Button Color | Icon | Location |
|--------|-------------|------|----------|
| Filter | Primary/Outline | 🔍 | Header |
| Import | Outline | ⬆ | Header |
| Export | Indigo | ⬇ | Table Actions |
| Build | Primary | 🔧 | Table Actions |
| Preview | Green | 👁 | Table Actions |
| Edit | Blue | ✏ | Table Actions |
| Delete | Red | 🗑 | Table Actions |

---

This completes the visual guide for the enhanced Itineraries page with filtering and export functionality!
