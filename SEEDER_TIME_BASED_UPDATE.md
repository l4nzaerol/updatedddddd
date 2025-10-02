# Seeder Updated for Time-Based Production Display

## Changes Made

Updated the `AccurateOrdersSeeder` to create more realistic time-based progress that aligns with production acceptance dates.

### Progress Distribution Updated

**Old Progress Values** (Too spread out):
- Order 3: 0 days ago, 5% → **Too low, might not display**
- Order 4: 3 days ago, 15%
- Order 5: 5 days ago, 35%
- Order 6: 8 days ago, 55%
- Order 7: 11 days ago, 80%
- Order 8: 13 days ago, 95%
- Order 9: 15 days ago, 100%
- Order 10: 1 day ago, 50%

**New Progress Values** (More realistic):
- Order 3: 1 day ago, 10% → Material Preparation
- Order 4: 2 days ago, 20% → Material Preparation
- Order 5: 4 days ago, 40% → Assembly
- Order 6: 6 days ago, 60% → Assembly
- Order 7: 8 days ago, 75% → Sanding & Surface Preparation
- Order 8: 10 days ago, 90% → Finishing
- Order 9: 14 days ago, 100% → Ready for Delivery (Completed)
- Order 10: 3 days ago, 30% → Cutting & Shaping (Alkansya)

### Time-Based Progress Calculation

For a 14-day production cycle:
- **Day 1**: ~7-10% (Material Preparation starts)
- **Day 2**: ~14-20% (Material Preparation continues)
- **Day 4**: ~28-40% (Cutting & Shaping → Assembly)
- **Day 6**: ~42-60% (Assembly in progress)
- **Day 8**: ~57-75% (Assembly → Sanding)
- **Day 10**: ~71-90% (Finishing stage)
- **Day 14**: 100% (Completed, Ready for Delivery)

### Production Stages Alignment

| Progress | Days | Current Stage | Status |
|----------|------|---------------|--------|
| 10% | 1 | Material Preparation | in_progress |
| 20% | 2 | Material Preparation | in_progress |
| 40% | 4 | Assembly | in_progress |
| 60% | 6 | Assembly | in_progress |
| 75% | 8 | Sanding & Surface Preparation | in_progress |
| 90% | 10 | Finishing | in_progress |
| 100% | 14 | Ready for Delivery | Completed |

### Expected Display in Production Page

The production page should now show **8 productions** with realistic progress:

```
Current Production Processes (8)

1. Dining Table (Order #3)
   - Accepted: 1 day ago
   - Progress: 10%
   - Stage: Material Preparation
   - Status: In Progress
   - Process: Material Preparation (in_progress)

2. Wooden Chair (Order #4)
   - Accepted: 2 days ago
   - Progress: 20%
   - Stage: Material Preparation
   - Status: In Progress
   - Process: Material Preparation (in_progress)

3. Dining Table (Order #5)
   - Accepted: 4 days ago
   - Progress: 40%
   - Stage: Assembly
   - Status: In Progress
   - Process: Assembly (in_progress)

4. Wooden Chair (Order #6)
   - Accepted: 6 days ago
   - Progress: 60%
   - Stage: Assembly
   - Status: In Progress
   - Process: Assembly (in_progress)

5. Dining Table (Order #7)
   - Accepted: 8 days ago
   - Progress: 75%
   - Stage: Sanding & Surface Preparation
   - Status: In Progress
   - Process: Sanding & Surface Preparation (in_progress)

6. Wooden Chair (Order #8)
   - Accepted: 10 days ago
   - Progress: 90%
   - Stage: Finishing
   - Status: In Progress
   - Process: Finishing (in_progress)

7. Dining Table (Order #9)
   - Accepted: 14 days ago
   - Progress: 100%
   - Stage: Ready for Delivery
   - Status: Completed
   - All processes: completed

8. Alkansya (Order #10)
   - Accepted: 3 days ago
   - Progress: 30%
   - Stage: Cutting & Shaping
   - Status: In Progress
   - Process: Cutting & Shaping (in_progress)
```

