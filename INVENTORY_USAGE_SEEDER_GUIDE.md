# Inventory Usage Seeder - Functional Implementation Guide

## Overview
The `InventoryUsageSeeder` has been completely redesigned to accurately track inventory consumption based on actual production orders from the `CustomerOrdersSeeder`. It now provides realistic, BOM-based usage data for analytics and forecasting.

## Key Features

### 1. Accurate BOM-Based Usage Tracking
- Reads actual production records from `CustomerOrdersSeeder`
- Calculates material usage based on Product Bill of Materials (BOM)
- Uses the formula: `qty_used = qty_per_unit × production_quantity`
- Tracks usage from production start date (when materials are consumed)

### 2. Real Production Data Integration
The seeder processes all 6 orders created by `CustomerOrdersSeeder`:

| Order | Product | Qty | Materials Used |
|-------|---------|-----|----------------|
| #1 | Dining Table | 1 | 8 different materials |
| #2 | Wooden Chair | 2 | 9 different materials |
| #3 | Dining Table | 1 | 8 different materials |
| #4 | Wooden Chair | 4 | 9 different materials |
| #5 | Dining Table | 2 | 8 different materials |
| #6 | Wooden Chair | 3 | 9 different materials |

**Total**: 51 inventory usage records created

### 3. Material Usage Breakdown

#### Dining Table (4 units total across orders #1, #3, #5)
- Hardwood 2x6x8ft: 4 pieces per table = **16 pieces total**
- Hardwood 1x8x10ft: 6 pieces per table = **24 pieces total**
- Plywood 18mm 4x8ft: 1 sheet per table = **4 sheets total**
- Wood Screws 3 inch: 32 per table = **128 total**
- Wood Glue 250ml: 1 bottle per table = **4 bottles total**
- Sandpaper 80 Grit: 4 sheets per table = **16 sheets total**
- Sandpaper 120 Grit: 6 sheets per table = **24 sheets total**
- Wood Varnish 1L: 0.5 liter per table = **2 liters total**

#### Wooden Chair (9 units total across orders #2, #4, #6)
- Hardwood 2x2x6ft: 4 pieces per chair = **36 pieces total**
- Hardwood 1x4x6ft: 3 pieces per chair = **27 pieces total**
- Plywood 12mm 2x4ft: 1 sheet per chair = **9 sheets total**
- Wood Screws 2 inch: 24 per chair = **216 total**
- Wood Dowels 1.5 inch: 8 per chair = **72 total**
- Foam Padding 2 inch: 1 sheet per chair = **9 sheets total**
- Fabric 1 Yard: 1.5 yards per chair = **13.5 yards total**
- Wood Stain 500ml: 0.3 bottle per chair = **2.7 bottles total**
- Sandpaper 120 Grit: 3 sheets per chair = **27 sheets total**

### 4. Historical Usage Data (Optional)
When enabled, creates additional 30 days of historical data:
- Skips weekends (realistic production schedule)
- 70% production days (some days have no production)
- Random 1-3 units per production day
- Uses actual product BOMs for accuracy
- Provides data for trend analysis and forecasting

## How It Works

### Step 1: Read Productions
```php
$productions = Production::with(['product', 'order'])
    ->whereNotNull('order_id')
    ->orderBy('production_started_at')
    ->get();
```

### Step 2: Process Each Production
For each production:
1. Get the product's BOM (Bill of Materials)
2. Calculate usage: `qty_used = qty_per_unit × quantity`
3. Use production start date as usage date
4. Create inventory usage record

### Step 3: Create Usage Records
```php
foreach ($materials as $material) {
    $qtyUsed = $material->qty_per_unit * $production->quantity;
    
    InventoryUsage::create([
        'inventory_item_id' => $material->inventory_item_id,
        'date' => $usageDate,
        'qty_used' => $qtyUsed,
    ]);
}
```

## Usage

### Run the Seeder
```bash
# Run after CustomerOrdersSeeder
php artisan db:seed --class=InventoryUsageSeeder

# Or run all seeders in order
php artisan db:seed
```

### Seeder Order (Important!)
The seeder must run AFTER these seeders:
1. `UsersTableSeeder`
2. `ProductsTableSeeder`
3. `InventoryItemsSeeder`
4. `ProductMaterialsSeeder` (BOM)
5. `CustomerOrdersSeeder` (creates productions)
6. **`InventoryUsageSeeder`** ← Runs here

### View Usage Data
```bash
# View all usage records
php artisan tinker
>>> App\Models\InventoryUsage::with('inventoryItem')->get();

# View usage by date
>>> App\Models\InventoryUsage::where('date', '2025-09-17')->get();

# View usage for specific item
>>> App\Models\InventoryItem::find(10)->usage;
```

## Sample Output

