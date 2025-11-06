# Accurate Inventory Usage Seeder - Complete Guide

## Overview

The new `ComprehensiveInventoryUsageSeeder` is a single, accurate seeder that creates ALL inventory usage data from two sources:

1. **Customer Orders** - Tables, Chairs, and Alkansya from order productions
2. **Daily Alkansya Production** - 3 months of daily manufacturing output

## What It Does

### Part 1: Customer Orders Processing
- Finds all `Production` records from customer orders
- For each production:
  - Gets the product's BOM (Bill of Materials)
  - Calculates material needed = `qty_per_unit × production_quantity`
  - Creates `InventoryUsage` record for each material
  - Deducts material from `inventory_items.quantity_on_hand`
  - Uses production start date as usage date

**Example:**
```
Order #5: 5 Dining Tables
BOM: 1 table needs 4 Wood Planks, 2 Wood Glue, etc.
Creates:
- InventoryUsage: Wood Plank, 20 pcs, date: 2024-09-15
- InventoryUsage: Wood Glue, 10 bottles, date: 2024-09-15
```

### Part 2: Daily Alkansya Production
- Generates 3 months of daily production (excluding Sundays)
- Output varies by day:
  - **Monday-Friday:** 35-50 Alkansya per day
  - **Saturday:** 25-35 Alkansya per day
  - **Sunday:** 0 (no production)
- For each day:
  - Creates `ProductionAnalytics` record (for charts)
  - Creates `InventoryUsage` records for all materials
  - Deducts materials from inventory

**Example:**
```
Date: 2024-10-15 (Tuesday)
Output: 45 Alkansya
BOM: 1 Alkansya needs 0.5 Wood Plank, 0.2 Wood Glue, etc.
Creates:
- ProductionAnalytics: 45 output, 90% efficiency
- InventoryUsage: Wood Plank, 22.5 pcs, date: 2024-10-15
- InventoryUsage: Wood Glue, 9 bottles, date: 2024-10-15
```

## Expected Data Output

### From Customer Orders
- **Tables:** ~3-4 productions × 5 qty avg = 15-20 tables
- **Chairs:** ~3-4 productions × 10 qty avg = 30-40 chairs
- **Alkansya:** ~1-2 productions × 20 qty avg = 20-40 alkansya
- **Materials per production:** ~3-5 materials
- **Total records:** ~50-100 inventory_usage entries

### From Daily Alkansya
- **Days:** ~75 days (3 months, excluding Sundays)
- **Output per day:** 30-50 Alkansya (avg: 40)
- **Total output:** ~3,000 Alkansya
- **Materials per day:** ~3-5 materials
- **Total records:** ~225-375 inventory_usage entries

### **Grand Total**
- **Inventory Usage Records:** ~275-475 records
- **Production Analytics Records:** ~75 records (daily Alkansya)
- **Date Range:** 3 months ago to yesterday
- **Products Covered:** Dining Table, Wooden Chair, Alkansya

## How to Run

### Option 1: Full Database Reset (Recommended)
```bash
cd capstone-back
php artisan migrate:fresh
php artisan db:seed
```

### Option 2: Run Only This Seeder
```bash
cd capstone-back
php artisan db:seed --class=ComprehensiveInventoryUsageSeeder
```

### Option 3: Use the Batch File
```
Double-click: SEED_DATABASE.bat
```

## Seeder Output

When you run the seeder, you'll see:

