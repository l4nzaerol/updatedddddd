# Complete Order Workflow - From Placement to Delivery

## Overview
This document explains the complete order lifecycle, ensuring proper status flow and progress tracking.

## Order Status Flow

```
Customer Places Order
         ↓
    [PENDING]
    - Order Status: 'pending'
    - Acceptance Status: 'pending'
    - Production: None
    - Tracking: Status = 'pending', Progress = 0%
         ↓
    Admin Reviews Order
         ↓
    Admin Accepts Order
         ↓
    [IN PRODUCTION]
    - Order Status: 'pending' (still pending until ready)
    - Acceptance Status: 'accepted'
    - Production: Created, Status = 'In Progress', Progress = 0%
    - Tracking: Status = 'in_production', Progress = 0%
         ↓
    Production Progresses
         ↓
    Production Completes (100%)
         ↓
    [READY FOR DELIVERY]
    - Order Status: 'ready_for_delivery'
    - Acceptance Status: 'accepted'
    - Production: Status = 'Completed', Progress = 100%
    - Tracking: Status = 'ready_for_delivery', Progress = 100%
         ↓
    Admin Marks as Delivered
         ↓
    [DELIVERED]
    - Order Status: 'delivered'
    - Production: Status = 'Completed'
```

## Key Principles

### 1. **Orders Always Start as Pending**
- When a customer places an order (manual or seeded), it starts with:
  - `status = 'pending'`
  - `acceptance_status = 'pending'`
  - No production record
  - Tracking shows "Waiting for acceptance"

### 2. **Production Starts at 0% After Acceptance**
- When admin accepts an order:
  - Production record is created
  - `overall_progress = 0%`
  - `status = 'In Progress'`
  - `current_stage = 'Material Preparation'` (or 'Design' for Alkansya)
  - Order `acceptance_status` changes to `'accepted'`
  - Order `status` remains `'pending'` (will change when ready for delivery)

### 3. **Order Status vs Acceptance Status**
- **`acceptance_status`**: Whether admin has accepted the order
  - `'pending'` - Waiting for admin review
  - `'accepted'` - Admin approved, production started
  - `'rejected'` - Admin rejected the order
  
- **`status`**: Current fulfillment stage
  - `'pending'` - Not yet ready (includes orders in production)
  - `'ready_for_delivery'` - Production complete, ready to ship
  - `'delivered'` - Order has been delivered
  - `'cancelled'` - Order was cancelled

### 4. **Tracking Status Matches Production State**
- **Before Acceptance**: `status = 'pending'`
- **During Production**: `status = 'in_production'`
- **After Completion**: `status = 'ready_for_delivery'`

## Database States

### State 1: New Order (Not Accepted)
```sql
-- Orders Table
status: 'pending'
acceptance_status: 'pending'
accepted_by: NULL
accepted_at: NULL

-- Productions Table
(No record exists)

-- Order Tracking Table
status: 'pending'
current_stage: 'Material Preparation' (or 'Design')
estimated_start_date: NULL
actual_start_date: NULL
progress_percentage: 0
```

### State 2: Accepted Order (Production Starting)
```sql
-- Orders Table
status: 'pending'
acceptance_status: 'accepted'
accepted_by: 1 (admin user id)
accepted_at: '2025-10-01 10:00:00'

-- Productions Table
status: 'In Progress'
current_stage: 'Material Preparation'
overall_progress: 0
production_started_at: '2025-10-01 10:00:00'
estimated_completion_date: '2025-10-15 10:00:00'

-- Order Tracking Table
status: 'in_production'
current_stage: 'Material Preparation'
estimated_start_date: '2025-10-01 10:00:00'
actual_start_date: '2025-10-01 10:00:00'
progress_percentage: 0
```

### State 3: Production In Progress
```sql
-- Orders Table
status: 'pending' (still pending)
acceptance_status: 'accepted'

-- Productions Table
status: 'In Progress'
current_stage: 'Assembly' (example)
overall_progress: 50

-- Order Tracking Table
status: 'in_production'
current_stage: 'Assembly'
progress_percentage: 50
```

### State 4: Production Complete
```sql
-- Orders Table
status: 'ready_for_delivery'
acceptance_status: 'accepted'

-- Productions Table
status: 'Completed'
current_stage: 'Quality Check & Packaging'
overall_progress: 100
actual_completion_date: '2025-10-14 15:00:00'

-- Order Tracking Table
status: 'ready_for_delivery'
current_stage: 'Quality Check & Packaging'
progress_percentage: 100
actual_completion_date: '2025-10-14 15:00:00'
```

## Seeder Implementation

### Updated CustomerOrdersSeeder.php

The seeder now creates orders that follow the proper workflow:

#### Pending Orders (Not Accepted)
```php
// Order 1-3: PENDING ACCEPTANCE
$this->createOrderWithProgress($customer, $admin, $product, 1, 'pending', 'Material Preparation', 0, 0, false);
```

These orders have:
- `acceptance_status = 'pending'`
- `status = 'pending'`
- No production record
- Tracking status = 'pending'
- Progress = 0%

