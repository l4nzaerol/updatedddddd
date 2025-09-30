# Inventory Usage Data Summary

## Current Status: ✅ WORKING

### Data Overview
- **Total Usage Records**: 84
- **Date Range**: Sept 17 - Sept 30, 2025 (14 days)
- **Source**: 6 production orders + historical data

## Daily Breakdown

```
📅 Sept 30 (Yesterday) - 9 records
   └─ Order #6: Wooden Chair x3 (100% complete)
      ├─ Sandpaper 120 Grit: 9 sheets
      ├─ Hardwood 2x2x6ft: 12 pieces
      ├─ Hardwood 1x4x6ft: 9 pieces
      ├─ Plywood 12mm 2x4ft: 3 sheets
      ├─ Wood Screws 2 inch: 72 pieces
      ├─ Wood Dowels 1.5 inch: 24 pieces
      ├─ Foam Padding 2 inch: 3 sheets
      ├─ Fabric 1 Yard: 6 yards
      └─ Wood Stain 500ml: 0.9 bottles

📅 Sept 29 - 8 records
   └─ Order #5: Dining Table x2 (85% progress)
      ├─ Hardwood 2x6x8ft: 8 pieces
      ├─ Hardwood 1x8x10ft: 12 pieces
      ├─ Plywood 18mm 4x8ft: 2 sheets
      ├─ Wood Screws 3 inch: 64 pieces
      ├─ Wood Glue 250ml: 2 bottles
      ├─ Sandpaper 80 Grit: 8 sheets
      ├─ Sandpaper 120 Grit: 12 sheets
      └─ Wood Varnish 1L: 1 liter

📅 Sept 28 - 9 records
   └─ Order #4: Wooden Chair x4 (65% progress)
      └─ [9 different materials]

📅 Sept 27 - 8 records
   └─ Order #3: Dining Table x1 (50% progress)
      └─ [8 different materials]

📅 Sept 26 - 9 records
   └─ Order #2: Wooden Chair x2 (25% progress)
      └─ [9 different materials]

📅 Sept 25 - 8 records
   └─ Order #1: Dining Table x1 (10% progress)
      └─ [8 different materials]

📅 Sept 23 - 17 records
   └─ Historical data (multiple productions)

📅 Sept 22 - 8 records
   └─ Historical data

📅 Sept 17 - 8 records
   └─ Historical data
```

## Material Usage Totals (All Orders)

### Dining Tables (4 units total)
- Hardwood 2x6x8ft: **16 pieces**
- Hardwood 1x8x10ft: **24 pieces**
- Plywood 18mm 4x8ft: **4 sheets**
- Wood Screws 3 inch: **128 pieces**
- Wood Glue 250ml: **4 bottles**
- Sandpaper 80 Grit: **16 sheets**
- Sandpaper 120 Grit: **24 sheets**
- Wood Varnish 1L: **2 liters**

### Wooden Chairs (9 units total)
- Hardwood 2x2x6ft: **36 pieces**
- Hardwood 1x4x6ft: **27 pieces**
- Plywood 12mm 2x4ft: **9 sheets**
- Wood Screws 2 inch: **216 pieces**
- Wood Dowels 1.5 inch: **72 pieces**
- Foam Padding 2 inch: **9 sheets**
- Fabric 1 Yard: **13.5 yards**
- Wood Stain 500ml: **2.7 bottles**
- Sandpaper 120 Grit: **27 sheets**

## How to View in Frontend

### Option 1: Default View (Yesterday)
1. Go to **Reports** → **Daily Usage**
2. Date picker defaults to today (Oct 1)
3. **Change to Sept 30** to see yesterday's data
4. Shows Order #6 materials

### Option 2: Select Any Date
1. Use date picker to select dates from **Sept 17 to Sept 30**
2. Each date shows materials used that day
3. Includes item name, SKU, quantity used, remaining stock

### Option 3: View Trends
1. Go to **Consumption Trends** tab
2. Shows usage patterns over 14 days
3. Displays average daily usage per material
4. Forecasts future consumption

## API Endpoints

### Daily Usage
```bash
GET /api/inventory/daily-usage?date=2025-09-30
```

### Consumption Trends
```bash
GET /api/inventory/consumption-trends?days=14
```

### Forecast
```bash
GET /api/inventory/forecast?forecast_days=30&historical_days=14
```

## Quick Test Commands

### Check Total Records
```bash
php artisan tinker
>>> App\Models\InventoryUsage::count()
# Should return: 84
```

### Check Date Range
```bash
>>> App\Models\InventoryUsage::selectRaw('MIN(date) as first_date, MAX(date) as last_date')->first()
# Should return: first_date: 2025-09-17, last_date: 2025-09-30
```

### Check Yesterday's Usage
```bash
>>> App\Models\InventoryUsage::where('date', '2025-09-30')->count()
# Should return: 9
```

### View Yesterday's Details
```bash
>>> App\Models\InventoryUsage::where('date', '2025-09-30')
    ->with('inventoryItem:id,name,sku')
    ->get()
    ->map(fn($u) => [
        'item' => $u->inventoryItem->name,
        'qty' => $u->qty_used
    ])
```

## Why Sept 30 (Yesterday)?

The most recent order (Order #6) was created **1 day ago** (Sept 30), which means:
- ✅ Recent enough for daily reports
- ✅ Not "today" (production takes time)
- ✅ Realistic demo scenario
- ✅ Shows completed order ready for delivery

## Data Flow

```
Order Created (Sept 30)
    ↓
Production Started (Sept 30)
    ↓
Materials Consumed (Sept 30) ← Usage records created here
    ↓
Production Completed (Sept 30)
    ↓
Order Ready for Delivery (Sept 30)
    ↓
Daily Usage Report Shows Data ✅
```

## Summary

✅ **84 usage records** created
✅ **14 days** of data (Sept 17-30)
✅ **6 production orders** tracked
✅ **33 historical records** for trends
✅ **Daily reports** now functional
✅ **Recent data** (yesterday = Sept 30)

The daily usage reports are now fully populated with accurate, BOM-based material consumption data!