```
╔════════════════════════════════════════════════════════════╗
║   COMPREHENSIVE INVENTORY USAGE SEEDER                     ║
╚════════════════════════════════════════════════════════════╝

🗑️  Clearing existing inventory usage data...
✓ Cleared

═══════════════════════════════════════════════════════════
PART 1: Processing Customer Orders (Tables, Chairs, Alkansya)
═══════════════════════════════════════════════════════════
📦 Found 10 productions to process

Processing: Dining Table (Qty: 5)
  ✓ Wood Plank: 20 pcs
  ✓ Wood Glue: 10 bottles
  ✓ Nails: 40 pcs
  ✓ Screws: 20 pcs
  ✓ Varnish: 5 liters

Processing: Wooden Chair (Qty: 10)
  ✓ Wood Plank: 20 pcs
  ✓ Nails: 80 pcs
  ✓ Screws: 60 pcs
  ✓ Varnish: 3 liters

... (more productions)

─────────────────────────────────────────────────────────
📊 Customer Orders Summary:
   • Dining Table: 3 productions
   • Wooden Chair: 4 productions
   • Alkansya: 2 productions
   • Total usage records created: 65
   • Unique materials affected: 8

═══════════════════════════════════════════════════════════
PART 2: Processing Daily Alkansya Production (3 Months)
═══════════════════════════════════════════════════════════
📦 Product: Alkansya
📋 Materials in BOM: 3

📅 Date Range: 2024-08-07 to 2024-11-06
🔄 Generating daily production data (excluding Sundays)...

  ✓ Processed 10 days... (Latest: 2024-08-17, Output: 42)
  ✓ Processed 20 days... (Latest: 2024-08-29, Output: 38)
  ✓ Processed 30 days... (Latest: 2024-09-11, Output: 45)
  ✓ Processed 40 days... (Latest: 2024-09-24, Output: 41)
  ✓ Processed 50 days... (Latest: 2024-10-08, Output: 39)
  ✓ Processed 60 days... (Latest: 2024-10-22, Output: 43)
  ✓ Processed 70 days... (Latest: 2024-11-05, Output: 37)

─────────────────────────────────────────────────────────
📊 Daily Alkansya Production Summary:
   • Total days processed: 75 days
   • Total Alkansya produced: 3,150 units
   • Average per day: 42.0 units
   • Total usage records created: 225
   • Unique materials affected: 3

╔════════════════════════════════════════════════════════════╗
║              FINAL COMPREHENSIVE SUMMARY                   ║
╚════════════════════════════════════════════════════════════╝

📊 TOTAL INVENTORY USAGE RECORDS: 290

📦 BY SOURCE:
   • From Customer Orders: 65 records
   • From Daily Alkansya: 225 records

🏭 PRODUCTION SUMMARY:
   • Dining Table: 3 productions from orders
   • Wooden Chair: 4 productions from orders
   • Alkansya: 2 productions from orders
   • Alkansya Daily: 3,150 units over 75 days

📦 MATERIAL USAGE SUMMARY:
   • Wood Plank: 1,850.50 units consumed
   • Wood Glue: 925.20 units consumed
   • Nails: 480.00 units consumed
   • Screws: 360.00 units consumed
   • Varnish: 95.50 units consumed
   • Paint: 630.00 units consumed

📅 DATA COVERAGE:
   • Date Range: 2024-08-07 to 2024-11-06
   • Total Days: 75 days (excluding Sundays)

✅ DATABASE VERIFICATION:
   • Expected records: 290
   • Actual records in DB: 290
   • Status: ✓ MATCH - All records created successfully!

╔════════════════════════════════════════════════════════════╗
║  ✓ INVENTORY USAGE SEEDING COMPLETE!                      ║
║                                                            ║
║  You can now view Material Usage reports in:              ║
║  • Inventory → Material Usage tab                         ║
║  • Production → Resource Utilization tab                  ║
╚════════════════════════════════════════════════════════════╝
```

## Database Verification

### Check Total Records
```bash
php artisan tinker
```

```php
// Total inventory usage records
\App\Models\InventoryUsage::count();
// Expected: 275-475

// Total production analytics records
\App\Models\ProductionAnalytics::count();
// Expected: ~75 (daily Alkansya)
```

### Check by Product
```php
DB::table('inventory_usage as iu')
    ->join('inventory_items as ii', 'iu.inventory_item_id', '=', 'ii.id')
    ->join('product_materials as pm', 'ii.id', '=', 'pm.inventory_item_id')
    ->join('products as p', 'pm.product_id', '=', 'p.id')
    ->select('p.name', DB::raw('COUNT(*) as count'), DB::raw('SUM(iu.qty_used) as total'))
    ->groupBy('p.name')
    ->get();
```

**Expected Output:**
```
Collection {
  0: {name: "Dining Table", count: 15, total: 180.00},
  1: {name: "Wooden Chair", count: 12, total: 240.00},
  2: {name: "Alkansya", count: 250, total: 3150.00}
}
```

### Check Date Range
```php
DB::table('inventory_usage')
    ->selectRaw('MIN(date) as earliest, MAX(date) as latest, COUNT(*) as total')
    ->first();
```

**Expected:**
```
{
  earliest: "2024-08-07",  // ~3 months ago
  latest: "2024-11-06",     // yesterday
  total: 290
}
```

### Check Daily Breakdown
```php
DB::table('inventory_usage')
    ->selectRaw('date, COUNT(*) as records')
    ->groupBy('date')
    ->orderBy('date', 'desc')
    ->limit(10)
    ->get();
```

## Frontend Display

