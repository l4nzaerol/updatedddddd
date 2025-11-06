# Customer Production Tracking Implementation

## Overview
Added detailed production stage tracking to the customer's order page, showing real-time progress for **Table and Chair orders only**.

## Changes Made

### Backend Changes (`capstone-back`)

#### OrderController.php - `tracking()` method

**Enhanced Tracking Response:**
- Added `processes` field to tracking details for table and chair products
- Added `is_tracked_product` flag to identify which products have detailed tracking
- Filters products by name (contains "table" or "chair")
- Returns production process details including:
  - Process ID
  - Process name (e.g., "Material Preparation", "Cutting & Shaping")
  - Status (pending, in_progress, completed)
  - Start and completion timestamps
  - Estimated duration in minutes

**Detection Logic:**
```php
$isTrackedProduct = stripos($productName, 'table') !== false || 
                   stripos($productName, 'chair') !== false;
```

### Frontend Changes (`casptone-front`)

#### ProductionTracking.jsx

**New Production Stages Section:**
- Added dedicated "Production Stages" section (lines 387-454)
- Only displays for orders containing tables or chairs
- Shows detailed process timeline for each tracked product
- Visual indicators:
  - ✅ Green checkmark for completed stages
  - 🔄 Spinning icon for in-progress stages
  - 🕐 Clock icon for pending stages
  - Strikethrough text for completed stages
  - Status badges (Completed, In Progress, Pending)

**Features:**
1. **Product-specific tracking**: Each table/chair in the order shows its own production timeline
2. **Stage visualization**: Clear icons and colors for each stage status
3. **Timestamps**: Shows when each stage started and completed
4. **Duration estimates**: Displays estimated time for each stage
5. **Delivery estimate**: Shows "2 weeks from production start"

## Production Stages Tracked

For Table and Chair orders, customers can see these stages:
1. Material Preparation
2. Cutting & Shaping
3. Assembly
4. Sanding & Surface Preparation
5. Finishing
6. Quality Check & Packaging

## UI Layout

### Customer Order Page Structure:
```
┌─────────────────────────────────────────┐
│ Order #123                              │
│ Status Badge | Total Price             │
├─────────────────────────────────────────┤
│ Overall Progress Bar (X%)              │
├─────────────────────────────────────────┤
│ Current Stage: Assembly                │
├─────────────────────────────────────────┤
│ 📋 Production Stages                    │
│ ┌─────────────────────────────────────┐ │
│ │ Dining Table - Production Timeline  │ │
│ │ ✅ Material Preparation (Completed) │ │
│ │ ✅ Cutting & Shaping (Completed)    │ │
│ │ 🔄 Assembly (In Progress)           │ │
│ │ 🕐 Sanding... (Pending)             │ │
│ │ 🕐 Finishing (Pending)              │ │
│ │ 🕐 Quality Check... (Pending)       │ │
│ │                                     │ │
│ │ 📅 Estimated Delivery: 2 weeks      │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Order Items Summary                     │
└─────────────────────────────────────────┘
```

## Product Filtering

### Tracked Products (Show detailed stages):
- Any product with "table" in the name (case-insensitive)
- Any product with "chair" in the name (case-insensitive)
- Examples: "Dining Table", "Wooden Chair", "Office Chair", "Coffee Table"

### Non-Tracked Products (Show basic tracking only):
- Alkansya products
- Other furniture items
- Custom products without table/chair in name

## Real-time Updates

The tracking page:
- Refreshes every 30 seconds automatically
- Shows live status updates as admin/staff mark stages complete
- Syncs with production data from the backend
- Updates progress percentages in real-time

## Customer Benefits

1. **Transparency**: Customers see exactly what stage their furniture is in
2. **Confidence**: Real-time updates build trust
3. **Planning**: Estimated delivery helps customers plan
4. **Engagement**: Detailed tracking keeps customers informed
5. **Satisfaction**: Reduces "where's my order?" inquiries

## Testing

To test the customer production tracking:

1. **Create an order** with a table or chair product
2. **Admin accepts** the order
3. **Production starts** automatically
4. **Customer logs in** and views "My Orders"
5. **Customer sees**:
   - Overall progress bar
   - Current production stage
   - Detailed stage checklist with status
   - Estimated delivery time
6. **Admin/Staff marks stages** as complete
7. **Customer sees updates** in real-time (or after 30s refresh)

## API Response Example

```json
{
  "order": { ... },
  "overall": {
    "total": 2,
    "completed": 0,
    "in_progress": 2,
    "progress_pct": 33
  },
  "trackings": [
    {
      "product_name": "Dining Table",
      "current_stage": "Assembly",
      "status": "in_production",
      "progress_percentage": 33,
      "is_tracked_product": true,
      "processes": [
        {
          "id": 1,
          "process_name": "Material Preparation",
          "status": "completed",
          "started_at": "2025-10-01 10:00:00",
          "completed_at": "2025-10-01 12:00:00",
          "estimated_duration_minutes": 120
        },
        {
          "id": 2,
          "process_name": "Cutting & Shaping",
          "status": "completed",
          "started_at": "2025-10-01 13:00:00",
          "completed_at": "2025-10-01 16:00:00",
          "estimated_duration_minutes": 180
        },
        {
          "id": 3,
          "process_name": "Assembly",
          "status": "in_progress",
          "started_at": "2025-10-02 09:00:00",
          "completed_at": null,
          "estimated_duration_minutes": 240
        }
      ]
    }
  ]
}
```

## Notes

- Only table and chair orders show detailed production stages
- Other products show basic tracking (overall progress only)
- Estimated delivery is fixed at 2 weeks for all tracked products
- Stages update automatically when admin/staff mark them complete
- Customer cannot modify stages (read-only view)