## Key Improvements

### 1. **Realistic Time-Based Progress**
- Progress now correlates with days since acceptance
- Follows typical 14-day production cycle
- Each stage has appropriate duration

### 2. **Better Stage Distribution**
- Orders spread across different production stages
- No clustering at beginning or end
- Shows full production pipeline

### 3. **Accurate Process Status**
- First process always `in_progress` for active productions
- Previous processes marked as `completed`
- Future processes remain `pending`

### 4. **Predictive Analytics Ready**
- Time-based progress enables ETA calculations
- Can predict completion dates based on current progress
- Historical data shows realistic production velocity

## Database Verification

After running the seeder, verify with:

```sql
-- Check productions
SELECT 
    p.id,
    p.order_id,
    p.product_name,
    p.overall_progress,
    p.current_stage,
    p.status,
    DATEDIFF(NOW(), p.production_started_at) as days_in_production
FROM productions p
ORDER BY p.id;

-- Check production processes
SELECT 
    pp.production_id,
    pp.process_name,
    pp.status,
    pp.process_order
FROM production_processes pp
WHERE pp.production_id IN (1,2,3,4,5,6,7,8)
ORDER BY pp.production_id, pp.process_order;

-- Check orders
SELECT 
    id,
    status,
    acceptance_status,
    accepted_at,
    DATEDIFF(NOW(), accepted_at) as days_since_acceptance
FROM orders
ORDER BY id;
```

## Expected Results

### Orders Table
- **2 pending orders** (Orders 1-2): No acceptance date, no productions
- **7 processing orders** (Orders 3-8, 10): Accepted 1-10 days ago, productions active
- **1 ready for delivery** (Order 9): Accepted 14 days ago, production completed

### Productions Table
- **8 productions total** (Orders 3-10)
- Progress ranges from 10% to 100%
- Stages distributed across pipeline
- All have `production_started_at` set

### Production Processes Table
- Each production has 6 processes (except Alkansya)
- At least one process is `in_progress`
- Previous processes are `completed`
- Future processes are `pending`

## Testing Checklist

After running the seeder:

- [ ] Production page shows 8 productions
- [ ] Progress bars display correctly (10%, 20%, 40%, 60%, 75%, 90%, 100%)
- [ ] Current stage matches progress percentage
- [ ] Process timeline shows correct status
- [ ] Time-based ETA calculations work
- [ ] Pending orders (1-2) don't show in production page
- [ ] Order 9 (100%) shows as "Ready for Delivery"
- [ ] Customer orders page shows all 10 orders
- [ ] Production tracking syncs with order tracking

## How to Run

```bash
# Reset database and run all seeders
php artisan migrate:fresh --seed

# Or run only this seeder
php artisan db:seed --class=AccurateOrdersSeeder
```

## Files Modified

1. **AccurateOrdersSeeder.php**
   - Updated progress values (10%, 20%, 40%, 60%, 75%, 90%, 100%)
   - Adjusted acceptance dates (1, 2, 4, 6, 8, 10, 14 days ago)
   - Better stage distribution

2. **Order.php Model**
   - Added `productions()` relationship
   - Enables `$order->productions()` queries

## Benefits

✅ **Realistic Demo Data**: Shows actual production workflow
✅ **Time-Based Progress**: Enables predictive analytics
✅ **Better Testing**: Covers all production stages
✅ **Accurate Display**: Progress matches acceptance dates
✅ **Full Pipeline**: Shows orders at different completion levels
✅ **Production Ready**: Data structure supports real-world usage

## Notes

- Alkansya products have shorter production cycle (7 days vs 14 days)
- Progress is calculated based on time elapsed since acceptance
- Order 9 at 100% should show in "Ready for Delivery" section
- Pending orders will appear in production page once accepted
- Time-based progress updates automatically based on `production_started_at`
