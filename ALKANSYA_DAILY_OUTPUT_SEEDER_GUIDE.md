# Alkansya Daily Output Seeder - Complete Guide

## Overview
The `AlkansyaDailyOutputSeeder` creates realistic Alkansya production data for the **previous 3 months**, automatically excluding Sundays. This data displays in the Daily Output chart on the Admin Dashboard.

## What It Does

### 1. Creates Daily Analytics Records
- **Duration:** Last 3 months (90+ days)
- **Excludes:** Sundays (no production)
- **Saves to:** `production_analytics` table
- **Displays in:** Admin Dashboard → Daily Output Chart

### 2. Realistic Production Patterns
Production quantities vary by day of week:
- **Monday:** 25-35 units (slower start)
- **Tuesday:** 35-45 units (normal)
- **Wednesday:** 40-50 units (peak production)
- **Thursday:** 40-50 units (peak production)
- **Friday:** 35-45 units (normal)
- **Saturday:** 20-30 units (half day)
- **Sunday:** 0 units (no production)

### 3. Updates Inventory
- **Alkansya Finished Goods:** Adds total produced quantity
- **Raw Materials:** Reduces quantities based on BOM consumption
- **Inventory Usage:** Creates usage records per material per day

### 4. Tracks Material Consumption
For each Alkansya produced, consumes materials according to BOM:
- Pinewood
- Plywood
- Acrylic
- Pin Nails
- Screws
- Adhesive
- Grinder Pads
- Stickers
- Transfer Tape
- Packing materials

## Database Tables Updated

### production_analytics
```
date                  | product_id | target_output | actual_output | efficiency_percentage
2024-08-07 (Wed)     | 1          | 50            | 45            | 90.00
2024-08-08 (Thu)     | 1          | 50            | 48            | 96.00
2024-08-09 (Fri)     | 1          | 50            | 40            | 80.00
2024-08-10 (Sat)     | 1          | 50            | 25            | 50.00
2024-08-11 (Sun)     | -          | -             | -             | - (SKIPPED)
2024-08-12 (Mon)     | 1          | 50            | 30            | 60.00
```

### inventory_usage
```
date       | inventory_item_id | qty_used
2024-08-07 | 1 (Pinewood)      | 90.00
2024-08-07 | 2 (Plywood)       | 45.00
2024-08-07 | 3 (Acrylic)       | 45.00
...
```

### inventory_items
```
sku          | name                        | quantity_on_hand (BEFORE) | quantity_on_hand (AFTER)
FG-ALKANSYA  | Alkansya (Finished Good)    | 0                         | 3,500 (example)
PW-1x4x8     | Pinewood 1x4x8ft           | 800                       | 200 (example)
PLY-4.2-4x8  | Plywood 4.2mm 4x8ft        | 400                       | 150 (example)
```

## How to Run

### Option 1: Full Database Reset
```bash
php artisan migrate:fresh --seed
```
This will:
- Drop all tables
- Recreate tables
- Run ALL seeders including AlkansyaDailyOutputSeeder

### Option 2: Run Specific Seeder Only
```bash
php artisan db:seed --class=AlkansyaDailyOutputSeeder
```
This will:
- Run only the Alkansya daily output seeder
- Requires Products, Inventory, and BOM to already exist

### Option 3: Run from DatabaseSeeder
The seeder is already included in `DatabaseSeeder.php`:
```php
$this->call([
    UsersTableSeeder::class,
    ProductsTableSeeder::class,
    InventoryItemsSeeder::class,
    ProductMaterialsSeeder::class,
    ComprehensiveOrdersSeeder::class,
    AlkansyaDailyOutputSeeder::class, // ← HERE
    InventoryUsageSeeder::class,
    ProductionAnalyticsSeeder::class,
]);
```

## Seeder Output Example