#### Accepted Orders (In Production)
```php
// Order 4-6: ACCEPTED and IN PRODUCTION
$this->createOrderWithProgress($customer, $admin, $product, 1, 'in_production', 'Assembly', 50, 7, true);
```

These orders have:
- `acceptance_status = 'accepted'`
- `status = 'pending'` (still pending until ready)
- Production created with progress
- Tracking status = 'in_production'
- Progress = actual progress %

#### Completed Orders
```php
// Order 7: COMPLETED
$this->createOrderWithProgress($customer, $admin, $product, 1, 'pending', 'Quality Check & Packaging', 100, 15, true);
```

These orders have:
- `acceptance_status = 'accepted'`
- `status = 'ready_for_delivery'`
- Production status = 'Completed'
- Tracking status = 'ready_for_delivery'
- Progress = 100%

## Order Acceptance Controller

### When Admin Accepts an Order

```php
// 1. Update order acceptance status
$order->update([
    'acceptance_status' => 'accepted',
    'accepted_by' => $admin->id,
    'accepted_at' => now(),
    // status remains 'pending' - will update when production completes
]);

// 2. Create production record
$production = Production::create([
    'order_id' => $order->id,
    'status' => 'In Progress',
    'current_stage' => 'Material Preparation',
    'overall_progress' => 0, // Starts at 0%
    'production_started_at' => now(),
    'estimated_completion_date' => now()->addWeeks(2),
]);

// 3. Create production processes (6 stages)
// All processes start as 'pending', first one becomes 'in_progress'

// 4. Update order tracking
OrderTracking::updateOrCreate([
    'status' => 'in_production', // Changed from 'pending'
    'current_stage' => 'Material Preparation',
    'actual_start_date' => now(),
]);
```

## Manual Order Placement

When a customer places an order manually:

```php
// In OrderController@store
$order = Order::create([
    'user_id' => $customer->id,
    'total_price' => $totalPrice,
    'status' => 'pending', // Always starts as pending
    'acceptance_status' => 'pending', // Needs admin acceptance
    'checkout_date' => now(),
]);

// Create order tracking (but no production yet)
OrderTracking::create([
    'order_id' => $order->id,
    'status' => 'pending', // Waiting for acceptance
    'current_stage' => 'Material Preparation',
    // No dates set until accepted
]);

// Production is NOT created here
// It will be created when admin accepts the order
```

## Orders Page Display

### Before Acceptance
```
Order #123
Status: Pending Acceptance
Badge: Yellow "Pending"
Progress: N/A
Actions: [Accept] [Reject]
```

### After Acceptance (In Production)
```
Order #123
Status: In Production
Badge: Blue "In Production"
Progress: 25%
Current Stage: Cutting & Shaping
Actions: [View Production]
```

### Ready for Delivery
```
Order #123
Status: Ready for Delivery
Badge: Green "Ready"
Progress: 100%
Actions: [Mark as Delivered]
```

## Customer Tracking Page

### Before Acceptance
```
Your Order #123
Status: Pending Acceptance
Message: "Your order is being reviewed by our team"
Timeline: All stages shown as pending
```

### During Production
```
Your Order #123
Status: In Production
Progress: 50%
Current Stage: Assembly
Timeline:
  ✓ Material Preparation (Completed)
  ✓ Cutting & Shaping (Completed)
  → Assembly (In Progress)
  ○ Sanding & Surface Preparation (Pending)
  ○ Finishing (Pending)
  ○ Quality Check & Packaging (Pending)
```

### Ready for Delivery
```
Your Order #123
Status: Ready for Delivery
Progress: 100%
Message: "Your order is ready! We'll contact you for delivery"
Timeline: All stages completed
```

## Testing the Workflow

### Step 1: Refresh Database
```bash
cd capstone-back
php artisan migrate:fresh --seed
```

### Step 2: Verify Initial State
```bash
php test_orders.php
```

Expected output:
- 3 orders with `acceptance_status = 'pending'`
- 4 orders with `acceptance_status = 'accepted'`
- 4 production records (only for accepted orders)
- All pending orders have 0% progress

### Step 3: Test Manual Order
1. Login as customer
2. Place a new order
3. Verify order shows as "Pending Acceptance"
4. Verify no production record exists

### Step 4: Test Order Acceptance
1. Login as admin
2. Go to Orders page
3. Accept a pending order
4. Verify:
   - Order `acceptance_status` changes to 'accepted'
   - Production record is created with 0% progress
   - Tracking status changes to 'in_production'
   - Customer can now see production timeline

### Step 5: Test Production Progress
1. Update production stage
2. Verify tracking updates automatically
3. When production reaches 100%:
   - Order status changes to 'ready_for_delivery'
   - Customer sees "Ready for Delivery" message

## Summary

✅ **All orders start as 'pending'** with `acceptance_status = 'pending'`
✅ **Production starts at 0%** when order is accepted
✅ **Order status remains 'pending'** during production
✅ **Tracking status is 'in_production'** after acceptance
✅ **Order status changes to 'ready_for_delivery'** when production completes
✅ **Seeder creates realistic data** following this workflow
✅ **Manual orders follow the same workflow**

This ensures consistency across all pages: Orders, Production Dashboard, and Customer Tracking.
