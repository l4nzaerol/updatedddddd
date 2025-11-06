# Fix Material Usage Data Not Displaying

## Problem
The Material Usage and Resource Utilization tabs show "Loading resource utilization data..." but no data appears.

## Root Cause
The `/api/analytics/resource-utilization` endpoint requires data from multiple tables:
- `inventory_usage` - Material consumption records
- `inventory_items` - Materials/inventory items  
- `product_materials` - Bill of Materials (BOM) for products
- `products` - Product definitions

If any of these tables are empty or the data doesn't match up, the query returns no results.

## Solution

### Option 1: Seed the Database (Recommended)

**Run the batch file:**
```batch
SEED_DATABASE.bat
```

**Or manually:**
```bash
cd capstone-back
php artisan migrate:fresh
php artisan db:seed
```

This will create:
- ✅ 10 orders (2 pending, 8 accepted with productions)
- ✅ Inventory usage records for all productions
- ✅ Material consumption data
- ✅ Production analytics for Alkansya

### Option 2: Check What's Missing

**1. Check if tables have data:**
```bash
cd capstone-back
php artisan tinker
```

Then run:
```php
// Check inventory usage records
\App\Models\InventoryUsage::count();

// Check product materials (BOM)
\App\Models\ProductMaterial::count();

// Check productions
\App\Models\Production::count();

// Check inventory items
\App\Models\InventoryItem::count();
```

**2. Check the API directly:**

Open browser and go to:
```
http://localhost:8000/api/analytics/resource-utilization?start_date=2024-08-01&end_date=2024-11-30
```

You should see:
```json
{
  "period": {...},
  "material_usage_by_product": [...],
  "efficiency": [...]
}
```

### Option 3: Check Backend Logs

**Check Laravel logs:**
```bash
cd capstone-back
tail -f storage/logs/laravel.log
```

Look for errors like:
- `Resource Utilization Error: ...`
- SQL errors
- Missing table errors

## What the Seeder Does

The `InventoryDeductionSeeder` creates `inventory_usage` records by:

1. Finding all productions (Tables and Chairs)
2. Getting the BOM (Bill of Materials) for each product
3. Calculating material needed = `qty_per_unit × production_quantity`
4. Creating an `InventoryUsage` record for each material used
5. Deducting the material from `inventory_items.quantity_on_hand`

**Example:**
- Production: 5 Dining Tables
- BOM: 1 table needs 4 Wood Planks
- Usage created: 20 Wood Planks (4 × 5)
- Date: Production start date

## Verify Data After Seeding

**1. Check console logs in browser:**
```
✅ Resource Utilization loaded: {period: {...}, material_usage_by_product: Array(3)}
   - Has material_usage_by_product? true
   - Count: 3
```

**2. Check the tabs:**
- Go to **Inventory → Material Usage**
- Should show 3 cards (Table, Chair, Alkansya)
- Each card shows materials used

- Go to **Production → Resource Utilization**
- Should show material usage and efficiency charts

**3. Check database:**
```sql
SELECT 
    p.name as product,
    ii.name as material,
    SUM(iu.qty_used) as total_used
FROM inventory_usage iu
JOIN inventory_items ii ON iu.inventory_item_id = ii.id
JOIN product_materials pm ON ii.id = pm.inventory_item_id
JOIN products p ON pm.product_id = p.id
GROUP BY p.name, ii.name;
```

Should return rows like:
```
Dining Table | Wood Plank | 120.0
Dining Table | Wood Glue  | 30.0
Wooden Chair | Wood Plank | 80.0
...
```

## Troubleshooting

### Issue: Still shows "Loading..."
**Check:**
1. Is the backend running? (`php artisan serve`)
2. Check browser console for errors
3. Check Network tab - is the API call returning 200 or 500?

### Issue: Shows "No data found"
**Check:**
1. Did you run `php artisan db:seed`?
2. Check if `inventory_usage` table has records
3. Check date range - default is last 90 days

### Issue: API returns 500 error
**Check:**
1. Laravel logs: `storage/logs/laravel.log`
2. Missing tables or columns
3. Database connection issues

### Issue: Data shows but it's empty arrays
**This means:**
- API is working ✅
- Tables exist ✅
- But no data matches the query ❌

**Fix:** Run the seeder to populate data

## Expected Data Structure

**API Response:**
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
          "total_used": 120,
          "avg_used": 4.5,
          "unit": "pcs"
        }
      ],
      "total_materials": 5
    }
  ],
  "efficiency": [...]
}
```

## Quick Test

After seeding, refresh the Reports page and:

1. **Check console** - should see ✅ messages
2. **Click Inventory → Material Usage** - should see 3 product cards
3. **Click Production → Resource Utilization** - should see charts and tables

If you see data, you're all set! 🎉
