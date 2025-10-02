# Quick Testing Guide - Order Status Workflow

## Step 1: Reset Database and Run Seeders

```bash
# Navigate to backend directory
cd capstone-back

# Reset database and run all seeders
php artisan migrate:fresh --seed
```

## Step 2: Verify Seeder Output

You should see output like:
```
=== Creating Accurate Orders with Synchronized Tracking ===

1. Creating PENDING order (just placed, awaiting admin acceptance)
   ✓ Order #1 | Dining Table x1
     Order Status: pending | Acceptance: ⏳ PENDING
     🏭 Production: NOT CREATED (order not accepted)
        Will show in production tracking: NO ❌

3. Creating PROCESSING order (just accepted today, production starting)
   ✓ Order #3 | Dining Table x1
     Order Status: processing | Acceptance: ✅ ACCEPTED
     🏭 Production: #1 CREATED
        Stage: Material Preparation | Progress: 5%
        Status: In Progress | Will show in production tracking: YES ✅
```

## Step 3: Test Customer Orders Page

### Access
- URL: `http://localhost:3000/orders` (or your customer orders route)
- Login as: `customer@gmail.com` / `password`

### Expected Results
✅ **Should see 10 orders total**

**Pending Orders (2):**
- Order #1, #2
- Badge: Yellow "Pending"
- Message: "Your order is pending acceptance by our team"
- ❌ No production tracking visible

**Processing Orders (7):**
- Order #3, #4, #5, #6, #7, #8, #10
- Badge: Blue "Processing"
- Message: "Your order has been accepted and is now in production!"
- ✅ Production tracking visible with progress bars

**Ready for Delivery (1):**
- Order #9
- Badge: Info "Ready for Delivery"
- Progress: 100%

## Step 4: Test Admin Production Page

### Access
- URL: `http://localhost:3000/admin/production` (or your production route)
- Login as: `admin@gmail.com` / `password`

### Expected Results
✅ **Should see 8 productions** (Orders 3-10 only)

**Each production should show:**
- Production ID
- Product name
- Order ID
- Current stage
- Progress percentage (5%, 15%, 35%, 55%, 80%, 95%, 50%, 100%)
- Status: "In Progress" or "Completed"
- At least one process with status "in_progress"

❌ **Should NOT see:**
- Order #1 (pending)
- Order #2 (pending)

## Step 5: Test Admin Orders Page

### Access
- URL: `http://localhost:3000/admin/orders`
- Login as: `admin@gmail.com` / `password`

### Expected Results
✅ **Should see all 10 orders**

**Status Distribution:**
- 2 orders: Status "Pending" (yellow badge)
- 7 orders: Status "Processing" (blue badge)
- 1 order: Status "Ready for Delivery" (info badge)

**Can change status:**
- Click "Change Status" button
- Should see options: Pending, Processing, Ready for Delivery, Delivered, Completed, Cancelled

## Step 6: Test Order Acceptance Page

### Access
- URL: `http://localhost:3000/admin/order-acceptance`
- Login as: `admin@gmail.com` / `password`

### Expected Results
✅ **Should see 2 pending orders** (Orders #1 and #2)

**Test Accepting an Order:**
1. Click "Accept" on Order #1
2. Order should move to "Accepted" tab
3. Production should be created
4. Order status should change to "processing"
5. Go to Production page → should now see new production
6. Go to Customer orders → order should show "accepted and in production"

## Step 7: Test Production Progress Update

### Access Production Page
1. Find a production (e.g., Production #1 from Order #3)
2. Click "Update Stage" or similar button
3. Change stage to next stage (e.g., "Cutting & Shaping")
4. Save changes

### Expected Results
✅ **Production updates:**
- Current stage changes
- Progress percentage increases
- Previous process marked as "completed"
- New process marked as "in_progress"

✅ **Order tracking updates:**
- Customer sees updated stage
- Progress bar reflects new percentage

## Step 8: Test Production Completion

### Mark Production as Complete
1. Go to Production page
2. Find a production
3. Update stage to "Ready for Delivery"
4. Save changes

### Expected Results
✅ **Production:**
- Status: "Completed"
- Progress: 100%
- All processes: "completed"

✅ **Order:**
- Status changes to "ready_for_delivery"
- Customer sees "Order Ready for Delivery" badge

✅ **Tracking:**
- Status: "ready_for_delivery"
- Progress: 100%

## Common Issues and Solutions

### Issue: Productions not showing in production page
**Solution:** 
- Check order `acceptance_status` is 'accepted'
- Verify production records exist in database
- Check ProductionController filters

### Issue: All processes showing as "pending"
**Solution:**
- Re-run seeder: `php artisan db:seed --class=AccurateOrdersSeeder`
- Check production_processes table for `status = 'in_progress'`

### Issue: Progress showing as 0%
**Solution:**
- Seeder now ensures minimum 5% for accepted orders
- Check `overall_progress` in productions table
- Check `progress_percentage` in order_tracking table

### Issue: Customer can't see production tracking
**Solution:**
- Verify order `acceptance_status = 'accepted'`
- Check OrderTracking record exists
- Verify frontend shows tracking only for accepted orders

## Quick Database Queries

### Check Orders
```sql
SELECT id, status, acceptance_status, accepted_at 
FROM orders 
ORDER BY id;
```

### Check Productions
```sql
SELECT p.id, p.order_id, p.product_name, p.current_stage, 
       p.status, p.overall_progress, o.acceptance_status
FROM productions p
JOIN orders o ON p.order_id = o.id
ORDER BY p.id;
```

### Check Production Processes
```sql
SELECT pp.production_id, pp.process_name, pp.status, pp.started_at
FROM production_processes pp
WHERE pp.production_id = 1
ORDER BY pp.process_order;
```

### Check Order Tracking
```sql
SELECT ot.order_id, ot.current_stage, ot.status, 
       ot.progress_percentage, o.acceptance_status
FROM order_tracking ot
JOIN orders o ON ot.order_id = o.id
ORDER BY ot.order_id;
```

## Success Criteria

✅ All 10 orders created
✅ 2 orders pending (no productions)
✅ 8 orders accepted (productions created)
✅ Production page shows 8 productions
✅ Customer orders page shows all 10 orders
✅ Pending orders show "awaiting acceptance"
✅ Accepted orders show production tracking
✅ Progress bars display correctly
✅ Processes have correct status (in_progress/completed/pending)
✅ Order status updates when production completes
✅ Notifications sent at each stage

## Next Steps

1. ✅ Run the seeder
2. ✅ Verify all pages display correctly
3. ✅ Test order acceptance workflow
4. ✅ Test production progress updates
5. ✅ Test order completion flow
6. 🎉 System is ready for use!
