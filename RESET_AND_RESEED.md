# Reset and Reseed Database - Fix Production Display Issues

## Problem
- Orders 1 and 2 (pending/not accepted) are showing in production tracking
- Orders 7, 8, 10 (processing) are not showing in production tracking

## Root Cause
Old data in database from previous seeder runs that created Production records for non-accepted orders.

## Solution Applied

### 1. Fixed Controllers ✅
Added filter to only show productions for accepted orders:

**ProductionTrackingController.php:**
```php
->whereHas('order', function($q) {
    $q->where('acceptance_status', 'accepted');
});
```

**ProductionController.php:**
```php
->whereHas('order', function($q) {
    $q->where('acceptance_status', 'accepted');
});
```

### 2. Seeder Already Correct ✅
The `AccurateOrdersSeeder` only creates Production records when `is_accepted` is true.

## How to Fix Your Database

### Option 1: Full Reset (Recommended)

```bash
cd capstone-back

# Clear everything and start fresh
php artisan migrate:fresh

# Seed products
php artisan db:seed --class=ProductsTableSeeder

# Seed orders with accurate tracking
php artisan db:seed --class=AccurateOrdersSeeder
```

### Option 2: Delete Only Orders

```bash
cd capstone-back
php artisan tinker
```

Then in tinker:
```php
// Delete all orders and related data
\App\Models\Order::truncate();
\App\Models\Production::truncate();
\App\Models\OrderTracking::truncate();
\App\Models\OrderItem::truncate();
\App\Models\ProductionProcess::truncate();

// Exit tinker
exit
```

Then reseed:
```bash
php artisan db:seed --class=AccurateOrdersSeeder
```

### Option 3: Delete Only Problematic Productions

```bash
cd capstone-back
php artisan tinker
```

Then in tinker:
```php
// Find productions for non-accepted orders
$badProductions = \App\Models\Production::whereHas('order', function($q) {
    $q->where('acceptance_status', '!=', 'accepted');
})->get();

echo "Found " . $badProductions->count() . " productions for non-accepted orders\n";

// Delete them
foreach ($badProductions as $prod) {
    echo "Deleting production #{$prod->id} for order #{$prod->order_id}\n";
    $prod->delete();
}

exit
```

## Verify the Fix

### Step 1: Check Database
```bash
php artisan tinker
```

```php
// Check orders
$orders = \App\Models\Order::with('production')->get();
foreach ($orders as $order) {
    echo "Order #{$order->id} | Status: {$order->acceptance_status} | Has Production: " . ($order->production ? "YES" : "NO") . "\n";
}

// Should show:
// Order #1 | Status: pending | Has Production: NO
// Order #2 | Status: pending | Has Production: NO
// Order #3 | Status: accepted | Has Production: YES
// ... etc

exit
```

### Step 2: Check Customer Orders Page
1. Login as `customer@gmail.com` / `password`
2. Go to "My Orders"
3. Verify:
   - ✅ Order #1: Status "Pending" (not accepted)
   - ✅ Order #2: Status "Pending" (not accepted)
   - ✅ Order #3-10: Status "Processing" or "Ready for Delivery"

### Step 3: Check Production Tracking Page
1. Login as `admin@gmail.com` / `password`
2. Go to "Production Tracking"
3. Verify:
   - ❌ Order #1 should NOT appear
   - ❌ Order #2 should NOT appear
   - ✅ Order #3-10 should ALL appear

## Expected Results After Fix

### Customer Orders Page
| Order # | Product | Status | Shows in Customer View |
|---------|---------|--------|------------------------|
| 1 | Dining Table | Pending | ✅ YES (awaiting acceptance) |
| 2 | Wooden Chair | Pending | ✅ YES (awaiting acceptance) |
| 3 | Dining Table | Processing | ✅ YES (0% progress) |
| 4 | Wooden Chair | Processing | ✅ YES (15% progress) |
| 5 | Dining Table | Processing | ✅ YES (35% progress) |
| 6 | Wooden Chair | Processing | ✅ YES (55% progress) |
| 7 | Dining Table | Processing | ✅ YES (80% progress) |
| 8 | Wooden Chair | Processing | ✅ YES (95% progress) |
| 9 | Dining Table | Ready | ✅ YES (100% complete) |
| 10 | Alkansya | Processing | ✅ YES (50% progress) |

### Production Tracking Page
| Order # | Product | Shows in Production View |
|---------|---------|--------------------------|
| 1 | Dining Table | ❌ NO (not accepted) |
| 2 | Wooden Chair | ❌ NO (not accepted) |
| 3 | Dining Table | ✅ YES (0% progress) |
| 4 | Wooden Chair | ✅ YES (15% progress) |
| 5 | Dining Table | ✅ YES (35% progress) |
| 6 | Wooden Chair | ✅ YES (55% progress) |
| 7 | Dining Table | ✅ YES (80% progress) |
| 8 | Wooden Chair | ✅ YES (95% progress) |
| 9 | Dining Table | ✅ YES (100% complete) |
| 10 | Alkansya | ✅ YES (50% progress) |

## Why This Happens

### Before Fix
```
Order (pending) → Production created ❌ WRONG
                → Shows in production tracking ❌ WRONG
```

### After Fix
```
Order (pending) → No production created ✅ CORRECT
                → Does NOT show in production tracking ✅ CORRECT

Order (accepted) → Production created ✅ CORRECT
                 → Shows in production tracking ✅ CORRECT
```

## Controller Filter Logic

The controllers now filter productions to only show accepted orders:

```php
Production::with(['order'])
    ->whereHas('order', function($q) {
        $q->where('acceptance_status', 'accepted');
    })
```

This ensures:
- ✅ Only accepted orders appear in production tracking
- ✅ Pending orders stay hidden until accepted
- ✅ Customer can still see their pending orders
- ✅ Admin can accept orders, then they appear in production

## Workflow

```
1. Customer places order
   ↓
2. Order status: "pending"
   ↓
3. Customer sees order in "My Orders" (pending)
   ↓
4. Admin does NOT see it in production yet
   ↓
5. Admin accepts order
   ↓
6. Production record created
   ↓
7. Order status: "processing"
   ↓
8. Admin NOW sees it in production tracking
   ↓
9. Customer sees progress updates
```

## Quick Test Commands

### Check if fix is working:
```bash
cd capstone-back
php artisan tinker
```

```php
// Count productions for non-accepted orders (should be 0)
$count = \App\Models\Production::whereHas('order', function($q) {
    $q->where('acceptance_status', '!=', 'accepted');
})->count();

echo "Productions for non-accepted orders: $count (should be 0)\n";

// Count productions for accepted orders (should be 8)
$count = \App\Models\Production::whereHas('order', function($q) {
    $q->where('acceptance_status', 'accepted');
})->count();

echo "Productions for accepted orders: $count (should be 8)\n";

exit
```

## Summary

✅ **Controllers Fixed** - Added filter to only show accepted orders  
✅ **Seeder Correct** - Only creates productions for accepted orders  
✅ **Database Cleanup** - Use commands above to reset data  
✅ **Verification Steps** - Check both customer and production pages  

**Result:** Orders 1 & 2 will NOT show in production, Orders 3-10 WILL show! 🎯
