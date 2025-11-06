# Inventory Usage Data - Complete Implementation

## Overview
The system now tracks inventory usage (material consumption) from THREE sources:

### 1. **Customer Orders - Tables & Chairs**
**Seeder:** `InventoryDeductionSeeder`
- Processes productions from customer orders
- Deducts materials when production STARTS
- Tracks: Dining Tables, Wooden Chairs, and Alkansya orders

**Example:**
- Order #1: 5 Dining Tables
- BOM: 1 table needs 4 Wood Planks, 2 Wood Glue, etc.
- Usage created: 20 Wood Planks, 10 Wood Glue
- Date: Production start date

### 2. **Customer Orders - Alkansya**
**Seeder:** `InventoryDeductionSeeder`
- Also processes Alkansya from customer orders
- Same logic as Tables & Chairs

### 3. **Daily Alkansya Production (3 months)**
**Seeder:** `AlkansyaDailyOutputSeeder`
- Creates daily production analytics for 3 months
- Generates 30-50 Alkansya per day (Mon-Sat, no Sundays)
- Creates inventory usage for each day's output
- Date range: 3 months ago to yesterday

**Example:**
- Date: 2024-10-15
- Output: 45 Alkansya
- BOM: 1 Alkansya needs 0.5 Wood Plank, 0.2 Wood Glue, etc.
- Usage created: 22.5 Wood Planks, 9 Wood Glue

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SEEDING                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  1. ComprehensiveOrdersSeeder         │
        │     - Creates 10 orders               │
        │     - Creates productions             │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  2. InventoryDeductionSeeder          │
        │     - Processes ALL productions       │
        │     - Creates inventory_usage records │
        │     - Deducts from inventory_items    │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  3. AlkansyaDailyOutputSeeder         │
        │     - Creates 3 months of analytics   │
        │     - Creates daily inventory_usage   │
        │     - ~75 days × 40 avg = 3000 units  │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │     RESULT: inventory_usage table     │
        │  - Order-based usage (Tables/Chairs)  │
        │  - Order-based usage (Alkansya)       │
        │  - Daily production usage (Alkansya)  │
        └───────────────────────────────────────┘
```

## Database Tables

### `inventory_usage`
```sql
CREATE TABLE inventory_usage (
    id BIGINT PRIMARY KEY,
    inventory_item_id BIGINT,  -- FK to inventory_items
    date DATE,                  -- Date of usage
    qty_used DECIMAL(10,2),     -- Quantity consumed
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Sample Data:**
```
| id | inventory_item_id | date       | qty_used |
|----|-------------------|------------|----------|
| 1  | 1 (Wood Plank)    | 2024-09-15 | 20.00    | <- From Table order
| 2  | 2 (Wood Glue)     | 2024-09-15 | 10.00    | <- From Table order
| 3  | 1 (Wood Plank)    | 2024-10-01 | 22.50    | <- Daily Alkansya
| 4  | 1 (Wood Plank)    | 2024-10-02 | 20.00    | <- Daily Alkansya
| 5  | 3 (Nails)         | 2024-09-20 | 40.00    | <- From Chair order
...
```

## API Endpoint Query

The `/api/analytics/resource-utilization` endpoint joins:

```sql
SELECT 
    p.name as product_name,
    ii.name as material_name,
    ii.sku as material_sku,
    SUM(iu.qty_used) as total_used,
    AVG(iu.qty_used) as avg_used,
    ii.unit
FROM inventory_usage iu
JOIN inventory_items ii ON iu.inventory_item_id = ii.id
JOIN product_materials pm ON ii.id = pm.inventory_item_id
JOIN products p ON pm.product_id = p.id
WHERE iu.date BETWEEN ? AND ?
GROUP BY p.name, ii.name, ii.sku, ii.unit
```

**Result:**
```json
{
  "material_usage_by_product": [
    {
      "product": "Dining Table",
      "materials": [
        {"material": "Wood Plank", "total_used": 120, "unit": "pcs"},
        {"material": "Wood Glue", "total_used": 60, "unit": "bottles"}
      ],
      "total_materials": 5
    },
    {
      "product": "Wooden Chair",
      "materials": [
        {"material": "Wood Plank", "total_used": 80, "unit": "pcs"},
        {"material": "Nails", "total_used": 200, "unit": "pcs"}
      ],
      "total_materials": 4
    },
    {
      "product": "Alkansya",
      "materials": [
        {"material": "Wood Plank", "total_used": 1500, "unit": "pcs"},
        {"material": "Wood Glue", "total_used": 600, "unit": "bottles"}
      ],
      "total_materials": 3
    }
  ]
}
```

## Expected Data Volume

After running `php artisan db:seed`:

### From Orders (InventoryDeductionSeeder)
- **Tables:** ~3-4 productions × 5 qty avg = 15-20 tables
- **Chairs:** ~3-4 productions × 10 qty avg = 30-40 chairs  
- **Alkansya:** ~1-2 productions × 20 qty avg = 20-40 alkansya

**Total:** ~50-100 inventory_usage records from orders

### From Daily Production (AlkansyaDailyOutputSeeder)
- **Days:** ~75 days (3 months, no Sundays)
- **Output per day:** 30-50 Alkansya
- **Materials per Alkansya:** ~3-5 materials
- **Records per day:** 3-5 materials

**Total:** ~225-375 inventory_usage records from daily production

### **Grand Total:** ~275-475 inventory_usage records

## Verification Commands

### 1. Check Total Records
```bash
cd capstone-back
php artisan tinker
```

```php
\App\Models\InventoryUsage::count();
// Expected: 275-475 records

\App\Models\InventoryUsage::selectRaw('DATE(date) as day, COUNT(*) as count')
    ->groupBy('day')
    ->orderBy('day', 'desc')
    ->limit(10)
    ->get();
// Shows daily breakdown
```

### 2. Check by Product
```php
DB::table('inventory_usage as iu')
    ->join('inventory_items as ii', 'iu.inventory_item_id', '=', 'ii.id')
    ->join('product_materials as pm', 'ii.id', '=', 'pm.inventory_item_id')
    ->join('products as p', 'pm.product_id', '=', 'p.id')
    ->select('p.name', DB::raw('COUNT(*) as usage_count'), DB::raw('SUM(iu.qty_used) as total_used'))
    ->groupBy('p.name')
    ->get();
```

**Expected Output:**
```
Collection {
  0: {
    name: "Dining Table",
    usage_count: 15,
    total_used: 120.00
  },
  1: {
    name: "Wooden Chair",
    usage_count: 12,
    total_used: 80.00
  },
  2: {
    name: "Alkansya",
    usage_count: 300,
    total_used: 3000.00
  }
}
```

### 3. Check Date Range
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
  total: 350
}
```

## Seeding Output

When you run `php artisan db:seed`, you'll see:

```
=== Deducting Inventory Based on Productions ===
Found 10 productions to process