After seeding, the Material Usage tabs will show:

### Inventory → Material Usage Tab

**3 Product Cards:**

**Card 1: Dining Table**
- Wood Plank: 120.00 pcs
- Wood Glue: 60.00 bottles
- Nails: 80.00 pcs
- Screws: 40.00 pcs
- Varnish: 20.00 liters

**Card 2: Wooden Chair**
- Wood Plank: 80.00 pcs
- Nails: 160.00 pcs
- Screws: 120.00 pcs
- Varnish: 15.00 liters

**Card 3: Alkansya**
- Wood Plank: 1,575.00 pcs (mostly from daily production)
- Wood Glue: 630.00 bottles
- Paint: 315.00 bottles

### Production → Resource Utilization Tab

Same 3 cards PLUS:
- **Material Efficiency Chart** - Actual vs Estimated usage
- **Efficiency Table** - Shows efficiency percentages
- **Variance Indicators** - Over/under usage

## API Response

**Endpoint:** `GET /api/analytics/resource-utilization`

**Response:**
```json
{
  "period": {
    "start": "2024-08-07",
    "end": "2024-11-07"
  },
  "material_usage_by_product": [
    {
      "product": "Dining Table",
      "materials": [
        {
          "material": "Wood Plank",
          "sku": "WP-001",
          "total_used": 120.0,
          "avg_used": 8.0,
          "unit": "pcs"
        },
        {
          "material": "Wood Glue",
          "sku": "WG-001",
          "total_used": 60.0,
          "avg_used": 4.0,
          "unit": "bottles"
        }
      ],
      "total_materials": 5
    },
    {
      "product": "Wooden Chair",
      "materials": [...],
      "total_materials": 4
    },
    {
      "product": "Alkansya",
      "materials": [...],
      "total_materials": 3
    }
  ],
  "efficiency": [...]
}
```

## Key Features

### ✅ Accurate Data
- Based on actual BOM (Bill of Materials)
- Uses real production quantities
- Realistic daily output patterns
- Proper date tracking

### ✅ Comprehensive Coverage
- All products (Tables, Chairs, Alkansya)
- Both order-based and daily production
- 3+ months of historical data
- Excludes Sundays (realistic)

### ✅ Proper Inventory Tracking
- Creates `inventory_usage` records
- Deducts from `inventory_items`
- Creates `production_analytics` for charts
- Maintains data integrity

### ✅ Detailed Reporting
- Progress indicators during seeding
- Comprehensive summary statistics
- Database verification
- Material usage breakdown

## Troubleshooting

### Issue: No data in Material Usage tabs

**Check 1: Did seeding complete?**
```bash
php artisan db:seed
# Look for "✓ INVENTORY USAGE SEEDING COMPLETE!"
```

**Check 2: Verify records exist**
```bash
php artisan tinker
\App\Models\InventoryUsage::count();
# Should return 275-475
```

**Check 3: Check API response**
```
http://localhost:8000/api/analytics/resource-utilization
# Should return data with 3 products
```

### Issue: Seeder shows "No productions found"

**Cause:** `ComprehensiveOrdersSeeder` hasn't run

**Fix:**
```bash
php artisan migrate:fresh
php artisan db:seed
```

### Issue: Seeder shows "No BOM found"

**Cause:** `ProductMaterialsSeeder` hasn't run

**Fix:**
```bash
php artisan migrate:fresh
php artisan db:seed
```

## Comparison with Old Seeders

| Feature | Old Seeders | New Seeder |
|---------|-------------|------------|
| **Number of files** | 2 separate seeders | 1 comprehensive seeder |
| **Order processing** | InventoryDeductionSeeder | ✅ Included |
| **Daily Alkansya** | AlkansyaDailyOutputSeeder | ✅ Included |
| **Progress tracking** | Basic | ✅ Detailed with summaries |
| **Verification** | None | ✅ Built-in verification |
| **Statistics** | Limited | ✅ Comprehensive stats |
| **Clarity** | Split across files | ✅ Single source of truth |

## Summary

The `ComprehensiveInventoryUsageSeeder` is a complete, accurate solution that:

✅ **Processes all customer orders** (Tables, Chairs, Alkansya)
✅ **Generates 3 months of daily Alkansya production**
✅ **Creates accurate inventory usage records** (~275-475 records)
✅ **Provides detailed progress and verification**
✅ **Enables Material Usage reports** in both Inventory and Production tabs

**Simply run:** `php artisan db:seed` and your Material Usage reports will be fully populated with accurate, realistic data!
