# Accurate Orders Seeder Guide

## Overview

The `AccurateOrdersSeeder` creates sample orders with **perfectly synchronized** production tracking data that displays consistently across:
- **Customer Orders Page** - Shows accurate order status and production progress
- **Production Tracking Page** - Shows matching production stages and progress

## Key Features

✅ **Synchronized Data** - Production and OrderTracking always match  
✅ **Accurate Progress** - Progress percentages reflect actual production stages  
✅ **Realistic Timelines** - Orders placed and accepted at different times  
✅ **Complete Workflow** - From pending orders to 100% completed orders  
✅ **Both Product Types** - Supports both Alkansya (simple) and Custom furniture (complex tracking)

## What This Seeder Creates

### 10 Sample Orders with Various States:

1. **Order #1** - PENDING (not accepted, placed today)
2. **Order #2** - PENDING (not accepted, placed 2 days ago)
3. **Order #3** - 0% Progress (just accepted today)
4. **Order #4** - 15% Progress (Material Preparation stage)
5. **Order #5** - 35% Progress (Cutting & Shaping stage)
6. **Order #6** - 55% Progress (Assembly stage)
7. **Order #7** - 80% Progress (Sanding & Surface Preparation stage)
8. **Order #8** - 95% Progress (Finishing stage)
9. **Order #9** - 100% Progress (Ready for Delivery)
10. **Order #10** - Alkansya at 50% Progress

## How to Use

### Step 1: Prerequisites

Make sure you have:
- Products seeded (run `ProductsTableSeeder` first)
- Database tables created (run migrations)

### Step 2: Run the Seeder

```bash
# Run just this seeder
php artisan db:seed --class=AccurateOrdersSeeder

# Or include it in DatabaseSeeder.php
```

### Step 3: Verify the Data

**Check Customer Orders Page:**
- Login as customer@gmail.com (password: password)
- View "My Orders" page
- Expand each order to see production tracking
- Progress bars should show accurate percentages

**Check Production Tracking Page:**
- Login as admin@gmail.com (password: password)
- View "Production Tracking" dashboard
- Filter by status, product type, etc.
- Verify stages and progress match customer view

## Data Structure

### Order Statuses
- `pending` - Not accepted yet (awaiting admin approval)
- `processing` - Accepted and in production
- `ready_for_delivery` - Production complete (100%)

### Production Stages (Custom Furniture)
1. **Material Preparation** (0-10% progress)
2. **Cutting & Shaping** (10-30% progress)
3. **Assembly** (30-60% progress)
4. **Sanding & Surface Preparation** (60-75% progress)
5. **Finishing** (75-95% progress)
6. **Quality Check & Packaging** (95-100% progress)

### Production Stages (Alkansya)
**Note:** Alkansya uses the same stage names as custom furniture for database consistency:
1. **Material Preparation** (0-16% progress) - Design and material prep
2. **Cutting & Shaping** (16-50% progress) - Cutting wood
3. **Assembly** (50-66% progress) - Assembling components
4. **Finishing** (66-83% progress) - Applying finish
5. **Quality Check & Packaging** (83-100% progress) - Final inspection

## Key Differences from Old Seeder

### Old Seeder Issues:
❌ Production and OrderTracking had different stages  
❌ Progress calculations were inconsistent  
❌ Time-based progress conflicted with manual progress  
❌ Sync service was called but data still mismatched  

### New Seeder Solutions:
✅ **Single Source of Truth** - Progress determines stage consistently  
✅ **Explicit Progress Control** - No time-based calculations during seeding  
✅ **Proper Sync** - Production created first, then synced to tracking  
✅ **Accurate Process Status** - Each process marked correctly (pending/in_progress/completed)  

## Technical Details

### How Synchronization Works

1. **Order Created** - Basic order record with status
2. **Production Created** - If order is accepted, production record created with:
   - `current_stage` - Based on progress percentage
   - `overall_progress` - Explicit progress value
   - `status` - 'In Progress' or 'Completed'
3. **Production Processes Created** - Individual process records with correct status
4. **OrderTracking Created** - Customer-facing tracking with matching stage
5. **Sync Service Called** - Ensures tracking matches production exactly

### Progress to Stage Mapping

```php
// Custom Furniture (14-day production)
0-10%   → Material Preparation
10-30%  → Cutting & Shaping
30-60%  → Assembly
60-75%  → Sanding & Surface Preparation
75-95%  → Finishing
95-100% → Quality Check & Packaging

// Alkansya (7-day production)
// Uses same stage names for database consistency
0-16%   → Material Preparation (Design + Prep)
16-50%  → Cutting & Shaping (Cutting)
50-66%  → Assembly
66-83%  → Finishing
83-100% → Quality Check & Packaging (Quality Control)
```

## Customization

### Adding More Orders

Edit the `run()` method and add more calls to `createOrder()`:

```php
$this->createOrder($customer, $admin, $product, $quantity, [
    'days_ago_placed' => 5,      // When order was placed
    'days_ago_accepted' => 3,    // When order was accepted
    'is_accepted' => true,       // Whether accepted
    'progress' => 45,            // Progress percentage (0-100)
]);
```

### Changing Progress Thresholds

Edit the `determineStageFromProgress()` method to adjust when stages change.

### Modifying Process Durations

Edit the `createProductionProcesses()` method to change how long each process takes.

## Troubleshooting

### Issue: Data Still Not Matching

**Solution:**
1. Clear old data: `php artisan migrate:fresh`
2. Seed products first: `php artisan db:seed --class=ProductsTableSeeder`
3. Run this seeder: `php artisan db:seed --class=AccurateOrdersSeeder`

### Issue: Progress Not Updating

**Check:**
- Is `overall_progress` column in `productions` table?
- Is `ProductionTrackingService` being called?
- Are process records being created correctly?

### Issue: Stages Don't Match

**Verify:**
- Production `current_stage` matches OrderTracking `current_stage`
- Process names match exactly (case-sensitive)
- Progress thresholds are consistent

## Testing Checklist

After running the seeder, verify:

- [ ] 10 orders created successfully
- [ ] 2 orders are pending (not accepted)
- [ ] 8 orders have production records
- [ ] Each production has correct number of processes
- [ ] Progress percentages match between Production and OrderTracking
- [ ] Current stages match between Production and OrderTracking
- [ ] Customer orders page shows correct progress bars
- [ ] Production dashboard shows correct stages
- [ ] Filtering by status works correctly
- [ ] Expanding order details shows accurate tracking

## API Endpoints Used

The seeder creates data that works with these endpoints:

**Customer Side:**
- `GET /api/my-orders` - List customer orders
- `GET /api/orders/{id}/tracking` - Get order tracking details

**Admin Side:**
- `GET /api/production-tracking` - List all productions
- `GET /api/production-tracking/dashboard` - Dashboard statistics
- `GET /api/production-tracking/{id}` - Production details

## Database Tables Affected

- `orders` - Order records
- `order_items` - Products in each order
- `order_tracking` - Customer-facing tracking
- `productions` - Production records
- `production_processes` - Individual process steps

## Support

If you encounter issues:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Verify database migrations are up to date
3. Ensure ProductionTrackingService exists
4. Check that all required models are imported

## Summary

This seeder provides a **reliable foundation** for testing your production tracking system with data that accurately reflects real-world scenarios and displays consistently across all pages.

**Key Benefit:** No more confusion between what customers see and what production sees - they're always in sync! 🎯
