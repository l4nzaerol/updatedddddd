# Inventory Deduction Seeder - Complete

## Summary

Created a new seeder that automatically deducts inventory materials when production starts, based on the Bill of Materials (BOM) for each product. This ensures accurate inventory tracking from the moment production begins.

## Key Concept

**Materials are deducted when production STARTS, not when it completes.**

This reflects real-world manufacturing where materials are consumed at the beginning of production, not at the end.

## How It Works

### 1. Finds All Productions
- Queries all `Production` records (both in-progress and completed)
- Skips Alkansya productions (handled separately by AlkansyaDailyOutputSeeder)
- Processes Table and Chair productions

### 2. Gets Bill of Materials (BOM)
For each production:
- Looks up `ProductMaterial` records for the product
- Gets the quantity needed per unit (`qty_per_unit`)
- Calculates total needed: `qty_per_unit × production_quantity`

### 3. Deducts from Inventory
For each material:
- Reduces `quantity_on_hand` in `inventory_items` table
- Ensures quantity doesn't go below 0
- Updates the inventory record

### 4. Creates Usage Records
- Creates `InventoryUsage` records for tracking
- Uses production start date as the usage date
- Links to the specific inventory item

## Example Calculation

### Production: 2 Dining Tables

**BOM for Dining Table:**
- Mahogany Hardwood 2x4x8ft: 4 pieces per table
- Mahogany Hardwood 1x6x10ft: 6 pieces per table
- Plywood 18mm 4x8ft: 1 sheet per table
- Wood Screws 3 inch: 50 screws per table
- etc.

**Calculation for 2 Tables:**
- Mahogany 2x4x8ft: 4 × 2 = 8 pieces needed
- Mahogany 1x6x10ft: 6 × 2 = 12 pieces needed
- Plywood 18mm: 1 × 2 = 2 sheets needed
- Wood Screws: 50 × 2 = 100 screws needed

**Inventory Update:**
```
Before:
- Mahogany 2x4x8ft: 120 pieces
- Mahogany 1x6x10ft: 180 pieces
- Plywood 18mm: 80 sheets
- Wood Screws: 500 screws

After:
- Mahogany 2x4x8ft: 112 pieces (120 - 8)
- Mahogany 1x6x10ft: 168 pieces (180 - 12)
- Plywood 18mm: 78 sheets (80 - 2)
- Wood Screws: 400 screws (500 - 100)
```

## Seeder Order

The seeders now run in this order:

1. **UsersTableSeeder** - Creates users
2. **ProductsTableSeeder** - Creates products
3. **InventoryItemsSeeder** - Creates inventory with initial quantities
4. **ProductMaterialsSeeder** - Creates BOM for products
5. **ComprehensiveOrdersSeeder** - Creates orders and productions
6. **InventoryDeductionSeeder** ← NEW - Deducts materials for Table/Chair productions
7. **AlkansyaDailyOutputSeeder** - Handles Alkansya separately (3 months)

## What Gets Deducted

### Table Productions
Materials deducted per table:
- Mahogany Hardwood (legs and top)
- Plywood (base)
- Wood Screws
- Wood Glue
- Sandpaper (various grits)
- Wood Stain
- Polyurethane
- Metal Brackets
- Felt Pads

### Chair Productions
Materials deducted per chair:
- Mahogany Hardwood (legs and backrest)
- Plywood (seat base)
- Wood Screws
- Wood Dowels
- Foam Cushion
- Upholstery Fabric
- Upholstery Staples
- Wood Glue
- Wood Stain
- Lacquer Spray
- Felt Pads

### Alkansya Productions
Handled separately by `AlkansyaDailyOutputSeeder`:
- Pinewood
- Plywood
- Acrylic
- Pin Nails
- Screws
- Adhesive
- Grinder Pads
- Stickers
- Transfer Tape
- Packing Materials

## Database Tables Affected

### 1. inventory_items
**Updated:** `quantity_on_hand` reduced by materials used

```sql
-- Example
UPDATE inventory_items 
SET quantity_on_hand = quantity_on_hand - materials_used
WHERE id = material_id;
```

### 2. inventory_usage
**Created:** New records for each material used

```sql
-- Example
INSERT INTO inventory_usage (inventory_item_id, date, qty_used)
VALUES (material_id, production_start_date, quantity_used);
```

## Seeder Output Example