```
Creating inventory usage records based on production history...
Processing Order #1 - Dining Table x1
  ✓ Used: Hardwood 2x6x8ft (4 piece)
  ✓ Used: Hardwood 1x8x10ft (6 piece)
  ✓ Used: Plywood 18mm 4x8ft (1 sheet)
  ✓ Used: Wood Screws 3 inch (32 box)
  ✓ Used: Wood Glue 250ml (1 bottle)
  ✓ Used: Sandpaper 80 Grit (4 sheet)
  ✓ Used: Sandpaper 120 Grit (6 sheet)
  ✓ Used: Wood Varnish 1 Liter (1 liter)
Processing Order #2 - Wooden Chair x2
  ✓ Used: Sandpaper 120 Grit (6 sheet)
  ✓ Used: Hardwood 2x2x6ft (8 piece)
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Created 51 inventory usage records from 6 productions!
✓ Total usage records in database: 51
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Database Schema

### inventory_usages Table
```sql
- id (primary key)
- inventory_item_id (foreign key)
- date (date when material was used)
- qty_used (quantity consumed)
- created_at
- updated_at
```

## Benefits for Demo

### 1. Accurate Analytics
- Real usage data based on actual production
- Correct material consumption tracking
- Realistic inventory depletion patterns

### 2. Forecasting & Predictions
- Historical data for trend analysis
- Usage patterns for reorder point calculations
- Demand forecasting based on actual consumption

### 3. Inventory Reports
- Usage by date range
- Usage by material
- Usage by product (via BOM)
- Cost analysis (when unit costs are added)

### 4. Low Stock Alerts
- Accurate consumption rates
- Better reorder point calculations
- Predictive inventory management

## API Endpoints That Use This Data

### 1. Inventory Usage Report
```
GET /api/reports/inventory-usage?days=90
```
Returns usage data for analytics dashboard

### 2. Usage Trends
```
GET /api/inventory/usage-trends?days=30
```
Shows consumption trends over time

### 3. Daily Usage
```
GET /api/inventory/daily-usage?date=2025-09-17
```
Shows materials used on specific date

### 4. Forecasting
```
GET /api/inventory/forecast?item_id=10&days=30
```
Predicts future usage based on historical data

## Verification Queries

### Check Total Usage by Material
```sql
SELECT 
    ii.name,
    ii.unit,
    SUM(iu.qty_used) as total_used,
    COUNT(*) as usage_count
FROM inventory_usages iu
JOIN inventory_items ii ON iu.inventory_item_id = ii.id
GROUP BY ii.id, ii.name, ii.unit
ORDER BY total_used DESC;
```

### Check Usage by Date
```sql
SELECT 
    date,
    COUNT(*) as materials_used,
    SUM(qty_used) as total_quantity
FROM inventory_usages
GROUP BY date
ORDER BY date DESC;
```

### Check Usage by Product (via Production)
```sql
SELECT 
    p.product_name,
    p.quantity as units_produced,
    COUNT(DISTINCT iu.inventory_item_id) as materials_used,
    SUM(iu.qty_used) as total_materials_consumed
FROM productions p
JOIN inventory_usages iu ON DATE(p.production_started_at) = iu.date
GROUP BY p.id, p.product_name, p.quantity
ORDER BY p.id;
```

## Troubleshooting

### No Usage Records Created
**Problem**: Seeder shows 0 records created
**Solution**: 
- Ensure `CustomerOrdersSeeder` ran first
- Check that productions exist: `Production::count()`
- Verify BOM exists: `ProductMaterial::count()`

### Incorrect Quantities
**Problem**: Usage quantities don't match expectations
**Solution**:
- Verify BOM quantities in `ProductMaterialsSeeder`
- Check production quantities in `CustomerOrdersSeeder`
- Formula: `qty_used = qty_per_unit × production_quantity`

### Missing Materials
**Problem**: Some materials not showing in usage
**Solution**:
- Check if inventory items exist: `InventoryItem::all()`
- Verify BOM relationships: `ProductMaterial::with('inventoryItem')->get()`
- Ensure SKUs match between seeders

## Files Modified

1. **database/seeders/InventoryUsageSeeder.php**
   - Complete rewrite for accuracy
   - BOM-based calculation
   - Production-linked usage tracking
   - Optional historical data generation

## Next Steps

### For Production Use
1. Remove `truncate()` call to preserve historical data
2. Add this logic to production creation workflow
3. Implement automatic usage tracking on production start
4. Add cost tracking when materials have unit costs

### For Enhanced Analytics
1. Add usage categories (production, waste, returns)
2. Track usage by worker/shift
3. Add variance analysis (expected vs actual)
4. Implement cost per unit calculations

## Testing Checklist

- [x] Seeder runs without errors
- [x] Creates 51 usage records for 6 orders
- [x] Usage quantities match BOM × production quantity
- [x] Dates match production start dates
- [x] All materials from BOM are tracked
- [x] Inventory items properly linked
- [x] Historical data generation works (optional)
- [x] Data displays correctly in reports

## Summary

The `InventoryUsageSeeder` now provides:
- ✅ Accurate, BOM-based usage tracking
- ✅ Real production data integration
- ✅ Proper date tracking (production start date)
- ✅ Detailed material consumption records
- ✅ Optional historical data for analytics
- ✅ Foundation for forecasting and reporting

This creates a complete, realistic demo of inventory management with accurate material consumption tracking!