```
=== Creating Alkansya Daily Output Analytics (3 Months) ===

Product: Alkansya (ID: 1)
Materials in BOM: 14
Creating analytics and inventory usage records...

Date Range: 2024-08-07 to 2024-11-06
Generating daily analytics data (excluding Sundays)...

✓ 2024-08-16 (Friday): 40 units | Efficiency: 80%
✓ 2024-08-26 (Monday): 30 units | Efficiency: 60%
✓ 2024-09-05 (Thursday): 48 units | Efficiency: 96%
✓ 2024-09-15 (Sunday): SKIPPED
✓ 2024-09-25 (Wednesday): 45 units | Efficiency: 90%
✓ 2024-10-05 (Saturday): 25 units | Efficiency: 50%

Updating raw material inventory quantities...
  ✓ Pinewood 1x4x8ft: 800 → 150 (used: 650)
  ✓ Plywood 4.2mm 4x8ft: 400 → 100 (used: 300)
  ✓ Acrylic 1.5mm 4x8ft: 200 → 50 (used: 150)
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Created 77 daily analytics records!
✓ Created inventory usage records for materials consumed
✓ Total Alkansya output recorded: 3,080 units
✓ Alkansya finished goods inventory updated: 3,080 units
✓ Raw material inventory quantities reduced based on usage
✓ Average daily output: 40.00 units
✓ Data will display in Daily Output charts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Expected Results

### 1. Admin Dashboard
Go to Admin Dashboard and check:
- **Daily Output Chart** shows 3 months of Alkansya production
- No data points on Sundays
- Realistic production patterns (peaks mid-week)
- Can switch between Daily/Weekly/Monthly/Yearly views

### 2. Inventory Page
Check finished goods:
- **FG-ALKANSYA** should have ~3,000-3,500 units
- Raw materials should be reduced

### 3. Database Verification
```sql
-- Check analytics records (should be ~77 records for 3 months excluding Sundays)
SELECT COUNT(*) FROM production_analytics WHERE product_id = 1;

-- Check date range
SELECT MIN(date) as start_date, MAX(date) as end_date 
FROM production_analytics 
WHERE product_id = 1;

-- Check no Sundays
SELECT date, DAYNAME(date) as day_name 
FROM production_analytics 
WHERE product_id = 1 AND DAYOFWEEK(date) = 1;
-- Should return 0 rows

-- Check total output
SELECT SUM(actual_output) as total_alkansya_produced 
FROM production_analytics 
WHERE product_id = 1;
```

## Key Features

✅ **3 Months of Data** - Covers Aug, Sep, Oct (approximately)
✅ **Excludes Sundays** - Realistic work schedule
✅ **Realistic Patterns** - Higher production mid-week
✅ **Inventory Integration** - Updates finished goods and raw materials
✅ **Material Tracking** - Records usage per material per day
✅ **Dashboard Ready** - Immediately visible in charts
✅ **Efficiency Tracking** - Calculates daily efficiency percentages

## Troubleshooting

### Issue: "Alkansya product not found"
**Solution:** Run ProductsTableSeeder first
```bash
php artisan db:seed --class=ProductsTableSeeder
```

### Issue: "No BOM found for Alkansya"
**Solution:** Run ProductMaterialsSeeder first
```bash
php artisan db:seed --class=ProductMaterialsSeeder
```

### Issue: Data not showing in chart
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh dashboard (Ctrl+F5)
3. Check API response in Network tab
4. Verify data in database

### Issue: Negative inventory quantities
**Solution:** The seeder reduces raw material quantities. If they go negative, increase initial quantities in InventoryItemsSeeder.

## Production Calculation Example

**Day: Wednesday, Oct 15, 2024**
- Random output: 45 Alkansya
- Target: 50 Alkansya
- Efficiency: 90%

**Material Consumption (example):**
- Pinewood: 45 units × 2 pieces = 90 pieces
- Plywood: 45 units × 1 sheet = 45 sheets
- Pin Nails: 45 units × 50 nails = 2,250 nails
- etc.

**Inventory Update:**
- Alkansya finished goods: 0 → 45
- Pinewood: 800 → 710 (-90)
- Plywood: 400 → 355 (-45)

## Summary

✅ Seeder updated to cover **3 months** of data
✅ **Sundays excluded** automatically
✅ Saves to `production_analytics` table
✅ Creates inventory usage records
✅ Updates finished goods and raw materials
✅ Displays in Admin Dashboard Daily Output chart
✅ Realistic production patterns by day of week
✅ Ready to run with `php artisan migrate:fresh --seed`

The seeder is production-ready and will create a comprehensive 3-month history of Alkansya production!