```
=== Deducting Inventory Based on Productions ===

Found 8 productions to process

Processing Production #1: Dining Table (Qty: 1)
  ✓ Mahogany Hardwood 2x4x8ft: 120 → 116 (used: 4)
  ✓ Mahogany Hardwood 1x6x10ft: 180 → 174 (used: 6)
  ✓ Plywood 18mm 4x8ft: 80 → 79 (used: 1)
  ✓ Wood Screws 3 inch: 500 → 450 (used: 50)
  ✓ Wood Glue 500ml: 60 → 59 (used: 1)
  ...

Processing Production #2: Wooden Chair (Qty: 4)
  ✓ Mahogany Hardwood 2x2x6ft: 200 → 184 (used: 16)
  ✓ Mahogany Hardwood 1x4x6ft: 180 → 172 (used: 8)
  ✓ Plywood 12mm 2x4ft: 100 → 96 (used: 4)
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Inventory deduction complete!
✓ Total material deductions: 96
✓ Materials affected: 24

Materials Usage Summary:
  • Mahogany Hardwood 2x4x8ft: 20 units used
  • Mahogany Hardwood 1x6x10ft: 30 units used
  • Plywood 18mm 4x8ft: 5 units used
  • Wood Screws 3 inch: 250 units used
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Benefits

1. **Accurate Inventory** - Reflects real material consumption
2. **Real-time Tracking** - Materials deducted when production starts
3. **Automatic Calculation** - Based on BOM, no manual entry
4. **Usage History** - Creates records for reporting
5. **Prevents Overselling** - Shows actual available materials
6. **Production-based** - Deducts for ALL productions (in-progress and completed)

## Verification

### Check Inventory After Seeding:

```sql
-- Check raw materials inventory
SELECT name, quantity_on_hand, category
FROM inventory_items
WHERE category = 'raw'
ORDER BY name;

-- Check inventory usage records
SELECT 
    ii.name,
    iu.date,
    iu.qty_used
FROM inventory_usage iu
JOIN inventory_items ii ON iu.inventory_item_id = ii.id
ORDER BY iu.date DESC, ii.name;

-- Check total usage per material
SELECT 
    ii.name,
    SUM(iu.qty_used) as total_used
FROM inventory_usage iu
JOIN inventory_items ii ON iu.inventory_item_id = ii.id
GROUP BY ii.name
ORDER BY total_used DESC;
```

## Testing

### Test 1: Run Seeder
```bash
php artisan migrate:fresh --seed
```

### Test 2: Check Inventory Page
1. Go to Inventory Management page
2. Check raw materials quantities
3. Verify they are reduced from initial amounts

### Test 3: Check Usage Records
1. Look at inventory usage data
2. Verify dates match production start dates
3. Verify quantities match BOM calculations

### Test 4: Verify Calculations
For a specific production:
1. Check production quantity
2. Check BOM for that product
3. Calculate expected usage: `qty_per_unit × production_qty`
4. Verify inventory was reduced by that amount

## Important Notes

### 1. Alkansya Handled Separately
- Alkansya productions are skipped in this seeder
- Handled by `AlkansyaDailyOutputSeeder` (3-month historical data)
- This prevents double-counting

### 2. Materials Deducted at Start
- Deduction happens when production starts
- Not when production completes
- Reflects real-world material consumption

### 3. Minimum Quantity is Zero
- Inventory cannot go below 0
- Uses `max(0, current_qty - used_qty)`
- Prevents negative inventory

### 4. Usage Date
- Uses `production_started_at` if available
- Falls back to `production.date`
- Ensures accurate date tracking

## Files Created/Modified

### Created:
1. ✅ `capstone-back/database/seeders/InventoryDeductionSeeder.php`
   - New seeder for automatic inventory deduction
   - Processes Table and Chair productions
   - Creates usage records

### Modified:
2. ✅ `capstone-back/database/seeders/DatabaseSeeder.php`
   - Added `InventoryDeductionSeeder` to seeder list
   - Positioned after `ComprehensiveOrdersSeeder`
   - Commented out old `InventoryUsageSeeder`

## Summary

✅ New seeder automatically deducts inventory materials
✅ Based on actual productions from orders
✅ Uses BOM (Bill of Materials) for calculations
✅ Deducts when production STARTS, not completes
✅ Creates inventory usage records for tracking
✅ Handles both in-progress and completed productions
✅ Skips Alkansya (handled separately)
✅ Accurate inventory quantities after seeding

**Run `php artisan migrate:fresh --seed` to see the automatic inventory deduction in action!**