Processing Production #1: Dining Table (Qty: 5)
  ✓ Wood Plank: 1000 → 980 (used: 20)
  ✓ Wood Glue: 500 → 490 (used: 10)
  ...

Processing Production #2: Wooden Chair (Qty: 10)
  ✓ Wood Plank: 980 → 960 (used: 20)
  ✓ Nails: 2000 → 1960 (used: 40)
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Inventory deduction complete!

📊 Production Summary:
  • Dining Tables: 3 productions
  • Wooden Chairs: 4 productions
  • Alkansya: 2 productions

✓ Total material deductions: 45
✓ Unique materials affected: 8

📦 Materials Usage Summary:
  • Wood Plank: 180 units used
  • Wood Glue: 90 units used
  • Nails: 160 units used
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Note: Alkansya daily output (3 months) is handled by AlkansyaDailyOutputSeeder
   This seeder only processes Alkansya from customer orders.

=== Creating Alkansya Daily Output Analytics (3 Months) ===
Product: Alkansya (ID: 3)
Materials in BOM: 3
Creating analytics and inventory usage records...

Date Range: 2024-08-07 to 2024-11-06
Generating daily analytics data (excluding Sundays)...

✓ Created 75 analytics records
✓ Total Alkansya produced: 3,150 units
✓ Inventory usage records created: 225
```

## Frontend Display

After seeding, the Material Usage tabs will show:

### Inventory → Material Usage Tab
- **Dining Table Card:** Shows Wood Plank, Wood Glue, Nails, etc.
- **Wooden Chair Card:** Shows Wood Plank, Nails, Screws, etc.
- **Alkansya Card:** Shows Wood Plank, Wood Glue, Paint, etc.

### Production → Resource Utilization Tab
- **Material Usage by Product:** Same 3 cards
- **Material Efficiency Chart:** Actual vs Estimated usage
- **Efficiency Table:** Shows efficiency percentages

## Troubleshooting

### Issue: Still no data after seeding

**Check 1: Did seeding complete successfully?**
```bash
php artisan db:seed
# Look for "✓ Inventory deduction complete!"
# Look for "✓ Created XX analytics records"
```

**Check 2: Are there inventory_usage records?**
```bash
php artisan tinker
\App\Models\InventoryUsage::count();
```

**Check 3: Check the API directly**
```
http://localhost:8000/api/analytics/resource-utilization
```

**Check 4: Check browser console**
```
✅ Resource Utilization loaded: {...}
   - Has material_usage_by_product? true
   - Count: 3
```

### Issue: Data shows but arrays are empty

This means the JOIN query isn't matching records. Check:

1. **Product Materials (BOM) exist:**
```php
\App\Models\ProductMaterial::count(); // Should be > 0
```

2. **Inventory items exist:**
```php
\App\Models\InventoryItem::count(); // Should be > 0
```

3. **The joins are working:**
```php
DB::table('inventory_usage as iu')
    ->join('inventory_items as ii', 'iu.inventory_item_id', '=', 'ii.id')
    ->count();
// Should match inventory_usage count
```

## Summary

✅ **InventoryDeductionSeeder** - Processes ALL productions (Tables, Chairs, Alkansya from orders)
✅ **AlkansyaDailyOutputSeeder** - Creates 3 months of daily Alkansya production
✅ **Both create inventory_usage records** - Tracked by date and material
✅ **API endpoint queries all data** - Groups by product and material
✅ **Frontend displays in 2 tabs** - Inventory and Production sections

**Total Data:** ~275-475 inventory usage records across all products and 3+ months of history
